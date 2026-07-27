import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ChineseRemainderInput {
  num: number[];
  rem: number[];
}

export const PYTHON_CHINESE_REMAINDER_CODE = `
def chinese_remainder(num: list[int], rem: list[int]) -> int:
    """
    Solves a system of linear congruences x = rem[i] (mod num[i])
    for pairwise coprime moduli num[i].
    """
    prod = 1
    for n in num:
        prod *= n

    result = 0
    for n_i, r_i in zip(num, rem):
        p = prod // n_i
        inv = pow(p, n_i - 2, n_i)
        result += r_i * p * inv

    return result % prod
`;

export const DEFAULT_CHINESE_REMAINDER_INPUT: ChineseRemainderInput = {
  num: [3, 5, 7],
  rem: [2, 3, 2],
};

const modPow = (base: number, exp: number, mod: number): number => {
  let res = 1;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) res = (res * b) % mod;
    b = (b * b) % mod;
    e = Math.floor(e / 2);
  }
  return res;
};

export const generateChineseRemainderSteps = (input: ChineseRemainderInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const num = input.num;
  const rem = input.rem;

  const createElements = (activeIdx: number | null): ArrayElement[] => {
    return num.map((nVal, idx) => {
      const rVal = rem[idx];
      let state: ArrayElement["state"] = "default";
      if (activeIdx !== null) {
        if (idx < activeIdx) state = "sorted";
        else if (idx === activeIdx) state = "active";
      }

      return {
        id: `mod-${idx}`,
        value: nVal,
        state,
        pointers: [`m:${nVal}`, `r:${rVal}`],
      };
    });
  };

  // Step 0: Input setup
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Received ${num.length} system congruences: x ≡ r_i (mod m_i).`,
      why: "Chinese Remainder Theorem guarantees a unique solution modulo M = m_1 * m_2 * ... * m_k.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(null),
    },
    auxiliaryState: {
      hashMap: {
        Congruences: num.map((n, i) => `x ≡ ${rem[i]} (mod ${n})`).join(", "),
      },
      customState: {
        numCount: num.length,
      },
    },
    variables: {
      congruenceCount: num.length,
      prod: 1,
      result: 0,
    },
  });

  // Step 1: Compute total product N
  let prod = 1;
  for (const n of num) {
    prod *= n;
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Total product of moduli M = ${num.join(" * ")} = ${prod}.`,
      why: "M defines the master modulus for combining partial remainder solutions.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(null),
    },
    auxiliaryState: {
      hashMap: {
        "Master Modulus M": `${prod}`,
      },
      customState: {
        prod,
      },
    },
    variables: {
      prod,
      result: 0,
    },
  });

  // Step 2: Loop over each congruence
  let result = 0;

  for (let i = 0; i < num.length; i++) {
    const ni = num[i];
    const ri = rem[i];
    const p = Math.floor(prod / ni);
    const inv = modPow(p, ni - 2, ni);
    const term = ri * p * inv;
    const prevResult = result;
    result += term;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Congruence #${i + 1}: x ≡ ${ri} (mod ${ni}). M_i = ${prod}/${ni} = ${p}. Modular inverse of M_i mod ${ni} = ${inv}.`,
        why: `Term = r_i * M_i * M_i^(-1) = ${ri} * ${p} * ${inv} = ${term}. Accumulating result: ${prevResult} -> ${result}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createElements(i),
      },
      auxiliaryState: {
        visited: num.slice(0, i + 1).map((n) => `mod ${n}`),
        hashMap: {
          CurrentCongruence: `x ≡ ${ri} (mod ${ni})`,
          "Partial M_i": `${p}`,
          "Inverse M_i^(-1)": `${inv}`,
          "Term Contribution": `${term}`,
          RunningSum: `${result}`,
        },
        customState: {
          i,
          ni,
          ri,
          p,
          inv,
          term,
          result,
        },
      },
      variables: {
        i,
        ni,
        ri,
        p,
        inv,
        term,
        result,
      },
    });
  }

  // Step 3: Final modulo reduction
  const finalAns = result % prod;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Final answer x = ${result} % ${prod} = ${finalAns}.`,
      why: "The minimum non-negative integer satisfying all linear congruences.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(num.length),
    },
    auxiliaryState: {
      hashMap: {
        "Unreduced Solution": `${result}`,
        "Master Modulus M": `${prod}`,
        "Final Unique Solution": `x ≡ ${finalAns} (mod ${prod})`,
      },
      customState: {
        finalAns,
        prod,
      },
    },
    variables: {
      finalAns,
      prod,
    },
  });

  return steps;
};

export const CHINESE_REMAINDER_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Chinese Remainder Theorem (CRT) is a core structural result in number theory guaranteeing that a system of simultaneous linear congruences x ≡ r_i (mod m_i) with pairwise coprime moduli has a unique solution modulo M = m_1 * m_2 * ... * m_k. It allows high-precision calculations over large numbers to be decomposed into independent parallel computations over smaller modular fields.",
  sections: [
    {
      heading: "Constructive Explicit Solution Formula",
      body: "Given k congruences x ≡ r_i (mod m_i), let M = m_1 * m_2 * ... * m_k and M_i = M / m_i. Because M_i is coprime to m_i, its modular multiplicative inverse M_i^(-1) mod m_i exists. The combined solution is constructed as x = sum_{i=1}^k (r_i * M_i * (M_i^(-1) mod m_i)) mod M. For each term i, modulo m_i cancels out all other terms j != i (where M_j is divisible by m_i) and yields r_i * 1 = r_i.",
    },
    {
      heading: "Pairwise Coprime Condition & Generalization",
      body: "Pairwise coprimality (gcd(m_i, m_j) = 1 for all i != j) ensures that each modular inverse M_i^(-1) mod m_i exists. If moduli are not pairwise coprime, a solution exists if and only if r_i ≡ r_j (mod gcd(m_i, m_j)) for all pairs, which can be solved by splitting moduli into prime powers or applying Extended GCD iteratively.",
    },
    {
      heading: "Systems & Real-World Applications",
      body: "CRT is heavily utilized in modern computing: 1) RSA Cryptography (CRT-RSA accelerates private key operations like modular exponentiation by factorizing 2048-bit operations into parallel 1024-bit prime factor computations), 2) Multi-Modular Arithmetic in Computer Algebra Systems (computing huge integer matrix determinants by performing parallel single-word prime operations), and 3) Fast Fourier Transform (FFT / NTT) over composite modulus domains.",
    },
    {
      heading: "Implementation & Edge Cases",
      body: "Care must be taken to prevent integer overflow when computing intermediate terms r_i * M_i * inv. In Python, arbitrary precision integers handle this automatically; in standard C++/Java, 128-bit integers (__int128) or BigInteger are used. Key boundary cases include r_i = 0 for all i (yielding 0 mod M) and single congruence systems (k = 1).",
    },
  ],
  keyTerms: [
    {
      term: "Linear Congruence",
      definition:
        "An equation x ≡ r (mod m) stating that x and r leave the identical remainder when divided by m.",
    },
    {
      term: "Pairwise Coprime Moduli",
      definition:
        "A set of integers where every pair shares no common factor greater than 1 (gcd(m_i, m_j) = 1).",
    },
    {
      term: "CRT Basis Term",
      definition:
        "The value M_i * (M_i^(-1) mod m_i), which evaluates to 1 modulo m_i and 0 modulo all other m_j (j != i).",
    },
  ],
};

export const CHINESE_REMAINDER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines chinese_remainder(num, rem) -> int for solving system of linear congruences.",
    2: "Initialize total moduli product prod = 1.",
    3: "Loop over moduli in num array.",
    4: "Multiply each modulus n into total product prod.",
    5: "Initialize running solution sum result = 0.",
    6: "Loop over corresponding (n_i, r_i) pairs in num and rem.",
    7: "Compute partial product p = prod // n_i.",
    8: "Compute modular inverse inv = pow(p, n_i - 2, n_i) assuming n_i is prime.",
    9: "Add term r_i * p * inv to running solution result.",
    10: "Return result % prod, the unique solution modulo total product.",
  },
};

export const chineseRemainderTheorem: AlgorithmDefinition<ChineseRemainderInput> = {
  id: "chinese-remainder-theorem",
  title: "Chinese Remainder Theorem",
  category: "math_and_number_theory",
  categories: ["math_and_number_theory"],
  difficulty: "Hard",
  description:
    "Solves a system of simultaneous linear congruences x ≡ r_i (mod m_i) for pairwise coprime moduli m_i. Constructs the minimal unique non-negative integer solution x modulo M = prod(m_i) using modular inverse basis terms.",
  constraints: ["1 <= num.length <= 10", "2 <= num[i] <= 10^3 (pairwise coprime)"],
  examples: [
    {
      kind: "basic",
      title: "Three Congruences (3, 5, 7)",
      inputDisplay: "num = [3, 5, 7], rem = [2, 3, 2]",
      outputDisplay: "x = 23 (mod 105)",
      input: { num: [3, 5, 7], rem: [2, 3, 2] },
      output: "23",
      explanation: "23 ≡ 2 mod 3, 23 ≡ 3 mod 5, 23 ≡ 2 mod 7. Product = 105.",
    },
    {
      kind: "complex",
      title: "Four Congruences",
      inputDisplay: "num = [2, 3, 5, 7], rem = [1, 2, 3, 4]",
      outputDisplay: "x = 53 (mod 210)",
      input: { num: [2, 3, 5, 7], rem: [1, 2, 3, 4] },
      output: "53",
      explanation: "53 mod 2 = 1, 53 mod 3 = 2, 53 mod 5 = 3, 53 mod 7 = 4.",
    },
    {
      kind: "negative",
      title: "Zero Remainder Edge Case",
      inputDisplay: "num = [3, 5], rem = [0, 0]",
      outputDisplay: "x = 0 (mod 15)",
      input: { num: [3, 5], rem: [0, 0] },
      output: "0",
      explanation: "When all remainders are zero, minimum non-negative solution is 0.",
    },
  ],
  code: PYTHON_CHINESE_REMAINDER_CODE,
  timeComplexity: {
    best: "O(K log M)",
    average: "O(K log M)",
    worst: "O(K log M)",
  },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "For K congruences, computing each modular inverse takes logarithmic time O(log m_i). Total runtime is O(K log M).",
    space: "O(K) memory to store input vectors and step visualizer arrays.",
  },
  topicGuide: CHINESE_REMAINDER_TOPIC_GUIDE,
  trivia: CHINESE_REMAINDER_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 21",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      section: "21.4 Chinese remainder theorem",
    },
  ],
  defaultInput: DEFAULT_CHINESE_REMAINDER_INPUT,
  generateSteps: generateChineseRemainderSteps,
};
