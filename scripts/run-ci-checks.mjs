import { execSync } from "node:child_process";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scripts = pkg.scripts || {};

function has(name) {
  return Boolean(scripts[name]);
}

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", shell: true });
}

for (const name of ["docs:check", "docs:domain:check", "docs:css:check"]) {
  if (has(name)) run(`pnpm run ${name}`);
}

if (has("docs:build")) run("pnpm run docs:build");
else console.log("\n> skip docs:build: script not found");