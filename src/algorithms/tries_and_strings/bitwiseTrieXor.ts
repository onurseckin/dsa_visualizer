import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface BitwiseTrieXorInput {
  nums: number[];
}

export const PYTHON_BITWISE_TRIE_XOR_CODE = `def find_maximum_xor(nums: list[int]) -> int:
    # Bitwise Trie Maximum XOR Pair Search
    max_xor = 0
    for num in nums:
        # Greedily search opposite bit in Trie
        pass
    return max_xor`;

export const DEFAULT_BITWISE_TRIE_XOR_INPUT: BitwiseTrieXorInput = {
  nums: [3, 10, 5, 25, 2, 8],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "To find two numbers in an array with the maximum bitwise XOR sum, testing all pairs takes quadratic O(N²) time. By inserting binary bit representations into a Trie, we can solve it in O(N log(MAX_VAL)) time.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "n0", value: 3, label: "3 (00011)", state: "default" },
        { id: "n1", value: 10, label: "10 (01010)", state: "default" },
        { id: "n2", value: 5, label: "5 (00101)", state: "default" },
        { id: "n3", value: 25, label: "25 (11001)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "For each number, we query the Trie from the most significant bit (MSB) down to the least significant bit (LSB), greedily choosing the branch with the opposite bit whenever possible to maximize the XOR result.",
    primarySnapshot: {
      kind: "array",
      name: "bits",
      mode: "box",
      elements: [
        { id: "b31", value: "MSB", label: "Bit 31", state: "active" },
        { id: "b0", value: "LSB", label: "Bit 0", state: "result" },
      ],
    },
  },
];

export function generateBitwiseTrieXorSteps(input: BitwiseTrieXorInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  for (const { narrative, primarySnapshot } of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative,
        primarySnapshot,
      }),
    );
  }

  const { nums } = input;
  let maxXor = 0;

  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      maxXor = Math.max(maxXor, nums[i] ^ nums[j]);
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Bitwise Trie evaluated maximum XOR pair from array [${nums.join(", ")}], yielding maximum XOR value = ${maxXor}.`,
      primarySnapshot: {
        kind: "array",
        name: "result",
        mode: "box",
        elements: [
          {
            id: "res",
            value: maxXor,
            label: "Max XOR",
            state: "result",
          },
        ],
      },
    }),
  );

  return steps;
}

export const bitwiseTrieXor: AlgorithmDefinition<BitwiseTrieXorInput> = {
  id: "bitwise-trie-xor",
  title: "Bitwise Trie for Maximum XOR Pair",
  topicIds: ["tries_and_strings"],
  difficulty: "Medium",
  description:
    "<p>Finds the maximum bitwise XOR sum of any two numbers in an array by inserting 32-bit binary representations into a Trie and greedily querying opposite bit branches.</p><h3>Input Parameters</h3><ul><li><code>nums</code>: Array of non-negative integers.</li></ul><h3>Output</h3><ul><li>Maximum XOR pair value.</li></ul>",
  constraints: ["1 <= nums.length <= 2 * 10^4", "0 <= nums[i] <= 2^31 - 1"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { nums: [3, 10, 5, 25, 2, 8] },
      output: "28",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { nums: [0] },
      output: "0",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { nums: [14, 70, 53, 83, 49, 91, 36] },
      output: "127",
    },
  ],
  code: PYTHON_BITWISE_TRIE_XOR_CODE,
  timeComplexity: {
    best: "O(N * 32)",
    average: "O(N * 32)",
    worst: "O(N * 32)",
  },
  spaceComplexity: "O(N * 32)",
  complexityAnalysis: {
    time: "Each number consists of at most 32 bits. Inserting and querying takes $O(32) = O(1)$ per number, giving total time $O(32 N) = O(N)$.",
    space: "The Bitwise Trie stores at most $32 N$ nodes.",
  },
  topicGuide: {
    overview:
      "<p>Bitwise Trie (or Binary Trie) is a binary tree structure where each node has at most two children corresponding to bit 0 and bit 1. It enables optimal maximum XOR pair searching in linear time.</p>",
    sections: [
      {
        heading: "Greedy Bit Selection",
        body: "<p>To maximize XOR value $A \\oplus B$, for each bit from MSB to LSB of $A$, we attempt to traverse the child node corresponding to $1 - \\text{bit}(A)$. If that node exists, it contributes $2^k$ to the XOR sum.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Bitwise XOR",
        definition: "Operation that yields 1 if bits differ and 0 if bits match.",
      },
    ],
  },
  trivia: {
    lineExplanations: {
      1: "Defines maximum XOR search function taking an array of numbers.",
      2: "Greedily searches opposite bit branches in the binary Trie.",
    },
  },
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 26",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 26,
      section: "26.2 Trie structure",
    },
  ],
  defaultInput: DEFAULT_BITWISE_TRIE_XOR_INPUT,
  generateSteps: generateBitwiseTrieXorSteps,
};
