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
    4: "Blank line separating variable initialization from backtrack helper function.",
    5: "Recursive helper function backtrack(current_perm).",
    6: "Base case: when len(current_perm) equals len(elements), record copy.",
    7: "Append current permutation copy to result list.",
    8: "Returns from current recursion level after adding complete permutation.",
    9: "Blank line separating base case from recursive search loop.",
    10: "Iterate over all elements to pick the next position.",
    11: "If element is already used in current branch, skip it.",
    12: "Skip used element.",
    13: "Mark element as used in boolean tracking array.",
    14: "Append element to current_perm.",
    15: "Recurse into next decision level.",
    16: "Pop element from current_perm to un-choose.",
    17: "Unmark used[i] to backtrack for sibling choices.",
    18: "Blank line separating recursive loop from initial backtrack call.",
    19: "Start recursion with empty initial permutation.",
    20: "Return all generated permutations.",
  },
};

export const generateGeneratingPermutationsSteps = (
  input: GeneratingPermutationsInput,
): AlgorithmStep[] => {
  const safeInput = input ?? DEFAULT_GENERATING_PERMUTATIONS_INPUT;
  const rawElements = Array.isArray(safeInput.elements)
    ? safeInput.elements
    : DEFAULT_GENERATING_PERMUTATIONS_INPUT.elements;
  const nums = rawElements.length > 0 ? rawElements.slice(0, 5) : [1, 2, 3];
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
      what: `Initialize permutation backtracking generator for elements [${nums.join(", ")}].`,
      why: `Generating all N! = ${n}! = ${factorial(n)} permutations using a boolean availability mask ('used') and recursive state restoration.`,
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
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 6,
      explanation: {
        what: `Evaluate recursion base case: current permutation length (${currPerm.length}) == N (${n}).`,
        why:
          currPerm.length === n
            ? `All ${n} positions filled; reached a complete leaf permutation.`
            : `Permutation contains ${currPerm.length} of ${n} elements; selecting next available candidate.`,
      },
      primarySnapshot: buildArraySnapshot(-1),
      auxiliaryState: {
        customState: {
          "Current Permutation": `[${currPerm.join(", ")}]`,
          Length: currPerm.length,
        },
      },
      variables: {
        currentLength: currPerm.length,
        n,
      },
    });

    if (currPerm.length === n) {
      allPermutations.push([...currPerm]);
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 7,
        explanation: {
          what: `Recorded complete permutation #${allPermutations.length}: [${currPerm.join(", ")}].`,
          why: "A valid N-element linear arrangement is finalized and added to the output set.",
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
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 11,
        explanation: {
          what: `Inspect candidate element nums[${i}] = ${nums[i]} (used = ${used[i]}).`,
          why: used[i]
            ? `Element ${nums[i]} is already active in the current path; skipping to prevent duplicate selections.`
            : `Element ${nums[i]} is available; testing this decision branch.`,
        },
        primarySnapshot: buildArraySnapshot(i),
        auxiliaryState: {
          customState: {
            "Candidate Element": nums[i],
            "Used Status": used[i] ? "Used" : "Available",
          },
        },
        variables: {
          i,
          candidate: nums[i],
          used: used[i],
        },
      });

      if (used[i]) continue;

      used[i] = true;
      currPerm.push(nums[i]);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 14,
        explanation: {
          what: `Select element ${nums[i]} at permutation index ${currPerm.length - 1}.`,
          why: `Element ${nums[i]} is marked as used and appended to current sequence [${currPerm.join(", ")}].`,
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
          what: `Backtrack: remove ${nums[i]} from permutation index ${currPerm.length}.`,
          why: `Un-choosing element ${nums[i]} and resetting used[${i}] = false restores state for sibling branches.`,
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
      what: `Permutation generation complete! Found all ${allPermutations.length} permutations.`,
      why: "Exhaustive depth-first search of the permutation decision tree successfully completed.",
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
  topicIds: ["backtracking"],
  difficulty: "Medium",
  description:
    "<p>Generate all <code>N!</code> distinct permutations of an array of unique elements using recursive backtracking with state restoration.</p><h3>Problem Statement</h3><p>Given an array <code>nums</code> of <code>N</code> distinct integers, return all possible permutations (distinct linear orderings) of the array elements in any order.</p><p>A permutation represents a distinct ordering of all <code>N</code> elements. The algorithm constructs each arrangement element by element from left to right using depth-first search. A boolean tracking array <code>used</code> prevents selecting an element multiple times in the same branch, and state restoration (pop + unmark) allows reusing a single buffer across all <code>N!</code> recursive paths.</p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>elements</code> (array of <code>N</code> unique integers).</li><li><strong>Output:</strong> A list containing all <code>N!</code> unique permutations.</li></ul><h3>Constraints &amp; Edge Cases</h3><ul><li><code>1 &lt;= elements.length &lt;= 8</code></li><li><code>-10 &lt;= elements[i] &lt;= 10</code></li><li>All elements of <code>elements</code> are unique.</li></ul>",
  constraints: [
    "1 <= elements.length <= 8",
    "-10 <= elements[i] <= 10",
    "All elements of elements are unique",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "elements = [1, 2, 3]",
      outputDisplay: "6 permutations",
      title: "3 Elements Permutations",
      input: DEFAULT_GENERATING_PERMUTATIONS_INPUT,
      output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
      explanation: "3 distinct elements produce 3! = 6 distinct orderings.",
    },
    {
      kind: "complex",
      inputDisplay: "elements = [1, 2, 3, 4]",
      outputDisplay: "24 permutations",
      title: "4 Elements Permutations",
      input: { elements: [1, 2, 3, 4] },
      output: "24 distinct orderings",
      explanation: "4 distinct elements produce 4! = 24 distinct orderings.",
    },
    {
      kind: "negative",
      inputDisplay: "elements = [1]",
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
    time: "Generating all N! permutations requires building N! leaf nodes in the decision tree. Copying each permutation of length N into the output list takes O(N) work, yielding O(N * N!) total time complexity.",
    space:
      "Auxiliary stack memory is O(N) corresponding to maximum recursion depth N. The boolean used array takes O(N) space. Storing all output permutations requires O(N * N!) space.",
  },
  topicGuide: {
    overview:
      "<p>Generating permutations is the fundamental model for decision-tree traversal over non-overlapping choices. The algorithm systematically constructs all <code>N!</code> arrangements by picking available elements at each depth level.</p><p>In system architectures and software engineering, permutation generation drives critical subcomponents: SQL query optimizers explore table join order permutations; VLIW compiler backends schedule instruction order permutations to optimize CPU pipeline utilization; and hyperparameter grid search tools iterate through configuration space orderings.</p>",
    sections: [
      {
        heading: "Permutation Tree Geometry & Branching Factor",
        body: "<p>The search tree branches by <code>N</code> choices at root level 0, <code>N-1</code> choices at level 1, down to 1 choice at level <code>N-1</code>. The tree has <code>N!</code> leaf nodes at depth <code>N</code>, representing all complete linear orderings.</p>",
      },
      {
        heading: "State Management & Backtracking Invariants",
        body: "<p>Rather than copying intermediate lists at every recursive call, backtracking maintains a single mutable <code>current_perm</code> list and a boolean <code>used</code> array. Reversing state changes (pop and un-marking <code>used[i]</code>) during recursion unwinding ensures zero extra allocation during search tree traversal.</p>",
      },
      {
        heading: "Systems & Compiler Applications",
        body: "<p>Instruction schedulers in compilers evaluate localized basic block instruction permutations to minimize pipeline stalls and CPU register spill overhead. Similarly, query planners evaluate join-order permutations when cost-based optimizers search for minimal disk I/O query execution trees.</p>",
      },
      {
        heading: "Handling Duplicate Inputs (Permutations II)",
        body: "<p>When input elements contain duplicates, generating unique permutations requires sorting the array first and enforcing a skip guard: if <code>nums[i] == nums[i-1]</code> and <code>not used[i-1]</code>, skip index <code>i</code> to avoid duplicate branch trees.</p>",
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

export default generatingPermutations;
