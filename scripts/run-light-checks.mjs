import { execSync } from "node:child_process";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scripts = pkg.scripts || {};

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", shell: true });
}

for (const name of ["docs:ui:check", "docs:domain:check", "docs:css:check"]) {
  if (scripts[name]) run(`pnpm run ${name}`);
}
