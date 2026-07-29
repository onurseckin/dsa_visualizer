import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { ALGORITHMS, ALGORITHM_REGISTRY } from "../../algorithms/registry";
import { TOPIC_CATALOG } from "../../curriculum/topics";
import { ML_INFRA_TREE_PLACEMENTS } from "../../components/knowledge-graph/mlInfraTree";
import { getLearningItem, LEARNING_ITEMS, LEARNING_ITEM_REGISTRY } from "../registry";
import { getLearningItemPlayground } from "../types";

const RETIRED_ML_DIRECTORIES = [
  "ml_attention_geometry",
  "ml_autograd_dags",
  "ml_convolutions",
  "ml_distributed_systems",
  "ml_gemm_roofline",
  "ml_graph_compilers",
  "ml_hardware_kernels",
  "ml_infra",
  "ml_llm_serving",
  "ml_precision_quantization",
  "ml_recurrent_gates",
  "ml_tensor_algebra",
  "ml_tokenization",
  "ml_tree_ensembles",
  "ml_vector_search",
] as const;

const topicTrack = new Map(TOPIC_CATALOG.map((topic) => [topic.id, topic.track]));
const targetMlTopicIds = new Set(ML_INFRA_TREE_PLACEMENTS.map(({ topicId }) => topicId));
const targetMlItems = LEARNING_ITEMS.filter((item) =>
  item.topicIds.some((topicId) => targetMlTopicIds.has(topicId)),
);
const retiredIds = readRetiredIds();

describe("clean-break target catalog", () => {
  it("enrolls exactly 88 DSA implementations plus 69 ML items", () => {
    expect(ALGORITHMS).toHaveLength(88);
    expect(
      ALGORITHMS.every((algorithm) =>
        algorithm.topicIds.every((topicId) => topicTrack.get(topicId) === "dsa"),
      ),
    ).toBe(true);
    expect(targetMlItems).toHaveLength(69);
    expect(LEARNING_ITEMS).toHaveLength(157);
    expect(Object.keys(ALGORITHM_REGISTRY)).toHaveLength(88);
    expect(Object.keys(LEARNING_ITEM_REGISTRY)).toHaveLength(157);
  });

  it("backs every required and elective ML topic with exactly three complementary items", () => {
    expect(ML_INFRA_TREE_PLACEMENTS).toHaveLength(23);
    expect(ML_INFRA_TREE_PLACEMENTS.filter(({ family }) => family !== "electives")).toHaveLength(
      15,
    );
    expect(ML_INFRA_TREE_PLACEMENTS.filter(({ family }) => family === "electives")).toHaveLength(8);

    for (const { topicId } of ML_INFRA_TREE_PLACEMENTS) {
      const items = targetMlItems.filter((item) => item.topicIds.includes(topicId));
      expect(items).toHaveLength(3);
      expect(new Set(items.map((item) => item.assessment.kind)).size).toBeGreaterThanOrEqual(
        topicId === "ml_platform_capstone" ? 1 : 2,
      );
    }
  });

  it("gives every active item an authored executable playground", () => {
    for (const item of LEARNING_ITEMS) {
      const playground = getLearningItemPlayground(item);
      expect(playground).toBeDefined();
      expect(playground?.starterCode).not.toBe(playground?.code);
      expect(playground?.execution.cases.length).toBeGreaterThanOrEqual(3);
      expect(playground?.execution.outputContract?.length).toBeGreaterThan(20);
    }
  });

  it("removes all 232 audited legacy ML IDs and their implementation directories", () => {
    expect(retiredIds).toHaveLength(232);
    expect(new Set(retiredIds).size).toBe(232);
    for (const id of retiredIds) {
      expect(ALGORITHM_REGISTRY[id]).toBeUndefined();
      expect(getLearningItem(id)).toBeUndefined();
    }

    for (const directory of RETIRED_ML_DIRECTORIES) {
      expect(existsSync(resolve(process.cwd(), "src/algorithms", directory))).toBe(false);
    }
  });
});

function readRetiredIds(): string[] {
  const csv = readFileSync(
    resolve(process.cwd(), "research/ml-infra-curriculum/current-problem-ledger.csv"),
    "utf8",
  );
  return csv
    .trim()
    .split("\n")
    .slice(1)
    .map((row) => row.split(",", 1)[0]!)
    .filter(Boolean);
}
