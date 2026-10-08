const fs = require("fs");
const path = require("path");

const distDir = path.join(process.cwd(), "dist_deploy");
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, ".nojekyll"), "");

const repoName = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split("/")[1]
  : "5k-links-10-8-2026-v2";
const repoPrefix = `/${repoName}/`;

// 1. Copy asset folders
const assetDirs = [
  "__rv",
  "books",
  "data",
  "dist",
  "help",
  "icons",
  "linux",
  "os",
  "reviews",
  "status",
  "wallpapers"
];

for (const dir of assetDirs) {
  if (fs.existsSync(dir)) {
    fs.cpSync(dir, path.join(distDir, dir), { recursive: true });
  }
}

// 2. Copy root files
const rootFiles = ["manifest.webmanifest", "sw.js"];
for (const file of rootFiles) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(distDir, file));
  }
}

// Copy extra .js and .css files to dist_deploy root and dist_deploy/dist/
fs.mkdirSync(path.join(distDir, "dist"), { recursive: true });
for (const item of fs.readdirSync(process.cwd())) {
  if (item.endsWith(".js") || item.endsWith(".css")) {
    fs.copyFileSync(item, path.join(distDir, item));
    fs.copyFileSync(item, path.join(distDir, "dist", item));
  }
}

// 3. Patch hardcoded paths inside all copied JS and JSON bundles
function patchPathsInDir(directory) {
  for (const item of fs.readdirSync(directory)) {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      patchPathsInDir(fullPath);
    } else if (/\.(js|json|css|webmanifest)$/i.test(item)) {
      let content = fs.readFileSync(fullPath, "utf8");
      // Replace hardcoded root references with the repo prefix
      const updated = content
        .replace(/(['"])\/books\//g, `$1${repoPrefix}books/`)
        .replace(/(['"])\/dist\//g, `$1${repoPrefix}dist/`)
        .replace(/(['"])\/icons\//g, `$1${repoPrefix}icons/`)
        .replace(/(['"])\/__rv\//g, `$1${repoPrefix}__rv/`)
        .replace(/(['"])\/status\//g, `$1${repoPrefix}status/`)
        .replace(/(['"])\/sw\.js(['"])/g, `$1${repoPrefix}sw.js$2`);

      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, "utf8");
      }
    }
  }
}

patchPathsInDir(distDir);

// 4. Base HTML setup
if (!fs.existsSync("index.html")) {
  console.error("Error: index.html not found!");
  process.exit(1);
}
let baseHtml = fs.readFileSync("index.html", "utf8");
baseHtml = baseHtml.replace(/(href|src)=["']\/(?!\/)(.*?)["']/gi, `$1="${repoPrefix}$2"`);

if (!baseHtml.includes("<base ")) {
  baseHtml = baseHtml.replace(/<head([^>]*)>/i, `<head$1>\n    <base href="${repoPrefix}">`);
}

// 5. Generate 5,000 unique paths
const TOTAL_PAGES = 5000;
const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

function getRandomSegment(minLen = 4, maxLen = 10) {
  const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
  let segment = "";
  for (let i = 0; i < length; i++) {
    segment += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return segment;
}

function getNestedPath(minSegments = 2, maxSegments = 4) {
  const depth = Math.floor(Math.random() * (maxSegments - minSegments + 1)) + minSegments;
  const segments = [];
  for (let i = 0; i < depth; i++) {
    segments.push(getRandomSegment(4, 10));
  }
  return segments.join("/");
}

const uniquePaths = new Set();
while (uniquePaths.size < TOTAL_PAGES) {
  uniquePaths.add(getNestedPath(2, 4));
}

let masterLinksHtml = "";

for (const nestedPath of uniquePaths) {
  const folderPath = path.join(distDir, nestedPath);
  fs.mkdirSync(folderPath, { recursive: true });

  fs.writeFileSync(path.join(folderPath, "index.html"), baseHtml);
  masterLinksHtml += `<a class="card" href="./${nestedPath}/">${nestedPath}</a>\n`;
}

// 6. Directory Index
const masterIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Directory Index</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      color: #c9d1d9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    header { text-align: center; margin-bottom: 28px; max-width: 650px; width: 100%; }
    h1 { font-size: 28px; font-weight: 700; color: #f0f6fc; margin-bottom: 8px; }
    p { color: #8b949e; font-size: 14px; margin-bottom: 20px; }
    .search-box {
      width: 100%; padding: 12px 18px; border-radius: 8px; border: 1px solid #30363d;
      background: #161b22; color: #f0f6fc; font-size: 15px; outline: none;
    }
    .search-box:focus { border-color: #58a6ff; box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; width: 100%; max-width: 1300px; }
    .card {
      display: flex; align-items: center; justify-content: center; background: #161b22;
      border: 1px solid #30363d; border-radius: 6px; padding: 12px; color: #58a6ff;
      text-decoration: none; font-size: 12px; font-family: monospace; word-break: break-all; text-align: center;
    }
    .card:hover { background: #21262d; border-color: #58a6ff; color: #79c0ff; transform: translateY(-2px); }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <header>
    <h1>Directory Index</h1>
    <p>5,000 Nested Pages</p>
    <input type="text" id="filter" class="search-box" placeholder="Quick find path..." autocomplete="off" />
  </header>
  <main class="grid" id="link-grid">${masterLinksHtml}</main>
  <script>
    const filter = document.getElementById("filter");
    const links = document.querySelectorAll(".card");
    filter.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      links.forEach(card => {
        card.classList.toggle("hidden", !card.textContent.toLowerCase().includes(term));
      });
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, "index.html"), masterIndexHtml);
console.log("Build complete with path patching applied.");
