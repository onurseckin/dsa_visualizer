import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface EulerTotientInput {
  n: number;
}

export const PYTHON_EULER_TOTIENT_CODE = `
def euler_totient(n: int) -> int:
    """
    Computes Euler's Totient function phi(n) in O(sqrt(n)) time.
    """
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
  n: 36,
};

export const generateEulerTotientSteps = (input: EulerTotientInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nVal = Math.max(1, Math.floor(input.n));
  let result = nVal;
  let temp = nVal;
  let p = 2;

  const primeFactors: number[] = [];

  const createElements = (
    rVal: number,
    tVal: number,
    pVal: number,
    activeSlot?: "p" | "res" | "temp",
  ): ArrayElement[] => {
    return [
      { id: "n", value: nVal, state: "default", pointers: ["n"] },
      {
        id: "result",
        value: rVal,
        state: activeSlot === "res" ? "active" : "sorted",
        pointers: ["phi(n)"],
      },
      {
        id: "temp",
        value: tVal,
        state: activeSlot === "temp" ? "active" : "compare",
        pointers: ["temp"],
      },
      { id: "p", value: pVal, state: activeSlot === "p" ? "active" : "pivot", pointers: ["p"] },
    ];
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Starting Euler's Totient function for n = ${nVal}. Initial phi(n) = ${nVal}.`,
      why: "Euler's totient function φ(n) counts integers k in [1, n] such that gcd(k, n) = 1.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(result, temp, p),
    },
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

  // Loop prime factorization
  while (p * p <= temp) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Checking candidate prime factor p = ${p} (p*p = ${p * p} <= temp = ${temp}).`,
        why: "Scan prime candidates up to sqrt(temp).",
      },
      primarySnapshot: {
        kind: "array",
        elements: createElements(result, temp, p, "p"),
      },
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
        codeLine: 6,
        explanation: {
          what: `Found prime factor p = ${p}. Removing all factors of ${p} from temp = ${temp}.`,
          why: "According to Euler's product formula, each prime factor p reduces result by result // p.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createElements(result, temp, p, "temp"),
        },
        auxiliaryState: {
          visited: [...primeFactors],
          customState: {
            foundFactor: p,
            tempBefore: temp,
          },
        },
        variables: {
          result,
          temp,
          p,
        },
      });

      while (temp % p === 0) {
        temp = Math.floor(temp / p);
      }

      const prevRes = result;
      result -= Math.floor(result / p);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Update result: phi(n) = ${prevRes} - (${prevRes} // ${p}) = ${result}. Remaining temp = ${temp}.`,
          why: `Applied formula term (1 - 1/${p}) for prime factor ${p}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: createElements(result, temp, p, "res"),
        },
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
  }

  // Final check for remaining prime factor > 1
  if (temp > 1) {
    primeFactors.push(temp);
    const prevRes = result;
    result -= Math.floor(result / temp);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Remaining temp = ${temp} > 1 is a prime factor. Update result: ${prevRes} - (${prevRes} // ${temp}) = ${result}.`,
        why: "Any leftover temp after sqrt loop must be a prime factor.",
      },
      primarySnapshot: {
        kind: "array",
        elements: createElements(result, temp, p, "res"),
      },
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
    codeLine: 13,
    explanation: {
      what: `Finished! φ(${nVal}) = ${result}. There are ${result} numbers in [1, ${nVal}] coprime to ${nVal}.`,
      why: "Euler's product formula evaluation complete.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(result, 1, p, "res"),
    },
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
    "Euler's Totient function φ(n) (also known as Euler's phi function) counts the number of positive integers k in the range 1 <= k <= n that are coprime to n (i.e. gcd(k, n) = 1). It plays a fundamental role in modular arithmetic, Group Theory (order of multiplicative groups (Z/nZ)*), and asymmetric RSA cryptography.",
  sections: [
    {
      heading: "Euler's Product Formula & Derivation",
      body: "Euler's product formula states φ(n) = n * prod_{p | n} (1 - 1/p), where the product is taken over all distinct prime factors p of n. By prime factorization n = p1^k1 * p2^k2 * ... * pr^kr and using the multiplicative property of totient functions for coprime numbers, for any prime power φ(p^k) = p^k - p^(k-1) = p^k * (1 - 1/p). Multiplying across all prime factors yields the product formula.",
    },
    {
      heading: "Systems & Cryptographic Significance",
      body: "Euler's Totient function is the backbone of RSA public-key encryption. In RSA, one selects two large secret primes p and q and computes n = p*q. The totient φ(n) = (p-1)*(q-1) defines the secret order of the multiplicative group modulo n, allowing the public encryption exponent e and private decryption exponent d to satisfy e*d ≡ 1 (mod φ(n)). Knowing φ(n) is computationally equivalent to factoring n.",
    },
    {
      heading: "Implementation & Factorization Sweeps",
      body: "To compute φ(n) for a single value n, trial division sweeps prime candidates p up to sqrt(n). Whenever p divides temp, all occurrences of p are divided out and result is updated via integer subtraction: result -= result // p (equivalent to multiplying by 1 - 1/p). If temp > 1 after the loop, the remaining temp is itself a prime factor, requiring one final subtraction. To compute φ(n) for all numbers up to N, a modified Sieve of Eratosthenes computes the totient array in O(N log log N) time.",
    },
    {
      heading: "Key Identities & Edge Cases",
      body: "Important number-theoretic identities include: 1) Euler's Theorem: a^φ(m) ≡ 1 (mod m) for gcd(a, m) = 1, 2) Gauss's Identity: sum_{d | n} φ(d) = n, and 3) φ(p) = p - 1 for any prime p. Edge cases include n = 1 (φ(1) = 1 by definition) and prime inputs where trial division runs up to sqrt(n) without finding divisors until the final check.",
    },
  ],
  keyTerms: [
    {
      term: "Coprime Integers",
      definition:
        "Two integers a and b are coprime (or relatively prime) if their greatest common divisor gcd(a, b) = 1.",
    },
    {
      term: "Euler's Product Formula",
      definition:
        "The formula φ(n) = n * prod_{p | n} (1 - 1/p) computing totient values from distinct prime factors.",
    },
    {
      term: "Multiplicative Function",
      definition:
        "A number-theoretic function f where f(a * b) = f(a) * f(b) for all coprime integers a and b.",
    },
  ],
};

export const EULER_TOTIENT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines phi(n) -> int: computes Euler's totient function φ(n).",
    2: "Initialize result = n.",
    3: "Start checking candidate prime factor p = 2.",
    4: "Set temp = n to reduce as prime factors are found.",
    5: "Loop while p * p <= temp (factors up to sqrt(n)).",
    6: "Check if p divides temp.",
    8: "Divide out all occurrences of prime factor p from temp.",
    9: "Subtract result // p applying Euler product term (1 - 1/p).",
    10: "Increment candidate factor p.",
    11: "If leftover temp > 1, temp itself is a prime factor.",
    12: "Subtract result // temp for final prime factor.",
    13: "Return total count of coprime integers φ(n).",
  },
};

export const eulerTotientFunction: AlgorithmDefinition<EulerTotientInput> = {
  id: "euler-totient-function",
  title: "Euler's Totient Function",
  category: "math_and_number_theory",
  categories: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Given a positive integer n, calculate Euler's Totient function φ(n) representing the count of integers k in [1, n] coprime to n. The algorithm applies Euler's product formula φ(n) = n * prod(1 - 1/p) by finding prime factors up to sqrt(n) in O(sqrt(n)) time.",
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
    time: "The factorization loop checks prime candidates up to sqrt(n), giving O(sqrt(n)) execution time.",
    space: "O(1) auxiliary space.",
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
