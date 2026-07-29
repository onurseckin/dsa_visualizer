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
  topicIds: ["heap_and_priority_queue", "greedy_algorithms"],
  difficulty: "Medium",
  description:
    "<p>Given a text string, construct an optimal prefix-free binary code using Huffman's greedy min-heap algorithm to minimize the total encoded bit length.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>text</code>: A string of ASCII characters where <code>1 &le; N &le; 10<sup>4</sup></code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns a dictionary mapping each unique character to its optimal variable-length binary prefix code string.</p>",
  constraints: ["1 <= text.length <= 10^4", "Text consists of ASCII characters"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: 'text = "abracadabra"',
      outputDisplay: 'Codes: a: "0", b: "110", r: "111", c: "100", d: "101"',
      title: "Standard Text Sample",
      input: { text: "abracadabra" },
      output: 'Codes: a: "0", b: "110", r: "111", c: "100", d: "101"',
      explanation:
        'Character "a" has highest frequency (5 occurrences) and receives shortest prefix code ("0").',
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: 'text = "BEEP BOOP BEER"',
      outputDisplay: 'Codes: E: "00", B: "01", P: "100", O: "101", R: "110", " ": "111"',
      title: "Adversarial Multi-Symbol with Spaces",
      input: { text: "BEEP BOOP BEER" },
      output: 'Codes: E: "00", B: "01", P: "100", O: "101", R: "110", " ": "111"',
      explanation:
        "6 distinct characters including spaces built into a multi-level prefix code binary tree.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: 'text = "AAAAA"',
      outputDisplay: 'Codes: A: "0"',
      title: "Boundary Single Character String",
      input: { text: "AAAAA" },
      output: 'Codes: A: "0"',
      explanation:
        "Single unique character text yields a single root node with a trivial 1-symbol prefix code mapping.",
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
