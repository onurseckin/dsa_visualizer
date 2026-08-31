import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { checkModularity, currentBaseline } from "./checker.ts";

const repoRoot = resolve(__dirname, "../..");
const report = await checkModularity({
  repoRoot,
  mode: "strict",
  source: "tree",
});
const baseline = currentBaseline(report.violations);
const targetPath = resolve(repoRoot, "scripts/modularity/baseline/index.json");
await writeFile(targetPath, JSON.stringify(baseline, null, 2) + "\n", "utf-8");
console.log(
  `Successfully updated modularity baseline at ${targetPath} with ${baseline.violations.length} entries!`,
);
