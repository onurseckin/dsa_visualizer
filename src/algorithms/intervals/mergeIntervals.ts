import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

export interface IntervalItem {
  start: number;
  end: number;
}

export interface MergeIntervalsInput {
  intervals: IntervalItem[];
}

export const DEFAULT_MERGE_INTERVALS_INPUT: MergeIntervalsInput = {
  intervals: [
    { start: 1, end: 3 },
    { start: 2, end: 6 },
    { start: 8, end: 10 },
    { start: 15, end: 18 },
  ],
};

function formatInterval(interval: IntervalItem): string {
  return `[${interval.start}, ${interval.end}]`;
}

function createIntervalArrayElements(
  intervals: IntervalItem[],
  currentIdx: number = -1,
  activeState: ElementState = 'active'
): ArrayElement[] {
  return intervals.map((item, idx) => {
    let state: ElementState = 'default';
    const pointers: string[] = [formatInterval(item)];

    if (idx === currentIdx) {
      state = activeState;
      pointers.push('curr');
    }

    return {
      id: `interval-${idx}-${item.start}-${item.end}`,
      value: item.start,
      state,
      pointers,
    };
  });
}

export function generateMergeIntervalsSteps(
  input: MergeIntervalsInput
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const rawIntervals = input.intervals || [];

  if (rawIntervals.length === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: 'Return an empty result',
        why: 'There are no intervals to merge, so we simply hand back an empty list.',
      },
      primarySnapshot: {
        kind: 'array',
        elements: [],
      },
      auxiliaryState: {
        customState: { merged: '[]' },
      },
      variables: { totalIntervals: 0 },
    });
    return steps;
  }

  const intervals = rawIntervals
    .map((item) => ({ ...item }))
    .sort((a, b) => a.start - b.start);
  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Sort ${intervals.length} intervals by start`,
      why: 'We sort by start time so that any two intervals that overlap end up next to each other. That lets us merge everything in one left-to-right walk.',
    },
    primarySnapshot: {
      kind: 'array',
      elements: createIntervalArrayElements(intervals),
    },
    auxiliaryState: {
      customState: {
        intervals: intervals.map(formatInterval).join(', '),
        merged: '[]',
      },
    },
    variables: {
      count: intervals.length,
      sorted: true,
    },
  });

  const merged: IntervalItem[] = [{ ...intervals[0] }];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 5,
    explanation: {
      what: `Start merged list with ${formatInterval(intervals[0])}`,
      why: 'We take the first sorted interval as our running interval — every later interval will either stretch it or start a fresh one.',
    },
    primarySnapshot: {
      kind: 'array',
      elements: createIntervalArrayElements(intervals, 0, 'queued'),
    },
    auxiliaryState: {
      customState: {
        merged: merged.map(formatInterval).join(', '),
        lastMerged: formatInterval(merged[merged.length - 1]),
      },
    },
    variables: {
      mergedCount: merged.length,
    },
  });

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const prev = merged[merged.length - 1];

    if (current.start <= prev.end) {
      const oldEnd = prev.end;
      prev.end = Math.max(prev.end, current.end);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 9,
        explanation: {
          what: `Merge overlapping interval ${formatInterval(current)}`,
          why: `This interval starts at ${current.start}, before the previous one ends at ${oldEnd}, so they overlap. We stretch the running interval's end to max(${oldEnd}, ${current.end}) = ${prev.end}, giving ${formatInterval(prev)}.`,
        },
        primarySnapshot: {
          kind: 'array',
          elements: createIntervalArrayElements(intervals, i, 'swap'),
        },
        auxiliaryState: {
          customState: {
            status: 'Merged overlap',
            current: formatInterval(current),
            updatedInterval: formatInterval(prev),
            merged: merged.map(formatInterval).join(', '),
          },
        },
        variables: {
          i,
          currentStart: current.start,
          prevEnd: oldEnd,
          mergedEnd: prev.end,
        },
      });
    } else {
      merged.push({ ...current });

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 11,
        explanation: {
          what: `Start new interval ${formatInterval(current)}`,
          why: `This interval begins at ${current.start}, after the previous one ends at ${prev.end}, so there is a real gap between them. We close out ${formatInterval(prev)} and start tracking ${formatInterval(current)} on its own.`,
        },
        primarySnapshot: {
          kind: 'array',
          elements: createIntervalArrayElements(intervals, i, 'active'),
        },
        auxiliaryState: {
          customState: {
            status: 'New interval appended',
            current: formatInterval(current),
            merged: merged.map(formatInterval).join(', '),
          },
        },
        variables: {
          i,
          currentStart: current.start,
          prevEnd: prev.end,
          mergedCount: merged.length,
        },
      });
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 12,
    explanation: {
      what: `Return ${merged.length} merged interval(s)`,
      why: `Every interval has been folded in, leaving ${merged.map(formatInterval).join(', ')} — non-overlapping pieces that cover exactly the same ground as the input. The sort was the expensive part; the merge itself was a single pass.`,
    },
    primarySnapshot: {
      kind: 'array',
      elements: intervals.map((item, idx) => ({
        id: `interval-final-${idx}`,
        value: item.start,
        state: 'sorted',
        pointers: [formatInterval(item)],
      })),
    },
    auxiliaryState: {
      customState: {
        mergedResult: merged.map(formatInterval).join(', '),
      },
    },
    variables: {
      finalMergedCount: merged.length,
      completed: true,
    },
  });

  return steps;
}

const MERGE_INTERVALS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: 'Defines merge(intervals): produces the smallest set of non-overlapping intervals that covers the same points as the input.',
    2: 'Guards the empty-input case before touching intervals[0] anywhere below.',
    3: 'Nothing to merge, so returns an empty list immediately.',
    4: 'Sorts intervals by their start value — this is the entire trick that turns an all-pairs overlap question into a single left-to-right scan, since afterward any interval can only ever touch the block currently being built, never one already sealed off.',
    5: "Seeds the result with the first sorted interval as the currently \"open\" block that later intervals will either extend or leave behind.",
    6: 'Walks every remaining interval in sorted order, deciding one at a time whether it extends the open block or starts a new one.',
    7: "Grabs the last interval in the merged list — the currently open block — since that's the only one a new interval could possibly overlap once the list is sorted by start.",
    8: "Checks whether the current interval's start falls at or before the open block's end — if so, the two touch or overlap and must be merged.",
    9: "Extends the open block's end to whichever is bigger — this max is essential for fully-nested intervals, since blindly copying the new interval's end could shrink the block and lose coverage.",
    10: 'Otherwise there is a genuine gap: the current interval starts after the open block truly ends.',
    11: "The open block can't grow anymore, so appends the current interval as a fresh open block of its own.",
    12: 'Returns the fully merged, disjoint list — one pass after the sort was all it took.',
  },
};

export const mergeIntervals: AlgorithmDefinition<MergeIntervalsInput> = {
  id: 'merge-intervals',
  title: 'Merge Intervals',
  category: 'intervals',
  difficulty: 'Medium',
  description:
    'Merge all overlapping intervals into a minimal set of non-overlapping intervals that cover the exact same range as the input intervals. Intervals are sorted by start time, allowing overlap detection via a single linear scan.',
  constraints: [
    '1 <= intervals.length <= 10^4',
    'intervals[i].length == 2',
    '0 <= start_i <= end_i <= 10^4',
  ],
  examples: [
    {
      input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
      output: '[[1,6],[8,10],[15,18]]',
      explanation: 'Intervals [1,3] and [2,6] overlap since 2 <= 3; they merge into [1,6].',
    },
    {
      input: 'intervals = [[1,4],[4,5]]',
      output: '[[1,5]]',
      explanation: 'Intervals [1,4] and [4,5] touch at boundary 4 and are merged into [1,5].',
    },
  ],
  code: `def merge(intervals):
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            prev[1] = max(prev[1], current[1])
        else:
            merged.append(current)
    return merged`,
  timeComplexity: {
    best: 'O(N log N)',
    average: 'O(N log N)',
    worst: 'O(N log N)',
  },
  spaceComplexity: 'O(N)',
  complexityAnalysis: {
    time: 'Sorting the intervals by start time dominates the work at O(N log N). After that, we make a single linear pass and compare each interval only with the last merged one, which adds just O(N) more. That is why best, average, and worst case are all O(N log N) — the sort always happens.',
    space: 'The merged output list is what grows: when nothing overlaps it holds all N intervals, so extra memory is O(N).',
  },
  topicGuide: {
    overview:
      'Interval problems come with a hidden gift: an interval is just two numbers, and once you sort by one of them the geometry collapses into a single left-to-right walk. Merging overlapping intervals is the archetype — given a bag of ranges, produce the smallest set of disjoint ranges that covers exactly the same points. The entire technique is sort by start, then sweep forward comparing each interval only against the last one you kept. Learn this pattern and inserting an interval, counting meeting rooms, intersecting two interval lists, and detecting calendar conflicts all become the same short loop with a different decision inside it.',
    sections: [
      {
        heading: 'The core idea: sorting turns pair comparison into a scan',
        body: 'Unsorted, deciding which ranges overlap looks like it needs every pair examined. Sort by start time and something much stronger becomes true: as you walk forward, every remaining interval begins at or after the current one, so a new interval can only ever touch the block you are currently building and never anything you already sealed off. That is why one comparison per interval is enough, and why the sort rather than the scan is where the work goes. Sorting by end time instead is not wrong, merely a different tool — that is the ordering you want for greedy activity selection and for counting how many intervals to remove.',
      },
      {
        heading: 'How the sweep works: one comparison per interval',
        body: 'Keep an output list and seed it with the first interval; its last entry is the block currently open. For each following interval, compare its start against the open block\'s end. If the start is less than or equal to that end the two touch or overlap, so you extend the block by setting its end to the larger of the two ends. Otherwise there is a genuine gap, the open block can never grow again, and you append the newcomer as the new open block. Two details do the real work here: comparing against the last kept interval rather than the original neighbour, and taking the maximum of the two ends rather than blindly writing the newer one.',
      },
      {
        heading: 'Why taking the maximum end is what makes it correct',
        body: 'The maximum is what handles a fully nested interval: merging one to ten with three to four must still end at ten, and copying the newer end straight in would silently shrink the block and lose coverage. State the invariant plainly — after processing k intervals the output list holds disjoint intervals in increasing start order whose union equals the union of those k inputs, and only the last entry can still grow. The sort establishes the invariant for the first interval, and both branches preserve it: extending touches only the open block\'s end, and appending is safe precisely because the new start lies past the sealed end. When the scan finishes, that invariant applied to all the inputs is exactly the required answer, so no cleanup pass is needed.',
      },
      {
        heading: 'Boundary cases that decide the answer',
        body: 'Whether merely touching intervals merge is a specification question rather than a mathematical one: with a less-than-or-equal test, one to four and four to five become one to five, whereas a strict less-than treats four as a shared endpoint and keeps them separate. Read the problem statement for that, because both conventions are common in practice. Handle the empty input before you reach for the first element, and expect duplicate or identical intervals to fall naturally out of the merge branch with no special code. Zero-length intervals where start equals end are legitimate and should be merged rather than filtered, and if the input is not guaranteed to satisfy start no greater than end you must normalise each interval first, because sorting a malformed interval does not repair it.',
      },
      {
        heading: 'When to sort by start versus other approaches',
        body: 'Sorting by start is the right default whenever the output is itself a set of intervals, because the sweep produces them already in order. If you only need a count or a maximum rather than the merged ranges, the sweep-line variant is usually cleaner: split every interval into a start event and an end event, sort all events together, and run a counter. If the intervals arrive one at a time and you must answer queries between insertions, a sorted structure such as a balanced tree or an interval tree beats re-sorting, and that is the shape real calendar systems use. Bit sets or difference arrays are worth considering only when the coordinate range is small and dense, since they trade the sort for memory proportional to the coordinate space rather than the interval count.',
      },
      {
        heading: 'How the pattern generalises',
        body: 'The family generalises by changing what happens at each comparison, not how you scan. Inserting one interval into an already sorted list skips the sort entirely: copy everything that ends before the newcomer, merge the overlapping middle into it, then copy the rest. Finding the minimum number of meeting rooms replaces the merge with a running counter over start and end events, incrementing on a start and decrementing on an end, and the peak the counter reaches is the answer. Intersecting two sorted lists advances two pointers and emits the overlap of the current pair, while removing the fewest intervals to leave the rest disjoint sorts by end and greedily keeps the earliest finisher. In every one of these, sorted order is what licenses a purely local decision to be globally correct.',
      },
    ],
    keyTerms: [
      {
        term: 'Overlap',
        definition:
          'Two intervals overlap when each one starts before or at the point where the other ends. With the list sorted by start, that test simplifies to comparing the newcomer\'s start against the current block\'s end.',
      },
      {
        term: 'Closed interval',
        definition:
          'An interval that includes both of its endpoints, written start to end inclusive. It is what makes touching intervals such as one to four and four to five candidates for merging, unlike half-open intervals where the end is excluded.',
      },
      {
        term: 'Sweep line',
        definition:
          'A technique that processes geometric events in sorted coordinate order while maintaining a small amount of state. Merging intervals is the simplest sweep: the state is one open block.',
      },
      {
        term: 'Coalesce',
        definition:
          'To replace several overlapping intervals with the single interval spanning them all. Coalescing preserves the union of covered points while reducing how many intervals you must store.',
      },
      {
        term: 'Loop invariant',
        definition:
          'A property that holds before and after every iteration and is used to argue correctness. Here it is that the output list is always disjoint, sorted, and equal in coverage to the prefix of inputs already processed.',
      },
    ],
  },
  trivia: MERGE_INTERVALS_TRIVIA,
  generateSteps: generateMergeIntervalsSteps,
  defaultInput: DEFAULT_MERGE_INTERVALS_INPUT,
};
