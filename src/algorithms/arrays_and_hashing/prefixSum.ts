import type {
  AlgorithmDefinition,
  AlgorithmStep,
  CompositeCanvasSnapshot,
  ElementState,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface PrefixSumInput {
  nums: number[];
}

export const PREFIX_SUM_CODE = `def prefix_sum(nums: list[int]) -> list[int]:
    n = len(nums)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]
    return prefix`;

export const DEFAULT_PREFIX_SUM_INPUT: PrefixSumInput = {
  nums: [2, 4, 1, 3, 5, 2, 6, 4],
};

export const generatePrefixSumSteps = (input: PrefixSumInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums =
    Array.isArray(input?.nums) && input.nums.length > 0
      ? input.nums
      : DEFAULT_PREFIX_SUM_INPUT.nums;
  const n = nums.length;

  const prefixValues: number[] = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefixValues[i + 1] = prefixValues[i] + nums[i];
  }

  const createConceptualSnapshot = (
    stepType:
      | "problem_start"
      | "problem_scan_b"
      | "problem_scan_c"
      | "problem_scan_done"
      | "flow_start"
      | "flow_accumulate_a"
      | "flow_accumulate_ab"
      | "flow_accumulate_abc"
      | "sentinel_intro"
      | "sentinel_boundary"
      | "subtraction_idea"
      | "subtraction_example",
  ): CompositeCanvasSnapshot => {
    if (stepType === "problem_start") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "c1", value: "A", label: "[0]", state: "default" },
                { id: "c2", value: "B", label: "[1]", state: "compare", pointers: ["L"] },
                { id: "c3", value: "C", label: "[2]", state: "compare" },
                { id: "c4", value: "D", label: "[3]", state: "compare", pointers: ["R"] },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "problem_scan_b") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "c1", value: "A", label: "[0]", state: "default" },
                {
                  id: "c2",
                  value: "B",
                  label: "[1]",
                  state: "active",
                  pointers: ["scan item 1"],
                },
                { id: "c3", value: "C", label: "[2]", state: "compare" },
                { id: "c4", value: "D", label: "[3]", state: "compare", pointers: ["R"] },
              ],
            },
          },
          {
            id: "query-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "scanner",
              mode: "box",
              elements: [
                { id: "q1", value: "B", label: "running sum = B", state: "active" },
                { id: "q2", value: "?", label: "pending C", state: "default" },
                { id: "q3", value: "?", label: "pending D", state: "default" },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "problem_scan_c") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "c1", value: "A", label: "[0]", state: "default" },
                { id: "c2", value: "B", label: "[1]", state: "visited" },
                { id: "c3", value: "C", label: "[2]", state: "active", pointers: ["scan item 2"] },
                { id: "c4", value: "D", label: "[3]", state: "compare", pointers: ["R"] },
              ],
            },
          },
          {
            id: "query-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "scanner",
              mode: "box",
              elements: [
                { id: "q1", value: "B", label: "scanned B", state: "visited" },
                { id: "q2", value: "B + C", label: "running sum = B+C", state: "active" },
                { id: "q3", value: "?", label: "pending D", state: "default" },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "problem_scan_done") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "c1", value: "A", label: "[0]", state: "default" },
                { id: "c2", value: "B", label: "[1]", state: "visited" },
                { id: "c3", value: "C", label: "[2]", state: "visited" },
                {
                  id: "c4",
                  value: "D",
                  label: "[3]",
                  state: "active",
                  pointers: ["R (scan item 3)"],
                },
              ],
            },
          },
          {
            id: "query-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "scanner",
              mode: "box",
              elements: [
                { id: "q1", value: "B", label: "scanned B", state: "visited" },
                { id: "q2", value: "C", label: "scanned C", state: "visited" },
                { id: "q3", value: "B + C + D", label: "final sum = B+C+D", state: "pivot" },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "flow_start") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-flow-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "f1", value: "A", label: "[0]", state: "default" },
                { id: "f2", value: "B", label: "[1]", state: "default" },
                { id: "f3", value: "C", label: "[2]", state: "default" },
                { id: "f4", value: "D", label: "[3]", state: "default" },
              ],
            },
          },
          {
            id: "prefix-flow-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "prefix",
              mode: "box",
              elements: [
                { id: "pf0", value: "0", label: "[0]", state: "pivot", pointers: ["ground state"] },
                { id: "pf1", value: "?", label: "[1]", state: "default" },
                { id: "pf2", value: "?", label: "[2]", state: "default" },
                { id: "pf3", value: "?", label: "[3]", state: "default" },
                { id: "pf4", value: "?", label: "[4]", state: "default" },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "flow_accumulate_a") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-flow-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "f1", value: "A", label: "[0]", state: "active", pointers: ["read item A"] },
                { id: "f2", value: "B", label: "[1]", state: "default" },
                { id: "f3", value: "C", label: "[2]", state: "default" },
                { id: "f4", value: "D", label: "[3]", state: "default" },
              ],
            },
          },
          {
            id: "prefix-flow-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "prefix",
              mode: "box",
              elements: [
                { id: "pf0", value: "0", label: "[0]", state: "visited" },
                {
                  id: "pf1",
                  value: "A",
                  label: "[1]",
                  state: "active",
                  pointers: ["prefix[1] = A"],
                },
                { id: "pf2", value: "?", label: "[2]", state: "default" },
                { id: "pf3", value: "?", label: "[3]", state: "default" },
                { id: "pf4", value: "?", label: "[4]", state: "default" },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "flow_accumulate_ab") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-flow-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "f1", value: "A", label: "[0]", state: "visited" },
                { id: "f2", value: "B", label: "[1]", state: "active", pointers: ["read item B"] },
                { id: "f3", value: "C", label: "[2]", state: "default" },
                { id: "f4", value: "D", label: "[3]", state: "default" },
              ],
            },
          },
          {
            id: "prefix-flow-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "prefix",
              mode: "box",
              elements: [
                { id: "pf0", value: "0", label: "[0]", state: "visited" },
                { id: "pf1", value: "A", label: "[1]", state: "visited" },
                {
                  id: "pf2",
                  value: "A + B",
                  label: "[2]",
                  state: "active",
                  pointers: ["prefix[2] = A + B"],
                },
                { id: "pf3", value: "?", label: "[3]", state: "default" },
                { id: "pf4", value: "?", label: "[4]", state: "default" },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "flow_accumulate_abc") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-flow-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "f1", value: "A", label: "[0]", state: "visited" },
                { id: "f2", value: "B", label: "[1]", state: "visited" },
                { id: "f3", value: "C", label: "[2]", state: "active", pointers: ["read item C"] },
                { id: "f4", value: "D", label: "[3]", state: "default" },
              ],
            },
          },
          {
            id: "prefix-flow-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "prefix",
              mode: "box",
              elements: [
                { id: "pf0", value: "0", label: "[0]", state: "visited" },
                { id: "pf1", value: "A", label: "[1]", state: "visited" },
                { id: "pf2", value: "A + B", label: "[2]", state: "visited" },
                {
                  id: "pf3",
                  value: "A + B + C",
                  label: "[3]",
                  state: "active",
                  pointers: ["prefix[3] = A + B + C"],
                },
                { id: "pf4", value: "?", label: "[4]", state: "default" },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "sentinel_intro") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-sentinel-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "s1", value: "A", label: "[0]", state: "default" },
                { id: "s2", value: "B", label: "[1]", state: "default" },
                { id: "s3", value: "C", label: "[2]", state: "default" },
              ],
            },
          },
          {
            id: "prefix-sentinel-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "prefix",
              mode: "box",
              elements: [
                {
                  id: "ps0",
                  value: "0",
                  label: "[0]",
                  state: "pivot",
                  pointers: ["ground state (0)"],
                },
                { id: "ps1", value: "A", label: "[1]", state: "sorted" },
                { id: "ps2", value: "A + B", label: "[2]", state: "sorted" },
                { id: "ps3", value: "A + B + C", label: "[3]", state: "sorted" },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "sentinel_boundary") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-sentinel-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "s1", value: "A", label: "[0]", state: "compare", pointers: ["L = 0"] },
                { id: "s2", value: "B", label: "[1]", state: "compare" },
                { id: "s3", value: "C", label: "[2]", state: "compare", pointers: ["R = 2"] },
              ],
            },
          },
          {
            id: "prefix-sentinel-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "prefix",
              mode: "box",
              elements: [
                {
                  id: "ps0",
                  value: "0",
                  label: "prefix[0]",
                  state: "pivot",
                  pointers: ["subtract prefix[0] = 0"],
                },
                { id: "ps1", value: "A", label: "[1]", state: "default" },
                { id: "ps2", value: "A + B", label: "[2]", state: "default" },
                {
                  id: "ps3",
                  value: "A + B + C",
                  label: "prefix[3]",
                  state: "active",
                  pointers: ["take prefix[3]"],
                },
              ],
            },
          },
        ],
      };
    }

    if (stepType === "subtraction_idea") {
      return {
        kind: "composite",
        layout: "vertical",
        gap: "16px",
        items: [
          {
            id: "input-sub-concept",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "nums",
              mode: "box",
              elements: [
                { id: "sub1", value: "A", label: "[0]", state: "default" },
                { id: "sub2", value: "B", label: "[1]", state: "compare", pointers: ["L = 1"] },
                { id: "sub3", value: "C", label: "[2]", state: "compare", pointers: ["R = 2"] },
              ],
            },
          },
          {
            id: "prefix-sub-concept",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "prefix",
              mode: "box",
              elements: [
                { id: "p0", value: "0", label: "[0]", state: "default" },
                {
                  id: "p1",
                  value: "P₁ (A)",
                  label: "prefix[1]",
                  state: "pivot",
                  pointers: ["left prefix (A)"],
                },
                { id: "p2", value: "P₂", label: "[2]", state: "default" },
                {
                  id: "p3",
                  value: "P₃ (A+B+C)",
                  label: "prefix[3]",
                  state: "active",
                  pointers: ["total prefix (A+B+C)"],
                },
              ],
            },
          },
        ],
      };
    }

    return {
      kind: "composite",
      layout: "vertical",
      gap: "16px",
      items: [
        {
          id: "input-sub-concept",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "sub1", value: "A", label: "[0] (stripped)", state: "default" },
              { id: "sub2", value: "B", label: "[1]", state: "active" },
              { id: "sub3", value: "C", label: "[2]", state: "active", pointers: ["result B + C"] },
            ],
          },
        },
        {
          id: "prefix-sub-concept",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "prefix",
            mode: "box",
            elements: [
              { id: "p0", value: "0", label: "[0]", state: "default" },
              { id: "p1", value: "P₁ (A)", label: "subtracted", state: "visited" },
              { id: "p2", value: "P₂", label: "[2]", state: "default" },
              {
                id: "p3",
                value: "B + C",
                label: "prefix[3] - prefix[1]",
                state: "pivot",
                pointers: ["O(1) scalar result"],
              },
            ],
          },
        },
      ],
    };
  };

  const createCompositeSnapshot = (
    activeIndex?: number,
    computingPhase?: "init" | "iter" | "compute" | "store" | "done" | "query",
    activePrefixIndex?: number,
    rangeHighlight?: { L: number; R: number },
  ): CompositeCanvasSnapshot => {
    const numsElements = nums.map((val, i) => {
      let state: ElementState = "default";
      const pointers: string[] = [];
      if (rangeHighlight && i >= rangeHighlight.L && i <= rangeHighlight.R) {
        state = "compare";
        if (i === rangeHighlight.L) pointers.push("L");
        if (i === rangeHighlight.R) pointers.push("R");
      } else if (activeIndex === i) {
        state = "active";
        pointers.push("curr");
      } else if (activeIndex !== undefined && i < activeIndex) {
        state = "visited";
      }
      return {
        id: `num-${i}`,
        value: val,
        label: `[${i}]`,
        state,
        pointers: pointers.length > 0 ? pointers : undefined,
      };
    });

    const prefixElements = Array.from({ length: n + 1 }, (_, k) => {
      let state: ElementState = "default";
      const pointers: string[] = [];
      if (rangeHighlight) {
        if (k === rangeHighlight.L) {
          state = "pivot";
          pointers.push(`prefix[${k}]`);
        } else if (k === rangeHighlight.R + 1) {
          state = "active";
          pointers.push(`prefix[${k}]`);
        }
      } else if (activePrefixIndex === k) {
        state = computingPhase === "compute" ? "compare" : "active";
        pointers.push(`prefix[${k}]`);
      } else if (activePrefixIndex !== undefined && k < activePrefixIndex) {
        state = "sorted";
      } else if (computingPhase === "done" || computingPhase === "query") {
        state = "sorted";
      }

      const val =
        k === 0 ||
        (activePrefixIndex !== undefined && k <= activePrefixIndex) ||
        computingPhase === "done" ||
        computingPhase === "query"
          ? prefixValues[k]
          : 0;

      return {
        id: `prefix-${k}`,
        value: val,
        label: `[${k}]`,
        state,
        pointers: pointers.length > 0 ? pointers : undefined,
      };
    });

    return {
      kind: "composite",
      layout: "vertical",
      gap: "20px",
      items: [
        {
          id: "input-array-row",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: numsElements,
          },
        },
        {
          id: "prefix-array-row",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "prefix",
            mode: "box",
            elements: prefixElements,
          },
        },
      ],
    };
  };

  const addStep = (narrativeParagraph: string, primarySnapshot: CompositeCanvasSnapshot) => {
    const currentStepIndex = stepIndex++;
    steps.push(
      createTutorialStep({
        stepIndex: currentStepIndex,
        phase: currentStepIndex < 12 ? "intro" : "walkthrough",
        narrative: narrativeParagraph,
        primarySnapshot,
      }),
    );
  };

  addStep(
    "Suppose we need to find the sum of subsegments across a sequence. In a naive approach, every query sum(L..R) scans items from index L to R on the fly. Doing this repeatedly costs O(N) time per request, creating a major computational bottleneck for applications handling thousands of queries.",
    createConceptualSnapshot("problem_start"),
  );

  addStep(
    "Why is on-the-fly scanning so inefficient? Consider scanning a range sum from index 1 to 3 ([B, C, D]). The scanner starts at element B, initializing running sum = B.",
    createConceptualSnapshot("problem_scan_b"),
  );

  addStep(
    "Next, the scanner moves to element C, updating the running sum to B + C.",
    createConceptualSnapshot("problem_scan_c"),
  );

  addStep(
    "Finally, the scanner visits D, completing the query sum = B + C + D. If another query asks for sum(1..4) a moment later, the CPU repeats this entire scan from scratch!",
    createConceptualSnapshot("problem_scan_done"),
  );

  addStep(
    "To eliminate redundant scanning, we use precomputation. We allocate a running total array and build accumulated sums in a single linear pass.",
    createConceptualSnapshot("flow_start"),
  );

  addStep(
    "Watch how accumulated totals build up: prefix[1] stores the first item A.",
    createConceptualSnapshot("flow_accumulate_a"),
  );

  addStep(
    "prefix[2] takes prefix[1] (which is A) and adds B to form (A + B).",
    createConceptualSnapshot("flow_accumulate_ab"),
  );

  addStep(
    "prefix[3] takes prefix[2] and adds C to form (A + B + C). By precomputing these prefix sums, we turn repetitive O(N) additions into instant lookup operations.",
    createConceptualSnapshot("flow_accumulate_abc"),
  );

  addStep(
    "Why do we place a zero at the very beginning of our cumulative lookup table? The sentinel zero (prefix[0] = 0) represents the ground state before any elements are added. This 1-based offset is the key to handling all boundary conditions seamlessly.",
    createConceptualSnapshot("sentinel_intro"),
  );

  addStep(
    "Without the sentinel zero at prefix[0] = 0, a query starting at index 0 (like sum(0..2)) would fail because there is no left prefix to subtract. With prefix[0] = 0, the formula prefix[R+1] - prefix[L] works universally for ALL queries—including L = 0—without requiring special if (L == 0) conditional branches!",
    createConceptualSnapshot("sentinel_boundary"),
  );

  addStep(
    "Once the lookup table is precomputed, how do we isolate any subsegment sum L to R? The entry prefix[R+1] holds the total sum from index 0 up to R, while prefix[L] holds the total sum before index L. Subtracting prefix[R+1] - prefix[L] strips away the unneeded left prefix and isolates the exact subsegment sum in constant time!",
    createConceptualSnapshot("subtraction_idea"),
  );

  addStep(
    "For example, to calculate sum(1..2) ([B, C]), we take prefix[3] (which contains A + B + C) and subtract prefix[1] (which contains A). (A + B + C) - (A) leaves exactly B + C! In a single O(1) scalar subtraction, we obtain the answer regardless of how large the array is.",
    createConceptualSnapshot("subtraction_example"),
  );

  addStep(
    `Now that we have thoroughly walked through the O(1) prefix sum concept, let's step through our concrete input array nums = [${nums.join(", ")}]. We allocate a prefix lookup array of size N + 1 = ${n + 1} and set prefix[0] = 0 as our zero ground state.`,
    createCompositeSnapshot(undefined, "init", 0, undefined),
  );

  for (let i = 0; i < n; i++) {
    const currentVal = nums[i];
    const prevPrefix = prefixValues[i];
    const newPrefix = prefixValues[i + 1];
    addStep(
      `We process nums[${i}] = ${currentVal}. Adding it to previous running total prefix[${i}] = ${prevPrefix} computes prefix[${i + 1}] = ${prevPrefix} + ${currentVal} = ${newPrefix}. This banks the cumulative sum of subsegment [${nums.slice(0, i + 1).join(", ")}].`,
      createCompositeSnapshot(i, "store", i + 1, undefined),
    );
  }

  addStep(
    `Our single O(N) linear pass across all ${n} elements is now complete. The full prefix lookup array is built: [${prefixValues.join(", ")}]. Precomputation is finished, and the table is ready to answer arbitrary range queries in instant O(1) time.`,
    createCompositeSnapshot(undefined, "done", n, undefined),
  );

  if (n >= 4) {
    const targetL = 1;
    const targetR = 3;
    const rangeSum = prefixValues[targetR + 1] - prefixValues[targetL];
    addStep(
      `Let's execute a range query for subsegment nums[${targetL}..${targetR}] ([${nums.slice(targetL, targetR + 1).join(", ")}]). From our precomputed table, prefix[4] = ${prefixValues[4]} contains the sum from index 0 to 3, and prefix[1] = ${prefixValues[1]} contains the sum before index 1. Subtracting prefix[4] - prefix[1] (${prefixValues[4]} - ${prefixValues[1]} = ${rangeSum}) isolates the exact subsegment sum ${rangeSum} in a single constant-time scalar operation!`,
      createCompositeSnapshot(undefined, "query", undefined, { L: targetL, R: targetR }),
    );
  }

  if (n >= 5) {
    const targetL = 0;
    const targetR = 4;
    const rangeSum = prefixValues[targetR + 1] - prefixValues[targetL];
    addStep(
      `Now let's test a query starting right at the beginning: nums[0..4] ([${nums.slice(0, 5).join(", ")}]). Using our universal formula, prefix[5] - prefix[0] (${prefixValues[5]} - 0 = ${rangeSum}) works seamlessly thanks to our sentinel zero at prefix[0] = 0!`,
      createCompositeSnapshot(undefined, "query", undefined, { L: targetL, R: targetR }),
    );
  }

  return steps;
};

const PREFIX_SUM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the function: given an array nums, computes and returns a cumulative sum array of length len(nums) + 1.",
    2: "Caches the length of nums in variable n to dictate prefix array size and loop bounds.",
    3: "Allocates the prefix array of size n + 1 initialized to zeros; prefix[0] = 0 serves as a 1-based sentinel.",
    4: "Iterates i from 0 to n - 1, processing each element of the input array in sequence.",
    5: "Computes prefix[i + 1] = prefix[i] + nums[i], accumulating the running sum in O(1) per element.",
    6: "Returns the completed prefix sum array, enabling O(1) range sum queries across any subsegment.",
  },
};

export const prefixSum: AlgorithmDefinition<PrefixSumInput> = {
  id: "prefix-sum",
  title: "Prefix Sum",
  difficulty: "Easy",
  description: `<p>Given an integer array <code>nums</code>, construct its prefix sum array to enable constant-time range sum queries.</p>
<h3>Problem Statement</h3>
<p>Given an integer array <code>nums</code>, compute a prefix sum array <code>prefix</code> of size <code>N + 1</code> where <code>prefix[0] = 0</code> and <code>prefix[i]</code> stores the sum of elements from <code>nums[0]</code> to <code>nums[i-1]</code> for <code>i &ge; 1</code>.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nums</code>: An array of integers.</li>
</ul>
<h3>Output</h3>
<p>Returns a prefix sum array of size <code>nums.length + 1</code>.</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>1 &le; nums.length &le; 10<sup>5</sup></code>.</li>
  <li><code>-10<sup>4</sup> &le; nums[i] &le; 10<sup>4</sup></code>.</li>
  <li>Handles positive, negative, and zero values.</li>
  <li>Single element array returns <code>[0, nums[0]]</code>.</li>
</ul>`,
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nums = [2, 4, 1, 3, 5, 2, 6, 4]",
      outputDisplay: "[0, 2, 6, 7, 10, 15, 17, 23, 27]",
      title: "Basic Example",
      input: { nums: [2, 4, 1, 3, 5, 2, 6, 4] },
      output: "[0, 2, 6, 7, 10, 15, 17, 23, 27]",
      explanation: "Computes prefix sums incrementally where prefix[i+1] = prefix[i] + nums[i].",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [10, -5, 20, -10, 30]",
      outputDisplay: "[0, 10, 5, 25, 15, 45]",
      title: "Complex Edge Case",
      input: { nums: [-3, 5, -2, 0, 7, -4] },
      output: "[0, -3, 2, 0, 0, 7, 3]",
      explanation:
        "Handles negative numbers and zeros, correctly updating prefix sums across signs.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [0]",
      outputDisplay: "[0, 0]",
      title: "Failing / Boundary Case",
      input: { nums: [0] },
      output: "[0, 0]",
      explanation: "Single zero element yields a minimal 2-element prefix array [0, 0].",
    },
  ],
  code: PREFIX_SUM_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "Single pass over input array nums. Each element performs one addition to compute prefix[i+1], resulting in O(n) precomputation time.",
    space: "Allocates an extra prefix sum array of size n + 1, requiring O(n) auxiliary space.",
  },
  topicGuide: {
    overview:
      "<p>Prefix Sum is a foundational precomputation technique that converts <code>O(N)</code> range sum queries into <code>O(1)</code> scalar subtractions. In production software engineering, prefix sums power 2D integral images in computer vision (Box Blurs, Viola-Jones face detection), causal mask cumulative sequence lengths in LLM serving (FlashAttention, vLLM continuous batching), and cumulative distribution function (CDF) sampling in Monte Carlo simulations.</p>",
    sections: [
      {
        heading: "Core Concept & Mathematical Principle",
        body: "<p>The core formula <code>prefix[i] = sum(nums[0 &hellip; i-1])</code> creates a cumulative sequence. The sum of elements between 0-indexed bounds <code>L</code> and <code>R</code> inclusive is computed in <code>O(1)</code> time as <code>prefix[R + 1] - prefix[L]</code>. This eliminates repetitive loop scans.</p>",
      },
      {
        heading: "Systems & Performance Impact: LLM KV-Cache & Image Processing",
        body: "<p>In LLM inference engines like vLLM and TensorRT-LLM, prefix sums calculate total sequence lengths across batched inputs to dynamically allocate GPU memory for KV-caches. In computer vision, 2D Summed-Area Tables (Integral Images) compute box filter convolutions over arbitrary rectangular regions in <code>O(1)</code> operations.</p>",
      },
      {
        heading: "Implementation Nuances & 1-Based Offset Sentinel",
        body: "<p>Allocating the prefix array with size <code>N + 1</code> and setting <code>prefix[0] = 0</code> provides a sentinel value. This eliminates special-case branching when querying ranges starting at index 0 (<code>L = 0</code>), avoiding off-by-one errors and simplifying range queries.</p>",
      },
      {
        heading: "Edge Case & Boundary Analysis",
        body: "<p>For <code>N = 0</code> or <code>N = 1</code>, the sentinel <code>prefix[0] = 0</code> prevents out-of-bound memory reads. With large integers, prefix sums can overflow 32-bit signed integer storage, requiring 64-bit wide buffers (<code>int64_t</code>).</p>",
      },
    ],
    keyTerms: [
      {
        term: "Precomputation",
        definition:
          "Performing upfront calculation to store results, enabling subsequent queries to execute in O(1) time.",
      },
      {
        term: "Integral Image / Summed-Area Table",
        definition:
          "A 2D generalization of prefix sums used in image processing to compute sub-grid sums in constant time.",
      },
      {
        term: "Sentinel Value",
        definition:
          "A dummy value (such as prefix[0] = 0) placed at the beginning of a data structure to simplify boundary conditions.",
      },
    ],
  },
  topicIds: ["arrays_and_hashing"],
  trivia: PREFIX_SUM_TRIVIA,
  leetcode: {
    id: 303,
    url: "https://leetcode.com/problems/range-sum-query-immutable/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #303",
      leetcodeId: 303,
      url: "https://leetcode.com/problems/range-sum-query-immutable/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 9",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.1 Static array queries",
    },
  ],
  defaultInput: DEFAULT_PREFIX_SUM_INPUT,
  generateSteps: generatePrefixSumSteps,
};
