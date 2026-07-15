import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const version = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version;
const output = path.join(root, "desktop", "build");
const resources = path.join(root, "desktop", "build-resources");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await mkdir(resources, { recursive: true });
for (const file of ["index.html", "app.css", "app.js"]) {
  await cp(path.join(root, "mobile", "assets", file), path.join(output, file));
}
await writeFile(
  path.join(output, "runtime-config.js"),
  `window.CLINICNOVA_MOBILE_CONFIG = Object.freeze(${JSON.stringify({ mode: "production", serverUrl: "", appVersion: version, platform: "desktop", platformLabel: "Masaüstü" })});\n`,
  "utf8"
);
await sharp(path.join(root, "src", "app", "icon.svg")).resize(1024, 1024).png().toFile(path.join(resources, "icon.png"));
console.log(output);
