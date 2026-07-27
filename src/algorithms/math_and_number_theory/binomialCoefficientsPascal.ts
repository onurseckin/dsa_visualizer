import type { AlgorithmDefinition, AlgorithmStep, GridCellNode, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface BinomialCoefficientsInput {
  n: number;
  k: number;
}

export const PYTHON_BINOMIAL_COEFFICIENTS_PASCAL_CODE = `
def binomial_coefficient(n: int, k: int) -> int:
    """
    Computes C(n, k) using Pascal's Triangle DP table.
    """
    dp = [[0] * (k + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        for j in range(min(i, k) + 1):
            if j == 0 or j == i:
                dp[i][j] = 1
            else:
                dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j]
    return dp[n][k]
`;

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
    "Binomial coefficients C(n, k) = n! / (k! * (n-k)!) count the number of ways to choose k items from n distinct items without replacement, where order does not matter. Pascal's Triangle builds these coefficients dynamically using the recurrence relation C(n, k) = C(n-1, k-1) + C(n-1, k). This approach avoids direct factorial computation, preventing 64-bit integer overflow during intermediate steps and providing an intuitive 2D grid dynamic programming structure.",
  sections: [
    {
      heading: "Pascal's Recurrence Identity & Core Concept",
      body: "To select k items out of n, consider an arbitrary element x: either we include x in our selection (requiring us to pick k-1 items from the remaining n-1), or we exclude x (requiring us to pick k items from the remaining n-1). Adding these two mutually exclusive choices gives C(n, k) = C(n-1, k-1) + C(n-1, k). Base cases are C(i, 0) = 1 (empty set choice) and C(i, i) = 1 (full set choice).",
    },
    {
      heading: "Systems & Performance Impact",
      body: "Calculating n! / (k! * (n-k)!) directly is fraught with overflow risks, as 21! already exceeds 64-bit integer capacity. By constructing the DP table iteratively using addition only, we maintain arithmetic precision up to the final result limit. Furthermore, row-by-row DP calculation benefits from spatial cache locality, and space complexity can be reduced from O(n * k) to O(k) using a 1D array updated in-place from right to left.",
    },
    {
      heading: "Implementation Nuances & Optimization",
      body: "Because C(n, k) = C(n, n-k), we can optimize computation when k > n/2 by replacing k with n-k. For competitive programming applications with a fixed prime modulus p, precomputing factorials and modular inverses allows O(1) query time per test case, whereas Pascal's Triangle is best suited when queries are dense or modulo arithmetic is not required.",
    },
    {
      heading: "Edge Case & Boundary Analysis",
      body: "Key edge cases include k = 0 (always yields 1), k = n (always yields 1), k > n (yields 0), and n = 0 (yielding C(0,0) = 1). Ensuring loop bounds loop from 0 to n and j from 0 to min(i, k) avoids out-of-bounds table access and waste of computation.",
    },
  ],
  keyTerms: [
    {
      term: "Pascal's Triangle",
      definition:
        "A triangular array of binomial coefficients where each interior cell is the sum of the two numbers directly above it.",
    },
    {
      term: "Combination C(n, k)",
      definition:
        "The number of ways to choose a subset of k unordered elements from a set of n distinct elements.",
    },
    {
      term: "Symmetric Property",
      definition:
        "The mathematical identity C(n, k) = C(n, n-k), reflecting the equivalence of choosing k items to include or n-k items to exclude.",
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
  categories: ["math_and_number_theory"],
  difficulty: "Easy",
  description:
    "Given two non-negative integers n and k, compute the binomial coefficient C(n, k) representing the number of ways to choose k items from n distinct items without regard to order. The algorithm constructs Pascal's Triangle row-by-row using dynamic programming, applying the recurrence relation C(i, j) = C(i-1, j-1) + C(i-1, j) to avoid integer overflow from factorial multiplication.",
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
