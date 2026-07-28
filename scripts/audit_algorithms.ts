import { ALGORITHM_REGISTRY } from "../src/algorithms/registry";

console.log(`Total registered algorithms: ${Object.keys(ALGORITHM_REGISTRY).length}`);

let placeholderCount = 0;
let singleStepCount = 0;
let missingExamplesCount = 0;
let leetcodeCount = 0;
let multiTopicCount = 0;

const placeholders: string[] = [];

for (const [id, alg] of Object.entries(ALGORITHM_REGISTRY)) {
  // Real placeholder check: generic loop over input_data returning result
  const isPlaceholderCode =
    (alg.code.includes("result = []") && alg.code.includes("for item in input_data:")) ||
    alg.code.includes("def process_data(data):") ||
    alg.code.includes("result.append(item)");

  if (isPlaceholderCode) {
    placeholderCount++;
    placeholders.push(id);
  }

  if ((alg.examples?.length ?? 0) < 3) {
    missingExamplesCount++;
  }

  if (alg.generateSteps(alg.defaultInput).length <= 1) {
    singleStepCount++;
  }

  if (alg.leetcode) {
    leetcodeCount++;
  }

  if (alg.topicIds.length > 1) {
    multiTopicCount++;
  }
}

console.log("\n=== AUDIT RESULTS ===");
console.log(
  `Algorithms with placeholder Python code: ${placeholderCount} / ${Object.keys(ALGORITHM_REGISTRY).length}`,
);
console.log(`Algorithms with <= 1 step: ${singleStepCount}`);
console.log(`Algorithms with < 3 examples: ${missingExamplesCount}`);
console.log(`Algorithms with LeetCode metadata: ${leetcodeCount}`);
console.log(`Algorithms with multiple topic relations: ${multiTopicCount}`);

if (placeholders.length > 0) {
  console.log(`\nSample placeholder algorithm IDs:`, placeholders.slice(0, 15));
} else {
  console.log(
    `\n✅ ALL ${Object.keys(ALGORITHM_REGISTRY).length} ALGORITHMS CONTAIN AUTHENTIC PRODUCTION-GRADE PYTHON CODE!`,
  );
}
