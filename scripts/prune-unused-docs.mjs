import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const docsRoot = path.join(root, "docs");

const apply = process.argv.includes("--apply");
const aggressive = process.argv.includes("--aggressive");

const reportPath = path.join(root, "docs/维护与报告/无用与废弃文档清理报告.md");
const manifestPath = path.join(root, "docs/维护与报告/无用与废弃文档清理清单.json");

const protectedFiles = new Set([
  "docs/index.md",
  "docs/关于.md",
  "docs/总索引与导航/创游世界知识库总导航.md",
  "docs/总索引与导航/新手阅读路线.md",
  "docs/总索引与导航/快速入门索引.md",
  "docs/总索引与导航/按问题查资料.md",
  "docs/总索引与导航/自动生成文档目录.md",
  "docs/维护与报告/维护与报告导航.md",
  "docs/维护与报告/无用与废弃文档清理报告.md",
]);

const protectedPathHints = [
  "/OCR资料/",
  "/官方",
  "/原始",
  "/截图",
  "/证据",
];

const ignoredPathParts = [
  "/.vitepress/",
  "/public/",
  "/node_modules/",
  "/.git/",
];

const tempNameRe = /(sync-conflict|冲突|conflict|副本|copy|backup|bak|tmp|temp|临时|测试文件|test|old|obsolete|deprecated|废弃|过期|草稿|draft)/i;
const deprecatedTextRe = /(status:\s*(deprecated|obsolete|废弃|过期|archived|archive)|废弃|已废弃|不再维护|过期内容|旧版内容|历史遗留|临时内容|测试内容)/i;

function normalizePath(file) {
  return file.replaceAll("\\", "/");
}

function rel(file) {
  return normalizePath(path.relative(root, file));
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function readSafe(file) {
  const full = path.join(root, file);

  if (!fs.existsSync(full)) return "";

  return fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function writeSafe(file, text) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd() + "\n", "utf8");
}

function shouldIgnore(file) {
  const r = normalizePath(file);
  return ignoredPathParts.some((part) => r.includes(part));
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      walk(full, output);
      continue;
    }

    if (item.isFile() && item.name.endsWith(".md") && !shouldIgnore(full)) {
      output.push(full);
    }
  }

  return output;
}

function normalizeDocText(text) {
  return text
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, "")
    .replace(/[，。；：、,.!?！？（）()【】\[\]《》"'`~*_#>\-|]/g, "")
    .trim();
}

function sha1(text) {
  return crypto.createHash("sha1").update(text).digest("hex");
}

function stripFrontmatter(text) {
  return text.replace(/^---[\s\S]*?---\s*/m, "");
}

function getTitle(text) {
  const fmTitle = text.match(/^---[\s\S]*?\ntitle:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/m);
  if (fmTitle) return fmTitle[1].trim();

  const h1 = text.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();

  return "";
}

function pageKeys(relativeFile) {
  const noDocs = relativeFile.replace(/^docs\//, "");
  const noExt = noDocs.replace(/\.md$/, "");
  const clean = noExt.replace(/(^|\/)index$/, "$1").replace(/\/$/, "");

  const keys = new Set();

  keys.add(relativeFile);
  keys.add(noDocs);
  keys.add(noExt);
  keys.add(clean);
  keys.add(`/${clean}`);
  keys.add(`/${clean}.html`);
  keys.add(`/${noExt}`);
  keys.add(`/${noExt}.html`);

  if (clean === "") {
    keys.add("/");
    keys.add("/index");
    keys.add("/index.html");
  }

  return [...keys].filter(Boolean);
}

function resolveMarkdownLink(fromFile, rawLink) {
  if (!rawLink) return null;

  const link = rawLink
    .split("#")[0]
    .split("?")[0]
    .trim()
    .replace(/%20/g, " ");

  if (!link) return null;
  if (/^(https?:|mailto:|tel:|#)/i.test(link)) return null;
  if (link.startsWith("/assets/") || link.startsWith("/logo") || link.startsWith("/favicon")) return null;

  let candidate;

  if (link.startsWith("/")) {
    candidate = path.join(docsRoot, decodeURIComponent(link));
  } else {
    candidate = path.resolve(path.dirname(fromFile), decodeURIComponent(link));
  }

  const candidates = [
    candidate,
    `${candidate}.md`,
    path.join(candidate, "index.md"),
  ];

  for (const item of candidates) {
    const relative = rel(item);

    if (relative.startsWith("docs/") && exists(relative)) {
      return relative;
    }
  }

  return null;
}

function collectLinksFromMarkdown(file, text) {
  const links = new Set();
  const linkRe = /!?\[[^\]]*?\]\(([^)]+)\)/g;

  for (const match of text.matchAll(linkRe)) {
    const resolved = resolveMarkdownLink(file, match[1]);

    if (resolved) links.add(resolved);
  }

  return links;
}

function collectLinksFromSourceLike(file, text, allFilesByKey) {
  const links = new Set();
  const stringRe = /['"`]([^'"`]+)['"`]/g;

  for (const match of text.matchAll(stringRe)) {
    const raw = match[1];
    if (!raw.startsWith("/")) continue;

    const key = raw.replace(/^\//, "").replace(/\.html$/, "");
    const hit = allFilesByKey.get(key) || allFilesByKey.get(`/${key}`);

    if (hit) links.add(hit);
  }

  return links;
}

function isProtected(relativeFile) {
  if (protectedFiles.has(relativeFile)) return true;
  return protectedPathHints.some((hint) => relativeFile.includes(hint));
}

function reasonText(reasons) {
  return reasons.length ? reasons.join("；") : "未命中清理规则";
}

const files = walk(docsRoot).map(rel).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
const allFilesByKey = new Map();

for (const file of files) {
  for (const key of pageKeys(file)) {
    allFilesByKey.set(key.replace(/^docs\//, ""), file);
    allFilesByKey.set(key, file);
  }
}

const referenced = new Set();
const linkSources = new Map();

function addRef(target, source) {
  referenced.add(target);
  if (!linkSources.has(target)) linkSources.set(target, new Set());
  linkSources.get(target).add(source);
}

for (const file of files) {
  const full = path.join(root, file);
  const text = readSafe(file);
  const links = collectLinksFromMarkdown(full, text);

  for (const target of links) {
    addRef(target, file);
  }
}

for (const sourceFile of [
  "docs/.vitepress/config.mts",
  "docs/.vitepress/sidebar.generated.ts",
  "docs/index.md",
  "README.md",
]) {
  if (!exists(sourceFile)) continue;

  const text = readSafe(sourceFile);
  const links = collectLinksFromSourceLike(sourceFile, text, allFilesByKey);

  for (const target of links) {
    addRef(target, sourceFile);
  }
}

for (const file of protectedFiles) {
  if (exists(file)) addRef(file, "protected-entry");
}

const hashMap = new Map();

for (const file of files) {
  const text = readSafe(file);
  const normalized = normalizeDocText(text);

  if (normalized.length < 60) continue;

  const h = sha1(normalized);

  if (!hashMap.has(h)) hashMap.set(h, []);
  hashMap.get(h).push(file);
}

const duplicateDelete = new Set();
const duplicateKeep = new Map();

for (const group of hashMap.values()) {
  if (group.length <= 1) continue;

  const sorted = group.slice().sort((a, b) => {
    const score = (file) => {
      let n = 0;
      if (isProtected(file)) n += 100;
      if (referenced.has(file)) n += 50;
      if (/导航|索引|README|关于/.test(file)) n += 20;
      if (/OCR|证据|官方|原始/.test(file)) n += 15;
      n -= file.length / 1000;
      return n;
    };

    return score(b) - score(a);
  });

  const keep = sorted[0];

  for (const item of sorted.slice(1)) {
    if (!isProtected(item)) {
      duplicateDelete.add(item);
      duplicateKeep.set(item, keep);
    }
  }
}

const candidates = [];

for (const file of files) {
  const text = readSafe(file);
  const body = stripFrontmatter(text).trim();
  const title = getTitle(text);
  const reasons = [];
  const warnings = [];
  let level = "REVIEW";
  let action = "保留观察";

  const nameRisk = tempNameRe.test(file);
  const textDeprecated = deprecatedTextRe.test(text);
  const emptyLike = body.length < 40;
  const isDup = duplicateDelete.has(file);
  const isRef = referenced.has(file);
  const protectedDoc = isProtected(file);
  const sourceCount = linkSources.get(file)?.size ?? 0;

  if (emptyLike) reasons.push("正文接近空文件");
  if (nameRisk) reasons.push("文件名疑似临时/备份/废弃/冲突文件");
  if (textDeprecated) reasons.push("正文或 frontmatter 明确出现废弃/过期/归档/草稿信号");
  if (isDup) reasons.push(`与 ${duplicateKeep.get(file)} 内容完全重复`);
  if (!isRef) reasons.push("未被 Markdown / 配置 / 自动侧边栏字符串引用");

  if (protectedDoc) {
    warnings.push("受保护目录或入口文件，不自动删除");
  }

  if (isDup && !protectedDoc) {
    level = "DELETE";
    action = "删除重复副本";
  } else if (emptyLike && !protectedDoc && !isRef) {
    level = "DELETE";
    action = "删除空壳文档";
  } else if (nameRisk && !protectedDoc && !isRef) {
    level = "DELETE";
    action = "删除临时/备份/冲突文档";
  } else if (textDeprecated && !protectedDoc && !isRef) {
    level = "DELETE";
    action = "删除明确废弃且未引用文档";
  } else if (aggressive && !protectedDoc && !isRef && !/维护与报告|OCR资料/.test(file)) {
    level = "DELETE";
    action = "激进模式删除孤儿文档";
  } else if (!isRef && !protectedDoc) {
    level = "REVIEW";
    action = "疑似孤儿文档，建议人工复核";
  } else if (textDeprecated || nameRisk) {
    level = "REVIEW";
    action = "有废弃信号但仍被引用，建议先改链接再删";
  } else {
    continue;
  }

  candidates.push({
    file,
    title,
    level,
    action,
    referenced: isRef,
    sourceCount,
    reasons,
    warnings,
    keep: duplicateKeep.get(file) ?? "",
  });
}

const deleteList = candidates.filter((item) => item.level === "DELETE");

if (apply) {
  for (const item of deleteList) {
    const full = path.join(root, item.file);

    if (fs.existsSync(full)) {
      fs.rmSync(full, { force: true });
      console.log(`deleted: ${item.file}`);
    }
  }
}

const report = [];

report.push("---");
report.push("title: 无用与废弃文档清理报告");
report.push("description: 自动扫描文档站中疑似无用、废弃、临时、重复、空壳和孤儿 Markdown 文件，辅助安全清理。");
report.push(`created: ${new Date().toISOString().slice(0, 10)}`);
report.push(`updated: ${new Date().toISOString().slice(0, 10)}`);
report.push("search: false");
report.push("---");
report.push("");
report.push("# 无用与废弃文档清理报告");
report.push("");
report.push(`> 生成时间：${new Date().toLocaleString("zh-CN")}`);
report.push("");
report.push(apply ? "> 当前模式：已执行删除。" : "> 当前模式：仅审计，不删除。");
report.push("");
report.push("## 清理原则");
report.push("");
report.push("- 自动删除只处理高置信废弃文件：空壳、临时、备份、冲突、明确废弃且未引用、完全重复副本。");
report.push("- 未被引用的普通资料不会默认删除，因为资料库页面可能通过侧边栏、搜索、sitemap 或人工入口访问。");
report.push("- OCR、证据、官方、原始资料相关文件默认保护，不自动删除。");
report.push("- 仍被引用的废弃文档不会自动删除，需要先调整链接和导航。");
report.push("");
report.push("## 汇总");
report.push("");
report.push(`- 扫描 Markdown 文件：${files.length}`);
report.push(`- 候选文件：${candidates.length}`);
report.push(`- 高置信可删除：${deleteList.length}`);
report.push(`- 需要人工复核：${candidates.filter((item) => item.level === "REVIEW").length}`);
report.push("");
report.push("## 高置信可删除文件");
report.push("");

if (deleteList.length === 0) {
  report.push("- 暂无高置信可删除文件。");
} else {
  report.push("| 文件 | 标题 | 动作 | 原因 |");
  report.push("| --- | --- | --- | --- |");

  for (const item of deleteList) {
    report.push(`| \`${item.file}\` | ${item.title || "-"} | ${item.action} | ${reasonText(item.reasons)} |`);
  }
}

report.push("");
report.push("## 需要人工复核的文件");
report.push("");

const reviewList = candidates.filter((item) => item.level === "REVIEW");

if (reviewList.length === 0) {
  report.push("- 暂无需要人工复核的文件。");
} else {
  report.push("| 文件 | 标题 | 引用数 | 建议 | 原因 |");
  report.push("| --- | --- | ---: | --- | --- |");

  for (const item of reviewList) {
    report.push(`| \`${item.file}\` | ${item.title || "-"} | ${item.sourceCount} | ${item.action} | ${reasonText(item.reasons.concat(item.warnings))} |`);
  }
}

report.push("");
report.push("## 删除后的恢复方式");
report.push("");
report.push("删除通过 Git 记录，可用以下方式恢复单个文件：");
report.push("");
report.push("```powershell");
report.push("git restore -- path/to/file.md");
report.push("```");
report.push("");
report.push("恢复全部未提交删除：");
report.push("");
report.push("```powershell");
report.push("git restore .");
report.push("```");

writeSafe("docs/维护与报告/无用与废弃文档清理报告.md", report.join("\n"));

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(
  manifestPath,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: apply ? "apply" : "audit",
    aggressive,
    scanned: files.length,
    candidates,
    deleteList,
  }, null, 2) + "\n",
  "utf8"
);

console.log(`scanned markdown files: ${files.length}`);
console.log(`candidates: ${candidates.length}`);
console.log(`high-confidence deletable: ${deleteList.length}`);
console.log(`report: ${rel(reportPath)}`);
console.log(`manifest: ${rel(manifestPath)}`);

if (!apply) {
  console.log("audit only; no files deleted");
}
