import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const HUFFMAN_CODING_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Huffman coding is a greedy algorithm for building an optimal prefix-free binary code from character frequencies. It answers the fundamental compression question: how many bits does each symbol deserve? Frequent symbols receive short bit strings, while rare symbols receive longer ones, provably minimizing the total weighted path length <span>&sum; f_i &middot; d_i</span> where <code>f_i</code> is symbol frequency and <code>d_i</code> is code length.</p>",
  sections: [
    {
      heading: "Why a variable-length code must be prefix-free",
      body: "<p>Fixed-width encoding like ASCII costs equal space regardless of character probability. Giving frequent symbols shorter bit codes saves space, but creates ambiguity if one code is a prefix of another. The solution is a prefix-free code, where no code word is a prefix of any other code word. Representing codes as a binary tree where all symbols reside at leaf nodes guarantees the prefix-free property. Traversal from root to leaf generates the exact code for each character.</p>",
    },
    {
      heading: "The greedy mechanism: repeatedly merge the two lightest nodes",
      body: "<p>Initialize <code>K</code> leaf nodes weighted by character frequency <code>f_i</code> in a min-heap. At each step, extract the two nodes with smallest frequencies (<code>w_1, w_2</code>) from the priority queue. Construct a parent node with weight <code>w_1 + w_2</code>, attach the two extracted nodes as children, and push the parent node back into the min-heap. Repeat this process <code>K - 1</code> times until a single root node remains. Total weighted path length equals the sum of weights of all internal nodes created during execution.</p>",
    },
    {
      heading: "Why the greedy choice is optimal (Exchange Argument)",
      body: "<p>Let <code>x</code> and <code>y</code> be the two characters with lowest frequencies in the alphabet. In any optimal tree <code>T*</code>, there exist two sibling leaves at maximum depth <code>d_max</code>. Swapping <code>x</code> and <code>y</code> with those sibling leaves cannot increase total cost <code>&sum; f_i d_i</code>, because lower frequency items move to equal or greater depth. Thus, an optimal tree exists where <code>x</code> and <code>y</code> are lowest-depth siblings. Merging them into a meta-symbol with weight <code>f_x + f_y</code> reduces the problem to an instance with <code>K - 1</code> symbols, establishing optimal substructure by induction.</p>",
    },
    {
      heading: "Entropy and Practical Limits",
      body: "<p>According to Shannon's source coding theorem, the average code length per symbol <code>L = &sum; p_i d_i</code> satisfies <code>H(X) &le; L &lt; H(X) + 1</code>. Here <code>H(X) = -&sum; p_i log₂ p_i</code> is the entropy of the source alphabet. Huffman coding achieves an integer-bit optimal code. However, when symbol probabilities are highly skewed, assigning at least 1 bit per symbol incurs overhead compared to arithmetic or range coding.</p>",
    },
    {
      heading: "Pitfalls, Edge Cases, and Real-world Usage",
      body: "<p>Edge cases include single-character inputs, requiring fallback to assign a 1-bit code <code>0</code>. Frequency ties can also occur and are broken arbitrarily without affecting total encoded length. Because the decoder requires the tree topology to decode the bitstream, real-world implementations transmit a compact canonical Huffman code table. Algorithms like DEFLATE combine LZ77 dictionary matching with a final Huffman coding pass.</p>",
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
        "A priority queue supporting O(log K) insertions and minimum element extractions, used to efficiently retrieve the two lowest-frequency nodes.",
    },
    {
      term: "Weighted path length",
      definition:
        "The objective value ∑ f_i · d_i representing the total number of bits required to encode the string.",
    },
    {
      term: "Internal node",
      definition:
        "A non-leaf node created during a merge step, carrying weight f_left + f_right without bound character data.",
    },
    {
      term: "Entropy H(X)",
      definition:
        "The theoretical lower bound on average bits per symbol, defined as H(X) = -∑ p_i log₂ p_i.",
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
    28: "Blank line separating tree construction from code-map generation.",
    29: "Defines the executable adapter that derives a code map from the canonical Huffman tree.",
    30: "Builds the canonical frequency-ordered Huffman tree.",
    31: "Checks whether the input produced an empty tree.",
    32: "Returns an empty mapping for empty text.",
    33: "Blank line before initializing the output mapping.",
    34: "Allocates the character-to-prefix-code mapping.",
    35: "Blank line before the recursive tree traversal.",
    36: "Defines a recursive traversal carrying the current binary prefix.",
    37: "Checks whether the current node is a character leaf.",
    38: 'Records its prefix, using "0" for the single-symbol boundary case.',
    39: "Stops descending after recording a leaf.",
    40: 'Traverses the left branch and appends a "0" bit.',
    41: 'Traverses the right branch and appends a "1" bit.',
    42: "Blank line separating the helper from its initial call.",
    43: "Traverses the tree from its root with an empty prefix.",
    44: "Returns the deterministic prefix-free character code map.",
  },
};
