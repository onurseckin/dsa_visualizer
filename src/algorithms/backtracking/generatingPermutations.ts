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
    12: "Skip used element.",
    13: "Mark element as used in boolean tracking array.",
    14: "Append element to current_perm.",
    15: "Recurse into next decision level.",
    16: "Pop element from current_perm to un-choose.",
    17: "Unmark used[i] to backtrack for sibling choices.",
    19: "Start recursion with empty initial permutation.",
    20: "Return all generated permutations.",
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
        codeLine: 14,
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
        codeLine: 16,
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
    codeLine: 20,
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
    "Given an array nums of distinct integers, return all possible permutations (distinct orderings) of the array in any order.\n\nA permutation is an arrangement of all elements into a specific sequence. Using depth-first search with recursive backtracking, elements are selected position by position while maintaining a boolean visited array to avoid duplicate element picks in a single branch.",
  constraints: [
    "1 <= nums.length <= 8",
    "-10 <= nums[i] <= 10",
    "All elements of nums are unique.",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [1, 2, 3]",
      outputDisplay: "6 permutations",
      title: "3 Elements Permutations",
      input: DEFAULT_GENERATING_PERMUTATIONS_INPUT,
      output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
      explanation: "3 distinct elements produce 3! = 6 distinct orderings.",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [1, 2, 3, 4]",
      outputDisplay: "24 permutations",
      title: "4 Elements Permutations",
      input: { elements: [1, 2, 3, 4] },
      output: "24 distinct orderings",
      explanation: "4 distinct elements produce 4! = 24 distinct orderings.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [1]",
      outputDisplay: "[[1]]",
      title: "Single Element Array",
      input: { elements: [1] },
      output: "[[1]]",
      explanation: "1 element array has exactly 1 permutation: [[1]].",
    },
  ],
  code: `def permute(nums: list[int]) -> list[list[int]]:
    result = []
    used = [False] * len(nums)

    def backtrack(current_perm: list[int]):
        if len(current_perm) == len(nums):
            result.append(current_perm.copy())
            return

        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            current_perm.append(nums[i])
            backtrack(current_perm)
            current_perm.pop()
            used[i] = False

    backtrack([])
    return result`,
  timeComplexity: {
    best: "O(N * N!)",
    average: "O(N * N!)",
    worst: "O(N * N!)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Generating N! permutations where building and copying each permutation of length N takes O(N) work yields O(N * N!) total operations.",
    space:
      "O(N) stack memory required for recursion of depth N plus the boolean used tracking array.",
  },
  topicGuide: {
    overview:
      "Generating permutations is the canonical example of depth-first search over non-overlapping choices. The algorithm systematically constructs all N! arrangements by picking un-chosen elements at each depth level. In systems engineering, permutation search arises in query optimization in relational engines, hardware instruction reordering for VLIW microarchitectures, and high-dimensional parameter sweep evaluations.",
    sections: [
      {
        heading: "Permutation Tree Geometry",
        body: "The search tree branches by N choices at root level 0, N-1 choices at level 1, down to 1 choice at level N-1. The tree has N! leaf nodes at depth N, representing all complete linear orderings.",
      },
      {
        heading: "State Management & Backtracking Invariants",
        body: "Rather than copying intermediate lists at every recursive call, backtracking maintains a single mutable current_perm list and a boolean used array. Reversing state changes (pop and un-marking used[i]) during recursion unwinding ensures zero extra allocation during search tree traversal.",
      },
      {
        heading: "Systems & Compiler Applications",
        body: "Instruction schedulers in compilers (such as LLVM backend target passes) evaluate localized basic block instruction permutations to minimize pipeline stalls and CPU register spill overhead. Similarly, query planners evaluate join-order permutations when cost-based optimizers search for minimal disk I/O query execution trees.",
      },
      {
        heading: "Handling Duplicate Inputs (Permutations II)",
        body: "When input elements contain duplicates, generating unique permutations requires sorting the array first and enforcing a skip guard: if nums[i] == nums[i-1] and not used[i-1], skip index i to avoid duplicate branch trees.",
      },
    ],
    keyTerms: [
      {
        term: "Permutation",
        definition: "An arrangement of all members of a set into a specific linear sequence.",
      },
      {
        term: "Backtracking Invariant",
        definition:
          "The property that state mutations performed during tree descent are completely restored before returning to a parent node.",
      },
      {
        term: "State Space Tree",
        definition:
          "A conceptual tree where each node represents a partial candidate sequence and leaves represent completed permutations.",
      },
      {
        term: "In-place Swap Permutation",
        definition:
          "An alternative Heap's algorithm formulation that generates permutations by swapping elements directly inside the target array without boolean tracking masks.",
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
