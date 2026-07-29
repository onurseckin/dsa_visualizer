import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ModularExponentiationInput {
  base: number;
  exp: number;
  mod: number;
}

export const PYTHON_MODULAR_EXPONENTIATION_CODE = `def mod_pow(base: int, exp: int, mod: int) -> int:
    res = 1
    base = base % mod
    while exp > 0:
        if exp % 2 == 1:
            res = (res * base) % mod
        base = (base * base) % mod
        exp //= 2
    return res

def mod_inverse(a: int, m: int) -> int:
    return mod_pow(a, m - 2, m)`;

export const DEFAULT_MODULAR_EXPONENTIATION_INPUT: ModularExponentiationInput = {
  base: 7,
  exp: 25,
  mod: 1000000007,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "Modular Exponentiation calculates (base^exp) mod m efficiently for massive integers without storing gigantic intermediate power values.",
      rows: [["2^0 = 1", "7", "25", "1", "Init (7^25 mod 10^9+7)"]],
    },
    {
      narrative:
        "Multiplying the base e times iteratively takes O(e) operations and causes catastrophic integer overflow for large 64-bit exponents.",
      rows: [["Linear", "7", "25", "Overflow!", "7 * 7 * 7... (25 steps)"]],
    },
    {
      narrative:
        "By expressing exponent e in binary form, e = b0*2^0 + b1*2^1 + b2*2^2 + ..., power calculation breaks down into logarithmic sub-products.",
      rows: [["25 = 11001_2", "7", "25 (16+8+1)", "1", "Binary Power Breakdown"]],
    },
    {
      narrative:
        "The total power base^exp equals the product of squared base powers corresponding to set binary bits: 7^25 = (7^16) * (7^8) * (7^1) mod m.",
      rows: [["7^1 * 7^8 * 7^16", "7", "11001_2", "1", "Product of Active Bits"]],
    },
    {
      narrative:
        "Instead of recomputing powers, we square the base at each step: base_k = (base_{k-1})^2 mod m, generating exponential powers in O(1) time per bit.",
      rows: [["7^2 = 49", "49", "12", "1", "Repeated Base Squaring"]],
    },
    {
      narrative:
        "When inspecting the least significant bit (LSB) of the exponent, if LSB == 1, we multiply the active squared base into running result res = (res * base) mod m.",
      rows: [["LSB = 1", "7", "25", "7", "Multiply into res accumulator"]],
    },
    {
      narrative:
        "Applying the modulo operation mod m at every multiplication keeps all intermediate values strictly below m, preventing numeric overflow.",
      rows: [["Mod Reduction", "base % m", "exp // 2", "res % m", "Bounded Modulo Ring"]],
    },
    {
      narrative:
        "By Fermat's Little Theorem, for prime modulus p, a^(p-1) = 1 mod p, which guarantees that modular multiplicative inverse a^(-1) equals a^(p-2) mod p.",
      rows: [["Fermat FLT", "a^(p-2)", "p-2", "a^(-1)", "Modular Inverse Formula"]],
    },
    {
      narrative:
        "Modular inverse allows division modulo p by replacing (x / a) mod p with x * a^(p-2) mod p, computed in logarithmic binary steps.",
      rows: [["Division", "a^(p-2)", "Mod inverse", "x * a^(-1)", "Modular Division"]],
    },
    {
      narrative:
        "Binary exponentiation executes in floor(log2 exp) + 1 iterations, achieving optimal O(log exp) time complexity and O(1) auxiliary space.",
      rows: [["O(log exp)", "O(1) Space", "Binary Power", "Optimal", "Logarithmic Bound"]],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "binary_power_matrix",
        rows: data.rows.length,
        cols: 5,
        cells: data.rows.flatMap((row, rIdx) =>
          row.map((val, cIdx) => ({
            row: rIdx,
            col: cIdx,
            value: val,
            label: `r${rIdx}c${cIdx}`,
            state: cIdx === 3 ? ("active" as const) : ("default" as const),
          })),
        ),
        rowHeaders: ["State"],
        colHeaders: [
          "Power Term",
          "Current Base",
          "Remaining Exp",
          "Accumulator (res)",
          "Step Operation",
        ],
      },
    }),
  );
};

export const generateModularExponentiationSteps = (
  input: ModularExponentiationInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const origBase = Math.floor(
    typeof input?.base === "number" ? input.base : DEFAULT_MODULAR_EXPONENTIATION_INPUT.base,
  );
  const origExp = Math.max(
    0,
    Math.floor(
      typeof input?.exp === "number" ? input.exp : DEFAULT_MODULAR_EXPONENTIATION_INPUT.exp,
    ),
  );
  const mod =
    typeof input?.mod === "number" && input.mod > 0
      ? Math.floor(input.mod)
      : DEFAULT_MODULAR_EXPONENTIATION_INPUT.mod;

  let currentBase = ((origBase % mod) + mod) % mod;
  let currentExp = origExp;
  let res = 1;

  const history: {
    bitPower: string;
    baseVal: number;
    expVal: number;
    resVal: number;
    action: string;
  }[] = [];

  const createMatrixSnapshot = (activeRowIdx: number | null, isFinished: boolean = false) => {
    const displayRows =
      history.length === 0
        ? [
            {
              bitPower: "2^0 = 1",
              baseVal: currentBase,
              expVal: currentExp,
              resVal: res,
              action: "Init",
            },
          ]
        : history;
    const cells: MatrixCellItem[] = [];

    displayRows.forEach((row, r) => {
      const rowVals = [row.bitPower, row.baseVal, row.expVal, row.resVal, row.action];

      rowVals.forEach((val, c) => {
        let state: MatrixCellItem["state"] = "default";
        if (isFinished && r === displayRows.length - 1) {
          state = "sorted";
        } else if (r === activeRowIdx) {
          state = c === 3 ? "active" : c === 4 ? "compare" : "visited";
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
      name: "binary_power_matrix",
      rows: displayRows.length,
      cols: 5,
      cells,
      rowHeaders: displayRows.map((_, idx) => `Bit Step ${idx + 1}`),
      colHeaders: [
        "Power Term",
        "Current Base (base)",
        "Remaining Exp",
        "Accumulator (res)",
        "Step Action",
      ],
    };
  };

  history.push({
    bitPower: "Start",
    baseVal: currentBase,
    expVal: currentExp,
    resVal: res,
    action: `Initialize (${origBase}^${origExp}) mod ${mod}`,
  });

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize binary exponentiation for (${origBase}^${origExp}) mod ${mod} with accumulator res = 1 and reduced base = ${currentBase}.`,
      primarySnapshot: createMatrixSnapshot(0),
    }),
  );

  if (currentExp === 0) {
    history[0].action = "Exponent is 0 -> Result = 1";
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `The exponent is 0, so any base raised to power 0 evaluates immediately to 1.`,
        primarySnapshot: createMatrixSnapshot(0, true),
      }),
    );
    return steps;
  }

  let bitDegree = 0;
  while (currentExp > 0) {
    const isOdd = currentExp % 2 === 1;
    const powerTermLabel = `2^${bitDegree} = ${Math.pow(2, bitDegree)}`;

    if (isOdd) {
      const prevRes = res;
      res = (res * currentBase) % mod;
      history.push({
        bitPower: powerTermLabel,
        baseVal: currentBase,
        expVal: currentExp,
        resVal: res,
        action: `LSB=1: res = (${prevRes} * ${currentBase}) mod ${mod} = ${res}`,
      });

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Exponent ${currentExp} has LSB = 1, so we multiply active base power ${currentBase} into result accumulator: res = (${prevRes} * ${currentBase}) mod ${mod} = ${res}.`,
          primarySnapshot: createMatrixSnapshot(history.length - 1),
        }),
      );
    } else {
      history.push({
        bitPower: powerTermLabel,
        baseVal: currentBase,
        expVal: currentExp,
        resVal: res,
        action: `LSB=0: Skip res multiplication`,
      });

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Exponent ${currentExp} has LSB = 0, so we skip multiplying into result accumulator for power term ${powerTermLabel}.`,
          primarySnapshot: createMatrixSnapshot(history.length - 1),
        }),
      );
    }

    const prevBase = currentBase;
    currentBase = (currentBase * currentBase) % mod;
    currentExp = Math.floor(currentExp / 2);
    bitDegree++;

    if (currentExp > 0) {
      history.push({
        bitPower: `Square -> 2^${bitDegree}`,
        baseVal: currentBase,
        expVal: currentExp,
        resVal: res,
        action: `base = (${prevBase}^2) mod ${mod} = ${currentBase}, exp >>= 1`,
      });

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `We square the base: (${prevBase}^2) mod ${mod} = ${currentBase}, and shift exponent right to ${currentExp}.`,
          primarySnapshot: createMatrixSnapshot(history.length - 1),
        }),
      );
    }
  }

  history.push({
    bitPower: "Complete",
    baseVal: currentBase,
    expVal: 0,
    resVal: res,
    action: `Final Result: (${origBase}^${origExp}) mod ${mod} = ${res}`,
  });

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `The exponent has reached 0. Binary exponentiation completes with final value (${origBase}^${origExp}) mod ${mod} = ${res}.`,
      primarySnapshot: createMatrixSnapshot(history.length - 1, true),
    }),
  );

  return steps;
};

export const generateModularExponentiationInverseSteps = generateModularExponentiationSteps;
export const DEFAULT_MODULAR_EXPONENTIATION_INVERSE_INPUT = DEFAULT_MODULAR_EXPONENTIATION_INPUT;

export const MODULAR_EXPONENTIATION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Modular Binary Exponentiation calculates base^exp mod m in O(log exp) time using repeated squaring.</p>",
  sections: [
    {
      heading: "Binary Exponentiation Mechanism",
      body: "<p>Exponent e is scanned in binary representation. At each bit, the base is squared and active bits (LSB = 1) multiply into the result accumulator modulo m.</p>",
    },
    {
      heading: "Fermat's Little Theorem Inverse",
      body: "<p>For prime m, a^(m-1) &equiv; 1 (mod m), so modular inverse a<sup>-1</sup> &equiv; a<sup>m-2</sup> (mod m) can be computed using binary exponentiation.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Binary Exponentiation",
      definition: "An algorithm evaluating base^exp mod m in O(log exp) modular multiplications.",
    },
    {
      term: "Modular Inverse",
      definition:
        "An integer x such that a * x &equiv; 1 (mod m), given by a^(m-2) mod m for prime m.",
    },
  ],
};

export const MODULAR_EXPONENTIATION_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const modularExponentiationInverse: AlgorithmDefinition<ModularExponentiationInput> = {
  id: "modular-exponentiation-inverse",
  title: "Modular Exponentiation & Inverse",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute <code>(base^exp) mod mod</code> using binary exponentiation, or compute modular multiplicative inverse using Fermat's Little Theorem.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>base</code> (<code>b &ge; 0</code>): Base integer.</li>" +
    "<li><code>exp</code> (<code>e &ge; 0</code>): Exponent power.</li>" +
    "<li><code>mod</code> (<code>m &gt; 0</code>): Modulo divisor.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: Calculated value <code>(base^exp) mod mod</code>.</li></ul>",
  constraints: ["0 <= base, exp <= 10^18", "1 <= mod <= 2 * 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Power (2^10 mod 1000)",
      inputDisplay: "base = 2, exp = 10, mod = 1000",
      outputDisplay: "24",
      input: { base: 2, exp: 10, mod: 1000 },
      output: "24",
      explanation: "2^10 = 1024. 1024 % 1000 = 24.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Zero Exponent (7^0 mod 13)",
      inputDisplay: "base = 7, exp = 0, mod = 13",
      outputDisplay: "1",
      input: { base: 7, exp: 0, mod: 13 },
      output: "1",
      explanation: "Any non-zero base raised to power 0 equals 1.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Modular Inverse (3^(-1) mod 11)",
      inputDisplay: "base = 3, exp = 9, mod = 11",
      outputDisplay: "4",
      input: { base: 3, exp: 9, mod: 11 },
      output: "4",
      explanation: "3^(-1) mod 11 via Fermat = 3^9 mod 11 = 4.",
    },
  ],
  code: PYTHON_MODULAR_EXPONENTIATION_CODE,
  timeComplexity: {
    best: "O(log exp)",
    average: "O(log exp)",
    worst: "O(log exp)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "The loop executes floor(log2 exp) + 1 iterations, taking O(log exp) time.",
    space: "Requires O(1) auxiliary space.",
  },
  topicGuide: MODULAR_EXPONENTIATION_TOPIC_GUIDE,
  trivia: MODULAR_EXPONENTIATION_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      chapterTitle: "Number Theory",
      section: "21.3 Modular arithmetic",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_MODULAR_EXPONENTIATION_INPUT,
  generateSteps: generateModularExponentiationSteps,
};

export default modularExponentiationInverse;
