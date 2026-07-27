import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
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
  n: 5,
};

export const generateCatalanNumbersSteps = (input: CatalanNumbersInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nVal = Math.min(10, Math.max(0, Math.floor(input.n)));
  const C: number[] = new Array(nVal + 1).fill(0);

  const createElements = (
    activeIdx: number | null,
    jIdx: number | null = null,
    compIdx: number | null = null,
  ): ArrayElement[] => {
    return C.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      if (idx === activeIdx) {
        state = "active";
      } else if (idx === jIdx || idx === compIdx) {
        state = "compare";
      } else if (idx < (activeIdx ?? 0)) {
        state = "sorted";
      }

      return {
        id: `C-${idx}`,
        value: val,
        state,
        pointers: [`C[${idx}]`],
      };
    });
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initializing Catalan numbers array C[0..${nVal}] to compute C_${nVal}.`,
      why: "Catalan numbers count combinatorial structures such as balanced parentheses and binary trees.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(null),
    },
    auxiliaryState: {
      hashMap: {
        "Target Catalan Number": `C_${nVal}`,
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
    codeLine: 3,
    explanation: {
      what: "Base case: C[0] = 1.",
      why: "By convention, there is 1 valid empty structure.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(0),
    },
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
        what: `Computing Catalan number C[${i}]. Initializing sum = 0.`,
        why: "Formula: C_i = sum_{j=0}^{i-1} (C_j * C_{i-1-j}).",
      },
      primarySnapshot: {
        kind: "array",
        elements: createElements(i),
      },
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
          what: `j = ${j}: Product C[${j}] * C[${comp}] = ${C[j]} * ${C[comp]} = ${product}. Add to C[${i}]: ${prevVal} -> ${C[i]}.`,
          why: "Splitting into left subtree size j and right subtree size i-1-j.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createElements(i, j, comp),
        },
        auxiliaryState: {
          hashMap: {
            "Left Partition C[j]": `C[${j}] = ${C[j]}`,
            "Right Partition C[i-1-j]": `C[${comp}] = ${C[comp]}`,
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
      what: `Computation completed! The ${nVal}-th Catalan number C_${nVal} = ${C[nVal]}.`,
      why: "Target DP index evaluated.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(nVal),
    },
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
    "Catalan numbers C_n form a sequence of natural numbers with numerous application in combinatorics. The n-th Catalan number is given by C_n = (1 / (n + 1)) * (2n choose n) = sum_{j=0}^{n-1} C_j * C_{n-1-j}.",
  sections: [
    {
      heading: "Combinatorial Applications",
      body: "Catalan numbers count: 1) Number of correct bracket expressions with n pairs of parentheses, 2) Number of full binary trees with n+1 leaves, 3) Number of monotonic grid paths from (0,0) to (n,n) not crossing the diagonal (Dyck paths), 4) Number of triangulations of a convex polygon with n+2 sides.",
    },
    {
      heading: "Recurrence Relation",
      body: "The recurrence C_n = sum_{j=0}^{n-1} C_j * C_{n-1-j} splits structures of size n into two independent substructures of sizes j and n-1-j.",
    },
  ],
  keyTerms: [
    {
      term: "Dyck Path",
      definition: "Grid path from (0,0) to (n,n) taking right and up steps that stays on or below the main diagonal.",
    },
    {
      term: "Catalan Sequence",
      definition: "First few terms are 1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862...",
    },
  ],
};

export const CATALAN_NUMBERS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines catalan_number(n) -> int: computes n-th Catalan number.",
    2: "Initializes DP table C of size n + 1 with 0s.",
    3: "Base case: C[0] = 1 for empty structure.",
    4: "Outer loop iterates i from 1 to n.",
    5: "Inner loop iterates j from 0 to i - 1.",
    6: "Accumulates product of left subtree size j (C[j]) and right subtree size i-1-j (C[i-1-j]).",
    7: "Returns C[n], the n-th Catalan number.",
  },
};

export const catalanNumbers: AlgorithmDefinition<CatalanNumbersInput> = {
  id: "catalan-numbers",
  title: "Catalan Numbers",
  category: "math_and_number_theory",
  difficulty: "Medium",
  description:
    "Calculates the n-th Catalan number C_n using dynamic programming recurrence in O(n^2) time. Catalan numbers count balanced parentheses, binary tree structures, and non-crossing grid paths.",
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
    time: "Nested loops compute sum of products for each i from 1 to N, taking 1 + 2 + ... + N = N(N+1)/2 = O(N^2) time.",
    space: "O(N) memory to store the DP array C[0..N].",
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

export default catalanNumbers;
