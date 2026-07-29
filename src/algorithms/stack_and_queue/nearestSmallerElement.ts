import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  CompositeCanvasSnapshot,
  ElementState,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface NearestSmallerElementInput {
  nums: number[];
}

export const DEFAULT_NEAREST_SMALLER_INPUT: NearestSmallerElementInput = {
  nums: [6, 4, 5, 2, 10, 8, 7, 12, 1, 9],
};

export const PYTHON_NEAREST_SMALLER_CODE = `def nearest_smaller_element(nums: list[int]) -> list[int]:
    n = len(nums)
    result = [-1] * n
    stack = []

    for i in range(n):
        while stack and stack[-1] >= nums[i]:
            stack.pop()
        if stack:
            result[i] = stack[-1]
        stack.append(nums[i])

    return result`;

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Nearest Smaller Element problem finds the closest preceding number to the left that is strictly smaller than the current element for each position in an array.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 6, label: "[0]", state: "default" },
        { id: "c2", value: 4, label: "[1]", state: "default" },
        { id: "c3", value: 5, label: "[2]", state: "default" },
        { id: "c4", value: 2, label: "[3]", state: "default" },
        { id: "c5", value: 10, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "A naive search scans leftward for every element, requiring O(N²) quadratic time in the worst case; a monotonic stack optimizes this to optimal O(N) linear time.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 6, label: "[0]", state: "compare" },
        { id: "c2", value: 4, label: "[1]", state: "compare" },
        { id: "c3", value: 5, label: "[2]", state: "active", pointers: ["i"] },
        { id: "c4", value: 2, label: "[3]", state: "default" },
        { id: "c5", value: 10, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "We maintain an increasing monotonic stack of candidate values whose elements strictly increase from bottom to top.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-nums",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 6, label: "[0]", state: "visited" },
              { id: "c2", value: 4, label: "[1]", state: "sorted", pointers: ["cand"] },
              { id: "c3", value: 5, label: "[2]", state: "active", pointers: ["i"] },
              { id: "c4", value: 2, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [{ id: "st-0", value: 4, label: "top", state: "active" }],
          },
        },
      ],
    },
  },
  {
    narrative:
      "By the Domination Principle, if an older element X ≥ nums[i], then X is dominated by nums[i] (which is smaller and newer) and can never be the nearest smaller element for any future query.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-nums",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 6, label: "[0]", state: "visited", pointers: ["dominated"] },
              { id: "c2", value: 4, label: "[1]", state: "active", pointers: ["smaller & newer"] },
              { id: "c3", value: 5, label: "[2]", state: "default" },
              { id: "c4", value: 2, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [{ id: "st-0", value: 4, label: "top", state: "active" }],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Pop Phase: whenever a new element nums[i] arrives, we pop all elements off the stack that are ≥ nums[i] to preserve monotonic ordering.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-nums",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 6, label: "[0]", state: "visited" },
              { id: "c2", value: 4, label: "[1]", state: "swap", pointers: ["popped"] },
              { id: "c3", value: 5, label: "[2]", state: "visited" },
              { id: "c4", value: 2, label: "[3]", state: "active", pointers: ["i"] },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Answer Phase: after popping, if the stack is non-empty, the top element stack[-1] is the nearest smaller element to the left; if empty, output -1.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-nums",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 6, label: "[0]", state: "visited" },
              { id: "c2", value: 4, label: "[1]", state: "sorted", pointers: ["ans = 4"] },
              { id: "c3", value: 5, label: "[2]", state: "active", pointers: ["i"] },
              { id: "c4", value: 2, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [{ id: "st-0", value: 4, label: "top", state: "sorted" }],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Push Phase: push nums[i] onto the stack so it can serve as a smaller candidate for subsequent rightward elements.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-nums",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 6, label: "[0]", state: "visited" },
              { id: "c2", value: 4, label: "[1]", state: "sorted" },
              { id: "c3", value: 5, label: "[2]", state: "active", pointers: ["pushed"] },
              { id: "c4", value: 2, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [
              { id: "st-0", value: 4, label: "[0]", state: "default" },
              { id: "st-1", value: 5, label: "top", state: "active" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Amortized O(N) Efficiency: because each element is pushed onto the stack exactly once and popped at most once, total operations across N steps are bounded by 2N.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-nums",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 6, label: "[0]", state: "sorted" },
              { id: "c2", value: 4, label: "[1]", state: "sorted" },
              { id: "c3", value: 5, label: "[2]", state: "sorted" },
              { id: "c4", value: 2, label: "[3]", state: "sorted" },
              { id: "c5", value: 10, label: "[4]", state: "sorted" },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [
              { id: "st-0", value: 2, label: "[0]", state: "default" },
              { id: "st-1", value: 10, label: "top", state: "sorted" },
            ],
          },
        },
      ],
    },
  },
];

export const generateNearestSmallerElementSteps = (
  input: NearestSmallerElementInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums =
    Array.isArray(input?.nums) && input.nums.length > 0
      ? input.nums
      : DEFAULT_NEAREST_SMALLER_INPUT.nums;
  const n = nums.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input.nums) &&
      input.nums.length === DEFAULT_NEAREST_SMALLER_INPUT.nums.length &&
      input.nums.every((val, idx) => val === DEFAULT_NEAREST_SMALLER_INPUT.nums[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const stack: number[] = [];
  const result: number[] = new Array<number>(n).fill(-1);

  const makeComposite = (
    currentI?: number,
    highlightIdx?: number,
    highlightState: ElementState = "compare",
  ): CompositeCanvasSnapshot => {
    const arrayElements: ArrayElement[] = nums.map((val, idx) => {
      const ptrs: string[] = [];
      if (idx === currentI) ptrs.push("i");
      if (result[idx] !== -1 && idx <= (currentI ?? n - 1)) {
        ptrs.push(`ans:${result[idx]}`);
      }

      let state: ArrayElement["state"] = "default";
      if (idx === highlightIdx) {
        state = highlightState;
      } else if (idx === currentI) {
        state = "active";
      } else if (currentI !== undefined && idx < currentI) {
        state = "visited";
      }

      return {
        id: `num-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });

    const stackElements: ArrayElement[] = stack.map((val, pos) => ({
      id: `st-${pos}`,
      value: val,
      label: pos === stack.length - 1 ? "top" : `[${pos}]`,
      state: pos === stack.length - 1 ? "active" : "default",
    }));

    return {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "nse-nums",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: arrayElements,
          },
        },
        {
          id: "nse-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: stackElements,
          },
        },
      ],
    };
  };

  if (n === 0) {
    addStep(
      "The input array is empty, so no nearest smaller elements can be identified; returning empty result [].",
      makeComposite(),
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected input array of ${n} elements: [${nums.join(", ")}].`,
    makeComposite(),
  );

  for (let i = 0; i < n; i++) {
    const currentVal = nums[i];

    addStep(
      `Inspect index ${i} (nums[${i}] = ${currentVal}): prepare to query monotonic stack for nearest smaller element to the left.`,
      makeComposite(i, i, "compare"),
    );

    while (stack.length > 0 && stack[stack.length - 1] >= currentVal) {
      const poppedVal = stack.pop()!;
      addStep(
        `Stack top ${poppedVal} ≥ current value ${currentVal}: by Domination Principle, pop ${poppedVal} off stack as it cannot serve as nearest smaller for future queries.`,
        makeComposite(i, i, "swap"),
      );
    }

    if (stack.length > 0) {
      result[i] = stack[stack.length - 1];
      addStep(
        `Stack top ${result[i]} is strictly smaller than current value ${currentVal}: record nearest smaller element for index ${i} as result[${i}] = ${result[i]}.`,
        makeComposite(i, i, "sorted"),
      );
    } else {
      result[i] = -1;
      addStep(
        `Stack is EMPTY: no element to the left is smaller than ${currentVal}. Record result[${i}] = -1.`,
        makeComposite(i, i, "active"),
      );
    }

    stack.push(currentVal);
    addStep(
      `Push current value ${currentVal} onto stack (stack = [${stack.join(", ")}]) as candidate for subsequent elements.`,
      makeComposite(i, i, "active"),
    );
  }

  addStep(
    `Nearest Smaller Element complete! Processed all ${n} elements, yielding result list: [${result.join(", ")}].`,
    makeComposite(undefined, undefined, "sorted"),
  );

  return steps;
};

const NEAREST_SMALLER_TRIVIA: TriviaMeta = {
  skipLines: [2, 6, 10, 13, 15, 18],
  lineExplanations: {
    1: "Declares nearest_smaller_element function accepting an integer list nums.",
    2: "Caches length of input sequence as variable n.",
    3: "Initializes result list of length n filled with default -1 entries.",
    4: "Initializes empty monotonic stack to track increasing candidate elements.",
    5: "Iterates through array indices i from 0 up to n - 1.",
    6: "Loops while stack is non-empty and top element stack[-1] >= nums[i].",
    7: "Pops top element off stack because nums[i] is smaller and newer.",
    8: "Checks if stack contains a valid smaller candidate after popping.",
    9: "Records stack top element as nearest smaller element to the left (result[i] = stack[-1]).",
    10: "Pushes current element nums[i] onto top of stack.",
    11: "Returns completed result list after scanning all array elements.",
  },
};

export const nearestSmallerElement: AlgorithmDefinition<NearestSmallerElementInput> = {
  id: "nearest-smaller-element",
  title: "Nearest Smaller Element",
  topicIds: ["stack_and_queue"],
  difficulty: "Medium",
  description: `<p>Given an array of integers <code>nums</code>, find the nearest smaller element to the left for each element in the array.</p>
<h3>Problem Statement</h3>
<p>Given an array of integers <code>nums</code> of length <em>N</em>, for each element at index <em>i</em> (0 &le; <em>i</em> &lt; <em>N</em>), locate the largest index <em>j</em> &lt; <em>i</em> such that <code>nums[j]</code> &lt; <code>nums[i]</code>. If no such element exists, output <code>-1</code> for index <em>i</em>.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nums</code>: An array of integers.</li>
</ul>
<h3>Output</h3>
<p>Returns an array <code>result</code> of length <em>N</em> where <code>result[i]</code> is the nearest smaller element to the left of <code>nums[i]</code>, or <code>-1</code> if no smaller element exists to its left.</p>
`,
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nums = [6, 4, 5, 2, 10, 8, 7, 12, 1, 9]",
      outputDisplay: "[-1, -1, 4, -1, 2, 2, 2, 7, -1, 1]",
      title: "Standard 10-Element Array",
      input: DEFAULT_NEAREST_SMALLER_INPUT,
      output: "[-1, -1, 4, -1, 2, 2, 2, 7, -1, 1]",
      explanation: "Nearest smaller elements to the left for array of 10 elements.",
    },
    {
      kind: "complex",
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [4, 5, 2, 10, 8]",
      outputDisplay: "[-1, 4, -1, 2, 2]",
      title: "Adversarial 5-Element Array",
      input: { nums: [4, 5, 2, 10, 8] },
      output: "[-1, 4, -1, 2, 2]",
      explanation: "Returns nearest smaller elements [-1, 4, -1, 2, 2].",
    },
    {
      kind: "negative",
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [5, 4, 3, 2, 1]",
      outputDisplay: "[-1, -1, -1, -1, -1]",
      title: "Boundary Decreasing Array",
      input: { nums: [5, 4, 3, 2, 1] },
      output: "[-1, -1, -1, -1, -1]",
      explanation: "In a strictly decreasing array, no element has a smaller element to its left.",
    },
  ],
  code: PYTHON_NEAREST_SMALLER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Each array element is pushed onto the stack exactly once and popped at most once. Therefore, across all $N$ iterations, the total number of stack pushes is $N$ and the total number of pops is at most $N$. The amortized time per element is $O(1)$, giving a total time complexity of $O(N)$.",
    space:
      "In the worst case (a strictly increasing array), the stack stores up to $N$ elements. Thus the auxiliary space complexity is $O(N)$.",
  },
  topicGuide: {
    overview:
      "<p>The Nearest Smaller Element problem asks for the nearest preceding element smaller than each array entry. A naive search checks all preceding indices for each element, taking <em>O(N<sup>2</sup>)</em> time. By using a monotonic stack—a stack whose elements are maintained in strictly sorted order—we can prune invalid candidates and achieve <em>O(N)</em> linear runtime.</p>",
    sections: [
      {
        heading: "The Monotonic Stack Invariant",
        body: "<p>The algorithm maintains a stack whose entries strictly increase from bottom to top. When processing element <code>nums[i]</code>, any stack element &ge; <code>nums[i]</code> is popped. This preserves the invariant: every element currently in the stack is strictly smaller than the elements above it. Once popping finishes, the top element is guaranteed to be the nearest smaller element to the left of index <em>i</em>.</p>",
      },
      {
        heading: "Domination Principle & Amortized Linear Proof",
        body: "<p>Why is it safe to pop an element <em>x</em> when <em>x</em> &ge; <code>nums[i]</code>? Because <code>nums[i]</code> is both smaller than (or equal to) <em>x</em> AND located further to the right. Any future element to the right of index <em>i</em> that could potentially use <em>x</em> as its nearest smaller element will find <code>nums[i]</code> (or something even smaller) first. Thus, <em>x</em> is permanently dominated and can never be the answer for any subsequent query. Since each element is pushed once and popped at most once, total work across the entire scan is bounded by 2<em>N</em> operations, guaranteeing amortized <em>O(N)</em> runtime.</p>",
      },
      {
        heading: "Comparison of Approaches & Trade-Offs",
        body: "<p>1. <strong>Brute Force</strong> <em>O(N<sup>2</sup>)</em>: For each element <em>i</em>, scan leftward. Simple but exceeds time limits for large inputs.<br />2. <strong>Segment Tree / RMQ</strong> <em>O(N log N)</em>: Supports dynamic range minimum queries, but requires <em>O(N)</em> extra tree overhead and logarithmic query time.<br />3. <strong>Monotonic Stack</strong> <em>O(N)</em>: Optimal for static array scans. Runs in linear time with sequential array access that maximizes CPU cache hit rates.</p>",
      },
      {
        heading: "Systems Applications & Memory Efficiency",
        body: "<p>Monotonic stack traversals access memory sequentially, which plays exceptionally well with modern CPU hardware prefetchers. Dynamic array-backed stacks store entries contiguously in L1/L2 cache, making this algorithm significantly faster in practice than pointer-based data structures like binary search trees.</p>",
      },
      {
        heading: "Edge Cases & Strict vs Non-Strict Variations",
        body: "<p>The condition <code>stack[-1] &ge; nums[i]</code> enforces strictly smaller nearest neighbors. If the problem asks for nearest smaller-or-equal elements, change the condition to <code>stack[-1] &gt; nums[i]</code>. For duplicate elements, non-strict popping ensures the stack only holds distinct values when required.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Monotonic Stack",
        definition:
          "A stack data structure whose elements are maintained in monotonic (strictly increasing or decreasing) order by popping elements that violate the ordering condition prior to pushing a new element.",
      },
      {
        term: "Domination Principle",
        definition:
          "The logical guarantee that a newer, smaller element renders an older, larger element permanently obsolete for all future nearest-smaller queries.",
      },
      {
        term: "Amortized Analysis",
        definition:
          "A method of proving that even though an individual iteration may perform up to N pops, the total cost across all N iterations cannot exceed 2N operations, giving an average O(1) cost per step.",
      },
      {
        term: "Range Minimum Query (RMQ)",
        definition:
          "A data structure technique for querying the minimum value in a range [L, R], solvable in O(N) for fixed left-to-right windows using monotonic structures.",
      },
    ],
  },
  trivia: NEAREST_SMALLER_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 8",
      label: "Competitive Programmer's Handbook, Ch 8",
    },
  ],
  defaultInput: DEFAULT_NEAREST_SMALLER_INPUT,
  generateSteps: generateNearestSmallerElementSteps,
};

export default nearestSmallerElement;
