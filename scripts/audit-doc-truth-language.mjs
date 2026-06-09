import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const docsRoot = path.join(root, "docs");
const reportDir = path.join(root, "docs/维护与报告");

const reportMd = path.join(reportDir, "文档语法与真实性审计报告.md");
const reportCsv = path.join(reportDir, "文档语法与真实性审计明细.csv");

const skipDirParts = [
  "/.vitepress/",
  "/public/",
  "/node_modules/",
  "/.git/",
  "/历史归档/",
];

const skipFiles = new Set([
  "docs/总索引与导航/自动生成文档目录.md",
  "docs/维护与报告/仓库健康巡检报告.md",
  "docs/维护与报告/知识库内容深度审计报告.md",
  "docs/维护与报告/文档语法与真实性审计报告.md",
  "docs/维护与报告/文档内容质量审计报告.md",
]);

const evidenceWords = [
  "OCR",
  "截图",
  "原图",
  "原始资料",
  "官方教程",
  "官方",
  "教程",
  "引擎更新",
  "版本",
  "证据",
  "来源",
  "出处",
  "见图",
  "如图",
  "待验证",
  "推测",
  "经验",
  "观察",
  "实测",
  "资料等级",
  "证据等级",
];

const factTerms = [
  "脚本",
  "积木",
  "广播",
  "变量",
  "全局变量",
  "局部变量",
  "对象变量",
  "组件",
  "自定义组件",
  "UI",
  "界面",
  "事件",
  "触发",
  "触发器",
  "作用域",
  "数据流",
  "联机",
  "存档",
  "背包",
  "商店",
  "任务",
  "战斗",
  "音频",
  "动画",
  "素材",
  "对象",
  "地图",
  "引擎",
  "编辑器",
];

const strongClaimRe = /(必须|一定|只能|不能|无法|必然|绝对|完全|所有|任何|永远|明确|官方|支持|不支持|会自动|不会|最佳|最强|最高|唯一|直接证明|必定|肯定)/;
const positiveRe = /(支持|可以|能够|会自动|允许|可用于|能实现|能触发|能读取|能写入)/;
const negativeRe = /(不支持|不能|无法|不会|禁止|不允许|不可用于|不能触发|不能读取|不能写入)/;

const aiToneRe = /(深入(?:解析|研究|分析)|完全指南|终极|最全|保姆级|一文搞懂|从本质上|底层逻辑|核心逻辑|系统性地|全方位|多维度|极大提升|显著提升|非常重要|毋庸置疑|众所周知|毫无疑问)/;
const grammarRiskRe = /(的的|了了|是是|可以可以|这个这个|然后然后|以及以及|等等等等|，，|。。|；；|！！|？？|，，，|。。。)/;
const asciiPunctuationBetweenChineseRe = /[\u4e00-\u9fff][,:;!?][\u4e00-\u9fff]/;
const absolutePathRe = /[A-Z]:\\|\/storage\/emulated\/0|\/home\/|\/mnt\//i;

const requiredFrontmatter = [
  "title",
  "description",
];

const recommendedFrontmatter = [
  "category",
  "tags",
  "status",
];

const evidenceFrontmatter = [
  "source",
  "evidence",
  "confidence",
];

function normalizePath(file) {
  return file.replaceAll("\\", "/");
}

function rel(file) {
  return normalizePath(path.relative(root, file));
}

function shouldSkip(file) {
  const relative = rel(file);

  if (skipFiles.has(relative)) return true;

  return skipDirParts.some((part) => normalizePath(file).includes(part));
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      walk(full, output);
      continue;
    }

    if (item.isFile() && item.name.endsWith(".md")) {
      output.push(full);
    }
  }

  return output;
}

function splitFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

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

function hasFmKey(frontmatter, key) {
  return new RegExp(`^${key}\\s*:`, "m").test(frontmatter);
}

function getFmValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}\\s*:\\s*(.*)$`, "m"));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, "") : "";
}

function isHeading(line) {
  return /^#{1,6}\s+/.test(line);
}

function headingLevel(line) {
  const match = line.match(/^(#{1,6})\s+/);
  return match ? match[1].length : 0;
}

function stripHeading(line) {
  return line.replace(/^#{1,6}\s+/, "").trim();
}

function isFence(line) {
  return /^```/.test(line.trim());
}

function isNavLike(file) {
  return /导航|索引|目录|路线|总表|清单|报告|说明|README/.test(rel(file));
}

function hasEvidenceNearby(lines, index) {
  const start = Math.max(0, index - 5);
  const end = Math.min(lines.length - 1, index + 5);
  const nearby = lines.slice(start, end + 1).join("\n");

  return evidenceWords.some((word) => nearby.includes(word));
}

function hasFactTerm(text) {
  return factTerms.some((term) => text.includes(term));
}

function hashText(text) {
  return crypto
    .createHash("sha1")
    .update(text)
    .digest("hex")
    .slice(0, 12);
}

function csvEscape(value) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function push(issues, file, level, type, line, message, advice = "") {
  issues.push({
    level,
    type,
    file: rel(file),
    line,
    message,
    advice,
  });
}

const files = walk(docsRoot).filter((file) => !shouldSkip(file));
const issues = [];
const titleMap = new Map();
const paragraphMap = new Map();
const factLines = [];

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const { frontmatter, body } = splitFrontmatter(text);
  const lines = body.split("\n");

  if (!frontmatter) {
    push(
      issues,
      file,
      "ERROR",
      "frontmatter",
      1,
      "缺少 frontmatter。",
      "资料型文档建议至少补齐 title 和 description。"
    );
  } else {
    for (const key of requiredFrontmatter) {
      if (!hasFmKey(frontmatter, key)) {
        push(
          issues,
          file,
          "ERROR",
          "frontmatter",
          1,
          `frontmatter 缺少 ${key}。`,
          "这会影响 VitePress 标题、SEO、搜索和维护脚本。"
        );
      }
    }

    for (const key of recommendedFrontmatter) {
      if (!hasFmKey(frontmatter, key)) {
        push(
          issues,
          file,
          "WARN",
          "frontmatter",
          1,
          `frontmatter 建议补充 ${key}。`,
          "建议统一分类、标签和状态，方便后续大规模维护。"
        );
      }
    }

    if (!isNavLike(file)) {
      const hasAnyEvidenceKey = evidenceFrontmatter.some((key) => hasFmKey(frontmatter, key));

      if (!hasAnyEvidenceKey) {
        push(
          issues,
          file,
          "INFO",
          "evidence-meta",
          1,
          "资料型正文建议补充 source / evidence / confidence 之一。",
          "不是必须，但能区分官方资料、OCR、经验总结和推理模型。"
        );
      }
    }

    const title = getFmValue(frontmatter, "title");

    if (title) {
      if (!titleMap.has(title)) titleMap.set(title, []);
      titleMap.get(title).push(file);

      if (aiToneRe.test(title)) {
        push(
          issues,
          file,
          "INFO",
          "title-tone",
          1,
          `标题可能偏营销化或 AI 味：${title}`,
          "资料库标题建议更克制，例如“机制整理”“入门说明”“资料索引”“问题速查”。"
        );
      }
    }
  }

  let inCode = false;
  let lastHeading = 0;
  let h1Count = 0;
  let paragraph = [];
  let paragraphStart = 1;

  function flushParagraph(endLine) {
    const joined = paragraph.join("").trim();

    if (joined.length > 0) {
      const compact = joined
        .replace(/\s+/g, "")
        .replace(/[，。；：、,.!?！？（）()【】《》]/g, "");

      if (compact.length > 110) {
        const key = hashText(compact);

        if (!paragraphMap.has(key)) paragraphMap.set(key, []);
        paragraphMap.get(key).push({
          file,
          line: paragraphStart,
          preview: joined.slice(0, 160),
        });
      }

      if (joined.length > 420) {
        push(
          issues,
          file,
          "WARN",
          "long-paragraph",
          paragraphStart,
          `段落过长，约 ${joined.length} 字。`,
          "建议拆成短段落，或改成列表 / 表格 / 步骤。"
        );
      }

      const sentenceParts = joined.split(/[。！？!?]/).map((item) => item.trim()).filter(Boolean);

      for (const part of sentenceParts) {
        if (part.length > 120) {
          push(
            issues,
            file,
            "WARN",
            "long-sentence",
            paragraphStart,
            `句子过长，约 ${part.length} 字：${part.slice(0, 120)}`,
            "中文技术文档建议单句控制在 80 字以内，复杂逻辑拆成两句。"
          );
          break;
        }
      }
    }

    paragraph = [];
    paragraphStart = endLine + 1;
  }

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const trimmed = line.trim();

    if (isFence(line)) {
      flushParagraph(lineNo);
      inCode = !inCode;
      return;
    }

    if (inCode) return;

    if (isHeading(line)) {
      flushParagraph(lineNo);

      const level = headingLevel(line);
      const title = stripHeading(line);

      if (level === 1) h1Count += 1;

      if (lastHeading > 0 && level > lastHeading + 1) {
        push(
          issues,
          file,
          "WARN",
          "heading-jump",
          lineNo,
          `标题层级跳跃：h${lastHeading} 后直接出现 h${level}。`,
          "建议标题不要跳级，否则右侧目录和阅读层级会混乱。"
        );
      }

      if (aiToneRe.test(title)) {
        push(
          issues,
          file,
          "INFO",
          "heading-tone",
          lineNo,
          `标题可能偏 AI 味或营销化：${title}`,
          "资料站标题建议更像资料索引，不要过度使用“完全指南、终极、最强”。"
        );
      }

      lastHeading = level;
      return;
    }

    const isParagraphBoundary =
      trimmed === "" ||
      trimmed.startsWith("|") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith(">") ||
      /^\d+\.\s+/.test(trimmed);

    if (isParagraphBoundary) {
      flushParagraph(lineNo);
    } else {
      if (paragraph.length === 0) paragraphStart = lineNo;
      paragraph.push(trimmed);
    }

    if (grammarRiskRe.test(trimmed)) {
      push(
        issues,
        file,
        "WARN",
        "grammar-risk",
        lineNo,
        `疑似语法或标点重复问题：${trimmed.slice(0, 160)}`,
        "建议人工检查是否存在重复词、重复标点或复制痕迹。"
      );
    }

    if (asciiPunctuationBetweenChineseRe.test(trimmed)) {
      push(
        issues,
        file,
        "INFO",
        "punctuation",
        lineNo,
        `中文句子里夹杂英文标点：${trimmed.slice(0, 160)}`,
        "中文正文建议统一使用中文标点；代码、路径、URL 除外。"
      );
    }

    if (absolutePathRe.test(trimmed)) {
      push(
        issues,
        file,
        "WARN",
        "local-path",
        lineNo,
        `正文中出现本地绝对路径：${trimmed.slice(0, 160)}`,
        "公开文档中尽量避免本地设备路径，除非是维护说明。"
      );
    }

    if (/\]\s*/.test(line) || /\]#\s*/.test(line)) {
      push(
        issues,
        file,
        "ERROR",
        "empty-link",
        lineNo,
        `发现空链接：${trimmed.slice(0, 160)}`,
        "需要补齐链接目标或删除链接。"
      );
    }

    if (/![^)]+/.test(line)) {
      push(
        issues,
        file,
        "WARN",
        "image-alt",
        lineNo,
        `图片缺少 alt：${trimmed.slice(0, 160)}`,
        "教程截图和 OCR 图片建议补充 alt，方便搜索和无障碍阅读。"
      );
    }

    if (
      /(用户类型\s+适合用途|场景\s+推荐操作|问题\s+原因\s+解决|类型\s+说明|模块\s+作用|字段\s+说明)/.test(trimmed) &&
      !trimmed.includes("|")
    ) {
      push(
        issues,
        file,
        "WARN",
        "pseudo-table",
        lineNo,
        `疑似伪表格标题：${trimmed}`,
        "建议改成标准 Markdown 表格，避免 VitePress 和 GitHub 渲染不一致。"
      );
    }

    if (aiToneRe.test(trimmed)) {
      push(
        issues,
        file,
        "INFO",
        "ai-tone",
        lineNo,
        `疑似 AI 味或过强修饰：${trimmed.slice(0, 160)}`,
        "建议改成更具体、更可验证的资料表述。"
      );
    }

    const looksLikeFact = hasFactTerm(trimmed);
    const hasStrongClaim = strongClaimRe.test(trimmed);

    if (looksLikeFact && hasStrongClaim && !hasEvidenceNearby(lines, index)) {
      push(
        issues,
        file,
        "WARN",
        "truth-risk",
        lineNo,
        `强结论缺少附近证据提示：${trimmed.slice(0, 180)}`,
        "建议补充 OCR、截图、官方教程、引擎更新、实测或待验证标记；没有证据时降低语气。"
      );
    }

    if (/官方明确|官方说明|官方教程|引擎更新/.test(trimmed) && !hasEvidenceNearby(lines, index)) {
      push(
        issues,
        file,
        "WARN",
        "official-source-risk",
        lineNo,
        `提到官方资料但附近没有证据提示：${trimmed.slice(0, 180)}`,
        "建议补充截图、OCR、来源文件或具体版本。"
      );
    }

    if (/\d+\.\d+\.\d+/.test(trimmed) && !hasEvidenceNearby(lines, index)) {
      push(
        issues,
        file,
        "INFO",
        "version-evidence",
        lineNo,
        `提到版本号但附近没有来源提示：${trimmed.slice(0, 180)}`,
        "版本相关内容最好补充引擎更新截图、OCR 或资料来源。"
      );
    }

    if (looksLikeFact && trimmed.length >= 18) {
      factLines.push({
        file,
        line: lineNo,
        text: trimmed,
      });
    }
  });

  flushParagraph(lines.length);

  if (inCode) {
    push(
      issues,
      file,
      "ERROR",
      "code-fence",
      lines.length,
      "代码块围栏没有闭合。",
      "检查 ``` 是否成对出现。"
    );
  }

  if (h1Count > 1) {
    push(
      issues,
      file,
      "WARN",
      "heading",
      1,
      `存在 ${h1Count} 个一级标题。`,
      "一篇文档建议只有一个 h1，其他层级从 h2 开始。"
    );
  }
}

for (const [title, list] of titleMap.entries()) {
  if (list.length <= 1) continue;

  for (const file of list) {
    push(
      issues,
      file,
      "WARN",
      "duplicate-title",
      1,
      `标题重复：${title}`,
      "标题重复不一定错误，但会影响搜索、侧边栏辨识和维护。"
    );
  }
}

for (const [_, list] of paragraphMap.entries()) {
  if (list.length <= 1) continue;

  for (const item of list.slice(0, 8)) {
    push(
      issues,
      item.file,
      "INFO",
      "duplicate-paragraph",
      item.line,
      `疑似重复段落：${item.preview}`,
      "如果是同一概念，建议抽到索引页或专题页，避免多处维护。"
    );
  }
}

const contradictionHints = [];

for (const term of factTerms) {
  const related = factLines.filter((item) => item.text.includes(term));
  const positive = related.filter((item) => positiveRe.test(item.text));
  const negative = related.filter((item) => negativeRe.test(item.text));

  if (positive.length && negative.length) {
    contradictionHints.push({
      term,
      positive: positive.slice(0, 6),
      negative: negative.slice(0, 6),
    });
  }
}

const levelRank = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
};

issues.sort((a, b) => {
  if (levelRank[a.level] !== levelRank[b.level]) {
    return levelRank[a.level] - levelRank[b.level];
  }

  if (a.file !== b.file) {
    return a.file.localeCompare(b.file, "zh-Hans-CN");
  }

  return (a.line || 0) - (b.line || 0);
});

const byFile = new Map();

for (const issue of issues) {
  if (!byFile.has(issue.file)) byFile.set(issue.file, []);
  byFile.get(issue.file).push(issue);
}

const fileScores = [...byFile.entries()]
  .map(([file, list]) => {
    const score = list.reduce((sum, item) => {
      if (item.level === "ERROR") return sum + 9;
      if (item.level === "WARN") return sum + 3;
      return sum + 1;
    }, 0);

    return {
      file,
      score,
      errors: list.filter((item) => item.level === "ERROR").length,
      warns: list.filter((item) => item.level === "WARN").length,
      infos: list.filter((item) => item.level === "INFO").length,
    };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 30);

const report = [];

report.push("---");
report.push("title: 文档语法与真实性审计报告");
report.push("description: 自动扫描全站 Markdown 文档中的语法风险、AI 味、强结论、证据缺失、重复内容和潜在事实不一致问题。");
report.push(`created: ${new Date().toISOString().slice(0, 10)}`);
report.push(`updated: ${new Date().toISOString().slice(0, 10)}`);
report.push("search: false");
report.push("---");
report.push("");
report.push("# 文档语法与真实性审计报告");
report.push("");
report.push(`> 生成时间：${new Date().toLocaleString("zh-CN")}`);
report.push("");
report.push("## 审计边界");
report.push("");
report.push("这份报告用于辅助人工校对，不会直接证明某条资料一定错误。");
report.push("");
report.push("它会标记：");
report.push("");
report.push("- 语法与表达问题：重复词、重复标点、英文标点混用、长句、长段落。");
report.push("- Markdown 结构问题：frontmatter、标题层级、空链接、图片 alt、伪表格、代码块围栏。");
report.push("- 资料真实性风险：强结论缺少 OCR、截图、官方教程、引擎更新或实测证据提示。");
report.push("- 一致性风险：同一术语在不同文档中同时出现“支持 / 不支持”“可以 / 不能”等正反描述。");
report.push("");
report.push("## 汇总");
report.push("");
report.push(`- 扫描 Markdown 文件：${files.length}`);
report.push(`- 问题总数：${issues.length}`);
report.push(`- ERROR：${issues.filter((item) => item.level === "ERROR").length}`);
report.push(`- WARN：${issues.filter((item) => item.level === "WARN").length}`);
report.push(`- INFO：${issues.filter((item) => item.level === "INFO").length}`);
report.push(`- 潜在正反描述术语：${contradictionHints.length}`);
report.push("");
report.push("## 优先修复文件 Top 30");
report.push("");
report.push("| 文件 | 分数 | ERROR | WARN | INFO |");
report.push("| --- | ---: | ---: | ---: | ---: |");

for (const item of fileScores) {
  report.push(`| \`${item.file}\` | ${item.score} | ${item.errors} | ${item.warns} | ${item.infos} |`);
}

report.push("");
report.push("## 潜在正反描述术语");
report.push("");

if (contradictionHints.length === 0) {
  report.push("- 暂未发现明显正反描述冲突。");
} else {
  for (const item of contradictionHints) {
    report.push(`### ${item.term}`);
    report.push("");
    report.push("可能支持 / 可以的描述：");
    report.push("");

    for (const hit of item.positive) {
      report.push(`- \`${rel(hit.file)}:${hit.line}\`：${hit.text.slice(0, 180)}`);
    }

    report.push("");
    report.push("可能不支持 / 不能的描述：");
    report.push("");

    for (const hit of item.negative) {
      report.push(`- \`${rel(hit.file)}:${hit.line}\`：${hit.text.slice(0, 180)}`);
    }

    report.push("");
  }
}

report.push("## 详细问题");
report.push("");

if (issues.length === 0) {
  report.push("- 未发现明显问题。");
} else {
  let current = "";

  for (const issue of issues) {
    if (issue.file !== current) {
      current = issue.file;
      report.push(`### ${current}`);
      report.push("");
    }

    report.push(`- **${issue.level} / ${issue.type} / L${issue.line ?? "?"}**：${issue.message}`);

    if (issue.advice) {
      report.push(`  - 建议：${issue.advice}`);
    }
  }
}

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportMd, report.join("\n") + "\n", "utf8");

const csvRows = [
  ["level", "type", "file", "line", "message", "advice"].map(csvEscape).join(","),
];

for (const issue of issues) {
  csvRows.push([
    issue.level,
    issue.type,
    issue.file,
    issue.line,
    issue.message,
    issue.advice,
  ].map(csvEscape).join(","));
}

fs.writeFileSync(reportCsv, csvRows.join("\n") + "\n", "utf8");

console.log(`checked ${files.length} markdown file(s)`);
console.log(`found ${issues.length} issue(s)`);
console.log(`possible contradiction terms: ${contradictionHints.length}`);
console.log(`report: ${rel(reportMd)}`);
console.log(`csv: ${rel(reportCsv)}`);
