import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface TrialDivisionPrimalityInput {
  nums: number[];
}

export const PYTHON_TRIALDIVISIONPRIMALITY_CODE = `class Solution:
    def __init__(self):
        pass

    def distinctPrimeFactors(self, nums: list[int]) -> int:
        primes = set()
        for val in nums:
            d = 2
            while d * d <= val:
                if val % d == 0:
                    primes.add(d)
                    while val % d == 0:
                        val //= d
                d += 1
            if val > 1:
                primes.add(val)
        return len(primes)`;

export const DEFAULT_TRIALDIVISIONPRIMALITY_INPUT: TrialDivisionPrimalityInput = {
  nums: [2, 4, 3, 7, 10],
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "Trial Division factorizes an integer n by systematically testing candidate divisor d starting from 2 up to the square root bound sqrt(n).",
      snapshot: {
        kind: "array" as const,
        name: "trial_candidates",
        mode: "box" as const,
        elements: [
          { id: "n_val", value: "n = 12", label: "Target Integer", state: "active" as const },
          { id: "d_bound", value: "d <= sqrt(12)", label: "Upper Bound", state: "pivot" as const },
          { id: "factors", value: "[]", label: "Prime Factors", state: "default" as const },
        ],
      },
    },
    {
      narrative:
        "By the Fundamental Theorem of Arithmetic, every integer n greater than 1 can be uniquely expressed as a product of prime powers.",
      snapshot: {
        kind: "array" as const,
        name: "fundamental_theorem",
        mode: "box" as const,
        elements: [
          { id: "e1", value: "12 = 2^2 * 3^1", label: "Prime Product", state: "sorted" as const },
          { id: "e2", value: "Unique", label: "Decomposition", state: "pivot" as const },
        ],
      },
    },
    {
      narrative:
        "If n has a non-trivial factor, its smallest prime factor cannot exceed sqrt(n), because two factors greater than sqrt(n) would multiply to a product strictly greater than n.",
      snapshot: {
        kind: "array" as const,
        name: "sqrt_bound_proof",
        mode: "box" as const,
        elements: [
          { id: "e1", value: "p1 * p2 = n", label: "Factor Pair", state: "compare" as const },
          {
            id: "e2",
            value: "min(p1, p2) <= sqrt(n)",
            label: "Bound Rule",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Testing candidate divisors in ascending order from d = 2 ensures that any candidate dividing n cleanly is guaranteed to be prime, because all smaller prime factors have already been completely divided out.",
      snapshot: {
        kind: "array" as const,
        name: "prime_guarantee",
        mode: "box" as const,
        elements: [
          { id: "c2", value: 2, label: "Test 2", state: "active" as const },
          { id: "c3", value: 3, label: "Test 3", state: "default" as const },
          { id: "c4", value: 4, label: "Never Reached Composite", state: "visited" as const },
        ],
      },
    },
    {
      narrative:
        "When candidate d divides n with remainder zero, d is appended to the prime factors list and n is reduced to n divided by d.",
      snapshot: {
        kind: "array" as const,
        name: "division_step",
        mode: "box" as const,
        elements: [
          { id: "mod", value: "12 % 2 == 0", label: "Match Found", state: "compare" as const },
          { id: "append", value: "Append 2", label: "New Factor", state: "sorted" as const },
          { id: "reduce", value: "n = 12 / 2 = 6", label: "Reduced n", state: "pivot" as const },
        ],
      },
    },
    {
      narrative:
        "We repeatedly divide out factor d while n remains divisible by d, extracting all multiple occurrences of that prime factor before advancing d.",
      snapshot: {
        kind: "array" as const,
        name: "repeated_division",
        mode: "box" as const,
        elements: [
          { id: "mod2", value: "6 % 2 == 0", label: "Repeat 2", state: "compare" as const },
          {
            id: "append2",
            value: "Append 2",
            label: "Factor List: [2, 2]",
            state: "sorted" as const,
          },
          { id: "reduce2", value: "n = 6 / 2 = 3", label: "Reduced n", state: "pivot" as const },
        ],
      },
    },
    {
      narrative:
        "When candidate d no longer divides n cleanly, d is incremented by 1 to test the next candidate integer.",
      snapshot: {
        kind: "array" as const,
        name: "increment_candidate",
        mode: "box" as const,
        elements: [
          { id: "mod_fail", value: "3 % 2 != 0", label: "No Match", state: "visited" as const },
          { id: "inc", value: "d: 2 -> 3", label: "Advance Candidate", state: "active" as const },
        ],
      },
    },
    {
      narrative:
        "When d * d exceeds the remaining n, the loop terminates. If the remaining n is greater than 1, that value is itself a prime number and forms the final factor.",
      snapshot: {
        kind: "array" as const,
        name: "loop_exit",
        mode: "box" as const,
        elements: [
          { id: "exit_cond", value: "d*d > n", label: "Termination", state: "visited" as const },
          {
            id: "leftover",
            value: "n = 3 (> 1)",
            label: "Final Prime Factor",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "The time complexity is O(sqrt(n)) in the worst case when n is prime, and space complexity is O(1) auxiliary space beyond storing the factors.",
      snapshot: {
        kind: "array" as const,
        name: "complexity_summary",
        mode: "box" as const,
        elements: [
          { id: "time", value: "O(sqrt(n))", label: "Worst-Case Time", state: "sorted" as const },
          { id: "space", value: "O(1)", label: "Auxiliary Space", state: "sorted" as const },
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

export const generateTrialDivisionPrimalitySteps = (
  input: TrialDivisionPrimalityInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawInput = input as unknown;
  const sourceNums = Array.isArray(rawInput) ? rawInput : input?.nums;
  const nums =
    Array.isArray(sourceNums) && sourceNums.length > 0
      ? sourceNums
      : DEFAULT_TRIALDIVISIONPRIMALITY_INPUT.nums;
  let nVal = Math.max(
    1,
    nums.reduce((product, value) => product * Math.floor(value), 1),
  );
  const origN = nVal;
  const factors: number[] = [];

  const maxCandidate = Math.floor(Math.sqrt(origN));
  const candidatesList: number[] = [];
  for (let c = 2; c <= maxCandidate; c++) {
    candidatesList.push(c);
  }

  const getCompositeSnapshot = (
    currentN: number,
    currentD: number,
    currentFactors: number[],
    _candidateStates: Record<number, "active" | "sorted" | "visited" | "default">,
    actionLabel: string,
  ) => {
    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: `Trial Division Factorization for n = ${origN}`,
      items: [
        {
          id: "state_panel",
          role: "primary" as const,
          snapshot: {
            kind: "array" as const,
            name: "execution_state",
            mode: "box" as const,
            elements: [
              { id: "curr_n", value: currentN, label: "Current n", state: "active" as const },
              { id: "curr_d", value: currentD, label: "Divisor d", state: "pivot" as const },
              { id: "action", value: actionLabel, label: "Status", state: "compare" as const },
            ],
          },
        },
        {
          id: "factors_panel",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "prime_factors",
            mode: "box" as const,
            elements:
              currentFactors.length > 0
                ? currentFactors.map((f, idx) => ({
                    id: `f-${idx}`,
                    value: f,
                    label: `Factor ${idx + 1}`,
                    state: "sorted" as const,
                  }))
                : [
                    {
                      id: "empty",
                      value: "None",
                      label: "Factors List",
                      state: "default" as const,
                    },
                  ],
          },
        },
      ],
    };
  };

  const initialStates: Record<number, "active" | "sorted" | "visited" | "default"> = {};
  candidatesList.forEach((c) => {
    initialStates[c] = "default";
  });

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing trial division for n = ${origN}. Candidate divisor loop starts at d = 2 with square root bound sqrt(n) = ${Math.floor(Math.sqrt(origN))}.`,
      primarySnapshot: getCompositeSnapshot(nVal, 2, factors, initialStates, "Initializing"),
    }),
  );

  if (origN <= 1) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Input n = ${origN} is less than or equal to 1, which has no prime factor decomposition. Execution terminates with empty factors list.`,
        primarySnapshot: getCompositeSnapshot(nVal, 1, [], initialStates, "N <= 1 No Factors"),
      }),
    );
    return steps;
  }

  let d = 2;
  const candidateStates = { ...initialStates };

  while (d * d <= nVal) {
    candidateStates[d] = "active";
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Testing candidate divisor d = ${d}. Checking whether current n = ${nVal} is divisible by ${d} (n % d == ${nVal % d}).`,
        primarySnapshot: getCompositeSnapshot(nVal, d, factors, candidateStates, `Check d = ${d}`),
      }),
    );

    if (nVal % d !== 0) {
      candidateStates[d] = "visited";
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Divisor candidate d = ${d} does not divide n = ${nVal} (remainder ${nVal % d}). Rejecting candidate d = ${d} and incrementing d.`,
          primarySnapshot: getCompositeSnapshot(
            nVal,
            d,
            factors,
            candidateStates,
            `d = ${d} Rejected`,
          ),
        }),
      );
    } else {
      while (nVal % d === 0) {
        factors.push(d);
        nVal = Math.floor(nVal / d);
        candidateStates[d] = "sorted";
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Candidate d = ${d} divides n cleanly! Appending prime factor ${d} to the factors list. Reduced n is now ${nVal}.`,
            primarySnapshot: getCompositeSnapshot(
              nVal,
              d,
              factors,
              candidateStates,
              `Factor ${d} Extracted`,
            ),
          }),
        );
      }
    }
    d++;
  }

  if (nVal > 1) {
    factors.push(nVal);
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Loop condition d*d <= n exited at d = ${d}. Remaining value n = ${nVal} is greater than 1, so it is prime and added as the final factor.`,
        primarySnapshot: getCompositeSnapshot(
          nVal,
          d,
          factors,
          candidateStates,
          `Final Factor ${nVal}`,
        ),
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Trial division completed for n = ${origN}. Found prime factors: [${factors.join(", ")}].`,
      primarySnapshot: getCompositeSnapshot(nVal, d, factors, candidateStates, "Completed"),
    }),
  );

  return steps;
};

const TRIALDIVISIONPRIMALITY_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Trial Division is the foundational algorithm for integer factorization and primality testing. It systematically tests candidate prime divisors up to the square root of the target integer.</p>",
  sections: [
    {
      heading: "Intuition & Square Root Bound",
      body: "<p>If a composite integer <code>n</code> has two factors <code>a</code> and <code>b</code> such that <code>a &times; b = n</code>, it is impossible for both <code>a</code> and <code>b</code> to exceed <code>&radic;n</code>. Therefore, scanning candidate divisors up to <code>&radic;n</code> guarantees finding at least one factor if <code>n</code> is composite.</p>",
    },
    {
      heading: "Prime Factor Extraction Mechanism",
      body: "<p>By testing candidate divisors in strictly increasing order (starting from 2), any divisor <code>d</code> that divides <code>n</code> is guaranteed to be prime. All smaller prime factors have already been completely divided out. When a factor is found, <code>n</code> is repeatedly divided by <code>d</code> until it is no longer divisible, handling prime powers cleanly.</p>",
    },
    {
      heading: "Complexity & Trade-offs",
      body: "<p>Trial division runs in <strong>O(&radic;n)</strong> time in the worst case (when <code>n</code> is prime) and uses <strong>O(1)</strong> auxiliary space. While optimal for small numbers up to 10<sup>12</sup>, larger numbers require Pollard's rho or elliptic curve factorization.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Trial Division",
      definition: "Testing candidate integers sequentially to check for exact division.",
    },
    {
      term: "Fundamental Theorem of Arithmetic",
      definition: "Every integer greater than 1 has a unique prime factor decomposition.",
    },
    {
      term: "Square Root Bound",
      definition:
        "The mathematical threshold sqrt(n) beyond which no new smallest factor can exist.",
    },
  ],
};

const TRIALDIVISIONPRIMALITY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    11: "Initialize divisor candidate d to the smallest prime, 2.",
    12: "Loop while d squared is less than or equal to remaining n.",
    13: "Repeatedly divide out candidate d while it divides n cleanly.",
    17: "If leftover n is greater than 1, it is the remaining prime factor.",
  },
};

export const trialDivisionPrimality: AlgorithmDefinition<TrialDivisionPrimalityInput> = {
  id: "trial-division-primality",
  title: "Trial Division Primality & Factorization",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an array <code>nums</code>, return the number of distinct prime factors in the product of all its values. Trial division finds the factors without constructing that product explicitly.</p><h3>Input Parameters</h3><ul><li><code>nums</code>: Array of positive integers.</li></ul><h3>Output Format</h3><ul><li><code>int</code>: Number of distinct prime factors in the product of <code>nums</code>.</li></ul>",
  constraints: ["1 <= nums.length <= 10^4", "2 <= nums[i] <= 1000"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Several Distinct Factors",
      inputDisplay: "nums = [2, 4, 3, 7, 10]",
      outputDisplay: "4",
      input: { nums: [2, 4, 3, 7, 10] },
      output: "4",
      explanation: "The product has distinct prime factors 2, 3, 5, and 7.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Repeated Prime Factor",
      inputDisplay: "nums = [2, 4, 8, 16]",
      outputDisplay: "1",
      input: { nums: [2, 4, 8, 16] },
      output: "1",
      explanation: "Every value contributes only the prime factor 2.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Single Array Value",
      inputDisplay: "nums = [12]",
      outputDisplay: "2",
      input: { nums: [12] },
      output: "2",
      explanation: "12 has the two distinct prime factors 2 and 3.",
    },
  ],
  code: PYTHON_TRIALDIVISIONPRIMALITY_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(sqrt(n))",
    worst: "O(sqrt(n))",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "In the worst case where n is prime, the loop checks all candidates up to sqrt(n), requiring O(sqrt(n)) operations.",
    space: "Requires O(1) auxiliary space beyond the output array of prime factors.",
  },
  topicGuide: TRIALDIVISIONPRIMALITY_TOPIC_GUIDE,
  trivia: TRIALDIVISIONPRIMALITY_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 2521,
      leetcodeId: 2521,
      url: "https://leetcode.com/problems/distinct-prime-factors-of-product-of-array/",
      label: "LeetCode #2521",
      title: "Distinct Prime Factors of Product of Array",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      chapterTitle: "Number Theory",
      section: "21.1 Primes and factors",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 2521,
    url: "https://leetcode.com/problems/distinct-prime-factors-of-product-of-array/",
  },
  defaultInput: DEFAULT_TRIALDIVISIONPRIMALITY_INPUT,
  generateSteps: generateTrialDivisionPrimalitySteps,
};
