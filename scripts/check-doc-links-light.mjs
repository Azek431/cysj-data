import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsRoot = path.join(root, "docs");

const externalOldDomains = [
  "cysjdocs.dpdns.org",
  "cysjdocs.pages.dev",
];

const missingFiles = [];
const oldDomainHits = [];

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (rel(full).startsWith("docs/.vitepress/dist")) continue;

      walk(full, output);
      continue;
    }

    if (item.name.endsWith(".md")) {
      output.push(full);
    }
  }

  return output;
}

function normalizeLink(link) {
  return decodeURIComponent(link.trim())
    .replace(/^<|>$/g, "")
    .replace(/#.*$/, "")
    .replace(/\?.*$/, "");
}

function fileCandidates(target) {
  return [
    target,
    `${target}.md`,
    path.join(target, "index.md"),
  ];
}

for (const file of walk(docsRoot)) {
  const text = fs.readFileSync(file, "utf8");
  const relative = rel(file);

  for (const oldDomain of externalOldDomains) {
    if (text.includes(oldDomain)) {
      oldDomainHits.push(`${relative}: ${oldDomain}`);
    }
  }

  const links = [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);

  for (const rawLink of links) {
    if (!rawLink) continue;

    const clean = normalizeLink(rawLink);

    if (
      !clean ||
      clean.startsWith("http") ||
      clean.startsWith("#") ||
      clean.startsWith("/") ||
      clean.startsWith("mailto:") ||
      clean.startsWith("tel:")
    ) {
      continue;
    }

    const relativeTarget = path.resolve(path.dirname(file), clean);
    const docsRootTarget = path.resolve(docsRoot, clean.replace(/^(\.\.\/)+/, "").replace(/^\.\//, ""));

    const candidates = [
      ...fileCandidates(relativeTarget),
      ...fileCandidates(docsRootTarget),
    ];

    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      missingFiles.push(`${relative}: ${rawLink}`);
    }
  }
}

if (oldDomainHits.length) {
  console.error("Docs link guard found old domain issues.");

  console.error("\nOld domain hits:");
  for (const item of oldDomainHits.slice(0, 80)) {
    console.error(`- ${item}`);
  }

  process.exit(1);
}

if (missingFiles.length) {
  console.warn("WARN Docs link guard found possible missing local links.");
  console.warn("WARN These are warnings only and will not block this light check.");

  for (const item of missingFiles.slice(0, 80)) {
    console.warn(`WARN - ${item}`);
  }

  if (missingFiles.length > 80) {
    console.warn(`WARN ...and ${missingFiles.length - 80} more possible missing local links.`);
  }
}

console.log("Docs link guard passed");
