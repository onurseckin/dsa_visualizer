import fs from "fs";
import path from "path";

const dirs = [
  "src/algorithms/ml_vector_search",
  "src/algorithms/ml_tokenization",
  "src/algorithms/ml_attention_geometry"
];

async function main() {
  for (const dir of dirs) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".ts") && !f.endsWith(".spec.ts") && f !== "index.ts");
    console.log(`\n================ ${dir} (${files.length} algorithms) ================`);
    for (const f of files) {
      const p = path.resolve(dir, f);
      const mod = await import(p);
      const algoKey = Object.keys(mod).find(k => mod[k] && mod[k].id && mod[k].generateSteps);
      if (!algoKey) {
        console.log(`- ${f}: COULD NOT LOAD ALGO DEFINITION`);
        continue;
      }
      const algo = mod[algoKey];
      const defaultInput = algo.defaultInput;
      let stepCount = 0;
      try {
        const steps = algo.generateSteps(defaultInput);
        stepCount = steps.length;
      } catch (e: any) {
        console.log(`Error running generateSteps for ${f}: ${e.message}`);
        stepCount = -1;
      }
      const codeLines = algo.code.trim().split("\n").length;
      const lineExps = algo.trivia?.lineExplanations || {};
      const lineExpCount = Object.keys(lineExps).length;
      
      // Check 1-to-1 line explanations covering all lines from 1 to codeLines
      let lineExpsComplete = true;
      for (let i = 1; i <= codeLines; i++) {
        if (!lineExps[i]) {
          lineExpsComplete = false;
          break;
        }
      }
      
      const has20Steps = stepCount >= 20;
      const hasLatexDesc = algo.description && algo.description.includes("$");
      const hasLatexTopic = algo.topicGuide?.overview && algo.topicGuide.overview.includes("$");

      console.log(`- ${f} [${algo.id}]:`);
      console.log(`    steps=${stepCount} (${has20Steps ? ">=20 OK" : "NEED STEPS"})`);
      console.log(`    codeLines=${codeLines}, lineExps=${lineExpCount} (${lineExpsComplete ? "Complete OK" : "NEED LINE EXPS"})`);
      console.log(`    LaTeX in desc/topic: desc=${hasLatexDesc}, topic=${hasLatexTopic}`);
    }
  }
}

main();
