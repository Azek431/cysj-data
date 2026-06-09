import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const docsRoot = path.join(root, "docs");

const skipDirParts = [
  "/.vitepress/",
  "/public/",
  "/node_modules/",
  "/.git/",
  "/历史归档/",
];

const skipFiles = new Set([
  "docs/总索引与导航/自动生成文档目录.md",
  "docs/维护与报告/文档内容质量审计报告.md",
  "docs/维护与报告/知识库内容深度审计报告.md",
  "docs/维护与报告/仓库健康巡检报告.md",
]);

const requiredFrontmatter = [
  "title",
  "description",
  "category",
  "tags",
  "status",
];

const recommendedEvidenceFields = [
  "source",
  "evidence",
  "confidence",
];

const strongClaimPatterns = [
  /必须/g,
  /一定/g,
  /只能/g,
  /不能/g,
  /无法/g,
  /必然/g,
  /绝对/g,
  /完全/g,
  /所有/g,
  /任何/g,
  /永远/g,
  /最高/g,
  /最强/g,
  /最佳/g,
  /官方/g,
  /支持/g,
  /不支持/g,
  /会自动/g,
  /不会/g,
];

const aiTonePatterns = [
  /深入(?:解析|研究|分析)/g,
  /完全指南/g,
  /终极/g,
  /从本质上/g,
  /核心逻辑/g,
  /底层逻辑/g,
  /系统性地/g,
  /多维度/g,
  /全方位/g,
  /最佳实践/g,
  /极大(?:提升|优化|增强)/g,
  /显著(?:提升|优化|增强)/g,
  /非常重要/g,
];

const evidenceWords = [
  "OCR",
  "截图",
  "原始资料",
  "官方",
  "教程",
  "版本",
  "引擎更新",
  "证据",
  "来源",
  "待验证",
  "推测",
  "经验",
  "观察",
  "结论等级",
  "资料等级",
];

const officialLikeWords = [
  "官方教程",
  "官方",
  "引擎更新",
  "版本",
  "编辑器",
  "组件",
  "脚本",
  "广播",
  "变量",
  "作用域",
  "UI",
  "联机",
  "存档",
  "触发",
  "事件",
];

const pseudoTableHeaderPatterns = [
  /用户类型\s+适合用途/,
  /场景\s+推荐操作/,
  /问题\s+原因\s+解决/,
  /类型\s+说明/,
  /模块\s+作用/,
  /字段\s+说明/,
];

const contradictionTerms = [
  "广播",
  "全局变量",
  "局部变量",
  "对象变量",
  "UI",
  "组件",
  "自定义组件",
  "联机",
  "存档",
  "背包",
  "商店",
  "触发器",
  "作用域",
];

function normalizePath(file) {
  return file.replaceAll("\\", "/");
}

function rel(file) {
  return normalizePath(path.relative(root, file));
}

function shouldSkip(file) {
  const r = rel(file);

  if (skipFiles.has(r)) return true;

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

function splitFrontmatter(text) {
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
}

function hasFrontmatterKey(frontmatter, key) {
  return new RegExp(`^${key}\\s*:`, "m").test(frontmatter);
}

function getFrontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}\\s*:\\s*(.*)$`, "m"));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, "") : "";
}

function lineNumberOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function isHeading(line) {
  return /^#{1,6}\s+/.test(line);
}

function isCodeFence(line) {
  return /^```/.test(line.trim());
}

function isLikelyNavFile(file) {
  const r = rel(file);
  return /导航|索引|目录|路线|总表|清单|报告|说明/.test(r);
}

function hash(text) {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);
}

function hasEvidenceNearby(lines, index) {
  const start = Math.max(0, index - 4);
  const end = Math.min(lines.length - 1, index + 4);
  const nearby = lines.slice(start, end + 1).join("\n");

  return evidenceWords.some((word) => nearby.includes(word));
}

function pushIssue(issues, file, level, type, message, line = null, advice = "") {
  issues.push({
    file: rel(file),
    level,
    type,
    line,
    message,
    advice,
  });
}

const files = walk(docsRoot).filter((file) => !shouldSkip(file));
const issues = [];
const titleMap = new Map();
const paragraphMap = new Map();
const factSentences = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const { frontmatter, body } = splitFrontmatter(text);
  const lines = body.split("\n");

  if (!frontmatter) {
    pushIssue(
      issues,
      file,
      "ERROR",
      "frontmatter",
      "缺少 frontmatter",
      1,
      "资料型文档建议统一补齐 title、description、category、tags、status。"
    );
  } else {
    for (const key of requiredFrontmatter) {
      if (!hasFrontmatterKey(frontmatter, key)) {
        pushIssue(
          issues,
          file,
          "WARN",
          "frontmatter",
          `frontmatter 缺少 ${key}`,
          1,
          "建议补齐基础元数据，方便搜索、导航和后续内容审计。"
        );
      }
    }

    for (const key of recommendedEvidenceFields) {
      if (!hasFrontmatterKey(frontmatter, key) && !isLikelyNavFile(file)) {
        pushIssue(
          issues,
          file,
          "INFO",
          "evidence-meta",
          `frontmatter 建议补充 ${key}`,
          1,
          "资料型正文建议标注来源、证据或可信度；导航页可以不强制。"
        );
      }
    }

    const title = getFrontmatterValue(frontmatter, "title");

    if (title) {
      if (!titleMap.has(title)) titleMap.set(title, []);
      titleMap.get(title).push(file);
    }
  }

  let inCodeBlock = false;
  let lastHeadingLevel = 0;
  let paragraph = [];
  let paragraphStart = 1;

  function flushParagraph(endLine) {
    const joined = paragraph.join("").trim();

    if (joined.length >= 80 && /[\u4e00-\u9fff]/.test(joined)) {
      const normalized = joined
        .replace(/\s+/g, "")
        .replace(/[，。；：、,.!?！？]/g, "");

      if (normalized.length > 90) {
        const h = hash(normalized);

        if (!paragraphMap.has(h)) paragraphMap.set(h, []);
        paragraphMap.get(h).push({
          file,
          line: paragraphStart,
          text: joined.slice(0, 160),
        });
      }
    }

    if (joined.length > 430 && /[\u4e00-\u9fff]/.test(joined)) {
      pushIssue(
        issues,
        file,
        "WARN",
        "long-paragraph",
        `段落过长，约 ${joined.length} 字`,
        paragraphStart,
        "建议拆成 2 到 4 个短段落，或者改成列表 / 表格。"
      );
    }

    paragraph = [];
    paragraphStart = endLine + 1;
  }

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const trimmed = line.trim();

    if (isCodeFence(line)) {
      inCodeBlock = !inCodeBlock;
      flushParagraph(lineNo);
      return;
    }

    if (inCodeBlock) return;

    if (isHeading(line)) {
      flushParagraph(lineNo);

      const level = line.match(/^(#{1,6})\s+/)[1].length;
      const title = line.replace(/^#{1,6}\s+/, "").trim();

      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        pushIssue(
          issues,
          file,
          "WARN",
          "heading-jump",
          `标题层级跳跃：h${lastHeadingLevel} 后直接出现 h${level}`,
          lineNo,
          "建议不要跳级，避免右侧目录和阅读层级混乱。"
        );
      }

      if (/完全指南|终极|最全|保姆级|一文搞懂/.test(title)) {
        pushIssue(
          issues,
          file,
          "INFO",
          "title-tone",
          `标题可能偏 AI 营销化：${title}`,
          lineNo,
          "资料库文档建议标题更克制，例如“入门”“索引”“说明”“机制整理”。"
        );
      }

      lastHeadingLevel = level;
      return;
    }

    if (
      trimmed === "" ||
      trimmed.startsWith("|") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith(">") ||
      /^\d+\.\s+/.test(trimmed)
    ) {
      flushParagraph(lineNo);
    } else {
      if (paragraph.length === 0) paragraphStart = lineNo;
      paragraph.push(trimmed);
    }

    if (pseudoTableHeaderPatterns.some((pattern) => pattern.test(trimmed)) && !trimmed.includes("|")) {
      pushIssue(
        issues,
        file,
        "WARN",
        "pseudo-table",
        `疑似伪表格标题：${trimmed}`,
        lineNo,
        "建议改成标准 Markdown 表格，避免 GitHub 和 VitePress 渲染混乱。"
      );
    }

    if (/\]\s*/.test(line) || /\]#\s*/.test(line)) {
      pushIssue(
        issues,
        file,
        "ERROR",
        "empty-link",
        `发现空链接：${trimmed}`,
        lineNo,
        "需要补齐链接目标或删除该链接。"
      );
    }

    if (/![^)]+/.test(line)) {
      pushIssue(
        issues,
        file,
        "WARN",
        "image-alt",
        `图片缺少 alt：${trimmed}`,
        lineNo,
        "OCR 和教程截图建议补充 alt，方便搜索和无障碍阅读。"
      );
    }

    for (const pattern of aiTonePatterns) {
      if (pattern.test(trimmed)) {
        pushIssue(
          issues,
          file,
          "INFO",
          "ai-tone",
          `疑似 AI 味措辞：${trimmed.slice(0, 120)}`,
          lineNo,
          "建议改成更具体、更可验证的资料表述。"
        );
        pattern.lastIndex = 0;
        break;
      }

      pattern.lastIndex = 0;
    }

    const hasStrongClaim = strongClaimPatterns.some((pattern) => {
      const ok = pattern.test(trimmed);
      pattern.lastIndex = 0;
      return ok;
    });

    const looksOfficial = officialLikeWords.some((word) => trimmed.includes(word));

    if (hasStrongClaim && looksOfficial && !hasEvidenceNearby(lines, index)) {
      pushIssue(
        issues,
        file,
        "WARN",
        "unsupported-strong-claim",
        `强结论缺少附近证据提示：${trimmed.slice(0, 140)}`,
        lineNo,
        "建议补充“来源 / OCR / 截图 / 官方教程 / 待验证 / 经验总结”等证据提示，或把语气改弱。"
      );
    }

    if (looksOfficial && trimmed.length > 18) {
      factSentences.push({
        file,
        line: lineNo,
        text: trimmed,
      });
    }
  });

  flushParagraph(lines.length);
}

for (const [title, list] of titleMap.entries()) {
  if (list.length <= 1) continue;

  for (const file of list) {
    pushIssue(
      issues,
      file,
      "WARN",
      "duplicate-title",
      `标题重复：${title}`,
      1,
      "重复标题不一定错误，但容易让搜索、侧边栏和维护报告混乱。"
    );
  }
}

for (const [_, list] of paragraphMap.entries()) {
  if (list.length <= 1) continue;

  for (const item of list.slice(0, 8)) {
    pushIssue(
      issues,
      item.file,
      "INFO",
      "duplicate-paragraph",
      `疑似重复段落：${item.text}`,
      item.line,
      "建议确认是否为必要重复；如果是同一概念，优先抽到索引页或专题页。"
    );
  }
}

const contradictionHints = [];

for (const term of contradictionTerms) {
  const related = factSentences.filter((item) => item.text.includes(term));
  const positive = related.filter((item) => /支持|可以|能够|会自动|允许/.test(item.text));
  const negative = related.filter((item) => /不支持|不能|无法|不会|禁止|不允许/.test(item.text));

  if (positive.length && negative.length) {
    contradictionHints.push({
      term,
      positive: positive.slice(0, 5),
      negative: negative.slice(0, 5),
    });
  }
}

const levelOrder = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
};

issues.sort((a, b) => {
  if (levelOrder[a.level] !== levelOrder[b.level]) {
    return levelOrder[a.level] - levelOrder[b.level];
  }

  if (a.file !== b.file) {
    return a.file.localeCompare(b.file, "zh-Hans-CN");
  }

  return (a.line || 0) - (b.line || 0);
});

const reportLines = [];

reportLines.push("---");
reportLines.push("title: 知识库内容深度审计报告");
reportLines.push("description: 自动扫描全站 Markdown 文档中的结构、证据、AI 痕迹、重复内容、强结论和潜在资料不一致问题。");
reportLines.push(`created: ${new Date().toISOString().slice(0, 10)}`);
reportLines.push(`updated: ${new Date().toISOString().slice(0, 10)}`);
reportLines.push("search: false");
reportLines.push("---");
reportLines.push("");
reportLines.push("# 知识库内容深度审计报告");
reportLines.push("");
reportLines.push(`> 生成时间：${new Date().toLocaleString("zh-CN")}`);
reportLines.push("");
reportLines.push("## 审计说明");
reportLines.push("");
reportLines.push("这份报告用于辅助人工校对，不会直接证明某条资料一定错误。");
reportLines.push("");
reportLines.push("它主要帮助定位以下问题：");
reportLines.push("");
reportLines.push("- 结构问题：frontmatter、标题层级、伪表格、长段落、空链接。");
reportLines.push("- 资料问题：强结论缺少附近证据提示、疑似官方机制未标来源。");
reportLines.push("- 风格问题：AI 味措辞、夸张标题、重复段落。");
reportLines.push("- 一致性问题：同一术语同时出现正反描述，需要人工核对。");
reportLines.push("");
reportLines.push("## 汇总");
reportLines.push("");
reportLines.push(`- 扫描 Markdown 文件：${files.length}`);
reportLines.push(`- ERROR：${issues.filter((item) => item.level === "ERROR").length}`);
reportLines.push(`- WARN：${issues.filter((item) => item.level === "WARN").length}`);
reportLines.push(`- INFO：${issues.filter((item) => item.level === "INFO").length}`);
reportLines.push(`- 潜在正反描述术语：${contradictionHints.length}`);
reportLines.push("");
reportLines.push("## 优先修复顺序");
reportLines.push("");
reportLines.push("1. 先修 ERROR：空链接、frontmatter 严重缺失等会影响站点质量的问题。");
reportLines.push("2. 再修 WARN：强结论缺证据、伪表格、标题重复、标题层级跳跃。");
reportLines.push("3. 最后修 INFO：AI 味、重复段落、建议补充证据字段。");
reportLines.push("");
reportLines.push("## 潜在正反描述术语");
reportLines.push("");

if (contradictionHints.length === 0) {
  reportLines.push("- 暂未发现明显正反描述冲突。");
} else {
  for (const item of contradictionHints) {
    reportLines.push(`### ${item.term}`);
    reportLines.push("");
    reportLines.push("可能支持 / 可以的描述：");
    reportLines.push("");

    for (const hit of item.positive) {
      reportLines.push(`- \`${rel(hit.file)}:${hit.line}\`：${hit.text.slice(0, 180)}`);
    }

    reportLines.push("");
    reportLines.push("可能不支持 / 不能的描述：");
    reportLines.push("");

    for (const hit of item.negative) {
      reportLines.push(`- \`${rel(hit.file)}:${hit.line}\`：${hit.text.slice(0, 180)}`);
    }

    reportLines.push("");
  }
}

reportLines.push("## 详细问题");
reportLines.push("");

if (issues.length === 0) {
  reportLines.push("- 未发现明显问题。");
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

    if (issue.advice) {
      reportLines.push(`  - 建议：${issue.advice}`);
    }
  }
}

const reportPath = path.join(root, "docs/维护与报告/知识库内容深度审计报告.md");

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, reportLines.join("\n") + "\n", "utf8");

console.log(`checked ${files.length} markdown file(s)`);
console.log(`found ${issues.length} issue(s)`);
console.log(`found ${contradictionHints.length} possible contradiction term(s)`);
console.log(`report: ${rel(reportPath)}`);

if (issues.some((item) => item.level === "ERROR")) {
  process.exitCode = 1;
}
