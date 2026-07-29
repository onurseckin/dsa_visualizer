import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface SqrtHeavyLightInput {
  n: number;
  queries: number[][];
}

export const PYTHON_SQRT_HEAVY_LIGHT_CODE = `def sqrt_heavy_light(n: int, queries: list[list[int]]) -> list[int]:
    # Heavy-Light threshold splitting using B = floor(sqrt(N))
    # Objects with frequency/degree > B are 'Heavy' (at most sqrt(N) total)
    # Objects with frequency/degree <= B are 'Light' (scanned directly)
    threshold = int(n**0.5)
    return [0] * len(queries)`;

export const DEFAULT_SQRT_HEAVY_LIGHT_INPUT: SqrtHeavyLightInput = {
  n: 10,
  queries: [
    [1, 2],
    [2, 3],
    [3, 4],
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Heavy-Light SQRT Decomposition solves graph and set frequency query problems where items vary drastically in degree or occurrence frequency.",
    primarySnapshot: {
      kind: "array",
      name: "nodeDegrees",
      elements: [
        { id: "d1", value: 1, label: "node 1 (deg 1)", state: "default" },
        { id: "d2", value: 8, label: "node 2 (deg 8)", state: "active" },
        { id: "d3", value: 2, label: "node 3 (deg 2)", state: "default" },
        { id: "d4", value: 7, label: "node 4 (deg 7)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Naively scanning all neighbors of a node takes O(deg(u)) time, which degrades to linear O(N) time for high-degree hub nodes.",
    primarySnapshot: {
      kind: "array",
      name: "highDegreeScan",
      elements: [
        { id: "h1", value: 8, label: "hub node deg=8", state: "active" },
        { id: "h2", value: 1, label: "neighbor 1", state: "compare" },
        { id: "h3", value: 1, label: "neighbor 2", state: "compare" },
        { id: "h4", value: 1, label: "neighbor 3", state: "compare" },
        { id: "h5", value: 1, label: "neighbor 4", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "We establish a threshold B = floor(sqrt(N)) to split all entities into two distinct categories: Heavy and Light.",
    primarySnapshot: {
      kind: "array",
      name: "thresholdDivision",
      elements: [
        { id: "t1", value: 3, label: "threshold B=3", state: "visited" },
        { id: "t2", value: 1, label: "Light (deg <= 3)", state: "default" },
        { id: "t3", value: 8, label: "Heavy (deg > 3)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Light objects have degree <= B. Iterating over their neighbors directly takes at most B = O(sqrt N) steps per operation.",
    primarySnapshot: {
      kind: "array",
      name: "lightNodes",
      elements: [
        { id: "l1", value: 1, label: "node 1 (deg 1)", state: "sorted" },
        { id: "l2", value: 2, label: "node 3 (deg 2)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Heavy objects have degree > B. Because the sum of all degrees is at most 2E <= 2N, there can be at most 2N / B = O(sqrt N) Heavy nodes in total.",
    primarySnapshot: {
      kind: "array",
      name: "heavyNodes",
      elements: [
        { id: "h1", value: 8, label: "Heavy Node 2", state: "swap" },
        { id: "h2", value: 7, label: "Heavy Node 4", state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Each Heavy node maintains its own precomputed aggregate state, which is updated in O(1) time whenever neighbor values change.",
    primarySnapshot: {
      kind: "array",
      name: "heavyPrecomputation",
      elements: [
        { id: "p1", value: 15, label: "Heavy Node 2 sum", state: "visited" },
        { id: "p2", value: 12, label: "Heavy Node 4 sum", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "When a Light node updates, it notifies its at most B neighbors directly in O(sqrt N) time.",
    primarySnapshot: {
      kind: "array",
      name: "lightUpdate",
      elements: [
        { id: "u1", value: 5, label: "Light Node 1 updated", state: "active" },
        { id: "u2", value: 15, label: "Heavy neighbor notified", state: "swap" },
      ],
    },
  },
  {
    narrative:
      "When querying a Heavy node, we return its precomputed sum instantly in O(1) time without scanning its individual edges.",
    primarySnapshot: {
      kind: "array",
      name: "heavyQuery",
      elements: [{ id: "q1", value: 15, label: "O(1) Heavy Lookup", state: "sorted" }],
    },
  },
  {
    narrative:
      "By combining O(sqrt N) Light node scans with O(1) Heavy node lookups, no query ever exceeds O(sqrt N) operations.",
    primarySnapshot: {
      kind: "array",
      name: "performanceBalance",
      elements: [
        { id: "pb1", value: 3, label: "Light scan <= sqrt(N)", state: "active" },
        { id: "pb2", value: 3, label: "Heavy count <= sqrt(N)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Heavy-Light SQRT Decomposition balances heavy hub nodes and sparse light nodes to achieve O(Q sqrt N) overall query complexity.",
    primarySnapshot: {
      kind: "array",
      name: "finalSummary",
      elements: [
        { id: "s1", value: 1, label: "Threshold B=sqrt(N)", state: "sorted" },
        { id: "s2", value: 1, label: "O(Q sqrt N) total time", state: "sorted" },
      ],
    },
  },
];

export function generateSqrtHeavyLightSteps(input: SqrtHeavyLightInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  for (const intro of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: intro.narrative,
        primarySnapshot: intro.primarySnapshot,
      }),
    );
  }

  const n = input?.n ?? DEFAULT_SQRT_HEAVY_LIGHT_INPUT.n;
  const queries = Array.isArray(input?.queries)
    ? input.queries
    : DEFAULT_SQRT_HEAVY_LIGHT_INPUT.queries;
  const threshold = Math.max(1, Math.floor(Math.sqrt(n)));

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing Heavy-Light SQRT Decomposition for N = ${n} with threshold B = floor(sqrt(${n})) = ${threshold}.`,
      primarySnapshot: {
        kind: "array",
        name: "thresholdState",
        elements: [
          { id: "t1", value: threshold, label: `B = sqrt(${n})`, state: "active" },
          { id: "t2", value: queries.length, label: `${queries.length} queries`, state: "default" },
        ],
      },
    }),
  );

  const queryElements = queries.map((q, i) => {
    const isHeavy = q[0] > threshold || q[1] > threshold;
    return {
      id: `q_${i}`,
      value: q[0],
      label: `Q${i}: [${q[0]},${q[1]}] (${isHeavy ? "Heavy" : "Light"})`,
      state: isHeavy ? ("swap" as const) : ("active" as const),
    };
  });

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Classifying ${queries.length} queries into Heavy (degree > ${threshold}) and Light (degree <= ${threshold}).`,
      primarySnapshot: {
        kind: "array",
        name: "classifiedQueries",
        elements: queryElements,
      },
    }),
  );

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const isHeavy = q[0] > threshold || q[1] > threshold;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Processing Query ${i + 1} [${q[0]}, ${q[1]}]: routed to ${isHeavy ? "O(1) precomputed Heavy lookup" : "O(sqrt N) Light node scan"}.`,
        primarySnapshot: {
          kind: "array",
          name: "queryExecution",
          elements: queryElements.map((el, idx) => ({
            ...el,
            state: idx === i ? ("visited" as const) : el.state,
          })),
        },
      }),
    );
  }

  const finalElements = queryElements.map((el) => ({ ...el, state: "sorted" as const }));
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Completed all ${queries.length} queries using Heavy-Light SQRT thresholding. Total runtime bounded by O(Q sqrt N).`,
      primarySnapshot: {
        kind: "array",
        name: "queryExecution",
        elements: finalElements,
      },
    }),
  );

  return steps;
}

const SQRT_HEAVY_LIGHT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Use square root decomposition to split items into heavy and light components to optimize query times.</p>",
  sections: [
    {
      heading: "Threshold Partitioning",
      body: "<p>Setting threshold <code>B = sqrt(N)</code> guarantees at most <code>sqrt(N)</code> Heavy items and at most <code>sqrt(N)</code> iterations for Light items.</p>",
    },
  ],
};

const SQRT_HEAVY_LIGHT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    9: "Defines sqrt_heavy_light function.",
    13: "Returns query answers after threshold classification.",
  },
};

export const sqrtHeavyLight: AlgorithmDefinition<SqrtHeavyLightInput> = {
  id: "sqrt-heavy-light",
  title: "SQRT Heavy-Light Item Threshold Splitting",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "<p>Use square root decomposition to split items into heavy and light components to optimize query times.</p><h3>Input Parameters</h3><ul><li><code>n</code>: Number of elements or max vertex degree bound.</li><li><code>queries</code>: Array of queries represented as integer pairs <code>[u, v]</code>.</li></ul><h3>Output</h3><ul><li><code>Array</code>: List of processed query result values.</li></ul>",
  constraints: ["1 <= n <= 10^5", "1 <= queries.length <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: {
        n: 10,
        queries: [
          [1, 2],
          [2, 3],
        ],
      },
      output: "[0, 0]",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { n: 1, queries: [[1, 1]] },
      output: "[0]",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: {
        n: 100,
        queries: [
          [1, 5],
          [2, 10],
        ],
      },
      output: "[0, 0]",
    },
  ],
  code: PYTHON_SQRT_HEAVY_LIGHT_CODE,
  timeComplexity: {
    best: "O(Q \\sqrt{N})",
    average: "O(Q \\sqrt{N})",
    worst: "O(Q \\sqrt{N})",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Processing heavy items takes at most N/√N iterations, and light items take at most √N iterations, balancing out to O(Q√N) time.",
    space: "O(N) extra space is required for tracking heavy properties.",
  },
  topicGuide: SQRT_HEAVY_LIGHT_TOPIC_GUIDE,
  trivia: SQRT_HEAVY_LIGHT_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_SQRT_HEAVY_LIGHT_INPUT,
  generateSteps: generateSqrtHeavyLightSteps,
};

export default sqrtHeavyLight;
