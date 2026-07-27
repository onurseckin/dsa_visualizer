import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ModularExponentiationInput {
  base: number;
  exp: number;
  mod: number;
}

export const PYTHON_MODULAR_EXPONENTIATION_INVERSE_CODE = `
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
    Calculates modular inverse a^(-1) mod m using Fermat's Little Theorem (for prime m).
    """
    return mod_pow(a, m - 2, m)
`;

export const DEFAULT_MODULAR_EXPONENTIATION_INVERSE_INPUT: ModularExponentiationInput = {
  base: 3,
  exp: 11,
  mod: 13,
};

export const generateModularExponentiationInverseSteps = (
  input: ModularExponentiationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  let currentBase = ((input.base % input.mod) + input.mod) % input.mod;
  let currentExp = Math.max(0, Math.floor(input.exp));
  const mod = input.mod;
  let res = 1;

  const createElements = (
    rVal: number,
    bVal: number,
    eVal: number,
    activeSlot?: "res" | "base" | "exp",
  ): ArrayElement[] => {
    return [
      {
        id: "res",
        value: rVal,
        state: activeSlot === "res" ? "active" : "sorted",
        pointers: ["res"],
      },
      {
        id: "base",
        value: bVal,
        state: activeSlot === "base" ? "active" : "compare",
        pointers: ["base"],
      },
      {
        id: "exp",
        value: eVal,
        state: activeSlot === "exp" ? "active" : "default",
        pointers: ["exp"],
      },
      {
        id: "mod",
        value: mod,
        state: "default",
        pointers: ["mod"],
      },
    ];
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Computing (${input.base}^${input.exp}) mod ${mod}. Initializing res = 1, base = ${currentBase}.`,
      why: "Binary exponentiation processes exponent bits from least to most significant.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(res, currentBase, currentExp),
    },
    auxiliaryState: {
      hashMap: {
        "Initial Input": `${input.base}^${input.exp} mod ${mod}`,
        Result: `${res}`,
      },
      customState: {
        res,
        base: currentBase,
        exp: currentExp,
        mod,
      },
    },
    variables: {
      res,
      base: currentBase,
      exp: currentExp,
      mod,
    },
  });

  // Exponentiation loop
  while (currentExp > 0) {
    const isOdd = currentExp % 2 === 1;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Evaluating exp = ${currentExp} (${currentExp.toString(2)} in binary). Bit is ${isOdd ? "1 (odd)" : "0 (even)"}.`,
        why: isOdd
          ? `Exponent is odd (${currentExp}), so multiply result by base (${currentBase}) modulo ${mod}.`
          : `Exponent is even (${currentExp}), skip multiplying into result.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createElements(res, currentBase, currentExp, "exp"),
      },
      auxiliaryState: {
        customState: {
          expBinary: currentExp.toString(2),
          isOdd: isOdd ? "True" : "False",
          res,
          base: currentBase,
        },
      },
      variables: {
        res,
        base: currentBase,
        exp: currentExp,
      },
    });

    if (isOdd) {
      const prevRes = res;
      res = (res * currentBase) % mod;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 6,
        explanation: {
          what: `res = (${prevRes} * ${currentBase}) mod ${mod} = ${res}.`,
          why: "Accumulate base into result for active 1-bit in exponent.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createElements(res, currentBase, currentExp, "res"),
        },
        auxiliaryState: {
          customState: {
            computation: `(${prevRes} * ${currentBase}) % ${mod}`,
            res,
          },
        },
        variables: {
          res,
          base: currentBase,
          exp: currentExp,
        },
      });
    }

    const prevBase = currentBase;
    currentBase = (currentBase * currentBase) % mod;
    const prevExp = currentExp;
    currentExp = Math.floor(currentExp / 2);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Square base: ${prevBase}^2 mod ${mod} = ${currentBase}. Halve exponent: ${prevExp} // 2 = ${currentExp}.`,
        why: "Squaring base doubles its exponent power for the next binary bit position.",
      },
      primarySnapshot: {
        kind: "array",
        elements: createElements(res, currentBase, currentExp, "base"),
      },
      auxiliaryState: {
        customState: {
          newBase: currentBase,
          newExp: currentExp,
        },
      },
      variables: {
        res,
        base: currentBase,
        exp: currentExp,
      },
    });
  }

  // Final step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Computation completed! (${input.base}^${input.exp}) mod ${mod} = ${res}.`,
      why: "Exponent reduced to 0.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(res, currentBase, currentExp, "res"),
    },
    auxiliaryState: {
      hashMap: {
        "Final Result": `${res}`,
      },
      customState: {
        res,
        base: currentBase,
        exp: currentExp,
      },
    },
    variables: {
      res,
    },
  });

  return steps;
};

export const MODULAR_EXPONENTIATION_INVERSE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Modular Exponentiation evaluates (base^exp) mod m in O(log exp) operations using repeated squaring. Coupled with Fermat's Little Theorem, if m is prime and gcd(a, m) = 1, the modular multiplicative inverse a^(-1) mod m is efficiently calculated as a^(m-2) mod m, enabling modular division in cryptographic algorithms.",
  sections: [
    {
      heading: "Repeated Squaring & Binary Decomposition",
      body: "Linear exponentiation computes base^exp via exp multiplications in O(exp) time, which is completely unfeasible for 64-bit exponents like 10^18. Binary exponentiation breaks exp into its binary bits exp = sum b_i * 2^i. We maintain a running base power base^(2^i) by squaring at each step: if bit b_i is 1, we multiply the accumulator by the current base power modulo m. This guarantees completion in at most log2(exp) steps.",
    },
    {
      heading: "Fermat's Little Theorem & Modular Inverse",
      body: "Fermat's Little Theorem states that if p is prime and a is not divisible by p, then a^(p-1) ≡ 1 (mod p). Multiplying both sides by a^(-1) yields a^(-1) ≡ a^(p-2) (mod p). Thus, modular division (a / b) mod p can be performed as (a * b^(p-2)) mod p. If p is composite, Euler's Totient function or the Extended Euclidean Algorithm is used instead.",
    },
    {
      heading: "Cryptographic & Algorithmic Applications",
      body: "Modular exponentiation is a foundational primitive across computer science: 1) RSA Encryption and Decryption (c = m^e mod N and m = c^d mod N), 2) Diffie-Hellman Key Exchange (g^a mod p), 3) Miller-Rabin Primality Testing (probabilistic primality checks via repeated squaring), and 4) Combinatorics (computing combinations C(n, k) % p using modular inverse factorials).",
    },
    {
      heading: "Implementation Nuances & Overflow Guarding",
      body: "When multiplying (res * base) mod m, the product can reach up to (m-1)^2. For m up to 2^31 - 1, standard 64-bit integers prevent overflow. For larger 64-bit moduli (m ~ 10^18), 128-bit integer types (__int128) or modular multiplication algorithms (like Montgomery Multiplication) prevent 64-bit multiplication overflow.",
    },
  ],
  keyTerms: [
    {
      term: "Binary Exponentiation",
      definition:
        "An algorithm computing (base^exp) mod m in logarithmic time by repeated squaring of base and halving exponent.",
    },
    {
      term: "Fermat's Little Theorem",
      definition:
        "The number-theoretic theorem stating that a^(p-1) ≡ 1 (mod p) for prime p and a not divisible by p.",
    },
    {
      term: "Modular Multiplicative Inverse",
      definition: "An integer x such that (a * x) ≡ 1 (mod m), denoted as a^(-1) mod m.",
    },
  ],
};

export const MODULAR_EXPONENTIATION_INVERSE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines mod_pow(base, exp, mod) -> int: binary exponentiation modulo mod.",
    2: "Initialize result res = 1.",
    3: "Reduce base modulo mod up front.",
    4: "Loop while exponent exp > 0.",
    5: "Check if current exponent bit is 1 (exp % 2 == 1).",
    6: "Multiply res by current base modulo mod.",
    7: "Square base modulo mod for next bit position.",
    8: "Integer divide exponent by 2.",
    9: "Return calculated res.",
    11: "Defines mod_inverse(a, m) -> int using Fermat's Little Theorem.",
    12: "Returns mod_pow(a, m - 2, m) when m is prime.",
  },
};

export const modularExponentiationInverse: AlgorithmDefinition<ModularExponentiationInput> = {
  id: "modular-exponentiation-inverse",
  title: "Modular Exponentiation & Inverse",
  category: "math_and_number_theory",
  categories: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Computes (base^exp) mod m in O(log exp) time using binary exponentiation (repeated squaring). Additionally calculates the modular multiplicative inverse a^(-1) mod m using Fermat's Little Theorem as a^(m-2) mod m when m is prime.",
  constraints: ["0 <= base, exp <= 2^31 - 1", "1 <= mod <= 2^31 - 1"],
  examples: [
    {
      kind: "basic",
      title: "Standard Modular Power",
      inputDisplay: "base = 3, exp = 11, mod = 13",
      outputDisplay: "Result = 3^11 mod 13 = 3",
      input: { base: 3, exp: 11, mod: 13 },
      output: "3",
      explanation: "3^11 mod 13 computes to 177147 mod 13 = 3.",
    },
    {
      kind: "complex",
      title: "Modular Inverse via FLT",
      inputDisplay: "a = 3, m = 11 (mod_inverse(3, 11))",
      outputDisplay: "Modular Inverse = 3^9 mod 11 = 4",
      input: { base: 3, exp: 9, mod: 11 },
      output: "4",
      explanation: "3 * 4 = 12 = 1 (mod 11), so 4 is the modular inverse of 3 mod 11.",
    },
    {
      kind: "negative",
      title: "Zero Exponent Edge Case",
      inputDisplay: "base = 7, exp = 0, mod = 13",
      outputDisplay: "7^0 mod 13 = 1",
      input: { base: 7, exp: 0, mod: 13 },
      output: "1",
      explanation: "Any non-zero base raised to power 0 equals 1.",
    },
  ],
  code: PYTHON_MODULAR_EXPONENTIATION_INVERSE_CODE,
  timeComplexity: {
    best: "O(log exp)",
    average: "O(log exp)",
    worst: "O(log exp)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "The exponent is halved in every loop iteration, running in O(log exp) time steps.",
    space: "O(1) auxiliary space as only a few integer scalar variables are tracked.",
  },
  topicGuide: MODULAR_EXPONENTIATION_INVERSE_TOPIC_GUIDE,
  trivia: MODULAR_EXPONENTIATION_INVERSE_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 21",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      section: "21.2 Modular exponentiation",
    },
  ],
  defaultInput: DEFAULT_MODULAR_EXPONENTIATION_INVERSE_INPUT,
  generateSteps: generateModularExponentiationInverseSteps,
};
