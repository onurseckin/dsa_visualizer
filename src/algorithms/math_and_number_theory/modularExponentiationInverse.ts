import type { AlgorithmDefinition, AlgorithmStep, VectorItem, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ModularExponentiationInput {
  base: number;
  exp: number;
  mod: number;
}

export const PYTHON_MODULAR_EXPONENTIATION_CODE = `
def mod_pow(base: int, exp: int, mod: int) -> int:
    """
    Computes (base^exp) % mod in O(log exp) time using binary exponentiation.
    """
    res = 1
    base = base % mod
    while exp > 0:
        if exp % 2 == 1:
            res = (res * base) % mod
        base = (base * base) % mod
        exp //= 2
    return res

def mod_inverse(a: int, m: int) -> int:
    """
    Computes modular inverse a^(-1) mod m via Fermat's Little Theorem (assumes m is prime).
    """
    return mod_pow(a, m - 2, m)
`;

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

  const origBase = Math.floor(input.base);
  const origExp = Math.max(0, Math.floor(input.exp));
  const mod = input.mod > 0 ? Math.floor(input.mod) : 1000000007;

  let currentBase = ((origBase % mod) + mod) % mod;
  let currentExp = origExp;
  let res = 1;

  const createVectorSnapshot = (rVal: number, bVal: number, eVal: number, activeSlot?: "res" | "base" | "exp") => {
    const vectors: VectorItem[] = [
      { id: "res", label: `res = ${rVal}`, x: rVal % 100, y: 0, state: activeSlot === "res" ? "active" : "result" },
      { id: "base", label: `base = ${bVal}`, x: bVal % 100, y: 1, state: activeSlot === "base" ? "active" : "compared" },
      { id: "exp", label: `exp = ${eVal} (0b${eVal.toString(2)})`, x: eVal, y: 2, state: activeSlot === "exp" ? "active" : "default" },
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
    codeLine: 2,
    explanation: {
      what: `Starting Binary Modular Exponentiation: (${origBase}^${origExp}) mod ${mod}.`,
      why: "Binary exponentiation computes base^exp in O(log exp) multiplications by scanning binary bits.",
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
    codeLine: 6,
    explanation: {
      what: "Set initial accumulator res = 1.",
      why: "Multiplicative identity base case.",
    },
    primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "res"),
    auxiliaryState: {
      hashMap: { "res": 1 },
    },
    variables: { base: currentBase, exp: currentExp, res: 1 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Reduced base: base = ${origBase} % ${mod} = ${currentBase}.`,
      why: "Initial modular reduction prevents large number multiplication overflow.",
    },
    primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "base"),
    auxiliaryState: {
      hashMap: { "base": currentBase },
    },
    variables: { base: currentBase, exp: currentExp, res: 1 },
  });

  while (currentExp > 0) {
    const isOdd = currentExp % 2 === 1;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Evaluating current exponent exp = ${currentExp} (binary ${currentExp.toString(2)}).`,
        why: isOdd
          ? `Exponent ${currentExp} is odd (lowest binary bit is 1), so multiply res by current base.`
          : `Exponent ${currentExp} is even (lowest binary bit is 0), skip result multiplication.`,
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

    if (isOdd) {
      const prevRes = res;
      res = (res * currentBase) % mod;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Updated res = (${prevRes} * ${currentBase}) % ${mod} = ${res}.`,
          why: "Accumulated current base power into running result.",
        },
        primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "res"),
        auxiliaryState: {
          hashMap: {
            "Previous res": prevRes,
            "Current base": currentBase,
            "Updated res": res,
          },
        },
        variables: { base: currentBase, exp: currentExp, res },
      });
    }

    const prevBase = currentBase;
    currentBase = (currentBase * currentBase) % mod;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Squared base: (${prevBase} * ${prevBase}) % ${mod} = ${currentBase}.`,
        why: "Repeated squaring doubles power of base for next binary bit position.",
      },
      primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "base"),
      auxiliaryState: {
        hashMap: {
          "Previous base": prevBase,
          "Squared base": currentBase,
        },
      },
      variables: { base: currentBase, exp: currentExp, res },
    });

    currentExp = Math.floor(currentExp / 2);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Halved exp: exp //= 2 -> ${currentExp}.`,
        why: "Shift right to next binary bit position.",
      },
      primarySnapshot: createVectorSnapshot(res, currentBase, currentExp, "exp"),
      auxiliaryState: {
        hashMap: { "Remaining exp": currentExp },
      },
      variables: { base: currentBase, exp: currentExp, res },
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Finished Modular Exponentiation: (${origBase}^${origExp}) mod ${mod} = ${res}.`,
      why: "Exponent exp reached 0.",
    },
    primarySnapshot: createVectorSnapshot(res, currentBase, 0, "res"),
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
    "Modular Binary Exponentiation calculates $b^e \\bmod m$ in $\\mathcal{O}(\\log e)$ time using $\\mathcal{O}(1)$ space. By exploiting binary exponent representations, it replaces $e$ sequential multiplications with at most $2 \\lfloor \\log_2 e \\rfloor$ modular multiplications. Via Fermat's Little Theorem ($a^{p-1} \\equiv 1 \\pmod p$), computing the modular inverse $a^{-1} \\bmod p$ simplifies to computing $a^{p-2} \\bmod p$ in $\\mathcal{O}(\\log p)$ time.",
  sections: [
    {
      heading: "Binary Decomposition & Repeated Squaring",
      body: "Any integer exponent $e$ can be decomposed into binary form $e = \\sum_{i=0}^k b_i 2^i$ where $b_i \\in \\{0, 1\\}$. Thus:\n$$b^e = b^{\\sum b_i 2^i} = \\prod_{b_i = 1} b^{2^i} \\pmod m$$\nBy repeatedly squaring the base at each step ($b_{i+1} \\equiv b_i^2 \\pmod m$), we generate $b^{2^i}$ in $\\mathcal{O}(1)$ time. Whenever binary bit $b_i = 1$, the current squared base is multiplied into the running accumulator.",
    },
    {
      heading: "Fermat's Little Theorem & Modular Inverses",
      body: "Fermat's Little Theorem states that if prime $p$ does not divide $a$ (i.e. $\\gcd(a, p) = 1$):\n$$a^{p-1} \\equiv 1 \\pmod p$$\nMultiplying both sides by $a^{-1}$ yields:\n$$a^{p-2} \\equiv a^{-1} \\pmod p$$\nThus, modular division $\\frac{x}{a} \\bmod p$ simplifies to $x \\cdot a^{p-2} \\bmod p$ via modular exponentiation in $\\mathcal{O}(\\log p)$ time.",
    },
    {
      heading: "Cryptographic Applications & BigInt Arithmetic",
      body: "Modular exponentiation is the core computational kernel for modern public-key cryptography:\n- RSA Encryption: $c = m^e \\bmod N$\n- Diffie-Hellman Key Exchange: $K = g^{ab} \\bmod p$\n- ElGamal Digital Signatures\n\nTo prevent floating-point or integer overflow during products $(res \\cdot base)$, arithmetic with prime moduli $> 2^{31}-1$ requires BigInt or 64-bit unsigned integer types.",
    },
    {
      heading: "Edge Cases & General Inverses",
      body: "Boundary conditions include $e = 0$ ($b^0 \\equiv 1 \\bmod m$), $b = 0$ ($0^e \\equiv 0 \\bmod m$), and $m = 1$ (always returns $0$). Note: Fermat's Little Theorem strictly requires $m$ to be prime. For composite modulus $m$, use Extended Euclidean Algorithm or Euler's Totient Theorem ($a^{\\phi(m)-1} \\equiv a^{-1} \\pmod m$).",
    },
  ],
  keyTerms: [
    {
      term: "Binary Exponentiation",
      definition: "An algorithm evaluating $b^e \\bmod m$ in $\\mathcal{O}(\\log e)$ operations via repeated squaring.",
    },
    {
      term: "Fermat's Little Theorem",
      definition: "The number-theoretic identity $a^{p-1} \\equiv 1 \\pmod p$ for prime $p$ and $\\gcd(a, p) = 1$.",
    },
    {
      term: "Modular Multiplicative Inverse",
      definition: "An integer $x$ satisfying $a \\cdot x \\equiv 1 \\pmod m$, denoted $a^{-1} \\bmod m$.",
    },
  ],
};

export const MODULAR_EXPONENTIATION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines mod_pow function signature taking base $b$, exponent $e$, and modulus $m$.",
    3: "Opening docstring tag.",
    4: "Docstring describing $\\mathcal{O}(\\log e)$ binary modular exponentiation.",
    5: "Closing docstring tag.",
    6: "Initializes result accumulator $res = 1$, representing $b^0$.",
    7: "Reduces initial base modulo $mod$ ($b \\leftarrow b \\bmod m$).",
    8: "Loops while exponent $exp > 0$, iterating over binary bits.",
    9: "Checks if current lowest bit of $exp$ is 1 ($exp \\bmod 2 == 1$).",
    10: "Multiplies running result $res$ by current base power modulo $mod$ when bit is 1.",
    11: "Squares base modulo $mod$ ($base \\leftarrow base^2 \\bmod m$) for next binary power.",
    12: "Halves exponent power ($exp \\leftarrow \\lfloor exp / 2 \\rfloor$) via right-shift.",
    13: "Returns final modular exponentiation result $b^e \\bmod m$.",
    14: "Empty line separating functions.",
    15: "Defines mod_inverse function signature taking integer $a$ and prime modulus $m$.",
    16: "Opening docstring tag.",
    17: "Docstring describing Fermat's Little Theorem modular inverse.",
    18: "Closing docstring tag.",
    19: "Returns mod_pow(a, m - 2, m), computing $a^{-1} \\equiv a^{m-2} \\pmod m$.",
    20: "Empty trailing line for code formatting.",
  },
};

export const modularExponentiationInverse: AlgorithmDefinition<ModularExponentiationInput> = {
  id: "modular-exponentiation-inverse",
  title: "Modular Exponentiation & Inverse",
  category: "math_and_number_theory",
  categories: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Compute $(b^e) \\bmod m$ in $\\mathcal{O}(\\log e)$ time using binary exponentiation, and calculate modular multiplicative inverse $a^{-1} \\bmod p$ via Fermat's Little Theorem when $p$ is prime.\n\n$$\\text{mod\\_pow}(b, e, m) = \\prod_{b_i = 1} b^{2^i} \\bmod m$$\n\n### Mathematical State Vector\nThe dynamic state is represented by state vector $\\mathbf{v} = (res, base, exp)^T \\in \\mathbb{Z}^3$, where at step $k$, $exp_k = \\lfloor e / 2^k \\rfloor$ and $base_k = b^{2^k} \\bmod m$.\n\n### Input Parameters\n- `base` ($b \\in \\mathbb{Z}$): Base integer.\n- `exp` ($e \\in \\mathbb{Z}_{\\ge 0}$): Exponent power.\n- `mod` ($m \\in \\mathbb{Z}_{> 0}$): Modulo divisor.\n\n### Output\n- `int`: $(b^e) \\bmod m$.\n\n### Edge Cases & Constraints\n- `exp = 0`: Returns 1.\n- Fermat's Inverse: Assumes $m$ is prime, computing $a^{m-2} \\bmod m$.",
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
      explanation: "3^(-1) mod 11 via Fermat = 3^(11-2) mod 11 = 3^9 mod 11 = 4. (3*4 = 12 ≡ 1 mod 11).",
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
    space: "Requires $\\mathcal{O}(1)$ space as only accumulator variables $(res, base, exp)$ are stored.",
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
