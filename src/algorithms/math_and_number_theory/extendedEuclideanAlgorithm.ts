import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ExtendedEuclideanInput {
  a: number;
  b: number;
}

export const PYTHON_EXTENDED_EUCLIDEAN_CODE = `
def extended_gcd(a: int, b: int) -> tuple[int, int, int]:
    """
    Computes gcd(a, b) and Bézout coefficients (gcd, x, y) such that a*x + b*y = gcd(a, b).
    """
    if b == 0:
        return a, 1, 0
    gcd, x1, y1 = extended_gcd(b, a % b)
    x = y1
    y = x1 - (a // b) * y1
    return gcd, x, y
`;

export const DEFAULT_EXTENDED_EUCLIDEAN_INPUT: ExtendedEuclideanInput = {
  a: 987,
  b: 610,
};

export const generateExtendedEuclideanSteps = (input: ExtendedEuclideanInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const origA = Math.abs(Math.floor(input.a));
  const origB = Math.abs(Math.floor(input.b));

  const createMatrixSnapshot = (
    stackData: { a: number; b: number; q: number; r: number; x?: number; y?: number }[],
    activeLevelIdx?: number,
  ) => {
    const rows = stackData.length + 1;
    const cells: MatrixCellItem[] = [];

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

    return {
      kind: "matrix" as const,
      rows: Math.max(1, stackData.length),
      cols: 6,
      cells,
      rowHeaders: stackData.map((_, idx) => `Step ${idx + 1}`),
      colHeaders: ["a", "b", "q = a//b", "r = a%b", "x", "y"],
      title: "Extended Euclidean Bézout Coefficient Matrix",
    };
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Starting Extended GCD for a = ${origA}, b = ${origB}.`,
      why: "The goal is to find gcd(a,b) and linear Bezout coefficients x, y such that a*x + b*y = gcd(a,b).",
    },
    primarySnapshot: createMatrixSnapshot([{ a: origA, b: origB, q: Math.floor(origA / origB), r: origA % origB }], 0),
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
      codeLine: 8,
      explanation: {
        what: `Divide: ${currentA} = ${q} * ${currentB} + ${r}. Recursively solve extended_gcd(${currentB}, ${r}).`,
        why: "Quotient q = a // b and remainder r = a % b track state for linear substitution back-tracking.",
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Base case reached: b = 0. gcd = ${gcd}, base coefficients x = 1, y = 0.`,
      why: "Base equation: gcd * 1 + 0 * 0 = gcd.",
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
    const prevX = x;
    const prevY = y;
    x = prevY;
    y = prevX - top.q * prevY;
    top.x = x;
    top.y = y;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `Unwind for level a=${top.a}, b=${top.b}: x = y1 = ${x}, y = x1 - q*y1 = ${prevX} - ${top.q}*${prevY} = ${y}.`,
        why: `Check Bezout identity: ${top.a}*(${x}) + ${top.b}*(${y}) = ${top.a * x + top.b * y} (equals gcd ${gcd}).`,
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
    codeLine: 11,
    explanation: {
      what: `Finished Extended Euclidean Algorithm! gcd(${origA}, ${origB}) = ${gcd}, x = ${x}, y = ${y}.`,
      why: `Final Bezout Identity verified: ${origA}*(${x}) + ${origB}*(${y}) = ${gcd}.`,
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
    "The Extended Euclidean Algorithm extends Euclid's greatest common divisor algorithm. In addition to computing $g = \\gcd(a, b)$, it finds integer Bézout coefficients $x, y \\in \\mathbb{Z}$ satisfying Bézout's identity $a x + b y = g$. This identity is the foundational machinery powering modular inverses, linear Diophantine equations, and RSA key generation.",
  sections: [
    {
      heading: "Bézout's Identity & Structural Induction",
      body: "Bézout's identity states that for any $a, b \\in \\mathbb{Z}$, there exist integers $x, y$ such that:\n$$a x + b y = \\gcd(a, b)$$\nWhen recursively solving for sub-problem $(b, a \\bmod b)$, we obtain $(x_1, y_1)$ such that $b x_1 + (a \\bmod b) y_1 = g$. Substituting $a \\bmod b = a - \\lfloor a / b \\rfloor b$ gives:\n$$b x_1 + \\left(a - \\lfloor a / b \\rfloor b\\right) y_1 = g \\implies a y_1 + b \\left(x_1 - \\lfloor a / b \\rfloor y_1\\right) = g$$\nThus, the updated coefficients for level $(a, b)$ are $x = y_1$ and $y = x_1 - \\lfloor a / b \\rfloor y_1$.",
    },
    {
      heading: "Matrix Formulation of State Transitions",
      body: "Each division step can be represented as a $2 \\times 2$ matrix operation:\n$$\\begin{pmatrix} a_{k} \\\\ b_{k} \\end{pmatrix} = \\begin{pmatrix} q_k & 1 \\\\ 1 & 0 \\end{pmatrix} \\begin{pmatrix} a_{k+1} \\\\ b_{k+1} \\end{pmatrix}$$\nInverting the matrix transformations across all $n$ steps yields the Bézout matrix $\\mathbf{M} = \\prod_{i=1}^n \\begin{pmatrix} q_i & 1 \\\\ 1 & 0 \\end{pmatrix}^{-1}$, producing the exact linear coefficients $(x, y)$ in $\\mathcal{O}(\\log(\\min(a, b)))$ total steps.",
    },
    {
      heading: "Computing Modular Inverses & Solving Diophantine Equations",
      body: "When $\\gcd(a, m) = 1$, solving $a x + m y = 1$ modulo $m$ yields:\n$$a x \\equiv 1 \\pmod m$$\nSo $x \\bmod m$ is the modular multiplicative inverse $a^{-1} \\bmod m$. Furthermore, the linear Diophantine equation $a x + b y = c$ has integer solutions if and only if $\\gcd(a, b) \\mid c$, with particular solution $(x_0 \\cdot \\frac{c}{g}, y_0 \\cdot \\frac{c}{g})$.",
    },
    {
      heading: "Complexity & Edge Cases",
      body: "Base case $b = 0$ returns $(g=a, x=1, y=0)$ since $a \\cdot 1 + 0 \\cdot 0 = a$. Time complexity is $\\mathcal{O}(\\log(\\min(a, b)))$ iterations. Stack memory is $\\mathcal{O}(\\log(\\min(a, b)))$ for recursion or $\\mathcal{O}(1)$ when maintaining dynamic matrix state.",
    },
  ],
  keyTerms: [
    {
      term: "Bézout's Identity",
      definition:
        "The theorem stating $\\exists x, y \\in \\mathbb{Z}$ such that $a x + b y = \\gcd(a, b)$.",
    },
    {
      term: "Bézout Coefficients",
      definition: "The integers $x, y$ that satisfy $a x + b y = \\gcd(a, b)$.",
    },
    {
      term: "Linear Diophantine Equation",
      definition: "An equation $a x + b y = c$ seeking integer solutions $(x, y) \\in \\mathbb{Z}^2$.",
    },
  ],
};

export const EXTENDED_EUCLIDEAN_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines extended_gcd function signature taking integers $a, b$ and returning tuple $(gcd, x, y)$.",
    3: "Opening docstring tag.",
    4: "Docstring describing Bézout identity computation.",
    5: "Closing docstring tag.",
    6: "Base case check: when divisor $b = 0$.",
    7: "Returns base tuple $(a, 1, 0)$ since $a \\cdot 1 + 0 \\cdot 0 = a$.",
    8: "Recursively calls extended_gcd(b, a % b) to obtain sub-problem solution $(gcd, x_1, y_1)$.",
    9: "Assigns $x = y_1$ based on substitution derivation.",
    10: "Assigns $y = x_1 - \\lfloor a / b \\rfloor y_1$ to satisfy $a x + b y = gcd$.",
    11: "Returns computed tuple $(gcd, x, y)$.",
    12: "Empty trailing line for code formatting.",
  },
};

export const extendedEuclideanAlgorithm: AlgorithmDefinition<ExtendedEuclideanInput> = {
  id: "extended-euclidean-algorithm",
  title: "Extended Euclidean Algorithm",
  category: "math_and_number_theory",
  categories: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Given non-negative integers $a$ and $b$, compute their greatest common divisor $\\gcd(a, b)$ and integer Bézout coefficients $x, y$ satisfying Bézout's identity:\n\n$$a x + b y = \\gcd(a, b)$$\n\n### State Matrix Representation\nThe stack trace of reduction steps is represented as a state matrix $\\mathbf{M} \\in \\mathbb{Z}^{k \\times 6}$ recording $(a_i, b_i, q_i, r_i, x_i, y_i)$ at each level $i$.\n\n### Input Parameters\n- `a` ($a \\in \\mathbb{Z}_{\\ge 0}$): First non-negative integer.\n- `b` ($b \\in \\mathbb{Z}_{\\ge 0}$): Second non-negative integer.\n\n### Output\n- `tuple (gcd, x, y)`: Greatest common divisor and Bézout coefficients $x, y$.\n\n### Edge Cases & Constraints\n- Base Case: $b = 0$ yields $(a, 1, 0)$.\n- Modular Inverse: $x \\bmod m$ yields $a^{-1} \\bmod m$ when $\\gcd(a, m) = 1$.",
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
    time: "The number of reduction steps is bounded by $2 \\log_2(\\min(a, b))$, executing in $\\mathcal{O}(\\log(\\min(a, b)))$ time.",
    space: "Requires $\\mathcal{O}(\\log(\\min(a, b)))$ call stack memory for back-tracking Bézout coefficients.",
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

