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
    `Offline processing ${queriesInput.length} queries on array of length N = ${n}. Block size S = floor(sqrt(${n})) = ${Math.max(1, Math.floor(Math.sqrt(n)))}.`,
    { n, numQueries: queriesInput.length },
    0,
    -1,
  );

  if (n === 0 || queriesInput.length === 0) {
    addStep(
      6,
      "Input is empty",
      "No queries to process or array is empty.",
      { n, numQueries: queriesInput.length },
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

  addStep(
    10,
    `Sort ${indexedQueries.length} queries by (L // ${blockSize}, R zig-zag)`,
    `Reordered queries into Mo's order. Grouping by left-block index and zig-zagging right-pointer minimizes total two-pointer traversal distance.`,
    {
      sortedQueries: indexedQueries.map((q) => `[${q.L},${q.R}]`).join(" "),
    },
    0,
    -1,
  );

  const ans: number[] = Array(queriesInput.length).fill(0);
  let currL = 0;
  let currR = -1;
  let currSum = 0;

  for (let qIdx = 0; qIdx < indexedQueries.length; qIdx++) {
    const q = indexedQueries[qIdx];
    const { L, R, id } = q;

    addStep(
      14,
      `Processing Query ${qIdx + 1}/${indexedQueries.length}: original Q${id} [${L}..${R}]`,
      `Adjusting active window [${currL}..${currR}] to target query interval [${L}..${R}].`,
      { qIdx: qIdx + 1, originalId: id, targetL: L, targetR: R, currSum },
      currL,
      currR,
      L,
      R,
    );

    // Expand Left
    while (currL > L) {
      currL--;
      currSum += arr[currL];
      addStep(
        17,
        `Expand left pointer to ${currL}: add arr[${currL}] = ${arr[currL]}`,
        `Extending window leftward by including element arr[${currL}]. Running sum is now ${currSum}.`,
        { currL, addedVal: arr[currL], currSum },
        currL,
        currR,
        L,
        R,
      );
    }

    // Expand Right
    while (currR < R) {
      currR++;
      currSum += arr[currR];
      addStep(
        20,
        `Expand right pointer to ${currR}: add arr[${currR}] = ${arr[currR]}`,
        `Extending window rightward by including element arr[${currR}]. Running sum is now ${currSum}.`,
        { currR, addedVal: arr[currR], currSum },
        currL,
        currR,
        L,
        R,
      );
    }

    // Contract Left
    while (currL < L) {
      const removedVal = arr[currL];
      currSum -= removedVal;
      currL++;
      addStep(
        23,
        `Contract left pointer to ${currL}: remove arr[${currL - 1}] = ${removedVal}`,
        `Shrinking window from left by excluding element arr[${currL - 1}]. Running sum is now ${currSum}.`,
        { currL, removedVal, currSum },
        currL,
        currR,
        L,
        R,
      );
    }

    // Contract Right
    while (currR > R) {
      const removedVal = arr[currR];
      currSum -= removedVal;
      currR--;
      addStep(
        26,
        `Contract right pointer to ${currR}: remove arr[${currR + 1}] = ${removedVal}`,
        `Shrinking window from right by excluding element arr[${currR + 1}]. Running sum is now ${currSum}.`,
        { currR, removedVal, currSum },
        currL,
        currR,
        L,
        R,
      );
    }

    ans[id] = currSum;

    addStep(
      27,
      `Query Q${id} [${L}..${R}] sum = ${currSum}`,
      `Window [${currL}..${currR}] matches target range [${L}..${R}]. Store answer ${currSum} for original query index Q${id}.`,
      { queryId: id, L, R, querySum: currSum },
      currL,
      currR,
      L,
      R,
    );
  }

  addStep(
    28,
    "Mo's Algorithm completed",
    `Finished answering all ${queriesInput.length} range queries in O((N + Q) sqrt(N)) total time.`,
    { answers: JSON.stringify(ans) },
    currL,
    currR,
  );

  return steps;
};

export const MO_ALGORITHM_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>Mo's Algorithm</strong> (also known as the Sqrt Query Reordering Technique) processes range queries <strong>offline</strong> by sorting them to minimize total pointer shifts across the array. When single-element additions and removals run in <code>O(1)</code> time, Mo's Algorithm processes <code>Q</code> range queries over an array of size <code>N</code> in <code>O((N + Q) &radic;N)</code> overall time using block size <code>S = &lfloor;&radic;N&rfloor;</code>. It converts a naive <code>O(Q &middot; N)</code> search into a highly efficient <code>O((N + Q) &radic;N)</code> offline algorithm without requiring complex tree structures.</p>",
  sections: [
    {
      heading: "1. Offline Querying & Sqrt Block Sorting",
      body: "<p>Mo's Algorithm requires all queries to be known upfront (offline). The array is divided into virtual blocks of size <code>S = &lfloor;&radic;N&rfloor;</code>. Queries <code>(L, R)</code> are sorted using a custom comparator:</p><ul><li>Primary Key: Left block index <code>&lfloor;L / S&rfloor;</code>.</li><li>Secondary Key: Right endpoint <code>R</code>.</li><li><strong>Zig-Zag Parity Optimization</strong>: Sort <code>R</code> ascending for even blocks and descending for odd blocks to avoid unnecessary pointer backtrack sweeps.</li></ul>",
    },
    {
      heading: "2. Two-Pointer Window Expansion & Contraction",
      body: "<p>We maintain two pointers, <code>currL</code> and <code>currR</code>, defining active window <code>[currL...currR]</code> and running sum <code>currSum</code>. Transitioning to a new query <code>[L, R]</code> requires 4 while-loops:</p><ul><li><code>currL &gt; L</code>: Decrement <code>currL</code>, add element.</li><li><code>currR &lt; R</code>: Increment <code>currR</code>, add element.</li><li><code>currL &lt; L</code>: Remove element, increment <code>currL</code>.</li><li><code>currR &gt; R</code>: Remove element, decrement <code>currR</code>.</li></ul><p>Each step updates the window aggregate state in <code>O(1)</code> time.</p>",
    },
    {
      heading: "3. Mathematical Complexity Proof: O((N + Q) sqrt(N))",
      body: "<p>Why does block sorting achieve <code>O((N + Q) &radic;N)</code> total runtime?</p><ul><li><strong>Left Pointer (currL)</strong>: Moves at most <code>O(&radic;N)</code> per query within a block. Across <code>Q</code> queries, total left moves = <code>O(Q &radic;N)</code>.</li><li><strong>Right Pointer (currR)</strong>: Moves monotonically across array length <code>N</code> per left-block. Across all <code>&approx; &radic;N</code> blocks, total right moves = <code>O(N &radic;N)</code>.</li><li>Total Time: <code>O(Q log Q + (N + Q) &radic;N)</code>.</li></ul>",
    },
    {
      heading: "4. Trade-off Matrix: Mo's Algorithm vs Segment Tree",
      body: "<p>Comparing offline query reordering against dynamic tree structures:</p><ul><li><strong>Query Type</strong>: Mo's is Offline Only versus Segment Tree's Online &amp; Offline capabilities.</li><li><strong>Query Complexity</strong>: Mo's achieves <code>O((N + Q) &radic;N)</code> total versus <code>O(Q log N)</code> for Segment Tree.</li><li><strong>State Flexibility</strong>: Mo's supports complex frequency tables and mode queries easily.</li><li><strong>Updates</strong>: Mo's targets static arrays (or 3D Mo's for updates) vs Segment Tree's <code>O(log N)</code> online updates.</li></ul>",
    },
    {
      heading: "5. Interview Pitfalls & 3D Mo's Extension",
      body: "<ul><li><strong>Offline Constraint</strong>: Mo's Algorithm cannot be used if queries depend on prior online answers.</li><li><strong>3D Mo's Algorithm</strong>: For queries mixed with point updates, add a time dimension <code>t</code>. Block size <code>S = N^(2/3)</code> yields <code>O(N^(5/3))</code> complexity.</li></ul>",
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
        "Sorting queries primarily by left block floor(L / sqrt(N)) and secondarily by right endpoint R.",
    },
    {
      term: "Zig-Zag Parity Optimization",
      definition:
        "Alternating right-pointer sorting order between ascending and descending on adjacent blocks to eliminate backtrack jumps.",
    },
    {
      term: "Two-Pointer Sliding Window",
      definition:
        "Maintaining active range [currL...currR] that expands or contracts incrementally to target query boundaries.",
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
    "<p><strong>Mo's Algorithm</strong> reorders offline range queries using <code>&radic;N</code> block partitioning to minimize pointer movements, answering <code>Q</code> queries in <code>O((N + Q) &radic;N)</code> total time.</p>",
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
