import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs");

const shouldSkipDir = (dir) => {
  const normalized = dir.replaceAll("\\", "/");
  return (
    normalized.includes("/node_modules") ||
    normalized.includes("/.git") ||
    normalized.includes("/.vitepress/dist") ||
    normalized.includes("/.vitepress/cache") ||
    normalized.includes("/.vitepress/.temp")
  );
};

const walk = (dir) => {
  if (!fs.existsSync(dir) || shouldSkipDir(dir)) return [];

  const result = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      result.push(...walk(full));
      continue;
    }

    if (item.isFile() && item.name.endsWith(".md")) {
      result.push(full);
    }
  }

  return result;
};

const isInternalUrl = (url) => {
  return (
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../")
  );
};

const fixUrl = (url) => {
  // 跳过带标题的复杂写法，例如: [x](/a/b "title")
  // 当前项目主要需要修复 VitePress 站内链接，所以复杂链接先不动，避免误伤。
  if (url.includes('"') || url.includes("'")) return url;

  if (!isInternalUrl(url)) return url;

  if (!url.includes(" ")) return url;

  return url.replaceAll(" ", "%20");
};

let changedFiles = 0;
let changedLinks = 0;

const files = walk(docsDir);

for (const file of files) {
  const oldText = fs.readFileSync(file, "utf8");

  let fileChangedLinks = 0;

  const newText = oldText.replace(
    /(!?\[[^\]\n]*\]\()([^)\n]+)(\))/g,
    (match, prefix, url, suffix) => {
      const fixed = fixUrl(url);

      if (fixed !== url) {
        fileChangedLinks += 1;
        changedLinks += 1;
      }

      return `${prefix}${fixed}${suffix}`;
    }
  );

  if (newText !== oldText) {
    fs.writeFileSync(file, newText, "utf8");
    changedFiles += 1;
    console.log(`fixed ${fileChangedLinks} link(s): ${path.relative(root, file)}`);
  }
}

console.log("");
console.log(`Result: fixed ${changedLinks} link(s) in ${changedFiles} file(s).`);
