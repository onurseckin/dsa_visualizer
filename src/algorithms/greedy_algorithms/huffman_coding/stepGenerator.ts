import type { AlgorithmStep, TreeNodeItem } from "../../../types/dsa";
import type { HuffmanCodingInput, InternalHuffmanNode } from "./types";
import { DEFAULT_HUFFMAN_CODING_INPUT } from "./types";

export const generateHuffmanCodingSteps = (input: HuffmanCodingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const rawText = input?.text ?? DEFAULT_HUFFMAN_CODING_INPUT.text;

  if (!rawText || rawText.length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 27,
      explanation: {
        what: "Handle empty input",
        why: "There are no characters to encode, so we stop right away — a Huffman tree needs at least one symbol to work with.",
      },
      primarySnapshot: {
        kind: "tree",
        nodes: [],
      },
      auxiliaryState: {
        hashMap: {},
        customState: { status: "Empty" },
      },
      variables: { textLength: 0 },
    });
    return steps;
  }

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
      why: "We tally how often each character appears, because frequency drives everything here: common characters should end up near the root with short codes, and rare ones deeper with longer codes.",
    },
    primarySnapshot: {
      kind: "tree",
      nodes: uniqueChars.map((ch, idx) => ({
        id: `leaf-${ch}`,
        val: freqMap[ch],
        state: "default",
        x: (idx + 1) * 80,
        y: 100,
      })),
    },
    auxiliaryState: {
      hashMap: Object.fromEntries(Object.entries(freqMap).map(([k, v]) => [`freq_${k}`, v])),
      customState: { text: rawText, uniqueCount: uniqueChars.length },
    },
    variables: { textLength: rawText.length, uniqueChars: uniqueChars.length },
  });

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
    (a, b) => a.freq - b.freq || a.char!.localeCompare(b.char!),
  );

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Build a min-heap of ${heap.length} leaves`,
      why: "Each distinct character becomes a leaf weighted by its count. Keeping the leaves in a min-heap lets us grab the two rarest nodes instantly whenever we need to merge.",
    },
    primarySnapshot: {
      kind: "tree",
      nodes: Array.from(allNodes.values()).map((n, idx) => ({
        id: n.id,
        val: n.freq,
        state: "queued",
        x: (idx + 1) * 80,
        y: 100,
      })),
    },
    auxiliaryState: {
      queue: heap.map((n) => `'${n.char}':${n.freq}`),
      hashMap: Object.fromEntries(Object.entries(freqMap).map(([k, v]) => [`freq_${k}`, v])),
      customState: { heapSize: heap.length },
    },
    variables: { heapSize: heap.length },
  });

  const buildVisualNodes = (
    activeIds: string[] = [],
    rootId?: string,
  ): { nodes: TreeNodeItem[]; rootId?: string } => {
    const treeNodes: TreeNodeItem[] = [];

    const assignPositions = (
      nodeId: string,
      depth: number,
      leftBound: number,
      rightBound: number,
    ) => {
      const node = allNodes.get(nodeId)!;

      const midX = (leftBound + rightBound) / 2;
      const y = depth * 70 + 40;

      let state: TreeNodeItem["state"] = "default";
      if (activeIds.includes(nodeId)) {
        state = "active";
      } else if (node.id === rootId) {
        state = "sorted";
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

  while (heap.length > 1) {
    // Step: While loop condition check
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Check heap size (${heap.length} > 1)`,
        why: "While more than one subtree remains, pop the two lightest nodes and combine them into a single parent.",
      },
      primarySnapshot: {
        kind: "tree",
        ...buildVisualNodes([]),
      },
      auxiliaryState: {
        queue: heap.map((n) => `${n.char ? `'${n.char}'` : "Internal"}:${n.freq}`),
        customState: { heapSize: heap.length, status: "Checking loop condition" },
      },
      variables: { heapSize: heap.length },
    });

    const left = heap.shift()!;

    // Step: Heappop left
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 20,
      explanation: {
        what: `Pop lightest node left: ${left.char ? `'${left.char}'` : left.id} (freq ${left.freq})`,
        why: "Remove the minimum element from the min-heap to become the left child of the new parent node.",
      },
      primarySnapshot: {
        kind: "tree",
        ...buildVisualNodes([left.id]),
      },
      auxiliaryState: {
        queue: heap.map((n) => `${n.char ? `'${n.char}'` : "Internal"}:${n.freq}`),
        customState: { poppedLeft: `${left.char || left.id}:${left.freq}` },
      },
      variables: { leftFreq: left.freq },
    });

    const right = heap.shift()!;

    // Step: Heappop right
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 21,
      explanation: {
        what: `Pop second lightest node right: ${right.char ? `'${right.char}'` : right.id} (freq ${right.freq})`,
        why: "Remove the second minimum element to become the right child of the new parent node.",
      },
      primarySnapshot: {
        kind: "tree",
        ...buildVisualNodes([left.id, right.id]),
      },
      auxiliaryState: {
        queue: heap.map((n) => `${n.char ? `'${n.char}'` : "Internal"}:${n.freq}`),
        customState: {
          poppedLeft: `${left.char || left.id}:${left.freq}`,
          poppedRight: `${right.char || right.id}:${right.freq}`,
        },
      },
      variables: { leftFreq: left.freq, rightFreq: right.freq },
    });

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

    // Step: Merged node created
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 22,
      explanation: {
        what: `Create parent node combining frequencies: ${left.freq} + ${right.freq} = ${mergedNode.freq}`,
        why: "The new internal node holds no character and carries the sum of its children's frequencies.",
      },
      primarySnapshot: {
        kind: "tree",
        ...buildVisualNodes([parentId]),
      },
      auxiliaryState: {
        queue: heap.map((n) => `${n.char ? `'${n.char}'` : "Internal"}:${n.freq}`),
        customState: {
          mergedParent: `${parentId}:${mergedNode.freq}`,
          combinedFreq: mergedNode.freq,
        },
      },
      variables: {
        leftFreq: left.freq,
        rightFreq: right.freq,
        parentFreq: mergedNode.freq,
      },
    });

    heap.push(mergedNode);
    heap.sort((a, b) => a.freq - b.freq || (a.char || "").localeCompare(b.char || ""));

    // Step: Push merged back to heap
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 25,
      explanation: {
        what: `Push merged parent (freq ${mergedNode.freq}) back to min-heap`,
        why: "Reinsert the merged subtree into the priority queue so it can compete for future merges.",
      },
      primarySnapshot: {
        kind: "tree",
        ...buildVisualNodes([parentId]),
      },
      auxiliaryState: {
        queue: heap.map((n) => `${n.char ? `'${n.char}'` : "Internal"}:${n.freq}`),
        customState: { heapSize: heap.length, status: "Reinserted merged parent" },
      },
      variables: { heapSize: heap.length },
    });
  }

  const rootNode = heap[0];
  const huffmanCodes: Record<string, string> = {};

  const generateCodes = (nodeId: string, currentCode: string) => {
    const node = allNodes.get(nodeId)!;

    if (node.char !== null) {
      huffmanCodes[node.char] = currentCode || "0";
      return;
    }

    if (node.leftId) generateCodes(node.leftId, currentCode + "0");
    if (node.rightId) generateCodes(node.rightId, currentCode + "1");
  };

  if (rootNode) {
    generateCodes(rootNode.id, "");
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
      why: `The root's weight is ${rootNode.freq}, the full text length. We walk down labeling left edges 0 and right edges 1, and each leaf's path becomes its code — frequent characters sit near the top, so the total encoded length comes out provably minimal.`,
    },
    primarySnapshot: {
      kind: "tree",
      ...buildVisualNodes([], rootNode.id),
    },
    auxiliaryState: {
      hashMap: codeHashMap,
      customState: {
        totalCharacters: rawText.length,
        distinctCodesCount: Object.keys(huffmanCodes).length,
      },
    },
    variables: {
      rootFrequency: rootNode.freq,
      uniqueCharactersCount: Object.keys(huffmanCodes).length,
    },
  });

  return steps;
};
