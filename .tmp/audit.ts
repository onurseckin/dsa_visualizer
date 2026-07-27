import { ALGORITHM_REGISTRY } from "../src/algorithms/registry";
import fs from "fs";
import path from "path";

const targetCategories = ["ml_tensor_algebra", "ml_gemm_roofline"];

// Also check files in src/algorithms/ml_tensor_algebra/ and src/algorithms/ml_gemm_roofline/
const tensorDir = path.resolve("src/algorithms/ml_tensor_algebra");
const gemmDir = path.resolve("src/algorithms/ml_gemm_roofline");

const tensorFiles = fs.readdirSync(tensorDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".spec.ts") && f !== "index.ts");
const gemmFiles = fs.readdirSync(gemmDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".spec.ts") && f !== "index.ts");

console.log(`Tensor files (${tensorFiles.length}):`, tensorFiles);
console.log(`GEMM files (${gemmFiles.length}):`, gemmFiles);

interface Finding {
  id: string;
  category: string;
  title: string;
  pythonLineCount: number;
  outOfBounds: Array<{ stepIndex: number; codeLine: number; inputLabel: string }>;
  linesUsed: Set<number>;
  stepsCountDefault: number;
  exampleStepCounts: number[];
  issues: string[];
}

const findings: Finding[] = [];

for (const [id, algo] of Object.entries(ALGORITHM_REGISTRY)) {
  if (!targetCategories.includes(algo.category)) continue;

  const pythonCode = algo.code;
  const lines = pythonCode.split("\n");
  const N = lines.length;

  const finding: Finding = {
    id,
    category: algo.category,
    title: algo.title,
    pythonLineCount: N,
    outOfBounds: [],
    linesUsed: new Set<number>(),
    stepsCountDefault: 0,
    exampleStepCounts: [],
    issues: [],
  };

  const inputsToTest: Array<{ label: string; input: any }> = [
    { label: "defaultInput", input: algo.defaultInput },
    ...(algo.examples || []).map((ex, idx) => ({
      label: `example[${idx}]: ${ex.title}`,
      input: ex.input,
    })),
  ];

  for (let i = 0; i < inputsToTest.length; i++) {
    const { label, input } = inputsToTest[i];
    try {
      const steps = algo.generateSteps(input);
      if (i === 0) {
        finding.stepsCountDefault = steps.length;
      } else {
        finding.exampleStepCounts.push(steps.length);
      }
      for (const s of steps) {
        finding.linesUsed.add(s.codeLine);
        if (s.codeLine < 1 || s.codeLine > N) {
          finding.outOfBounds.push({
            stepIndex: s.stepIndex,
            codeLine: s.codeLine,
            inputLabel: label,
          });
        }
      }
    } catch (err) {
      finding.issues.push(`Error generating steps for ${label}: ${err}`);
    }
  }

  if (finding.linesUsed.size <= 1 && finding.stepsCountDefault > 1) {
    finding.issues.push(`Stagnant codeLine: only ${finding.linesUsed.size} unique codeLine used across ${finding.stepsCountDefault} steps.`);
  }

  if (finding.outOfBounds.length > 0) {
    finding.issues.push(`Out of bounds codeLine: ${finding.outOfBounds.length} occurrences (N=${N}).`);
  }

  findings.push(finding);
}

console.log(`\n=== DETAILED AUDIT FOR ${findings.length} ALGORITHMS ===\n`);

let failCount = 0;
for (const f of findings) {
  const status = f.issues.length > 0 ? "❌ FAIL" : "✅ PASS";
  console.log(`[${status}] ${f.id} (${f.category}) - Python lines: ${f.pythonLineCount}`);
  console.log(`  Lines executed: [${Array.from(f.linesUsed).sort((a, b) => a - b).join(", ")}] (${f.linesUsed.size}/${f.pythonLineCount})`);
  if (f.issues.length > 0) {
    failCount++;
    for (const issue of f.issues) {
      console.log(`  -> ${issue}`);
    }
    if (f.outOfBounds.length > 0) {
      console.log(`  -> Details:`, f.outOfBounds);
    }
  }
}

console.log(`\nSummary: ${findings.length - failCount}/${findings.length} PASSED, ${failCount} FAILED.`);
