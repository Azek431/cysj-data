import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs");
const checkOnly = process.argv.includes("--check");

const footerLinePatterns = [
  /^\s*>?\s*[-*]?\s*\*{0,2}\s*最后更新\s*[:：]\s*.*?\s*\*{0,2}\s*$/i,
  /^\s*>?\s*[-*]?\s*\*{0,2}\s*更新时间\s*[:：]\s*.*?\s*\*{0,2}\s*$/i,
  /^\s*>?\s*[-*]?\s*\*{0,2}\s*更新日期\s*[:：]\s*.*?\s*\*{0,2}\s*$/i,
  /^\s*>?\s*[-*]?\s*\*{0,2}\s*文档更新\s*[:：]\s*.*?\s*\*{0,2}\s*$/i,
  /^\s*>?\s*[-*]?\s*\*{0,2}\s*维护者\s*[:：]\s*.*?\s*\*{0,2}\s*$/i,
  /^\s*>?\s*[-*]?\s*\*{0,2}\s*维护人\s*[:：]\s*.*?\s*\*{0,2}\s*$/i,
  /^\s*>?\s*[-*]?\s*\*{0,2}\s*编辑者\s*[:：]\s*.*?\s*\*{0,2}\s*$/i,
  /^\s*>?\s*[-*]?\s*\*{0,2}\s*作者\s*[:：]\s*Azek431\s*\*{0,2}\s*$/i,
];

const shouldSkipDir = (dir) => {
  const normalized = dir.replaceAll("\\", "/");
  return (
    normalized.includes("/.git") ||
    normalized.includes("/node_modules") ||
    normalized.includes("/.vitepress/dist") ||
    normalized.includes("/.vitepress/cache") ||
    normalized.includes("/.vitepress/.temp")
  );
};

const walk = (dir) => {
  if (!fs.existsSync(dir) || shouldSkipDir(dir)) return [];

  const files = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...walk(full));
    } else if (item.isFile() && item.name.endsWith(".md")) {
      files.push(full);
    }
  }

  return files;
};

const splitFrontmatter = (text) => {
  const normalized = text.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return { frontmatter: "", body: normalized };
  }

  const end = normalized.indexOf("\n---\n", 4);

  if (end === -1) {
    return { frontmatter: "", body: normalized };
  }

  return {
    frontmatter: normalized.slice(0, end + 5),
    body: normalized.slice(end + 5),
  };
};

const isFooterLine = (line) => {
  return footerLinePatterns.some((pattern) => pattern.test(line));
};

const cleanBody = (body) => {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const removed = [];

  let i = lines.length - 1;

  while (i >= 0 && lines[i].trim() === "") i--;

  let changed = false;

  while (i >= 0) {
    const line = lines[i];

    if (line.trim() === "") {
      i--;
      continue;
    }

    if (isFooterLine(line)) {
      removed.push(line.trim());
      lines.splice(i, 1);
      changed = true;
      i--;
      continue;
    }

    // 如果脚注前面单独有一条分割线，也一并删除
    if (changed && /^-{3,}\s*$/.test(line.trim())) {
      lines.splice(i, 1);
      i--;
      continue;
    }

    break;
  }

  return {
    body: lines.join("\n").replace(/\n{3,}$/g, "\n\n"),
    removed: removed.reverse(),
  };
};

let changedFiles = 0;
let removedLines = 0;

for (const file of walk(docsDir)) {
  const oldText = fs.readFileSync(file, "utf8");
  const { frontmatter, body } = splitFrontmatter(oldText);
  const result = cleanBody(body);

  if (result.removed.length === 0) continue;

  const rel = path.relative(root, file).replaceAll("\\", "/");

  console.log(`\n${checkOnly ? "found" : "cleaned"}: ${rel}`);

  for (const line of result.removed) {
    console.log(`  - ${line}`);
  }

  changedFiles += 1;
  removedLines += result.removed.length;

  if (!checkOnly) {
    fs.writeFileSync(file, frontmatter + result.body, "utf8");
  }
}

console.log("");
console.log(
  checkOnly
    ? `Result: found ${removedLines} footer line(s) in ${changedFiles} file(s).`
    : `Result: removed ${removedLines} footer line(s) from ${changedFiles} file(s).`
);
