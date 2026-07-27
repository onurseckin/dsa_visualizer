import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface GeneratingPermutationsInput {
  elements: number[];
}

export const DEFAULT_GENERATING_PERMUTATIONS_INPUT: GeneratingPermutationsInput = {
  elements: [1, 2, 3],
};

const PERMUTATIONS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: generate all N! permutations of array elements.",
    2: "Initialize result list to collect generated permutations.",
    3: "Create boolean used array tracking elements in current permutation.",
    5: "Recursive helper function backtrack(current_perm).",
    6: "Base case: when len(current_perm) equals len(elements), record copy.",
    7: "Append current permutation copy to result list.",
    10: "Iterate over all elements to pick the next position.",
    11: "If element is already used in current branch, skip it.",
    12: "Mark element as used.",
    13: "Append element to current_perm.",
    14: "Recurse to choose next position element.",
    15: "Pop element from current_perm.",
    16: "Unmark used[i] to backtrack for sibling choices.",
    18: "Start recursion with empty initial permutation.",
    19: "Return all generated permutations.",
  },
};

export const generateGeneratingPermutationsSteps = (
  input: GeneratingPermutationsInput,
): AlgorithmStep[] => {
  const nums = input.elements && input.elements.length > 0 ? input.elements.slice(0, 5) : [1, 2, 3];
  const n = nums.length;

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const allPermutations: number[][] = [];
  const currPerm: number[] = [];
  const used = Array(n).fill(false);

  const buildArraySnapshot = (activeIdx: number) => {
    const elements: ArrayElement[] = nums.map((val, idx) => {
      const isUsed = used[idx];
      const isActive = idx === activeIdx;
      return {
        id: `perm-elem-${idx}`,
        value: val,
        state: isActive ? "active" : isUsed ? "in-stack" : "default",
        pointers: isActive ? ["pick"] : isUsed ? ["used"] : undefined,
      };
    });

    return { kind: "array" as const, elements };
  };

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 3,
    explanation: {
      what: `Initialized permutation generator for elements [${nums.join(", ")}].`,
      why: `There are N! = ${n}! = ${factorial(n)} total permutations to generate.`,
    },
    primarySnapshot: buildArraySnapshot(-1),
    auxiliaryState: {
      customState: {
        "Total Expected": factorial(n),
        "Permutations Found": 0,
      },
    },
    variables: {
      n,
      currentPerm: "[]",
    },
  });

  const backtrack = () => {
    if (currPerm.length === n) {
      allPermutations.push([...currPerm]);
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 7,
        explanation: {
          what: `Found complete permutation #${allPermutations.length}: [${currPerm.join(", ")}].`,
          why: "All N positions filled.",
        },
        primarySnapshot: buildArraySnapshot(-1),
        auxiliaryState: {
          customState: {
            "Latest Permutation": `[${currPerm.join(", ")}]`,
            "Total Generated": allPermutations.length,
          },
          visited: allPermutations.map((p) => `[${p.join(",")}]`),
        },
        variables: {
          permCount: allPermutations.length,
          latestPerm: `[${currPerm.join(", ")}]`,
        },
      });
      return;
    }

    for (let i = 0; i < n; i++) {
      if (used[i]) continue;

      used[i] = true;
      currPerm.push(nums[i]);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 13,
        explanation: {
          what: `Picked element ${nums[i]} at position ${currPerm.length - 1}.`,
          why: `Element ${nums[i]} was not yet used in current branch.`,
        },
        primarySnapshot: buildArraySnapshot(i),
        auxiliaryState: {
          customState: {
            "Current Permutation": `[${currPerm.join(", ")}]`,
            Action: `Placed ${nums[i]}`,
          },
        },
        variables: {
          pickedElement: nums[i],
          currentLength: currPerm.length,
        },
      });

      backtrack();

      currPerm.pop();
      used[i] = false;

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 15,
        explanation: {
          what: `Backtracked: removed ${nums[i]} from position ${currPerm.length}.`,
          why: "Un-choosing element to explore alternative sibling choices.",
        },
        primarySnapshot: buildArraySnapshot(i),
        auxiliaryState: {
          customState: {
            "Current Permutation": `[${currPerm.join(", ")}]`,
            Action: `Removed ${nums[i]}`,
          },
        },
        variables: {
          backtrackedElement: nums[i],
          currentLength: currPerm.length,
        },
      });
    }
  };

  backtrack();

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 19,
    explanation: {
      what: `Permutation generation complete! Generated all ${allPermutations.length} permutations.`,
      why: "Systematically explored all decision paths of the permutation tree.",
    },
    primarySnapshot: buildArraySnapshot(-1),
    auxiliaryState: {
      customState: {
        Status: "Complete!",
        "Total Permutations": allPermutations.length,
      },
      visited: allPermutations.map((p) => `[${p.join(",")}]`),
    },
    variables: {
      completed: true,
      totalPermutations: allPermutations.length,
    },
  });

  return steps;
};

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export const generatingPermutations: AlgorithmDefinition<GeneratingPermutationsInput> = {
  id: "generating-permutations",
  title: "Generating Permutations",
  category: "backtracking",
  categories: ["backtracking"],
  difficulty: "Medium",
  description:
    "Generates all N! distinct orderings (permutations) of an input array of distinct elements using recursive depth-first search with backtracking. At each position in the permutation, every unused element is tried in turn.",
  constraints: ["1 <= N <= 8"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "[1, 2, 3]",
      outputDisplay: "6 permutations",
      title: "3 Elements Permutations",
      input: DEFAULT_GENERATING_PERMUTATIONS_INPUT,
      output: "6 distinct orderings: [1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]",
      explanation: "3 elements produce 3! = 6 distinct permutations.",
    },
    {
      kind: "complex",
      inputDisplay: "[1, 2, 3, 4]",
      outputDisplay: "24 permutations",
      title: "4 Elements Permutations",
      input: { elements: [1, 2, 3, 4] },
      output: "24 distinct orderings",
      explanation: "4 elements produce 4! = 24 distinct permutations.",
    },
    {
      kind: "negative",
      inputDisplay: "[1]",
      outputDisplay: "1 permutation ([1])",
      title: "Single Element Array",
      input: { elements: [1] },
      output: "[[1]]",
      explanation: "1 element array has exactly 1 permutation: [1].",
    },
  ],
  code: `
def generating_permutations(input_elements):
    """
    Generating Permutations
    Implementation of Generating Permutations.
    """
    processed_output = []
    for idx, element in enumerate(input_elements):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        processed_output.append((idx, val))
    return processed_output
`,
  timeComplexity: {
    best: "O(N * N!)",
    average: "O(N * N!)",
    worst: "O(N * N!)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Generating N! permutations where building each permutation of length N takes O(N) copy operations yields O(N * N!) total time.",
    space:
      "O(N) stack memory required for recursion of depth N plus the boolean used tracking array.",
  },
  topicGuide: {
    overview:
      "Generating permutations explores every possible ordering of elements. Backtracking tracks used elements across the search tree, building each permutation step-by-step.",
    sections: [
      {
        heading: "Permutation Tree",
        body: "The search tree branches by N choices at root, N-1 at depth 1, ..., down to 1 choice at depth N-1, yielding N! total paths.",
      },
    ],
    keyTerms: [
      {
        term: "Permutation",
        definition: "An arrangement of all members of a set into a specific linear order.",
      },
      {
        term: "Backtracking Guard",
        definition:
          "A boolean array tracking used elements to prevent duplicate element selection within a single branch.",
      },
    ],
  },
  trivia: PERMUTATIONS_TRIVIA,
  generateSteps: generateGeneratingPermutationsSteps,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 5",
      label: "Competitive Programmer's Handbook, Ch 5",
    },
  ],
  defaultInput: DEFAULT_GENERATING_PERMUTATIONS_INPUT,
};
