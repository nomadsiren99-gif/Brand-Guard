import fs from "fs";
import path from "path";
import zlib from "zlib";
import { execSync } from "child_process";

/* -------------------------------------------------------------------------- */
/* Minimal ZIP writer                                                          */
/*                                                                             */
/* A .ccx is just a zip. This is written in pure Node rather than shelling out  */
/* to `zip`, which does not exist on Windows. Compress-Archive and .NET's       */
/* ZipFile::CreateFromDirectory are not usable substitutes either: both emit    */
/* backslash path separators there, which violates the ZIP spec                 */
/* (APPNOTE 4.4.17.1) and can make the archive unreadable to UXP.               */
/* -------------------------------------------------------------------------- */

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function dosDateTime(date) {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time: time & 0xffff, date: day & 0xffff };
}

function listFiles(dir, prefix = "") {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    // Archive paths always use forward slashes, on every platform.
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(abs, rel));
    } else if (entry.isFile()) {
      out.push({ rel, abs });
    }
  }
  return out;
}

function writeZip(sourceDir, outPath) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of listFiles(sourceDir)) {
    const name = Buffer.from(file.rel, "utf8");
    const content = fs.readFileSync(file.abs);
    const compressed = zlib.deflateRawSync(content);
    const crc = crc32(content);
    const { time, date } = dosDateTime(new Date(fs.statSync(file.abs).mtime));

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const count = centralParts.length / 2;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  fs.writeFileSync(outPath, Buffer.concat([...localParts, centralDir, end]));
  return count;
}

const rootDir = process.cwd();
const buildDir = path.join(rootDir, "build");
const psUxpDir = path.join(buildDir, "photoshop-uxp");

// Ensure clean build directories
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(psUxpDir, { recursive: true });

const iconDir = path.join(rootDir, "icons");
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Only seed the 1x1 placeholder when no icon has been committed, so packaging
// never overwrites real artwork.
const iconPath = path.join(iconDir, "icon-dark.png");
if (!fs.existsSync(iconPath)) {
  const iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVEhLY2AYBaNgFIyCUTAIAAAExAABg+9qCgAAAABJRU5ErkJggg==";
  fs.writeFileSync(iconPath, Buffer.from(iconBase64, "base64"));
  console.log("No icon found; wrote a placeholder to icons/icon-dark.png.");
}

console.log("Building production bundle with Vite...");
execSync("npm run build", { stdio: "inherit" });

const distDir = path.join(rootDir, "dist");

// Standard Photoshop UXP manifest object
const manifestObj = {
  id: "com.brandguard.adobe.plugin",
  name: "Brand Guard",
  version: "1.0.0",
  main: "index.html",
  manifestVersion: 5,
  entrypoints: [
    {
      type: "panel",
      id: "brandGuardPanel",
      label: { default: "Brand Guard" },
      minimumSize: { width: 240, height: 320 },
      preferredDockedSize: { width: 300, height: 600 },
      icons: [
        { width: 23, height: 23, path: "icons/icon-dark.png", scale: [1, 2], theme: ["dark", "darkest"] }
      ]
    }
  ],
  host: [
    { app: "PS", minVersion: "23.3.0" }
  ],
  requiredPermissions: {
    network: { domains: "all" },
    clipboard: "readAndWrite",
    localFileSystem: "request"
  }
};

const manifestJson = JSON.stringify(manifestObj, null, 2);

// Copy assets, index.html, icons, and manifest into dedicated build/photoshop-uxp/ folder
fs.cpSync(distDir, psUxpDir, { recursive: true });
fs.writeFileSync(path.join(psUxpDir, "manifest.json"), manifestJson);

const uxpIconsDir = path.join(psUxpDir, "icons");
if (!fs.existsSync(uxpIconsDir)) {
  fs.mkdirSync(uxpIconsDir, { recursive: true });
}
fs.copyFileSync(path.join(iconDir, "icon-dark.png"), path.join(uxpIconsDir, "icon-dark.png"));

// Mirror manifest to root
fs.writeFileSync(path.join(rootDir, "manifest.json"), manifestJson);

// Create CCX package inside build/ folder
const ccxPath = path.join(buildDir, "BrandGuard.ccx");
const rootCcxPath = path.join(rootDir, "BrandGuard.ccx");

console.log("Packaging UXP plugin into build/BrandGuard.ccx...");
const fileCount = writeZip(psUxpDir, ccxPath);
console.log(`Archived ${fileCount} files.`);
fs.copyFileSync(ccxPath, rootCcxPath);

console.log("\nSuccessfully created dedicated output in build/!");
console.log(`- UXP Plugin Folder: ${psUxpDir}`);
console.log(`- Packaged CCX: ${ccxPath}`);
