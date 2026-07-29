import type {
  AlgorithmStep,
  ArrayElement,
  CompositeCanvasSnapshot,
  ElementState,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface SlidingWindowMinInput {
  nums: number[];
  k: number;
}

export const DEFAULT_SLIDING_WINDOW_MIN_INPUT: SlidingWindowMinInput = {
  nums: [4, 2, 12, 11, 5, 8, 3, 9],
  k: 3,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Sliding Window Minimum problem asks us to compute the minimum element in every contiguous sub-window of size k as it slides across an array from left to right.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 4, label: "[0]", state: "active" },
        { id: "c2", value: 2, label: "[1]", state: "active" },
        { id: "c3", value: 12, label: "[2]", state: "active" },
        { id: "c4", value: 11, label: "[3]", state: "default" },
        { id: "c5", value: 5, label: "[4]", state: "default" },
        { id: "c6", value: 8, label: "[5]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "A naive approach rescans all k elements for every window, taking O(N · k) time; a min-heap takes O(N log k) time. A monotonic double-ended queue (deque) optimizes this to optimal O(N) linear time.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 4, label: "[0]", state: "compare" },
        { id: "c2", value: 2, label: "[1]", state: "sorted", pointers: ["MIN"] },
        { id: "c3", value: 12, label: "[2]", state: "compare" },
        { id: "c4", value: 11, label: "[3]", state: "default" },
        { id: "c5", value: 5, label: "[4]", state: "default" },
        { id: "c6", value: 8, label: "[5]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "The Domination Principle states that if index i < j belong to the current window and nums[i] ≥ nums[j], then nums[i] can NEVER be the minimum in any future window containing j because nums[j] is smaller and survives longer.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 4, label: "[0]", state: "visited", pointers: ["dominated"] },
        { id: "c2", value: 2, label: "[1]", state: "active", pointers: ["smaller & newer"] },
        { id: "c3", value: 12, label: "[2]", state: "default" },
        { id: "c4", value: 11, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "We maintain a double-ended queue (deque) storing indices whose values strictly increase from front to back: nums[dq[0]] < nums[dq[1]] < ... < nums[dq[-1]].",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-arr",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 4, label: "[0]", state: "visited" },
              { id: "c2", value: 2, label: "[1]", state: "sorted", pointers: ["dq[0]"] },
              { id: "c3", value: 12, label: "[2]", state: "active", pointers: ["dq[1]"] },
              { id: "c4", value: 11, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-dq",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "deque",
            mode: "box",
            elements: [
              { id: "dq-0", value: 2, label: "i:1", state: "sorted" },
              { id: "dq-1", value: 12, label: "i:2", state: "default" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "The front of the deque (dq[0]) is ALWAYS guaranteed to contain the index of the minimum element for the current active sliding window in O(1) time.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-arr",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 4, label: "[0]", state: "visited" },
              { id: "c2", value: 2, label: "[1]", state: "sorted", pointers: ["MIN"] },
              { id: "c3", value: 12, label: "[2]", state: "active" },
              { id: "c4", value: 11, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-dq",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "deque",
            mode: "box",
            elements: [
              { id: "dq-0", value: 2, label: "i:1", state: "sorted" },
              { id: "dq-1", value: 12, label: "i:2", state: "default" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Front Eviction: as the window slides rightward, if the front index dq[0] falls behind the left window boundary (dq[0] ≤ i - k), it has expired and is popped via popleft().",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-arr",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 4, label: "[0]", state: "visited", pointers: ["expired"] },
              { id: "c2", value: 2, label: "[1]", state: "active", pointers: ["left"] },
              { id: "c3", value: 12, label: "[2]", state: "active" },
              { id: "c4", value: 11, label: "[3]", state: "active", pointers: ["right"] },
            ],
          },
        },
        {
          id: "intro-dq",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "deque",
            mode: "box",
            elements: [
              { id: "dq-0", value: 2, label: "i:1", state: "sorted" },
              { id: "dq-1", value: 12, label: "i:2", state: "default" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Back Eviction: when a new index i arrives, we pop indices from the back of the deque while nums[dq[-1]] ≥ nums[i] before appending index i to maintain monotonic ordering.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-arr",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 4, label: "[0]", state: "visited" },
              { id: "c2", value: 2, label: "[1]", state: "visited" },
              { id: "c3", value: 3, label: "[2]", state: "visited" },
              { id: "c4", value: 7, label: "[3]", state: "visited" },
              { id: "c5", value: 5, label: "[4]", state: "active", pointers: ["N steps"] },
            ],
          },
        },
        {
          id: "intro-dq",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "deque",
            mode: "box",
            elements: [
              { id: "dq-0", value: 2, label: "i:1", state: "sorted" },
              { id: "dq-1", value: 5, label: "i:4", state: "default" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Because every index is pushed onto the deque exactly once and popped at most once, total operations across N steps are bounded by 2N, achieving O(N) time and O(k) space.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-arr",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 4, label: "[0]", state: "sorted" },
              { id: "c2", value: 2, label: "[1]", state: "sorted" },
              { id: "c3", value: 12, label: "[2]", state: "sorted" },
              { id: "c4", value: 11, label: "[3]", state: "sorted" },
              { id: "c5", value: 5, label: "[4]", state: "sorted" },
            ],
          },
        },
        {
          id: "intro-dq",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "deque",
            mode: "box",
            elements: [
              { id: "dq-0", value: 2, label: "i:1", state: "sorted" },
              { id: "dq-1", value: 5, label: "i:4", state: "default" },
            ],
          },
        },
      ],
    },
  },
];

export const generateSlidingWindowMinSteps = (input: SlidingWindowMinInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums =
    Array.isArray(input?.nums) && input.nums.length > 0
      ? input.nums
      : DEFAULT_SLIDING_WINDOW_MIN_INPUT.nums;
  const k =
    typeof input?.k === "number" && input.k > 0 ? input.k : DEFAULT_SLIDING_WINDOW_MIN_INPUT.k;
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
      input.nums.length === DEFAULT_SLIDING_WINDOW_MIN_INPUT.nums.length &&
      input.k === DEFAULT_SLIDING_WINDOW_MIN_INPUT.k &&
      input.nums.every((val, idx) => val === DEFAULT_SLIDING_WINDOW_MIN_INPUT.nums[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const deque: number[] = [];
  const result: number[] = [];

  const makeComposite = (
    currentI?: number,
    windowStart?: number,
    highlightIdx?: number,
    highlightState: ElementState = "compare",
  ): CompositeCanvasSnapshot => {
    const arrayElements: ArrayElement[] = nums.map((val, idx) => {
      const ptrs: string[] = [];
      if (idx === currentI) ptrs.push("i");
      if (deque.length > 0 && deque[0] === idx && windowStart !== undefined && idx >= windowStart) {
        ptrs.push("MIN");
      } else if (deque.includes(idx)) {
        ptrs.push("dq");
      }

      let state: ArrayElement["state"] = "default";
      if (idx === highlightIdx) {
        state = highlightState;
      } else if (deque.length > 0 && deque[0] === idx && windowStart !== undefined && idx >= windowStart) {
        state = "sorted";
      } else if (windowStart !== undefined && currentI !== undefined && idx >= windowStart && idx <= currentI) {
        state = "active";
      } else if (windowStart !== undefined && idx < windowStart) {
        state = "visited";
      }

      return {
        id: `el-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });

    return {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "win-arr",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: arrayElements,
          },
        },
        {
          id: "win-dq",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "deque",
            mode: "box",
            elements: deque.map((idx, pos) => ({
              id: `dq-${pos}`,
              value: nums[idx],
              label: `i:${idx}`,
              state: pos === 0 ? "sorted" : "default",
            })),
          },
        },
      ],
    };
  };

  if (n === 0) {
    addStep(
      "The input array is empty, so no sliding window minimums can be calculated; returning empty result [].",
      {
        kind: "array",
        name: "nums",
        mode: "box",
        elements: [],
      },
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected input array of ${n} elements with sliding window size k = ${k}.`,
    makeComposite(),
  );

  for (let i = 0; i < n; i++) {
    const currentVal = nums[i];
    const windowStart = Math.max(0, i - k + 1);

    addStep(
      `Inspect index ${i} (nums[${i}] = ${currentVal}): active sliding window is [${windowStart} ... ${i}].`,
      makeComposite(i, windowStart, i, "compare"),
    );

    if (deque.length > 0 && deque[0] <= i - k) {
      const expiredIdx = deque.shift()!;
      addStep(
        `Front index dq[0] = ${expiredIdx} (value ${nums[expiredIdx]}) has fallen behind window left edge (${i - k}); evicting expired front index from deque.`,
        makeComposite(i, windowStart, expiredIdx, "visited"),
      );
    }

    while (deque.length > 0 && nums[deque[deque.length - 1]] >= currentVal) {
      const poppedIdx = deque.pop()!;
      addStep(
        `Back index dq[-1] = ${poppedIdx} has value ${nums[poppedIdx]} ≥ current value ${currentVal}; by Domination Principle, pop ${poppedIdx} from back of deque.`,
        makeComposite(i, windowStart, poppedIdx, "swap"),
      );
    }

    deque.push(i);
    addStep(
      `Append current index ${i} (value ${currentVal}) to back of deque to maintain monotonically increasing candidate values.`,
      makeComposite(i, windowStart, i, "active"),
    );

    if (i >= k - 1) {
      const minIdx = deque[0];
      const minVal = nums[minIdx];
      result.push(minVal);
      addStep(
        `Window [${windowStart} ... ${i}] is full (size ${k}): front of deque dq[0] = ${minIdx} gives window minimum = ${minVal}. Append ${minVal} to result list.`,
        makeComposite(i, windowStart, i, "sorted"),
      );
    }
  }

  addStep(
    `Sliding Window Minimum complete! Processed all ${n - k + 1} windows of size ${k}, yielding minimums list: [${result.join(", ")}].`,
    makeComposite(undefined, n - k, deque[0], "sorted"),
  );

  return steps;
};

export default generateSlidingWindowMinSteps;
