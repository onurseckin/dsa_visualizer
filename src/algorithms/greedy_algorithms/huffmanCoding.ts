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
      codeLine: 16,
      explanation: {
        what: 'Empty input text.',
        why: 'No Huffman tree can be constructed for an empty string.',
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

  // Line 16: Count frequencies
  const freqMap: Record<string, number> = {};
  for (const char of rawText) {
    freqMap[char] = (freqMap[char] || 0) + 1;
  }

  const uniqueChars = Object.keys(freqMap).sort();

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Count character frequencies for text "${rawText}".`,
      why: 'Count frequencies of each character to build min-heap priority queue.',
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

  // Line 17-18: Initialize heap
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
    codeLine: 18,
    explanation: {
      what: `Initialize min-heap with ${heap.length} leaf nodes.`,
      why: 'Heap ordered by frequency allows greedy extraction of the two lowest-frequency nodes.',
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

    // Calculate layout coordinates
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

  // Line 20: Combine nodes loop
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
      codeLine: 21,
      explanation: {
        what: `Pop two lowest-frequency nodes: ${left.char ? `'${left.char}'` : left.id} (${left.freq}) and ${right.char ? `'${right.char}'` : right.id} (${right.freq}).`,
        why: 'Greedy choice: Merge the two smallest subtrees into a new parent node.',
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
        what: `Merged parent node ${parentId} with frequency ${mergedNode.freq} re-inserted into min-heap.`,
        why: 'Re-heapify priority queue to prepare for next iteration.',
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
      what: `Huffman Tree construction complete. Final root frequency = ${rootNode?.freq || 0}.`,
      why: 'Traversed tree to derive optimal variable-length prefix binary codes for each character.',
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
    'Huffman Coding is a greedy data compression algorithm that constructs an optimal binary prefix code tree based on character frequencies.',
  constraints: ['1 <= text.length <= 100'],
  examples: [
    {
      input: 'text = "abracadabra"',
      output: 'Codes derived: a: "0", b: "110", r: "111", c: "100", d: "101"',
      explanation:
        'Higher frequency character "a" receives shorter prefix code (1 bit), reducing overall encoded size.',
    },
  ],
  code: PYTHON_HUFFMAN_CODE,
  timeComplexity: {
    best: 'O(N log K)',
    average: 'O(N log K)',
    worst: 'O(N log K)',
  },
  spaceComplexity: 'O(K)',
  defaultInput: DEFAULT_HUFFMAN_CODING_INPUT,
  generateSteps: generateHuffmanCodingSteps,
};
