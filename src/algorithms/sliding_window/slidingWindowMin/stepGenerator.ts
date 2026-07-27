import type { AlgorithmStep, ArrayElement } from "../../../types/dsa";

export interface SlidingWindowMinInput {
  nums: number[];
  k: number;
}

export const generateSlidingWindowMinSteps = (input: SlidingWindowMinInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums = input.nums;
  const k = input.k;
  const n = nums.length;

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
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        queue: deque.map((idx) => `idx:${idx}(val:${nums[idx]})`),
        visited: [...result],
        customState: {
          windowSize: k,
          dequeIndices: deque.join(", "),
          result: result.join(", "),
        },
      },
      variables,
    });
  };

  addStep(
    3,
    "Set up the sliding window minimum",
    `We want the smallest value in every window of ${k} consecutive elements of [${nums.join(", ")}]. A deque of indices will let us answer each window without rescanning it.`,
    { k, length: n },
  );

  addStep(
    4,
    "Create the result list and deque",
    "We start with an empty result list and an empty deque. The deque will hold indices whose values stay in increasing order, so each window's minimum is always waiting at the front.",
    { k, dequeSize: 0, resultSize: 0 },
  );

  for (let i = 0; i < n; i++) {
    const currentVal = nums[i];

    const windowStart = Math.max(0, i - k + 1);
    for (let idx = 0; idx < n; idx++) {
      if (idx >= windowStart && idx <= i) {
        elements[idx].state = idx === i ? "active" : "queued";
      } else if (idx < windowStart) {
        elements[idx].state = "visited";
      } else {
        elements[idx].state = "default";
      }
      elements[idx].pointers = undefined;
    }

    elements[i].pointers = ["i"];
    if (i >= k - 1) {
      elements[windowStart].pointers = elements[windowStart].pointers
        ? ["L", ...elements[windowStart].pointers]
        : ["L"];
    }

    addStep(
      7,
      `Look at nums[${i}] = ${currentVal}`,
      `We slide the right edge to index ${i}, so the window in play is [${windowStart}..${i}] holding [${nums.slice(windowStart, i + 1).join(", ")}]. Now we update the deque to reflect it.`,
      { i, "nums[i]": currentVal, windowStart, k },
    );

    let removedOut = false;
    while (deque.length > 0 && deque[0] <= i - k) {
      const removedIdx = deque.shift();
      if (removedIdx !== undefined) {
        removedOut = true;
        addStep(
          9,
          `Evict index ${removedIdx} — it left the window`,
          `Index ${removedIdx} now sits outside the window's left edge, so its value can no longer be a candidate. We pop it off the front of the deque.`,
          { i, removedIdx },
        );
      }
    }

    if (!removedOut && deque.length > 0) {
      addStep(
        8,
        "Confirm the deque front still fits",
        `The front index ${deque[0]} is still inside the window, so its value remains a legitimate minimum candidate. Nothing to evict this round.`,
        { i, dequeFront: deque[0] },
      );
    }

    while (deque.length > 0 && nums[deque[deque.length - 1]] >= currentVal) {
      const poppedIdx = deque.pop();
      if (poppedIdx !== undefined) {
        addStep(
          12,
          `Pop index ${poppedIdx} from the back`,
          `nums[${poppedIdx}] = ${nums[poppedIdx]} is at least as big as the new value ${currentVal}, and ${currentVal} will outlive it in the window. The older value can never be a minimum again, so we discard it.`,
          { i, poppedIdx, "nums[popped]": nums[poppedIdx] },
        );
      }
    }

    deque.push(i);

    addStep(
      14,
      `Push index ${i} onto the deque`,
      `With everything bigger cleared out, index ${i} (value ${currentVal}) takes its place at the back. The deque's values now read [${deque.map((idx) => nums[idx]).join(", ")}] — still increasing from front to back.`,
      { i, dequeState: deque.join(", ") },
    );

    if (i >= k - 1) {
      const minIdx = deque[0];
      const minVal = nums[minIdx];
      result.push(minVal);

      elements[minIdx].state = "sorted";

      addStep(
        17,
        `Record ${minVal} as this window's minimum`,
        `The window [${windowStart}..${i}] is full, and the deque's front — index ${minIdx} — holds its smallest value, ${minVal}. We append it to the result without rescanning the window.`,
        { windowStart, windowEnd: i, minVal, result: result.join(", ") },
      );
    }
  }

  addStep(
    19,
    "Return the list of minimums",
    `Every window of size ${k} has been answered: [${result.join(", ")}]. Each index entered and left the deque at most once, which is why the whole run stayed linear.`,
    { result: result.join(", ") },
  );

  return steps;
};
