import type {
  AlgorithmStep,
  CompositeCanvasSnapshot,
  ElementState,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";
import { DEFAULT_MERGE_INTERVALS_INPUT } from "./definition";

export interface IntervalItem {
  start: number;
  end: number;
}

export interface MergeIntervalsInput {
  intervals: IntervalItem[];
}

function formatInterval(interval: IntervalItem): string {
  return `[${interval.start}, ${interval.end}]`;
}

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "An interval represents a continuous span of numerical values [start, end] along a 1D coordinate axis.",
    primarySnapshot: {
      kind: "interval",
      name: "intervals",
      axis: { min: 0, max: 20 },
      intervals: [
        { id: "i1", start: 1, end: 6, label: "[1, 6]", state: "default", track: 0 },
        { id: "i2", start: 8, end: 12, label: "[8, 12]", state: "default", track: 1 },
      ],
    },
  },
  {
    narrative:
      "The Merge Intervals problem asks us to consolidate overlapping ranges into a minimal set of disjoint intervals covering the exact same values.",
    primarySnapshot: {
      kind: "interval",
      name: "intervals",
      axis: { min: 0, max: 20 },
      intervals: [
        { id: "i1", start: 1, end: 5, label: "[1, 5]", state: "compare", track: 0 },
        { id: "i2", start: 3, end: 8, label: "[3, 8]", state: "compare", track: 1 },
      ],
    },
  },
  {
    narrative:
      "In an unsorted collection, detecting whether any two intervals overlap requires testing all candidate pairs in quadratic O(N²) time.",
    primarySnapshot: {
      kind: "interval",
      name: "intervals",
      axis: { min: 0, max: 20 },
      intervals: [
        { id: "i1", start: 10, end: 15, label: "[10, 15]", state: "active", track: 0 },
        { id: "i2", start: 2, end: 6, label: "[2, 6]", state: "compare", track: 1 },
        { id: "i3", start: 4, end: 9, label: "[4, 9]", state: "compare", track: 2 },
      ],
    },
  },
  {
    narrative:
      "By sorting intervals in ascending order of their start coordinate start_i, we align all candidate intervals from left to right.",
    primarySnapshot: {
      kind: "interval",
      name: "intervals",
      axis: { min: 0, max: 20 },
      intervals: [
        { id: "i1", start: 2, end: 6, label: "[2, 6]", state: "visited", track: 0 },
        { id: "i2", start: 4, end: 9, label: "[4, 9]", state: "visited", track: 1 },
        { id: "i3", start: 10, end: 15, label: "[10, 15]", state: "visited", track: 2 },
      ],
    },
  },
  {
    narrative:
      "Once sorted, any candidate interval can only overlap with the most recently added interval in our merged output list.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-intervals",
          role: "primary",
          snapshot: {
            kind: "interval",
            name: "intervals",
            axis: { min: 0, max: 20 },
            intervals: [
              { id: "i1", start: 2, end: 6, label: "[2, 6]", state: "visited", track: 0 },
              { id: "i2", start: 4, end: 9, label: "[4, 9]", state: "active", track: 1 },
            ],
          },
        },
        {
          id: "intro-merged",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "merged",
            mode: "box",
            elements: [
              { id: "m1", value: 2, label: "[2, 6]", state: "active", pointers: ["last"] },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Two sorted intervals [a, b] and [c, d] overlap if and only if c ≤ b, simplifying overlap verification to a single inequality comparison.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-intervals",
          role: "primary",
          snapshot: {
            kind: "interval",
            name: "intervals",
            axis: { min: 0, max: 20 },
            sweepLine: { position: 6, label: "b = 6", state: "compare" },
            intervals: [
              { id: "i1", start: 2, end: 6, label: "[2, 6]", state: "compare", track: 0 },
              { id: "i2", start: 4, end: 9, label: "[4, 9]", state: "compare", track: 1 },
            ],
          },
        },
        {
          id: "intro-merged",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "merged",
            mode: "box",
            elements: [{ id: "m1", value: 2, label: "[2, 6]", state: "compare" }],
          },
        },
      ],
    },
  },
  {
    narrative:
      "When overlapping, we merge the ranges by setting the end coordinate to max(prev.end, current.end), protecting fully nested intervals.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-intervals",
          role: "primary",
          snapshot: {
            kind: "interval",
            name: "intervals",
            axis: { min: 0, max: 20 },
            intervals: [
              { id: "i1", start: 2, end: 9, label: "Merged [2, 9]", state: "sorted", track: 0 },
            ],
          },
        },
        {
          id: "intro-merged",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "merged",
            mode: "box",
            elements: [
              { id: "m1", value: 2, label: "[2, 9]", state: "sorted", pointers: ["updated"] },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "If current.start > prev.end, a disjoint gap exists, so we seal the active block and push current as a new independent interval block.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-intervals",
          role: "primary",
          snapshot: {
            kind: "interval",
            name: "intervals",
            axis: { min: 0, max: 20 },
            sweepLine: { position: 10, label: "gap", state: "active" },
            intervals: [
              { id: "i1", start: 2, end: 9, label: "[2, 9]", state: "visited", track: 0 },
              { id: "i2", start: 12, end: 16, label: "[12, 16]", state: "active", track: 1 },
            ],
          },
        },
        {
          id: "intro-merged",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "merged",
            mode: "box",
            elements: [
              { id: "m1", value: 2, label: "[2, 9]", state: "visited" },
              { id: "m2", value: 12, label: "[12, 16]", state: "active" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "The entire process completes in O(N log N) time due to sorting, followed by a single O(N) linear sweep requiring O(N) output space.",
    primarySnapshot: {
      kind: "array",
      name: "merged",
      mode: "box",
      elements: [
        { id: "m1", value: 2, label: "[2, 9]", state: "sorted" },
        { id: "m2", value: 12, label: "[12, 16]", state: "sorted" },
      ],
    },
  },
];

export function generateMergeIntervalsSteps(input: MergeIntervalsInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIdx++, phase, narrative, primarySnapshot }));
  };

  const rawIntervals =
    Array.isArray(input?.intervals) && input.intervals.length > 0
      ? input.intervals
      : DEFAULT_MERGE_INTERVALS_INPUT.intervals;

  const isDefaultInput =
    !input ||
    (Array.isArray(input.intervals) &&
      input.intervals.length === DEFAULT_MERGE_INTERVALS_INPUT.intervals.length &&
      input.intervals[0].start === DEFAULT_MERGE_INTERVALS_INPUT.intervals[0].start &&
      input.intervals[0].end === DEFAULT_MERGE_INTERVALS_INPUT.intervals[0].end);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const sorted = rawIntervals
    .map((item) => ({ ...item }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const makeCompositeSnapshot = (
    intervalsList: IntervalItem[],
    currentIdx: number,
    mergedList: IntervalItem[],
    activeState: ElementState = "active",
    sweepPos?: number,
  ): CompositeCanvasSnapshot => {
    const minVal = Math.min(...intervalsList.map((i) => i.start), 0);
    const maxVal = Math.max(...intervalsList.map((i) => i.end), 25);

    return {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intervals-canvas",
          role: "primary",
          snapshot: {
            kind: "interval",
            name: "intervals",
            axis: { min: minVal, max: maxVal },
            sweepLine:
              sweepPos !== undefined ? { position: sweepPos, label: `pos=${sweepPos}` } : undefined,
            intervals: intervalsList.map((item, idx) => {
              let state: ElementState = "default";
              if (idx === currentIdx) {
                state = activeState;
              } else if (idx < currentIdx) {
                state = "visited";
              }
              return {
                id: `iv-${idx}-${item.start}-${item.end}`,
                start: item.start,
                end: item.end,
                label: formatInterval(item),
                state,
                track: idx,
              };
            }),
          },
        },
        {
          id: "merged-output",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "merged",
            mode: "box",
            elements: mergedList.map((m, idx) => ({
              id: `mg-${idx}-${m.start}-${m.end}`,
              value: m.start,
              label: formatInterval(m),
              state: idx === mergedList.length - 1 ? activeState : "sorted",
              pointers: idx === mergedList.length - 1 ? ["active"] : undefined,
            })),
          },
        },
      ],
    };
  };

  addStep(
    `We start with ${sorted.length} interval(s) sorted by start coordinate: ${sorted.map(formatInterval).join(", ")}.`,
    makeCompositeSnapshot(sorted, -1, []),
  );

  if (sorted.length === 0) {
    addStep("The input array is empty, returning an empty list of merged intervals.", {
      kind: "array",
      name: "merged",
      mode: "box",
      elements: [],
    });
    return steps;
  }

  const merged: IntervalItem[] = [{ ...sorted[0] }];
  addStep(
    `Initialize the merged output list with the earliest sorted interval ${formatInterval(sorted[0])}.`,
    makeCompositeSnapshot(sorted, 0, merged, "active", sorted[0].end),
  );

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = merged[merged.length - 1];

    addStep(
      `Inspect interval [${i + 1}/${sorted.length}] ${formatInterval(current)} against current active merged block ${formatInterval(prev)}.`,
      makeCompositeSnapshot(sorted, i, merged, "compare", current.start),
    );

    if (current.start <= prev.end) {
      const oldEnd = prev.end;
      prev.end = Math.max(prev.end, current.end);
      addStep(
        `Since ${current.start} ≤ ${oldEnd}, interval ${formatInterval(current)} overlaps with active block ${formatInterval({ start: prev.start, end: oldEnd })}. Extend active block end to max(${oldEnd}, ${current.end}) = ${prev.end}.`,
        makeCompositeSnapshot(sorted, i, merged, "sorted", prev.end),
      );
    } else {
      merged.push({ ...current });
      addStep(
        `Since ${current.start} > ${prev.end}, interval ${formatInterval(current)} does not overlap. Seal previous block and append ${formatInterval(current)} as a new active merged block.`,
        makeCompositeSnapshot(sorted, i, merged, "active", current.end),
      );
    }
  }

  addStep(
    `All intervals scanned! The minimal merged set contains ${merged.length} disjoint range(s): ${merged.map(formatInterval).join(", ")}.`,
    {
      kind: "array",
      name: "merged",
      mode: "box",
      elements: merged.map((m, idx) => ({
        id: `final-mg-${idx}`,
        value: m.start,
        label: formatInterval(m),
        state: "sorted",
      })),
    },
  );

  return steps;
}
