import type { AlgorithmDefinition, AlgorithmStep, VectorItem, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface EuclidGcdInput {
  a: number;
  b: number;
}

export const PYTHON_EUCLID_GCD_CODE = `def gcd(a: int, b: int) -> int:
    while b != 0:
        remainder = a % b
        a = b
        b = remainder
    return a`;

export const DEFAULT_EUCLID_GCD_INPUT: EuclidGcdInput = {
  a: 987,
  b: 610,
};

export const generateEuclidGcdSteps = (input: EuclidGcdInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  let currentA = Math.abs(Math.floor(input.a));
  let currentB = Math.abs(Math.floor(input.b));
  const initialA = currentA;
  const initialB = currentB;

  const history: string[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    aVal: number,
    bVal: number,
    remVal?: number,
    qVal?: number,
  ) => {
    const vectors: VectorItem[] = [
      {
        id: "val-a",
        label: `a = ${aVal}`,
        x: aVal,
        y: 0,
        state: "active",
      },
      {
        id: "val-b",
        label: `b = ${bVal}`,
        x: bVal,
        y: 1,
        state: "compared",
      },
    ];

    if (remVal !== undefined) {
      vectors.push({
        id: "val-rem",
        label: `rem = ${remVal}`,
        x: remVal,
        y: 2,
        state: "result",
      });
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "vector",
        vectors,
        planeTitle: `Euclidean Reduction Pair Vector: gcd(${aVal}, ${bVal})`,
        dimensions: "2d",
      },
      auxiliaryState: {
        visited: [...history],
        hashMap: {
          "Initial Inputs": `a = ${initialA}, b = ${initialB}`,
          "Current State": `gcd(${aVal}, ${bVal})`,
          ...(remVal !== undefined && qVal !== undefined
            ? { Equation: `${aVal} = ${qVal} * ${bVal} + ${remVal}` }
            : {}),
        },
        customState: {
          a: aVal,
          b: bVal,
          ...(remVal !== undefined ? { remainder: remVal } : {}),
          ...(qVal !== undefined ? { quotient: qVal } : {}),
        },
      },
      variables: {
        a: aVal,
        b: bVal,
        ...(remVal !== undefined ? { remainder: remVal } : {}),
      },
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    `Start with gcd(${currentA}, ${currentB})`,
    `We want the largest number that divides both ${currentA} and ${currentB}. Rather than testing divisors, we will keep shrinking the pair using remainders until the answer falls out on its own.`,
    currentA,
    currentB,
  );

  history.push(`gcd(${currentA}, ${currentB})`);

  while (currentB !== 0) {
    // Line 2: Loop condition check
    addStep(
      2,
      `Check b: still ${currentB}, not zero`,
      `As long as b is non-zero the pair can be reduced further, so we take another remainder and keep going.`,
      currentA,
      currentB,
    );

    const remainder = currentA % currentB;
    const quotient = Math.floor(currentA / currentB);

    // Line 3: Modulo operation
    addStep(
      3,
      `Compute ${currentA} mod ${currentB} = ${remainder}`,
      `Since ${currentA} = ${quotient} × ${currentB} + ${remainder}, anything that divides both ${currentA} and ${currentB} must also divide ${remainder}. So gcd(${currentA}, ${currentB}) is the same as gcd(${currentB}, ${remainder}) — the identical answer on a smaller pair.`,
      currentA,
      currentB,
      remainder,
      quotient,
    );

    // Line 4: Update a
    const prevA = currentA;
    currentA = currentB;
    addStep(
      4,
      `Slide the divisor into a`,
      `We shift the pair down: the old divisor ${currentB} becomes the new a, replacing ${prevA}. We are now solving the same problem one size smaller.`,
      currentA,
      currentB,
      remainder,
      quotient,
    );

    // Line 5: Update b
    const prevB = currentB;
    currentB = remainder;
    history.push(`gcd(${currentA}, ${currentB})`);

    addStep(
      5,
      `Set b to the remainder ${remainder}`,
      `The remainder ${remainder} takes over as b (it was ${prevB}), leaving us at gcd(${currentA}, ${currentB}). Notice how quickly the numbers shrink — they roughly halve every couple of steps.`,
      currentA,
      currentB,
    );
  }

  // Line 2: Loop condition check (false)
  addStep(
    2,
    "Loop ends: b reached 0",
    "With b at 0 there is no remainder left to chase, so the loop stops. Whatever now sits in a divides everything that came before it.",
    currentA,
    currentB,
  );

  // Line 6: Return result
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Return GCD = ${currentA}`,
      why: `The last non-zero remainder, ${currentA}, divides both original numbers ${initialA} and ${initialB}, and nothing larger can — so it is their greatest common divisor.`,
    },
    primarySnapshot: {
      kind: "vector",
      vectors: [
        {
          id: "val-gcd",
          label: `GCD = ${currentA}`,
          x: currentA,
          y: 0,
          state: "result",
        },
      ],
      planeTitle: `Final Greatest Common Divisor = ${currentA}`,
      dimensions: "2d",
    },
    auxiliaryState: {
      visited: [...history],
      hashMap: {
        "Initial Inputs": `a = ${initialA}, b = ${initialB}`,
        "Final GCD": `${currentA}`,
      },
      customState: {
        gcd: currentA,
        stepsCount: steps.length,
      },
    },
    variables: {
      gcd: currentA,
    },
  });

  return steps;
};

const EUCLID_GCD_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Euclidean algorithm finds the greatest common divisor $\\gcd(a, b)$ of two non-negative integers $a, b \\in \\mathbb{Z}_{\\ge 0}$ by repeatedly replacing the pair with a smaller pair that maintains the exact same common divisors: $\\gcd(a, b) = \\gcd(b, a \\bmod b)$. It is the foundational arithmetic engine powering modular multiplicative inverses, fraction reduction, RSA encryption, and linear Diophantine equations.",
  sections: [
    {
      heading: "The Identity That Drives Everything",
      body: "Express $a$ using division with remainder: $a = q \\cdot b + r$, where $0 \\le r < b$ and $q = \\lfloor a / b \\rfloor$. If integer $d$ divides both $a$ and $b$, then $d \\mid (a - q b)$, which means $d \\mid r$. Conversely, if $d \\mid b$ and $d \\mid r$, then $d \\mid (q b + r) = a$. Thus, the set of common divisors of $(a, b)$ is identical to $(b, r)$, proving:\n$$\\gcd(a, b) = \\gcd(b, a \\bmod b)$$",
    },
    {
      heading: "Logarithmic Rate of Reduction",
      body: "Because $r < b$, the second element strictly decreases each iteration, guaranteeing finite termination. Furthermore, after any two consecutive reductions, the larger number is at least halved:\n$$a \\bmod b < \\frac{a}{2}$$\nThis forces logarithmic bounds on the total iterations $k \\le 2 \\log_2(\\min(a, b))$.",
    },
    {
      heading: "Worst-Case Complexity & Lamé's Theorem",
      body: "By Lamé's Theorem (1844), the worst-case inputs for the Euclidean algorithm are consecutive Fibonacci numbers $F_{n+1}$ and $F_n$. For instance, running $\\gcd(987, 610)$ yields quotients $q_i = 1$ at every step, requiring $n$ steps. The upper bound on iterations for inputs $\\le N$ is $k \\le \\log_{\\phi}(\\sqrt{5} N)$, where $\\phi = \\frac{1 + \\sqrt{5}}{2} \\approx 1.618$.",
    },
    {
      heading: "Bézout's Identity & Extended Euclidean",
      body: "The reduction sequence leaves a trail of quotients that can be back-substituted to express the GCD as a linear combination of original inputs $a$ and $b$:\n$$a x + b y = \\gcd(a, b)$$\nThis extended form finds modular inverses $a^{-1} \\bmod m$ when $\\gcd(a, m) = 1$, where $a x \\equiv 1 \\pmod m$.",
    },
    {
      heading: "Pitfalls and Edge Cases",
      body: "Negative inputs should be normalized using absolute values $|a|, |b|$ before sieving remainders. The base case $\\gcd(a, 0) = a$ holds because every integer divides $0$, and $\\gcd(0, 0) = 0$ by convention. When computing Least Common Multiple (LCM), always divide first to prevent integer overflow:\n$$\\text{lcm}(a, b) = \\left( \\frac{a}{\\gcd(a, b)} \\right) \\cdot b$$",
    },
  ],
  keyTerms: [
    {
      term: "Greatest Common Divisor (GCD)",
      definition:
        "The largest positive integer $d$ that divides both $a$ and $b$ without remainder, written $\\gcd(a, b) = d$.",
    },
    {
      term: "Modulo Operation",
      definition:
        "The remainder $r = a \\bmod b = a - b \\lfloor a / b \\rfloor$, satisfying $0 \\le r < b$.",
    },
    {
      term: "Coprime Integers",
      definition:
        "Two integers $a, b$ with $\\gcd(a, b) = 1$, meaning they share no prime factors.",
    },
    {
      term: "Bézout's Identity",
      definition:
        "The theorem stating $\\exists x, y \\in \\mathbb{Z}$ such that $a x + b y = \\gcd(a, b)$.",
    },
  ],
};

const EUCLID_GCD_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the gcd function signature taking non-negative integers $a$ and $b$ and returning their greatest common divisor.",
    2: "Loops while divisor $b \\neq 0$, iteratively replacing pair $(a, b)$ with $(b, a \\bmod b)$.",
    3: "Calculates remainder $remainder = a \\bmod b$, reducing state via identity $\\gcd(a, b) = \\gcd(b, a \\bmod b)$.",
    4: "Updates $a$ to hold the current divisor $b$.",
    5: "Updates $b$ to hold the new remainder.",
    6: "Returns $a$ when $b = 0$, which holds the last non-zero remainder and thus $\\gcd(a, b)$.",
  },
};

export const euclidGcd: AlgorithmDefinition<EuclidGcdInput> = {
  id: "euclid-gcd",
  title: "Euclidean Algorithm (GCD)",
  category: "math_and_number_theory",
  categories: ["math_and_number_theory"],
  difficulty: "Easy",
  description:
    "Computes the Greatest Common Divisor $\\gcd(a, b)$ of two non-negative integers using the classical Euclidean algorithm based on the reduction identity:\n\n$$\\gcd(a, b) = \\gcd(b, a \\bmod b)$$\n\n### Mathematical State Vector\nThe state is tracked as a 2D reduction vector $\\mathbf{v} = (a, b)^T \\in \\mathbb{Z}_{\\ge 0}^2$ updated via matrix transformation:\n$$\\begin{pmatrix} a_{k+1} \\\\ b_{k+1} \\end{pmatrix} = \\begin{pmatrix} 0 & 1 \\\\ 1 & -q_k \\end{pmatrix} \\begin{pmatrix} a_k \\\\ b_k \\end{pmatrix}$$\nwhere $q_k = \\lfloor a_k / b_k \\rfloor$.\n\n### Input Parameters\n- `a` ($a \\in \\mathbb{Z}_{\\ge 0}$): First non-negative integer.\n- `b` ($b \\in \\mathbb{Z}_{\\ge 0}$): Second non-negative integer.\n\n### Output\n- `int`: The greatest common divisor $\\gcd(a, b)$.\n\n### Edge Cases & Constraints\n- `b = 0`: Returns $a$ immediately since $\\gcd(a, 0) = a$.\n- Coprime inputs: Returns $1$.",
  constraints: ["0 <= a, b <= 10^9"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "a = 48, b = 18",
      outputDisplay: "6",
      title: "Basic Example",
      input: { a: 48, b: 18 },
      output: "6",
      explanation:
        "48 = 2*18 + 12 -> gcd(18, 12). 18 = 1*12 + 6 -> gcd(12, 6). 12 = 2*6 + 0 -> GCD is 6.",
    },
    {
      kind: "complex",
      inputDisplay: "a = 252, b = 105",
      outputDisplay: "21",
      title: "Complex Edge Case",
      input: { a: 252, b: 105 },
      output: "21",
      explanation:
        "Multiple modular reductions (252 % 105 = 42, 105 % 42 = 21, 42 % 21 = 0) yield GCD 21.",
    },
    {
      kind: "negative",
      inputDisplay: "a = 17, b = 0",
      outputDisplay: "17",
      title: "Failing / Boundary Case",
      input: { a: 17, b: 0 },
      output: "17",
      explanation: "Boundary input b=0 terminates instantly with GCD(a, 0) = a.",
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
    time: "The number of reduction steps is bounded by $2 \\log_2(\\min(a, b))$. Worst-case inputs are consecutive Fibonacci numbers $F_{n+1}, F_n$, yielding $O(\\log(\\min(a, b)))$ runtime.",
    space: "Requires $\\mathcal{O}(1)$ space as only three variables $(a, b, r)$ are maintained.",
  },
  topicGuide: EUCLID_GCD_TOPIC_GUIDE,
  trivia: EUCLID_GCD_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 21",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      section: "21.2 Euclid's algorithm",
    },
  ],
  defaultInput: DEFAULT_EUCLID_GCD_INPUT,
  generateSteps: generateEuclidGcdSteps,
};

