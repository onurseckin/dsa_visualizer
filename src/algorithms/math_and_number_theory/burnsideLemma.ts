import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface BurnsideLemmaInput {
  n: number;
  k: number;
}

export const PYTHON_BURNSIDE_LEMMA_CODE = `class Solution:
    def __init__(self):
        pass

    def largestMultipleOfThree(self, digits: list[int]) -> str:
        digits.sort(reverse=True)
        mod1 = [d for d in digits if d % 3 == 1]
        mod2 = [d for d in digits if d % 3 == 2]
        total = sum(digits)
        
        if total % 3 == 1:
            if mod1:
                digits.remove(mod1[-1])
            elif len(mod2) >= 2:
                digits.remove(mod2[-1])
                digits.remove(mod2[-2])
            else:
                return ""
        elif total % 3 == 2:
            if mod2:
                digits.remove(mod2[-1])
            elif len(mod1) >= 2:
                digits.remove(mod1[-1])
                digits.remove(mod1[-2])
            else:
                return ""
                
        if not digits:
            return ""
        if digits[0] == 0:
            return "0"
        return "".join(map(str, digits))`;

export const DEFAULT_BURNSIDE_LEMMA_INPUT: BurnsideLemmaInput = { n: 4, k: 2 };

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introRows = [
    [["r0 (0 deg)", "4 cycles", "2^4", 16, 16]],
    [
      ["r0 (0 deg)", "4 cycles", "2^4", 16, 16],
      ["r90 (90 deg)", "1 cycle", "2^1", 2, 18],
    ],
    [
      ["r0 (0 deg)", "4 cycles", "2^4", 16, 16],
      ["r90 (90 deg)", "1 cycle", "2^1", 2, 18],
      ["r180 (180 deg)", "2 cycles", "2^2", 4, 22],
    ],
    [
      ["r0 (0 deg)", "4 cycles", "2^4", 16, 16],
      ["r90 (90 deg)", "1 cycle", "2^1", 2, 18],
      ["r180 (180 deg)", "2 cycles", "2^2", 4, 22],
      ["r270 (270 deg)", "1 cycle", "2^1", 2, 24],
    ],
    [
      ["r0 (0 deg)", "4 cycles", "2^4", 16, 16],
      ["r90 (90 deg)", "1 cycle", "2^1", 2, 18],
      ["r180 (180 deg)", "2 cycles", "2^2", 4, 22],
      ["r270 (270 deg)", "1 cycle", "2^1", 2, 24],
    ],
    [
      ["r0 (0 deg)", "4 cycles", "2^4", 16, 16],
      ["r90 (90 deg)", "1 cycle", "2^1", 2, 18],
      ["r180 (180 deg)", "2 cycles", "2^2", 4, 22],
      ["r270 (270 deg)", "1 cycle", "2^1", 2, 24],
    ],
    [
      ["r0 (0 deg)", "4 cycles", "2^4", 16, 16],
      ["r90 (90 deg)", "1 cycle", "2^1", 2, 18],
      ["r180 (180 deg)", "2 cycles", "2^2", 4, 22],
      ["r270 (270 deg)", "1 cycle", "2^1", 2, 24],
    ],
    [
      ["r0 (0 deg)", "4 cycles", "2^4", 16, 16],
      ["r90 (90 deg)", "1 cycle", "2^1", 2, 18],
      ["r180 (180 deg)", "2 cycles", "2^2", 4, 22],
      ["r270 (270 deg)", "1 cycle", "2^1", 2, 24],
    ],
    [
      ["r0 (0 deg)", "4 cycles", "2^4", 16, 16],
      ["r90 (90 deg)", "1 cycle", "2^1", 2, 18],
      ["r180 (180 deg)", "2 cycles", "2^2", 4, 22],
      ["r270 (270 deg)", "1 cycle", "2^1", 2, 24],
      ["Average", "1/4 * Sum |X^g|", "24 / 4", 6, 6],
    ],
  ];

  const introNarratives = [
    "Burnside's Lemma (or the Cauchy-Frobenius Lemma) counts distinct equivalence classes of objects under symmetry group actions, such as colorings under rotations.",
    "The rotation group G acting on an n-element circular structure consists of n rotational symmetries corresponding to shifts from 0 to n - 1.",
    "Two colorings belong to the same orbit (equivalence class) if one can be transformed into the other via a valid rotation symmetry in G.",
    "For each rotation g, the fixed point set X^g contains all colorings that remain completely unchanged when rotation g is applied.",
    "Under identity rotation r0 (0 deg), every element maps to itself, creating n independent 1-element cycles and producing k^n fixed point colorings.",
    "Under a rotation by i positions, the number of independent color cycles equals gcd(i, n), yielding k^gcd(i, n) fixed point colorings.",
    "All elements within each cycle must receive the exact same color to remain invariant under rotation by i positions.",
    "Evaluating fixed point counts for all n rotational symmetries yields the total sum of fixed points across the group.",
    "Burnside's Lemma states that the total number of distinct orbits equals the average fixed point count: |X/G| = (1 / |G|) * sum |X^g|.",
  ];

  return introNarratives.map((narrative, idx) => {
    const mat = introRows[idx];
    const cells: MatrixCellItem[] = mat.flatMap((row, rIdx) =>
      row.map((val, cIdx) => {
        let state: MatrixCellItem["state"] = "default";
        if (idx === 4 && rIdx === 0) state = "active";
        else if (idx === 5 && rIdx === 1) state = "active";
        else if (idx === 6 && rIdx === 2) state = "active";
        else if (idx === 7 && rIdx === 3) state = "active";
        else if (idx === 8 && rIdx === 4) state = "sorted";
        else if (rIdx === mat.length - 1) state = "active";
        return {
          row: rIdx,
          col: cIdx,
          value: val,
          label: `r${rIdx}c${cIdx}`,
          state,
        };
      }),
    );

    return createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "burnside_concept",
        rows: mat.length,
        cols: 5,
        cells,
        rowHeaders: mat.map((_, r) => `g${r + 1}`),
        colHeaders: ["Symmetry", "Cycles", "Formula", "Count", "Running Sum"],
      },
    });
  });
};

export const generateBurnsideLemmaSteps = (input?: BurnsideLemmaInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const safeInput = input ?? DEFAULT_BURNSIDE_LEMMA_INPUT;
  const nVal = Number.isFinite(safeInput?.n)
    ? Math.max(1, Math.min(12, Math.floor(safeInput.n)))
    : DEFAULT_BURNSIDE_LEMMA_INPUT.n;
  const kVal = Number.isFinite(safeInput?.k)
    ? Math.max(1, Math.min(10, Math.floor(safeInput.k)))
    : DEFAULT_BURNSIDE_LEMMA_INPUT.k;

  const rotationsData: {
    name: string;
    cycles: number;
    formula: string;
    count: number;
  }[] = [];

  for (let i = 0; i < nVal; i++) {
    const cycleCount = gcd(i, nVal);
    const count = Math.pow(kVal, cycleCount);
    rotationsData.push({
      name: `r${i} (shift ${i})`,
      cycles: cycleCount,
      formula: `${kVal}^${cycleCount}`,
      count,
    });
  }

  let runningTotal = 0;

  const createMatrixSnapshot = (activeIdx: number | null = null, isDone: boolean = false) => {
    const cells: MatrixCellItem[] = [];

    rotationsData.forEach((item, idx) => {
      const isProcessed = idx <= (activeIdx ?? (isDone ? nVal - 1 : -1));
      const currentRunning = isProcessed
        ? rotationsData.slice(0, idx + 1).reduce((acc, curr) => acc + curr.count, 0)
        : 0;

      const vals = [
        item.name,
        `${item.cycles} cycle${item.cycles > 1 ? "s" : ""}`,
        item.formula,
        item.count,
        isProcessed ? currentRunning : "-",
      ];

      vals.forEach((val, cIdx) => {
        let state: MatrixCellItem["state"] = "default";
        if (isDone) {
          state = "sorted";
        } else if (idx === activeIdx) {
          state = "active";
        } else if (isProcessed) {
          state = "sorted";
        }

        cells.push({
          row: idx,
          col: cIdx,
          value: val,
          label: `r${idx}c${cIdx}`,
          state,
        });
      });
    });

    return {
      kind: "matrix" as const,
      name: "burnside_symmetry",
      rows: nVal,
      cols: 5,
      cells,
      rowHeaders: Array.from({ length: nVal }, (_, i) => `g${i + 1}`),
      colHeaders: ["Symmetry", "Cycles", "Formula", "Count |X^g|", "Running Sum"],
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing Burnside rotation matrix for n = ${nVal} positions with k = ${kVal} colors.`,
      primarySnapshot: createMatrixSnapshot(),
    }),
  );

  for (let i = 0; i < nVal; i++) {
    const rot = rotationsData[i];
    runningTotal += rot.count;
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Evaluating rotation ${rot.name}: gcd(${i}, ${nVal}) = ${rot.cycles} independent cycles, yielding ${rot.formula} = ${rot.count} fixed points. Running total = ${runningTotal}.`,
        primarySnapshot: createMatrixSnapshot(i),
      }),
    );
  }

  const result = Math.floor(runningTotal / nVal);
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Averaging total fixed points ${runningTotal} over ${nVal} group symmetries: ${runningTotal} / ${nVal} = ${result} distinct colorings under rotation.`,
      primarySnapshot: createMatrixSnapshot(nVal - 1, true),
    }),
  );

  return steps;
};

export const BURNSIDE_LEMMA_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Burnside's Lemma (also known as the Cauchy-Frobenius Lemma) counts the number of distinct orbits (equivalence classes) of a set under symmetry group actions.</p>",
  sections: [
    {
      heading: "Symmetry Group and Fixed Points",
      body: "<p>When a group G acts on a set X of colorings, two colorings are equivalent if one can be rotated into the other. The lemma states that the number of unique orbits |X/G| equals the average number of fixed points |X^g| across all symmetries g in G.</p>",
    },
    {
      heading: "Rotational Cycle Formula",
      body: "<p>For n items under n rotational shifts, rotation by i positions forms gcd(i, n) independent cycles. Since each cycle must be monochromatic, the fixed point count is k^gcd(i, n) for k available colors.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Burnside's Lemma",
      definition:
        "A fundamental identity in group theory stating that the number of orbits equals the average number of fixed points per symmetry.",
    },
    {
      term: "Orbit",
      definition:
        "The set of all configurations reachable from a given configuration by applying symmetries in the group.",
    },
    {
      term: "Fixed Point Set",
      definition:
        "The subset of configurations X^g that remain completely invariant under a specific symmetry g.",
    },
    {
      term: "Coloring Cycles",
      definition:
        "Disjoint element cycles mapped to each other under symmetry, where all elements in a cycle must receive the same color to remain invariant.",
    },
  ],
};

export const BURNSIDE_LEMMA_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const burnsideLemma: AlgorithmDefinition<BurnsideLemmaInput> = {
  id: "burnside-lemma",
  title: "Burnside's Lemma",
  topicIds: ["math_and_number_theory"],
  difficulty: "Hard",
  description:
    "<p>Compute the number of distinct colorings of <code>n</code> items under rotational symmetry using <code>k</code> available colors.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code> (<code>n &ge; 1</code>): Number of elements or positions.</li>" +
    "<li><code>k</code> (<code>k &ge; 1</code>): Number of distinct colors available.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: Number of unique colorings up to rotation.</li></ul>",
  constraints: ["1 <= n <= 12", "1 <= k <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "4 Items 2 Colors",
      inputDisplay: "n = 4, k = 2",
      outputDisplay: "6",
      input: { n: 4, k: 2 },
      output: "6",
      explanation: "There are 6 distinct colorings for 4 items using 2 colors under rotation.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "1 Item 3 Colors",
      inputDisplay: "n = 1, k = 3",
      outputDisplay: "3",
      input: { n: 1, k: 3 },
      output: "3",
      explanation: "Single item with 3 colors produces 3 distinct colorings.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "6 Items 2 Colors",
      inputDisplay: "n = 6, k = 2",
      outputDisplay: "14",
      input: { n: 6, k: 2 },
      output: "14",
      explanation: "There are 14 distinct colorings for 6 items using 2 colors under rotation.",
    },
  ],
  code: PYTHON_BURNSIDE_LEMMA_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Evaluating the gcd fixed point formula for all n rotations takes O(n) time.",
    space: "Requires O(1) space.",
  },
  topicGuide: BURNSIDE_LEMMA_TOPIC_GUIDE,
  trivia: BURNSIDE_LEMMA_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 1363,
      leetcodeId: 1363,
      url: "https://leetcode.com/problems/largest-multiple-of-three/",
      label: "LeetCode #1363",
      title: "Largest Multiple of Three",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      chapterTitle: "Combinatorics",
      section: "22.4 Burnside's lemma",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 1363,
    url: "https://leetcode.com/problems/largest-multiple-of-three/",
  },
  defaultInput: DEFAULT_BURNSIDE_LEMMA_INPUT,
  generateSteps: generateBurnsideLemmaSteps,
};

export default burnsideLemma;
