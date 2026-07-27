import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface EulerTotientInput {
  n: number;
}

export const PYTHON_EULER_TOTIENT_CODE = `def phi(n: int) -> int:
    result = n
    p = 2
    temp = n
    while p * p <= temp:
        if temp % p == 0:
            while temp % p == 0:
                temp //= p
            result -= result // p
        p += 1
    if temp > 1:
        result -= result // temp
    return result`;

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
      { id: "result", value: rVal, state: activeSlot === "res" ? "active" : "sorted", pointers: ["phi(n)"] },
      { id: "temp", value: tVal, state: activeSlot === "temp" ? "active" : "compare", pointers: ["temp"] },
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
    "Euler's Totient function φ(n) counts the number of positive integers up to n that are relatively prime (coprime) to n. It plays a central role in number theory and RSA cryptography.",
  sections: [
    {
      heading: "Euler's Product Formula",
      body: "φ(n) = n * prod_{p | n} (1 - 1/p), where the product is over all distinct prime factors p dividing n.",
    },
    {
      heading: "Key Properties",
      body: "If p is prime, φ(p) = p - 1. If a and b are coprime, φ(a*b) = φ(a) * φ(b) (multiplicative function property).",
    },
  ],
  keyTerms: [
    {
      term: "Coprime Integers",
      definition: "Two integers a and b are coprime if gcd(a, b) = 1.",
    },
    {
      term: "Multiplicative Function",
      definition: "A number-theoretic function f(n) where f(a*b) = f(a)*f(b) for coprime a and b.",
    },
  ],
};

export const EULER_TOTIENT_TRIVIA: TriviaMeta = {
  skipLines: [1, 4, 10, 13],
  distractors: [
    "result -= p",
    "result = result // p",
    "p += 2",
    "if temp == 0:",
  ],
  hints: [
    { line: 9, hint: "Subtract result // p to apply the (1 - 1/p) term for prime factor p." },
    { line: 12, hint: "Check if remaining temp > 1 to handle prime factors greater than sqrt(n)." },
  ],
};

export const eulerTotientFunction: AlgorithmDefinition<EulerTotientInput> = {
  id: "euler-totient-function",
  title: "Euler's Totient Function",
  category: "math_and_number_theory",
  difficulty: "Medium",
  description:
    "Calculates φ(n), the count of positive integers up to n coprime to n, using Euler's product formula in O(sqrt(n)) time.",
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

export default eulerTotientFunction;
