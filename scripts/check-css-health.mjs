import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stylesDir = path.join(root, "docs/.vitepress/theme/styles");
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

if (fs.existsSync(path.join(root, "docs/.vitepress/theme/custom.css"))) {
  fail("custom.css is forbidden; use docs/.vitepress/theme/styles/*.css instead");
}

if (fs.existsSync(stylesDir)) {
  const files = fs.readdirSync(stylesDir).filter((file) => file.endsWith(".css"));
  let total = 0;

  for (const file of files) {
    const full = path.join(stylesDir, file);
    const text = fs.readFileSync(full, "utf8");
    const size = Buffer.byteLength(text);
    total += size;

    if (size > 120 * 1024) fail(`${file}: too large (${Math.round(size / 1024)}KB)`);
    else if (size > 80 * 1024) warn(`${file}: getting large (${Math.round(size / 1024)}KB)`);

    for (const marker of ["Azek431 UI polish start", "Azek431 UI clarity pass start"]) {
      const count = text.split(marker).length - 1;
      if (count > 1) fail(`${file}: duplicated marker "${marker}"`);
    }

    const importantCount = (text.match(/!important/g) || []).length;
    if (importantCount > 160) warn(`${file}: many !important usages (${importantCount})`);

    const blurCount = (text.match(/backdrop-filter/g) || []).length;
    if (blurCount > 40) warn(`${file}: many backdrop-filter usages (${blurCount})`);
  }

  if (total > 180 * 1024) fail(`theme CSS total too large (${Math.round(total / 1024)}KB)`);
  else if (total > 140 * 1024) warn(`theme CSS total is getting large (${Math.round(total / 1024)}KB)`);
}

for (const warning of warnings) console.warn(`WARN ${warning}`);

if (errors.length) {
  console.error("\nCSS health check failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("CSS health check passed");