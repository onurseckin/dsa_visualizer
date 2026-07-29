import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface EuclidGcdInput {
  nums: number[];
}

export const PYTHON_EUCLID_GCD_CODE = `class Solution:
    def __init__(self):
        pass

    def findGCD(self, nums: list[int]) -> int:
        a, b = min(nums), max(nums)
        while b != 0:
            a, b = b, a % b
        return a`;

export const DEFAULT_EUCLID_GCD_INPUT: EuclidGcdInput = {
  nums: [2, 5, 6, 9, 10],
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "The Greatest Common Divisor gcd(a, b) of two integers is the largest positive integer that divides both a and b without leaving a remainder.",
      rows: [["48", "18", "-", "-", "-", "Initial Pair"]],
    },
    {
      narrative:
        "Testing all numbers sequentially from min(a, b) down to 1 takes linear time O(min(a, b)), which is far too slow for 64-bit integers.",
      rows: [["48", "18", "-", "-", "-", "Try 18, 17, 16..."]],
    },
    {
      narrative:
        "Geometrically, finding gcd(a, b) is equivalent to tiling a rectangle of width a and height b using the largest possible square tiles of size g x g without overlap.",
      rows: [["48", "18", "18 x 18", "2 tiles", "12", "Rectangle 48x18"]],
    },
    {
      narrative:
        "Euclid's key mathematical identity proves that any common divisor of a and b also divides their difference a - b, allowing large pairs to be reduced.",
      rows: [["30", "18", "18 x 18", "1 tile", "12", "Subtraction a - b"]],
    },
    {
      narrative:
        "Replacing repeated subtraction with the modulo operation remainder = a mod b accelerates reduction by jumping directly to the smallest equivalent pair.",
      rows: [["48", "18", "18 x 18", "q = 2", "12", "r = 48 mod 18 = 12"]],
    },
    {
      narrative:
        "Each step fits q square tiles of size b x b into the rectangle, leaving a smaller remainder rectangle of size r x b to tile in the next iteration.",
      rows: [["18", "12", "12 x 12", "q = 1", "6", "Remainder 12x18"]],
    },
    {
      narrative:
        "By the Halving Theorem, every two modulo reductions cut the larger dimension by at least half, guaranteeing logarithmic convergence.",
      rows: [["12", "6", "6 x 6", "q = 2", "0", "Halving Bound"]],
    },
    {
      narrative:
        "When the remainder reaches 0, the rectangle tiles perfectly with tiles of size b x b, so variable b contains the exact greatest common divisor.",
      rows: [["6", "0", "6 x 6", "-", "0", "GCD = 6 (Tile Exact)"]],
    },
    {
      narrative:
        "Lamé's Theorem proves that consecutive Fibonacci numbers represent the worst-case input for Euclid's algorithm, taking maximum quotient steps.",
      rows: [["987", "610", "610 x 610", "q = 1", "377", "Fibonacci Pair"]],
    },
    {
      narrative:
        "The Euclidean algorithm executes in O(log min(a, b)) time and O(1) auxiliary space, making it the fundamental building block of number theory.",
      rows: [["O(log min)", "O(1) Space", "Square Tiling", "Optimal", "0", "Logarithmic Bound"]],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "euclid_tiling_matrix",
        rows: data.rows.length,
        cols: 6,
        cells: data.rows.flatMap((row, rIdx) =>
          row.map((val, cIdx) => ({
            row: rIdx,
            col: cIdx,
            value: val,
            label: `r${rIdx}c${cIdx}`,
            state: cIdx === 4 ? ("active" as const) : ("default" as const),
          })),
        ),
        rowHeaders: ["State"],
        colHeaders: [
          "Width (a)",
          "Height (b)",
          "Tile Size",
          "Tile Count (q)",
          "Remainder (a mod b)",
          "Geometric Status",
        ],
      },
    }),
  );
};

export const generateEuclidGcdSteps = (input: EuclidGcdInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawInput = input as unknown;
  const sourceNums = Array.isArray(rawInput) ? rawInput : input?.nums;
  const nums =
    Array.isArray(sourceNums) && sourceNums.length > 0
      ? sourceNums.map((value) => Math.abs(Math.floor(value)))
      : DEFAULT_EUCLID_GCD_INPUT.nums;
  let currentA = Math.min(...nums);
  let currentB = Math.max(...nums);
  const initialA = currentA;
  const initialB = currentB;

  const history: { a: number; b: number; q: number; r: number; status: string }[] = [];

  const createMatrixSnapshot = (activeRowIdx: number | null, isFinished: boolean = false) => {
    const displayRows =
      history.length === 0 ? [{ a: currentA, b: currentB, q: 0, r: 0, status: "Init" }] : history;
    const cells: MatrixCellItem[] = [];

    displayRows.forEach((row, r) => {
      const rowVals = [
        row.a,
        row.b,
        row.b > 0 ? `${row.b} x ${row.b}` : "-",
        row.q > 0 ? `${row.q}` : "-",
        row.r,
        row.status,
      ];

      rowVals.forEach((val, c) => {
        let state: MatrixCellItem["state"] = "default";
        if (isFinished && r === displayRows.length - 1) {
          state = "sorted";
        } else if (r === activeRowIdx) {
          state = c === 4 ? "active" : c === 3 ? "compare" : "visited";
        } else if (r < (activeRowIdx ?? 0)) {
          state = "visited";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: `r${r}c${c}`,
          state,
        });
      });
    });

    return {
      kind: "matrix" as const,
      name: "euclid_tiling_matrix",
      rows: displayRows.length,
      cols: 6,
      cells,
      rowHeaders: displayRows.map((_, idx) => `Step ${idx + 1}`),
      colHeaders: [
        "Width (a)",
        "Height (b)",
        "Tile Size",
        "Tile Count (q)",
        "Remainder (a mod b)",
        "Geometric Status",
      ],
    };
  };

  history.push({
    a: currentA,
    b: currentB,
    q: currentB > 0 ? Math.floor(currentA / currentB) : 0,
    r: currentB > 0 ? currentA % currentB : 0,
    status: `Initial ${currentA}x${currentB} rectangle`,
  });

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize geometric rectangle reduction for width a = ${currentA} and height b = ${currentB}.`,
      primarySnapshot: createMatrixSnapshot(0),
    }),
  );

  if (currentB === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Height b is already 0, so rectangle width a = ${currentA} is the greatest common divisor gcd(${initialA}, ${initialB}) = ${currentA}.`,
        primarySnapshot: createMatrixSnapshot(0, true),
      }),
    );
    return steps;
  }

  let stepCount = 0;
  while (currentB !== 0) {
    const q = Math.floor(currentA / currentB);
    const remainder = currentA % currentB;

    if (stepCount > 0) {
      history.push({
        a: currentA,
        b: currentB,
        q,
        r: remainder,
        status: `Tile with ${q} square(s) of size ${currentB}x${currentB}`,
      });
    } else {
      history[0].q = q;
      history[0].r = remainder;
      history[0].status = `Tile with ${q} square(s) of size ${currentB}x${currentB}`;
    }

    const currentStepIdx = history.length - 1;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `We tile the ${currentA}x${currentB} rectangle with ${q} square tile(s) of size ${currentB}x${currentB}, leaving remainder dimension ${currentA} mod ${currentB} = ${remainder}.`,
        primarySnapshot: createMatrixSnapshot(currentStepIdx),
      }),
    );

    currentA = currentB;
    currentB = remainder;
    stepCount++;
  }

  history.push({
    a: currentA,
    b: 0,
    q: 0,
    r: 0,
    status: `Remainder 0! Tiles perfectly with ${currentA}x${currentA} square`,
  });

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `The remainder is 0, meaning the rectangle tiles perfectly with squares of size ${currentA}x${currentA}. The final Greatest Common Divisor is gcd(${initialA}, ${initialB}) = ${currentA}.`,
      primarySnapshot: createMatrixSnapshot(history.length - 1, true),
    }),
  );

  return steps;
};

const EUCLID_GCD_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The Euclidean algorithm computes the greatest common divisor gcd(a, b) of two integers by repeatedly replacing pair (a, b) with (b, a mod b) until b becomes zero.</p>",
  sections: [
    {
      heading: "Geometric Tiling Model",
      body: "<p>Finding gcd(a, b) corresponds to tiling a rectangle of size a x b using the largest possible square tiles of size g x g without overlapping.</p>",
    },
    {
      heading: "Mathematical Foundation",
      body: "<p>Since any common divisor d of a and b must also divide a - q*b = a mod b, we have gcd(a, b) = gcd(b, a mod b).</p>",
    },
  ],
  keyTerms: [
    {
      term: "Greatest Common Divisor",
      definition:
        "The largest positive integer that divides both integers without leaving a remainder.",
    },
    {
      term: "Geometric Tiling",
      definition: "Covering an a x b rectangle with identical g x g squares without overlap.",
    },
  ],
};

const EUCLID_GCD_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const euclidGcd: AlgorithmDefinition<EuclidGcdInput> = {
  id: "euclid-gcd",
  title: "Euclidean Algorithm (GCD)",
  topicIds: ["math_and_number_theory"],
  difficulty: "Easy",
  description:
    "<p>Given an integer array <code>nums</code>, return the greatest common divisor of its smallest and largest values using Euclid's algorithm.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>nums</code>: Array of positive integers.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: The greatest common divisor of <code>min(nums)</code> and <code>max(nums)</code>.</li></ul>",
  constraints: ["2 <= nums.length <= 1000", "1 <= nums[i] <= 1000"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nums = [2, 5, 6, 9, 10]",
      outputDisplay: "2",
      title: "Smallest and Largest Values",
      input: { nums: [2, 5, 6, 9, 10] },
      output: "2",
      explanation: "The smallest and largest values are 2 and 10, whose GCD is 2.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [7, 5, 6, 8, 3]",
      outputDisplay: "1",
      title: "Coprime Extremes",
      input: { nums: [7, 5, 6, 8, 3] },
      output: "1",
      explanation: "The smallest and largest values are 3 and 8, which are coprime.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [3, 3]",
      outputDisplay: "3",
      title: "Equal Values",
      input: { nums: [3, 3] },
      output: "3",
      explanation: "Both the minimum and maximum are 3, so their GCD is 3.",
    },
  ],
  code: PYTHON_EUCLID_GCD_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(log(min(a, b)))",
    worst: "O(log(min(a, b)))",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "The number of reduction steps is bounded by 2 log_2(min(a, b)). Worst-case inputs are consecutive Fibonacci numbers.",
    space: "Requires O(1) space as only scalar state is maintained.",
  },
  topicGuide: EUCLID_GCD_TOPIC_GUIDE,
  trivia: EUCLID_GCD_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 1979,
      leetcodeId: 1979,
      url: "https://leetcode.com/problems/find-greatest-common-divisor-of-array/",
      label: "LeetCode #1979",
      title: "Find Greatest Common Divisor of Array",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      chapterTitle: "Number Theory",
      section: "21.2 Greatest common divisor",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 1979,
    url: "https://leetcode.com/problems/find-greatest-common-divisor-of-array/",
  },
  defaultInput: DEFAULT_EUCLID_GCD_INPUT,
  generateSteps: generateEuclidGcdSteps,
};

export default euclidGcd;
