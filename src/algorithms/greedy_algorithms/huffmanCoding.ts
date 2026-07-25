import type {
  AlgorithmDefinition,
  AlgorithmStep,
  TreeNodeItem,
} from '../../types/dsa';

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
  defaultInput: DEFAULT_HUFFMAN_CODING_INPUT,
  generateSteps: generateHuffmanCodingSteps,
};
