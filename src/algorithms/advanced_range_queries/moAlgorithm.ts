import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
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
        id: "el-" + String(idx),
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
    3,
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
    addStep(
      7,
      "Return empty list",
      "Returning [] because input array or query list is empty.",
      { answers: "[]" },
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

  addStep(
    13,
    "Initialize window pointers and answer array",
    `Initial window pointers currL = 0, currR = -1, currSum = 0. Answer array initialized for ${input.queries.length} queries.`,
    { currL, currR, currSum, numQueries: input.queries.length },
    currL,
    currR,
  );

  for (let stepQ = 0; stepQ < indexedQueries.length; stepQ++) {
    const { L, R, id } = indexedQueries[stepQ];

    addStep(
      14,
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
        17,
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
        20,
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
        23,
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
        26,
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
      27,
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

  addStep(
    28,
    "Return query results",
    `All ${indexedQueries.length} range queries processed successfully. Final results array: [${ans.join(", ")}].`,
    { answers: JSON.stringify(ans) },
    currL,
    currR,
  );

  return steps;
};

export const MO_ALGORITHM_TOPIC_GUIDE: TopicGuide = {
  overview:
    "**Mo's Algorithm** (also known as the Sqrt Query Reordering Technique) processes range queries **offline** by sorting them to minimize total pointer shifts across the array. When single-element additions and removals run in $O(1)$ time, Mo's Algorithm processes $Q$ range queries over an array of size $N$ in $O((N + Q) \\sqrt{N})$ overall time using block size $S = \\lfloor \\sqrt{N} \\rfloor$. It converts a naive $O(Q \\cdot N)$ search into a highly efficient $O((N + Q) \\sqrt{N})$ offline algorithm without requiring complex tree structures.",
  sections: [
    {
      heading: "1. Offline Querying & Sqrt Block Sorting",
      body: "Mo's Algorithm requires all queries to be known upfront (offline). The array is divided into virtual blocks of size $S = \\lfloor \\sqrt{N} \\rfloor$. Queries $(L, R)$ are sorted using a custom comparator:\n\n- Primary Key: Left block index $L // S$.\n- Secondary Key: Right endpoint $R$.\n- **Zig-Zag Parity Optimization**: Sort $R$ ascending for even blocks and descending for odd blocks to avoid unnecessary pointer backtrack sweeps.",
    },
    {
      heading: "2. Two-Pointer Window Expansion & Contraction",
      body: "We maintain two pointers, `currL` and `currR`, defining active window $[\text{currL} \\dots \\text{currR}]$ and running sum `currSum`. Transitioning to a new query $[L, R]$ requires $4$ while-loops:\n\n1. `currL > L`: Decrement `currL`, add element.\n2. `currR < R`: Increment `currR`, add element.\n3. `currL < L`: Remove element, increment `currL`.\n4. `currR > R`: Remove element, decrement `currR`.\n\nEach step updates the window aggregate state in $O(1)$ time.",
    },
    {
      heading: "3. Mathematical Complexity Proof: $O((N + Q) \\sqrt{N})$",
      body: "Why does block sorting achieve $O((N + Q) \\sqrt{N})$ total runtime?\n\n- **Left Pointer ($\text{currL}$)**: Moves at most $O(\\sqrt{N})$ per query within a block. Across $Q$ queries, total left moves $= O(Q \\sqrt{N})$.\n- **Right Pointer ($\text{currR}$)**: Moves monotonically across array length $N$ per left-block. Across all $\\approx \\sqrt{N}$ blocks, total right moves $= O(N \\sqrt{N})$.\n- Total Time: $O(Q \\log Q + (N + Q) \\sqrt{N})$.",
    },
    {
      heading: "4. Trade-off Matrix: Mo's Algorithm vs Segment Tree",
      body: "| Feature | Mo's Algorithm | Segment Tree |\n| :--- | :--- | :--- |\n| **Query Type** | Offline Only | Online & Offline |\n| **Query Complexity** | $O((N + Q) \\sqrt{N})$ total | $O(Q \\log N)$ total |\n| **State Flexibility** | Supports complex frequency tables / modes | Requires associative merge |\n| **Updates** | Static array (or 3D Mo's for updates) | $O(\\log N)$ online updates |",
    },
    {
      heading: "5. Interview Pitfalls & 3D Mo's Extension",
      body: "- **Offline Constraint**: Mo's Algorithm cannot be used if queries depend on prior online answers.\n- **3D Mo's Algorithm**: For queries mixed with point updates, add a time dimension $t$. Block size $S = N^{2/3}$ yields $O(N^{5/3})$ complexity.",
    },
  ],
  keyTerms: [
    {
      term: "Offline Querying",
      definition:
        "Collecting all query requests upfront to sort them strategically prior to execution.",
    },
    {
      term: "Mo's Order",
      definition:
        "Sorting queries primarily by left block $L // \\lfloor \\sqrt{N} \\rfloor$ and secondarily by right endpoint $R$.",
    },
    {
      term: "Zig-Zag Parity Optimization",
      definition:
        "Alternating right-pointer sorting order between ascending and descending on adjacent blocks to eliminate backtrack jumps.",
    },
    {
      term: "Two-Pointer Sliding Window",
      definition:
        "Maintaining active range $[\text{currL} \\dots \\text{currR}]$ that expands or contracts incrementally to target query boundaries.",
    },
  ],
};

export const MO_ALGORITHM_TRIVIA: TriviaMeta = {
  skipLines: [2, 11],
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
      line: 15,
      hint: "Move curr_l left (decrement) and add element to sum",
    },
  ],
  lineExplanations: {
    1: "Imports the math module for square root calculations.",
    2: "Blank line separating import statements.",
    3: "Defines mo_algorithm function taking array and offline query list.",
    4: "Computes array length n.",
    5: "Computes number of queries q.",
    6: "Checks for empty input array or empty query list.",
    7: "Returns empty list for zero input.",
    8: "Calculates block size as max(1, floor(sqrt(n))).",
    9: "Attaches original index i to each query (l, r, i).",
    10: "Sorts queries by left block (l // block_size) and zig-zag right endpoint.",
    11: "Blank line separating query setup.",
    12: "Initializes output answer array of size q.",
    13: "Initializes two pointers curr_l=0, curr_r=-1 and running sum curr_sum=0.",
    14: "Loops over reordered queries (l, r, idx).",
    15: "While loop expanding window leftward (curr_l > l).",
    16: "Decrements left pointer curr_l.",
    17: "Adds newly included array element arr[curr_l] to running sum.",
    18: "While loop expanding window rightward (curr_r < r).",
    19: "Increments right pointer curr_r.",
    20: "Adds newly included array element arr[curr_r] to running sum.",
    21: "While loop contracting window from left (curr_l < l).",
    22: "Subtracts excluded array element arr[curr_l] from running sum.",
    23: "Increments left pointer curr_l.",
    24: "While loop contracting window from right (curr_r > r).",
    25: "Subtracts excluded array element arr[curr_r] from running sum.",
    26: "Decrements right pointer curr_r.",
    27: "Stores computed range sum into answer array at original query index idx.",
    28: "Returns complete list of query answers.",
  },
};

export const moAlgorithm: AlgorithmDefinition<MoAlgorithmInput> = {
  id: "mo-algorithm",
  title: "Mo's Algorithm (Offline Range Queries)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "**Mo's Algorithm** reorders offline range queries using $\\sqrt{N}$ block partitioning to minimize pointer movements, answering $Q$ queries in $O((N + Q) \\sqrt{N})$ total time.",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
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
