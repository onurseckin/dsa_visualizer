import type { AlgorithmDefinition, AlgorithmStep, VectorItem, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface CatalanNumbersInput {
  n: number;
}

export const PYTHON_CATALAN_NUMBERS_CODE = `
def catalan_number(n: int) -> int:
    """
    Computes the n-th Catalan number using dynamic programming recurrence.
    """
    C = [0] * (n + 1)
    C[0] = 1
    for i in range(1, n + 1):
        for j in range(i):
            C[i] += C[j] * C[i - 1 - j]
    return C[n]
`;

export const DEFAULT_CATALAN_NUMBERS_INPUT: CatalanNumbersInput = {
  n: 6,
};

export const generateCatalanNumbersSteps = (input: CatalanNumbersInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nVal = Math.min(10, Math.max(0, Math.floor(input.n)));
  const C: number[] = new Array(nVal + 1).fill(0);

  const createVectorSnapshot = (
    activeIdx: number | null,
    jIdx: number | null = null,
    compIdx: number | null = null,
  ) => {
    const vectors: VectorItem[] = C.map((val, idx) => {
      let state: VectorItem["state"] = "default";
      if (idx === activeIdx) {
        state = "active";
      } else if (idx === jIdx || idx === compIdx) {
        state = "compared";
      } else if (idx < (activeIdx ?? 0)) {
        state = "result";
      }

      return {
        id: `C-${idx}`,
        label: `C_${idx}`,
        x: idx * 40,
        y: val,
        subText: `C_${idx} = ${val}`,
        state,
      };
    });

    return {
      kind: "vector" as const,
      vectors,
      planeTitle: "Catalan Sequence DP Vector C[0..n]",
      dimensions: "2d" as const,
    };
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initializing Catalan numbers vector C[0..${nVal}] to compute C_${nVal}.`,
      why: "Catalan numbers count combinatorial structures such as balanced parentheses, Dyck paths, and binary trees.",
    },
    primarySnapshot: createVectorSnapshot(null),
    auxiliaryState: {
      hashMap: {
        "Target Catalan Number": `C_${nVal}`,
        "Vector Size": `${nVal + 1}`,
      },
      customState: {
        n: nVal,
      },
    },
    variables: {
      n: nVal,
    },
  });

  // Base Case
  C[0] = 1;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: "Base case: C[0] = 1.",
      why: "By convention, there is exactly 1 valid empty combinatorial structure.",
    },
    primarySnapshot: createVectorSnapshot(0),
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
      codeLine: 8,
      explanation: {
        what: `Computing Catalan number C[${i}]. Initializing sum = 0.`,
        why: "Convolution formula: C_i = sum_{j=0}^{i-1} (C_j * C_{i-1-j}).",
      },
      primarySnapshot: createVectorSnapshot(i),
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
        codeLine: 10,
        explanation: {
          what: `j = ${j}: Product C[${j}] * C[${comp}] = ${C[j]} * ${C[comp]} = ${product}. Add to C[${i}]: ${prevVal} -> ${C[i]}.`,
          why: "Splitting into left sub-structure size j and right sub-structure size i-1-j.",
        },
        primarySnapshot: createVectorSnapshot(i, j, comp),
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
    codeLine: 11,
    explanation: {
      what: `Computation completed! The ${nVal}-th Catalan number C_${nVal} = ${C[nVal]}.`,
      why: "Target DP index evaluated successfully.",
    },
    primarySnapshot: createVectorSnapshot(nVal),
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
    "Catalan numbers $C_n$ form one of the most celebrated integer sequences in combinatorics, enumerating over 66 distinct categories of geometric and structural objects. The $n$-th Catalan number is given by the closed form $C_n = \\frac{1}{n + 1} \\binom{2n}{n}$ and satisfies the dynamic programming convolution recurrence $C_n = \\sum_{j=0}^{n-1} C_j C_{n-1-j}$ with base case $C_0 = 1$.",
  sections: [
    {
      heading: "Combinatorial Applications & Equivalence",
      body: "Catalan numbers count:\n1. Number of valid well-formed bracket sequences with $n$ pairs of parentheses.\n2. Number of distinct full binary trees with $n$ internal nodes ($n+1$ leaves).\n3. Number of monotonic grid paths from $(0,0)$ to $(n,n)$ that stay on or below the diagonal (Dyck paths).\n4. Number of non-crossing triangulations of a convex polygon with $n+2$ vertices.\n5. Number of non-crossing handshakes among $2n$ people around a circular table.",
    },
    {
      heading: "Recurrence Relation & Convolution Partition",
      body: "The recurrence identity:\n$$C_i = \\sum_{j=0}^{i-1} C_j C_{i-1-j}$$\nreflects a fundamental structural partition: to construct a combinatorial object of size $i$, we fix a root/boundary element and divide the remaining $i-1$ components into a left substructure of size $j$ (having $C_j$ possibilities) and a right substructure of size $i-1-j$ (having $C_{i-1-j}$ possibilities).",
    },
    {
      heading: "Systems & Closed-Form Asymptotics",
      body: "Evaluating Catalan numbers via dynamic programming convolution takes $\\mathcal{O}(n^2)$ time and $\\mathcal{O}(n)$ space. By Stirling's approximation, Catalan numbers grow asymptotically as:\n$$C_n \\sim \\frac{4^n}{n^{3/2} \\sqrt{\\pi}}$$\nFor 32-bit signed integers, $C_n$ overflows at $n = 20$; for 64-bit signed integers, $C_n$ overflows at $n = 36$.",
    },
    {
      heading: "Edge Cases & Boundary Analysis",
      body: "Boundary cases include $n = 0$ ($C_0 = 1$ for the unique empty structure), $n = 1$ ($C_1 = 1$), and prime modular queries where $C_n = \\frac{1}{n+1} \\binom{2n}{n} \\bmod p$ can be computed in $\\mathcal{O}(n)$ time via inverse factorials.",
    },
  ],
  keyTerms: [
    {
      term: "Dyck Path",
      definition:
        "A staircase grid path from $(0,0)$ to $(n,n)$ taking right and up steps that never crosses above the main diagonal.",
    },
    {
      term: "Catalan Recurrence",
      definition:
        "The quadratic convolution identity $C_n = \\sum_{j=0}^{n-1} C_j C_{n-1-j}$ used to compute Catalan numbers via dynamic programming.",
    },
    {
      term: "Full Binary Tree",
      definition:
        "A binary tree where every node has either zero or two children; the count of full binary trees with $n+1$ leaves is $C_n$.",
    },
  ],
};

export const CATALAN_NUMBERS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines catalan_number(n: int) -> int: computes n-th Catalan number $C_n$ via DP.",
    3: "Opening docstring tag.",
    4: "Docstring explaining DP convolution recurrence for Catalan numbers.",
    5: "Closing docstring tag.",
    6: "Initializes DP state vector C of size $n + 1$ filled with 0s.",
    7: "Sets base case $C[0] = 1$ for empty combinatorial structure.",
    8: "Outer loop iterates target index $i$ from 1 to $n$.",
    9: "Inner loop iterates partition index $j$ from 0 to $i - 1$.",
    10: "Accumulates product of left substructure size $j$ ($C[j]$) and right substructure size $i-1-j$ ($C[i-1-j]$).",
    11: "Returns $C[n]$, the $n$-th Catalan number.",
    12: "Empty trailing line for code formatting.",
  },
};

export const catalanNumbers: AlgorithmDefinition<CatalanNumbersInput> = {
  id: "catalan-numbers",
  title: "Catalan Numbers",
  category: "math_and_number_theory",
  categories: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Calculates the $n$-th Catalan number $C_n$ using dynamic programming convolution recurrence in $\\mathcal{O}(n^2)$ time:\n\n$$C_n = \\sum_{j=0}^{n-1} C_j C_{n-1-j}$$\n\n### State Vector Representation\nThe dynamic state is represented as a 1D sequence vector $\\mathbf{C} = (C_0, C_1, \\dots, C_n)^T \\in \\mathbb{Z}^{n+1}$ where entry $C_k$ stores the $k$-th Catalan number.\n\n### Input Parameters\n- `n` ($n \\in \\mathbb{Z}_{\\ge 0}$): The index of the Catalan number to compute.\n\n### Output\n- `int`: The $n$-th Catalan number $C_n$.\n\n### Edge Cases & Constraints\n- Base Case: $C_0 = 1$ (empty set structure).\n- Overflow: $C_n$ exceeds 64-bit integer range for $n > 35$.",
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
    time: "Nested loops compute convolution sum of products for each $i$ from 1 to $N$, taking $\\sum_{i=1}^N i = \\frac{N(N+1)}{2} = \\mathcal{O}(N^2)$ time.",
    space: "Requires $\\mathcal{O}(N)$ memory to store the DP array $C[0..N]$.",
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

