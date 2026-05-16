import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs");

let failed = false;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        ["node_modules", ".vitepress", "dist", "site-dist", ".git"].includes(
          entry.name,
        )
      )
        continue;
      out.push(...walk(abs));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(abs);
    }
  }

  return out;
}

for (const file of walk(docsDir)) {
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) continue;

  const lines = match[1].split(/\r?\n/);
  const seen = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:/);
    if (!keyMatch) continue;

    const key = keyMatch[1];

    if (seen.has(key)) {
      failed = true;
      console.log(`DUPLICATE ${key}`);
      console.log(`  file: ${path.relative(root, file)}`);
      console.log(`  first frontmatter line: ${seen.get(key) + 2}`);
      console.log(`  again frontmatter line: ${i + 2}`);
      console.log("");
    } else {
      seen.set(key, i);
    }
  }
}

if (failed) {
  console.log("Result: duplicated frontmatter keys found");
  process.exit(1);
}

console.log("Result: frontmatter ok");
