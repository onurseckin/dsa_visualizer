import type { AlgorithmDefinition, AlgorithmStep, GridCellNode, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface BinomialCoefficientsInput {
  n: number;
  k: number;
}

export const PYTHON_BINOMIAL_COEFFICIENTS_PASCAL_CODE = `def binomial_coefficient(n: int, k: int) -> int:
    C = [[0] * (k + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        for j in range(min(i, k) + 1):
            if j == 0 or j == i:
                C[i][j] = 1
            else:
                C[i][j] = C[i - 1][j - 1] + C[i - 1][j]
    return C[n][k]`;

export const DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT: BinomialCoefficientsInput = {
  n: 5,
  k: 3,
};

export const generateBinomialCoefficientsPascalSteps = (
  input: BinomialCoefficientsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nVal = Math.min(10, Math.max(0, Math.floor(input.n)));
  const kVal = Math.min(nVal, Math.max(0, Math.floor(input.k)));

  const dp: number[][] = Array.from({ length: nVal + 1 }, () => new Array(kVal + 1).fill(0));

  const createGridSnapshot = (
    activeRow: number | null,
    activeCol: number | null,
    parent1: [number, number] | null = null,
    parent2: [number, number] | null = null,
  ): GridCellNode[][] => {
    const grid: GridCellNode[][] = [];

    for (let r = 0; r <= nVal; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c <= kVal; c++) {
        let state: GridCellNode["state"] = "default";
        const isTarget = r === nVal && c === kVal;

        if (r === activeRow && c === activeCol) {
          state = "active";
        } else if (
          (parent1 && parent1[0] === r && parent1[1] === c) ||
          (parent2 && parent2[0] === r && parent2[1] === c)
        ) {
          state = "compare";
        } else if (dp[r][c] > 0) {
          state = "sorted";
        }

        rowNodes.push({
          row: r,
          col: c,
          distance: dp[r][c],
          state,
          isEnd: isTarget,
        });
      }
      grid.push(rowNodes);
    }
    return grid;
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initializing Pascal's Triangle DP table C[0..${nVal}][0..${kVal}] to compute C(${nVal}, ${kVal}).`,
      why: "We build Pascal's identity C(n, k) = C(n-1, k-1) + C(n-1, k) row by row.",
    },
    primarySnapshot: {
      kind: "grid",
      grid: createGridSnapshot(null, null),
    },
    auxiliaryState: {
      hashMap: {
        "Target Combination": `C(${nVal}, ${kVal})`,
      },
      customState: {
        n: nVal,
        k: kVal,
      },
    },
    variables: {
      n: nVal,
      k: kVal,
    },
  });

  // DP table filling loop
  for (let i = 0; i <= nVal; i++) {
    const maxJ = Math.min(i, kVal);
    for (let j = 0; j <= maxJ; j++) {
      if (j === 0 || j === i) {
        dp[i][j] = 1;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 6,
          explanation: {
            what: `Base case C[${i}][${j}] = 1 (j == 0 or j == i).`,
            why: "Choosing 0 elements or all elements from a set of size i can be done in exactly 1 way.",
          },
          primarySnapshot: {
            kind: "grid",
            grid: createGridSnapshot(i, j),
          },
          auxiliaryState: {
            hashMap: {
              "Cell Value": `C[${i}][${j}] = 1`,
              Reason: j === 0 ? "j == 0 (Empty set choice)" : "j == i (Full set choice)",
            },
            customState: {
              i,
              j,
              val: 1,
            },
          },
          variables: {
            i,
            j,
            val: 1,
          },
        });
      } else {
        const val1 = dp[i - 1][j - 1];
        const val2 = dp[i - 1][j];
        dp[i][j] = val1 + val2;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 8,
          explanation: {
            what: `C[${i}][${j}] = C[${i - 1}][${j - 1}] + C[${i - 1}][${j}] = ${val1} + ${val2} = ${dp[i][j]}.`,
            why: "Pascal's identity: include the element or exclude the element from the selection.",
          },
          primarySnapshot: {
            kind: "grid",
            grid: createGridSnapshot(i, j, [i - 1, j - 1], [i - 1, j]),
          },
          auxiliaryState: {
            hashMap: {
              "Parent C[i-1][j-1]": `${val1}`,
              "Parent C[i-1][j]": `${val2}`,
              "Calculated C[i][j]": `${dp[i][j]}`,
            },
            customState: {
              i,
              j,
              val: dp[i][j],
            },
          },
          variables: {
            i,
            j,
            val: dp[i][j],
          },
        });
      }
    }
  }

  // Final Step
  const ans = dp[nVal][kVal];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Completed Pascal's triangle table! C(${nVal}, ${kVal}) = ${ans}.`,
      why: "Target DP cell evaluated successfully.",
    },
    primarySnapshot: {
      kind: "grid",
      grid: createGridSnapshot(nVal, kVal),
    },
    auxiliaryState: {
      hashMap: {
        "Final Result C(n, k)": `${ans}`,
      },
      customState: {
        result: ans,
      },
    },
    variables: {
      result: ans,
    },
  });

  return steps;
};

export const BINOMIAL_COEFFICIENTS_PASCAL_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Binomial coefficients C(n, k) = n! / (k! * (n-k)!) count the number of ways to choose k items from n items without replacement. Pascal's Triangle builds these coefficients dynamically using C(n, k) = C(n-1, k-1) + C(n-1, k).",
  sections: [
    {
      heading: "Pascal's Recurrence Identity",
      body: "To pick k elements out of n, consider an arbitrary n-th element: either we select it (requiring k-1 choices from remaining n-1) or exclude it (requiring k choices from remaining n-1). Thus C(n,k) = C(n-1,k-1) + C(n-1,k).",
    },
    {
      heading: "Overflow Prevention",
      body: "Using dynamic programming avoids calculating huge factorials like n! directly, preventing integer overflow in intermediate steps.",
    },
  ],
  keyTerms: [
    {
      term: "Pascal's Triangle",
      definition:
        "A triangular array of binomial coefficients where each number is the sum of the two directly above it.",
    },
    {
      term: "Combinations C(n, k)",
      definition: "Number of ways to choose a subset of k elements from a set of n elements.",
    },
  ],
};

export const BINOMIAL_COEFFICIENTS_PASCAL_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines binomial_coefficient(n, k) -> int using Pascal's triangle DP.",
    2: "Initializes 2D table C of size (n + 1) × (k + 1) with 0s.",
    3: "Loops through row i from 0 to n.",
    4: "Loops through col j from 0 to min(i, k).",
    5: "Checks base cases: j == 0 (choose 0 elements) or j == i (choose all elements).",
    6: "Sets base case value C[i][j] = 1.",
    8: "Pascal's identity: C[i][j] = C[i - 1][j - 1] + C[i - 1][j].",
    9: "Returns C[n][k] containing binomial coefficient.",
  },
};

export const binomialCoefficientsPascal: AlgorithmDefinition<BinomialCoefficientsInput> = {
  id: "binomial-coefficients-pascal",
  title: "Binomial Coefficients (Pascal's Triangle)",
  category: "math_and_number_theory",
  difficulty: "Easy",
  description:
    "Computes binomial coefficients C(n, k) by constructing Pascal's Triangle via dynamic programming in O(n * k) time.",
  constraints: ["0 <= k <= n <= 30"],
  examples: [
    {
      kind: "basic",
      title: "Standard Combination C(5, 3)",
      inputDisplay: "n = 5, k = 3",
      outputDisplay: "C(5, 3) = 10",
      input: { n: 5, k: 3 },
      output: "10",
      explanation: "5! / (3! * 2!) = 120 / 12 = 10.",
    },
    {
      kind: "complex",
      title: "Symmetric Property C(6, 2)",
      inputDisplay: "n = 6, k = 2",
      outputDisplay: "C(6, 2) = 15",
      input: { n: 6, k: 2 },
      output: "15",
      explanation: "C(6, 2) = C(6, 4) = 15.",
    },
    {
      kind: "negative",
      title: "Boundary Case C(4, 0)",
      inputDisplay: "n = 4, k = 0",
      outputDisplay: "C(4, 0) = 1",
      input: { n: 4, k: 0 },
      output: "1",
      explanation: "There is exactly 1 way to choose 0 items from 4.",
    },
  ],
  code: PYTHON_BINOMIAL_COEFFICIENTS_PASCAL_CODE,
  timeComplexity: {
    best: "O(N * K)",
    average: "O(N * K)",
    worst: "O(N * K)",
  },
  spaceComplexity: "O(N * K)",
  complexityAnalysis: {
    time: "Fills an (N+1) x (K+1) DP grid, yielding O(N * K) operations.",
    space: "O(N * K) memory to store the 2D grid matrix.",
  },
  topicGuide: BINOMIAL_COEFFICIENTS_PASCAL_TOPIC_GUIDE,
  trivia: BINOMIAL_COEFFICIENTS_PASCAL_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 22",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      section: "22.1 Binomial coefficients",
    },
  ],
  defaultInput: DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT,
  generateSteps: generateBinomialCoefficientsPascalSteps,
};

export default binomialCoefficientsPascal;
