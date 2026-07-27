import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const HUFFMAN_CODING_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Huffman coding is a greedy algorithm for building an optimal prefix-free binary code from character frequencies. It answers the fundamental compression question: how many bits does each symbol deserve? Frequent symbols receive short bit strings, while rare symbols receive longer ones, provably minimizing the total weighted path length $\\sum_{i=1}^K f_i \\cdot d_i$ where $f_i$ is symbol frequency and $d_i$ is code length.",
  sections: [
    {
      heading: "Why a variable-length code must be prefix-free",
      body: "Fixed-width encoding like ASCII costs equal space regardless of character probability. Giving frequent symbols shorter bit codes saves space, but creates ambiguity if one code is a prefix of another. The solution is a prefix-free code, where no code word is a prefix of any other code word. Representing codes as a binary tree where all symbols reside at leaf nodes guarantees the prefix-free property. Traversal from root to leaf generates the exact code for each character.",
    },
    {
      heading: "The greedy mechanism: repeatedly merge the two lightest nodes",
      body: "Initialize $K$ leaf nodes weighted by character frequency $f_i$ in a min-heap. At each step, extract the two nodes with smallest frequencies ($w_1, w_2$) from the priority queue. Construct a parent node with weight $w_1 + w_2$, attach the two extracted nodes as children, and push the parent node back into the min-heap. Repeat this process $K - 1$ times until a single root node remains. Total weighted path length equals the sum of weights of all internal nodes created during execution.",
    },
    {
      heading: "Why the greedy choice is optimal (Exchange Argument)",
      body: "Let $x$ and $y$ be the two characters with lowest frequencies in the alphabet. In any optimal tree $T^*$, there exist two sibling leaves at maximum depth $d_{max}$. Swapping $x$ and $y$ with those sibling leaves cannot increase total cost $\\sum f_i d_i$, because lower frequency items move to equal or greater depth. Thus, an optimal tree exists where $x$ and $y$ are lowest-depth siblings. Merging them into a meta-symbol with weight $f_x + f_y$ reduces the problem to an instance with $K - 1$ symbols, establishing optimal substructure by induction.",
    },
    {
      heading: "Entropy and Practical Limits",
      body: "According to Shannon's source coding theorem, the average code length per symbol $L = \\sum p_i d_i$ satisfies $H(X) \\le L < H(X) + 1$. Here $H(X) = -\\sum p_i \\log_2 p_i$ is the entropy of the source alphabet. Huffman coding achieves an integer-bit optimal code. However, when symbol probabilities are highly skewed, assigning at least 1 bit per symbol incurs overhead compared to arithmetic or range coding.",
    },
    {
      heading: "Pitfalls, Edge Cases, and Real-world Usage",
      body: "Edge cases include single-character inputs, requiring fallback to assign a 1-bit code `0`. Frequency ties can also occur and are broken arbitrarily without affecting total encoded length. Because the decoder requires the tree topology to decode the bitstream, real-world implementations transmit a compact canonical Huffman code table. Algorithms like DEFLATE combine LZ77 dictionary matching with a final Huffman coding pass.",
    },
  ],
  keyTerms: [
    {
      term: "Prefix-free code",
      definition:
        "A binary code set where no code word is a prefix of any other. Guaranteed when symbols are assigned exclusively to leaf nodes of a binary tree.",
    },
    {
      term: "Min-heap",
      definition:
        "A priority queue supporting $O(\\log K)$ insertions and minimum element extractions, used to efficiently retrieve the two lowest-frequency nodes.",
    },
    {
      term: "Weighted path length",
      definition:
        "The objective value $\\sum_{i=1}^K f_i \\cdot d_i$ representing the total number of bits required to encode the string.",
    },
    {
      term: "Internal node",
      definition:
        "A non-leaf node created during a merge step, carrying weight $f_{left} + f_{right}$ without bound character data.",
    },
    {
      term: "Entropy $H(X)$",
      definition:
        "The theoretical lower bound on average bits per symbol, defined as $H(X) = -\\sum_{i=1}^K p_i \\log_2 p_i$.",
    },
  ],
};

export const HUFFMAN_CODING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports the `heapq` module for min-heap priority queue operations.",
    2: "Imports `Counter` from `collections` for tallying character frequencies.",
    3: "Blank line separator before class definition.",
    4: "Defines the `HuffmanNode` class representing nodes in the binary tree.",
    5: "Initializes `HuffmanNode` instance with character label `char` and frequency `freq`.",
    6: "Sets node character label `self.char` (`None` for internal merge nodes).",
    7: "Sets node frequency weight `self.freq`.",
    8: "Initializes `self.left` child pointer to `None`.",
    9: "Initializes `self.right` child pointer to `None`.",
    10: "Blank line separator within `HuffmanNode` class.",
    11: "Defines `<` (`__lt__`) comparison operator for min-heap ordering.",
    12: "Compares node frequencies `self.freq < other.freq` to order the min-heap.",
    13: "Blank line separator before `build_huffman_tree` function.",
    14: "Defines `build_huffman_tree(text)` entry point function.",
    15: "Tallies character frequencies using `Counter(text)`.",
    16: "Constructs initial list of leaf `HuffmanNode` instances for each character.",
    17: "Transforms node list into a valid min-heap in-place in $O(K)$ time.",
    18: "Blank line separator before greedy loop.",
    19: "Loops while heap contains more than 1 node (`len(heap) > 1`).",
    20: "Pops the lowest-frequency node `left` from the min-heap.",
    21: "Pops the second lowest-frequency node `right` from the min-heap.",
    22: "Creates new internal node with combined frequency `left.freq + right.freq`.",
    23: "Assigns `left` child to the new merged internal node.",
    24: "Assigns `right` child to the new merged internal node.",
    25: "Pushes the merged internal node back into the min-heap.",
    26: "Blank line separator after greedy merge loop.",
    27: "Returns root of the constructed Huffman tree `heap[0]`.",
  },
};
