import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface GeneratingSubsetsInput {
  elements: number[];
}

export const DEFAULT_GENERATING_SUBSETS_INPUT: GeneratingSubsetsInput = {
  elements: [1, 2, 3],
};

const SUBSETS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: generate all subsets of array elements using recursive backtracking.",
    2: "Initialize result list to collect generated subsets.",
    4: "Recursive helper function backtrack(index, current_subset).",
    5: "Base case: when index equals n, record a copy of current_subset.",
    6: "Append current subset copy to result list.",
    9: "Branch 1: exclude elements[index] and recurse to next index.",
    10: "Branch 2: append elements[index] to current_subset.",
    11: "Recurse with updated current_subset containing elements[index].",
    12: "Un-choose: pop element to restore current_subset before unwinding.",
    14: "Start backtracking recursion from index 0 with empty subset.",
    15: "Return all generated subsets.",
  },
};

export const generateGeneratingSubsetsSteps = (input: GeneratingSubsetsInput): AlgorithmStep[] => {
  const nums = input.elements && input.elements.length > 0 ? input.elements.slice(0, 6) : [1, 2, 3];
  const n = nums.length;

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const allSubsets: number[][] = [];
  const currSubset: number[] = [];

  const buildArraySnapshot = (activeIdx: number, includedIndices: Set<number>) => {
    const elements: ArrayElement[] = nums.map((val, idx) => {
      const isActive = idx === activeIdx;
      const isIncluded = includedIndices.has(idx);
      return {
        id: `elem-${idx}`,
        value: val,
        state: isActive ? "active" : isIncluded ? "sorted" : "default",
        pointers: isActive ? ["i"] : isIncluded ? ["in"] : undefined,
      };
    });

    return { kind: "array" as const, elements };
  };

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Initialized subset generator for ${n} elements: [${nums.join(", ")}].`,
      why: "There are 2^N = 2^" + n + " = " + Math.pow(2, n) + " total subsets to generate.",
    },
    primarySnapshot: buildArraySnapshot(-1, new Set()),
    auxiliaryState: {
      customState: {
        "Subsets Found": 0,
        "Total Expected": Math.pow(2, n),
      },
    },
    variables: {
      n,
      currentSubset: "[]",
    },
  });

  const backtrack = (idx: number, included: Set<number>) => {
    if (idx === n) {
      allSubsets.push([...currSubset]);
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 6,
        explanation: {
          what: `Base case reached! Recorded subset: [${currSubset.join(", ")}].`,
          why: "All element decisions processed up to length N.",
        },
        primarySnapshot: buildArraySnapshot(idx, included),
        auxiliaryState: {
          customState: {
            "Latest Subset": `[${currSubset.join(", ")}]`,
            "Total Subsets Generated": allSubsets.length,
          },
          visited: allSubsets.map((s) => `[${s.join(",")}]`),
        },
        variables: {
          idx,
          subsetCount: allSubsets.length,
          latestSubset: `[${currSubset.join(", ")}]`,
        },
      });
      return;
    }

    // Decision: Exclude nums[idx]
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 9,
      explanation: {
        what: `Decision at index ${idx} (element ${nums[idx]}): EXCLUDE.`,
        why: "Exploring branch without adding this element to current subset.",
      },
      primarySnapshot: buildArraySnapshot(idx, included),
      auxiliaryState: {
        customState: {
          "Current Subset": `[${currSubset.join(", ")}]`,
          Action: `Exclude ${nums[idx]}`,
        },
      },
      variables: {
        idx,
        currElement: nums[idx],
        decision: "exclude",
      },
    });

    backtrack(idx + 1, included);

    // Decision: Include nums[idx]
    currSubset.push(nums[idx]);
    const nextIncluded = new Set(included);
    nextIncluded.add(idx);

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 10,
      explanation: {
        what: `Decision at index ${idx} (element ${nums[idx]}): INCLUDE.`,
        why: `Added ${nums[idx]} to current subset.`,
      },
      primarySnapshot: buildArraySnapshot(idx, nextIncluded),
      auxiliaryState: {
        customState: {
          "Current Subset": `[${currSubset.join(", ")}]`,
          Action: `Include ${nums[idx]}`,
        },
      },
      variables: {
        idx,
        currElement: nums[idx],
        decision: "include",
      },
    });

    backtrack(idx + 1, nextIncluded);

    // Un-choose
    currSubset.pop();
  };

  backtrack(0, new Set());

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 15,
    explanation: {
      what: `Completed power set generation! Produced all ${allSubsets.length} subsets.`,
      why: "Recursive backtracking systematically explored all 2^N binary decision paths.",
    },
    primarySnapshot: buildArraySnapshot(-1, new Set()),
    auxiliaryState: {
      customState: {
        Status: "Complete!",
        "Total Subsets": allSubsets.length,
      },
      visited: allSubsets.map((s) => `[${s.join(",")}]`),
    },
    variables: {
      completed: true,
      totalSubsets: allSubsets.length,
    },
  });

  return steps;
};

export const generatingSubsets: AlgorithmDefinition<GeneratingSubsetsInput> = {
  id: "generating-subsets",
  title: "Generating Subsets (Power Set)",
  category: "backtracking",
  difficulty: "Easy",
  description:
    "Generates all 2^N subsets (the power set) of a given set of elements using binary inclusion/exclusion recursive backtracking. Every element presents a binary choice: either include it in the subset or exclude it.",
  constraints: ["1 <= N <= 10"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "[1, 2, 3]",
      outputDisplay: "8 subsets",
      title: "3 Elements Power Set",
      input: DEFAULT_GENERATING_SUBSETS_INPUT,
      output: "[[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]",
      explanation: "3 elements produce 2^3 = 8 distinct subsets.",
    },
    {
      kind: "complex",
      inputDisplay: "[1, 2, 3, 4]",
      outputDisplay: "16 subsets",
      title: "4 Elements Power Set",
      input: { elements: [1, 2, 3, 4] },
      output: "16 distinct subsets",
      explanation: "4 elements produce 2^4 = 16 distinct subsets.",
    },
    {
      kind: "negative",
      inputDisplay: "[]",
      outputDisplay: "1 subset ([])",
      title: "Empty Input Array",
      input: { elements: [] },
      output: "[[]]",
      explanation: "An empty set has exactly 1 subset: the empty set itself.",
    },
  ],
  code: `def generating_subsets(elements: list[int]) -> list[list[int]]:
    result = []

    def backtrack(index: int, current_subset: list[int]):
        if index == len(elements):
            result.append(list(current_subset))
            return

        backtrack(index + 1, current_subset)
        current_subset.append(elements[index])
        backtrack(index + 1, current_subset)
        current_subset.pop()

    backtrack(0, [])
    return result`,
  timeComplexity: {
    best: "O(2^N)",
    average: "O(2^N)",
    worst: "O(2^N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Each of the N elements has 2 choices (include/exclude), creating a binary recursion tree of depth N with 2^N leaves, taking O(2^N) time.",
    space: "O(N) stack memory required for recursion of depth N.",
  },
  topicGuide: {
    overview:
      "Generating all subsets of a set is a fundamental backtracking pattern. By modeling decisions as a binary choice at each index, recursive search systematically visits every element in the power set.",
    sections: [
      {
        heading: "Binary Decision Tree",
        body: "At step i, we choose whether element i belongs to the subset. The search tree depth is N with 2^N leaves.",
      },
    ],
    keyTerms: [
      {
        term: "Power Set",
        definition: "The set of all subsets of a set, including the empty set and the set itself.",
      },
      {
        term: "Inclusion-Exclusion Principle",
        definition: "Branching pattern where each element is tested both included and excluded.",
      },
    ],
  },
  trivia: SUBSETS_TRIVIA,
  generateSteps: generateGeneratingSubsetsSteps,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 5",
      label: "Competitive Programmer's Handbook, Ch 5",
    },
  ],
  defaultInput: DEFAULT_GENERATING_SUBSETS_INPUT,
};
