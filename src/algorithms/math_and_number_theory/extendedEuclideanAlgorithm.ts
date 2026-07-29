import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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
  a: 987,
  b: 610,
};

export const generateExtendedEuclideanSteps = (input?: ExtendedEuclideanInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

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

  const createMatrixSnapshot = (
    stackData: { a: number; b: number; q: number; r: number; x?: number; y?: number }[],
    activeLevelIdx?: number,
  ) => {
    const cells: MatrixCellItem[] = [];

    if (stackData.length === 0) {
      const vals = [origA, 0, 0, 0, 1, 0];
      vals.forEach((val, c) => {
        cells.push({
          row: 0,
          col: c,
          value: val,
          label: "Level 0",
          state: "active",
        });
      });
    } else {
      stackData.forEach((item, r) => {
        const vals = [item.a, item.b, item.q, item.r, item.x ?? "-", item.y ?? "-"];
        vals.forEach((val, c) => {
          cells.push({
            row: r,
            col: c,
            value: val,
            label: `Level ${r}`,
            state: r === activeLevelIdx ? "active" : item.x !== undefined ? "sorted" : "default",
          });
        });
      });
    }

    return {
      kind: "matrix" as const,
      rows: Math.max(1, stackData.length),
      cols: 6,
      cells,
      rowHeaders: stackData.length > 0 ? stackData.map((_, idx) => `Step ${idx + 1}`) : ["Step 1"],
      colHeaders: ["a", "b", "q = a//b", "r = a%b", "x", "y"],
      title: "Extended Euclidean Bézout Coefficient Matrix",
    };
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initializing Extended Euclidean Algorithm for a = ${origA}, b = ${origB}.`,
      why: "The goal is to compute gcd(a, b) and determine integer Bézout coefficients x and y satisfying a * x + b * y = gcd(a, b).",
    },
    primarySnapshot: createMatrixSnapshot(
      [
        {
          a: origA,
          b: origB,
          q: origB === 0 ? 0 : Math.floor(origA / origB),
          r: origB === 0 ? 0 : origA % origB,
        },
      ],
      0,
    ),
    auxiliaryState: {
      hashMap: {
        Inputs: `a = ${origA}, b = ${origB}`,
        Equation: `${origA}*x + ${origB}*y = gcd(${origA}, ${origB})`,
      },
      customState: {
        a: origA,
        b: origB,
      },
    },
    variables: {
      a: origA,
      b: origB,
    },
  });

  // Iterative implementation of Extended Euclidean algorithm
  const stack: { a: number; b: number; q: number; r: number; x?: number; y?: number }[] = [];
  let currentA = origA;
  let currentB = origB;

  while (currentB !== 0) {
    const q = Math.floor(currentA / currentB);
    const r = currentA % currentB;

    const item = { a: currentA, b: currentB, q, r };
    stack.push(item);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Dividing ${currentA} by ${currentB}: quotient q = ${q}, remainder r = ${r}.`,
        why: `Euclid's reduction principle guarantees gcd(a, b) = gcd(b, a mod b). Preserving quotient q = ${q} enables coefficient recovery during unwinding.`,
      },
      primarySnapshot: createMatrixSnapshot(stack, stack.length - 1),
      auxiliaryState: {
        stack: stack.map((s) => `gcd(${s.a}, ${s.b})`),
        customState: {
          a: currentA,
          b: currentB,
          quotient: q,
          remainder: r,
        },
      },
      variables: {
        a: currentA,
        b: currentB,
        q,
        r,
      },
    });

    currentA = currentB;
    currentB = r;
  }

  // Base Case b == 0
  const gcd = currentA;
  let x = 1;
  let y = 0;

  if (stack.length === 0) {
    stack.push({ a: origA, b: 0, q: 0, r: 0, x, y });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Reached base condition b = 0. Found gcd = ${gcd} with base coefficients x = 1, y = 0.`,
      why: `When divisor b reduces to 0, the dividend equals the GCD, yielding the trivial solution ${gcd} * 1 + 0 * 0 = ${gcd}.`,
    },
    primarySnapshot: createMatrixSnapshot(stack, stack.length - 1),
    auxiliaryState: {
      hashMap: {
        BaseCase: `gcd(${currentA}, 0) = ${gcd}`,
        Coefficients: `x = ${x}, y = ${y}`,
      },
      customState: {
        gcd,
        x,
        y,
      },
    },
    variables: {
      gcd,
      x,
      y,
    },
  });

  // Unwind stack & compute coefficients
  for (let i = stack.length - 1; i >= 0; i--) {
    const top = stack[i];
    if (top.b === 0) {
      top.x = 1;
      top.y = 0;
      continue;
    }
    const prevX = x;
    const prevY = y;
    x = prevY;
    y = prevX - top.q * prevY;
    top.x = x;
    top.y = y;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Unwinding recursive frame (a = ${top.a}, b = ${top.b}): set x = ${x}, y = ${y}.`,
        why: `Applying back-substitution x = y1 and y = x1 - q * y1 maintains linear combination invariant ${top.a} * (${x}) + ${top.b} * (${y}) = ${gcd}.`,
      },
      primarySnapshot: createMatrixSnapshot(stack, i),
      auxiliaryState: {
        hashMap: {
          Level: `a = ${top.a}, b = ${top.b}`,
          UpdatedCoefficients: `x = ${x}, y = ${y}`,
          CheckEquation: `${top.a}*(${x}) + ${top.b}*(${y}) = ${gcd}`,
        },
        customState: {
          a: top.a,
          b: top.b,
          q: top.q,
          x,
          y,
          gcd,
        },
      },
      variables: {
        a: top.a,
        b: top.b,
        x,
        y,
        gcd,
      },
    });
  }

  // Final Step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Completed Extended Euclidean Algorithm: gcd(${origA}, ${origB}) = ${gcd}, x = ${x}, y = ${y}.`,
      why: `The verified linear combination ${origA} * (${x}) + ${origB} * (${y}) = ${gcd} produces Bézout coefficients for modular arithmetic applications.`,
    },
    primarySnapshot: createMatrixSnapshot(stack, 0),
    auxiliaryState: {
      hashMap: {
        "Final GCD": `${gcd}`,
        "Solution x": `${x}`,
        "Solution y": `${y}`,
        Identity: `${origA}*(${x}) + ${origB}*(${y}) = ${gcd}`,
      },
      customState: {
        gcd,
        x,
        y,
      },
    },
    variables: {
      gcd,
      x,
      y,
    },
  });

  return steps;
};

export const EXTENDED_EUCLIDEAN_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Extended Euclidean Algorithm</strong> extends Euclid's classic GCD calculation. Beyond computing <code>g = gcd(a, b)</code>, it calculates integer Bézout coefficients <code>x</code> and <code>y</code> such that <code>a &times; x + b &times; y = g</code>. This identity underpins modular arithmetic inverses, linear Diophantine equations, and public-key cryptography algorithms such as RSA.</p>",
  sections: [
    {
      heading: "Bézout's Identity & Structural Induction",
      body: "<p>Bézout's identity establishes that for any integers <code>a</code> and <code>b</code>, there exist integers <code>x</code> and <code>y</code> satisfying <code>a &times; x + b &times; y = gcd(a, b)</code>. When solving recursively for <code>(b, a mod b)</code>, sub-problem coefficients <code>(x<sub>1</sub>, y<sub>1</sub>)</code> satisfy <code>b &times; x<sub>1</sub> + (a mod b) &times; y<sub>1</sub> = g</code>. Substituting <code>a mod b = a - &lfloor;a / b&rfloor; &times; b</code> yields:</p><p><code>a &times; y<sub>1</sub> + b &times; (x<sub>1</sub> - &lfloor;a / b&rfloor; &times; y<sub>1</sub>) = g</code></p><p>Thus, back-substituting to level <code>(a, b)</code> updates the coefficients to <code>x = y<sub>1</sub></code> and <code>y = x<sub>1</sub> - &lfloor;a / b&rfloor; &times; y<sub>1</sub></code>.</p>",
    },
    {
      heading: "Matrix Transformation",
      body: "<p>Each division step maps to a linear transformation matrix. Reversing these steps during recursion unwinds the division stack, efficiently updating linear coefficients in <code>O(log(min(a, b)))</code> time.</p>",
    },
    {
      heading: "Modular Inverses & Diophantine Equations",
      body: "<p>When <code>gcd(a, m) = 1</code>, the equation <code>a &times; x + m &times; y = 1</code> reduces modulo <code>m</code> to <code>a &times; x &equiv; 1 (mod m)</code>, making <code>x mod m</code> the modular inverse. Linear Diophantine equations of the form <code>a &times; x + b &times; y = c</code> have integer solutions if and only if <code>gcd(a, b)</code> divides <code>c</code>.</p>",
    },
    {
      heading: "Complexity & Edge Cases",
      body: "<p>The base case <code>b = 0</code> immediately returns <code>(g = a, x = 1, y = 0)</code>. Time complexity is bounded by <code>O(log(min(a, b)))</code> iterations, matching Euclid's algorithm.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Bézout's Identity",
      definition: "The theorem proving integers x and y exist such that a*x + b*y = gcd(a, b).",
    },
    {
      term: "Bézout Coefficients",
      definition: "The integers x and y that satisfy a*x + b*y = gcd(a, b).",
    },
    {
      term: "Linear Diophantine Equation",
      definition: "An equation of the form a*x + b*y = c seeking integer solutions (x, y).",
    },
  ],
};

export const EXTENDED_EUCLIDEAN_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines extended_gcd function signature taking integers a, b and returning tuple (gcd, x, y).",
    2: "Base case check: evaluates whether divisor b equals 0.",
    3: "Returns base tuple (a, 1, 0) since a*1 + 0*0 = a.",
    4: "Recursively calls extended_gcd(b, a % b) to obtain sub-problem solution (gcd, x1, y1).",
    5: "Assigns x = y1 according to the back-substitution identity.",
    6: "Assigns y = x1 - (a // b) * y1 to satisfy a*x + b*y = gcd.",
    7: "Returns computed tuple (gcd, x, y) satisfying Bézout's identity.",
  },
};

export const extendedEuclideanAlgorithm: AlgorithmDefinition<ExtendedEuclideanInput> = {
  id: "extended-euclidean-algorithm",
  title: "Extended Euclidean Algorithm",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given non-negative integers <code>a</code> and <code>b</code>, the <strong>Extended Euclidean Algorithm</strong> computes their greatest common divisor <code>gcd(a, b)</code> alongside integer Bézout coefficients <code>x</code> and <code>y</code> satisfying Bézout's identity:</p><p><code>a &times; x + b &times; y = gcd(a, b)</code></p><h3>State Matrix Representation</h3><p>The reduction steps are tracked as a state matrix recording <code>(a, b, q, r, x, y)</code> at each level of the recursive division chain.</p><h3>Input Parameters</h3><ul><li><code>a</code>: First non-negative integer.</li><li><code>b</code>: Second non-negative integer.</li></ul><h3>Output</h3><ul><li><code>(gcd, x, y)</code>: Greatest common divisor and linear Bézout coefficients.</li></ul><h3>Key Properties</h3><ul><li><strong>Base Case:</strong> When <code>b = 0</code>, the algorithm yields <code>(a, 1, 0)</code>.</li><li><strong>Modular Inverse:</strong> <code>x mod m</code> gives the multiplicative inverse <code>a<sup>-1</sup> mod m</code> when <code>gcd(a, m) = 1</code>.</li></ul>",
  constraints: ["1 <= a, b <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Input (30, 12)",
      inputDisplay: "a = 30, b = 12",
      outputDisplay: "gcd = 6, x = 1, y = -2 (30*1 + 12*-2 = 6)",
      input: { a: 30, b: 12 },
      output: "gcd = 6, x = 1, y = -2",
      explanation: "30*(1) + 12*(-2) = 30 - 24 = 6 = gcd(30, 12).",
    },
    {
      kind: "complex",
      title: "Coprime Numbers (35, 15)",
      inputDisplay: "a = 35, b = 15",
      outputDisplay: "gcd = 5, x = 1, y = -2 (35*1 + 15*-2 = 5)",
      input: { a: 35, b: 15 },
      output: "gcd = 5, x = 1, y = -2",
      explanation: "35*(1) + 15*(-2) = 5.",
    },
    {
      kind: "negative",
      title: "Equal Inputs Edge Case",
      inputDisplay: "a = 7, b = 7",
      outputDisplay: "gcd = 7, x = 0, y = 1 (7*0 + 7*1 = 7)",
      input: { a: 7, b: 7 },
      output: "gcd = 7, x = 0, y = 1",
      explanation: "7*(0) + 7*(1) = 7 = gcd(7,7).",
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
    time: "The number of reduction steps is bounded by 2 log2(min(a, b)), executing in O(log(min(a, b))) time.",
    space: "Requires O(log(min(a, b))) call stack memory for back-tracking Bézout coefficients.",
  },
  topicGuide: EXTENDED_EUCLIDEAN_TOPIC_GUIDE,
  trivia: EXTENDED_EUCLIDEAN_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 21",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      section: "21.3 Extended Euclidean algorithm",
    },
  ],
  defaultInput: DEFAULT_EXTENDED_EUCLIDEAN_INPUT,
  generateSteps: generateExtendedEuclideanSteps,
};
