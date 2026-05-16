import fs from "node:fs";
import { execSync } from "node:child_process";

const requiredFiles = [
  "docs/.vitepress/theme/index.ts",
  "docs/.vitepress/theme/Layout.vue",
  "docs/.vitepress/theme/components/PageInfo.vue",
  "docs/.vitepress/theme/components/PageActions.vue",
  "docs/.vitepress/theme/styles/cysj-pro.css",
  "docs/public/_headers",
  "docs/.vitepress/theme/styles/cysj-performance.css",
  "docs/.vitepress/theme/styles/cysj-ambient.css",
  "docs/.vitepress/theme/styles/cysj-ultimate.css",
  "docs/public/llms.txt",
  "docs/public/robots.txt",
];

const forbiddenFiles = [
  "docs/.vitepress/theme/custom.css",
  "docs/.vitepress/theme/styles/premium-ui.css",
  "docs/.vitepress/theme/styles/polish.css",
  "docs/.vitepress/theme/styles/polish-v3.css",
  "docs/.vitepress/theme/styles/polish-v4.css",
  "docs/.vitepress/theme/styles/minimal-doc-ui.css",
  "docs/.vitepress/theme/styles/page-meta-compact.css",
  "docs/public/sitemap.xml",
];

let failed = false;

console.log("CYSJ Docs UI check\n");

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`OK ${file}`);
  } else {
    console.log(`MISS ${file}`);
    failed = true;
  }
}

for (const file of forbiddenFiles) {
  if (fs.existsSync(file)) {
    console.log(`FORBIDDEN ${file}`);
    failed = true;
  }
}

try {
  const tracked = execSync(
    "git ls-files docs/.vitepress/dist docs/.vitepress/cache docs/.vitepress/.temp site-dist node_modules",
    { encoding: "utf8" },
  ).trim();

  if (tracked) {
    console.log("\nWARN generated files are tracked by git:");
    console.log(tracked);
    failed = true;
  } else {
    console.log("\nOK generated files are not tracked by git");
  }
} catch {
  console.log("\nSKIP git tracked files check");
}

if (failed) {
  process.exitCode = 1;
  console.log("\nResult: need fixing");
} else {
  console.log("\nResult: all good");
}



