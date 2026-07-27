import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ChineseRemainderInput {
  num: number[];
  rem: number[];
}

export const PYTHON_CHINESE_REMAINDER_CODE = `def chinese_remainder(num: list[int], rem: list[int]) -> int:
    prod = 1
    for n in num:
        prod *= n
    result = 0
    for n_i, r_i in zip(num, rem):
        p = prod // n_i
        inv = pow(p, n_i - 2, n_i)
        result += r_i * p * inv
    return result % prod`;

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

  const createElements = (
    activeIdx: number | null,
  ): ArrayElement[] => {
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
    "The Chinese Remainder Theorem (CRT) states that if one knows the remainders of the Euclidean division of an integer n by several integers, then one can determine uniquely the remainder of the division of n by the product of these integers, provided the divisors are pairwise coprime.",
  sections: [
    {
      heading: "Constructive Solution Formula",
      body: "Given x ≡ r_i (mod m_i), let M = m_1 * m_2 * ... * m_k and M_i = M / m_i. Then x = sum(r_i * M_i * (M_i^(-1) mod m_i)) mod M.",
    },
    {
      heading: "Pairwise Coprime Condition",
      body: "CRT requires that gcd(m_i, m_j) = 1 for all i != j to guarantee existence and uniqueness of the solution modulo M.",
    },
  ],
  keyTerms: [
    {
      term: "Linear Congruence",
      definition: "An equation of the form x ≡ r (mod m).",
    },
    {
      term: "Modulus Product",
      definition: "The total product M = prod(m_i) of all pairwise coprime moduli.",
    },
  ],
};

export const CHINESE_REMAINDER_TRIVIA: TriviaMeta = {
  skipLines: [1, 5, 10],
  distractors: [
    "p = prod * n_i",
    "inv = pow(p, n_i, n_i)",
    "result += r_i * p",
    "return result * prod",
  ],
  hints: [
    { line: 7, hint: "Partial modulus M_i is defined as total product divided by current n_i." },
    { line: 9, hint: "Accumulate term r_i * M_i * inverse into running result." },
    { line: 10, hint: "Final result must be reduced modulo total product." },
  ],
};

export const chineseRemainderTheorem: AlgorithmDefinition<ChineseRemainderInput> = {
  id: "chinese-remainder-theorem",
  title: "Chinese Remainder Theorem",
  category: "math_and_number_theory",
  difficulty: "Hard",
  description:
    "Solves a system of simultaneous linear congruences x ≡ r_i (mod m_i) for pairwise coprime moduli m_i. Constructs a unique solution modulo the product of all moduli.",
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

export default chineseRemainderTheorem;
