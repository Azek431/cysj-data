import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mode = process.argv.includes("--dist") ? "dist" : "source";

const siteName = "Azek创游世界文档";
const siteUrl = "https://cysjdocs.azek431.top";
const oldDomains = [
  "cysjdocs.dpdns.org",
  "cysjdocs.pages.dev",
];

const errors = [];
const warnings = [];

function read(file) {
  const full = path.join(root, file);

  if (!fs.existsSync(full)) return "";

  return fs.readFileSync(full, "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      walk(full, out);
      continue;
    }

    if (item.isFile()) {
      out.push(full);
    }
  }

  return out;
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function checkSource() {
  const config = read("docs/.vitepress/config.mts");
  const robots = read("docs/public/robots.txt");
  const index = read("docs/index.md");

  if (!config) fail("docs/.vitepress/config.mts 不存在或无法读取");
  if (!robots) fail("docs/public/robots.txt 不存在或无法读取");

  if (!config.includes(`title: '${siteName}'`)) {
    fail("config.mts 缺少正确 title");
  }

  if (!config.includes(`titleTemplate: ':title | ${siteName}'`)) {
    fail("config.mts 缺少正确 titleTemplate");
  }

  if (!config.includes(`hostname: '${siteUrl}'`)) {
    fail("config.mts 的 sitemap.hostname 没有指向正式域名");
  }

  if (!config.includes("transformPageData(pageData)") || !config.includes("rel: 'canonical'")) {
    fail("config.mts 缺少 canonical 生成逻辑");
  }

  if (!config.includes(`siteTitle: '${siteName}'`)) {
    fail("config.mts 缺少正确 siteTitle");
  }

  if (!config.includes("name: 'robots', content: 'index, follow'")) {
    warn("config.mts 没有看到全局 robots index, follow meta");
  }

  if (!robots.includes("Sitemap: https://cysjdocs.azek431.top/sitemap.xml")) {
    fail("robots.txt 没有指向正式域名 sitemap");
  }

  if (/Host\s*:/i.test(robots)) {
    fail("robots.txt 仍然包含 Host 字段，建议移除，避免旧域名信号混乱");
  }

  for (const oldDomain of oldDomains) {
    if (robots.includes(oldDomain)) {
      fail(`robots.txt 仍然包含旧域名：${oldDomain}`);
    }
  }

  if (!index.includes(siteName)) {
    warn("docs/index.md 没有看到新站点名称");
  }

  const docsFiles = walk(path.join(root, "docs"))
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !rel(file).includes("docs/.vitepress/"))
    .filter((file) => !rel(file).includes("docs/public/"));

  const articleLikeFiles = docsFiles.filter((file) => {
    const r = rel(file);

    return !/维护与报告|总索引与导航\/自动生成文档目录/.test(r);
  });

  if (articleLikeFiles.length < 20) {
    warn(`Markdown 文章数量看起来偏少：${articleLikeFiles.length}`);
  }

  const noindexHits = [];

  for (const file of docsFiles) {
    const body = fs.readFileSync(file, "utf8");

    if (/noindex/i.test(body)) {
      noindexHits.push(rel(file));
    }
  }

  if (noindexHits.length) {
    warn(`发现 ${noindexHits.length} 个 Markdown 文件包含 noindex 字样，请确认不是误写：${noindexHits.slice(0, 8).join(", ")}`);
  }

  console.log(`Source SEO check scanned ${docsFiles.length} markdown file(s).`);
}

function checkDist() {
  const distRoot = "docs/.vitepress/dist";

  if (!exists(distRoot)) {
    fail("docs/.vitepress/dist 不存在，请先运行 pnpm run docs:build");
    return;
  }

  const sitemap = read("docs/.vitepress/dist/sitemap.xml");
  const robots = read("docs/.vitepress/dist/robots.txt");
  const indexHtml = read("docs/.vitepress/dist/index.html");

  if (!sitemap) {
    fail("构建产物缺少 sitemap.xml");
  } else {
    const locCount = countMatches(sitemap, /<loc>/g);

    if (locCount < 20) {
      fail(`sitemap.xml URL 数量异常偏少：${locCount}`);
    }

    if (!sitemap.includes(siteUrl)) {
      fail("sitemap.xml 没有正式域名 URL");
    }

    for (const oldDomain of oldDomains) {
      if (sitemap.includes(oldDomain)) {
        fail(`sitemap.xml 仍然包含旧域名：${oldDomain}`);
      }
    }

    console.log(`Sitemap URL count: ${locCount}`);
  }

  if (!robots) {
    fail("构建产物缺少 robots.txt");
  } else {
    if (!robots.includes("Sitemap: https://cysjdocs.azek431.top/sitemap.xml")) {
      fail("构建后的 robots.txt 没有正式域名 sitemap");
    }

    if (/Host\s*:/i.test(robots)) {
      fail("构建后的 robots.txt 仍然包含 Host 字段");
    }

    for (const oldDomain of oldDomains) {
      if (robots.includes(oldDomain)) {
        fail(`构建后的 robots.txt 仍然包含旧域名：${oldDomain}`);
      }
    }
  }

  if (!indexHtml) {
    fail("构建产物缺少 index.html");
  } else {
    if (!indexHtml.includes(`rel="canonical"`)) {
      fail("首页 HTML 缺少 canonical");
    }

    if (!indexHtml.includes(siteName)) {
      warn("首页 HTML 没有看到新站点名称");
    }

    if (/noindex/i.test(indexHtml)) {
      fail("首页 HTML 出现 noindex");
    }
  }

  const htmlFiles = walk(path.join(root, distRoot))
    .filter((file) => file.endsWith(".html"))
    .map(rel);

  const sampleFiles = htmlFiles
    .filter((file) => !file.endsWith("404.html"))
    .slice(0, 30);

  let canonicalMissing = 0;
  let noindexCount = 0;

  for (const file of sampleFiles) {
    const html = read(file);

    if (!html.includes(`rel="canonical"`)) {
      canonicalMissing += 1;
    }

    if (/noindex/i.test(html)) {
      noindexCount += 1;
    }
  }

  if (canonicalMissing) {
    fail(`抽样 HTML 中有 ${canonicalMissing} 个页面缺少 canonical`);
  }

  if (noindexCount) {
    fail(`抽样 HTML 中有 ${noindexCount} 个页面出现 noindex`);
  }

  console.log(`Dist SEO check scanned ${htmlFiles.length} html file(s).`);
}

if (mode === "source") {
  checkSource();
} else {
  checkDist();
}

for (const item of warnings) {
  console.warn(`WARN ${item}`);
}

if (errors.length) {
  console.error("\nSearch indexing check failed:\n");

  for (const item of errors) {
    console.error(`- ${item}`);
  }

  process.exit(1);
}

console.log(`Search indexing check passed (${mode})`);
