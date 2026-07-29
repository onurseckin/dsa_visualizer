import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";

const DEFAULT_SLIDING_WINDOW_MIN_INPUT = {
  nums: [1, 3, -1, -3, 5, 3, 6, 7],
  k: 3,
};

export interface SlidingWindowMinInput {
  nums: number[];
  k: number;
}

export const generateSlidingWindowMinSteps = (input: SlidingWindowMinInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums =
    Array.isArray(input?.nums) && input.nums.length > 0
      ? input.nums
      : DEFAULT_SLIDING_WINDOW_MIN_INPUT.nums;
  const k =
    typeof input?.k === "number" && input.k > 0 ? input.k : DEFAULT_SLIDING_WINDOW_MIN_INPUT.k;

  const elements: ArrayElement[] = nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const deque: number[] = [];
  const result: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    windowRange?: { start: number; end: number },
  ) => {
    const dequeValues = deque.map((idx) => nums[idx]);

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el, idx) => {
          let st: ElementState = "default";
          const ptrs: string[] = [];

          if (windowRange && idx >= windowRange.start && idx <= windowRange.end) {
            st = "active";
          }
          if (deque.includes(idx)) {
            ptrs.push("deque");
            if (deque[0] === idx && windowRange && idx >= windowRange.start) {
              st = "sorted";
              ptrs.push("MIN");
            }
          }
          if (windowRange && idx === windowRange.end) {
            ptrs.push("i");
          }

          return {
            ...el,
            state: st,
            pointers: ptrs.length > 0 ? ptrs : undefined,
          };
        }),
      },
      auxiliaryState: {
        queue: deque.map((idx) => `idx:${idx}(val:${nums[idx]})`),
        visited: [...result],
        customState: {
          windowSize: String(k),
          dequeIndices: deque.join(", "),
          dequeValues: dequeValues.join(", "),
          result: result.join(", "),
        },
      },
      variables: {
        ...variables,
        k,
        deque: deque.join(", "),
        result: result.join(", "),
      },
    });
  };

  addStep(
    3,
    "Set up the sliding window minimum",
    `We track the minimum value in every window of ${k} consecutive elements using a monotonic double-ended queue (deque) of candidate indices to eliminate redundant re-scans.`,
    { n: nums.length },
  );

  addStep(
    4,
    "Initialize result list",
    "Allocating an array to collect the minimum value of each sliding window as the window slides rightward.",
    { n: nums.length },
  );

  addStep(
    5,
    "Initialize monotonic deque",
    "Creating an empty double-ended queue. The deque maintains candidate indices whose values strictly increase from front to back, guaranteeing that the current window minimum is always accessible at the front in O(1) time.",
    { n: nums.length },
  );

  for (let i = 0; i < nums.length; i++) {
    const currentVal = nums[i];
    const windowStart = Math.max(0, i - k + 1);
    const windowRange = { start: windowStart, end: i };

    addStep(
      7,
      `Inspect Element at Index ${i}`,
      `Sliding the right window edge to index ${i} (value ${currentVal}) covers the subsegment [${windowStart}..${i}].`,
      { i, currentVal, windowStart },
      windowRange,
    );

    addStep(
      8,
      "Check Window Expiry Threshold",
      deque.length > 0
        ? `Evaluating whether front index ${deque[0]} has fallen out of the active window boundary (index <= ${i - k}).`
        : "Deque is empty, no expired front index to remove.",
      { i, currentVal, frontIdx: deque[0] ?? -1, expiredThreshold: i - k },
      windowRange,
    );

    if (deque.length > 0 && deque[0] <= i - k) {
      const removedIdx = deque.shift()!;
      addStep(
        9,
        "Evict Expired Index from Front",
        `Index ${removedIdx} has slid past the left edge of the window. It can no longer serve as a candidate minimum, so it is popped from the front of the deque.`,
        { i, currentVal, removedIdx, removedVal: nums[removedIdx] },
        windowRange,
      );
    }

    addStep(
      11,
      "Check Domination Principle for New Element",
      deque.length > 0
        ? `Comparing back element nums[${deque[deque.length - 1]}] = ${nums[deque[deque.length - 1]]} against incoming value ${currentVal}.`
        : "Deque is empty, no back element to check for domination.",
      {
        i,
        currentVal,
        backIdx: deque[deque.length - 1] ?? -1,
        backVal: deque.length > 0 ? nums[deque[deque.length - 1]] : -1,
      },
      windowRange,
    );

    while (deque.length > 0 && nums[deque[deque.length - 1]] >= currentVal) {
      const poppedIdx = deque.pop()!;
      addStep(
        12,
        "Pop Dominated Index from Back",
        `The older element at index ${poppedIdx} (value ${nums[poppedIdx]}) is >= the new value ${currentVal}, and ${currentVal} will outlive it in future windows. The older element is permanently dominated and discarded.`,
        { i, currentVal, poppedIdx, poppedVal: nums[poppedIdx] },
        windowRange,
      );

      addStep(
        11,
        "Check Domination Principle for New Element",
        deque.length > 0
          ? `Comparing new back element nums[${deque[deque.length - 1]}] = ${nums[deque[deque.length - 1]]} against incoming value ${currentVal}.`
          : "Deque is empty, no back element remaining.",
        {
          i,
          currentVal,
          backIdx: deque[deque.length - 1] ?? -1,
          backVal: deque.length > 0 ? nums[deque[deque.length - 1]] : -1,
        },
        windowRange,
      );
    }

    deque.push(i);
    addStep(
      14,
      `Push Index ${i} onto Monotonic Deque`,
      `With all dominated larger elements evicted from the back, index ${i} (value ${currentVal}) is appended, preserving monotonic increasing order.`,
      { i, currentVal },
      windowRange,
    );

    addStep(
      16,
      "Evaluate Window Maturity (i >= k - 1)",
      i >= k - 1
        ? `The window has reached full size ${k}, so the front of the deque holds the guaranteed minimum.`
        : `The sliding window is still filling up (${i + 1}/${k} elements).`,
      { i, k, isFullWindow: i >= k - 1 },
      windowRange,
    );

    if (i >= k - 1) {
      const minIdx = deque[0];
      const minVal = nums[minIdx];
      result.push(minVal);
      addStep(
        17,
        `Record Window Minimum = ${minVal}`,
        `The front index ${minIdx} in the monotonic deque holds the smallest value ${minVal} in the current window [${windowStart}..${i}]. We bank it in the result list.`,
        { i, minIdx, minVal },
        windowRange,
      );
    }
  }

  addStep(
    19,
    "Return the list of minimums",
    "Completed sliding window scan across all windows. Each index was pushed once and popped at most once, achieving optimal linear O(N) overall runtime.",
    { totalWindows: result.length },
  );

  return steps;
};
