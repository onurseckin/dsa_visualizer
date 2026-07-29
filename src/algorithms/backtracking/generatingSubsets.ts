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
    3: "Blank line separating variable initialization from backtrack helper function.",
    4: "Recursive helper function backtrack(index, current_subset).",
    5: "Base case: when index equals n, record a copy of current_subset.",
    6: "Append current subset copy to result list.",
    7: "Return from current recursive stack frame after saving complete subset.",
    8: "Blank line separating base case from branching logic.",
    9: "Exclude branch: prepare to explore path without current element.",
    10: "Branch 1: exclude elements[index] and recurse to next index.",
    11: "Blank line separating exclusion branch from inclusion branch.",
    12: "Include branch: prepare to explore path with current element.",
    13: "Branch 2: append elements[index] to current_subset.",
    14: "Recurse with updated current_subset containing elements[index].",
    15: "Un-choose: pop element to restore current_subset before unwinding.",
    16: "Blank line separating backtrack definition from initial invocation.",
    17: "Start backtracking recursion from index 0 with empty subset.",
    18: "Return all generated subsets.",
  },
};

export const generateGeneratingSubsetsSteps = (input: GeneratingSubsetsInput): AlgorithmStep[] => {
  const safeInput = input ?? DEFAULT_GENERATING_SUBSETS_INPUT;
  const rawElements = Array.isArray(safeInput.elements)
    ? safeInput.elements
    : DEFAULT_GENERATING_SUBSETS_INPUT.elements;
  const nums = rawElements.length > 0 ? rawElements.slice(0, 6) : [1, 2, 3];
  const n = nums.length;

  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const allSubsets: number[][] = [];
  const currSubset: number[] = [];

  const buildArraySnapshot = (activeIdx: number, includedIndices: Set<number>) => {
    const elements: ArrayElement[] = nums.map((val, idx) => {
      const isActive = idx === activeIdx;
      const isIncluded = includedIndices.has(idx);
      const pointers: string[] = [];
      if (isActive) pointers.push("i");
      if (isIncluded) pointers.push("in");

      return {
        id: `elem-${idx}`,
        value: val,
        state: isActive ? "active" : isIncluded ? "sorted" : "default",
        pointers: pointers.length > 0 ? pointers : undefined,
      };
    });

    return { kind: "array" as const, elements };
  };

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Initialize power set generator for ${n} element${n === 1 ? "" : "s"}: [${nums.join(", ")}].`,
      why: `Generating all 2^N = 2^${n} = ${Math.pow(2, n)} subsets via recursive inclusion-exclusion decision branching.`,
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
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 5,
      explanation: {
        what: `Evaluate recursion base case: index (${idx}) == len(nums) (${n}).`,
        why:
          idx === n
            ? `Reached boundary end of array; current subset [${currSubset.join(", ")}] is complete.`
            : `Evaluating element nums[${idx}] = ${nums[idx]} for inclusion or exclusion.`,
      },
      primarySnapshot: buildArraySnapshot(idx, included),
      auxiliaryState: {
        customState: {
          "Current Index": idx,
          "Current Subset": `[${currSubset.join(", ")}]`,
        },
        visited: allSubsets.map((s) => `[${s.join(",")}]`),
      },
      variables: {
        idx,
        n,
      },
    });

    if (idx === n) {
      allSubsets.push([...currSubset]);
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 6,
        explanation: {
          what: `Recorded subset #${allSubsets.length}: [${currSubset.join(", ")}].`,
          why: "A complete subset decision path has been reached and appended to output collection.",
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
      codeLine: 10,
      explanation: {
        what: `Decision at index ${idx} (element ${nums[idx]}): EXCLUDE.`,
        why: `Exploring decision branch omitting ${nums[idx]} from current subset.`,
      },
      primarySnapshot: buildArraySnapshot(idx, included),
      auxiliaryState: {
        customState: {
          "Current Subset": `[${currSubset.join(", ")}]`,
          Action: `Exclude ${nums[idx]}`,
        },
        visited: allSubsets.map((s) => `[${s.join(",")}]`),
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
      codeLine: 13,
      explanation: {
        what: `Decision at index ${idx} (element ${nums[idx]}): INCLUDE.`,
        why: `Adding ${nums[idx]} to current subset; exploring decision branch with subset [${currSubset.join(", ")}].`,
      },
      primarySnapshot: buildArraySnapshot(idx, nextIncluded),
      auxiliaryState: {
        customState: {
          "Current Subset": `[${currSubset.join(", ")}]`,
          Action: `Include ${nums[idx]}`,
        },
        visited: allSubsets.map((s) => `[${s.join(",")}]`),
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
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 15,
      explanation: {
        what: `Backtrack: un-choose element ${nums[idx]} at index ${idx}.`,
        why: `Popped ${nums[idx]} to restore current subset state to [${currSubset.join(", ")}] for parent recursive frame.`,
      },
      primarySnapshot: buildArraySnapshot(idx, included),
      auxiliaryState: {
        customState: {
          "Current Subset": `[${currSubset.join(", ")}]`,
          Action: `Un-choose ${nums[idx]}`,
        },
        visited: allSubsets.map((s) => `[${s.join(",")}]`),
      },
      variables: {
        idx,
        poppedElement: nums[idx],
      },
    });
  };

  backtrack(0, new Set());

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 18,
    explanation: {
      what: `Power set generation complete! Generated all ${allSubsets.length} subsets.`,
      why: "Exhaustive binary decision tree traversal over all 2^N states successfully completed.",
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
  topicIds: ["backtracking"],
  difficulty: "Easy",
  description:
    "<p>Generate all <code>2^N</code> possible subsets (the power set) of an array of unique elements using recursive binary decision branching.</p><h3>Problem Statement</h3><p>Given an integer array <code>elements</code> of <code>N</code> unique integers, return all possible subsets (the power set) of the array in any order.</p><p>The power set of a set contains all subsets including the empty set and the set itself. The solution set must not contain duplicate subsets. Using depth-first search with recursive backtracking, each element presents a binary choice: either include it in the current subset or exclude it.</p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>elements</code> (array of <code>N</code> unique integers).</li><li><strong>Output:</strong> A list containing all <code>2^N</code> unique subsets.</li></ul>",
  constraints: [
    "1 <= elements.length <= 10",
    "-10 <= elements[i] <= 10",
    "All elements of elements are unique",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "elements = [1, 2, 3]",
      outputDisplay: "8 subsets",
      title: "3 Elements Power Set",
      input: DEFAULT_GENERATING_SUBSETS_INPUT,
      output: "[[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]",
      explanation: "3 unique elements produce 2^3 = 8 distinct subsets.",
    },
    {
      kind: "complex",
      inputDisplay: "elements = [1, 2, 3, 4]",
      outputDisplay: "16 subsets",
      title: "4 Elements Power Set",
      input: { elements: [1, 2, 3, 4] },
      output: "16 distinct subsets",
      explanation: "4 unique elements produce 2^4 = 16 distinct subsets.",
    },
    {
      kind: "negative",
      inputDisplay: "elements = []",
      outputDisplay: "[[]]",
      title: "Empty Input Array",
      input: { elements: [] },
      output: "[[]]",
      explanation: "An empty set has exactly 1 subset: the empty set itself.",
    },
  ],
  code: `def subsets(nums: list[int]) -> list[list[int]]:
    result = []

    def backtrack(index: int, current_subset: list[int]):
        if index == len(nums):
            result.append(current_subset.copy())
            return


        backtrack(index + 1, current_subset)


        current_subset.append(nums[index])
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
    time: "Each of the N elements has 2 choices (include/exclude), creating a binary decision tree of depth N with 2^N leaf states, taking O(2^N) overall time.",
    space:
      "O(N) stack memory required for recursion of depth N plus array space for building current_subset.",
  },
  topicGuide: {
    overview:
      "<p>Generating the power set of a set is a foundational backtracking pattern. By modeling decision making as a binary choice at each index, recursive search systematically visits every element in the power set. In real-world machine learning systems, power set enumeration underpins brute-force feature selection, combinatorial subset-sum solutions in resource allocation, and boolean satisfiability (SAT) clause evaluation.</p>",
    sections: [
      {
        heading: "Binary Decision Tree Structure",
        body: "<p>At step <code>i</code>, the search tree branches into two choices: exclude element <code>nums[i]</code> or include element <code>nums[i]</code>. The search tree has depth <code>N</code> with <code>2^N</code> leaves, where each leaf represents a unique subset.</p>",
      },
      {
        heading: "Backtracking vs Bitwise Manipulation",
        body: "<p>An alternative <code>O(2^N &middot; N)</code> iterative approach iterates over integers mask from 0 to <code>(1 &lt;&lt; N) - 1</code>. For each integer, bit <code>j</code> set to 1 indicates inclusion of <code>nums[j]</code>. While bitwise iteration is non-recursive, depth-first backtracking allows natural pruning when subset constraints (such as target sum caps) are introduced.</p>",
      },
      {
        heading: "Feature Selection & System Applications",
        body: "<p>In automated feature engineering and model ablation studies, evaluating subsets of feature matrices helps determine optimal predictive performance under model size constraints. Similarly, DB query rewrites test feature subsets for index condition pushdown.</p>",
      },
      {
        heading: "Handling Duplicate Elements (Subsets II)",
        body: "<p>When the input array contains duplicate values, generating unique subsets requires sorting the array first and skipping identical choices at the same depth: if <code>nums[i] == nums[i-1]</code> during inclusion loops, skip to avoid duplicate subset branches.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Power Set",
        definition:
          "The set of all subsets of a set, including the empty set and the set itself, containing 2^N elements.",
      },
      {
        term: "Inclusion-Exclusion Branching",
        definition:
          "A recursive search pattern where every item is evaluated under two explicit states: present or absent.",
      },
      {
        term: "Bitmask Enumeration",
        definition:
          "Using integer bit flags to represent subset membership, mapping integers 0..2^N-1 to subsets.",
      },
      {
        term: "Combinatorial Explosion",
        definition:
          "The exponential growth rate of decision trees (2^N) requiring domain pruning for large N.",
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

export default generatingSubsets;
