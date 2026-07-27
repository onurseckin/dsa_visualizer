import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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
    if n == 0 or len(queries) == 0:
        return []
    block_size = max(1, int(math.isqrt(n)))
    
    indexed_queries = [(q[0], q[1], i) for i, q in enumerate(queries)]
    indexed_queries.sort(key=lambda q: (q[0] // block_size, q[1] if (q[0] // block_size) % 2 == 0 else -q[1]))

    ans = [0] * len(queries)
    curr_l, curr_r = 0, -1
    curr_sum = 0

    for L, R, q_id in indexed_queries:
        while curr_l > L:
            curr_l -= 1
            curr_sum += arr[curr_l]
        while curr_r < R:
            curr_r += 1
            curr_sum += arr[curr_r]
        while curr_l < L:
            curr_sum -= arr[curr_l]
            curr_l += 1
        while curr_r > R:
            curr_sum -= arr[curr_r]
            curr_r -= 1
        ans[q_id] = curr_sum

    return ans`;

export const DEFAULT_MO_ALGORITHM_INPUT: MoAlgorithmInput = {
  array: [1, 3, 4, 2, 6, 5, 8, 7],
  queries: [
    { left: 0, right: 4 },
    { left: 2, right: 6 },
    { left: 1, right: 3 },
  ],
};

export const generateMoAlgorithmSteps = (input: MoAlgorithmInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arr = [...input.array];
  const n = arr.length;

  const makeElements = (
    currL: number,
    currR: number,
    targetL?: number,
    targetR?: number,
  ): ArrayElement[] => {
    return arr.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      const ptrs: string[] = [];
      if (idx === currL) ptrs.push("currL");
      if (idx === currR) ptrs.push("currR");

      if (currR >= currL && idx >= currL && idx <= currR) {
        state = "active";
      }
      if (targetL !== undefined && targetR !== undefined && idx >= targetL && idx <= targetR) {
        if (state === "default") state = "compare";
      }

      return {
        id: `el-${idx}`,
        value: val,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currL: number,
    currR: number,
    targetL?: number,
    targetR?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(currL, currR, targetL, targetR),
      },
      auxiliaryState: {
        customState: customState ?? {
          arrayLength: String(n),
          currL: String(currL),
          currR: String(currR),
        },
      },
      variables,
    });
  };

  addStep(
    4,
    "Initialize Mo's Algorithm",
    `Offline processing ${input.queries.length} queries on array of length N = ${n}. Block size S = floor(sqrt(${n})) = ${Math.max(1, Math.floor(Math.sqrt(n)))}.`,
    { n, numQueries: input.queries.length },
    0,
    -1,
  );

  if (n === 0 || input.queries.length === 0) {
    addStep(
      6,
      "Input is empty",
      "No queries to process or array is empty.",
      { n, numQueries: input.queries.length },
      0,
      -1,
    );
    return steps;
  }

  const blockSize = Math.max(1, Math.floor(Math.sqrt(n)));
  const indexedQueries = input.queries.map((q, idx) => ({
    L: Math.max(0, Math.min(q.left, n - 1)),
    R: Math.max(0, Math.min(q.right, n - 1)),
    id: idx,
  }));

  // Hilbert / Hilbert curve sort or Block Hilbert sort (Mo's algorithm block order)
  indexedQueries.sort((a, b) => {
    const b1 = Math.floor(a.L / blockSize);
    const b2 = Math.floor(b.L / blockSize);
    if (b1 !== b2) return b1 - b2;
    return b1 % 2 === 0 ? a.R - b.R : b.R - a.R;
  });

  addStep(
    10,
    "Sorted queries by block index (L // block_size, R)",
    `Query execution order optimized to minimize pointer movements: ${indexedQueries.map((q) => `Q${q.id + 1}[${q.L}..${q.R}]`).join(", ")}.`,
    { blockSize, sortedOrder: indexedQueries.map((q) => `Q${q.id + 1}`).join(", ") },
    0,
    -1,
  );

  let currL = 0;
  let currR = -1;
  let currSum = 0;
  const ans: number[] = Array(input.queries.length).fill(0);

  for (let stepQ = 0; stepQ < indexedQueries.length; stepQ++) {
    const { L, R, id } = indexedQueries[stepQ];

    addStep(
      17,
      `Processing Query Q${id + 1}: Range [${L}..${R}]`,
      `Adjusting current window [${currL}..${currR}] to target range [${L}..${R}].`,
      { queryId: id + 1, L, R, currL, currR, currSum },
      currL,
      currR,
      L,
      R,
    );

    // Move left pointer left
    while (currL > L) {
      currL--;
      currSum += arr[currL];
      addStep(
        19,
        `Expand left pointer to currL = ${currL}`,
        `Added arr[${currL}] (${arr[currL]}) to current window sum (${currSum}).`,
        { currL, currR, currSum, addedVal: arr[currL] },
        currL,
        currR,
        L,
        R,
      );
    }

    // Move right pointer right
    while (currR < R) {
      currR++;
      currSum += arr[currR];
      addStep(
        22,
        `Expand right pointer to currR = ${currR}`,
        `Added arr[${currR}] (${arr[currR]}) to current window sum (${currSum}).`,
        { currL, currR, currSum, addedVal: arr[currR] },
        currL,
        currR,
        L,
        R,
      );
    }

    // Move left pointer right
    while (currL < L) {
      currSum -= arr[currL];
      currL++;
      addStep(
        25,
        `Shrink left pointer to currL = ${currL}`,
        `Removed arr[${currL - 1}] (${arr[currL - 1]}) from window sum (${currSum}).`,
        { currL, currR, currSum, removedVal: arr[currL - 1] },
        currL,
        currR,
        L,
        R,
      );
    }

    // Move right pointer left
    while (currR > R) {
      currSum -= arr[currR];
      currR--;
      addStep(
        28,
        `Shrink right pointer to currR = ${currR}`,
        `Removed arr[${currR + 1}] (${arr[currR + 1]}) from window sum (${currSum}).`,
        { currL, currR, currSum, removedVal: arr[currR + 1] },
        currL,
        currR,
        L,
        R,
      );
    }

    ans[id] = currSum;
    addStep(
      30,
      `Saved result for Q${id + 1}: sum([${L}..${R}]) = ${currSum}`,
      `Recorded result for query Q${id + 1}. Current answers array: [${ans.join(", ")}].`,
      { queryId: id + 1, L, R, answer: currSum },
      currL,
      currR,
      L,
      R,
      { answers: JSON.stringify(ans) },
    );
  }

  return steps;
};

export const MO_ALGORITHM_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Mo's Algorithm processes range queries offline by reordering queries in a way that minimizes pointer movements across the array. With block size S = sqrt(N), two pointers currL and currR travel at most O((N + Q) sqrt(N)) total steps.",
  sections: [
    {
      heading: "Offline Query Sorting Strategy",
      body: "Queries (L, R) are sorted primarily by their block index L // S. Queries in the same block are sorted by R. Alternate blocks sort R in ascending and descending order (hilbert/zig-zag optimization) to avoid unnecessary pointer backtracks.",
    },
    {
      heading: "Two-Pointer Range Maintenance",
      body: "Maintaining two pointers currL and currR allows adding or removing one element in O(1) time. As queries are processed, currL shifts by at most O(sqrt(N)) per query and currR shifts monotonically across each block.",
    },
    {
      heading: "Time Complexity Proof",
      body: "The left pointer moves at most O(sqrt(N)) for each of Q queries, contributing O(Q sqrt(N)). The right pointer moves at most O(N) across each of sqrt(N) blocks, contributing O(N sqrt(N)). Total runtime is O((N + Q) sqrt(N)).",
    },
    {
      heading: "Applicability",
      body: "Mo's Algorithm applies to any range query where inserting or deleting an element takes O(1) time, and queries do not involve updates (or updates are handled via 3D Mo's Algorithm).",
    },
  ],
  keyTerms: [
    {
      term: "Offline Querying",
      definition: "Processing all queries after reading them entirely, allowing reordering for efficiency.",
    },
    {
      term: "Mo's Order",
      definition: "Sorting queries by block index (L // S) and then by R to minimize overall pointer displacement.",
    },
  ],
};

export const MO_ALGORITHM_TRIVIA: TriviaMeta = {
  skipLines: [1, 4, 10, 15],
  distractors: [
    "indexed_queries.sort(key=lambda q: (q[0], q[1]))",
    "curr_sum += arr[curr_r]; curr_r -= 1",
    "ans[q_id] = curr_r - curr_l + 1",
  ],
  hints: [
    {
      line: 10,
      hint: "Sort queries primarily by L // block_size and secondarily by R",
    },
    {
      line: 19,
      hint: "Move curr_l left (decrement) and add element to sum",
    },
  ],
  lineExplanations: {
    10: "Order queries offline to achieve O((N + Q) sqrt(N)) bound.",
    19: "Expand window to the left.",
    30: "Record query answer into original query position.",
  },
};

export const moAlgorithm: AlgorithmDefinition<MoAlgorithmInput> = {
  id: "mo-algorithm",
  title: "Mo's Algorithm (Offline Range Queries)",
  category: "advanced_range_queries",
  difficulty: "Hard",
  description:
    "Mo's Algorithm reorders offline range queries using sqrt block partitioning to minimize pointer movements, answering Q queries in O((N + Q) sqrt(N)) total time.",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      inputDisplay: "arr = [1, 3, 4, 2, 6, 5, 8, 7], queries = [[0,4], [2,6], [1,3]]",
      outputDisplay: "Q1[0,4]: 16, Q2[2,6]: 25, Q3[1,3]: 9",
      input: {
        array: [1, 3, 4, 2, 6, 5, 8, 7],
        queries: [
          { left: 0, right: 4 },
          { left: 2, right: 6 },
          { left: 1, right: 3 },
        ],
      },
      output: "Q1[0,4]: 16, Q2[2,6]: 25, Q3[1,3]: 9",
      explanation:
        "Mo's algorithm sorts queries by (L//block_size, R) and shifts pointers currL/currR incrementally.",
    },
    {
      kind: "complex",
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
      chapter: 9,
      section: "9.2 Sqrt decomposition / Mo's algorithm",
      label: "Competitive Programmer's Handbook, Ch 9",
    },
  ],
  defaultInput: DEFAULT_MO_ALGORITHM_INPUT,
  generateSteps: generateMoAlgorithmSteps,
};
