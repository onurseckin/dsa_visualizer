import type { AlgorithmStep, PrimaryVisualSnapshot, TreeNodeItem } from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";
import type { HuffmanCodingInput, InternalHuffmanNode } from "./types";
import { DEFAULT_HUFFMAN_CODING_INPUT } from "./types";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Data compression reduces text storage size by encoding character symbols with variable-length binary code words instead of fixed 8-bit ASCII.",
    primarySnapshot: {
      kind: "hashtable",
      name: "fixed_ascii",
      buckets: [
        { index: 0, entries: [{ key: "'a'", value: "01100001 (8 bits)" }] },
        { index: 1, entries: [{ key: "'b'", value: "01100010 (8 bits)" }] },
      ],
    },
  },
  {
    narrative:
      "The Huffman Coding problem asks us to assign binary code words to characters in a text to minimize total encoded bit length.",
    primarySnapshot: {
      kind: "hashtable",
      name: "frequencies",
      buckets: [
        { index: 0, entries: [{ key: "'a'", value: "5 occurrences" }] },
        { index: 1, entries: [{ key: "'b'", value: "2 occurrences" }] },
        { index: 2, entries: [{ key: "'r'", value: "2 occurrences" }] },
      ],
    },
  },
  {
    narrative:
      "Fixed-length binary encoding uses ceil(log₂ K) bits per character regardless of symbol frequency, wasting bits on frequent characters.",
    primarySnapshot: {
      kind: "array",
      name: "fixed_codes",
      mode: "box",
      elements: [
        { id: "fc1", value: 0, label: "'a' -> 00", state: "default" },
        { id: "fc2", value: 1, label: "'b' -> 01", state: "default" },
        { id: "fc3", value: 2, label: "'r' -> 10", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Key insight: assign short binary codes to frequent characters and longer binary codes to rare characters.",
    primarySnapshot: {
      kind: "array",
      name: "optimal_idea",
      mode: "box",
      elements: [
        { id: "oi1", value: 5, label: "'a' (5x) -> 0", state: "sorted" },
        { id: "oi2", value: 2, label: "'b' (2x) -> 110", state: "active" },
        { id: "oi3", value: 2, label: "'r' (2x) -> 111", state: "active" },
      ],
    },
  },
  {
    narrative:
      "To avoid ambiguous bit streams, the codes MUST be prefix-free: no code word can be a prefix of any other code word.",
    primarySnapshot: {
      kind: "hashtable",
      name: "prefix_free_check",
      buckets: [
        { index: 0, entries: [{ key: "'a'", value: "0", state: "sorted" }] },
        { index: 1, entries: [{ key: "'b'", value: "10", state: "sorted" }] },
        { index: 2, entries: [{ key: "'c'", value: "11", state: "sorted" }] },
      ],
    },
  },
  {
    narrative:
      "We represent prefix-free codes as paths in a binary tree: left branches represent bit 0 and right branches represent bit 1, with characters at leaves.",
    primarySnapshot: {
      kind: "tree",
      name: "prefix_tree",
      nodes: [
        { id: "r", val: 9, state: "default", x: 200, y: 30, leftId: "l", rightId: "r1" },
        { id: "l", val: 5, state: "sorted", x: 120, y: 100 },
        { id: "r1", val: 4, state: "active", x: 280, y: 100 },
      ],
    },
  },
  {
    narrative:
      "Greedy choice: initialize a min-heap priority queue with leaf nodes weighted by character frequency.",
    primarySnapshot: {
      kind: "heap",
      name: "min_heap",
      heapType: "min",
      heap: [
        { id: "h1", val: 2, label: "'b'", state: "active" },
        { id: "h2", val: 2, label: "'r'", state: "active" },
        { id: "h3", val: 5, label: "'a'", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Repeatedly pop the two smallest subtrees, combine them under a new parent node weighted by their sum, and push the parent back into the min-heap.",
    primarySnapshot: {
      kind: "tree",
      name: "huffman_merge",
      nodes: [
        { id: "m1", val: 4, state: "active", x: 200, y: 30, leftId: "b", rightId: "r" },
        { id: "b", val: 2, state: "compare", x: 120, y: 100 },
        { id: "r", val: 2, state: "compare", x: 280, y: 100 },
      ],
    },
  },
  {
    narrative:
      "Building the Huffman tree takes O(N log K) time where K is the number of unique characters, achieving provably optimal compression bound.",
    primarySnapshot: {
      kind: "tree",
      name: "huffman_complete",
      nodes: [
        { id: "root", val: 9, state: "sorted", x: 200, y: 30, leftId: "a", rightId: "m1" },
        { id: "a", val: 5, state: "sorted", x: 100, y: 100 },
        { id: "m1", val: 4, state: "sorted", x: 300, y: 100, leftId: "b", rightId: "r" },
        { id: "b", val: 2, state: "sorted", x: 240, y: 170 },
        { id: "r", val: 2, state: "sorted", x: 360, y: 170 },
      ],
    },
  },
];

export const generateHuffmanCodingSteps = (input: HuffmanCodingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const rawText = typeof input?.text === "string" ? input.text : DEFAULT_HUFFMAN_CODING_INPUT.text;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultInput = !input || input.text === DEFAULT_HUFFMAN_CODING_INPUT.text;

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  if (!rawText || rawText.length === 0) {
    addStep("The text input is empty, returning an empty Huffman tree snapshot immediately.", {
      kind: "tree",
      name: "empty_tree",
      nodes: [],
    });
    return steps;
  }

  const freqMap: Record<string, number> = {};
  for (const char of rawText) {
    freqMap[char] = (freqMap[char] || 0) + 1;
  }

  const uniqueChars = Object.keys(freqMap).sort();

  addStep(
    `Count character frequencies in text "${rawText}" of length ${rawText.length}: ${uniqueChars.map((ch) => `'${ch}': ${freqMap[ch]}`).join(", ")}.`,
    {
      kind: "hashtable",
      name: "character_frequencies",
      buckets: uniqueChars.map((ch, idx) => ({
        index: idx,
        entries: [{ key: `'${ch}'`, value: `${freqMap[ch]} occurrences`, state: "active" }],
      })),
    },
  );

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

  addStep(
    `Instantiate ${uniqueChars.length} leaf node(s) and insert them into the min-heap priority queue ordered by occurrence count.`,
    {
      kind: "heap",
      name: "min_heap",
      heapType: "min",
      heap: heap.map((n) => ({ id: n.id, val: n.freq, label: `'${n.char}'`, state: "queued" })),
    },
  );

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
    const left = heap.shift()!;
    addStep(
      `Pop lowest frequency node left: ${left.char ? `'${left.char}'` : left.id} with frequency ${left.freq}. Heap has ${heap.length} item(s) left.`,
      {
        kind: "tree",
        name: "huffman_tree",
        ...buildVisualNodes([left.id], undefined, [left]),
      },
    );

    const right = heap.shift()!;
    addStep(
      `Pop second lowest frequency node right: ${right.char ? `'${right.char}'` : right.id} with frequency ${right.freq}.`,
      {
        kind: "tree",
        name: "huffman_tree",
        ...buildVisualNodes([left.id, right.id], undefined, [left, right]),
      },
    );

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

    addStep(
      `Merge children into new internal parent node ${parentId} with combined frequency ${left.freq} + ${right.freq} = ${mergedNode.freq}.`,
      {
        kind: "tree",
        name: "huffman_tree",
        ...buildVisualNodes([parentId, left.id, right.id], undefined, [mergedNode]),
      },
    );

    heap.push(mergedNode);
    heap.sort((a, b) => a.freq - b.freq || (a.char || "").localeCompare(b.char || ""));

    addStep(
      `Reinsert combined parent node (frequency ${mergedNode.freq}) back into min-heap. Min-heap size is now ${heap.length}.`,
      {
        kind: "heap",
        name: "min_heap",
        heapType: "min",
        heap: heap.map((n) => ({
          id: n.id,
          val: n.freq,
          label: n.char ? `'${n.char}'` : `Internal-${n.freq}`,
          state: n.id === parentId ? "active" : "queued",
        })),
      },
    );
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

  const codeEntries = Object.entries(huffmanCodes);

  addStep(
    `Huffman tree construction complete! Traversed tree to extract prefix codes: ${codeEntries.map(([ch, code]) => `'${ch}': "${code}"`).join(", ")}.`,
    {
      kind: "hashtable",
      name: "final_codes",
      buckets: codeEntries.map(([ch, code], idx) => ({
        index: idx,
        entries: [{ key: `'${ch}'`, value: `"${code}"`, state: "sorted" }],
      })),
    },
  );

  return steps;
};
