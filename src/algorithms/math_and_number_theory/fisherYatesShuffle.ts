import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface FisherYatesShuffleInput {
  n: number;
}

export const PYTHON_FISHER_YATES_SHUFFLE_CODE = `import random

class Solution:
    def __init__(self):
        pass

    def shuffle(self, nums: list[int]) -> list[int]:
        arr = list(nums)
        n = len(arr)
        for i in range(n - 1, 0, -1):
            j = random.randint(0, i)
            arr[i], arr[j] = arr[j], arr[i]
        return arr`;

export const DEFAULT_FISHER_YATES_SHUFFLE_INPUT: FisherYatesShuffleInput = {
  n: 5,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "The Fisher-Yates (or Knuth) Shuffle generates an unbiased, uniformly random permutation of an array in linear O(N) time and O(1) in-place space.",
      arr: [1, 2, 3, 4, 5],
      activeI: undefined,
      activeJ: undefined,
      lockedFrom: 5,
      overrideState: "default" as ElementState,
      vars: { "Array Size N": 5, "Total Permutations": "5! = 120" },
    },
    {
      narrative:
        "A shuffle algorithm is unbiased if every one of the N! possible permutations is generated with exactly equal probability 1 / N!.",
      arr: [1, 2, 3, 4, 5],
      activeI: 4,
      activeJ: undefined,
      lockedFrom: 5,
      overrideState: undefined,
      vars: { "Target Probability": "1 / N!", Requirement: "Strict Uniformity" },
    },
    {
      narrative:
        "Naive shuffling by assigning random floating-point keys to elements and sorting takes O(N log N) time and extra O(N) auxiliary space.",
      arr: [1, 2, 3, 4, 5],
      activeI: undefined,
      activeJ: undefined,
      lockedFrom: 5,
      overrideState: "compare" as ElementState,
      vars: {
        "Naive Time": "O(N log N)",
        "Naive Space": "O(N)",
        Drawback: "Sub-optimal efficiency",
      },
    },
    {
      narrative:
        "A common buggy implementation picks random index j in range [0, N-1] instead of [0, i], creating N^N outcomes which cannot divide N! evenly, causing statistical bias.",
      arr: [1, 2, 3, 4, 5],
      activeI: 4,
      activeJ: 2,
      lockedFrom: 5,
      overrideState: undefined,
      vars: {
        "Flawed Range": "[0, N-1]",
        Pathways: "N^N = 3125",
        "Bias Cause": "3125 not divisible by 120",
      },
    },
    {
      narrative:
        "Fisher-Yates iterates backward from index i = N minus 1 down to 1, picking a uniform random index j in the restricted range [0, i] at each step.",
      arr: [1, 2, 3, 4, 5],
      activeI: 4,
      activeJ: 1,
      lockedFrom: 5,
      overrideState: undefined,
      vars: { "Loop Index i": 4, "Random j Range": "[0, 4]", "Picked j": 1 },
    },
    {
      narrative:
        "Swapping array[i] with array[j] locks element array[i] into its final position, guaranteeing index i receives each remaining candidate with probability 1 / (i + 1).",
      arr: [3, 2, 1, 4, 5],
      activeI: 3,
      activeJ: undefined,
      lockedFrom: 4,
      overrideState: undefined,
      vars: { "Locked Index": 4, "Step Probability": "1 / 5", "Remaining Unshuffled": 4 },
    },
    {
      narrative:
        "By mathematical induction, multiplying step probabilities (1/N) times (1/(N-1)) down to 1/2 proves overall permutation probability equals exactly 1 / N!.",
      arr: [3, 5, 1, 4, 2],
      activeI: 2,
      activeJ: 0,
      lockedFrom: 3,
      overrideState: undefined,
      vars: { "Probability Product": "(1/5)*(1/4)*(1/3)*(1/2)", "Final Probability": "1 / 120" },
    },
    {
      narrative:
        "The algorithm executes in-place directly within the input array without allocating extra memory structures.",
      arr: [5, 1, 4, 2, 3],
      activeI: undefined,
      activeJ: undefined,
      lockedFrom: 0,
      overrideState: "sorted" as ElementState,
      vars: { "Auxiliary Space": "O(1)", "Memory Allocations": 0 },
    },
    {
      narrative:
        "Fisher-Yates shuffle runs in optimal linear O(N) time and serves as the standard library shuffle in Java, C++, Python, and JavaScript.",
      arr: [5, 1, 4, 2, 3],
      activeI: undefined,
      activeJ: undefined,
      lockedFrom: 0,
      overrideState: "pivot" as ElementState,
      vars: { "Time Complexity": "O(N)", "Space Complexity": "O(1)" },
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      variables: data.vars,
      primarySnapshot: {
        kind: "array",
        name: "nums",
        mode: "box",
        elements: data.arr.map((val, i) => {
          let state: ElementState = data.overrideState ?? "default";
          const pointers: string[] = [];
          if (!data.overrideState && i >= data.lockedFrom) {
            state = "sorted";
          } else if (!data.overrideState && i === data.activeI) {
            state = "active";
            pointers.push("i");
          } else if (!data.overrideState && i === data.activeJ) {
            state = "pivot";
            pointers.push("j");
          }

          return {
            id: `intro-arr-${i}`,
            value: val,
            label: `[${i}]`,
            state,
            pointers: pointers.length > 0 ? pointers : undefined,
          };
        }),
      },
    }),
  );
};

export const generateFisherYatesShuffleSteps = (
  input: FisherYatesShuffleInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawN = input?.n ?? 5;
  const n = Math.min(20, Math.max(1, Math.floor(rawN)));
  const arr = Array.from({ length: n }, (_, idx) => idx + 1);

  const getArraySnapshot = (
    iPointer?: number,
    jPointer?: number,
    lockedFromIndex: number = n,
    swappedPair?: [number, number],
  ) => {
    const elements: ArrayElement[] = arr.map((val, idx) => {
      let state: ElementState = "default";
      const pointers: string[] = [];

      if (idx >= lockedFromIndex) {
        state = "sorted";
      } else if (swappedPair && (idx === swappedPair[0] || idx === swappedPair[1])) {
        state = "swap";
      } else if (idx === iPointer) {
        state = "active";
        pointers.push("i");
      } else if (idx === jPointer) {
        state = "pivot";
        pointers.push("j");
      }

      return {
        id: `arr-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: pointers.length > 0 ? pointers : undefined,
      };
    });

    return {
      kind: "array" as const,
      name: "nums",
      mode: "box" as const,
      elements,
    };
  };

  // Step 1: Initialization
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing array of ${n} elements [${arr.join(", ")}] for in-place Fisher-Yates shuffle. Loop pointer i starts at index ${n > 1 ? n - 1 : 0}.`,
      variables: {
        "Array Size N": n,
        "Loop Pointer i": n > 1 ? n - 1 : 0,
        "Random Choice j Range": n > 1 ? `[0, ${n - 1}]` : "None",
      },
      primarySnapshot: getArraySnapshot(n > 1 ? n - 1 : undefined, undefined, n),
    }),
  );

  if (n <= 1) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Array size N = ${n} has only 1 element. No swap iterations required; array is trivially shuffled.`,
        variables: {
          "Array Size N": n,
          "Final Permutation": `[${arr.join(", ")}]`,
        },
        primarySnapshot: getArraySnapshot(undefined, undefined, 0),
      }),
    );
    return steps;
  }

  // Shuffle loop backward from i = n - 1 down to 1
  for (let i = n - 1; i > 0; i--) {
    // Deterministic pseudo-random choice for reproducible visual walkthroughs
    const j = Math.floor(((i * 13 + 7) % 31) % (i + 1));

    // Inspect frame: show selected pointers i and j
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Iterating at index i = ${i}: randomly selecting index j = ${j} from range [0, ${i}] with step probability 1 / ${i + 1}.`,
        variables: {
          "Index i": i,
          "Value at i": arr[i],
          "Selected j": j,
          "Value at j": arr[j],
          "Selection Range": `[0, ${i}]`,
          "Step Probability": `1 / ${i + 1}`,
        },
        primarySnapshot: getArraySnapshot(i, j, i + 1),
      }),
    );

    // Perform swap
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;

    // Consequence frame: swap performed and index i locked
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Swapped element ${arr[i]} at index ${j} with element ${arr[j]} at index ${i}. Index ${i} is now locked in its final position.`,
        variables: {
          "Swapped Indices": `[${i}, ${j}]`,
          "New Element at i": arr[i],
          "New Element at j": arr[j],
          "Locked Index": i,
          "Remaining Unshuffled Count": i,
        },
        primarySnapshot: getArraySnapshot(i, j, i, [i, j]),
      }),
    );
  }

  // Completion frame
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Fisher-Yates shuffle completed in O(N) time. Final uniform random permutation: [${arr.join(", ")}].`,
      variables: {
        "Final Permutation": `[${arr.join(", ")}]`,
        "Time Complexity": "O(N)",
        "Space Complexity": "O(1)",
      },
      primarySnapshot: getArraySnapshot(undefined, undefined, 0),
    }),
  );

  return steps;
};

const FISHER_YATES_SHUFFLE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The Fisher-Yates (Knuth) Shuffle generates an unbiased, uniform random permutation of an array in <code>O(N)</code> linear time and <code>O(1)</code> in-place space.</p>",
  sections: [
    {
      heading: "Uniformity & In-Place Swapping",
      body: "<p>Iterating <code>i</code> from <code>N - 1</code> down to 1 and swapping element <code>nums[i]</code> with a uniform random element <code>nums[j]</code> in range <code>[0, i]</code> guarantees each of the <code>N!</code> possible permutations occurs with equal probability <code>1 / N!</code>.</p>",
    },
    {
      heading: "Avoid Flawed Range [0, N-1]",
      body: "<p>Selecting <code>j</code> across the full range <code>[0, N-1]</code> at every step generates <code>N<sup>N</sup></code> execution paths. Since <code>N!</code> does not divide <code>N<sup>N</sup></code> for <code>N > 2</code>, some permutations occur more frequently than others, introducing significant statistical bias.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Uniform Permutation",
      definition:
        "A random arrangement where all N! possible permutations occur with equal probability 1 / N!.",
    },
    {
      term: "Fisher-Yates Shuffle",
      definition: "An optimal in-place algorithm for generating uniform random permutations.",
    },
  ],
};

const FISHER_YATES_SHUFFLE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Performs in-place Fisher-Yates random array shuffle.",
  },
};

export const fisherYatesShuffle: AlgorithmDefinition<FisherYatesShuffleInput> = {
  id: "fisher-yates-shuffle",
  title: "Fisher-Yates Random Shuffle",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Generate a uniform random permutation of an array in <code>O(N)</code> time using the Fisher-Yates (Knuth) shuffle algorithm.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code> (<code>n &ge; 1</code>): Number of elements in the array to shuffle.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>list[int]</code>: Uniformly shuffled array permutation.</li></ul>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Array Shuffle (N = 5)",
      input: { n: 5 },
      output: "[3, 1, 5, 2, 4]",
      explanation:
        "Iterates i from 4 down to 1 with random swaps, generating a uniform permutation.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Boundary Single Element (N = 1)",
      input: { n: 1 },
      output: "[1]",
      explanation: "A single-element array requires 0 swaps.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Adversarial Larger Array (N = 8)",
      input: { n: 8 },
      output: "[7, 2, 8, 4, 1, 6, 3, 5]",
      explanation: "Shuffles 8 elements in 7 linear swap steps.",
    },
  ],
  code: PYTHON_FISHER_YATES_SHUFFLE_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Processing N elements with single in-place swaps takes O(N) time.",
    space: "Requires O(1) auxiliary space as element swaps occur directly in-place.",
  },
  topicGuide: FISHER_YATES_SHUFFLE_TOPIC_GUIDE,
  trivia: FISHER_YATES_SHUFFLE_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "The Art of Computer Programming, Vol 2",
      chapter: 24,
      section: "24.5 Randomized algorithms",
    },
  ],
  defaultInput: DEFAULT_FISHER_YATES_SHUFFLE_INPUT,
  generateSteps: generateFisherYatesShuffleSteps,
};

export default fisherYatesShuffle;
