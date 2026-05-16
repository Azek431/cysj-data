import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) out.push(...walk(full));
    else if (item.isFile() && item.name.endsWith(".md")) out.push(full);
  }

  return out;
}

function shouldDisableSearch(file) {
  const rel = path.relative(root, file).replaceAll("\\", "/");

  return (
    rel.includes("/历史归档/") ||
    rel.endsWith("自动生成文档目录.md") ||
    rel.endsWith("文档内容质量审计报告.md") ||
    rel.includes("AI自动文档建设报告")
  );
}

function addSearchFalse(text) {
  const t = text.replace(/\r\n/g, "\n");

  if (t.startsWith("---\n")) {
    const end = t.indexOf("\n---\n", 4);
    if (end !== -1) {
      const fm = t.slice(0, end + 5);
      const body = t.slice(end + 5);

      if (/^search\s*:/m.test(fm)) return t;

      return fm.replace(/\n---\n$/, "\nsearch: false\n---\n") + body;
    }
  }

  return `---\nsearch: false\n---\n\n${t}`;
}

let changed = 0;

for (const file of walk(docsDir)) {
  if (!shouldDisableSearch(file)) continue;

  const oldText = fs.readFileSync(file, "utf8");
  const newText = addSearchFalse(oldText);

  if (newText !== oldText) {
    fs.writeFileSync(file, newText, "utf8");
    changed += 1;
    console.log(`search:false -> ${path.relative(root, file).replaceAll("\\", "/")}`);
  }
}

console.log(`Result: updated ${changed} file(s).`);
