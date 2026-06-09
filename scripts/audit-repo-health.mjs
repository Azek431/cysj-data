import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const reportPath = path.join(root, "docs/维护与报告/仓库健康巡检报告.md");

const skipDirs = new Set([
  ".git",
  "node_modules",
  "dist",
  ".vite",
  ".cache",
  ".astro",
]);

const guardFiles = new Set([
  "scripts/check-site-domain.mjs",
  "scripts/check-doc-links-light.mjs",
  "scripts/audit-repo-health.mjs",
  "scripts/check-search-indexing.mjs",
  "docs/维护与报告/仓库健康巡检报告.md",
]);

const textExts = new Set([
  ".md",
  ".mdx",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".vue",
  ".css",
  ".json",
  ".yml",
  ".yaml",
  ".txt",
  ".html",
]);

const suspiciousPatterns = [
  {
    name: "绝对本地路径",
    pattern: /[A-Z]:\\|\/storage\/emulated\/0|\/home\/|\/mnt\//i,
    level: "中",
  },
  {
    name: "旧域名",
    pattern: /cysjdocs\.dpdns\.org|cysjdocs\.pages\.dev/i,
    level: "高",
  },
  {
    name: "疑似临时标记",
    pattern: /TODO|FIXME|待处理|临时|占位|随便写|测试内容/i,
    level: "中",
  },
  {
    name: "冲突文件痕迹",
    pattern: /sync-conflict|<<<<<<<|=======|>>>>>>>/i,
    level: "高",
  },
];

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    const relative = rel(full);

    if (item.isDirectory()) {
      if (skipDirs.has(item.name)) continue;
      if (relative.startsWith("docs/.vitepress/dist")) continue;

      walk(full, output);
      continue;
    }

    if (guardFiles.has(relative)) continue;

    if (textExts.has(path.extname(item.name).toLowerCase())) {
      output.push(full);
    }
  }

  return output;
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function getTitle(text) {
  const frontmatterTitle = text.match(/^---[\s\S]*?\ntitle:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/);
  if (frontmatterTitle) return frontmatterTitle[1].trim();

  const h1 = text.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();

  return "";
}

const files = walk(root);
const mdFiles = files.filter((file) => path.extname(file).toLowerCase() === ".md");

const stats = {
  totalTextFiles: files.length,
  totalMdFiles: mdFiles.length,
  totalDocsFiles: mdFiles.filter((file) => rel(file).startsWith("docs/")).length,
};

const findings = [];
const titleMap = new Map();
const bigFiles = [];

for (const file of files) {
  const relative = rel(file);
  const text = read(file);
  const size = Buffer.byteLength(text, "utf8");

  if (size > 80 * 1024) {
    bigFiles.push({ file: relative, size });
  }

  for (const item of suspiciousPatterns) {
    if (item.pattern.test(text)) {
      findings.push({
        level: item.level,
        file: relative,
        issue: item.name,
      });
    }
  }

  if (relative.endsWith(".md") && relative.startsWith("docs/")) {
    const title = getTitle(text);

    if (!title) {
      findings.push({
        level: "中",
        file: relative,
        issue: "缺少可识别标题",
      });
    } else {
      if (!titleMap.has(title)) titleMap.set(title, []);
      titleMap.get(title).push(relative);
    }

    const h1Count = (text.match(/^#\s+/gm) || []).length;
    if (h1Count > 1) {
      findings.push({
        level: "低",
        file: relative,
        issue: `存在 ${h1Count} 个一级标题`,
      });
    }

    if (!/^---[\s\S]*?---/.test(text)) {
      findings.push({
        level: "中",
        file: relative,
        issue: "缺少 frontmatter",
      });
    }
  }
}

for (const [title, list] of titleMap.entries()) {
  if (list.length > 1) {
    for (const file of list) {
      findings.push({
        level: "低",
        file,
        issue: `标题重复：${title}`,
      });
    }
  }
}

bigFiles
  .sort((a, b) => b.size - a.size)
  .slice(0, 20)
  .forEach((item) => {
    findings.push({
      level: item.size > 180 * 1024 ? "中" : "低",
      file: item.file,
      issue: `文件偏大：${Math.round(item.size / 1024)}KB`,
    });
  });

const grouped = {
  高: findings.filter((item) => item.level === "高"),
  中: findings.filter((item) => item.level === "中"),
  低: findings.filter((item) => item.level === "低"),
};

const now = new Date().toISOString();

const lines = [
  "---",
  "title: 仓库健康巡检报告",
  "description: 记录创游世界资料库的轻量巡检结果，用于发现旧域名、冲突文件、缺失标题、重复标题、过大文件和潜在维护问题。",
  "created: 2026-06-08",
  `updated: ${now.slice(0, 10)}`,
  "search: false",
  "---",
  "",
  "# 仓库健康巡检报告",
  "",
  `> 生成时间：${now}`,
  "",
  strict
    ? "> 当前模式：严格模式。高风险问题会让命令失败。"
    : "> 当前模式：轻量模式。高风险问题只生成报告和警告，不阻塞日常小改提交。",
  "",
  "## 巡检摘要",
  "",
  `- 文本文件数量：${stats.totalTextFiles}`,
  `- Markdown 文件数量：${stats.totalMdFiles}`,
  `- docs 文档数量：${stats.totalDocsFiles}`,
  `- 高风险问题：${grouped["高"].length}`,
  `- 中风险问题：${grouped["中"].length}`,
  `- 低风险问题：${grouped["低"].length}`,
  "",
  "## 高风险问题",
  "",
  grouped["高"].length
    ? grouped["高"].map((item) => `- \`${item.file}\`：${item.issue}`).join("\n")
    : "- 暂无高风险问题。",
  "",
  "## 中风险问题",
  "",
  grouped["中"].length
    ? grouped["中"].slice(0, 80).map((item) => `- \`${item.file}\`：${item.issue}`).join("\n")
    : "- 暂无中风险问题。",
  "",
  "## 低风险问题",
  "",
  grouped["低"].length
    ? grouped["低"].slice(0, 120).map((item) => `- \`${item.file}\`：${item.issue}`).join("\n")
    : "- 暂无低风险问题。",
  "",
  "## 后续建议",
  "",
  "- 优先处理旧域名、冲突文件痕迹、缺少 frontmatter、缺少标题的问题。",
  "- 重复标题不一定是错误，但建议检查是否存在内容重复或导航命名不清晰。",
  "- 文件偏大不一定需要立刻拆分，但如果阅读体验下降，可以拆为专题页、索引页和细分页。",
  "- 日常轻量检查默认不因为历史问题失败，需要严格拦截时使用 `pnpm run docs:health:audit:strict`。",
  "",
];

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, lines.join("\n") + "\n", "utf8");

console.log(`Repository health report generated: ${path.relative(root, reportPath)}`);

if (grouped["高"].length > 0) {
  const message = `Found ${grouped["高"].length} high-risk issue(s).`;

  if (strict) {
    console.error(message);
    process.exit(1);
  }

  console.warn(`WARN ${message}`);
  console.warn("WARN Light audit mode will not block this command.");
}
