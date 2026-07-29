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

  let currentA = Math.abs(
    Math.floor(typeof input?.a === "number" ? input.a : DEFAULT_EUCLID_GCD_INPUT.a),
  );
  let currentB = Math.abs(
    Math.floor(typeof input?.b === "number" ? input.b : DEFAULT_EUCLID_GCD_INPUT.b),
  );
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
    "<p>The Euclidean algorithm finds the greatest common divisor <code>gcd(a, b)</code> of two non-negative integers <code>a, b &ge; 0</code> by repeatedly replacing the pair with a smaller pair that maintains the exact same common divisors: <code>gcd(a, b) = gcd(b, a mod b)</code>. It is the foundational arithmetic engine powering modular multiplicative inverses, fraction reduction, RSA encryption, and linear Diophantine equations.</p>",
  sections: [
    {
      heading: "The Identity That Drives Everything",
      body: "<p>Express <code>a</code> using division with remainder: <code>a = q &middot; b + r</code>, where <code>0 &le; r &lt; b</code> and <code>q = &lfloor;a / b&rfloor;</code>. If integer <code>d</code> divides both <code>a</code> and <code>b</code>, then <code>d | (a - qb)</code>, which means <code>d | r</code>. Conversely, if <code>d | b</code> and <code>d | r</code>, then <code>d | (qb + r) = a</code>. Thus, the set of common divisors of <code>(a, b)</code> is identical to <code>(b, r)</code>, proving:</p><p><code>gcd(a, b) = gcd(b, a mod b)</code></p>",
    },
    {
      heading: "Logarithmic Rate of Reduction",
      body: "<p>Because <code>r &lt; b</code>, the second element strictly decreases each iteration, guaranteeing finite termination. Furthermore, after any two consecutive reductions, the larger number is at least halved:</p><p><code>a mod b &lt; a / 2</code></p><p>This forces logarithmic bounds on the total iterations <code>k &le; 2 log_2(min(a, b))</code>.</p>",
    },
    {
      heading: "Worst-Case Complexity & Lamé's Theorem",
      body: "<p>By Lamé's Theorem (1844), the worst-case inputs for the Euclidean algorithm are consecutive Fibonacci numbers <code>F_{n+1}</code> and <code>F_n</code>. For instance, running <code>gcd(987, 610)</code> yields quotients <code>q_i = 1</code> at every step, requiring <code>n</code> steps. The upper bound on iterations for inputs <code>&le; N</code> is <code>k &le; log_&phi;(&radic;5 N)</code>, where <code>&phi; = (1 + &radic;5) / 2 &approx; 1.618</code>.</p>",
    },
    {
      heading: "Bézout's Identity & Extended Euclidean",
      body: "<p>The reduction sequence leaves a trail of quotients that can be back-substituted to express the GCD as a linear combination of original inputs <code>a</code> and <code>b</code>:</p><p><code>a x + b y = gcd(a, b)</code></p><p>This extended form finds modular inverses <code>a&sup1; mod m</code> when <code>gcd(a, m) = 1</code>, where <code>a x &equiv; 1 (mod m)</code>.</p>",
    },
    {
      heading: "Pitfalls and Edge Cases",
      body: "<p>Negative inputs should be normalized using absolute values <code>|a|, |b|</code> before sieving remainders. The base case <code>gcd(a, 0) = a</code> holds because every integer divides 0, and <code>gcd(0, 0) = 0</code> by convention. When computing Least Common Multiple (LCM), always divide first to prevent integer overflow:</p><p><code>lcm(a, b) = (a / gcd(a, b)) &middot; b</code></p>",
    },
  ],
  keyTerms: [
    {
      term: "Greatest Common Divisor (GCD)",
      definition:
        "The largest positive integer d that divides both a and b without remainder, written gcd(a, b) = d.",
    },
    {
      term: "Modulo Operation",
      definition: "The remainder r = a mod b = a - b ⌊a / b⌋, satisfying 0 <= r < b.",
    },
    {
      term: "Coprime Integers",
      definition: "Two integers a, b with gcd(a, b) = 1, meaning they share no prime factors.",
    },
    {
      term: "Bézout's Identity",
      definition: "The theorem stating there exist integers x, y such that a x + b y = gcd(a, b).",
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
  topicIds: ["math_and_number_theory"],
  difficulty: "Easy",
  description:
    "<p>Computes the Greatest Common Divisor <code>gcd(a, b)</code> of two non-negative integers using the classical Euclidean algorithm based on the reduction identity:</p><p><code>gcd(a, b) = gcd(b, a mod b)</code></p><h3>Mathematical State Vector</h3><p>The state is tracked as a 2D reduction vector <code>v = (a, b)^T</code> updated via matrix transformation:</p><p><code>(a_{k+1}, b_{k+1}) = (b_k, a_k mod b_k)</code></p><h3>Input Parameters</h3><ul><li><code>a</code> (<code>a &ge; 0</code>): First non-negative integer.</li><li><code>b</code> (<code>b &ge; 0</code>): Second non-negative integer.</li></ul><h3>Output</h3><ul><li><code>int</code>: The greatest common divisor <code>gcd(a, b)</code>.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><code>b = 0</code>: Returns <code>a</code> immediately since <code>gcd(a, 0) = a</code>.</li><li>Coprime inputs: Returns <code>1</code>.</li></ul>",
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
