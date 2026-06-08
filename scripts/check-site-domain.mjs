import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const newDomain = "https://cysjdocs.azek431.top";
const oldDomains = [
  "https://cysjdocs.dpdns.org",
  "http://cysjdocs.dpdns.org",
  "cysjdocs.dpdns.org",
  "https://cysjdocs.pages.dev",
  "http://cysjdocs.pages.dev",
  "cysjdocs.pages.dev",
];

const exts = new Set([
  ".md", ".mdx", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts",
  ".json", ".yml", ".yaml", ".html", ".txt", ".css", ".vue",
]);

const skipDirs = new Set([".git", "node_modules", "dist", ".vite", ".cache", ".astro"]);
const errors = [];

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function walk(dir, out = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (skipDirs.has(item.name)) continue;
      if (rel(full) === "docs/.vitepress/dist") continue;
      walk(full, out);
      continue;
    }

    if (exts.has(path.extname(item.name).toLowerCase())) {
      out.push(full);
    }
  }

  return out;
}

for (const file of walk(root)) {
  const r = rel(file);
  if (r === "scripts/check-site-domain.mjs") continue;

  const text = fs.readFileSync(file, "utf8");

  for (const oldDomain of oldDomains) {
    if (text.includes(oldDomain)) {
      errors.push(`${r}: found old domain ${oldDomain}`);
    }
  }
}

for (const file of ["README.md", "docs/public/robots.txt"]) {
  const full = path.join(root, file);
  if (fs.existsSync(full) && !fs.readFileSync(full, "utf8").includes(newDomain)) {
    errors.push(`${file}: missing ${newDomain}`);
  }
}

if (fs.existsSync(path.join(root, "docs/.vitepress/theme/custom.css"))) {
  errors.push("docs/.vitepress/theme/custom.css is forbidden");
}

const themeIndex = path.join(root, "docs/.vitepress/theme/index.ts");
if (fs.existsSync(themeIndex) && fs.readFileSync(themeIndex, "utf8").includes("./custom.css")) {
  errors.push("docs/.vitepress/theme/index.ts imports forbidden custom.css");
}

if (errors.length) {
  console.error("\nSite domain check failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Site domain check passed");
