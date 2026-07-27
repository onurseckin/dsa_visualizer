import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";

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

function createIntervalArrayElements(
  intervals: IntervalItem[],
  currentIdx: number = -1,
  activeState: ElementState = "active",
): ArrayElement[] {
  return intervals.map((item, idx) => {
    let state: ElementState = "default";
    const pointers: string[] = [formatInterval(item)];

    if (idx === currentIdx) {
      state = activeState;
      pointers.push("curr");
    }

    return {
      id: `interval-${idx}-${item.start}-${item.end}`,
      value: item.start,
      state,
      pointers,
    };
  });
}

export function generateMergeIntervalsSteps(input: MergeIntervalsInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const rawIntervals = input?.intervals || [];

  let stepIdx = 0;

  // Line 1: Function entry
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Function call: merge with ${rawIntervals.length} interval(s)`,
      why: "Our objective is to merge overlapping intervals into a minimal disjoint set.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createIntervalArrayElements(rawIntervals),
    },
    auxiliaryState: {
      customState: {
        totalInputIntervals: rawIntervals.length,
        status: "Function entry",
      },
    },
    variables: { totalIntervals: rawIntervals.length },
  });

  // Line 2: Empty input check
  if (rawIntervals.length === 0) {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 2,
      explanation: {
        what: "Evaluate `if not intervals:` -> True (empty input)",
        why: "Input list is empty, so we skip sorting and proceed to return an empty array.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: {
        customState: { merged: "[]" },
      },
      variables: { totalIntervals: 0 },
    });

    // Line 3: Return empty list
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 3,
      explanation: {
        what: "Return empty list `[]`",
        why: "There are no intervals to process, returning empty output immediately.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: {
        customState: { merged: "[]" },
      },
      variables: { totalIntervals: 0 },
    });

    return steps;
  }

  // Line 2: Empty check evaluates to false
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Evaluate \`if not intervals:\` -> False (${rawIntervals.length} interval(s) present)`,
      why: "Input is non-empty, so we proceed to sort intervals by start time.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createIntervalArrayElements(rawIntervals),
    },
    auxiliaryState: {
      customState: { totalInputIntervals: rawIntervals.length },
    },
    variables: { totalIntervals: rawIntervals.length },
  });

  // Line 4: Sort intervals by start time
  const intervals = rawIntervals.map((item) => ({ ...item })).sort((a, b) => a.start - b.start || a.end - b.end);

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Execute \`intervals.sort(key=lambda x: x[0])\` on ${intervals.length} intervals`,
      why: "Sorting by start time guarantees that any intervals capable of overlapping will appear contiguously in sequence.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createIntervalArrayElements(intervals),
    },
    auxiliaryState: {
      customState: {
        sortedIntervals: intervals.map(formatInterval).join(", "),
        merged: "[]",
      },
    },
    variables: {
      count: intervals.length,
      sorted: true,
    },
  });

  // Line 5: Initialize merged array with first interval
  const merged: IntervalItem[] = [{ ...intervals[0] }];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 5,
    explanation: {
      what: `Initialize \`merged = [intervals[0]]\` with first sorted interval ${formatInterval(intervals[0])}`,
      why: "Seed our merged accumulator with the earliest-starting interval as the active open block.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createIntervalArrayElements(intervals, 0, "queued"),
    },
    auxiliaryState: {
      customState: {
        merged: merged.map(formatInterval).join(", "),
        lastMerged: formatInterval(merged[merged.length - 1]),
      },
    },
    variables: {
      mergedCount: merged.length,
    },
  });

  // Line 6: Loop through remaining intervals
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];

    // Line 6: Loop header
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 6,
      explanation: {
        what: `Loop iteration ${i}/${intervals.length - 1}: fetch current interval ${formatInterval(current)}`,
        why: "Retrieve the next interval from sorted array to compare against the active open block.",
      },
      primarySnapshot: {
        kind: "array",
        elements: createIntervalArrayElements(intervals, i, "active"),
      },
      auxiliaryState: {
        customState: {
          status: `Processing interval ${i}`,
          current: formatInterval(current),
          merged: merged.map(formatInterval).join(", "),
        },
      },
      variables: {
        i,
        currentStart: current.start,
        currentEnd: current.end,
      },
    });

    const prev = merged[merged.length - 1];

    // Line 7: Get last merged interval
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 7,
      explanation: {
        what: `Retrieve last merged interval: \`prev = merged[-1]\` -> ${formatInterval(prev)}`,
        why: "Because intervals are sorted by start time, we only need to compare against the last block in our merged list.",
      },
      primarySnapshot: {
        kind: "array",
        elements: createIntervalArrayElements(intervals, i, "compare"),
      },
      auxiliaryState: {
        customState: {
          prevBlock: formatInterval(prev),
          current: formatInterval(current),
          merged: merged.map(formatInterval).join(", "),
        },
      },
      variables: {
        prevStart: prev.start,
        prevEnd: prev.end,
      },
    });

    const overlaps = current.start <= prev.end;

    // Line 8: Check overlap condition
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 8,
      explanation: {
        what: `Evaluate \`current[0] <= prev[1]\`: (${current.start} <= ${prev.end}) -> ${overlaps ? "TRUE" : "FALSE"}`,
        why: overlaps
          ? `Interval ${formatInterval(current)} starts at ${current.start}, which is <= active block end ${prev.end}. Overlap detected!`
          : `Interval ${formatInterval(current)} starts at ${current.start}, which is > active block end ${prev.end}. No overlap (gap)!`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createIntervalArrayElements(intervals, i, overlaps ? "swap" : "active"),
      },
      auxiliaryState: {
        customState: {
          overlapCondition: `${current.start} <= ${prev.end}`,
          overlaps: overlaps ? "True" : "False",
          merged: merged.map(formatInterval).join(", "),
        },
      },
      variables: {
        overlaps,
        currentStart: current.start,
        prevEnd: prev.end,
      },
    });

    if (overlaps) {
      const oldEnd = prev.end;
      prev.end = Math.max(prev.end, current.end);

      // Line 9: Update prev[1] with max
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 9,
        explanation: {
          what: `Update \`prev[1] = max(${oldEnd}, ${current.end})\` -> ${prev.end}`,
          why: `Extend active block end to ${prev.end}. Using max() prevents nested/shorter sub-intervals from shrinking the block.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: createIntervalArrayElements(intervals, i, "sorted"),
        },
        auxiliaryState: {
          customState: {
            status: "Merged overlapping block",
            updatedBlock: formatInterval(prev),
            merged: merged.map(formatInterval).join(", "),
          },
        },
        variables: {
          oldEnd,
          newEnd: prev.end,
          mergedCount: merged.length,
        },
      });
    } else {
      // Line 10: else branch taken
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 10,
        explanation: {
          what: `Execute \`else:\` branch (no overlap with active block ${formatInterval(prev)})`,
          why: "Previous block is complete and sealed off. The current interval starts a new disjoint block.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createIntervalArrayElements(intervals, i, "active"),
        },
        auxiliaryState: {
          customState: {
            status: "No overlap - branching to append",
            current: formatInterval(current),
            merged: merged.map(formatInterval).join(", "),
          },
        },
        variables: {
          mergedCount: merged.length,
        },
      });

      merged.push({ ...current });

      // Line 11: append current
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 11,
        explanation: {
          what: `Execute \`merged.append(${formatInterval(current)})\``,
          why: `Append new non-overlapping block ${formatInterval(current)} to merged list. Total merged blocks: ${merged.length}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: createIntervalArrayElements(intervals, i, "sorted"),
        },
        auxiliaryState: {
          customState: {
            status: "Appended new interval block",
            newBlock: formatInterval(current),
            merged: merged.map(formatInterval).join(", "),
          },
        },
        variables: {
          mergedCount: merged.length,
        },
      });
    }
  }

  // Line 12: Return merged list
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 12,
    explanation: {
      what: `Return \`merged\` list with ${merged.length} disjoint interval(s)`,
      why: `Finished linear pass. Merged result contains non-overlapping intervals: ${merged.map(formatInterval).join(", ")}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: intervals.map((item, idx) => ({
        id: `interval-final-${idx}`,
        value: item.start,
        state: "sorted",
        pointers: [formatInterval(item)],
      })),
    },
    auxiliaryState: {
      customState: {
        mergedResult: merged.map(formatInterval).join(", "),
      },
    },
    variables: {
      finalMergedCount: merged.length,
      completed: true,
    },
  });

  return steps;
}
