import fs from "fs";
import path from "path";
import zlib from "zlib";
import { execSync } from "child_process";

const rootDir = process.cwd();
const iconDir = path.join(rootDir, "icons");
const iconPath = path.join(iconDir, "icon-dark.png");

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Only seed a placeholder when no icon has been committed, so packaging never
// overwrites the real artwork.
if (!fs.existsSync(iconPath)) {
  const placeholderPng =
    "iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVEhLY2AYBaNgFIyCUTAIAAAExAABg+9qCgAAAABJRU5ErkJggg==";
  fs.writeFileSync(iconPath, Buffer.from(placeholderPng, "base64"));
  console.log("No icon found; wrote a placeholder to icons/icon-dark.png.");
}

// manifest.json at the repo root is the single source of truth for plugin
// config. It is copied into the bundle rather than duplicated here.
const manifestPath = path.join(rootDir, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("manifest.json not found at the repository root.");
  process.exit(1);
}
const manifestJson = fs.readFileSync(manifestPath, "utf8");
JSON.parse(manifestJson); // fail early on a malformed manifest

console.log("Building production bundle with Vite...");
execSync("npm run build", { stdio: "inherit" });

// dist/ is the complete, loadable UXP plugin folder: manifest + entry + assets.
// Nothing is written back over the source tree, because index.html at the root
// is Vite's build entry and must keep pointing at src/ui/main.tsx.
const distDir = path.join(rootDir, "dist");
if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("Build did not produce dist/index.html.");
  process.exit(1);
}

fs.mkdirSync(path.join(distDir, "icons"), { recursive: true });
fs.copyFileSync(iconPath, path.join(distDir, "icons", "icon-dark.png"));
fs.writeFileSync(path.join(distDir, "manifest.json"), manifestJson);

/* -------------------------------------------------------------------------- */
/* Minimal ZIP writer                                                          */
/*                                                                             */
/* A .ccx is just a zip. This is written in pure Node rather than shelling out  */
/* because Windows has no `zip` binary, and both Compress-Archive and .NET's    */
/* ZipFile::CreateFromDirectory emit backslash path separators there, which     */
/* violates the ZIP spec (APPNOTE 4.4.17.1) and can make the archive unreadable */
/* to UXP.                                                                     */
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
  const day =
    ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time: time & 0xffff, date: day & 0xffff };
}

function listFiles(dir, prefix = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
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
    local.writeUInt32LE(0x04034b50, 0); // local file header signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(8, 8); // method: deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // extra field length
    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central directory signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(8, 10); // method: deflate
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra field length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number start
    central.writeUInt16LE(0, 36); // internal attributes
    central.writeUInt32LE(0, 38); // external attributes
    central.writeUInt32LE(offset, 42); // local header offset
    centralParts.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  const count = centralParts.length / 2;
  end.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  end.writeUInt16LE(0, 4); // disk number
  end.writeUInt16LE(0, 6); // central directory start disk
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20); // comment length

  fs.writeFileSync(outPath, Buffer.concat([...localParts, centralDir, end]));
  return count;
}

const ccxPath = path.join(rootDir, "BrandGuard.ccx");
if (fs.existsSync(ccxPath)) {
  fs.unlinkSync(ccxPath);
}

console.log("Packaging flat UXP archive into BrandGuard.ccx...");
const fileCount = writeZip(distDir, ccxPath);

console.log(`\nPackaged ${path.relative(rootDir, ccxPath)} (${fileCount} files).`);
console.log("Load dist/ in the UXP Developer Tool to test the unpacked plugin.");
