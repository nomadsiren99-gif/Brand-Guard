import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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

// 1x1 placeholder PNG base64
const iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVEhLY2AYBaNgFIyCUTAIAAAExAABg+9qCgAAAABJRU5ErkJggg==";
fs.writeFileSync(path.join(iconDir, "icon-dark.png"), Buffer.from(iconBase64, "base64"));

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
execSync(`cd "${psUxpDir}" && zip -r "${ccxPath}" manifest.json index.html assets/ icons/`, { stdio: "inherit" });
fs.copyFileSync(ccxPath, rootCcxPath);

console.log("\nSuccessfully created dedicated output in build/!");
console.log(`- UXP Plugin Folder: ${psUxpDir}`);
console.log(`- Packaged CCX: ${ccxPath}`);
