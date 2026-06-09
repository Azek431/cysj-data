import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsRoot = path.join(root, "docs");

const skipDirParts = [
  "/.vitepress/",
  "/public/",
  "/node_modules/",
  "/.git/",
];

const dryRun = process.argv.includes("--dry-run");
const changed = [];

function normalizePath(file) {
  return file.replaceAll("\\", "/");
}

function rel(file) {
  return normalizePath(path.relative(root, file));
}

function shouldSkip(file) {
  return skipDirParts.some((part) => normalizePath(file).includes(part));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      walk(full, out);
      continue;
    }

    if (item.isFile() && item.name.endsWith(".md")) {
      out.push(full);
    }
  }

  return out;
}

function safeFix(text) {
  let next = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  next = next.replace(/[ \t]+$/gm, "");
  next = next.replace(/\n{4,}/g, "\n\n\n");

  next = next.replace(/Azek 创游世界文档/g, "Azek创游世界文档");

  next = next.replace(/^([^\n|#>-][^|\n]{0,24})\s+([^\n|]{2,24})$/gm, (match, a, b) => {
    const knownPairs = new Set([
      "用户类型 适合用途",
      "场景 推荐操作",
      "类型 说明",
      "模块 作用",
      "字段 说明",
    ]);

    const key = `${a.trim()} ${b.trim()}`;

    if (!knownPairs.has(key)) return match;

    return `| ${a.trim()} | ${b.trim()} |\n| --- | --- |`;
  });

  if (!next.endsWith("\n")) next += "\n";

  return next;
}

for (const file of walk(docsRoot).filter((item) => !shouldSkip(item))) {
  const before = fs.readFileSync(file, "utf8");
  const after = safeFix(before);

  if (before !== after) {
    changed.push(rel(file));

    if (!dryRun) {
      fs.writeFileSync(file, after, "utf8");
    }
  }
}

if (changed.length === 0) {
  console.log("No safe style changes found.");
} else {
  console.log(dryRun ? "Safe style changes preview:" : "Safe style changes applied:");

  for (const file of changed) {
    console.log(`- ${file}`);
  }
}
