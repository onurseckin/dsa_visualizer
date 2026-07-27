import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const HUFFMAN_CODING_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Huffman coding is a greedy method for building an optimal prefix-free binary code from nothing but symbol frequencies. It answers the compression question of how many bits each symbol deserves: common symbols get short bit strings, rare ones get long strings, and the resulting total encoded length is provably as small as any per-symbol code can achieve. The technique is worth studying twice over, because it is the cleanest example of a greedy choice that reaches a global optimum, and because the tree it builds is simultaneously the encoder and the decoder.",
  sections: [
    {
      heading: "Why a variable-length code must be prefix-free",
      body: "If every symbol gets the same number of bits, as in fixed-width ASCII, you pay the same price for a vowel that appears constantly as for a symbol that appears once. Giving frequent symbols shorter codes saves space, but it creates an ambiguity problem: if one symbol is 0 and another is 01, a decoder reading 01 cannot tell whether it has finished one symbol or is halfway through another. The fix is the prefix-free property, meaning no code word is a prefix of another, and the elegant way to guarantee it is to place every symbol at a leaf of a binary tree. Label left edges 0 and right edges 1, and the path to each leaf becomes its code word; because leaves have no descendants, no code can be a prefix of another. Decoding then needs no lookahead at all, since you just walk the tree bit by bit and emit a symbol whenever you land on a leaf.",
    },
    {
      heading: "The greedy mechanism: always merge the two lightest nodes",
      body: "You start with one leaf per distinct symbol, weighted by how many times that symbol occurs, and put them all in a min-heap keyed on weight. Then you repeatedly pop the two lightest nodes, create a new internal node whose weight is their sum, attach them as its children, and push that parent back into the heap. With K distinct symbols this takes exactly K minus 1 merges before a single node remains, and that node is the root. Nothing about the symbols themselves guides the process, only weights, so the algorithm is really building a shape rather than choosing codes. A useful way to see the objective is that the total encoded length equals the sum over symbols of frequency times leaf depth, which turns out to equal the sum of the weights of all the internal nodes you created, so every merge adds exactly its own weight to the final cost and merging the lightest pair is the cheapest thing you can do right now.",
    },
    {
      heading: "Why the greedy choice is actually optimal",
      body: "The proof rests on an exchange argument about the two least frequent symbols, call them x and y. In any optimal tree there exist two sibling leaves at maximum depth, and if they are not x and y you can swap x and y into those positions without increasing the cost, because you are moving lower-frequency symbols deeper and higher-frequency symbols shallower. So there is always an optimal tree in which x and y are siblings, which means committing to merging them first loses nothing. Once they are merged, treating the parent as a single symbol of weight equal to their combined frequency gives a strictly smaller instance with K minus 1 symbols, and an optimal tree for that instance expands into an optimal tree for the original because the cost differs by the fixed constant weight of the merged pair. Induction on the number of symbols closes the argument. This is the pattern to remember about greedy proofs: show one local decision is consistent with some optimal solution, then show the remaining problem is a smaller instance of the same problem.",
    },
    {
      heading: "When Huffman is the right tool, and when it is not",
      body: "Reach for Huffman when symbols are drawn from a fixed alphabet with skewed frequencies and you can afford to either scan the data first or ship a frequency table alongside it. It cannot help when frequencies are near-uniform, because a balanced tree is then already optimal and you have gained nothing over fixed-width codes. Its structural limitation is that every code word is a whole number of bits, so a symbol occurring 90 percent of the time still costs a full bit even though its true information content is far less; arithmetic and range coding sidestep that by encoding fractional bits and beat Huffman precisely on such lopsided distributions. Data whose redundancy lies in repetition rather than symbol frequency, like long repeated substrings, is better served by dictionary methods such as LZ77. Real formats combine both ideas, which is why DEFLATE, PNG, and JPEG all run a canonical Huffman stage on top of another transform.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "The single-symbol input is the classic trap: with one distinct character there are no merges and the lone leaf sits at depth 0, so the natural code is the empty string, which encodes nothing. Implementations must special-case it and hand out a one-bit code instead, which is exactly what happens here when a path comes back empty and becomes the code 0. Ties in weight are common and are broken arbitrarily, so two correct implementations can produce visibly different trees with identical total cost; if you need reproducible output, make the comparator deterministic, for example by breaking ties on symbol order as this implementation does. Remember also that the decoder needs the tree, so the code table itself must be stored or transmitted, and for tiny inputs that overhead can exceed the savings. Finally, with adversarial frequencies resembling Fibonacci numbers the tree degenerates into a near-chain and code lengths grow to about K, which matters if your decoder uses a fixed-width lookup table and needs a length-limited variant instead.",
    },
    {
      heading: "How the pattern generalizes",
      body: "Strip away the compression story and what remains is a general recipe: repeatedly combine the two cheapest items, paying their sum, until one item is left. That is literally the optimal merge pattern problem for merging sorted files, the minimum cost of joining ropes or sticks end to end, and several scheduling problems where the cost of a combination is the total size involved. Variants tighten the model in useful ways, with the package-merge algorithm producing optimal codes under a maximum code length and other extensions handling letters whose transmission costs differ. It is also instructive to compare it with Kruskal building a minimum spanning tree, since both repeatedly take the globally cheapest available option and both are justified by exchange arguments rather than by search. Recognizing that shape lets you solve a new problem by asking what the two cheapest items are and whether combining them can ever be regretted.",
    },
  ],
  keyTerms: [
    {
      term: "Prefix-free code",
      definition:
        "A set of binary code words in which no word is a prefix of any other, so a stream of concatenated code words can be decoded without separators or lookahead. Placing symbols only at the leaves of a binary tree guarantees the property.",
    },
    {
      term: "Min-heap",
      definition:
        "A priority queue that always hands you its smallest element and supports insertion, both in logarithmic time. Huffman needs it because after every merge the new parent must take its place among the remaining weights.",
    },
    {
      term: "Weighted path length",
      definition:
        "The sum over all symbols of frequency multiplied by leaf depth, which is precisely the number of bits the encoded text occupies. Huffman minimizes this quantity, and it also equals the sum of the weights of all internal nodes.",
    },
    {
      term: "Internal node",
      definition:
        "A node created by a merge, holding no symbol and carrying the combined weight of its two children. Internal nodes exist only to give structure; only leaves are addressable by a code word.",
    },
    {
      term: "Exchange argument",
      definition:
        "A proof technique that transforms any optimal solution into one containing your greedy choice without making it worse. It is what upgrades merging the two rarest symbols from a plausible heuristic to a guaranteed optimum.",
    },
  ],
};

export const HUFFMAN_CODING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports heapq for min-heap operations.",
    2: "Imports Counter for character frequency counting.",
    4: "Defines HuffmanNode class representing tree nodes.",
    5: "Constructor takes char and freq.",
    6: "Sets self.char.",
    7: "Sets self.freq.",
    8: "Sets self.left to None.",
    9: "Sets self.right to None.",
    11: "Defines __lt__ comparison for min-heap ordering.",
    12: "Returns self.freq < other.freq.",
    14: "Defines build_huffman_tree function.",
    15: "Tallies character frequencies using Counter.",
    16: "Creates list of HuffmanNode objects.",
    17: "Transforms list into min-heap in place.",
    19: "Loops while heap has more than one node.",
    20: "Pops lightest node left.",
    21: "Pops second lightest node right.",
    22: "Creates merged parent node with combined frequency.",
    23: "Assigns left child.",
    24: "Assigns right child.",
    25: "Pushes merged node back to heap.",
    27: "Returns root of the Huffman tree.",
  },
};
