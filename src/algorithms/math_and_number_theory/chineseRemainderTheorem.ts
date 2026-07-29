import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ChineseRemainderInput {
  num: number[];
  rem: number[];
}

export const PYTHON_CHINESE_REMAINDER_CODE = `
def chinese_remainder(num: list[int], rem: list[int]) -> int:
    prod = 1
    for n in num:
        prod *= n

    result = 0
    for n_i, r_i in zip(num, rem):
        p = prod // n_i
        inv = pow(p, n_i - 2, n_i)
        result += r_i * p * inv

    return result % prod
`;

export const DEFAULT_CHINESE_REMAINDER_INPUT: ChineseRemainderInput = {
  num: [3, 5, 7],
  rem: [2, 3, 2],
};

const modPow = (base: number, exp: number, mod: number): number => {
  let res = 1;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) res = (res * b) % mod;
    b = (b * b) % mod;
    e = Math.floor(e / 2);
  }
  return res;
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      title: "System of Linear Congruences",
      narrative:
        "The Chinese Remainder Theorem solves a system of simultaneous linear congruences x ≡ r_i (mod m_i) for a set of pairwise coprime moduli m_i.",
      matrix: [
        [3, 2, "-", "-", "-"],
        [5, 3, "-", "-", "-"],
        [7, 2, "-", "-", "-"],
      ],
    },
    {
      title: "Brute-Force Search Bottleneck",
      narrative:
        "Testing numbers sequentially up to master product M = m1 x m2 x ... x mk takes O(M) steps, which quickly becomes computationally impossible.",
      matrix: [
        [3, 2, "Check 1..105", "-", "-"],
        [5, 3, "Check 1..105", "-", "-"],
        [7, 2, "Check 1..105", "-", "-"],
      ],
    },
    {
      title: "Master Product Modulus M",
      narrative:
        "The product of all pairwise coprime moduli M = 3 x 5 x 7 = 105 defines the period within which a unique non-negative solution x exists.",
      matrix: [
        [3, 2, "M=105", "-", "-"],
        [5, 3, "M=105", "-", "-"],
        [7, 2, "M=105", "-", "-"],
      ],
    },
    {
      title: "Partial Modulus M_i",
      narrative:
        "For each equation, partial modulus M_i = M / m_i is computed (such as M1 = 105 / 3 = 35), which is divisible by all other moduli except m_i.",
      matrix: [
        [3, 2, 35, "-", "-"],
        [5, 3, 21, "-", "-"],
        [7, 2, 15, "-", "-"],
      ],
    },
    {
      title: "Modular Multiplicative Inverse",
      narrative:
        "We compute the modular inverse of M_i modulo m_i (such as 35^-1 mod 3 = 2), ensuring that M_i x inv ≡ 1 (mod m_i).",
      matrix: [
        [3, 2, 35, 2, "-"],
        [5, 3, 21, 1, "-"],
        [7, 2, 15, 1, "-"],
      ],
    },
    {
      title: "Constructing Independent Basis Terms",
      narrative:
        "Each term T_i = r_i x M_i x inv satisfies T_i ≡ r_i (mod m_i) while evaluating to 0 modulo every other modulus m_j.",
      matrix: [
        [3, 2, 35, 2, 140],
        [5, 3, 21, 1, 63],
        [7, 2, 15, 1, 30],
      ],
    },
    {
      title: "Summation of Basis Terms",
      narrative:
        "Summing all individual basis terms T1 + T2 + T3 = 140 + 63 + 30 = 233 produces a number that satisfies all congruences simultaneously.",
      matrix: [
        [3, 2, 35, 2, "Sum=233"],
        [5, 3, 21, 1, "Sum=233"],
        [7, 2, 15, 1, "Sum=233"],
      ],
    },
    {
      title: "Final Modulo Reduction",
      narrative:
        "Taking the total sum modulo master product M (233 mod 105 = 23) yields the minimal non-negative solution to the congruence system.",
      matrix: [
        [3, 2, 35, 2, "x=23"],
        [5, 3, 21, 1, "x=23"],
        [7, 2, 15, 1, "x=23"],
      ],
    },
    {
      title: "Logarithmic Time Efficiency",
      narrative:
        "Evaluating K congruences with the constructive formula requires O(K log M) total operations, accelerating modular arithmetic exponentially.",
      matrix: [[3, 2, 35, 2, "O(K log M)"]],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "crt_concept",
        rows: data.matrix.length,
        cols: 5,
        cells: data.matrix.flatMap((row, rIdx) =>
          row.map((val, cIdx) => ({
            row: rIdx,
            col: cIdx,
            value: val,
            label: `r${rIdx}c${cIdx}`,
            state: rIdx === data.matrix.length - 1 ? ("active" as const) : ("default" as const),
          })),
        ),
        rowHeaders: data.matrix.map((_, r) => `Eq #${r + 1}`),
        colHeaders: ["m_i", "r_i", "M_i", "M_i^-1", "Term"],
      },
    }),
  );
};

export const generateChineseRemainderSteps = (input?: ChineseRemainderInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const safeInput = input ?? DEFAULT_CHINESE_REMAINDER_INPUT;
  const num =
    Array.isArray(safeInput.num) && safeInput.num.length > 0
      ? safeInput.num
      : DEFAULT_CHINESE_REMAINDER_INPUT.num;
  const rem =
    Array.isArray(safeInput.rem) && safeInput.rem.length === num.length
      ? safeInput.rem
      : DEFAULT_CHINESE_REMAINDER_INPUT.rem;
  const k = num.length;

  const partialMs: (number | string)[] = new Array(k).fill("-");
  const invs: (number | string)[] = new Array(k).fill("-");
  const terms: (number | string)[] = new Array(k).fill("-");

  const createMatrixSnapshot = (
    activeRow: number | null,
    activeCol: number | null,
    isDone: boolean = false,
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < k; r++) {
      const rowVals = [num[r], rem[r], partialMs[r], invs[r], terms[r]];
      for (let c = 0; c < 5; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (isDone) {
          state = "sorted";
        } else if (r === activeRow && c === activeCol) {
          state = "active";
        } else if (r === activeRow) {
          state = "compared";
        } else if (typeof terms[r] === "number") {
          state = "sorted";
        }

        cells.push({
          row: r,
          col: c,
          value: rowVals[c],
          label: `r${r}c${c}`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      name: "crt_matrix",
      rows: k,
      cols: 5,
      cells,
      rowHeaders: num.map((_, idx) => `Eq #${idx + 1}`),
      colHeaders: ["m_i", "r_i", "M_i = M/m_i", "M_i^-1 mod m_i", "Term_i"],
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize the system of ${k} linear congruences x ≡ r_i (mod m_i).`,
      primarySnapshot: createMatrixSnapshot(null, null),
    }),
  );

  let prod = 1;
  for (let i = 0; i < k; i++) {
    const prevProd = prod;
    prod *= num[i];
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `We multiply modulus m_${i + 1} = ${num[i]} into master product: M = ${prevProd} x ${num[i]} = ${prod}.`,
        primarySnapshot: createMatrixSnapshot(i, 0),
      }),
    );
  }

  let result = 0;
  for (let i = 0; i < k; i++) {
    const ni = num[i];
    const ri = rem[i];
    const p = Math.floor(prod / ni);
    partialMs[i] = p;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `For equation #${i + 1}, we compute partial modulus M_${i + 1} = M / m_${i + 1} = ${prod} / ${ni} = ${p}.`,
        primarySnapshot: createMatrixSnapshot(i, 2),
      }),
    );

    const inv = modPow(p, ni - 2, ni);
    invs[i] = inv;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `We calculate the modular inverse of M_${i + 1} = ${p} modulo ${ni}, yielding inv = ${inv}.`,
        primarySnapshot: createMatrixSnapshot(i, 3),
      }),
    );

    const term = ri * p * inv;
    terms[i] = term;
    result += term;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `We compute basis term #${i + 1}: r_i x M_i x inv = ${ri} x ${p} x ${inv} = ${term}, increasing cumulative sum to ${result}.`,
        primarySnapshot: createMatrixSnapshot(i, 4),
      }),
    );
  }

  const finalAns = result % prod;

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We reduce total sum ${result} modulo master product M = ${prod}, obtaining the final unique solution x = ${finalAns}.`,
      primarySnapshot: createMatrixSnapshot(null, null, true),
    }),
  );

  return steps;
};

export const CHINESE_REMAINDER_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The Chinese Remainder Theorem solves simultaneous linear congruences for pairwise coprime moduli.</p>",
  sections: [
    {
      heading: "Constructive Solution",
      body: "<p>Computes partial moduli, modular inverses, and basis terms to form the minimal non-negative solution.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Master Modulus",
      definition: "The product M = m_1 * m_2 * ... * m_k defining the solution period.",
    },
  ],
};

export const CHINESE_REMAINDER_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const chineseRemainderTheorem: AlgorithmDefinition<ChineseRemainderInput> = {
  id: "chinese-remainder-theorem",
  title: "Chinese Remainder Theorem",
  topicIds: ["math_and_number_theory"],
  difficulty: "Hard",
  description:
    "<p>Solve a system of simultaneous linear congruences <code>x &equiv; r<sub>i</sub> (mod m<sub>i</sub>)</code> for pairwise coprime moduli <code>m<sub>i</sub></code> using the Chinese Remainder Theorem.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>num</code>: Array of pairwise coprime moduli <code>[m<sub>1</sub>, m<sub>2</sub>, ..., m<sub>k</sub>]</code>.</li>" +
    "<li><code>rem</code>: Array of remainders <code>[r<sub>1</sub>, r<sub>2</sub>, ..., r<sub>k</sub>]</code>.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: The minimal non-negative integer solution <code>x mod M</code> where <code>M = &prod; m<sub>i</sub></code>.</li></ul>",
  constraints: ["1 <= num.length <= 10", "2 <= num[i] <= 10^3 (pairwise coprime)"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Three Congruences (3, 5, 7)",
      inputDisplay: "num = [3, 5, 7], rem = [2, 3, 2]",
      outputDisplay: "x = 23 (mod 105)",
      input: { num: [3, 5, 7], rem: [2, 3, 2] },
      output: "23",
      explanation: "23 ≡ 2 mod 3, 23 ≡ 3 mod 5, 23 ≡ 2 mod 7.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Zero Remainder Edge Case",
      inputDisplay: "num = [3, 5], rem = [0, 0]",
      outputDisplay: "x = 0 (mod 15)",
      input: { num: [3, 5], rem: [0, 0] },
      output: "0",
      explanation: "When all remainders are zero, minimum solution is 0.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Four Congruences",
      inputDisplay: "num = [2, 3, 5, 7], rem = [1, 2, 3, 4]",
      outputDisplay: "x = 53 (mod 210)",
      input: { num: [2, 3, 5, 7], rem: [1, 2, 3, 4] },
      output: "53",
      explanation: "53 mod 2 = 1, 53 mod 3 = 2, 53 mod 5 = 3, 53 mod 7 = 4.",
    },
  ],
  code: PYTHON_CHINESE_REMAINDER_CODE,
  timeComplexity: {
    best: "O(K log M)",
    average: "O(K log M)",
    worst: "O(K log M)",
  },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "For K congruences, total runtime is O(K log M).",
    space: "Requires O(K) space.",
  },
  topicGuide: CHINESE_REMAINDER_TOPIC_GUIDE,
  trivia: CHINESE_REMAINDER_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      chapterTitle: "Number Theory",
      section: "21.4 Chinese remainder theorem",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_CHINESE_REMAINDER_INPUT,
  generateSteps: generateChineseRemainderSteps,
};

export default chineseRemainderTheorem;
