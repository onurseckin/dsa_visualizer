import type { AlgorithmDefinition, AlgorithmStep, VectorItem, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

export const generateModularExponentiationSteps = (
  input: ModularExponentiationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

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

  const createVectorSnapshot = (
    rVal: number,
    bVal: number,
    eVal: number,
    activeSlot?: "res" | "base" | "exp",
  ) => {
    const vectors: VectorItem[] = [
      {
        id: "res",
        label: `res = ${rVal}`,
        x: rVal % 100,
        y: 0,
        state: activeSlot === "res" ? "active" : "result",
      },
      {
        id: "base",
        label: `base = ${bVal}`,
        x: bVal % 100,
        y: 1,
        state: activeSlot === "base" ? "active" : "compared",
      },
      {
        id: "exp",
        label: `exp = ${eVal} (0b${eVal.toString(2)})`,
        x: eVal,
        y: 2,
        state: activeSlot === "exp" ? "active" : "default",
      },
    ];

    return {
      kind: "vector" as const,
      vectors,
      planeTitle: `Modular Binary Exponentiation State Vector (${origBase}^${origExp} mod ${mod})`,
      dimensions: "2d" as const,
    };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initialize binary modular exponentiation (${origBase}^${origExp}) mod ${mod}.`,
      why: "Binary exponentiation computes base^exp in O(log exp) multiplications by scanning binary bit positions.",
    },
    primarySnapshot: createVectorSnapshot(res, currentBase, currentExp),
    auxiliaryState: {
      hashMap: {
        "Base (orig)": origBase,
        Exponent: origExp,
        Modulo: mod,
      },
    },
    variables: { base: currentBase, exp: currentExp, res: 1 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Set initial result accumulator res = 1.",
      why: "1 is the multiplicative identity element for exponentiation.",
    },
    primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "res"),
    auxiliaryState: {
      hashMap: { res: 1 },
    },
    variables: { base: currentBase, exp: currentExp, res: 1 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Reduce base modulo ${mod}: base = ${origBase} % ${mod} = ${currentBase}.`,
      why: "Initial modular reduction prevents large intermediate values and numerical overflow.",
    },
    primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "base"),
    auxiliaryState: {
      hashMap: { base: currentBase },
    },
    variables: { base: currentBase, exp: currentExp, res: 1 },
  });

  while (currentExp > 0) {
    const isOdd = currentExp % 2 === 1;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Evaluate exponent loop condition: exp = ${currentExp} > 0.`,
        why: `Exponent is non-zero (binary 0b${currentExp.toString(2)}). Continuing binary exponentiation loop.`,
      },
      primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "exp"),
      auxiliaryState: {
        hashMap: {
          "Exponent (binary)": currentExp.toString(2),
          "Bit Parity": isOdd ? "1 (Odd)" : "0 (Even)",
        },
      },
      variables: { base: currentBase, exp: currentExp, res },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Check least significant bit: exp % 2 = ${isOdd ? 1 : 0} (${isOdd ? "odd" : "even"}).`,
        why: isOdd
          ? "LSB is 1: multiply running accumulator by current base power."
          : "LSB is 0: current base power is skipped in accumulator accumulation.",
      },
      primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "exp"),
      auxiliaryState: {
        hashMap: {
          "Current Bit": isOdd ? "1" : "0",
          Action: isOdd ? "Multiply into res" : "Skip multiplication",
        },
      },
      variables: { base: currentBase, exp: currentExp, res, isOdd },
    });

    if (isOdd) {
      const prevRes = res;
      res = (res * currentBase) % mod;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 6,
        explanation: {
          what: `Update res = (${prevRes} * ${currentBase}) % ${mod} = ${res}.`,
          why: "Accumulate current base power into running product since active bit is 1.",
        },
        primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "res"),
        auxiliaryState: {
          hashMap: {
            "Prev res": prevRes,
            "Base power": currentBase,
            "New res": res,
          },
        },
        variables: { base: currentBase, exp: currentExp, res },
      });
    }

    const prevBase = currentBase;
    currentBase = (currentBase * currentBase) % mod;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Square base modulo ${mod}: base = (${prevBase}^2) % ${mod} = ${currentBase}.`,
        why: "Repeated squaring generates the next binary power of the base (b^(2^k)).",
      },
      primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "base"),
      auxiliaryState: {
        hashMap: {
          "Prev base": prevBase,
          "Squared base": currentBase,
        },
      },
      variables: { base: currentBase, exp: currentExp, res },
    });

    const prevExp = currentExp;
    currentExp = Math.floor(currentExp / 2);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Shift exponent right: exp = floor(${prevExp} / 2) = ${currentExp}.`,
        why: "Discard processed least significant bit to inspect the next binary power.",
      },
      primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "exp"),
      auxiliaryState: {
        hashMap: {
          "Prev exp": prevExp,
          "New exp": currentExp,
        },
      },
      variables: { base: currentBase, exp: currentExp, res },
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Loop terminates: exp reached 0.",
      why: "All binary bit positions of the exponent have been processed.",
    },
    primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "exp"),
    auxiliaryState: {
      hashMap: {
        Status: "Binary scan complete",
      },
    },
    variables: { base: currentBase, exp: currentExp, res },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Return final result: (${origBase}^${origExp}) mod ${mod} = ${res}.`,
      why: `Binary exponentiation finished in O(log exp) operations. Result: ${res}.`,
    },
    primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "res"),
    auxiliaryState: {
      hashMap: {
        "Final Result": res,
      },
    },
    variables: { res },
  });

  return steps;
};

export const generateModularExponentiationInverseSteps = generateModularExponentiationSteps;
export const DEFAULT_MODULAR_EXPONENTIATION_INVERSE_INPUT = DEFAULT_MODULAR_EXPONENTIATION_INPUT;

export const MODULAR_EXPONENTIATION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Modular Binary Exponentiation calculates <code>b^e mod m</code> in <span>O(log e)</span> time using <span>O(1)</span> space. By exploiting binary exponent representations, it replaces <code>e</code> sequential multiplications with at most <code>2 &lfloor;log_2 e&rfloor;</code> modular multiplications. Via Fermat's Little Theorem (<code>a^{p-1} &equiv; 1 mod p</code>), computing the modular inverse <code>a&sup1; mod p</code> simplifies to computing <code>a^{p-2} mod p</code> in <span>O(log p)</span> time.</p>",
  sections: [
    {
      heading: "Binary Decomposition & Repeated Squaring",
      body: "<p>Any integer exponent <code>e</code> can be decomposed into binary form <code>e = &sum; b_i 2^i</code> where <code>b_i &isin; {0, 1}</code>. Thus:</p><p><code>b^e = b^{&sum; b_i 2^i} = &prod; (b^{2^i}) mod m</code></p><p>By repeatedly squaring the base at each step (<code>b_{i+1} &equiv; b_i&sup2; mod m</code>), we generate <code>b^{2^i}</code> in <span>O(1)</span> time. Whenever binary bit <code>b_i = 1</code>, the current squared base is multiplied into the running accumulator.</p>",
    },
    {
      heading: "Fermat's Little Theorem & Modular Inverses",
      body: "<p>Fermat's Little Theorem states that if prime <code>p</code> does not divide <code>a</code> (i.e. <code>gcd(a, p) = 1</code>):</p><p><code>a^{p-1} &equiv; 1 (mod p)</code></p><p>Multiplying both sides by <code>a&sup1;</code> yields:</p><p><code>a^{p-2} &equiv; a&sup1; (mod p)</code></p><p>Thus, modular division <code>(x / a) mod p</code> simplifies to <code>x &middot; a^{p-2} mod p</code> via modular exponentiation in <span>O(log p)</span> time.</p>",
    },
    {
      heading: "Cryptographic Applications & BigInt Arithmetic",
      body: "<p>Modular exponentiation is the core computational kernel for modern public-key cryptography:</p><ul><li>RSA Encryption: <code>c = m^e mod N</code></li><li>Diffie-Hellman Key Exchange: <code>K = g^{ab} mod p</code></li><li>ElGamal Digital Signatures</li></ul><p>To prevent floating-point or integer overflow during products <code>(res &middot; base)</code>, arithmetic with prime moduli <code>&gt; 2&sup3;&sup1; - 1</code> requires BigInt or 64-bit unsigned integer types.</p>",
    },
    {
      heading: "Edge Cases & General Inverses",
      body: "<p>Boundary conditions include <code>e = 0</code> (<code>b^0 &equiv; 1 mod m</code>), <code>b = 0</code> (<code>0^e &equiv; 0 mod m</code>), and <code>m = 1</code> (always returns 0). Note: Fermat's Little Theorem strictly requires <code>m</code> to be prime. For composite modulus <code>m</code>, use Extended Euclidean Algorithm or Euler's Totient Theorem (<code>a^{&phi;(m)-1} &equiv; a&sup1; mod m</code>).</p>",
    },
  ],
  keyTerms: [
    {
      term: "Binary Exponentiation",
      definition: "An algorithm evaluating b^e mod m in O(log e) operations via repeated squaring.",
    },
    {
      term: "Fermat's Little Theorem",
      definition: "The number-theoretic identity a^{p-1} ≡ 1 mod p for prime p and gcd(a, p) = 1.",
    },
    {
      term: "Modular Multiplicative Inverse",
      definition: "An integer x satisfying a · x ≡ 1 mod m, denoted a⁻¹ mod m.",
    },
  ],
};

export const MODULAR_EXPONENTIATION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines mod_pow function signature taking base $b$, exponent $e$, and modulus $m$.",
    2: "Initializes result accumulator $res = 1$, representing $b^0$.",
    3: "Reduces initial base modulo $mod$ ($b \\leftarrow b \\bmod m$).",
    4: "Loops while exponent $exp > 0$, iterating over binary bits.",
    5: "Checks if current lowest bit of $exp$ is 1 ($exp \\bmod 2 == 1$).",
    6: "Multiplies running result $res$ by current base power modulo $mod$ when bit is 1.",
    7: "Squares base modulo $mod$ ($base \\leftarrow base^2 \\bmod m$) for next binary power.",
    8: "Halves exponent power ($exp \\leftarrow \\lfloor exp / 2 \\rfloor$) via right-shift.",
    9: "Returns final modular exponentiation result $b^e \\bmod m$.",
    10: "Empty line separating functions.",
    11: "Defines mod_inverse function signature taking integer $a$ and prime modulus $m$.",
    12: "Returns mod_pow(a, m - 2, m), computing $a^{-1} \\equiv a^{m-2} \\pmod m$.",
  },
};

export const modularExponentiationInverse: AlgorithmDefinition<ModularExponentiationInput> = {
  id: "modular-exponentiation-inverse",
  title: "Modular Exponentiation & Inverse",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute <code>(b^e) mod m</code> in <span>O(log e)</span> time using binary exponentiation, and calculate modular multiplicative inverse <code>a&sup1; mod p</code> via Fermat's Little Theorem when <code>p</code> is prime.</p><p><code>mod_pow(b, e, m) = &prod; (b^{2^i}) mod m</code></p><h3>Mathematical State Vector</h3><p>The dynamic state is represented by state vector <code>v = (res, base, exp)^T</code>, where at step <code>k</code>, <code>exp_k = &lfloor;e / 2^k&rfloor;</code> and <code>base_k = b^{2^k} mod m</code>.</p><h3>Input Parameters</h3><ul><li><code>base</code> (<code>b &isin; &Z;&ge;0</code>): Base integer.</li><li><code>exp</code> (<code>e &ge; 0</code>): Exponent power.</li><li><code>mod</code> (<code>m &gt; 0</code>): Modulo divisor.</li></ul><h3>Output</h3><ul><li><code>int</code>: <code>(b^e) mod m</code>.</li></ul>",
  constraints: ["0 <= base, exp <= 10^18", "1 <= mod <= 2 * 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Power (2^10 mod 1000)",
      input: { base: 2, exp: 10, mod: 1000 },
      output: "24",
      explanation: "2^10 = 1024. 1024 % 1000 = 24.",
    },
    {
      kind: "complex",
      title: "Modular Inverse (3^(-1) mod 11)",
      input: { base: 3, exp: 9, mod: 11 },
      output: "4",
      explanation:
        "3^(-1) mod 11 via Fermat = 3^(11-2) mod 11 = 3^9 mod 11 = 4. (3*4 = 12 ≡ 1 mod 11).",
    },
    {
      kind: "negative",
      title: "Zero Exponent (7^0 mod 13)",
      input: { base: 7, exp: 0, mod: 13 },
      output: "1",
      explanation: "Any non-zero base raised to power 0 equals 1.",
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
    time: "The loop executes $\\lfloor \\log_2 exp \\rfloor + 1$ iterations. Each step performs $\\mathcal{O}(1)$ modular multiplications, yielding overall runtime $\\mathcal{O}(\\log exp)$.",
    space:
      "Requires $\\mathcal{O}(1)$ space as only accumulator variables $(res, base, exp)$ are stored.",
  },
  topicGuide: MODULAR_EXPONENTIATION_TOPIC_GUIDE,
  trivia: MODULAR_EXPONENTIATION_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 21",
      label: "Competitive Programmer's Handbook, Ch 21",
    },
  ],
  defaultInput: DEFAULT_MODULAR_EXPONENTIATION_INPUT,
  generateSteps: generateModularExponentiationSteps,
};
