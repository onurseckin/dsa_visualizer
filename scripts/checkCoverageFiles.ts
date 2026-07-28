type CounterMap = Record<string, number>;

interface IstanbulFileCoverage {
  path: string;
  s: CounterMap;
  f: CounterMap;
  b: Record<string, number[]>;
}

const reportPath = new URL("../coverage/coverage-final.json", import.meta.url);
const reportFile = Bun.file(reportPath);

if (!(await reportFile.exists())) {
  console.error("coverage/coverage-final.json is missing; run the coverage suite first.");
  process.exit(1);
}

const report = (await reportFile.json()) as Record<string, IstanbulFileCoverage>;

const hasNoHits = (counters: readonly number[]): boolean =>
  counters.length > 0 && counters.every((count) => count === 0);

const uncoveredFiles = Object.values(report).flatMap((coverage) => {
  const missingMetrics = [
    hasNoHits(Object.values(coverage.s)) ? "statements" : null,
    hasNoHits(Object.values(coverage.f)) ? "functions" : null,
    hasNoHits(Object.values(coverage.b).flat()) ? "branches" : null,
  ].filter((metric): metric is string => metric !== null);

  return missingMetrics.length > 0
    ? [`${coverage.path.replace(`${process.cwd()}/`, "")}: ${missingMetrics.join(", ")}`]
    : [];
});

if (uncoveredFiles.length > 0) {
  console.error("Every executable source file must receive behavioral coverage:");
  uncoveredFiles.forEach((violation) => console.error(`- ${violation}`));
  process.exit(1);
}

console.log(`Per-file coverage floor verified (${Object.keys(report).length} source files).`);
