import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const removableNamePatterns = [
  /sync-conflict/i,
  /^\.syncthing.*\.tmp$/i,
  /\.part$/i,
  /^Thumbs\.db$/i,
  /^desktop\.ini$/i,
  /^\.DS_Store$/i,
];

const removableDirs = new Set([
  ".stversions",
  ".Trash-1000",
  ".Trash-0",
]);

const skipDirs = new Set([
  ".git",
  "node_modules",
  "docs/.vitepress/dist",
]);

const dryRun = process.argv.includes("--dry-run");
const removed = [];

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function shouldSkip(dir) {
  const relative = rel(dir);
  return [...skipDirs].some((skip) => relative === skip || relative.startsWith(`${skip}/`));
}

function walk(dir) {
  if (!fs.existsSync(dir) || shouldSkip(dir)) return;

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    const relative = rel(full);

    if (item.isDirectory()) {
      if (removableDirs.has(item.name)) {
        removed.push(relative);
        if (!dryRun) fs.rmSync(full, { recursive: true, force: true });
        continue;
      }

      walk(full);
      continue;
    }

    if (removableNamePatterns.some((pattern) => pattern.test(item.name))) {
      removed.push(relative);
      if (!dryRun) fs.rmSync(full, { force: true });
    }
  }
}

walk(root);

if (removed.length === 0) {
  console.log("No temporary sync files found.");
} else {
  console.log(dryRun ? "Temporary sync files found:" : "Temporary sync files removed:");
  for (const file of removed) console.log(`- ${file}`);
}
