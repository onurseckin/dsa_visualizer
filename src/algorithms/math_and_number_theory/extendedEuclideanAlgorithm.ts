import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ExtendedEuclideanInput {
  a: number;
  b: number;
}

export const PYTHON_EXTENDED_EUCLIDEAN_CODE = `def extended_gcd(a: int, b: int) -> tuple[int, int, int]:
    if b == 0:
        return a, 1, 0
    gcd, x1, y1 = extended_gcd(b, a % b)
    x = y1
    y = x1 - (a // b) * y1
    return gcd, x, y`;

export const DEFAULT_EXTENDED_EUCLIDEAN_INPUT: ExtendedEuclideanInput = {
  a: 30,
  b: 12,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      title: "Bézout's Identity Problem",
      narrative:
        "The Extended Euclidean algorithm computes not only the greatest common divisor gcd(a, b) but also integer Bézout coefficients x and y satisfying a * x + b * y = gcd(a, b).",
      matrix: [[30, 12, "-", "-", "-", "-"]],
    },
    {
      title: "Limitation of Standard GCD",
      narrative:
        "Standard Euclid computes remainders to find gcd(a, b), but discards intermediate quotient ratios q = floor(a / b), making it impossible to express gcd as a linear combination.",
      matrix: [[30, 12, 2, 6, "-", "-"]],
    },
    {
      title: "Division Remainder Chain",
      narrative:
        "Expressing division as a = q * b + r allows rewriting remainder r = a - q * b, laying the structural foundation for back-substitution.",
      matrix: [
        [30, 12, 2, 6, "-", "-"],
        [12, 6, 2, 0, "-", "-"],
      ],
    },
    {
      title: "Forward Reduction Stack",
      narrative:
        "We push each division frame (a, b, q, r) onto an execution stack until reaching remainder 0, saving all quotient values for backward unwinding.",
      matrix: [
        [30, 12, 2, 6, "-", "-"],
        [12, 6, 2, 0, "-", "-"],
        [6, 0, 0, 0, "-", "-"],
      ],
    },
    {
      title: "Base Case Coefficient Setup",
      narrative:
        "When b reaches 0, dividend a is the GCD. The trivial solution a * 1 + 0 * 0 = a sets base coefficients x = 1 and y = 0.",
      matrix: [
        [30, 12, 2, 6, "-", "-"],
        [12, 6, 2, 0, "-", "-"],
        [6, 0, 0, 0, 1, 0],
      ],
    },
    {
      title: "Backward Substitution Transformation",
      narrative:
        "Unwinding from sub-problem coefficients (x1, y1), the parent coefficients update via x = y1 and y = x1 - q * y1.",
      matrix: [
        [30, 12, 2, 6, "-", "-"],
        [12, 6, 2, 0, 0, 1],
        [6, 0, 0, 0, 1, 0],
      ],
    },
    {
      title: "Linear Combination Invariant",
      narrative:
        "At every step of unwinding, the mathematical identity a * x + b * y = gcd(a, b) remains strictly preserved across frame transitions.",
      matrix: [
        [30, 12, 2, 6, 1, -2],
        [12, 6, 2, 0, 0, 1],
        [6, 0, 0, 0, 1, 0],
      ],
    },
    {
      title: "Modular Inverse Application",
      narrative:
        "When gcd(a, m) = 1, reducing a * x + m * y = 1 modulo m yields a * x = 1 (mod m), making x the modular multiplicative inverse.",
      matrix: [[30, 12, 2, 6, "1 (inv)", "-2"]],
    },
    {
      title: "Logarithmic Time and Space Guarantees",
      narrative:
        "The Extended Euclidean algorithm executes in O(log min(a, b)) steps and stack space, completing rapidly even for 64-bit inputs.",
      matrix: [[30, 12, 2, 6, "x=1", "y=-2"]],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "ext_gcd_concept",
        rows: data.matrix.length,
        cols: 6,
        cells: data.matrix.flatMap((row, rIdx) =>
          row.map((val, cIdx) => ({
            row: rIdx,
            col: cIdx,
            value: val,
            label: `r${rIdx}c${cIdx}`,
            state: rIdx === data.matrix.length - 1 ? ("active" as const) : ("default" as const),
          })),
        ),
        rowHeaders: data.matrix.map((_, r) => `Step ${r + 1}`),
        colHeaders: ["a", "b", "q", "r", "x", "y"],
      },
    }),
  );
};

export const generateExtendedEuclideanSteps = (input?: ExtendedEuclideanInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const safeInput = input ?? DEFAULT_EXTENDED_EUCLIDEAN_INPUT;
  const rawA =
    typeof safeInput.a === "number" && !isNaN(safeInput.a)
      ? safeInput.a
      : DEFAULT_EXTENDED_EUCLIDEAN_INPUT.a;
  const rawB =
    typeof safeInput.b === "number" && !isNaN(safeInput.b)
      ? safeInput.b
      : DEFAULT_EXTENDED_EUCLIDEAN_INPUT.b;
  const origA = Math.max(0, Math.abs(Math.floor(rawA)));
  const origB = Math.max(0, Math.abs(Math.floor(rawB)));

  const stack: { a: number; b: number; q: number; r: number; x?: number; y?: number }[] = [];
  let currentA = origA;
  let currentB = origB;

  const createMatrixSnapshot = (activeLevelIdx?: number, isFinished: boolean = false) => {
    const cells: MatrixCellItem[] = [];
    const displayStack = stack.length === 0 ? [{ a: origA, b: origB, q: 0, r: 0 }] : stack;

    displayStack.forEach((item, r) => {
      const vals = [item.a, item.b, item.q, item.r, item.x ?? "-", item.y ?? "-"];
      vals.forEach((val, c) => {
        cells.push({
          row: r,
          col: c,
          value: val,
          label: `r${r}c${c}`,
          state: isFinished
            ? ("sorted" as const)
            : r === activeLevelIdx
              ? ("active" as const)
              : item.x !== undefined
                ? ("sorted" as const)
                : ("default" as const),
        });
      });
    });

    return {
      kind: "matrix" as const,
      name: "ext_gcd_matrix",
      rows: displayStack.length,
      cols: 6,
      cells,
      rowHeaders: displayStack.map((_, idx) => `Step ${idx + 1}`),
      colHeaders: ["a", "b", "q", "r", "x", "y"],
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize the Extended Euclidean algorithm for a = ${origA} and b = ${origB}, pushing the initial reduction frame onto the stack.`,
      primarySnapshot: createMatrixSnapshot(0),
    }),
  );

  while (currentB !== 0) {
    const q = Math.floor(currentA / currentB);
    const r = currentA % currentB;

    stack.push({ a: currentA, b: currentB, q, r });

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `We divide ${currentA} by ${currentB}, obtaining quotient q = ${q} and remainder r = ${r}, pushing step ${stack.length} to the stack.`,
        primarySnapshot: createMatrixSnapshot(stack.length - 1),
      }),
    );

    currentA = currentB;
    currentB = r;
  }

  const gcd = currentA;
  let x = 1;
  let y = 0;

  if (stack.length === 0) {
    stack.push({ a: origA, b: 0, q: 0, r: 0, x, y });
  } else {
    stack.push({ a: currentA, b: 0, q: 0, r: 0, x, y });
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Divisor b reached 0, terminating reduction. Found gcd = ${gcd} with initial base case coefficients x = 1 and y = 0.`,
      primarySnapshot: createMatrixSnapshot(stack.length - 1),
    }),
  );

  for (let i = stack.length - 2; i >= 0; i--) {
    const top = stack[i];
    const prevX = x;
    const prevY = y;
    x = prevY;
    y = prevX - top.q * prevY;
    top.x = x;
    top.y = y;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Unwinding stack frame for a = ${top.a}, b = ${top.b}: using sub-problem coefficients (${prevX}, ${prevY}), we update x = ${x} and y = ${y}.`,
        primarySnapshot: createMatrixSnapshot(i),
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `The Extended Euclidean algorithm concludes, yielding gcd(${origA}, ${origB}) = ${gcd} with Bézout coefficients x = ${x} and y = ${y} (${origA}*${x} + ${origB}*${y} = ${gcd}).`,
      primarySnapshot: createMatrixSnapshot(0, true),
    }),
  );

  return steps;
};

export const EXTENDED_EUCLIDEAN_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The Extended Euclidean Algorithm calculates gcd(a, b) and Bézout coefficients x, y such that a*x + b*y = gcd(a, b).</p>",
  sections: [
    {
      heading: "Bézout's Identity",
      body: "<p>By recording division quotients and unwinding the stack, coefficients x and y are calculated recursively.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Bézout Coefficients",
      definition: "Integers x and y satisfying a*x + b*y = gcd(a, b).",
    },
  ],
};

export const EXTENDED_EUCLIDEAN_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const extendedEuclideanAlgorithm: AlgorithmDefinition<ExtendedEuclideanInput> = {
  id: "extended-euclidean-algorithm",
  title: "Extended Euclidean Algorithm",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute the greatest common divisor <code>gcd(a, b)</code> of non-negative integers <code>a</code> and <code>b</code> along with integer Bézout coefficients <code>x</code> and <code>y</code> satisfying <code>a * x + b * y = gcd(a, b)</code>.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>a</code> (<code>a &ge; 0</code>): First integer.</li>" +
    "<li><code>b</code> (<code>b &ge; 0</code>): Second integer.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>(gcd, x, y)</code>: Tuple containing GCD and integer coefficients x, y.</li></ul>",
  constraints: ["1 <= a, b <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Input (30, 12)",
      inputDisplay: "a = 30, b = 12",
      outputDisplay: "gcd = 6, x = 1, y = -2",
      input: { a: 30, b: 12 },
      output: "gcd = 6, x = 1, y = -2",
      explanation: "30*(1) + 12*(-2) = 6 = gcd(30, 12).",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Equal Inputs Edge Case (7, 7)",
      inputDisplay: "a = 7, b = 7",
      outputDisplay: "gcd = 7, x = 0, y = 1",
      input: { a: 7, b: 7 },
      output: "gcd = 7, x = 0, y = 1",
      explanation: "7*(0) + 7*(1) = 7 = gcd(7, 7).",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Coprime Pair (35, 15)",
      inputDisplay: "a = 35, b = 15",
      outputDisplay: "gcd = 5, x = 1, y = -2",
      input: { a: 35, b: 15 },
      output: "gcd = 5, x = 1, y = -2",
      explanation: "35*(1) + 15*(-2) = 5.",
    },
  ],
  code: PYTHON_EXTENDED_EUCLIDEAN_CODE,
  timeComplexity: {
    best: "O(log(min(a, b)))",
    average: "O(log(min(a, b)))",
    worst: "O(log(min(a, b)))",
  },
  spaceComplexity: "O(log(min(a, b)))",
  complexityAnalysis: {
    time: "The number of reduction steps is bounded by 2 log2(min(a, b)).",
    space: "Requires O(log(min(a, b))) stack memory for recursion.",
  },
  topicGuide: EXTENDED_EUCLIDEAN_TOPIC_GUIDE,
  trivia: EXTENDED_EUCLIDEAN_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      chapterTitle: "Number Theory",
      section: "21.2 Extended Euclidean Algorithm",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_EXTENDED_EUCLIDEAN_INPUT,
  generateSteps: generateExtendedEuclideanSteps,
};

export default extendedEuclideanAlgorithm;
