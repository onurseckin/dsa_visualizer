import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type { AlgorithmDefinition, AlgorithmStep, ElementState, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MillerRabinPrimalityInput {
  n: number;
}

export const PYTHON_MILLER_RABIN_PRIMALITY_CODE = `class Solution:
    def __init__(self):
        pass

    def isProbablePrime(self, n: int) -> bool:
        if n < 2:
            return False
        if n in (2, 3):
            return True
        if n % 2 == 0:
            return False

        d, s = n - 1, 0
        while d % 2 == 0:
            d //= 2
            s += 1

        for witness in (2, 3, 5, 7, 11):
            if witness >= n:
                continue
            power = pow(witness, d, n)
            if power in (1, n - 1):
                continue
            for _ in range(s - 1):
                power = pow(power, 2, n)
                if power == n - 1:
                    break
            else:
                return False
        return True`;

export const DEFAULT_MILLER_RABIN_PRIMALITY_INPUT: MillerRabinPrimalityInput = {
  n: 17,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "The Miller-Rabin Primality Test is a probabilistic Monte Carlo algorithm that tests whether a large integer N is prime or composite using modular exponentiation and square roots of unity.",
      snapshot: {
        kind: "array" as const,
        name: "miller_rabin_overview",
        mode: "box" as const,
        elements: [
          { id: "n_val", value: "Candidate N", label: "Target Integer", state: "active" as const },
          { id: "base_a", value: "Base a", label: "Random/Fixed Witness", state: "pivot" as const },
          {
            id: "type",
            value: "Monte Carlo",
            label: "Probabilistic Test",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Fermat's Little Theorem states that if N is prime, then a^(N-1) = 1 (mod N) for any base a coprime to N. However, Carmichael numbers like 561 pass Fermat's test despite being composite.",
      snapshot: {
        kind: "array" as const,
        name: "fermat_limitation",
        mode: "box" as const,
        elements: [
          {
            id: "fermat",
            value: "a^(N-1) = 1 (mod N)",
            label: "Fermat Test",
            state: "compare" as const,
          },
          {
            id: "carmichael",
            value: "561 = 3 * 11 * 17",
            label: "Carmichael Fake Prime",
            state: "visited" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Miller-Rabin strengthens Fermat's test by utilizing the Square Root of Unity property: in a prime field Z_p, the only solutions to x^2 = 1 (mod p) are x = 1 and x = p - 1.",
      snapshot: {
        kind: "array" as const,
        name: "roots_of_unity",
        mode: "box" as const,
        elements: [
          { id: "eq", value: "x^2 = 1 (mod p)", label: "Unity Equation", state: "pivot" as const },
          {
            id: "roots",
            value: "x in {1, p - 1}",
            label: "Trivial Roots",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "We factor N - 1 into d * 2^s where d is odd. This expresses N - 1 as an odd integer d multiplied by a power of 2.",
      snapshot: {
        kind: "array" as const,
        name: "power_decomposition",
        mode: "box" as const,
        elements: [
          {
            id: "decomp",
            value: "N - 1 = d * 2^s",
            label: "Binary Factorization",
            state: "pivot" as const,
          },
          { id: "d_val", value: "d (odd)", label: "Base Power", state: "compare" as const },
          { id: "s_val", value: "s (count)", label: "Squaring Count", state: "active" as const },
        ],
      },
    },
    {
      narrative:
        "For a chosen base a, we compute the initial power x_0 = a^d (mod N). If x_0 = 1 or x_0 = N - 1, base a immediately passes as a strong witness for N.",
      snapshot: {
        kind: "array" as const,
        name: "initial_power",
        mode: "box" as const,
        elements: [
          {
            id: "pow0",
            value: "x_0 = a^d (mod N)",
            label: "Initial Mod Power",
            state: "compare" as const,
          },
          {
            id: "pass_cond",
            value: "x_0 == 1 or N - 1",
            label: "Witness Pass",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "If x_0 is neither 1 nor N - 1, we square x up to s - 1 times: x_{r+1} = x_r^2 (mod N). If x reaches N - 1 during squarings, base a passes.",
      snapshot: {
        kind: "array" as const,
        name: "squaring_loop",
        mode: "box" as const,
        elements: [
          {
            id: "sq",
            value: "x <- x^2 (mod N)",
            label: "Repeated Squaring",
            state: "active" as const,
          },
          { id: "hit", value: "x == N - 1", label: "Success Check", state: "sorted" as const },
        ],
      },
    },
    {
      narrative:
        "If x becomes 1 without having hit N - 1 in the previous step, we found a non-trivial square root of 1 modulo N, which proves N is definitely composite.",
      snapshot: {
        kind: "array" as const,
        name: "nontrivial_root",
        mode: "box" as const,
        elements: [
          {
            id: "nontrivial",
            value: "x^2 = 1 but x != -1",
            label: "Composite Proof",
            state: "visited" as const,
          },
          {
            id: "result",
            value: "Definitely Composite",
            label: "Guaranteed Failure",
            state: "visited" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Each independent base trial reduces false positive probability by at least 75%. Testing deterministic base sets (such as {2, 7, 61} for 32-bit integers) guarantees 100% mathematical certainty.",
      snapshot: {
        kind: "array" as const,
        name: "deterministic_bases",
        mode: "box" as const,
        elements: [
          {
            id: "bases",
            value: "[2, 7, 61]",
            label: "Deterministic Set",
            state: "sorted" as const,
          },
          { id: "error", value: "Error < (1/4)^k", label: "Error Bound", state: "sorted" as const },
        ],
      },
    },
    {
      narrative:
        "With modular exponentiation running in O(k log^3 N) bit operations, Miller-Rabin enables instant primality testing for massive cryptographic primes.",
      snapshot: {
        kind: "array" as const,
        name: "complexity_summary",
        mode: "box" as const,
        elements: [
          { id: "time", value: "O(k log^3 N)", label: "Time Complexity", state: "sorted" as const },
          { id: "crypto", value: "RSA Keys", label: "Application", state: "sorted" as const },
        ],
      },
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: data.snapshot,
    }),
  );
};

function modPow(base: number, exp: number, mod: number): number {
  let res = 1;
  base = base % mod;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) {
      res = (res * base) % mod;
    }
    e = Math.floor(e / 2);
    base = (base * base) % mod;
  }
  return res;
}

export const generateMillerRabinPrimalitySteps = (
  input: MillerRabinPrimalityInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const n = Math.max(1, Math.floor(input?.n ?? 17));

  const getSnapshot = (
    stage: string,
    dVal: number,
    sVal: number,
    currentBase: number,
    powersSequence: { step: string; value: number; state: ElementState }[],
    finalOutcome?: string,
  ) => {
    const sequenceElements =
      powersSequence.length > 0
        ? powersSequence.map((item, idx) => ({
            id: `pow-${idx}`,
            value: item.value,
            label: item.step,
            state: item.state,
          }))
        : [
            {
              id: "outcome",
              value: finalOutcome ?? "Pending",
              label: "Sequence",
              state: (finalOutcome === "PRIME" ? "sorted" : "visited") as ElementState,
            },
          ];

    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: `Miller-Rabin Primality Test for N = ${n}`,
      items: [
        {
          id: "params_panel",
          role: "primary" as const,
          snapshot: {
            kind: "array" as const,
            name: "test_parameters",
            mode: "box" as const,
            elements: [
              { id: "n_param", value: n, label: "Candidate N", state: "active" as const },
              {
                id: "decomp_param",
                value: `d=${dVal}, s=${sVal}`,
                label: "N - 1 = d * 2^s",
                state: "pivot" as const,
              },
              {
                id: "base_param",
                value: currentBase > 0 ? currentBase : "None",
                label: "Base a",
                state: "compare" as const,
              },
              { id: "stage_param", value: stage, label: "Current Stage", state: "sorted" as const },
            ],
          },
        },
        {
          id: "powers_panel",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "witness_powers_sequence",
            mode: "box" as const,
            elements: sequenceElements,
          },
        },
      ],
    };
  };

  if (n <= 1) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Candidate N = ${n} is less than or equal to 1, which is by definition non-prime. Test terminates immediately.`,
        primarySnapshot: getSnapshot("Small Number Check", 0, 0, 0, [], "COMPOSITE"),
      }),
    );
    return steps;
  }

  if (n === 2 || n === 3) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Candidate N = ${n} is one of the smallest prime numbers (2 or 3). Test completes with PRIME result.`,
        primarySnapshot: getSnapshot("Small Prime Check", 0, 0, 0, [], "PRIME"),
      }),
    );
    return steps;
  }

  if (n % 2 === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Candidate N = ${n} is an even integer greater than 2, so it is divisible by 2 and definitely COMPOSITE.`,
        primarySnapshot: getSnapshot("Even Number Check", 0, 0, 0, [], "COMPOSITE"),
      }),
    );
    return steps;
  }

  let d = n - 1;
  let s = 0;
  while (d % 2 === 0) {
    d = Math.floor(d / 2);
    s++;
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Factoring N - 1 = ${n - 1} into d * 2^s: odd component d = ${d}, power of two count s = ${s}.`,
      primarySnapshot: getSnapshot("Decomposition", d, s, 0, [
        { step: "N - 1", value: n - 1, state: "pivot" },
        { step: "Odd d", value: d, state: "active" },
        { step: "Power s", value: s, state: "sorted" },
      ]),
    }),
  );

  const bases = [2, 7, 61].filter((b) => b < n);
  let overallIsPrime = true;

  for (const a of bases) {
    const powers: { step: string; value: number; state: ElementState }[] = [];
    let x = modPow(a, d, n);
    powers.push({
      step: `a^d mod N (a=${a})`,
      value: x,
      state: x === 1 || x === n - 1 ? "sorted" : "pivot",
    });

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Testing base a = ${a}: computing initial modular power x_0 = ${a}^${d} mod ${n} = ${x}.`,
        primarySnapshot: getSnapshot(`Base a = ${a} Initial`, d, s, a, [...powers]),
      }),
    );

    if (x === 1 || x === n - 1) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Initial power x_0 = ${x} equals ${x === 1 ? "1" : "N - 1"}. Base a = ${a} passes as a strong witness for N.`,
          primarySnapshot: getSnapshot(`Base a = ${a} Passed`, d, s, a, [...powers]),
        }),
      );
      continue;
    }

    let hitMinusOne = false;
    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      powers.push({
        step: `x_${r} = x^2 mod N`,
        value: x,
        state: x === n - 1 ? "sorted" : x === 1 ? "visited" : "active",
      });

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Squaring step ${r} of ${s - 1} for base a = ${a}: computed x_${r} = x^2 mod ${n} = ${x}.`,
          primarySnapshot: getSnapshot(`Base a = ${a} Square ${r}`, d, s, a, [...powers]),
        }),
      );

      if (x === n - 1) {
        hitMinusOne = true;
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Squaring step reached x = N - 1 (${n - 1}). Base a = ${a} passes as a strong witness!`,
            primarySnapshot: getSnapshot(`Base a = ${a} Passed`, d, s, a, [...powers]),
          }),
        );
        break;
      }

      if (x === 1) {
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Squaring step produced x = 1 without having hit N - 1! Found a non-trivial square root of 1 modulo ${n}, proving N is COMPOSITE.`,
            primarySnapshot: getSnapshot(`Base a = ${a} Non-trivial Root`, d, s, a, [...powers]),
          }),
        );
        hitMinusOne = false;
        break;
      }
    }

    if (!hitMinusOne) {
      overallIsPrime = false;
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Base a = ${a} failed strong witness checks without reaching N - 1. Integer N = ${n} is confirmed COMPOSITE.`,
          primarySnapshot: getSnapshot("Base Failed", d, s, a, [...powers], "COMPOSITE"),
        }),
      );
      break;
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Miller-Rabin primality test completed for N = ${n}: confirmed ${overallIsPrime ? "PRIME" : "COMPOSITE"}.`,
      primarySnapshot: getSnapshot("Complete", d, s, 0, [], overallIsPrime ? "PRIME" : "COMPOSITE"),
    }),
  );

  return steps;
};

const MILLER_RABIN_PRIMALITY_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The Miller-Rabin Primality Test is a fast probabilistic algorithm that uses modular exponentiation and square roots of unity to test primality of massive integers.</p>",
  sections: [
    {
      heading: "Square Roots of Unity & Fermat Witness",
      body: "<p>In a prime modular field <code>Z_p</code>, the equation <code>x<sup>2</sup> &equiv; 1 (mod p)</code> has exactly two solutions: <code>x = 1</code> and <code>x = p - 1</code>. If repeated squarings modulo <code>N</code> yield 1 without having previously passed <code>N - 1</code>, <code>N</code> must be composite.</p>",
    },
    {
      heading: "Decomposition and Squaring Sequence",
      body: "<p>We write <code>N - 1 = d &times; 2<sup>s</sup></code> with <code>d</code> odd. For a base <code>a</code>, we compute <code>x<sub>0</sub> = a<sup>d</sup> mod N</code>. If <code>x<sub>0</sub> &ne; 1</code> and <code>x<sub>0</sub> &ne; N - 1</code>, we square <code>x</code> up to <code>s - 1</code> times, checking if <code>x</code> reaches <code>N - 1</code>.</p>",
    },
    {
      heading: "Deterministic Base Sets & Cryptographic Application",
      body: "<p>For 32-bit integers, testing bases <code>{2, 7, 61}</code> is 100% deterministic and eliminates false positives. Miller-Rabin runs in <strong>O(k log<sup>3</sup> N)</strong> time, making it essential for RSA key generation.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Strong Witness",
      definition:
        "A base 'a' that proves N is composite or passes strong probable prime conditions.",
    },
    {
      term: "Non-trivial Square Root of 1",
      definition:
        "A value x distinct from 1 and N-1 such that x^2 = 1 (mod N), proving N is composite.",
    },
    {
      term: "Carmichael Number",
      definition: "A composite integer that fools Fermat's primality test for all coprime bases.",
    },
  ],
};

const MILLER_RABIN_PRIMALITY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    14: "Decompose n - 1 into d * 2^s where d is odd.",
    21: "Select deterministic base set for candidate verification.",
    25: "Compute initial modular power x = a^d mod n.",
    29: "Repeatedly square x up to s - 1 times looking for n - 1.",
  },
};

export const millerRabinPrimality: AlgorithmDefinition<MillerRabinPrimalityInput> = {
  id: "miller-rabin-primality",
  title: "Miller-Rabin Probabilistic Primality Test",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Determines whether a large integer candidate is prime or composite using modular exponentiation and square roots of unity.</p><h3>Input Parameters</h3><ul><li><code>n</code> (&ge; 2): Integer candidate to test for primality.</li></ul><h3>Output Format</h3><ul><li><code>boolean</code>: True if n is prime, False if n is composite.</li></ul>",
  constraints: ["2 <= n <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 17 },
      output: "true",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { n: 2 },
      output: "true",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { n: 561 },
      output: "false",
    },
  ],
  code: PYTHON_MILLER_RABIN_PRIMALITY_CODE,
  timeComplexity: {
    best: "O(k log^3 N)",
    average: "O(k log^3 N)",
    worst: "O(k log^3 N)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Each base test requires modular exponentiation taking O(log^3 N) bit operations. Testing k bases takes O(k log^3 N) total time.",
    space: "Requires O(1) auxiliary space as only scalar modular power variables are maintained.",
  },
  topicGuide: MILLER_RABIN_PRIMALITY_TOPIC_GUIDE,
  trivia: MILLER_RABIN_PRIMALITY_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 24,
      chapterTitle: "Probability",
      section: "24.5 Randomized algorithms",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_MILLER_RABIN_PRIMALITY_INPUT,
  generateSteps: generateMillerRabinPrimalitySteps,
};
