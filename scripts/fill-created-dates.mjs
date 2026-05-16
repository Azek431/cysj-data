import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const docsDir = path.join(root, "docs");
const checkOnly = process.argv.includes("--check");

const skipDirParts = [
  "/.vitepress/",
  "/node_modules/",
  "/.git/",
  "/.vitepress/dist/",
  "/.vitepress/cache/",
  "/.vitepress/.temp/",
];

const skipFiles = new Set([
  "docs/总索引与导航/自动生成文档目录.md",
]);

function normalize(file) {
  return file.replaceAll("\\", "/");
}

function shouldSkip(file) {
  const rel = normalize(path.relative(root, file));

  if (skipFiles.has(rel)) return true;

  return skipDirParts.some((part) => normalize(file).includes(part));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      out.push(...walk(full));
    } else if (item.isFile() && item.name.endsWith(".md")) {
      out.push(full);
    }
  }

  return out;
}

function splitFrontmatter(text) {
  const t = text.replace(/\r\n/g, "\n");

  if (!t.startsWith("---\n")) {
    return {
      frontmatter: "",
      body: t,
      hasFrontmatter: false,
    };
  }

  const end = t.indexOf("\n---\n", 4);

  if (end === -1) {
    return {
      frontmatter: "",
      body: t,
      hasFrontmatter: false,
    };
  }

  return {
    frontmatter: t.slice(0, end + 5),
    body: t.slice(end + 5),
    hasFrontmatter: true,
  };
}

function hasKey(frontmatter, key) {
  return new RegExp(`^${key}\\s*:`, "m").test(frontmatter);
}

function getGitCreatedDate(file) {
  try {
    const output = execFileSync(
      "git",
      ["log", "--follow", "--format=%ad", "--date=short", "--", file],
      {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    )
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);

    if (output.length > 0) {
      return output[output.length - 1];
    }
  } catch {
    // ignore
  }

  return "";
}

function getFileFallbackDate(file) {
  const stat = fs.statSync(file);

  const candidates = [
    stat.birthtime,
    stat.ctime,
    stat.mtime,
  ].filter((date) => date instanceof Date && !Number.isNaN(date.getTime()));

  const date = candidates[0] || new Date();

  return date.toISOString().slice(0, 10);
}

function insertCreated(frontmatter, date) {
  const lines = frontmatter.replace(/\r\n/g, "\n").split("\n");

  // 去掉最后的 --- 空行结构，方便插入
  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");

  if (endIndex === -1) return frontmatter;

  const titleIndex = lines.findIndex((line) => /^title\s*:/.test(line));
  const descriptionIndex = lines.findIndex((line) => /^description\s*:/.test(line));

  const insertIndex =
    descriptionIndex !== -1
      ? descriptionIndex + 1
      : titleIndex !== -1
        ? titleIndex + 1
        : 1;

  lines.splice(insertIndex, 0, `created: ${date}`);

  return lines.join("\n");
}

function addFrontmatter(text, date) {
  return `---\ncreated: ${date}\n---\n\n${text}`;
}

let changed = 0;
let skipped = 0;

for (const file of walk(docsDir)) {
  if (shouldSkip(file)) continue;

  const rel = normalize(path.relative(root, file));
  const oldText = fs.readFileSync(file, "utf8");
  const { frontmatter, body, hasFrontmatter } = splitFrontmatter(oldText);

  if (hasFrontmatter && (hasKey(frontmatter, "created") || hasKey(frontmatter, "date"))) {
    skipped += 1;
    continue;
  }

  const gitDate = getGitCreatedDate(file);
  const date = gitDate || getFileFallbackDate(file);
  const source = gitDate ? "git" : "file";

  let newText = "";

  if (hasFrontmatter) {
    newText = insertCreated(frontmatter, date) + body;
  } else {
    newText = addFrontmatter(oldText, date);
  }

  changed += 1;
  console.log(`${checkOnly ? "would add" : "added"} created: ${date} (${source}) -> ${rel}`);

  if (!checkOnly) {
    fs.writeFileSync(file, newText, "utf8");
  }
}

console.log("");
console.log(
  checkOnly
    ? `Result: would update ${changed} file(s), skipped ${skipped} file(s).`
    : `Result: updated ${changed} file(s), skipped ${skipped} file(s).`
);
