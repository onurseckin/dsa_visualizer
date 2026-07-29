import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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
  n: 36,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      title: "Euler Totient Function Definition",
      narrative:
        "Euler's totient function phi(n) calculates the count of positive integers up to n that are coprime to n, meaning their greatest common divisor with n equals 1.",
      matrix: [[2, 36, 36, 36]],
    },
    {
      title: "Brute-Force Counting Bottleneck",
      narrative:
        "Checking gcd(k, n) == 1 for every candidate integer k from 1 to n takes O(n log n) operations, which becomes completely impractical for large values.",
      matrix: [[2, 36, "Check 1..n", 36]],
    },
    {
      title: "Euler's Product Formula",
      narrative:
        "Euler's product formula states that phi(n) = n * prod(1 - 1/p) over all distinct prime factors p dividing n.",
      matrix: [[2, 36, "n * prod(1-1/p)", 36]],
    },
    {
      title: "Inclusion-Exclusion Interpretation",
      narrative:
        "For each prime factor p, exactly 1/p of the integers in 1..n share factor p, so we subtract result // p to remove all multiples of p.",
      matrix: [[2, 36, "sub(res // p)", 36]],
    },
    {
      title: "Trial Division up to sqrt(n)",
      narrative:
        "We iterate prime candidates p up to sqrt(n). Any composite number n has at most one prime factor greater than sqrt(n).",
      matrix: [[2, 36, "p <= sqrt(n)", 36]],
    },
    {
      title: "Stripping Duplicate Prime Factors",
      narrative:
        "When prime factor p is identified, we divide temp by p repeatedly until p no longer divides temp, ensuring distinct prime factor processing.",
      matrix: [[2, 36, "temp //= p", 18]],
    },
    {
      title: "Residual Large Prime Factor",
      narrative:
        "If temp > 1 after the candidate loop terminates, the remaining temp value is a prime factor greater than sqrt(n) and is processed.",
      matrix: [[2, 36, "temp > 1", 1]],
    },
    {
      title: "Prime Number Special Case",
      narrative:
        "For any prime number p, all integers in 1..p-1 are coprime to p, yielding the identity phi(p) = p - 1.",
      matrix: [[2, 13, "phi(p) = p-1", 1]],
    },
    {
      title: "Optimal Time and Space Bounds",
      narrative:
        "Euler's product formula via trial division runs in O(sqrt(n)) time using O(1) auxiliary space.",
      matrix: [[2, 36, "O(sqrt(n))", 1]],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "totient_concept",
        rows: 1,
        cols: 4,
        cells: data.matrix[0].map((val, cIdx) => ({
          row: 0,
          col: cIdx,
          value: val,
          label: `c${cIdx}`,
          state: cIdx === 2 ? ("active" as const) : ("default" as const),
        })),
        colHeaders: ["Candidate p", "Input n", "Totient φ(n)", "Quotient temp"],
      },
    }),
  );
};

export const generateEulerTotientSteps = (input?: EulerTotientInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const safeInput = input ?? DEFAULT_EULER_TOTIENT_INPUT;
  const rawN =
    typeof safeInput?.n === "number" && !isNaN(safeInput.n)
      ? safeInput.n
      : DEFAULT_EULER_TOTIENT_INPUT.n;
  const nVal = Math.max(1, Math.floor(rawN));
  let result = nVal;
  let temp = nVal;
  let p = 2;

  const createMatrixSnapshot = (
    rVal: number,
    tVal: number,
    pVal: number,
    activeSlot?: "p" | "res" | "temp" | "n",
    isDone: boolean = false,
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [
      {
        row: 0,
        col: 0,
        value: pVal,
        label: "p",
        state: isDone ? "sorted" : activeSlot === "p" ? "active" : "default",
      },
      {
        row: 0,
        col: 1,
        value: nVal,
        label: "n",
        state: isDone ? "sorted" : activeSlot === "n" ? "active" : "default",
      },
      {
        row: 0,
        col: 2,
        value: rVal,
        label: "φ(n)",
        state: isDone ? "sorted" : activeSlot === "res" ? "active" : "sorted",
      },
      {
        row: 0,
        col: 3,
        value: tVal,
        label: "temp",
        state: isDone ? "sorted" : activeSlot === "temp" ? "active" : "compare",
      },
    ];

    return {
      kind: "matrix",
      name: "totient_matrix",
      rows: 1,
      cols: 4,
      colHeaders: ["Candidate p", "Input n", "Totient φ(n)", "Quotient temp"],
      cells,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize Euler's totient function calculation for n = ${nVal} with result φ(n) = ${nVal} and quotient temp = ${nVal}.`,
      primarySnapshot: createMatrixSnapshot(result, temp, p),
    }),
  );

  while (p * p <= temp) {
    if (temp % p === 0) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Candidate p = ${p} divides temp = ${temp}, identifying ${p} as a prime factor of ${nVal}.`,
          primarySnapshot: createMatrixSnapshot(result, temp, p, "p"),
        }),
      );

      while (temp % p === 0) {
        temp = Math.floor(temp / p);
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `We divide prime factor ${p} out of temp, reducing unfactored quotient to temp = ${temp}.`,
            primarySnapshot: createMatrixSnapshot(result, temp, p, "temp"),
          }),
        );
      }

      const prevRes = result;
      result -= Math.floor(result / p);

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `We update totient accumulator for prime factor ${p}: φ(n) = ${prevRes} - (${prevRes} // ${p}) = ${result}.`,
          primarySnapshot: createMatrixSnapshot(result, temp, p, "res"),
        }),
      );
    }

    p += 1;
  }

  if (temp > 1) {
    const prevRes = result;
    result -= Math.floor(result / temp);

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Remaining quotient temp = ${temp} > 1 is a prime factor greater than sqrt(n). Updating φ(n) = ${prevRes} - (${prevRes} // ${temp}) = ${result}.`,
        primarySnapshot: createMatrixSnapshot(result, temp, p, "res"),
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Calculation complete: Euler's totient function φ(${nVal}) = ${result}.`,
      primarySnapshot: createMatrixSnapshot(result, 1, p, "res", true),
    }),
  );

  return steps;
};

export const EULER_TOTIENT_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Euler's Totient function φ(n) counts positive integers up to n coprime to n.</p>",
  sections: [
    {
      heading: "Product Formula",
      body: "<p>phi(n) = n * prod(1 - 1/p) over distinct prime factors p of n.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Euler's Totient Function",
      definition: "Count of numbers k in 1..n coprime to n.",
    },
  ],
};

export const EULER_TOTIENT_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const eulerTotientFunction: AlgorithmDefinition<EulerTotientInput> = {
  id: "euler-totient-function",
  title: "Euler's Totient Function",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute Euler's Totient function <code>&phi;(n)</code>, which counts the number of integers <code>k &in; [1, n]</code> coprime to <code>n</code>.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code> (<code>n &ge; 1</code>): Target integer.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: Count of coprime integers <code>&phi;(n)</code>.</li></ul>",
  constraints: ["1 <= n <= 10^12"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Composite Number (n = 36)",
      inputDisplay: "n = 36",
      outputDisplay: "φ(36) = 12",
      input: { n: 36 },
      output: "12",
      explanation: "36 has prime factors 2 and 3. φ(36) = 36 * (1 - 1/2) * (1 - 1/3) = 12.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Smallest Input (n = 1)",
      inputDisplay: "n = 1",
      outputDisplay: "φ(1) = 1",
      input: { n: 1 },
      output: "1",
      explanation: "By definition, φ(1) = 1.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Prime Number (n = 13)",
      inputDisplay: "n = 13",
      outputDisplay: "φ(13) = 12",
      input: { n: 13 },
      output: "12",
      explanation: "For any prime p, φ(p) = p - 1 = 12.",
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
    time: "Trial division scans prime candidates up to sqrt(n), resulting in O(sqrt(n)) runtime.",
    space: "Requires O(1) space.",
  },
  topicGuide: EULER_TOTIENT_TOPIC_GUIDE,
  trivia: EULER_TOTIENT_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      chapterTitle: "Number Theory",
      section: "21.3 Euler's totient function",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_EULER_TOTIENT_INPUT,
  generateSteps: generateEulerTotientSteps,
};

export default eulerTotientFunction;
