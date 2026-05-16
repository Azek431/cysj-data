import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs");

const skipFiles = new Set([
  "docs/总索引与导航/自动生成文档目录.md",
]);

const skipDirParts = [
  "/.vitepress/",
  "/node_modules/",
  "/.git/",
  "/历史归档/",
];

const requiredFrontmatter = ["title", "description", "category", "tags", "status"];

function normalize(p) {
  return p.replaceAll("\\", "/");
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
    return { frontmatter: "", body: t };
  }

  const end = t.indexOf("\n---\n", 4);

  if (end === -1) {
    return { frontmatter: "", body: t };
  }

  return {
    frontmatter: t.slice(0, end + 5),
    body: t.slice(end + 5),
  };
}

function getFrontmatterValue(frontmatter, key) {
  const re = new RegExp(`^${key}\\s*:`, "m");
  return re.test(frontmatter);
}

function lineNumberOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function isCjkHeavy(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

const issues = [];

function add(file, level, type, message, line = null) {
  issues.push({
    file: normalize(path.relative(root, file)),
    level,
    type,
    line,
    message,
  });
}

const files = walk(docsDir).filter((file) => !shouldSkip(file));

for (const file of files) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const { frontmatter, body } = splitFrontmatter(text);

  if (!frontmatter) {
    add(file, "ERROR", "frontmatter", "缺少 frontmatter");
  } else {
    for (const key of requiredFrontmatter) {
      if (!getFrontmatterValue(frontmatter, key)) {
        add(file, "WARN", "frontmatter", `frontmatter 缺少 ${key}`);
      }
    }
  }

  const lines = body.split("\n");

  // 1. 正文残留更新时间/维护者
  lines.forEach((line, i) => {
    if (/^\s*>?\s*[-*]?\s*\*{0,2}\s*(最后更新|更新时间|更新日期|文档更新|维护者|维护人|编辑者)\s*[:：]/i.test(line)) {
      add(file, "WARN", "ai-footer", `正文疑似残留 AI 维护脚注：${line.trim()}`, i + 1);
    }
  });

  // 2. 仓库路径链接/文本
  lines.forEach((line, i) => {
    if (/docs\/.+\.md/.test(line) || /docs\\.+\.md/.test(line)) {
      add(file, "WARN", "repo-path", `正文包含仓库路径，建议改为站内链接：${line.trim()}`, i + 1);
    }
  });

  // 3. 站内链接空格
  lines.forEach((line, i) => {
    if (/\]\([^)\r\n]* [^)\r\n]*\)/.test(line)) {
      add(file, "ERROR", "link-space", `站内链接可能含空格未转义：${line.trim()}`, i + 1);
    }
  });

  // 4. 空链接
  lines.forEach((line, i) => {
    if (/\]\(\s*\)/.test(line) || /\]\(#\s*\)/.test(line)) {
      add(file, "ERROR", "empty-link", `发现空链接：${line.trim()}`, i + 1);
    }
  });

  // 5. 图片 alt 缺失
  lines.forEach((line, i) => {
    if (/!\[\]\([^)]+\)/.test(line)) {
      add(file, "WARN", "image-alt", `图片缺少 alt 说明：${line.trim()}`, i + 1);
    }
  });

  // 6. TODO / 待补充 / 待验证
  lines.forEach((line, i) => {
    if (/(TODO|FIXME|待补充|待完善|待验证|待确认|占位)/i.test(line)) {
      add(file, "INFO", "todo", `发现待处理标记：${line.trim()}`, i + 1);
    }
  });

  // 7. 超长段落
  let para = [];
  let paraStart = 1;

  function flushPara(currentLine) {
    const joined = para.join("").trim();
    if (joined && isCjkHeavy(joined) && joined.length > 420) {
      add(file, "WARN", "long-paragraph", `段落过长，约 ${joined.length} 字，建议拆分`, paraStart);
    }
    para = [];
    paraStart = currentLine + 1;
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (
      trimmed === "" ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("|") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith(">") ||
      trimmed.startsWith("```")
    ) {
      flushPara(i + 1);
    } else {
      if (para.length === 0) paraStart = i + 1;
      para.push(trimmed);
    }
  });

  flushPara(lines.length);

  // 8. 标题层级跳跃
  let lastLevel = 0;
  lines.forEach((line, i) => {
    const m = /^(#{1,6})\s+/.exec(line);
    if (!m) return;

    const level = m[1].length;

    if (lastLevel > 0 && level > lastLevel + 1) {
      add(file, "WARN", "heading-jump", `标题层级跳跃：h${lastLevel} 后直接出现 h${level}`, i + 1);
    }

    lastLevel = level;
  });

  // 9. 孤岛文档：正文没有站内链接
  const internalLinks = body.match(/\]\/[^)\n]+/g) || [];
  const rel = normalize(path.relative(root, file));
  const isNavLike = rel.includes("导航") || rel.includes("索引") || rel.includes("目录");

  if (!isNavLike && internalLinks.length === 0) {
    add(file, "INFO", "no-internal-link", "正文没有站内链接，可能是孤岛文档");
  }
}

const order = { ERROR: 0, WARN: 1, INFO: 2 };
issues.sort((a, b) => {
  if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
  return a.file.localeCompare(b.file, "zh-Hans-CN");
});

const reportLines = [];

reportLines.push("# 文档内容质量审计报告");
reportLines.push("");
reportLines.push(`生成时间：${new Date().toLocaleString("zh-CN")}`);
reportLines.push("");
reportLines.push("## 汇总");
reportLines.push("");

for (const level of ["ERROR", "WARN", "INFO"]) {
  reportLines.push(`- ${level}: ${issues.filter((i) => i.level === level).length}`);
}

reportLines.push("");
reportLines.push("## 详情");
reportLines.push("");

if (issues.length === 0) {
  reportLines.push("未发现明显问题。");
} else {
  let currentFile = "";

  for (const issue of issues) {
    if (issue.file !== currentFile) {
      currentFile = issue.file;
      reportLines.push(`### ${currentFile}`);
      reportLines.push("");
    }

    const line = issue.line ? `L${issue.line}` : "全文";
    reportLines.push(`- **${issue.level} / ${issue.type} / ${line}**：${issue.message}`);
  }
}

const reportPath = path.join(root, "docs", "维护与报告", "文档内容质量审计报告.md");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, reportLines.join("\n") + "\n", "utf8");

console.log(`checked ${files.length} markdown file(s)`);
console.log(`found ${issues.length} issue(s)`);
console.log(`report: ${normalize(path.relative(root, reportPath))}`);

if (issues.some((i) => i.level === "ERROR")) {
  process.exitCode = 1;
}
