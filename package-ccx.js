import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const iconDir = path.join(rootDir, "icons");
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// 1x1 placeholder PNG base64
const iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVEhLY2AYBaNgFIyCUTAIAAAExAABg+9qCgAAAABJRU5ErkJggg==";
fs.writeFileSync(path.join(iconDir, "icon-dark.png"), Buffer.from(iconBase64, "base64"));

console.log("Building production bundle with Vite...");
execSync("npm run build", { stdio: "inherit" });

const distDir = path.join(rootDir, "dist");
const distDistDir = path.join(distDir, "dist");

// Standard manifest object for UXP
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
    { app: "PS", minVersion: "23.3.0" },
    { app: "AI", minVersion: "28.0.0" }
  ],
  requiredPermissions: {
    network: { domains: "all" },
    clipboard: "readAndWrite",
    localFileSystem: "request"
  }
};

const manifestJson = JSON.stringify(manifestObj, null, 2);

// Copy icons into dist and dist/dist
function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

ensureDir(distDir);
ensureDir(path.join(distDir, "icons"));
ensureDir(distDistDir);
ensureDir(path.join(distDistDir, "icons"));
ensureDir(path.join(distDistDir, "assets"));

// Copy icon
fs.copyFileSync(path.join(iconDir, "icon-dark.png"), path.join(distDir, "icons", "icon-dark.png"));
fs.copyFileSync(path.join(iconDir, "icon-dark.png"), path.join(distDistDir, "icons", "icon-dark.png"));

// Copy manifest to root, dist, and dist/dist
fs.writeFileSync(path.join(rootDir, "manifest.json"), manifestJson);
fs.writeFileSync(path.join(distDir, "manifest.json"), manifestJson);
fs.writeFileSync(path.join(distDistDir, "manifest.json"), manifestJson);

// Copy index.html to root, dist, and dist/dist
fs.copyFileSync(path.join(distDir, "index.html"), path.join(rootDir, "index.html"));
fs.copyFileSync(path.join(distDir, "index.html"), path.join(distDistDir, "index.html"));

// Copy assets to root and dist/dist
const rootAssetsDir = path.join(rootDir, "assets");
if (fs.existsSync(rootAssetsDir)) fs.rmSync(rootAssetsDir, { recursive: true, force: true });
fs.cpSync(path.join(distDir, "assets"), rootAssetsDir, { recursive: true });
fs.cpSync(path.join(distDir, "assets"), path.join(distDistDir, "assets"), { recursive: true });

// Create CCX package
const ccxPath = path.join(rootDir, "BrandGuard.ccx");
if (fs.existsSync(ccxPath)) {
  fs.unlinkSync(ccxPath);
}

console.log("Packaging flat UXP archive into BrandGuard.ccx...");
execSync(`cd "${distDir}" && zip -r "${ccxPath}" manifest.json index.html assets/ icons/`, { stdio: "inherit" });

console.log("\nSuccessfully populated manifest.json at root, dist/, and dist/dist/!");
