import type { AlgorithmStep, TreeNodeItem } from "../../../types/dsa";
import type { HuffmanCodingInput, InternalHuffmanNode } from "./types";
import { DEFAULT_HUFFMAN_CODING_INPUT } from "./types";

export const generateHuffmanCodingSteps = (input: HuffmanCodingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const rawText = typeof input?.text === "string" ? input.text : DEFAULT_HUFFMAN_CODING_INPUT.text;

  if (!rawText || rawText.length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 27,
      explanation: {
        what: "Check for empty text input.",
        why: "Encoding requires at least one character symbol; returning empty tree snapshot immediately.",
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
      what: `Tally character frequencies in "${rawText}".`,
      why: "Character occurrence frequencies dictate tree depth: frequent symbols stay close to the root with short codes, while rare ones sit deeper.",
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
      what: `Instantiate ${uniqueChars.length} leaf node(s).`,
      why: "Each distinct character symbol becomes an independent leaf node weighted by its total occurrences.",
    },
    primarySnapshot: {
      kind: "tree",
      nodes: Array.from(allNodes.values()).map((n, idx) => ({
        id: n.id,
        val: n.freq,
        state: "default",
        x: (idx + 1) * 80,
        y: 100,
      })),
    },
    auxiliaryState: {
      hashMap: Object.fromEntries(Object.entries(freqMap).map(([k, v]) => [`freq_${k}`, v])),
      customState: { leafCount: heap.length },
    },
    variables: { leafCount: heap.length },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Initialize min-heap priority queue with ${heap.length} leaf node(s).`,
      why: "A min-heap enables efficient O(log K) extraction of the two lowest-frequency subtrees at each merge step.",
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
    extraNodes: InternalHuffmanNode[] = [],
  ): { nodes: TreeNodeItem[]; rootId?: string } => {
    const treeNodes: TreeNodeItem[] = [];

    const assignPositions = (
      nodeId: string,
      depth: number,
      leftBound: number,
      rightBound: number,
    ) => {
      const node = allNodes.get(nodeId);
      if (!node) return;

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

      if (node.leftId) {
        assignPositions(node.leftId, depth + 1, leftBound, midX);
      }
      if (node.rightId) {
        assignPositions(node.rightId, depth + 1, midX, rightBound);
      }
    };

    if (rootId && allNodes.has(rootId)) {
      assignPositions(rootId, 0, 50, 600);
    } else {
      const rootsToRender: InternalHuffmanNode[] = [...heap];
      for (const extra of extraNodes) {
        if (!rootsToRender.some((n) => n.id === extra.id)) {
          rootsToRender.push(extra);
        }
      }
      let idx = 0;
      const stepWidth = Math.max(80, 600 / Math.max(1, rootsToRender.length));
      for (const node of rootsToRender) {
        assignPositions(node.id, 0, idx * stepWidth + 40, (idx + 1) * stepWidth + 40);
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
        what: `Evaluate min-heap size (${heap.length} remaining subtrees).`,
        why: "Iteratively merging the two lightest subtrees until only a single root node remains.",
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
        why: "Greedy strategy selects the smallest weight node to place at the greatest available tree depth.",
      },
      primarySnapshot: {
        kind: "tree",
        ...buildVisualNodes([left.id], undefined, [left]),
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
        why: "Pairs the two lowest-frequency components as siblings under a new internal parent.",
      },
      primarySnapshot: {
        kind: "tree",
        ...buildVisualNodes([left.id, right.id], undefined, [left, right]),
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
        what: `Create internal parent node with combined weight ${left.freq} + ${right.freq} = ${mergedNode.freq}.`,
        why: "Internal node holds the sum of child frequencies without character data.",
      },
      primarySnapshot: {
        kind: "tree",
        ...buildVisualNodes([parentId], undefined, [mergedNode]),
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

    // Step: Attach left and right child pointers
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 23,
      explanation: {
        what: `Connect left ('${left.char || "Internal"}') and right ('${right.char || "Internal"}') subtrees.`,
        why: `Forming a combined binary subtree rooted at frequency weight ${mergedNode.freq}.`,
      },
      primarySnapshot: {
        kind: "tree",
        ...buildVisualNodes([parentId, left.id, right.id], undefined, [mergedNode]),
      },
      auxiliaryState: {
        queue: heap.map((n) => `${n.char ? `'${n.char}'` : "Internal"}:${n.freq}`),
        customState: {
          attachedLeft: left.char || left.id,
          attachedRight: right.char || right.id,
        },
      },
      variables: {
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
        what: `Reinsert merged subtree (weight ${mergedNode.freq}) into min-heap.`,
        why: "The combined subtree re-enters the priority queue to participate in subsequent merge rounds.",
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
    const node = allNodes.get(nodeId);
    if (!node) return;

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
      what: `Huffman tree complete: derive prefix codes.`,
      why: `Root weight is ${rootNode.freq}. Traversing left (0) and right (1) edges generates optimal prefix-free codes.`,
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
