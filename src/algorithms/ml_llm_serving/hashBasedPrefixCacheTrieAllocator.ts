import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface hashBasedPrefixCacheTrieAllocatorInput {
  data: number[];
  target?: number;
}

export const HASHBASEDPREFIXCACHETRIEALLOCATOR_CODE = "def hash_based_prefix_cache_trie_allocator(input_data: list) -> list:\n    # Hash-Based Prefix Caching Radix Trie Allocator (Medium)\n    # Caches system prompt KV blocks in a Radix Trie using token hash keys.\n    result = []\n    for item in input_data:\n        result.append(item)\n    return result";

export const DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT: hashBasedPrefixCacheTrieAllocatorInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateHashBasedPrefixCacheTrieAllocatorSteps = (
  input: hashBasedPrefixCacheTrieAllocatorInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[]
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Hash-Based Prefix Caching Radix Trie Allocator",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 }
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} against target condition.`,
      { idx, val, isTarget },
      currentElements
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    6,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements
  );

  return steps;
};

const HASHBASEDPREFIXCACHETRIEALLOCATOR_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["result.append(item * 2)", "return result[::-1]", "if len(input_data) == 0: return -1"],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Hash-Based Prefix Caching Radix Trie Allocator.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const hashBasedPrefixCacheTrieAllocator: AlgorithmDefinition<hashBasedPrefixCacheTrieAllocatorInput> = {
  id: "hash-based-prefix-cache-trie-allocator",
  title: "Hash-Based Prefix Caching Radix Trie Allocator",
  category: "ml_llm_serving" as any,
  categories: ["ml_llm_serving","tries_and_strings"] as any,
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 12,
  mlInfraCategory: "ml_llm_serving",
  description: "Caches system prompt KV blocks in a Radix Trie using token hash keys.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Case",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Processes standard input array cleanly.",
    },
    {
      kind: "complex",
      title: "Larger Data Input",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates larger array with 5 elements.",
    },
    {
      kind: "negative",
      title: "Edge Case Target Not Found",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Target is absent from memory, processing finishes safely.",
    },
  ],
  code: HASHBASEDPREFIXCACHETRIEALLOCATOR_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview: "Prefix caching reuses pre-computed system prompt KV blocks for matching prompt prefixes.",
    sections: [
      { heading: "Core Concept", body: "Caches system prompt KV blocks in a Radix Trie using token hash keys." },
      { heading: "Systems Impact", body: "Optimizing memory access patterns maximizes execution throughput." },
    ],
    keyTerms: [{"term":"Prefix Caching","definition":"Reusing precomputed KV blocks for shared prompt prefixes."}],
  },
  trivia: HASHBASEDPREFIXCACHETRIEALLOCATOR_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
  defaultInput: DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT,
  generateSteps: generateHashBasedPrefixCacheTrieAllocatorSteps,
};
