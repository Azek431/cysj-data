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

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function getGitDates(file) {
  const isoList = runGit(["log", "--follow", "--format=%aI", "--", file])
    .split(/\r?\n/)
    .filter(Boolean);

  if (isoList.length === 0) return null;

  return {
    createdAt: isoList[isoList.length - 1],
    updatedAt: isoList[0],
  };
}

function isDirty(file) {
  const rel = normalize(path.relative(root, file));
  const output = runGit(["status", "--porcelain", "--", rel]);
  return output.trim().length > 0;
}

function fileTimeFallback(file) {
  const stat = fs.statSync(file);
  const createdAt = stat.birthtime?.toISOString?.() || stat.ctime.toISOString();
  const updatedAt = stat.mtime?.toISOString?.() || stat.ctime.toISOString();

  return {
    createdAt,
    updatedAt,
  };
}

function toDate(iso) {
  return iso.slice(0, 10);
}

function splitFrontmatter(text) {
  const t = text.replace(/\r\n/g, "\n");

  if (!t.startsWith("---\n")) {
    return {
      hasFrontmatter: false,
      frontmatter: "",
      body: t,
    };
  }

  const end = t.indexOf("\n---\n", 4);

  if (end === -1) {
    return {
      hasFrontmatter: false,
      frontmatter: "",
      body: t,
    };
  }

  return {
    hasFrontmatter: true,
    frontmatter: t.slice(0, end + 5),
    body: t.slice(end + 5),
  };
}

function hasKey(fm, key) {
  return new RegExp(`^${key}\\s*:`, "m").test(fm);
}

function setKey(fm, key, value) {
  const re = new RegExp(`^${key}\\s*:.*$`, "m");

  if (re.test(fm)) {
    return fm.replace(re, `${key}: ${value}`);
  }

  const lines = fm.split("\n");
  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");

  if (endIndex === -1) return fm;

  // 尽量放在 title / description 后面，更整齐
  const preferredKeys = ["description", "title"];
  let insertIndex = 1;

  for (const preferredKey of preferredKeys) {
    const idx = lines.findIndex((line) => new RegExp(`^${preferredKey}\\s*:`).test(line));
    if (idx !== -1) {
      insertIndex = idx + 1;
      break;
    }
  }

  lines.splice(insertIndex, 0, `${key}: ${value}`);

  return lines.join("\n");
}

function upsertDates(text, dates) {
  const { hasFrontmatter, frontmatter, body } = splitFrontmatter(text);

  const created = toDate(dates.createdAt);
  const updated = toDate(dates.updatedAt);

  if (!hasFrontmatter) {
    return `---\ncreated: ${created}\ncreatedAt: ${dates.createdAt}\nupdated: ${updated}\nupdatedAt: ${dates.updatedAt}\n---\n\n${text}`;
  }

  let fm = frontmatter;

  // created / createdAt：只补缺，不覆盖已有真实写作日期
  if (!hasKey(fm, "created") && !hasKey(fm, "date")) {
    fm = setKey(fm, "created", created);
  }

  if (!hasKey(fm, "createdAt")) {
    fm = setKey(fm, "createdAt", dates.createdAt);
  }

  // updated / updatedAt：允许自动刷新
  fm = setKey(fm, "updated", updated);
  fm = setKey(fm, "updatedAt", dates.updatedAt);

  return fm + body;
}

let changed = 0;
let checked = 0;

for (const file of walk(docsDir)) {
  if (shouldSkip(file)) continue;

  checked += 1;

  const rel = normalize(path.relative(root, file));
  const oldText = fs.readFileSync(file, "utf8");

  const gitDates = getGitDates(file);
  const fallbackDates = fileTimeFallback(file);

  let dates = gitDates || fallbackDates;

  if (isDirty(file)) {
    dates = {
      createdAt: dates.createdAt,
      updatedAt: new Date().toISOString(),
    };
  }

  const newText = upsertDates(oldText, dates);

  if (newText !== oldText) {
    changed += 1;
    console.log(`${checkOnly ? "would sync" : "synced"} dates -> ${rel}`);
    console.log(`  created: ${toDate(dates.createdAt)} / ${dates.createdAt}`);
    console.log(`  updated: ${toDate(dates.updatedAt)} / ${dates.updatedAt}`);

    if (!checkOnly) {
      fs.writeFileSync(file, newText, "utf8");
    }
  }
}

console.log("");
console.log(
  checkOnly
    ? `Result: would update ${changed} file(s), checked ${checked} file(s).`
    : `Result: updated ${changed} file(s), checked ${checked} file(s).`
);
