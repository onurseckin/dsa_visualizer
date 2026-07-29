import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface EulerTotientInput {
  n: number;
}

export const PYTHON_EULER_TOTIENT_CODE = `
def euler_totient(n: int) -> int:
    result = n
    temp = n
    p = 2
    while p * p <= temp:
        if temp % p == 0:
            while temp % p == 0:
                temp //= p
            result -= result // p
        p += 1
    if temp > 1:
        result -= result // temp
    return result
`;

export const DEFAULT_EULER_TOTIENT_INPUT: EulerTotientInput = {
  n: 360,
};

export const generateEulerTotientSteps = (input?: EulerTotientInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = input ?? DEFAULT_EULER_TOTIENT_INPUT;
  const rawN =
    typeof safeInput?.n === "number" && !isNaN(safeInput.n)
      ? safeInput.n
      : DEFAULT_EULER_TOTIENT_INPUT.n;
  const nVal = Math.max(1, Math.floor(rawN));
  let result = nVal;
  let temp = nVal;
  let p = 2;

  const primeFactors: number[] = [];

  const createMatrixSnapshot = (
    rVal: number,
    tVal: number,
    pVal: number,
    activeSlot?: "p" | "res" | "temp" | "n",
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [
      {
        row: 0,
        col: 0,
        value: pVal,
        label: "p",
        state: activeSlot === "p" ? "active" : "default",
      },
      {
        row: 0,
        col: 1,
        value: nVal,
        label: "n",
        state: activeSlot === "n" ? "active" : "default",
      },
      {
        row: 0,
        col: 2,
        value: rVal,
        label: "φ(n)",
        state: activeSlot === "res" ? "active" : "sorted",
      },
      {
        row: 0,
        col: 3,
        value: tVal,
        label: "temp",
        state: activeSlot === "temp" ? "active" : "compare",
      },
    ];

    return {
      kind: "matrix",
      rows: 1,
      cols: 4,
      colHeaders: ["Candidate p", "Input n", "Totient φ(n)", "Quotient temp"],
      cells,
      title: `Euler Totient Factorization State (n = ${nVal})`,
    };
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initializing Euler's Totient function for n = ${nVal}. Initial φ(n) = ${nVal}.`,
      why: "Euler's totient function φ(n) calculates the count of positive integers up to n that share no common factors with n.",
    },
    primarySnapshot: createMatrixSnapshot(result, temp, p),
    auxiliaryState: {
      hashMap: {
        "Input n": `${nVal}`,
        "Initial phi(n)": `${nVal}`,
      },
      customState: {
        n: nVal,
        result,
        temp,
        p,
      },
    },
    variables: {
      n: nVal,
      result,
      temp,
      p,
    },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initializing running totient result φ(n) = ${nVal}.`,
      why: "According to Euler's product formula, we start with n and multiply by (1 - 1/p) for each distinct prime factor p.",
    },
    primarySnapshot: createMatrixSnapshot(result, temp, p, "res"),
    auxiliaryState: {
      hashMap: { result: `${result}` },
    },
    variables: { result, temp, p },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initializing unfactored quotient temp = ${nVal}.`,
      why: "temp tracks the remaining composite portion of n as prime factors are systematically identified and removed.",
    },
    primarySnapshot: createMatrixSnapshot(result, temp, p, "temp"),
    auxiliaryState: {
      hashMap: { temp: `${temp}` },
    },
    variables: { result, temp, p },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Initializing first candidate prime factor p = 2.`,
      why: "2 is the smallest prime candidate.",
    },
    primarySnapshot: createMatrixSnapshot(result, temp, p, "p"),
    auxiliaryState: {
      hashMap: { p: `${p}` },
    },
    variables: { result, temp, p },
  });

  // Loop prime factorization
  while (p * p <= temp) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Testing candidate factor p = ${p} against remaining quotient temp = ${temp} (p * p = ${p * p}).`,
        why: "Sweeping candidates up to sqrt(temp) guarantees finding all prime factors ≤ sqrt(n), leaving at most one prime factor > sqrt(n).",
      },
      primarySnapshot: createMatrixSnapshot(result, temp, p, "p"),
      auxiliaryState: {
        visited: [...primeFactors],
        customState: {
          p,
          temp,
          result,
        },
      },
      variables: {
        result,
        temp,
        p,
      },
    });

    if (temp % p === 0) {
      primeFactors.push(p);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 7,
        explanation: {
          what: `Discovered distinct prime factor p = ${p} dividing temp = ${temp}.`,
          why: "Since p divides temp, p is a prime factor of n and must contribute term (1 - 1/p) to Euler's product formula.",
        },
        primarySnapshot: createMatrixSnapshot(result, temp, p, "p"),
        auxiliaryState: {
          visited: [...primeFactors],
          customState: {
            foundFactor: p,
          },
        },
        variables: {
          result,
          temp,
          p,
        },
      });

      let divisions = 0;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Removing all powers of prime p = ${p} from quotient temp.`,
          why: "Dividing out all powers of p ensures each distinct prime factor is processed exactly once in the product formula.",
        },
        primarySnapshot: createMatrixSnapshot(result, temp, p, "temp"),
        auxiliaryState: {
          visited: [...primeFactors],
          customState: { temp, p, divisionsRemaining: "while temp % p == 0" },
        },
        variables: { result, temp, p },
      });

      while (temp % p === 0) {
        temp = Math.floor(temp / p);
        divisions++;
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 9,
          explanation: {
            what: `Divided out factor ${p} from temp (division #${divisions}). Remaining quotient temp = ${temp}.`,
            why: "Stripping duplicate prime factors simplifies temp without altering the distinct prime factor set.",
          },
          primarySnapshot: createMatrixSnapshot(result, temp, p, "temp"),
          auxiliaryState: {
            visited: [...primeFactors],
            customState: {
              temp,
              p,
            },
          },
          variables: {
            result,
            temp,
            p,
          },
        });
      }

      const prevRes = result;
      result -= Math.floor(result / p);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Updating totient result: φ(n) = ${prevRes} - (${prevRes} // ${p}) = ${result}.`,
          why: "Applying integer transformation result -= result // p evaluates term result * (1 - 1/p) exactly.",
        },
        primarySnapshot: createMatrixSnapshot(result, temp, p, "res"),
        auxiliaryState: {
          visited: [...primeFactors],
          hashMap: {
            "Prime Factor": `${p}`,
            "Formula Application": `${prevRes} * (1 - 1/${p}) = ${result}`,
          },
          customState: {
            result,
            temp,
            p,
          },
        },
        variables: {
          result,
          temp,
          p,
        },
      });
    }

    p += 1;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Advancing candidate factor to p = ${p}.`,
        why: "Checking the next candidate integer.",
      },
      primarySnapshot: createMatrixSnapshot(result, temp, p, "p"),
      auxiliaryState: {
        hashMap: { p: `${p}` },
      },
      variables: { result, temp, p },
    });
  }

  // Final check for remaining prime factor > 1
  if (temp > 1) {
    primeFactors.push(temp);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Finished sweep up to sqrt(n). Remaining quotient temp = ${temp} > 1 is a prime factor.`,
        why: "Any prime factor larger than sqrt(n) remains as the sole residual quotient in temp.",
      },
      primarySnapshot: createMatrixSnapshot(result, temp, p, "temp"),
      auxiliaryState: {
        visited: [...primeFactors],
        customState: { temp },
      },
      variables: { result, temp },
    });

    const prevRes = result;
    result -= Math.floor(result / temp);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Updating totient result for final prime factor ${temp}: φ(n) = ${prevRes} - (${prevRes} // ${temp}) = ${result}.`,
        why: "Applying (1 - 1/temp) for the final prime factor completes Euler's product formula.",
      },
      primarySnapshot: createMatrixSnapshot(result, temp, p, "res"),
      auxiliaryState: {
        visited: [...primeFactors],
        hashMap: {
          "Final Prime Factor": `${temp}`,
          Result: `${result}`,
        },
        customState: {
          result,
          temp,
        },
      },
      variables: {
        result,
        temp,
      },
    });
  }

  // Done step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: `Completed Euler's Totient function: φ(${nVal}) = ${result}.`,
      why: "There are exactly ${result} positive integers in [1, ${nVal}] coprime to ${nVal}.",
    },
    primarySnapshot: createMatrixSnapshot(result, 1, p, "res"),
    auxiliaryState: {
      visited: [...primeFactors],
      hashMap: {
        "Final Totient φ(n)": `${result}`,
        "Prime Factors": primeFactors.join(", "),
      },
      customState: {
        result,
        n: nVal,
      },
    },
    variables: {
      result,
    },
  });

  return steps;
};

export const EULER_TOTIENT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>Euler's Totient function</strong> <code>&phi;(n)</code> (also known as Euler's phi function) counts the number of positive integers <code>k &in; [1, n]</code> coprime to <code>n</code>. It is a fundamental multiplicative function in number theory, algebraic group theory, and public-key cryptography (RSA).</p>",
  sections: [
    {
      heading: "Euler's Product Formula",
      body: "<p>Euler's product formula states that for any integer <code>n &ge; 1</code>:</p><p><code>&phi;(n) = n &times; &prod;<sub>p | n</sub> (1 - 1/p)</code></p><p>Because the totient function is multiplicative (<code>&phi;(a &times; b) = &phi;(a) &times; &phi;(b)</code> for coprime <code>a, b</code>), prime powers evaluate to <code>&phi;(p<sup>k</sup>) = p<sup>k</sup> - p<sup>k-1</sup> = p<sup>k</sup> &times; (1 - 1/p)</code>.</p>",
    },
    {
      heading: "RSA Cryptography Connection",
      body: "<p>In RSA encryption, two large secret primes <code>p</code> and <code>q</code> form modulus <code>n = p &times; q</code>. The order of the multiplicative group modulo <code>n</code> is <code>&phi;(n) = (p-1)(q-1)</code>. Public and private exponents satisfy <code>e &times; d &equiv; 1 (mod &phi;(n))</code>.</p>",
    },
    {
      heading: "Trial Division Sweep",
      body: "<p>To compute <code>&phi;(n)</code>, trial division sweeps prime candidates up to <code>&radic;n</code>. When a prime <code>p</code> divides <code>temp</code>, all factors of <code>p</code> are eliminated, and <code>&phi;(n)</code> is updated via integer subtraction <code>&phi;(n) -= &phi;(n) // p</code>. Any leftover <code>temp > 1</code> after the loop represents the final prime factor.</p>",
    },
    {
      heading: "Key Identities",
      body: "<ul><li><strong>Euler's Theorem:</strong> <code>a<sup>&phi;(m)</sup> &equiv; 1 (mod m)</code> for <code>gcd(a, m) = 1</code>.</li><li><strong>Gauss's Identity:</strong> <code>&sum;<sub>d | n</sub> &phi;(d) = n</code>.</li><li><strong>Prime Numbers:</strong> <code>&phi;(p) = p - 1</code>.</li></ul>",
    },
  ],
  keyTerms: [
    {
      term: "Coprime Integers",
      definition:
        "Two integers a and b are coprime if their greatest common divisor gcd(a, b) = 1.",
    },
    {
      term: "Euler's Product Formula",
      definition:
        "The identity φ(n) = n * prod(1 - 1/p) computing totient values from prime factors.",
    },
    {
      term: "Multiplicative Function",
      definition:
        "A number-theoretic function f satisfying f(a*b) = f(a)*f(b) whenever gcd(a, b) = 1.",
    },
  ],
};

export const EULER_TOTIENT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines euler_totient function signature taking integer n and returning phi(n).",
    3: "Initializes result accumulator result = n.",
    4: "Sets temp = n to track remaining unfactored portion.",
    5: "Initializes prime candidate pointer p = 2.",
    6: "Loops while p^2 <= temp, scanning candidate prime factors up to sqrt(temp).",
    7: "Checks if candidate p divides temp (temp % p == 0).",
    8: "Inner loop while p divides temp.",
    9: "Divides out all factors of prime p from temp.",
    10: "Updates result by applying product term: result -= result // p.",
    11: "Increments candidate factor p by 1.",
    12: "Checks if remaining temp > 1 after loop (indicating a prime factor > sqrt(n)).",
    13: "Applies product term for final prime factor temp.",
    14: "Returns computed Euler totient count phi(n).",
    15: "Empty trailing line for code formatting.",
  },
};

export const eulerTotientFunction: AlgorithmDefinition<EulerTotientInput> = {
  id: "euler-totient-function",
  title: "Euler's Totient Function",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given a positive integer <code>n</code>, <strong>Euler's Totient Function</strong> <code>&phi;(n)</code> computes the count of integers <code>k &in; [1, n]</code> that are coprime to <code>n</code> (i.e. <code>gcd(k, n) = 1</code>).</p><p><code>&phi;(n) = n &times; &prod; (1 - 1/p)</code></p><p>where the product ranges over all distinct prime factors <code>p</code> dividing <code>n</code>.</p><h3>Factorization State Vector</h3><p>The state is tracked as a 4D state vector <code>(n, &phi;(n), temp, p)</code> updated dynamically as prime factors are discovered and divided out.</p><h3>Input Parameters</h3><ul><li><code>n</code>: Target positive integer.</li></ul><h3>Output</h3><ul><li><code>int</code>: Count of coprime integers <code>&phi;(n)</code>.</li></ul>",
  constraints: ["1 <= n <= 10^12"],
  examples: [
    {
      kind: "basic",
      title: "Composite Number (n = 36)",
      inputDisplay: "n = 36",
      outputDisplay: "φ(36) = 12",
      input: { n: 36 },
      output: "12",
      explanation: "36 has prime factors 2 and 3. φ(36) = 36 * (1 - 1/2) * (1 - 1/3) = 12.",
    },
    {
      kind: "complex",
      title: "Prime Number (n = 13)",
      inputDisplay: "n = 13",
      outputDisplay: "φ(13) = 12",
      input: { n: 13 },
      output: "12",
      explanation: "For any prime p, φ(p) = p - 1 = 12.",
    },
    {
      kind: "negative",
      title: "Smallest Integer Edge Case (n = 1)",
      inputDisplay: "n = 1",
      outputDisplay: "φ(1) = 1",
      input: { n: 1 },
      output: "1",
      explanation: "By definition, φ(1) = 1.",
    },
  ],
  code: PYTHON_EULER_TOTIENT_CODE,
  timeComplexity: {
    best: "O(sqrt(N))",
    average: "O(sqrt(N))",
    worst: "O(sqrt(N))",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Trial division scans prime candidates up to sqrt(n), resulting in O(sqrt(n)) execution time.",
    space: "Requires O(1) auxiliary space.",
  },
  topicGuide: EULER_TOTIENT_TOPIC_GUIDE,
  trivia: EULER_TOTIENT_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 21",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      section: "21.5 Euler's totient function",
    },
  ],
  defaultInput: DEFAULT_EULER_TOTIENT_INPUT,
  generateSteps: generateEulerTotientSteps,
};
