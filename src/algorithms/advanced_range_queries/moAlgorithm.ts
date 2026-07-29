import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MoQuery {
  left: number;
  right: number;
}

export interface MoAlgorithmInput {
  array: number[];
  queries: MoQuery[];
}

export const MO_ALGORITHM_CODE = `import math

def mo_algorithm(arr: list[int], queries: list[tuple[int, int]]) -> list[int]:
    n = len(arr)
    q = len(queries)
    if n == 0 or q == 0:
        return []
    block_size = max(1, int(math.isqrt(n)))
    indexed_queries = [(l, r, i) for i, (l, r) in enumerate(queries)]
    indexed_queries.sort(key=lambda x: (x[0] // block_size, x[1] if (x[0] // block_size) % 2 == 0 else -x[1]))

    ans = [0] * q
    curr_l, curr_r, curr_sum = 0, -1, 0
    for l, r, idx in indexed_queries:
        while curr_l > l:
            curr_l -= 1
            curr_sum += arr[curr_l]
        while curr_r < r:
            curr_r += 1
            curr_sum += arr[curr_r]
        while curr_l < l:
            curr_sum -= arr[curr_l]
            curr_l += 1
        while curr_r > r:
            curr_sum -= arr[curr_r]
            curr_r -= 1
        ans[idx] = curr_sum
    return ans`;

export const DEFAULT_MO_ALGORITHM_INPUT: MoAlgorithmInput = {
  array: [1, 3, 4, 2, 6, 5, 8, 7],
  queries: [
    { left: 0, right: 4 },
    { left: 2, right: 6 },
    { left: 1, right: 3 },
    { left: 0, right: 7 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Offline range query problems give a batch of Q queries [L, R] over an array where answers can be computed in any convenient order.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 1, state: "default" },
        { id: "e1", value: 3, state: "default" },
        { id: "e2", value: 4, state: "default" },
        { id: "e3", value: 2, state: "default" },
        { id: "e4", value: 6, state: "default" },
        { id: "e5", value: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Processing queries in naive input order causes two window pointers (currL and currR) to move back and forth randomly across the entire array in O(N) time per query.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 1, label: "currL", state: "active" },
        { id: "e1", value: 3, state: "active" },
        { id: "e2", value: 4, state: "active" },
        { id: "e3", value: 2, state: "active" },
        { id: "e4", value: 6, label: "currR", state: "active" },
        { id: "e5", value: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Mo's Algorithm optimizes offline query execution by reordering queries to strictly minimize total pointer travel distance.",
    primarySnapshot: {
      kind: "array",
      name: "queryOrder",
      elements: [
        { id: "q1", value: 0, label: "Q1 [0..4]", state: "visited" },
        { id: "q2", value: 1, label: "Q3 [1..3]", state: "active" },
        { id: "q3", value: 2, label: "Q2 [2..6]", state: "compare" },
        { id: "q4", value: 3, label: "Q4 [0..7]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "The array of size N is logically partitioned into blocks of size B = floor(sqrt(N)).",
    primarySnapshot: {
      kind: "array",
      name: "blocks",
      elements: [
        { id: "b0", value: 1, label: "block 0", state: "active" },
        { id: "b1", value: 3, label: "block 0", state: "active" },
        { id: "b2", value: 4, label: "block 1", state: "visited" },
        { id: "b3", value: 2, label: "block 1", state: "visited" },
        { id: "b4", value: 6, label: "block 2", state: "default" },
        { id: "b5", value: 5, label: "block 2", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Queries [L, R] are sorted primarily by left-block index L / B, and secondarily by right boundary R.",
    primarySnapshot: {
      kind: "array",
      name: "queryOrder",
      elements: [
        { id: "q1", value: 0, label: "L/B = 0", state: "visited" },
        { id: "q2", value: 1, label: "L/B = 0", state: "visited" },
        { id: "q3", value: 2, label: "L/B = 1", state: "active" },
        { id: "q4", value: 3, label: "L/B = 2", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Odd-even block sorting toggles R ordering (ascending for even blocks, descending for odd blocks) so currR snakes smoothly back and forth.",
    primarySnapshot: {
      kind: "array",
      name: "queryOrder",
      elements: [
        { id: "q1", value: 0, label: "R asc (block 0)", state: "visited" },
        { id: "q2", value: 1, label: "R desc (block 1)", state: "swap" },
        { id: "q3", value: 2, label: "R asc (block 2)", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "For all queries sharing the same left block, currL moves at most O(sqrt N) steps per query.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 1, label: "step 1", state: "compare" },
        { id: "e1", value: 3, label: "currL", state: "active" },
        { id: "e2", value: 4, label: "step 2", state: "compare" },
        { id: "e3", value: 2, state: "default" },
        { id: "e4", value: 6, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Meanwhile, currR moves monotonically in one direction across the array, taking O(N) total steps per block.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 1, state: "default" },
        { id: "e1", value: 3, state: "default" },
        { id: "e2", value: 4, label: "currR ->", state: "active" },
        { id: "e3", value: 2, label: "currR ->", state: "active" },
        { id: "e4", value: 6, label: "currR ->", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Summing sqrt(N) blocks with O(N) right pointer steps and Q queries with O(sqrt N) left pointer steps yields O((N + Q) sqrt N) overall runtime.",
    primarySnapshot: {
      kind: "array",
      name: "complexitySummary",
      elements: [
        { id: "c1", value: 0, label: "L moves: Q * sqrt(N)", state: "visited" },
        { id: "c2", value: 0, label: "R moves: N * sqrt(N)", state: "visited" },
        { id: "c3", value: 0, label: "Total: O((N+Q)sqrt(N))", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Window state (e.g. running range sum) updates incrementally in O(1) time as pointers shrink or expand by single array steps.",
    primarySnapshot: {
      kind: "array",
      name: "windowState",
      elements: [
        { id: "w1", value: 1, label: "[currL..currR]", state: "active" },
        { id: "w2", value: 3, label: "[currL..currR]", state: "active" },
        { id: "w3", value: 4, label: "[currL..currR]", state: "active" },
        { id: "w4", value: 8, label: "sum = 8", state: "sorted" },
      ],
    },
  },
];

export const generateMoAlgorithmSteps = (input: MoAlgorithmInput): AlgorithmStep[] => {
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

  const safeInput = {
    array: Array.isArray(input?.array) ? input.array : DEFAULT_MO_ALGORITHM_INPUT.array,
    queries: Array.isArray(input?.queries) ? input.queries : DEFAULT_MO_ALGORITHM_INPUT.queries,
  };
  const arr = [...safeInput.array];
  const queriesInput = safeInput.queries;
  const n = arr.length;

  const makeElements = (
    currL: number,
    currR: number,
    targetL?: number,
    targetR?: number,
    overrideState?: ArrayElement["state"],
  ): ArrayElement[] => {
    return arr.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      const ptrs: string[] = [];
      if (idx === currL) ptrs.push("currL");
      if (idx === currR) ptrs.push("currR");

      if (currR >= currL && idx >= currL && idx <= currR) {
        state = overrideState ?? "active";
      }
      if (targetL !== undefined && targetR !== undefined && idx >= targetL && idx <= targetR) {
        if (state === "default") state = "compare";
      }

      return {
        id: "el-" + String(idx),
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });
  };

  const addWalkthroughStep = (
    narrative: string,
    currL: number,
    currR: number,
    targetL?: number,
    targetR?: number,
    overrideState?: ArrayElement["state"],
  ) => {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative,
        primarySnapshot: {
          kind: "array",
          name: "moArray",
          elements: makeElements(currL, currR, targetL, targetR, overrideState),
        },
      }),
    );
  };

  addWalkthroughStep(
    `Initializing Mo's Algorithm for array of size ${n} and ${queriesInput.length} queries. Block size B = floor(sqrt(${n})) = ${Math.max(1, Math.floor(Math.sqrt(n)))}.`,
    0,
    -1,
  );

  if (n === 0 || queriesInput.length === 0) {
    addWalkthroughStep(
      "Input array or query list is empty, so no offline query steps can be performed.",
      0,
      -1,
    );
    return steps;
  }

  const blockSize = Math.max(1, Math.floor(Math.sqrt(n)));
  const indexedQueries = queriesInput.map((q, idx) => ({
    L: Math.max(0, Math.min(q.left, n - 1)),
    R: Math.max(0, Math.min(q.right, n - 1)),
    id: idx,
  }));

  indexedQueries.sort((a, b) => {
    const b1 = Math.floor(a.L / blockSize);
    const b2 = Math.floor(b.L / blockSize);
    if (b1 !== b2) return b1 - b2;
    return b1 % 2 === 0 ? a.R - b.R : b.R - a.R;
  });

  const queryOrderDesc = indexedQueries.map((q) => `Q${q.id}[${q.L}..${q.R}]`).join(", ");
  addWalkthroughStep(
    `Sorted ${indexedQueries.length} queries into Mo's order (grouped by L // ${blockSize} with zig-zag R): ${queryOrderDesc}.`,
    0,
    -1,
    0,
    n - 1,
  );

  const ans: number[] = Array(queriesInput.length).fill(0);
  let currL = 0;
  let currR = -1;
  let currSum = 0;

  for (let qIdx = 0; qIdx < indexedQueries.length; qIdx++) {
    const q = indexedQueries[qIdx];
    const { L, R, id } = q;

    addWalkthroughStep(
      `Processing query ${qIdx + 1}/${indexedQueries.length} (original Q${id} [${L}..${R}]): adjusting current window [${currL}..${currR}] to target range.`,
      currL,
      currR,
      L,
      R,
    );

    while (currL > L) {
      currL--;
      currSum += arr[currL];
      addWalkthroughStep(
        `Expanded window left to index ${currL} (added arr[${currL}] = ${arr[currL]}, running sum = ${currSum}).`,
        currL,
        currR,
        L,
        R,
      );
    }
    while (currR < R) {
      currR++;
      currSum += arr[currR];
      addWalkthroughStep(
        `Expanded window right to index ${currR} (added arr[${currR}] = ${arr[currR]}, running sum = ${currSum}).`,
        currL,
        currR,
        L,
        R,
      );
    }
    while (currL < L) {
      currSum -= arr[currL];
      addWalkthroughStep(
        `Contracted window left from index ${currL} (removed arr[${currL}] = ${arr[currL]}, running sum = ${currSum}).`,
        currL + 1,
        currR,
        L,
        R,
      );
      currL++;
    }
    while (currR > R) {
      currSum -= arr[currR];
      addWalkthroughStep(
        `Contracted window right from index ${currR} (removed arr[${currR}] = ${arr[currR]}, running sum = ${currSum}).`,
        currL,
        currR - 1,
        L,
        R,
      );
      currR--;
    }

    ans[id] = currSum;
    addWalkthroughStep(
      `Pointers arrived at target interval [${currL}..${currR}]. Recorded answer for original Q${id} [${L}..${R}] = ${currSum}.`,
      currL,
      currR,
      undefined,
      undefined,
      "visited",
    );
  }

  const finalElements = makeElements(0, n - 1).map((el) => ({ ...el, state: "sorted" as const }));
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `All ${queriesInput.length} queries completed successfully in Mo's order. Final answers: [${ans.map((v, i) => `Q${i}=${v}`).join(", ")}].`,
      primarySnapshot: {
        kind: "array",
        name: "moArray",
        elements: finalElements,
      },
    }),
  );

  return steps;
};

const MO_ALGORITHM_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>Mo's Algorithm</strong> reorders offline range queries using <code>&radic;N</code> block partitioning to minimize pointer movements, answering <code>Q</code> queries in <code>O((N + Q) &radic;N)</code> total time.</p>",
  sections: [
    {
      heading: "Offline Reordering",
      body: "<p>By grouping queries into blocks of size <code>sqrt(N)</code>, left pointer moves are bounded by <code>O(sqrt N)</code> per query while right pointer moves are monotonic within each block.</p>",
    },
  ],
};

const MO_ALGORITHM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    16: "Defines mo_algorithm function.",
    23: "Sorts queries by left block index and zig-zag right index.",
  },
};

export const moAlgorithm: AlgorithmDefinition<MoAlgorithmInput> = {
  id: "mo-algorithm",
  title: "Mo's Algorithm (Offline Range Queries)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "<p><strong>Mo's Algorithm</strong> reorders offline range queries using <code>&radic;N</code> block partitioning to minimize pointer movements, answering <code>Q</code> queries in <code>O((N + Q) &radic;N)</code> total time.</p><h3>Input Parameters</h3><ul><li><code>array</code>: Initial numerical sequence.</li><li><code>queries</code>: Array of range queries <code>[left, right]</code>.</li></ul><h3>Output</h3><ul><li><code>int / Array</code>: Answer for each offline range query.</li></ul>",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Basic Example",
      inputDisplay: "arr = [1, 3, 4, 2, 6, 5, 8, 7], queries = [[0,4], [2,6], [1,3], [0,7]]",
      outputDisplay: "Q1[0,4]: 16, Q2[2,6]: 25, Q3[1,3]: 9, Q4[0,7]: 36",
      input: {
        array: [1, 3, 4, 2, 6, 5, 8, 7],
        queries: [
          { left: 0, right: 4 },
          { left: 2, right: 6 },
          { left: 1, right: 3 },
          { left: 0, right: 7 },
        ],
      },
      output: "Q1[0,4]: 16, Q2[2,6]: 25, Q3[1,3]: 9, Q4[0,7]: 36",
      explanation:
        "Mo's algorithm sorts queries by (L//block_size, R) and shifts pointers currL/currR incrementally.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Complex Edge Case",
      inputDisplay: "arr = [5, 1, 2, 7, 3, 9, 4, 8, 6, 0], queries = [[0,9], [1,8], [2,7], [3,6]]",
      outputDisplay: "Q1[0,9]: 45, Q2[1,8]: 40, Q3[2,7]: 33, Q4[3,6]: 21",
      input: {
        array: [5, 1, 2, 7, 3, 9, 4, 8, 6, 0],
        queries: [
          { left: 0, right: 9 },
          { left: 1, right: 8 },
          { left: 2, right: 7 },
          { left: 3, right: 6 },
        ],
      },
      output: "Q1[0,9]: 45, Q2[1,8]: 40, Q3[2,7]: 33, Q4[3,6]: 21",
      explanation: "Concentric nested queries highlight smooth pointer contraction across blocks.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Failing / Boundary Case",
      inputDisplay: "arr = [100], queries = [[0,0]]",
      outputDisplay: "Q1[0,0]: 100",
      input: {
        array: [100],
        queries: [{ left: 0, right: 0 }],
      },
      output: "Q1[0,0]: 100",
      explanation: "Single query on single element array N=1; pointers immediately converge on 0.",
    },
  ],
  code: MO_ALGORITHM_CODE,
  timeComplexity: {
    best: "O((n + q) sqrt n)",
    average: "O((n + q) sqrt n)",
    worst: "O((n + q) sqrt n)",
  },
  spaceComplexity: "O(n + q)",
  complexityAnalysis: {
    time: "Sorting queries takes O(q log q). Left pointer moves O(sqrt n) per query, right pointer moves O(n) per block. Overall runtime is O((n + q) sqrt n).",
    space: "Requires O(n) space for the array and O(q) space to store queries and answers.",
  },
  topicGuide: MO_ALGORITHM_TOPIC_GUIDE,
  trivia: MO_ALGORITHM_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 27,
      section: "27.2 Mo's algorithm",
      label: "Competitive Programmer's Handbook, Ch 9",
    },
  ],
  defaultInput: DEFAULT_MO_ALGORITHM_INPUT,
  generateSteps: generateMoAlgorithmSteps,
};

export default moAlgorithm;
