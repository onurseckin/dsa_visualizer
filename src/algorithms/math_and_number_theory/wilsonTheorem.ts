import type { AlgorithmDefinition, AlgorithmStep, ElementState, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface WilsonTheoremInput {
  p: number;
}

export const PYTHON_WILSON_THEOREM_CODE = `def wilson_prime(n: int) -> bool:
    if n <= 1:
        return False
    fact = 1
    for i in range(1, n):
        fact = (fact * i) % n
    return fact == n - 1`;

export const DEFAULT_WILSON_THEOREM_INPUT: WilsonTheoremInput = { p: 5 };

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "Wilson's Theorem states that a natural number p > 1 is prime if and only if (p - 1)! is congruent to -1 modulo p, or equivalently (p - 1)! % p == p - 1.",
      snapshot: {
        kind: "array" as const,
        name: "wilson_theorem_statement",
        mode: "box" as const,
        elements: [
          {
            id: "cand",
            value: "Candidate p > 1",
            label: "Target Integer",
            state: "active" as const,
          },
          {
            id: "eq",
            value: "(p - 1)! = -1 (mod p)",
            label: "Wilson Criterion",
            state: "pivot" as const,
          },
          { id: "iff", value: "If and Only If", label: "Exact Identity", state: "sorted" as const },
        ],
      },
    },
    {
      narrative:
        "Evaluating for p = 5: we compute (5 - 1)! = 4! = 24. Modulo 5, 24 % 5 = 4 = 5 - 1, which confirms 5 is prime.",
      snapshot: {
        kind: "array" as const,
        name: "prime_example",
        mode: "box" as const,
        elements: [
          { id: "fact4", value: "4! = 24", label: "Factorial Product", state: "compare" as const },
          { id: "mod5", value: "24 % 5 = 4", label: "Remainder Mod 5", state: "pivot" as const },
          { id: "res5", value: "5 is Prime", label: "Confirmed", state: "sorted" as const },
        ],
      },
    },
    {
      narrative:
        "Evaluating for composite p = 6: we compute (6 - 1)! = 5! = 120. Modulo 6, 120 % 6 = 0 (not 5), which proves 6 is composite.",
      snapshot: {
        kind: "array" as const,
        name: "composite_example",
        mode: "box" as const,
        elements: [
          { id: "fact5", value: "5! = 120", label: "Factorial Product", state: "compare" as const },
          { id: "mod6", value: "120 % 6 = 0", label: "Remainder Mod 6", state: "visited" as const },
          { id: "res6", value: "6 is Composite", label: "Confirmed", state: "visited" as const },
        ],
      },
    },
    {
      narrative:
        "In a finite prime field Z_p, every element a in {2, 3, ..., p - 2} has a unique distinct modular inverse, causing all interior terms in the factorial product to pair up and cancel to 1.",
      snapshot: {
        kind: "array" as const,
        name: "inverse_pairing",
        mode: "box" as const,
        elements: [
          {
            id: "pair",
            value: "a x inv(a) = 1 (mod p)",
            label: "Modular Inverse Pair",
            state: "pivot" as const,
          },
          {
            id: "self",
            value: "Self-Inverses: 1, p - 1",
            label: "Unpaired Elements",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Because 1 and p - 1 are the ONLY elements that are their own modular inverses in Z_p, multiplying all terms from 1 to p - 1 collapses to 1 x 1 x ... x (p - 1) = p - 1 = -1 (mod p).",
      snapshot: {
        kind: "array" as const,
        name: "multiplicative_collapse",
        mode: "box" as const,
        elements: [
          {
            id: "inner",
            value: "Inner Terms = 1",
            label: "Paired Product",
            state: "sorted" as const,
          },
          { id: "ends", value: "1 x (p - 1)", label: "Boundary Product", state: "pivot" as const },
          {
            id: "final",
            value: "p - 1 = -1 (mod p)",
            label: "Wilson Result",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "For composite p > 4, p has proper factors a and b strictly smaller than p, which both appear in the product (p - 1)!, forcing (p - 1)! % p == 0.",
      snapshot: {
        kind: "array" as const,
        name: "composite_factor_cancellation",
        mode: "box" as const,
        elements: [
          {
            id: "comp_factors",
            value: "a x b = p",
            label: "Factors inside (p-1)!",
            state: "visited" as const,
          },
          {
            id: "zero_mod",
            value: "(p - 1)! = 0 (mod p)",
            label: "Zero Modulo",
            state: "visited" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Computing (p - 1)! mod p takes O(p) modular multiplications, which is far slower than O(sqrt(p)) trial division or O(log^3 p) Miller-Rabin testing.",
      snapshot: {
        kind: "array" as const,
        name: "complexity_tradeoff",
        mode: "box" as const,
        elements: [
          { id: "time_bound", value: "O(p)", label: "Time Complexity", state: "visited" as const },
          {
            id: "use_case",
            value: "Theoretical Proofs",
            label: "Primary Value",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Despite its computational complexity, Wilson's Theorem is a bedrock of abstract algebra, ring theory, finite fields, and Wilson prime research.",
      snapshot: {
        kind: "array" as const,
        name: "abstract_algebra",
        mode: "box" as const,
        elements: [
          {
            id: "wilson_primes",
            value: "5, 13, 563",
            label: "Known Wilson Primes",
            state: "sorted" as const,
          },
          {
            id: "group",
            value: "Z_p* Units Group",
            label: "Cyclic Structure",
            state: "sorted" as const,
          },
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

export const generateWilsonTheoremSteps = (input?: WilsonTheoremInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const p = Math.max(1, Math.floor(input?.p ?? 5));

  const getCompositeSnapshot = (
    currentI: number,
    currentFact: number,
    productHistory: { term: number; accumulated: number; state: ElementState }[],
    stageLabel: string,
    isFinal = false,
  ) => {
    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: `Wilson's Theorem Factorial Modulo Ring for p = ${p}`,
      items: [
        {
          id: "state_panel",
          role: "primary" as const,
          snapshot: {
            kind: "array" as const,
            name: "factorial_state",
            mode: "box" as const,
            elements: [
              { id: "target_p", value: p, label: "Candidate p", state: "active" as const },
              {
                id: "curr_term",
                value: currentI > 0 ? currentI : "-",
                label: "Multiplier i",
                state: "pivot" as const,
              },
              {
                id: "curr_fact",
                value: currentFact,
                label: "Running (fact x i) mod p",
                state: "compare" as const,
              },
              { id: "expected", value: p - 1, label: "Expected (p - 1)", state: "sorted" as const },
            ],
          },
        },
        {
          id: "ring_panel",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "product_sequence",
            mode: "box" as const,
            elements:
              productHistory.length > 0
                ? productHistory.map((item, idx) => ({
                    id: `term-${idx}`,
                    value: `${item.accumulated}`,
                    label: `i=${item.term}`,
                    state: item.state,
                  }))
                : [
                    {
                      id: "status",
                      value: stageLabel,
                      label: "Result",
                      state: isFinal
                        ? currentFact === p - 1
                          ? ("sorted" as const)
                          : ("visited" as const)
                        : ("default" as const),
                    },
                  ],
          },
        },
      ],
    };
  };

  if (p <= 1) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Candidate p = ${p} is less than or equal to 1, which is not prime by definition. Test terminates.`,
        primarySnapshot: getCompositeSnapshot(0, 0, [], "Non-prime p <= 1", true),
      }),
    );
    return steps;
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing Wilson's Theorem check for p = ${p}. Starting running factorial product at fact = 1, multiplying term by term i from 1 to ${p - 1}.`,
      primarySnapshot: getCompositeSnapshot(1, 1, [], "Initializing"),
    }),
  );

  let fact = 1;
  const history: { term: number; accumulated: number; state: ElementState }[] = [];

  for (let i = 1; i < p; i++) {
    const prevFact = fact;
    fact = (fact * i) % p;
    history.push({
      term: i,
      accumulated: fact,
      state: i === p - 1 ? (fact === p - 1 ? "sorted" : "visited") : "active",
    });

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Step i = ${i}: computing (${prevFact} x ${i}) mod ${p} = ${fact}.`,
        primarySnapshot: getCompositeSnapshot(i, fact, [...history], `Step i=${i}`),
      }),
    );
  }

  const isPrime = fact === p - 1;
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Factorial product loop completed: (p - 1)! mod ${p} = ${fact}. Since ${fact} ${isPrime ? "equals" : "does not equal"} ${p - 1}, candidate p = ${p} is confirmed ${isPrime ? "PRIME" : "COMPOSITE"}.`,
      primarySnapshot: getCompositeSnapshot(
        p - 1,
        fact,
        history,
        isPrime ? "PRIME" : "COMPOSITE",
        true,
      ),
    }),
  );

  return steps;
};

const WILSON_THEOREM_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Wilson's Theorem provides an exact mathematical necessary and sufficient primality criterion based on factorial products in modular arithmetic rings.</p>",
  sections: [
    {
      heading: "Mathematical Criterion & Modular Inverse Pairing",
      body: "<p>Wilson's Theorem asserts that <code>(p - 1)! &equiv; -1 (mod p)</code> if and only if <code>p</code> is prime. In the finite field <code>Z_p</code>, every integer in <code>{2, 3, ..., p - 2}</code> has a unique distinct modular inverse, pairing up to multiply to 1 modulo <code>p</code>. The only self-inverse elements are 1 and <code>p - 1</code>.</p>",
    },
    {
      heading: "Composite Behavior & Factor Collapse",
      body: "<p>If <code>p</code> is composite and <code>p > 4</code>, <code>p</code> can be factored into <code>a &times; b</code> with <code>1 < a, b < p</code>. Both factors appear inside <code>(p - 1)!</code>, forcing <code>(p - 1)! &equiv; 0 (mod p)</code>.</p>",
    },
    {
      heading: "Complexity Trade-offs",
      body: "<p>Evaluating <code>(p - 1)! mod p</code> takes <strong>O(p)</strong> operations, making it computationally impractical for large numbers compared to <strong>O(&radic;p)</strong> trial division or <strong>O(log<sup>3</sup> p)</strong> Miller-Rabin testing.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Wilson's Criterion",
      definition: "The exact identity (p - 1)! = -1 (mod p) characterizing prime numbers.",
    },
    {
      term: "Modular Inverse Pair",
      definition: "Two distinct elements a and b such that a * b = 1 (mod p).",
    },
    {
      term: "Wilson Prime",
      definition:
        "A prime p such that (p - 1)! = -1 (mod p^2). Known Wilson primes are 5, 13, and 563.",
    },
  ],
};

const WILSON_THEOREM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    10: "Initialize running factorial product to 1.",
    11: "Loop through integer terms i from 1 to p - 1.",
    12: "Update running product modulo p.",
    13: "Check if (p - 1)! mod p equals p - 1.",
  },
};

export const wilsonTheorem: AlgorithmDefinition<WilsonTheoremInput> = {
  id: "wilson-theorem",
  title: "Wilson's Theorem Primality Criterion",
  topicIds: ["math_and_number_theory"],
  difficulty: "Easy",
  description:
    "<p>Tests primality of an integer using Wilson's exact factorial criterion.</p><h3>Input Parameters</h3><ul><li><code>p</code> (&ge; 2): Integer candidate to test for primality.</li></ul><h3>Output Format</h3><ul><li><code>boolean</code>: True if p is prime, False otherwise.</li></ul>",
  constraints: ["2 <= p <= 20"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { p: 5 },
      output: "true",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { p: 2 },
      output: "true",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { p: 6 },
      output: "false",
    },
  ],
  code: PYTHON_WILSON_THEOREM_CODE,
  timeComplexity: {
    best: "O(p)",
    average: "O(p)",
    worst: "O(p)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Computing (p - 1)! mod p requires p - 1 modular multiplications, running in O(p) time.",
    space: "Requires O(1) auxiliary space.",
  },
  topicGuide: WILSON_THEOREM_TOPIC_GUIDE,
  trivia: WILSON_THEOREM_TRIVIA,
  sources: [
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
  defaultInput: DEFAULT_WILSON_THEOREM_INPUT,
  generateSteps: generateWilsonTheoremSteps,
};

export default wilsonTheorem;
