import type { AlgorithmDefinition, AlgorithmStep, VectorItem, TopicGuide } from "../../types/dsa";
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

export const generateEulerTotientSteps = (input: EulerTotientInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nVal = Math.max(1, Math.floor(input.n));
  let result = nVal;
  let temp = nVal;
  let p = 2;

  const primeFactors: number[] = [];

  const createVectorSnapshot = (
    rVal: number,
    tVal: number,
    pVal: number,
    activeSlot?: "p" | "res" | "temp",
  ) => {
    const vectors: VectorItem[] = [
      { id: "n", label: `n = ${nVal}`, x: nVal, y: 0, state: "default" },
      {
        id: "result",
        label: `phi(n) = ${rVal}`,
        x: rVal,
        y: 1,
        state: activeSlot === "res" ? "active" : "result",
      },
      {
        id: "temp",
        label: `temp = ${tVal}`,
        x: tVal,
        y: 2,
        state: activeSlot === "temp" ? "active" : "compared",
      },
      {
        id: "p",
        label: `p = ${pVal}`,
        x: pVal,
        y: 3,
        state: activeSlot === "p" ? "active" : "default",
      },
    ];

    return {
      kind: "vector" as const,
      vectors,
      planeTitle: `Euler Totient Factorization State Vector (n = ${nVal})`,
      dimensions: "2d" as const,
    };
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Starting Euler's Totient function for n = ${nVal}. Initial phi(n) = ${nVal}.`,
      why: "Euler's totient function φ(n) counts positive integers k in [1, n] such that gcd(k, n) = 1.",
    },
    primarySnapshot: createVectorSnapshot(result, temp, p),
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
      what: `Set initial result = ${nVal}.`,
      why: "According to Euler's product formula φ(n) = n * prod(1 - 1/p), we start with n and multiply by (1 - 1/p) for each distinct prime factor p.",
    },
    primarySnapshot: createVectorSnapshot(result, temp, p, "res"),
    auxiliaryState: {
      hashMap: { result: `${result}` },
    },
    variables: { result, temp, p },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Set initial temp = ${nVal}.`,
      why: "temp tracks the remaining unfactored part of n as prime factors are divided out.",
    },
    primarySnapshot: createVectorSnapshot(result, temp, p, "temp"),
    auxiliaryState: {
      hashMap: { temp: `${temp}` },
    },
    variables: { result, temp, p },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Set initial prime candidate p = 2.`,
      why: "2 is the smallest prime number.",
    },
    primarySnapshot: createVectorSnapshot(result, temp, p, "p"),
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
        what: `Checking candidate prime factor p = ${p} (p*p = ${p * p} <= temp = ${temp}).`,
        why: "Scan prime candidates up to sqrt(temp). Any composite temp has at least one prime factor <= sqrt(temp).",
      },
      primarySnapshot: createVectorSnapshot(result, temp, p, "p"),
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
          what: `Found prime factor p = ${p} (temp % ${p} == 0).`,
          why: "Since p divides temp, p is a distinct prime factor of n.",
        },
        primarySnapshot: createVectorSnapshot(result, temp, p, "p"),
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
          what: `Inner while: eliminate all factors of ${p} from temp (temp = ${temp})`,
          why: `We divide out every copy of prime ${p} from temp so that each prime factor is counted only once in the product formula.`,
        },
        primarySnapshot: createVectorSnapshot(result, temp, p, "temp"),
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
            what: `Divided out factor ${p} from temp (division #${divisions}). Remaining temp = ${temp}.`,
            why: "Remove all powers of prime factor p so future multiples of p are not counted as distinct prime factors.",
          },
          primarySnapshot: createVectorSnapshot(result, temp, p, "temp"),
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
          what: `Update result: phi(n) = ${prevRes} - (${prevRes} // ${p}) = ${result}.`,
          why: `Applied Euler product formula term (1 - 1/${p}) for prime factor ${p}.`,
        },
        primarySnapshot: createVectorSnapshot(result, temp, p, "res"),
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
        what: `Incremented candidate p to ${p}.`,
        why: "Advance to the next candidate integer factor.",
      },
      primarySnapshot: createVectorSnapshot(result, temp, p, "p"),
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
        what: `Loop finished. Remaining temp = ${temp} > 1 is a prime factor.`,
        why: "Any leftover temp after sqrt loop must be a prime factor.",
      },
      primarySnapshot: createVectorSnapshot(result, temp, p, "temp"),
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
        what: `Update result for final prime factor ${temp}: ${prevRes} - (${prevRes} // ${temp}) = ${result}.`,
        why: `Applied Euler product formula term (1 - 1/${temp}) for final prime factor ${temp}.`,
      },
      primarySnapshot: createVectorSnapshot(result, temp, p, "res"),
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
      what: `Finished! φ(${nVal}) = ${result}. There are ${result} numbers in [1, ${nVal}] coprime to ${nVal}.`,
      why: "Euler's product formula evaluation complete.",
    },
    primarySnapshot: createVectorSnapshot(result, 1, p, "res"),
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
    "Euler's Totient function $\\phi(n)$ (also known as Euler's phi function) counts the number of positive integers $k \\in [1, n]$ coprime to $n$ (i.e. $\\gcd(k, n) = 1$). It is a foundational multiplicative function in Number Theory, Group Theory (order of multiplicative groups $(\\mathbb{Z}/n\\mathbb{Z})^*$), and RSA public-key cryptography.",
  sections: [
    {
      heading: "Euler's Product Formula & Mathematical Derivation",
      body: "Euler's product formula states that for any integer $n \\ge 1$:\n$$\\phi(n) = n \\prod_{p \\mid n} \\left(1 - \\frac{1}{p}\\right)$$\nwhere the product ranges over all distinct prime factors $p$ dividing $n$. By the prime factorization $n = \\prod p_i^{k_i}$ and the multiplicative property $\\phi(a b) = \\phi(a) \\phi(b)$ for $\\gcd(a, b) = 1$, the totient of a prime power is $\\phi(p^k) = p^k - p^{k-1} = p^k (1 - 1/p)$. Multiplying across all prime power factors yields the product formula.",
    },
    {
      heading: "Systems & RSA Cryptographic Significance",
      body: "Euler's Totient function is the backbone of RSA public-key encryption. In RSA, two large secret primes $p, q$ yield modulus $n = p q$. The secret order of the multiplicative group modulo $n$ is $\\phi(n) = (p-1)(q-1)$. Public exponent $e$ and private exponent $d$ satisfy:\n$$e \\cdot d \\equiv 1 \\pmod{\\phi(n)}$$\nComputing $\\phi(n)$ without knowing the prime factors $(p, q)$ is computationally equivalent to integer factorization.",
    },
    {
      heading: "Trial Division & Factorization Sweeps",
      body: "To compute $\\phi(n)$ for a single number $n$, trial division sweeps prime candidates $p \\le \\sqrt{n}$. Whenever $p \\mid temp$, all occurrences of $p$ are divided out, and $\\phi$ is updated in integer arithmetic:\n$$\\text{result} \\leftarrow \\text{result} - \\lfloor \\text{result} / p \\rfloor$$\nequivalent to multiplying by $\\left(1 - \\frac{1}{p}\\right)$. If $temp > 1$ after the loop, the remaining $temp$ is a final prime factor.",
    },
    {
      heading: "Key Number-Theoretic Identities",
      body: "1. Euler's Theorem: $a^{\\phi(m)} \\equiv 1 \\pmod m$ for $\\gcd(a, m) = 1$.\n2. Gauss's Identity: $\\sum_{d \\mid n} \\phi(d) = n$.\n3. Prime Property: $\\phi(p) = p - 1$ for any prime $p$.\n4. Boundary Case: $\\phi(1) = 1$ by definition.",
    },
  ],
  keyTerms: [
    {
      term: "Coprime Integers",
      definition:
        "Two integers $a, b$ are coprime if their greatest common divisor $\\gcd(a, b) = 1$.",
    },
    {
      term: "Euler's Product Formula",
      definition:
        "The identity $\\phi(n) = n \\prod_{p \\mid n} \\left(1 - \\frac{1}{p}\\right)$ computing totient values from prime factors.",
    },
    {
      term: "Multiplicative Function",
      definition:
        "A number-theoretic function $f$ satisfying $f(a b) = f(a) f(b)$ whenever $\\gcd(a, b) = 1$.",
    },
  ],
};

export const EULER_TOTIENT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines euler_totient function signature taking integer $n$ and returning $\\phi(n)$.",
    3: "Initializes result accumulator result = n.",
    4: "Sets temp = n to track remaining unfactored portion.",
    5: "Initializes prime candidate pointer p = 2.",
    6: "Loops while $p^2 \\le temp$, scanning candidate prime factors up to $\\sqrt{temp}$.",
    7: "Checks if candidate $p$ divides temp ($temp \\bmod p == 0$).",
    8: "Inner loop while $p$ divides temp.",
    9: "Divides out all factors of prime $p$ from temp ($temp \\leftarrow \\lfloor temp / p \\rfloor$).",
    10: "Updates result by applying product term: $result \\leftarrow result - \\lfloor result / p \\rfloor$.",
    11: "Increments candidate factor $p$ by 1.",
    12: "Checks if remaining $temp > 1$ after loop (indicating a prime factor $> \\sqrt{n}$).",
    13: "Applies product term for final prime factor $temp$.",
    14: "Returns computed Euler totient count $\\phi(n)$.",
    15: "Empty trailing line for code formatting.",
  },
};

export const eulerTotientFunction: AlgorithmDefinition<EulerTotientInput> = {
  id: "euler-totient-function",
  title: "Euler's Totient Function",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Given a positive integer $n$, calculate Euler's Totient function $\\phi(n)$ representing the count of integers $k \\in [1, n]$ coprime to $n$ ($\\gcd(k, n) = 1$):\n\n$$\\phi(n) = n \\prod_{p \\mid n} \\left(1 - \\frac{1}{p}\\right)$$\n\n### Factorization State Vector\nThe state is tracked as a 4D state vector $\\mathbf{v} = (n, \\phi(n), temp, p)^T \\in \\mathbb{Z}^4$ updated dynamically as prime factors are discovered and divided out.\n\n### Input Parameters\n- `n` ($n \\in \\mathbb{Z}_{> 0}$): Positive target integer.\n\n### Output\n- `int`: Count of coprime integers $\\phi(n)$.\n\n### Edge Cases & Constraints\n- Base Case: $\\phi(1) = 1$.\n- Prime Input: $\\phi(p) = p - 1$.",
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
    time: "Trial division scans prime candidates up to $\\sqrt{n}$, resulting in $\\mathcal{O}(\\sqrt{n})$ execution time.",
    space: "Requires $\\mathcal{O}(1)$ auxiliary space.",
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
