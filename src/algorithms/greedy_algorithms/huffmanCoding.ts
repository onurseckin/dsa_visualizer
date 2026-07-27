import type { AlgorithmDefinition } from "../../types/dsa";
import type { HuffmanCodingInput } from "./huffman_coding/types";
import { PYTHON_HUFFMAN_CODE, DEFAULT_HUFFMAN_CODING_INPUT } from "./huffman_coding/types";
import { generateHuffmanCodingSteps } from "./huffman_coding/stepGenerator";
import { HUFFMAN_CODING_TOPIC_GUIDE, HUFFMAN_CODING_TRIVIA } from "./huffman_coding/metadata";

export type { HuffmanCodingInput };
export { PYTHON_HUFFMAN_CODE, DEFAULT_HUFFMAN_CODING_INPUT, generateHuffmanCodingSteps };

export const huffmanCoding: AlgorithmDefinition<HuffmanCodingInput> = {
  id: "huffman-coding",
  title: "Huffman Coding",
  category: "greedy_algorithms",
  difficulty: "Medium",
  description:
    "Huffman Coding is a greedy, lossless compression algorithm. It builds a binary tree from character frequencies so that common characters get short binary codes and rare ones get longer codes, producing the minimum possible average code length for the text.",
  constraints: ["1 <= text.length <= 10^4", "Text consists of ASCII characters"],
  examples: [
    {
      input: 'text = "abracadabra"',
      output: 'Codes: a: "0", b: "110", r: "111", c: "100", d: "101"',
      explanation:
        'Character "a" has highest frequency (5 occurrences) and receives a 1-bit code ("0"). Rare characters receiving 3-bit codes reduce total encoded string length.',
    },
  ],
  code: PYTHON_HUFFMAN_CODE,
  timeComplexity: {
    best: "O(N log K)",
    average: "O(N log K)",
    worst: "O(N log K)",
  },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "Counting frequencies takes one pass over all N characters of the text. Building the tree then performs K − 1 merges, where K is the number of distinct characters, and each merge does a constant number of heap pops and pushes costing O(log K) apiece. Together that gives O(N log K), and since K is capped by the alphabet size, the frequency-counting pass usually dominates in practice.",
    space:
      "We store one leaf node per distinct character plus roughly K − 1 merged internal nodes across the heap and the finished tree, so extra memory grows with the alphabet size — O(K), not with the length of the text.",
  },
  topicGuide: HUFFMAN_CODING_TOPIC_GUIDE,
  trivia: HUFFMAN_CODING_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 6",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 6,
      section: "6.5 Huffman coding",
    },
  ],
  defaultInput: DEFAULT_HUFFMAN_CODING_INPUT,
  generateSteps: generateHuffmanCodingSteps,
};

export default huffmanCoding;
