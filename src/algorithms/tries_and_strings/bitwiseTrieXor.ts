import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TopicGuide,
  TreeNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface BitwiseTrieXorInput {
  nums: number[];
}

export const PYTHON_BITWISE_TRIE_XOR_CODE = `class Solution:
    def __init__(self):
        pass

    def findMaximumXOR(self, nums: list[int]) -> int:
        if len(nums) < 2:
            return 0

        root = {}
        for number in nums:
            node = root
            for bit_index in range(30, -1, -1):
                bit = (number >> bit_index) & 1
                node = node.setdefault(bit, {})

        best = 0
        for number in nums:
            node = root
            candidate = 0
            for bit_index in range(30, -1, -1):
                bit = (number >> bit_index) & 1
                opposite = bit ^ 1
                if opposite in node:
                    candidate |= 1 << bit_index
                    node = node[opposite]
                else:
                    node = node[bit]
            best = max(best, candidate)

        return best`;

export const DEFAULT_BITWISE_TRIE_XOR_INPUT: BitwiseTrieXorInput = {
  nums: [3, 10, 5, 25, 2, 8],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Finding two numbers in an array with the maximum bitwise XOR sum naively tests all N(N-1)/2 pairs in quadratic O(N^2) time.",
    primarySnapshot: {
      kind: "array",
      name: "naivePairs",
      elements: [
        { id: "p1", value: 3, label: "3 (0b00011)", state: "default" },
        { id: "p2", value: 10, label: "10 (0b01010)", state: "default" },
        { id: "p3", value: 25, label: "25 (0b11001)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Bitwise XOR yields 1 when two bits differ (0 XOR 1 = 1) and 0 when bits match (0 XOR 0 = 0, 1 XOR 1 = 0).",
    primarySnapshot: {
      kind: "array",
      name: "xorTruthTable",
      elements: [
        { id: "x1", value: 1, label: "0 ^ 1 = 1", state: "active" },
        { id: "x2", value: 1, label: "1 ^ 0 = 1", state: "active" },
        { id: "x3", value: 0, label: "1 ^ 1 = 0", state: "default" },
      ],
    },
  },
  {
    narrative:
      "To maximize the XOR result, we should greedily choose opposite bits at higher bit positions starting from the Most Significant Bit (MSB).",
    primarySnapshot: {
      kind: "array",
      name: "msbGreedy",
      elements: [
        { id: "m1", value: 16, label: "Bit 4 (val 16)", state: "swap" },
        { id: "m2", value: 8, label: "Bit 3 (val 8)", state: "visited" },
        { id: "m3", value: 4, label: "Bit 2 (val 4)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "A Binary Bitwise Trie is a tree where every node has at most two children representing bit 0 and bit 1.",
    primarySnapshot: {
      kind: "tree",
      rootId: "r0",
      nodes: [
        { id: "r0", val: 0, leftId: "b0", rightId: "b1", state: "active" },
        { id: "b0", val: 0, state: "default" },
        { id: "b1", val: 1, state: "default" },
      ],
    },
  },
  {
    narrative: "Each number is converted to binary and inserted bit-by-bit from MSB down to LSB.",
    primarySnapshot: {
      kind: "tree",
      rootId: "r0",
      nodes: [
        { id: "r0", val: 0, leftId: "n0", rightId: "n1", state: "visited" },
        { id: "n0", val: 0, state: "default" },
        { id: "n1", val: 1, leftId: "n10", state: "swap" },
        { id: "n10", val: 0, state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Inserting all N numbers into the Bitwise Trie requires O(N * B) time, where B is the bit length (e.g. 5 or 32).",
    primarySnapshot: {
      kind: "array",
      name: "trieBuildComplexity",
      elements: [
        { id: "c1", value: 0, label: "N numbers", state: "default" },
        { id: "c2", value: 0, label: "B bits/number", state: "default" },
        { id: "c3", value: 0, label: "Build O(N * B)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "To find the maximum XOR pair for a target number X, we walk the Trie starting from the root at the MSB.",
    primarySnapshot: {
      kind: "tree",
      rootId: "r0",
      nodes: [
        { id: "r0", val: 0, leftId: "n0", rightId: "n1", state: "active" },
        { id: "n0", val: 0, state: "default" },
        { id: "n1", val: 1, state: "default" },
      ],
    },
  },
  {
    narrative:
      "At bit position k with bit(X), we attempt to traverse the opposite branch 1 - bit(X).",
    primarySnapshot: {
      kind: "tree",
      rootId: "r0",
      nodes: [
        { id: "r0", val: 0, leftId: "n0", rightId: "n1", state: "visited" },
        { id: "n0", val: 0, state: "default" },
        { id: "n1", val: 1, state: "swap" },
      ],
    },
  },
  {
    narrative:
      "If the opposite bit branch exists, we follow it and add 2^k to the XOR accumulator; otherwise we take the same bit branch.",
    primarySnapshot: {
      kind: "array",
      name: "xorAccumulator",
      elements: [
        { id: "a1", value: 16, label: "Bit 4 matched -> +16", state: "active" },
        { id: "a2", value: 8, label: "Bit 3 matched -> +8", state: "active" },
        { id: "a3", value: 24, label: "Running XOR = 24", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Querying each number takes O(B) time, reducing the total maximum XOR pair search from quadratic O(N^2) to linear O(N * B).",
    primarySnapshot: {
      kind: "array",
      name: "finalSummary",
      elements: [
        { id: "fs1", value: 0, label: "Build O(N * B)", state: "sorted" },
        { id: "fs2", value: 0, label: "Query O(N * B)", state: "sorted" },
        { id: "fs3", value: 0, label: "Total O(N * B)", state: "sorted" },
      ],
    },
  },
];

interface InternalTrieNode {
  id: string;
  bitVal: number;
  left0?: InternalTrieNode;
  right1?: InternalTrieNode;
}

export function generateBitwiseTrieXorSteps(input: BitwiseTrieXorInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  let nodeCounter = 0;

  for (const intro of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: intro.narrative,
        primarySnapshot: intro.primarySnapshot,
      }),
    );
  }

  const safeInput = {
    nums: Array.isArray(input?.nums) ? input.nums : DEFAULT_BITWISE_TRIE_XOR_INPUT.nums,
  };
  const nums = safeInput.nums;

  if (nums.length === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: "Input array is empty, so maximum XOR pair sum is 0.",
        primarySnapshot: {
          kind: "array",
          name: "result",
          elements: [{ id: "r0", value: 0, state: "sorted" }],
        },
      }),
    );
    return steps;
  }

  const bitLen = 5;
  const root: InternalTrieNode = {
    id: "trie_root",
    bitVal: -1,
  };

  const allTrieNodes: InternalTrieNode[] = [root];

  const insertTrie = (num: number) => {
    let curr = root;
    for (let i = bitLen - 1; i >= 0; i--) {
      const bit = (num >> i) & 1;
      if (bit === 0) {
        if (!curr.left0) {
          curr.left0 = { id: `tnode_${nodeCounter++}`, bitVal: 0 };
          allTrieNodes.push(curr.left0);
        }
        curr = curr.left0;
      } else {
        if (!curr.right1) {
          curr.right1 = { id: `tnode_${nodeCounter++}`, bitVal: 1 };
          allTrieNodes.push(curr.right1);
        }
        curr = curr.right1;
      }
    }
  };

  const collectTreeNodes = (activeId?: string): TreeNodeItem[] => {
    return allTrieNodes.map((node) => ({
      id: node.id,
      val: node.bitVal,
      leftId: node.left0?.id,
      rightId: node.right1?.id,
      state: node.id === activeId ? "active" : "default",
    }));
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing Bitwise Trie for ${nums.length} numbers using ${bitLen}-bit binary representations.`,
      primarySnapshot: {
        kind: "tree",
        name: "bitwiseTrie",
        nodes: collectTreeNodes(root.id),
        rootId: root.id,
      },
    }),
  );

  for (let i = 0; i < nums.length; i++) {
    insertTrie(nums[i]);
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Inserted nums[${i}] = ${nums[i]} (0b${nums[i].toString(2).padStart(bitLen, "0")}) into Bitwise Trie.`,
        primarySnapshot: {
          kind: "tree",
          name: "bitwiseTrie",
          nodes: collectTreeNodes(),
          rootId: root.id,
        },
      }),
    );
  }

  let globalMaxXor = 0;
  let bestPair = [nums[0], nums[0]];

  for (let i = 0; i < nums.length; i++) {
    const target = nums[i];
    let curr = root;
    let currentXor = 0;

    for (let b = bitLen - 1; b >= 0; b--) {
      const bit = (target >> b) & 1;
      const opposite = 1 - bit;

      let branchTaken = bit;
      if (opposite === 0 && curr.left0) {
        currentXor |= 1 << b;
        curr = curr.left0;
        branchTaken = 0;
      } else if (opposite === 1 && curr.right1) {
        currentXor |= 1 << b;
        curr = curr.right1;
        branchTaken = 1;
      } else if (bit === 0 && curr.left0) {
        curr = curr.left0;
      } else if (bit === 1 && curr.right1) {
        curr = curr.right1;
      }

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Querying target ${target} (0b${target.toString(2).padStart(bitLen, "0")}) at bit position ${b}: target bit ${bit}, took opposite branch ${branchTaken} -> accumulated XOR ${currentXor}.`,
          primarySnapshot: {
            kind: "tree",
            name: "bitwiseTrie",
            nodes: collectTreeNodes(curr.id),
            rootId: root.id,
          },
        }),
      );
    }

    if (currentXor > globalMaxXor) {
      globalMaxXor = currentXor;
      bestPair = [target, currentXor ^ target];
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Finished Trie query for target ${target}: max XOR with existing tree = ${currentXor}. Global Max XOR = ${globalMaxXor}.`,
        primarySnapshot: {
          kind: "tree",
          name: "bitwiseTrie",
          nodes: allTrieNodes.map((n) => ({
            id: n.id,
            val: n.bitVal,
            leftId: n.left0?.id,
            rightId: n.right1?.id,
            state: "visited" as const,
          })),
          rootId: root.id,
        },
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `All numbers evaluated against Bitwise Trie. Maximum XOR pair found: ${bestPair[0]} ^ ${bestPair[1]} = ${globalMaxXor}.`,
      primarySnapshot: {
        kind: "tree",
        name: "bitwiseTrie",
        nodes: allTrieNodes.map((n) => ({
          id: n.id,
          val: n.bitVal,
          leftId: n.left0?.id,
          rightId: n.right1?.id,
          state: "sorted" as const,
        })),
        rootId: root.id,
      },
    }),
  );

  return steps;
}

const BITWISE_TRIE_XOR_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Finds the maximum bitwise XOR sum of any two numbers in an array by inserting 32-bit binary representations into a Trie and greedily querying opposite bit branches.</p>",
  sections: [
    {
      heading: "Greedy Bitwise Path Search",
      body: "<p>To maximize XOR value <code>A ^ B</code>, for each bit from MSB to LSB of <code>A</code>, we attempt to traverse the child node corresponding to <code>1 - bit(A)</code>.</p>",
    },
  ],
};

const BITWISE_TRIE_XOR_TRIVIA: TriviaMeta = {
  lineExplanations: {
    8: "Defines BitwiseTrie class.",
    26: "Greedily searches opposite bit branches to maximize XOR total.",
  },
};

export const bitwiseTrieXor: AlgorithmDefinition<BitwiseTrieXorInput> = {
  id: "bitwise-trie-xor",
  title: "Bitwise Trie for Maximum XOR Pair",
  topicIds: ["tries_and_strings"],
  difficulty: "Medium",
  description:
    "<p>Finds the maximum bitwise XOR sum of any two numbers in an array by inserting 32-bit binary representations into a Trie and greedily querying opposite bit branches.</p><h3>Input Parameters</h3><ul><li><code>nums</code>: Array of non-negative integers.</li></ul><h3>Output</h3><ul><li><code>int</code>: Maximum XOR pair value.</li></ul>",
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
    time: "Each number consists of at most 32 bits. Inserting and querying takes O(32) = O(1) per number, giving total time O(32 N) = O(N).",
    space: "The Bitwise Trie stores at most 32 N nodes.",
  },
  topicGuide: BITWISE_TRIE_XOR_TOPIC_GUIDE,
  trivia: BITWISE_TRIE_XOR_TRIVIA,
  leetcode: {
    id: 421,
    url: "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/",
  },
  sources: [
    {
      kind: "leetcode",
      leetcodeId: 421,
      label: "LeetCode #421",
      title: "Maximum XOR of Two Numbers in an Array",
      url: "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/",
    },
  ],
  defaultInput: DEFAULT_BITWISE_TRIE_XOR_INPUT,
  generateSteps: generateBitwiseTrieXorSteps,
};

export default bitwiseTrieXor;
