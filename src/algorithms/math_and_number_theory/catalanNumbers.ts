import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ArrayVisualSnapshot,
  ElementState,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface CatalanNumbersInput {
  n: number;
}

export const PYTHON_CATALAN_NUMBERS_CODE = `def catalan_number(n: int) -> int:
    C = [0] * (n + 1)
    C[0] = 1
    for i in range(1, n + 1):
        for j in range(i):
            C[i] += C[j] * C[i - 1 - j]
    return C[n]`;

export const DEFAULT_CATALAN_NUMBERS_INPUT: CatalanNumbersInput = {
  n: 6,
};

export const generateCatalanNumbersSteps = (input?: CatalanNumbersInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = input ?? DEFAULT_CATALAN_NUMBERS_INPUT;
  const rawN = Number.isFinite(safeInput?.n)
    ? Math.floor(safeInput.n)
    : DEFAULT_CATALAN_NUMBERS_INPUT.n;
  const nVal = Math.min(10, Math.max(0, rawN));
  const C: number[] = new Array(nVal + 1).fill(0);

  const createArraySnapshot = (
    activeIdx: number | null,
    jIdx: number | null = null,
    compIdx: number | null = null,
    computedUpTo: number = -1,
  ): ArrayVisualSnapshot => {
    const elements: ArrayElement[] = C.map((val, idx) => {
      let state: ElementState = "default";
      const pointers: string[] = [];

      if (idx <= computedUpTo) {
        state = "sorted";
      }

      if (idx === jIdx) {
        state = "compare";
        pointers.push("j");
      }
      if (idx === compIdx) {
        state = "compare";
        pointers.push("i-1-j");
      }
      if (idx === activeIdx) {
        state = "active";
        pointers.push("i");
      }

      return {
        id: `C-${idx}`,
        value: val,
        label: `C[${idx}]`,
        state,
        pointers: pointers.length > 0 ? pointers : undefined,
      };
    });

    return {
      kind: "array",
      elements,
    };
  };

  // Step 0: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Calling catalan_number(n = ${nVal}).`,
      why: "Catalan numbers count combinatorial structures such as balanced parentheses, Dyck paths, and binary trees.",
    },
    primarySnapshot: createArraySnapshot(null),
    auxiliaryState: {
      hashMap: {
        "Target Catalan Number": `C_${nVal}`,
        "Array Size": `${nVal + 1}`,
      },
      customState: {
        n: nVal,
      },
    },
    variables: {
      n: nVal,
    },
  });

  // Step 1: Array allocation
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initializing DP array C of size ${nVal + 1} with zeros.`,
      why: "Array C will cache subproblem solutions C[0] through C[${nVal}] for convolution lookup.",
    },
    primarySnapshot: createArraySnapshot(null),
    auxiliaryState: {
      hashMap: {
        "Array Size": `${nVal + 1}`,
      },
      customState: {
        n: nVal,
      },
    },
    variables: {
      n: nVal,
    },
  });

  // Step 2: Base Case
  C[0] = 1;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Setting base case C[0] = 1.",
      why: "By convention, there is exactly 1 valid empty combinatorial structure.",
    },
    primarySnapshot: createArraySnapshot(null, null, null, 0),
    auxiliaryState: {
      hashMap: {
        "Base Case": "C[0] = 1",
      },
      customState: {
        "C[0]": 1,
      },
    },
    variables: {
      "C[0]": 1,
    },
  });

  // DP computation
  for (let i = 1; i <= nVal; i++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Outer loop i = ${i}: Computing Catalan number C[${i}]. Initializing sum C[${i}] = 0.`,
        why: "Summing cross-products C[j] * C[i - 1 - j] across all valid sub-structure partition sizes.",
      },
      primarySnapshot: createArraySnapshot(i, null, null, i - 1),
      auxiliaryState: {
        hashMap: {
          CurrentIndex: `i = ${i}`,
          Formula: `C[${i}] = sum(C[j] * C[${i - 1}-j])`,
        },
        customState: {
          i,
          runningSum: 0,
        },
      },
      variables: {
        i,
        runningSum: 0,
      },
    });

    for (let j = 0; j < i; j++) {
      const comp = i - 1 - j;
      const product = C[j] * C[comp];
      const prevVal = C[i];
      C[i] += product;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 6,
        explanation: {
          what: `Partition j = ${j}: product C[${j}] * C[${comp}] = ${C[j]} * ${C[comp]} = ${product}. Accumulating into C[${i}]: ${prevVal} + ${product} = ${C[i]}.`,
          why: `Pairing a left sub-structure of size j=${j} (C[${j}]=${C[j]}) with a right sub-structure of size ${comp} (C[${comp}]=${C[comp]}).`,
        },
        primarySnapshot: createArraySnapshot(i, j, comp, i - 1),
        auxiliaryState: {
          hashMap: {
            "Left Sub-structure C[j]": `C[${j}] = ${C[j]}`,
            "Right Sub-structure C[i-1-j]": `C[${comp}] = ${C[comp]}`,
            Product: `${product}`,
            "Updated C[i]": `${C[i]}`,
          },
          customState: {
            i,
            j,
            comp,
            product,
            val: C[i],
          },
        },
        variables: {
          i,
          j,
          comp,
          product,
          currentSum: C[i],
        },
      });
    }
  }

  // Final Step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Completed Catalan number evaluation! Returning C[${nVal}] = ${C[nVal]}.`,
      why: `The n-th Catalan number C_${nVal} has been computed using dynamic programming convolution.`,
    },
    primarySnapshot: createArraySnapshot(null, null, null, nVal),
    auxiliaryState: {
      hashMap: {
        "Final Catalan C_n": `${C[nVal]}`,
        "Sequence C[0..n]": C.join(", "),
      },
      customState: {
        result: C[nVal],
      },
    },
    variables: {
      result: C[nVal],
    },
  });

  return steps;
};

export const CATALAN_NUMBERS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>Catalan numbers</strong> <code>C<sub>n</sub></code> form one of the most celebrated integer sequences in combinatorics, enumerating over 66 distinct categories of geometric and structural objects. The <code>n</code>-th Catalan number has explicit closed form <code>C<sub>n</sub> = (1 / (n + 1)) &times; C(2n, n)</code> and obeys the convolution recurrence <code>C<sub>n</sub> = &sum; C<sub>j</sub> &times; C<sub>n-1-j</sub></code> with base case <code>C<sub>0</sub> = 1</code>.</p>",
  sections: [
    {
      heading: "Combinatorial Applications",
      body: "<p>Catalan numbers count diverse combinatorial structures:</p><ul><li><strong>Valid Parentheses:</strong> Well-formed bracket sequences with <code>n</code> pairs.</li><li><strong>Full Binary Trees:</strong> Distinct full binary trees with <code>n</code> internal nodes (and <code>n+1</code> leaves).</li><li><strong>Dyck Paths:</strong> Monotonic grid paths from <code>(0,0)</code> to <code>(n,n)</code> staying below the main diagonal.</li><li><strong>Polygon Triangulations:</strong> Non-crossing triangulations of a convex polygon with <code>n+2</code> vertices.</li><li><strong>Non-crossing Handshakes:</strong> Valid pairings among <code>2n</code> points on a circle.</li></ul>",
    },
    {
      heading: "Convolution Recurrence Derivation",
      body: "<p>The identity <code>C<sub>i</sub> = &sum; C<sub>j</sub> &times; C<sub>i-1-j</sub></code> models structural partitioning: to build an object of size <code>i</code>, fix a root or boundary element and divide the remaining <code>i-1</code> units into a left sub-structure of size <code>j</code> (having <code>C<sub>j</sub></code> arrangements) and a right sub-structure of size <code>i-1-j</code> (having <code>C<sub>i-1-j</sub></code> arrangements).</p>",
    },
    {
      heading: "Complexity & Integer Overflow",
      body: "<p>Evaluating <code>C<sub>n</sub></code> via 2D DP loops runs in <code>O(n<sup>2</sup>)</code> time and <code>O(n)</code> space. Asymptotically, Catalan numbers grow as <code>C<sub>n</sub> &approx; 4<sup>n</sup> / (n<sup>3/2</sup> &radic;&pi;)</code>. In 64-bit integer arithmetic, <code>C<sub>n</sub></code> overflows beyond <code>n = 35</code>.</p>",
    },
    {
      heading: "Boundary Conditions",
      body: "<p>The base case <code>C<sub>0</sub> = 1</code> accounts for the unique empty structure. Single prime queries can evaluate <code>C<sub>n</sub> = (1 / (n+1)) &times; C(2n, n) mod p</code> in <code>O(n)</code> time using inverse factorials.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Dyck Path",
      definition:
        "A staircase grid path from (0,0) to (n,n) taking right and up steps that never crosses above the main diagonal.",
    },
    {
      term: "Catalan Recurrence",
      definition:
        "The quadratic convolution identity C_n = sum(C_j * C_{n-1-j}) used to compute Catalan numbers via dynamic programming.",
    },
    {
      term: "Full Binary Tree",
      definition:
        "A binary tree where every node has either zero or two children; the count of full binary trees with n+1 leaves is C_n.",
    },
  ],
};

export const CATALAN_NUMBERS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines catalan_number(n: int) -> int: entry point for Catalan number DP computation.",
    2: "Initializes DP state array C of size n + 1 filled with zeros.",
    3: "Sets base case C[0] = 1 for the unique empty combinatorial structure.",
    4: "Outer loop iterates target subproblem index i from 1 to n.",
    5: "Inner loop iterates partition index j from 0 to i - 1.",
    6: "Accumulates product of left substructure size j (C[j]) and right substructure size i-1-j (C[i-1-j]).",
    7: "Returns C[n], the n-th Catalan number.",
  },
};

export const catalanNumbers: AlgorithmDefinition<CatalanNumbersInput> = {
  id: "catalan-numbers",
  title: "Catalan Numbers",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Calculates the <code>n</code>-th <strong>Catalan number</strong> <code>C<sub>n</sub></code> using dynamic programming convolution recurrence in <code>O(n<sup>2</sup>)</code> time:</p><p><code>C<sub>n</sub> = &sum; C<sub>j</sub> &times; C<sub>n-1-j</sub></code> (for <code>j</code> from <code>0</code> to <code>n-1</code>)</p><h3>State Representation</h3><p>The DP state is stored as a 1D array <code>C[0 ... n]</code> where entry <code>C[k]</code> holds the <code>k</code>-th Catalan number.</p><h3>Input Parameters</h3><ul><li><code>n</code>: Index of the Catalan number to compute.</li></ul><h3>Output</h3><ul><li><code>int</code>: The <code>n</code>-th Catalan number <code>C<sub>n</sub></code>.</li></ul>",
  constraints: ["0 <= n <= 25"],
  examples: [
    {
      kind: "basic",
      title: "n = 5 Parentheses Pairs",
      inputDisplay: "n = 5",
      outputDisplay: "C_5 = 42",
      input: { n: 5 },
      output: "42",
      explanation: "There are 42 valid bracket expressions containing 5 pairs of parentheses.",
    },
    {
      kind: "complex",
      title: "n = 6 Binary Trees",
      inputDisplay: "n = 6",
      outputDisplay: "C_6 = 132",
      input: { n: 6 },
      output: "132",
      explanation: "There are 132 distinct unlabeled binary trees with 6 nodes.",
    },
    {
      kind: "negative",
      title: "n = 0 Base Case",
      inputDisplay: "n = 0",
      outputDisplay: "C_0 = 1",
      input: { n: 0 },
      output: "1",
      explanation: "By definition, C_0 = 1 (1 way for 0 items/empty set).",
    },
  ],
  code: PYTHON_CATALAN_NUMBERS_CODE,
  timeComplexity: {
    best: "O(N^2)",
    average: "O(N^2)",
    worst: "O(N^2)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Nested loops compute convolution sum of products for each i from 1 to N, taking O(N^2) time.",
    space: "Requires O(N) memory to store the DP array C[0..N].",
  },
  topicGuide: CATALAN_NUMBERS_TOPIC_GUIDE,
  trivia: CATALAN_NUMBERS_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 22",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      section: "22.2 Catalan numbers",
    },
  ],
  defaultInput: DEFAULT_CATALAN_NUMBERS_INPUT,
  generateSteps: generateCatalanNumbersSteps,
};
