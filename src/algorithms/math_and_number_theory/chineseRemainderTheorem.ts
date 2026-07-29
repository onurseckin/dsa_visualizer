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

export const generateChineseRemainderSteps = (input?: ChineseRemainderInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = input ?? DEFAULT_CHINESE_REMAINDER_INPUT;
  const num =
    Array.isArray(safeInput.num) && safeInput.num.length > 0
      ? safeInput.num
      : DEFAULT_CHINESE_REMAINDER_INPUT.num;
  const rem =
    Array.isArray(safeInput.rem) && safeInput.rem.length === num.length
      ? safeInput.rem
      : DEFAULT_CHINESE_REMAINDER_INPUT.rem;
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
      what: `Initializing system of ${k} linear congruences: x ≡ r_i (mod m_i).`,
      why: "The Chinese Remainder Theorem guarantees a unique minimum non-negative solution modulo master product M = m_1 * m_2 * ... * m_k when moduli are pairwise coprime.",
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
      what: "Initializing total product accumulator M = 1.",
      why: "The master modulus M defines the combined residue class within which the system's unique solution lies.",
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
        what: `Incorporating modulus m_${i + 1} = ${num[i]} into master product: M = ${prevProd} * ${num[i]} = ${prod}.`,
        why: "Multiplying pairwise coprime moduli expands the period M of the system.",
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
      what: `Master modulus computed: M = ${prod}. Initializing result accumulator to 0.`,
      why: "Each congruence equation will contribute an orthogonal basis term to the final sum.",
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
        what: `For equation #${i + 1} (x ≡ ${ri} mod ${ni}), computing partial modulus M_${i + 1} = M / m_${i + 1} = ${prod} / ${ni} = ${p}.`,
        why: `M_${i + 1} = ${p} is divisible by all moduli except m_${i + 1} (${ni}), making its basis term evaluate to 0 modulo all other equations.`,
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
        what: `Computing modular inverse of M_${i + 1} = ${p} modulo ${ni}, yielding inv = ${inv}.`,
        why: `The inverse ensures that M_${i + 1} * inv ≡ 1 (mod ${ni}), scaling the term to match remainder r_${i + 1}.`,
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
    result += term;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Computing basis term #${i + 1}: r_i * M_i * inv = ${ri} * ${p} * ${inv} = ${term}. Adding to result: new sum = ${result}.`,
        why: `This term evaluates to ${ri} (mod ${ni}) and 0 (mod m_j) for all j ≠ i, satisfying the i-th congruence independently.`,
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
      what: `Reducing combined result ${result} modulo master product ${prod} yields final solution x = ${finalAns}.`,
      why: "Taking the sum modulo M guarantees the minimal non-negative integer satisfying all linear congruences.",
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
    "<p>The <strong>Chinese Remainder Theorem (CRT)</strong> proves that a system of simultaneous linear congruences <code>x &equiv; r<sub>i</sub> (mod m<sub>i</sub>)</code> with pairwise coprime moduli has a unique solution modulo master product <code>M = &prod; m<sub>i</sub></code>. It allows high-precision calculations over large numbers to be decomposed into independent parallel computations over smaller modular fields.</p>",
  sections: [
    {
      heading: "Constructive Explicit Solution Formula",
      body: "<p>Given <code>k</code> congruences <code>x &equiv; r<sub>i</sub> (mod m<sub>i</sub>)</code>, let <code>M = &prod; m<sub>i</sub></code> and <code>M<sub>i</sub> = M / m<sub>i</sub></code>. Because <code>gcd(M<sub>i</sub>, m<sub>i</sub>) = 1</code>, the modular multiplicative inverse <code>M<sub>i</sub><sup>-1</sup> mod m<sub>i</sub></code> exists. The combined solution is constructed as:</p><p><code>x = &sum; (r<sub>i</sub> &times; M<sub>i</sub> &times; (M<sub>i</sub><sup>-1</sup> mod m<sub>i</sub>)) (mod M)</code></p><p>For each term, taking modulo <code>m<sub>i</sub></code> cancels all other terms <code>j &ne; i</code> (since <code>m<sub>i</sub></code> divides <code>M<sub>j</sub></code>) and yields <code>r<sub>i</sub></code>.</p>",
    },
    {
      heading: "Pairwise Coprime Condition & Generalization",
      body: "<p>Pairwise coprimality (<code>gcd(m<sub>i</sub>, m<sub>j</sub>) = 1</code> for all <code>i &ne; j</code>) guarantees that each modular inverse exists. When moduli share common factors, a solution exists if and only if <code>r<sub>i</sub> &equiv; r<sub>j</sub> (mod gcd(m<sub>i</sub>, m<sub>j</sub>))</code> across all pairs.</p>",
    },
    {
      heading: "Systems & Real-World Applications",
      body: "<p>CRT is widely used across computer science and cryptography:</p><ul><li><strong>RSA Acceleration:</strong> Speeds up private key operations by computing exponentiations modulo prime factors <code>p</code> and <code>q</code> independently.</li><li><strong>Multi-Modular Arithmetic:</strong> Enables large integer computations without floating-point rounding or BigInt overhead.</li><li><strong>Number Theoretic Transforms (NTT):</strong> Combines results across composite modular fields.</li></ul>",
    },
    {
      heading: "Implementation & Complexity",
      body: "<p>Evaluating <code>k</code> congruences requires computing partial products <code>M<sub>i</sub></code> and modular inverses. The constructive approach runs in <code>O(k log M)</code> time and <code>O(k)</code> space.</p>",
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
        "A set of integers where every pair shares no common factor > 1 (gcd(m_i, m_j) = 1).",
    },
    {
      term: "CRT Basis Term",
      definition:
        "The value e_i = M_i * (M_i^-1 mod m_i), which evaluates to 1 mod m_i and 0 mod m_j for j ≠ i.",
    },
  ],
};

export const CHINESE_REMAINDER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines chinese_remainder function signature taking arrays num (m_i) and rem (r_i).",
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
    "<p>The <strong>Chinese Remainder Theorem (CRT)</strong> solves a system of simultaneous linear congruences <code>x &equiv; r<sub>i</sub> (mod m<sub>i</sub>)</code> for pairwise coprime moduli <code>m<sub>i</sub></code>.</p><p><code>x = &sum; (r<sub>i</sub> &times; M<sub>i</sub> &times; (M<sub>i</sub><sup>-1</sup> mod m<sub>i</sub>)) mod M</code></p><p>where <code>M = &prod; m<sub>i</sub></code> is the master product modulus and <code>M<sub>i</sub> = M / m<sub>i</sub></code>.</p><h3>State Matrix Representation</h3><p>The solution progress is recorded in a state matrix tracking <code>(m<sub>i</sub>, r<sub>i</sub>, M<sub>i</sub>, M<sub>i</sub><sup>-1</sup> mod m<sub>i</sub>, Term<sub>i</sub>)</code> for each congruence.</p><h3>Input Parameters</h3><ul><li><code>num</code>: Array of pairwise coprime moduli <code>[m<sub>1</sub>, m<sub>2</sub>, ..., m<sub>k</sub>]</code>.</li><li><code>rem</code>: Array of remainders <code>[r<sub>1</sub>, r<sub>2</sub>, ..., r<sub>k</sub>]</code>.</li></ul><h3>Output</h3><ul><li><code>int</code>: The minimal non-negative integer solution <code>x mod M</code>.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><strong>Zero Remainders:</strong> When all <code>r<sub>i</sub> = 0</code>, the solution is <code>0</code>.</li><li><strong>Single Congruence:</strong> Returns <code>r<sub>1</sub> mod m<sub>1</sub></code>.</li></ul>",
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
    time: "For K congruences, computing each modular inverse takes O(log m_i) time. Total runtime is O(K log M).",
    space: "Requires O(K) space to store intermediate matrix basis vectors.",
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
