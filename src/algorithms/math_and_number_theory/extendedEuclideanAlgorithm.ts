import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
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
  a: 30,
  b: 12,
};

export const generateExtendedEuclideanSteps = (input: ExtendedEuclideanInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const origA = Math.abs(Math.floor(input.a));
  const origB = Math.abs(Math.floor(input.b));

  const createElements = (
    aVal: number,
    bVal: number,
    xVal?: number,
    yVal?: number,
    gcdVal?: number,
  ): ArrayElement[] => {
    const list: ArrayElement[] = [
      { id: "a", value: aVal, state: "active", pointers: ["a"] },
      { id: "b", value: bVal, state: "compare", pointers: ["b"] },
    ];
    if (xVal !== undefined) {
      list.push({ id: "x", value: xVal, state: "sorted", pointers: ["x"] });
    }
    if (yVal !== undefined) {
      list.push({ id: "y", value: yVal, state: "sorted", pointers: ["y"] });
    }
    if (gcdVal !== undefined) {
      list.push({ id: "gcd", value: gcdVal, state: "pivot", pointers: ["gcd"] });
    }
    return list;
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Starting Extended GCD for a = ${origA}, b = ${origB}.`,
      why: "The goal is to find gcd(a,b) and linear Bezout coefficients x, y such that a*x + b*y = gcd(a,b).",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(origA, origB),
    },
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

  // Iterative implementation of Extended Euclidean algorithm to produce steps cleanly
  const stack: { a: number; b: number; q: number; r: number }[] = [];
  let currentA = origA;
  let currentB = origB;

  while (currentB !== 0) {
    const q = Math.floor(currentA / currentB);
    const r = currentA % currentB;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Divide: ${currentA} = ${q} * ${currentB} + ${r}. Recursively solve extended_gcd(${currentB}, ${r}).`,
        why: "Quotient q = a // b and remainder r = a % b track state for back-substitution.",
      },
      primarySnapshot: {
        kind: "array",
        elements: createElements(currentA, currentB),
      },
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

    stack.push({ a: currentA, b: currentB, q, r });
    currentA = currentB;
    currentB = r;
  }

  // Base Case b == 0
  let gcd = currentA;
  let x = 1;
  let y = 0;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Base case reached: b = 0. gcd = ${gcd}, base coefficients x = 1, y = 0.`,
      why: "Base equation: gcd * 1 + 0 * 0 = gcd.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(currentA, 0, x, y, gcd),
    },
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
  while (stack.length > 0) {
    const top = stack.pop();
    if (!top) break;

    const prevX = x;
    const prevY = y;
    x = prevY;
    y = prevX - top.q * prevY;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Unwind for level a=${top.a}, b=${top.b}: x = y1 = ${x}, y = x1 - q*y1 = ${prevX} - ${top.q}*${prevY} = ${y}.`,
        why: `Check Bezout identity: ${top.a}*(${x}) + ${top.b}*(${y}) = ${top.a * x + top.b * y} (equals gcd ${gcd}).`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createElements(top.a, top.b, x, y, gcd),
      },
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
      what: `Finished Extended Euclidean Algorithm! gcd(${origA}, ${origB}) = ${gcd}, x = ${x}, y = ${y}.`,
      why: `Final Bezout Identity verified: ${origA}*(${x}) + ${origB}*(${y}) = ${gcd}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(origA, origB, x, y, gcd),
    },
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
    "The Extended Euclidean Algorithm computes the greatest common divisor (gcd) of two integers a and b, and simultaneously calculates Bezout coefficients x and y such that a*x + b*y = gcd(a,b).",
  sections: [
    {
      heading: "Bézout's Identity",
      body: "Bézout's identity states that for any non-zero integers a and b, there exist integers x and y such that a*x + b*y = gcd(a,b). The smallest positive integer linear combination of a and b is gcd(a,b).",
    },
    {
      heading: "Recursive Coefficients Substitution",
      body: "Knowing extended_gcd(b, a % b) yields gcd, x1, y1. Substituting a % b = a - (a//b)*b gives a*y1 + b*(x1 - (a//b)*y1) = gcd, deriving x = y1 and y = x1 - (a//b)*y1.",
    },
  ],
  keyTerms: [
    {
      term: "Bézout Coefficients",
      definition: "Integers x and y satisfying the linear equation a*x + b*y = gcd(a,b).",
    },
    {
      term: "Diophantine Equation",
      definition: "Polynomial equation with integer coefficients where integer solutions are sought.",
    },
  ],
};

export const EXTENDED_EUCLIDEAN_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 7],
  distractors: [
    "x = x1",
    "y = y1 - (a // b) * x1",
    "return gcd, y1, x1",
    "if a == 0:",
  ],
  hints: [
    { line: 3, hint: "Base case b == 0 returns gcd = a, x = 1, y = 0." },
    { line: 5, hint: "New x becomes old y1, and new y becomes x1 - (a // b) * y1." },
  ],
};

export const extendedEuclideanAlgorithm: AlgorithmDefinition<ExtendedEuclideanInput> = {
  id: "extended-euclidean-algorithm",
  title: "Extended Euclidean Algorithm",
  category: "math_and_number_theory",
  difficulty: "Medium",
  description:
    "Computes gcd(a, b) and finds integer coefficients x and y satisfying Bézout's identity a*x + b*y = gcd(a, b). Essential for solving linear Diophantine equations and finding general modular inverses.",
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
    time: "Like standard Euclid's GCD, the number of steps decreases logarithmically, running in O(log(min(a, b))) time.",
    space: "O(log(min(a, b))) call stack memory for recursion back-tracking.",
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

export default extendedEuclideanAlgorithm;
