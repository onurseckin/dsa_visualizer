import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ChineseRemainderInput {
  num: number[];
  rem: number[];
}

export const PYTHON_CHINESE_REMAINDER_CODE = `
def chinese_remainder(num: list[int], rem: list[int]) -> int:
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
  num: [2, 3, 5, 7, 11],
  rem: [1, 2, 3, 4, 5],
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

  const num = input.num && input.num.length > 0 ? input.num : [2, 3, 5];
  const rem = input.rem && input.rem.length === num.length ? input.rem : [1, 2, 3];
  const k = num.length;

  const partialMs: (number | string)[] = new Array(k).fill("-");
  const invs: (number | string)[] = new Array(k).fill("-");
  const terms: (number | string)[] = new Array(k).fill("-");

  const createMatrixSnapshot = (activeRow: number | null, activeCol: number | null) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < k; r++) {
      const rowVals = [num[r], rem[r], partialMs[r], invs[r], terms[r]];
      for (let c = 0; c < 5; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (r === activeRow && c === activeCol) {
          state = "active";
        } else if (r === activeRow) {
          state = "compared";
        } else if (typeof terms[r] === "number") {
          state = "sorted";
        }

        cells.push({
          row: r,
          col: c,
          value: rowVals[c],
          label: `Row ${r + 1}`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: k,
      cols: 5,
      cells,
      rowHeaders: num.map((_, idx) => `Eq #${idx + 1}`),
      colHeaders: ["m_i", "r_i", "M_i = M/m_i", "M_i^-1 mod m_i", "Term_i"],
      title: "CRT Congruence System Matrix",
    };
  };

  // Step 0: Input setup
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Received ${k} linear congruences: x ≡ r_i (mod m_i).`,
      why: "Chinese Remainder Theorem guarantees a unique solution modulo M = m_1 * m_2 * ... * m_k for pairwise coprime moduli.",
    },
    primarySnapshot: createMatrixSnapshot(null, null),
    auxiliaryState: {
      hashMap: {
        Congruences: num.map((n, i) => `x ≡ ${rem[i]} (mod ${n})`).join(", "),
        SystemSize: `${k} equations`,
      },
      customState: {
        numCount: k,
      },
    },
    variables: {
      congruenceCount: k,
      prod: 1,
      result: 0,
    },
  });

  // Step 1: Compute total product N
  let prod = 1;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Initializing total product of moduli M = 1.",
      why: "Master modulus M = prod(m_i) bounds the unique solution range.",
    },
    primarySnapshot: createMatrixSnapshot(null, null),
    auxiliaryState: {
      hashMap: { "Initial M": "1" },
    },
    variables: { prod: 1, result: 0 },
  });

  for (let i = 0; i < k; i++) {
    const prevProd = prod;
    prod *= num[i];
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Multiplying modulus m_${i + 1} = ${num[i]}: M = ${prevProd} * ${num[i]} = ${prod}.`,
        why: "Accumulate total modulus product for all pairwise coprime moduli.",
      },
      primarySnapshot: createMatrixSnapshot(i, 0),
      auxiliaryState: {
        hashMap: {
          "Current Modulus m_i": `${num[i]}`,
          "Accumulated M": `${prod}`,
        },
      },
      variables: { prod, n: num[i] },
    });
  }

  // Step 2: Loop over each congruence
  let result = 0;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Master modulus M = ${prod}. Initializing running sum result = 0.`,
      why: "We will now evaluate the basis contribution for each congruence equation.",
    },
    primarySnapshot: createMatrixSnapshot(null, null),
    auxiliaryState: {
      hashMap: { "Master Modulus M": `${prod}`, "Running Result": "0" },
    },
    variables: { prod, result: 0 },
  });

  for (let i = 0; i < k; i++) {
    const ni = num[i];
    const ri = rem[i];

    // Compute M_i
    const p = Math.floor(prod / ni);
    partialMs[i] = p;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `Equation #${i + 1}: x ≡ ${ri} (mod ${ni}). Partial product M_${i + 1} = M / m_${i + 1} = ${prod} / ${ni} = ${p}.`,
        why: `M_${i + 1} = ${p} is divisible by all other moduli except m_${i + 1} (${ni}).`,
      },
      primarySnapshot: createMatrixSnapshot(i, 2),
      auxiliaryState: {
        hashMap: {
          "Equation Index": i + 1,
          "Modulus m_i": ni,
          "Partial M_i": p,
        },
      },
      variables: { i, ni, ri, p, result },
    });

    // Compute inv
    const inv = modPow(p, ni - 2, ni);
    invs[i] = inv;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Modular inverse of M_${i + 1} = ${p} modulo ${ni} is ${inv} (${p} * ${inv} ≡ 1 mod ${ni}).`,
        why: "By Fermat's Little Theorem, M_i^(-1) ≡ M_i^(m_i - 2) (mod m_i).",
      },
      primarySnapshot: createMatrixSnapshot(i, 3),
      auxiliaryState: {
        hashMap: {
          "Partial M_i": p,
          "Modulus m_i": ni,
          "Modular Inverse M_i^-1": inv,
        },
      },
      variables: { i, ni, ri, p, inv, result },
    });

    // Compute term & accumulate
    const term = ri * p * inv;
    terms[i] = term;
    const prevResult = result;
    result += term;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Basis term for Eq #${i + 1}: r_i * M_i * inv = ${ri} * ${p} * ${inv} = ${term}. Add to result: ${prevResult} + ${term} = ${result}.`,
        why: `Term ${term} evaluates to ${ri} modulo ${ni} and 0 modulo all other moduli.`,
      },
      primarySnapshot: createMatrixSnapshot(i, 4),
      auxiliaryState: {
        hashMap: {
          "Equation #": i + 1,
          "Term Contribution": term,
          "Running Result Sum": result,
        },
      },
      variables: { i, ni, ri, p, inv, term, result },
    });
  }

  // Step 3: Final modulo reduction
  const finalAns = result % prod;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Final answer x = ${result} % ${prod} = ${finalAns}.`,
      why: "The minimum non-negative integer solution satisfying all linear congruences.",
    },
    primarySnapshot: createMatrixSnapshot(null, null),
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
    "The Chinese Remainder Theorem (CRT) guarantees that a system of simultaneous linear congruences $x \\equiv r_i \\pmod{m_i}$ with pairwise coprime moduli has a unique solution modulo master product $M = \\prod_{i=1}^k m_i$. It allows high-precision calculations over large numbers to be decomposed into independent parallel computations over smaller modular fields.",
  sections: [
    {
      heading: "Constructive Explicit Solution Formula",
      body: "Given $k$ congruences $x \\equiv r_i \\pmod{m_i}$, let $M = \\prod_{i=1}^k m_i$ and $M_i = \\frac{M}{m_i}$. Because $\\gcd(M_i, m_i) = 1$, the modular multiplicative inverse $M_i^{-1} \\bmod m_i$ exists. The combined solution is constructed as:\n$$x = \\sum_{i=1}^k \\left( r_i \\cdot M_i \\cdot \\left(M_i^{-1} \\bmod m_i\\right) \\right) \\pmod M$$\nFor each term $i$, taking modulo $m_i$ cancels all other terms $j \\neq i$ (since $m_i \\mid M_j$) and leaves $r_i \\cdot 1 = r_i$.",
    },
    {
      heading: "Pairwise Coprime Condition & Generalization",
      body: "Pairwise coprimality ($\\gcd(m_i, m_j) = 1$ for all $i \\neq j$) ensures that each modular inverse $M_i^{-1} \\bmod m_i$ exists. If moduli are not pairwise coprime, a solution exists if and only if $r_i \\equiv r_j \\pmod{\\gcd(m_i, m_j)}$ for all pairs, solved by splitting moduli into prime powers.",
    },
    {
      heading: "Systems & Real-World Applications",
      body: "CRT is heavily utilized in modern computing:\n1. RSA Cryptography: CRT-RSA accelerates private key operations (decryption and signing) by factorizing 2048-bit modular exponentiations into parallel 1024-bit prime factor computations.\n2. Multi-Modular Arithmetic: Computing giant integer matrix determinants or polynomial products via parallel single-word prime operations without BigInt overhead.\n3. Number Theoretic Transform (NTT) over composite moduli domains.",
    },
    {
      heading: "Implementation & Edge Cases",
      body: "Care must be taken to prevent integer overflow when computing intermediate terms $r_i \\cdot M_i \\cdot \\text{inv}_i$. Intermediate products can reach $\\mathcal{O}(M^2)$, requiring 64-bit or BigInt types. Key boundary cases include $r_i = 0$ for all $i$ (yielding $0 \\bmod M$) and single congruence systems ($k = 1$).",
    },
  ],
  keyTerms: [
    {
      term: "Linear Congruence",
      definition:
        "An equation $x \\equiv r \\pmod m$ stating that $x$ and $r$ leave the identical remainder when divided by $m$.",
    },
    {
      term: "Pairwise Coprime Moduli",
      definition:
        "A set of integers where every pair shares no common factor $> 1$ ($\\gcd(m_i, m_j) = 1$).",
    },
    {
      term: "CRT Basis Term",
      definition:
        "The value $e_i = M_i \\cdot \\left(M_i^{-1} \\bmod m_i\\right)$, which evaluates to $1 \\bmod m_i$ and $0 \\bmod m_j$ for $j \\neq i$.",
    },
  ],
};

export const CHINESE_REMAINDER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines chinese_remainder function signature taking arrays num ($m_i$) and rem ($r_i$).",
    3: "Initializes total moduli product accumulator prod = 1.",
    4: "Loops over moduli in num array.",
    5: "Multiplies each modulus n into total product prod.",
    6: "Empty line separating product initialization from solution loop.",
    7: "Initializes running solution sum accumulator result = 0.",
    8: "Loops over corresponding (n_i, r_i) pairs in num and rem.",
    9: "Computes partial product p = prod // n_i.",
    10: "Computes modular inverse inv = pow(p, n_i - 2, n_i) assuming n_i is prime.",
    11: "Adds basis term r_i * p * inv to running solution result.",
    12: "Empty line separating calculation loop from final return.",
    13: "Returns result % prod, the unique solution modulo total master product.",
    14: "Empty trailing line for code formatting.",
  },
};

export const chineseRemainderTheorem: AlgorithmDefinition<ChineseRemainderInput> = {
  id: "chinese-remainder-theorem",
  title: "Chinese Remainder Theorem",
  topicIds: ["math_and_number_theory"],
  difficulty: "Hard",
  description:
    "Solves a system of simultaneous linear congruences $x \\equiv r_i \\pmod{m_i}$ for pairwise coprime moduli $m_i$.\n\n$$x = \\sum_{i=1}^k r_i \\cdot M_i \\cdot \\left(M_i^{-1} \\bmod m_i\\right) \\pmod M$$\nwhere $M = \\prod m_i$ and $M_i = \\frac{M}{m_i}$.\n\n### State Matrix Representation\nThe system solution is tracked via a matrix $\\mathbf{M} \\in \\mathbb{Z}^{k \\times 5}$ recording $(m_i, r_i, M_i, M_i^{-1}, \\text{Term}_i)$ for each congruence $i$.\n\n### Input Parameters\n- `num` (`list[int]`): Array of pairwise coprime moduli $[m_1, m_2, \\dots, m_k]$.\n- `rem` (`list[int]`): Array of remainders $[r_1, r_2, \\dots, r_k]$.\n\n### Output\n- `int`: The minimal unique non-negative integer solution $x \\bmod M$.\n\n### Edge Cases & Constraints\n- All zero remainders: Returns 0.\n- Single congruence: Returns $r_1 \\bmod m_1$.",
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
    time: "For $K$ congruences, computing each modular inverse takes $\\mathcal{O}(\\log m_i)$ time. Total runtime is $\\mathcal{O}(K \\log M)$.",
    space: "Requires $\\mathcal{O}(K)$ space to store intermediate matrix basis vectors.",
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
