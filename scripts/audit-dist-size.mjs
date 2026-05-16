import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const dist = path.join(root, "docs", ".vitepress", "dist");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) out.push(...walk(full));
    else if (item.isFile()) out.push(full);
  }

  return out;
}

function format(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

if (!fs.existsSync(dist)) {
  console.log("未找到 docs/.vitepress/dist。请先执行 pnpm run docs:build 后再审计体积。");
  process.exit(0);
}

const files = walk(dist).map((file) => {
  const buf = fs.readFileSync(file);
  const gzip = zlib.gzipSync(buf);
  const rel = path.relative(dist, file).replaceAll("\\", "/");

  return {
    rel,
    size: buf.length,
    gzip: gzip.length,
    ext: path.extname(file).toLowerCase() || "(none)",
  };
});

const total = files.reduce((sum, file) => sum + file.size, 0);
const totalGzip = files.reduce((sum, file) => sum + file.gzip, 0);

const byExt = new Map();

for (const file of files) {
  const current = byExt.get(file.ext) || { count: 0, size: 0, gzip: 0 };
  current.count += 1;
  current.size += file.size;
  current.gzip += file.gzip;
  byExt.set(file.ext, current);
}

console.log("");
console.log("VitePress 构建体积审计");
console.log("======================");
console.log(`文件数：${files.length}`);
console.log(`总大小：${format(total)}`);
console.log(`Gzip 后：${format(totalGzip)}`);

console.log("");
console.log("按类型统计：");

[...byExt.entries()]
  .sort((a, b) => b[1].size - a[1].size)
  .forEach(([ext, item]) => {
    console.log(
      `${ext.padEnd(8)} ${String(item.count).padStart(4)} files  ${format(item.size).padStart(10)}  gzip ${format(item.gzip).padStart(10)}`
    );
  });

console.log("");
console.log("最大的 20 个文件：");

files
  .sort((a, b) => b.size - a.size)
  .slice(0, 20)
  .forEach((file, i) => {
    console.log(
      `${String(i + 1).padStart(2)}. ${format(file.size).padStart(10)}  gzip ${format(file.gzip).padStart(10)}  ${file.rel}`
    );
  });

const bigJs = files.filter((file) => file.ext === ".js" && file.size > 500 * 1024);

if (bigJs.length > 0) {
  console.log("");
  console.log("注意：发现超过 500KB 的 JS 文件：");

  for (const file of bigJs) {
    console.log(`- ${format(file.size)} ${file.rel}`);
  }
}
