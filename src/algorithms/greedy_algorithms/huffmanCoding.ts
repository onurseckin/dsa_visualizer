import type {
  AlgorithmDefinition,
  AlgorithmStep,
  TopicGuide,
  TreeNodeItem,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

export interface HuffmanCodingInput {
  text: string;
}

export const PYTHON_HUFFMAN_CODE = `import heapq
from collections import Counter

class HuffmanNode:
    def __init__(self, char, freq):
        self.char = char
        self.freq = freq
        self.left = None
        self.right = None

    def __lt__(self, other):
        return self.freq < other.freq

def build_huffman_tree(text):
    frequency = Counter(text)
    heap = [HuffmanNode(char, freq) for char, freq in frequency.items()]
    heapq.heapify(heap)

    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        merged = HuffmanNode(None, left.freq + right.freq)
        merged.left = left
        merged.right = right
        heapq.heappush(heap, merged)

    return heap[0] if heap else None`;

export const DEFAULT_HUFFMAN_CODING_INPUT: HuffmanCodingInput = {
  text: 'abracadabra',
};

interface InternalHuffmanNode {
  id: string;
  char: string | null;
  freq: number;
  leftId?: string;
  rightId?: string;
}

export const generateHuffmanCodingSteps = (
  input: HuffmanCodingInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const rawText = input?.text ?? DEFAULT_HUFFMAN_CODING_INPUT.text;

  if (!rawText || rawText.length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 27,
      explanation: {
        what: 'Handle empty input',
        why: 'There are no characters to encode, so we stop right away — a Huffman tree needs at least one symbol to work with.',
      },
      primarySnapshot: {
        kind: 'tree',
        nodes: [],
      },
      auxiliaryState: {
        hashMap: {},
        customState: { status: 'Empty' },
      },
      variables: { textLength: 0 },
    });
    return steps;
  }

  // Line 15: Count frequencies
  const freqMap: Record<string, number> = {};
  for (const char of rawText) {
    freqMap[char] = (freqMap[char] || 0) + 1;
  }

  const uniqueChars = Object.keys(freqMap).sort();

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: `Count frequencies in "${rawText}"`,
      why: 'We tally how often each character appears, because frequency drives everything here: common characters should end up near the root with short codes, and rare ones deeper with longer codes.',
    },
    primarySnapshot: {
      kind: 'tree',
      nodes: uniqueChars.map((ch, idx) => ({
        id: `leaf-${ch}`,
        val: freqMap[ch],
        state: 'default',
        x: (idx + 1) * 80,
        y: 100,
      })),
    },
    auxiliaryState: {
      hashMap: Object.fromEntries(
        Object.entries(freqMap).map(([k, v]) => [`freq_${k}`, v])
      ),
      customState: { text: rawText, uniqueCount: uniqueChars.length },
    },
    variables: { textLength: rawText.length, uniqueChars: uniqueChars.length },
  });

  // Line 16-17: Initialize heap
  let nodeCounter = 0;
  const allNodes = new Map<string, InternalHuffmanNode>();

  for (const ch of uniqueChars) {
    const nodeId = `leaf-${ch}`;
    allNodes.set(nodeId, {
      id: nodeId,
      char: ch,
      freq: freqMap[ch],
    });
  }

  const heap: InternalHuffmanNode[] = Array.from(allNodes.values()).sort(
    (a, b) => a.freq - b.freq || (a.char || '').localeCompare(b.char || '')
  );

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Build a min-heap of ${heap.length} leaves`,
      why: 'Each distinct character becomes a leaf weighted by its count. Keeping the leaves in a min-heap lets us grab the two rarest nodes instantly whenever we need to merge.',
    },
    primarySnapshot: {
      kind: 'tree',
      nodes: Array.from(allNodes.values()).map((n, idx) => ({
        id: n.id,
        val: n.freq,
        state: 'queued',
        x: (idx + 1) * 80,
        y: 100,
      })),
    },
    auxiliaryState: {
      queue: heap.map((n) => `${n.char ? `'${n.char}'` : 'Internal'}:${n.freq}`),
      hashMap: Object.fromEntries(
        Object.entries(freqMap).map(([k, v]) => [`freq_${k}`, v])
      ),
      customState: { heapSize: heap.length },
    },
    variables: { heapSize: heap.length },
  });

  // Helper to construct TreeVisualSnapshot nodes with layout
  const buildVisualNodes = (
    activeIds: string[] = [],
    rootId?: string
  ): { nodes: TreeNodeItem[]; rootId?: string } => {
    const treeNodes: TreeNodeItem[] = [];

    const assignPositions = (
      nodeId: string,
      depth: number,
      leftBound: number,
      rightBound: number
    ) => {
      const node = allNodes.get(nodeId);
      if (!node) return;

      const midX = (leftBound + rightBound) / 2;
      const y = depth * 70 + 40;

      let state: TreeNodeItem['state'] = 'default';
      if (activeIds.includes(nodeId)) {
        state = 'active';
      } else if (node.id === rootId) {
        state = 'sorted';
      }

      treeNodes.push({
        id: node.id,
        val: node.freq,
        leftId: node.leftId,
        rightId: node.rightId,
        state,
        x: midX,
        y,
      });

      if (node.leftId && node.rightId) {
        assignPositions(node.leftId, depth + 1, leftBound, midX);
        assignPositions(node.rightId, depth + 1, midX, rightBound);
      }
    };

    if (rootId && allNodes.has(rootId)) {
      assignPositions(rootId, 0, 50, 600);
    } else {
      let idx = 0;
      for (const node of heap) {
        assignPositions(node.id, 0, idx * 100 + 40, (idx + 1) * 100 + 40);
        idx++;
      }
    }

    return { nodes: treeNodes, rootId };
  };

  // Line 19: Combine nodes loop
  while (heap.length > 1) {
    const left = heap.shift()!;
    const right = heap.shift()!;

    nodeCounter++;
    const parentId = `merged-${nodeCounter}`;
    const mergedNode: InternalHuffmanNode = {
      id: parentId,
      char: null,
      freq: left.freq + right.freq,
      leftId: left.id,
      rightId: right.id,
    };

    allNodes.set(parentId, mergedNode);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 20,
      explanation: {
        what: `Pop ${left.char ? `'${left.char}'` : left.id} (${left.freq}) and ${right.char ? `'${right.char}'` : right.id} (${right.freq})`,
        why: `We always merge the two least frequent nodes first — here that means weights ${left.freq} and ${right.freq}. Pushing the rarest symbols deepest is exactly what keeps the average code length as short as possible.`,
      },
      primarySnapshot: {
        kind: 'tree',
        ...buildVisualNodes([left.id, right.id]),
      },
      auxiliaryState: {
        queue: heap.map((n) => `${n.char ? `'${n.char}'` : 'Internal'}:${n.freq}`),
        customState: {
          poppedLeft: `${left.char || left.id}:${left.freq}`,
          poppedRight: `${right.char || right.id}:${right.freq}`,
          mergedFreq: mergedNode.freq,
        },
      },
      variables: {
        leftFreq: left.freq,
        rightFreq: right.freq,
        parentFreq: mergedNode.freq,
      },
    });

    heap.push(mergedNode);
    heap.sort((a, b) => a.freq - b.freq || (a.char || '').localeCompare(b.char || ''));

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 25,
      explanation: {
        what: `Reinsert merged node weighing ${mergedNode.freq}`,
        why: `The new parent carries ${left.freq} + ${right.freq} = ${mergedNode.freq} and goes back into the heap, where it competes like any other node. We repeat this until a single root remains.`,
      },
      primarySnapshot: {
        kind: 'tree',
        ...buildVisualNodes([parentId]),
      },
      auxiliaryState: {
        queue: heap.map((n) => `${n.char ? `'${n.char}'` : 'Internal'}:${n.freq}`),
        customState: { heapSize: heap.length },
      },
      variables: { heapSize: heap.length },
    });
  }

  const rootNode = heap[0];
  const huffmanCodes: Record<string, string> = {};

  const generateCodes = (nodeId: string, currentCode: string) => {
    const node = allNodes.get(nodeId);
    if (!node) return;

    if (node.char !== null) {
      huffmanCodes[node.char] = currentCode || '0';
      return;
    }

    if (node.leftId) generateCodes(node.leftId, currentCode + '0');
    if (node.rightId) generateCodes(node.rightId, currentCode + '1');
  };

  if (rootNode) {
    generateCodes(rootNode.id, '');
  }

  const codeHashMap: Record<string, string> = {};
  for (const [ch, code] of Object.entries(huffmanCodes)) {
    codeHashMap[`code_${ch}`] = code;
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 27,
    explanation: {
      what: `Tree complete: read off the codes`,
      why: `The root's weight is ${rootNode?.freq || 0}, the full text length. We walk down labeling left edges 0 and right edges 1, and each leaf's path becomes its code — frequent characters sit near the top, so the total encoded length comes out provably minimal.`,
    },
    primarySnapshot: {
      kind: 'tree',
      ...buildVisualNodes([], rootNode?.id),
    },
    auxiliaryState: {
      hashMap: codeHashMap,
      customState: {
        totalCharacters: rawText.length,
        distinctCodesCount: Object.keys(huffmanCodes).length,
      },
    },
    variables: {
      rootFrequency: rootNode?.freq || 0,
      uniqueCharactersCount: Object.keys(huffmanCodes).length,
    },
  });

  return steps;
};

const HUFFMAN_CODING_TOPIC_GUIDE: TopicGuide = {
  overview:
    'Huffman coding is a greedy method for building an optimal prefix-free binary code from nothing but symbol frequencies. It answers the compression question of how many bits each symbol deserves: common symbols get short bit strings, rare ones get long strings, and the resulting total encoded length is provably as small as any per-symbol code can achieve. The technique is worth studying twice over, because it is the cleanest example of a greedy choice that reaches a global optimum, and because the tree it builds is simultaneously the encoder and the decoder.',
  sections: [
    {
      heading: 'Why a variable-length code must be prefix-free',
      body: 'If every symbol gets the same number of bits, as in fixed-width ASCII, you pay the same price for a vowel that appears constantly as for a symbol that appears once. Giving frequent symbols shorter codes saves space, but it creates an ambiguity problem: if one symbol is 0 and another is 01, a decoder reading 01 cannot tell whether it has finished one symbol or is halfway through another. The fix is the prefix-free property, meaning no code word is a prefix of another, and the elegant way to guarantee it is to place every symbol at a leaf of a binary tree. Label left edges 0 and right edges 1, and the path to each leaf becomes its code word; because leaves have no descendants, no code can be a prefix of another. Decoding then needs no lookahead at all, since you just walk the tree bit by bit and emit a symbol whenever you land on a leaf.',
    },
    {
      heading: 'The greedy mechanism: always merge the two lightest nodes',
      body: 'You start with one leaf per distinct symbol, weighted by how many times that symbol occurs, and put them all in a min-heap keyed on weight. Then you repeatedly pop the two lightest nodes, create a new internal node whose weight is their sum, attach them as its children, and push that parent back into the heap. With K distinct symbols this takes exactly K minus 1 merges before a single node remains, and that node is the root. Nothing about the symbols themselves guides the process, only weights, so the algorithm is really building a shape rather than choosing codes. A useful way to see the objective is that the total encoded length equals the sum over symbols of frequency times leaf depth, which turns out to equal the sum of the weights of all the internal nodes you created, so every merge adds exactly its own weight to the final cost and merging the lightest pair is the cheapest thing you can do right now.',
    },
    {
      heading: 'Why the greedy choice is actually optimal',
      body: 'The proof rests on an exchange argument about the two least frequent symbols, call them x and y. In any optimal tree there exist two sibling leaves at maximum depth, and if they are not x and y you can swap x and y into those positions without increasing the cost, because you are moving lower-frequency symbols deeper and higher-frequency symbols shallower. So there is always an optimal tree in which x and y are siblings, which means committing to merging them first loses nothing. Once they are merged, treating the parent as a single symbol of weight equal to their combined frequency gives a strictly smaller instance with K minus 1 symbols, and an optimal tree for that instance expands into an optimal tree for the original because the cost differs by the fixed constant weight of the merged pair. Induction on the number of symbols closes the argument. This is the pattern to remember about greedy proofs: show one local decision is consistent with some optimal solution, then show the remaining problem is a smaller instance of the same problem.',
    },
    {
      heading: 'When Huffman is the right tool, and when it is not',
      body: 'Reach for Huffman when symbols are drawn from a fixed alphabet with skewed frequencies and you can afford to either scan the data first or ship a frequency table alongside it. It cannot help when frequencies are near-uniform, because a balanced tree is then already optimal and you have gained nothing over fixed-width codes. Its structural limitation is that every code word is a whole number of bits, so a symbol occurring 90 percent of the time still costs a full bit even though its true information content is far less; arithmetic and range coding sidestep that by encoding fractional bits and beat Huffman precisely on such lopsided distributions. Data whose redundancy lies in repetition rather than symbol frequency, like long repeated substrings, is better served by dictionary methods such as LZ77. Real formats combine both ideas, which is why DEFLATE, PNG, and JPEG all run a canonical Huffman stage on top of another transform.',
    },
    {
      heading: 'Pitfalls and edge cases',
      body: 'The single-symbol input is the classic trap: with one distinct character there are no merges and the lone leaf sits at depth 0, so the natural code is the empty string, which encodes nothing. Implementations must special-case it and hand out a one-bit code instead, which is exactly what happens here when a path comes back empty and becomes the code 0. Ties in weight are common and are broken arbitrarily, so two correct implementations can produce visibly different trees with identical total cost; if you need reproducible output, make the comparator deterministic, for example by breaking ties on symbol order as this implementation does. Remember also that the decoder needs the tree, so the code table itself must be stored or transmitted, and for tiny inputs that overhead can exceed the savings. Finally, with adversarial frequencies resembling Fibonacci numbers the tree degenerates into a near-chain and code lengths grow to about K, which matters if your decoder uses a fixed-width lookup table and needs a length-limited variant instead.',
    },
    {
      heading: 'How the pattern generalizes',
      body: 'Strip away the compression story and what remains is a general recipe: repeatedly combine the two cheapest items, paying their sum, until one item is left. That is literally the optimal merge pattern problem for merging sorted files, the minimum cost of joining ropes or sticks end to end, and several scheduling problems where the cost of a combination is the total size involved. Variants tighten the model in useful ways, with the package-merge algorithm producing optimal codes under a maximum code length and other extensions handling letters whose transmission costs differ. It is also instructive to compare it with Kruskal building a minimum spanning tree, since both repeatedly take the globally cheapest available option and both are justified by exchange arguments rather than by search. Recognizing that shape lets you solve a new problem by asking what the two cheapest items are and whether combining them can ever be regretted.',
    },
  ],
  keyTerms: [
    {
      term: 'Prefix-free code',
      definition:
        'A set of binary code words in which no word is a prefix of any other, so a stream of concatenated code words can be decoded without separators or lookahead. Placing symbols only at the leaves of a binary tree guarantees the property.',
    },
    {
      term: 'Min-heap',
      definition:
        'A priority queue that always hands you its smallest element and supports insertion, both in logarithmic time. Huffman needs it because after every merge the new parent must take its place among the remaining weights.',
    },
    {
      term: 'Weighted path length',
      definition:
        'The sum over all symbols of frequency multiplied by leaf depth, which is precisely the number of bits the encoded text occupies. Huffman minimizes this quantity, and it also equals the sum of the weights of all internal nodes.',
    },
    {
      term: 'Internal node',
      definition:
        'A node created by a merge, holding no symbol and carrying the combined weight of its two children. Internal nodes exist only to give structure; only leaves are addressable by a code word.',
    },
    {
      term: 'Exchange argument',
      definition:
        'A proof technique that transforms any optimal solution into one containing your greedy choice without making it worse. It is what upgrades merging the two rarest symbols from a plausible heuristic to a guaranteed optimum.',
    },
  ],
};

const HUFFMAN_CODING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: 'Imports the heap module, used to always retrieve the two least-frequent nodes efficiently during the merge phase.',
    2: 'Imports a ready-made frequency counter for tallying character occurrences in the input text.',
    4: 'Defines the tree node type that represents both leaf characters and internal merge points.',
    5: 'The constructor takes the character (or None for internal nodes) and its combined frequency weight.',
    6: 'Stores the character this node represents, or None if it is an internal (merged) node.',
    7: 'Stores the weight used to order nodes in the min-heap.',
    8: 'Starts with no left child; only a later merge will attach a subtree here.',
    9: 'Starts with no right child, for the same reason.',
    11: 'Defines how two nodes compare, which is exactly what the heap module uses to keep itself ordered.',
    12: 'Orders nodes purely by frequency, so the heap always surfaces the lightest node first regardless of which character it holds.',
    14: 'The entry point that turns raw text into a completed Huffman tree.',
    15: 'Tallies how often each character appears — this frequency count is the only information the algorithm needs about the text.',
    16: 'Creates one leaf node per distinct character, weighted by its frequency.',
    17: 'Arranges the leaves into a valid min-heap in linear time so the lightest node is always retrievable first.',
    19: 'Keeps merging until exactly one node — the root of the whole tree — remains.',
    20: 'Removes the current lightest node, which becomes one of the two children merged this round.',
    21: 'Removes the next lightest node; merging the two least-frequent nodes first is precisely what keeps rare symbols deepest and frequent ones shallow.',
    22: "Creates a new internal node with no character, weighted by the combined frequency of its two children.",
    23: "Attaches the first popped node as the merged node's left child.",
    24: "Attaches the second popped node as the merged node's right child.",
    25: 'Reinserts the merged node so it competes for future merges just like any other node.',
    27: "Once only the root remains, returns it (or None for empty input) — the finished tree's shape encodes every character's optimal code.",
  },
};

export const huffmanCoding: AlgorithmDefinition<HuffmanCodingInput> = {
  id: 'huffman-coding',
  title: 'Huffman Coding',
  category: 'greedy_algorithms',
  difficulty: 'Medium',
  description:
    'Huffman Coding is a greedy, lossless compression algorithm. It builds a binary tree from character frequencies so that common characters get short binary codes and rare ones get longer codes, producing the minimum possible average code length for the text.',
  constraints: [
    '1 <= text.length <= 10^4',
    'Text consists of ASCII characters',
  ],
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
    best: 'O(N log K)',
    average: 'O(N log K)',
    worst: 'O(N log K)',
  },
  spaceComplexity: 'O(K)',
  complexityAnalysis: {
    time: 'Counting frequencies takes one pass over all N characters of the text. Building the tree then performs K − 1 merges, where K is the number of distinct characters, and each merge does a constant number of heap pops and pushes costing O(log K) apiece. Together that gives O(N log K), and since K is capped by the alphabet size, the frequency-counting pass usually dominates in practice.',
    space: 'We store one leaf node per distinct character plus roughly K − 1 merged internal nodes across the heap and the finished tree, so extra memory grows with the alphabet size — O(K), not with the length of the text.',
  },
  topicGuide: HUFFMAN_CODING_TOPIC_GUIDE,
  trivia: HUFFMAN_CODING_TRIVIA,
  defaultInput: DEFAULT_HUFFMAN_CODING_INPUT,
  generateSteps: generateHuffmanCodingSteps,
};
