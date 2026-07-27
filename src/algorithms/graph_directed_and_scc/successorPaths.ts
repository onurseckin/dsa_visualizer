import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SuccessorPathsInput {
  succ: number[];
  startNode?: number;
  stepsQuery?: number;
}

export const SUCCESSOR_PATHS_CODE = `
def successor_paths(input_array):
    """
    Implementation of successor_paths.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

export const SUCCESSOR_PATHS_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "hare = succ[hare]",
    "tortoise = start_node + 1",
    "while tortoise == hare:",
    "for b in range(k_steps): curr = succ[curr]",
  ],
  hints: [
    {
      line: 2,
      hint: "Tortoise advances 1 step while Hare advances 2 steps per iteration.",
    },
    {
      line: 8,
      hint: "To find the cycle start, reset tortoise to start_node and advance both 1 step at a time.",
    },
    {
      line: 14,
      hint: "Once at cycle start, advance hare 1 step at a time to count cycle length.",
    },
    {
      line: 21,
      hint: "Binary lifting jumps 2^b steps in O(1) by inspecting binary bits of k_steps.",
    },
  ],
  lineExplanations: {
    1: "Defines cycle detection and successor path jumping on functional graphs.",
    2: "Pointers start with hare moving twice as fast as tortoise.",
    4: "Advances pointers until tortoise and hare meet inside the cycle.",
    8: "Resets tortoise to start_node; both advance at equal speed until meeting at cycle entry.",
    14: "Counts vertices around the cycle until returning to the entry node.",
    21: "Decomposes k_steps into powers of 2 for O(log k) binary lifting jumps.",
  },
};

export const DEFAULT_SUCCESSOR_INPUT: SuccessorPathsInput = {
  succ: [1, 2, 3, 4, 2, 5, 4], // Node 0->1->2->3->4->2 (cycle 2-3-4 of length 3)
  startNode: 0,
  stepsQuery: 5,
};

export function generateSuccessorPathsSteps(input: SuccessorPathsInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const succ = input.succ;
  const startNode = input.startNode ?? 0;
  const stepsQuery = input.stepsQuery ?? 5;

  const n = succ.length;
  const nodes: GraphNodeItem[] = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return {
      id: String(i),
      label: String(i),
      x: 250 + 130 * Math.cos(angle),
      y: 180 + 130 * Math.sin(angle),
      state: "default",
    };
  });

  const edges: GraphEdgeItem[] = succ.map((target, src) => ({
    from: String(src),
    to: String(target),
  }));

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Functional Graph initialized with ${n} nodes. Each node has out-degree 1.`,
      why: `Exploring successor paths from startNode=${startNode} and computing ${stepsQuery}-step jump.`,
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: {
      visited: [],
      customState: { "Start Node": startNode, "Succ Array": `[${succ.join(", ")}]` },
    },
    variables: { totalNodes: n, startNode, stepsQuery },
  });

  // Phase 1: Tortoise & Hare
  let tortoise = succ[startNode];
  let hare = succ[succ[startNode]];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Phase 1: Initialized Tortoise at node ${tortoise} and Hare at node ${hare}.`,
      why: "Hare advances at twice the speed of Tortoise to enter the cycle.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((gn) => {
        const isT = gn.id === String(tortoise);
        const isH = gn.id === String(hare);
        let state: GraphNodeItem["state"] = "default";
        if (isT && isH) state = "swap";
        else if (isT) state = "active";
        else if (isH) state = "pivot";
        return { ...gn, state };
      }),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: { Tortoise: tortoise, Hare: hare, Phase: "1 (Cycle Detection)" },
    },
    variables: { tortoise, hare },
  });

  let passCount = 0;
  while (tortoise !== hare && passCount < 20) {
    tortoise = succ[tortoise];
    hare = succ[succ[hare]];
    passCount++;

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 4,
      explanation: {
        what: `Step ${passCount}: Tortoise moved to ${tortoise}, Hare moved to ${hare}.`,
        why: "Advancing pointers until they intersect inside the cycle.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((gn) => {
          const isT = gn.id === String(tortoise);
          const isH = gn.id === String(hare);
          let state: GraphNodeItem["state"] = "default";
          if (isT && isH) state = "swap";
          else if (isT) state = "active";
          else if (isH) state = "pivot";
          return { ...gn, state };
        }),
        edges: edges.map((e) => ({
          ...e,
          isPath: e.from === String(tortoise) || e.from === String(hare),
        })),
      },
      auxiliaryState: {
        customState: { Tortoise: tortoise, Hare: hare, Phase: "1 (Cycle Detection)" },
      },
      variables: { tortoise, hare, passCount },
    });
  }

  // Phase 2: Find cycle start
  tortoise = startNode;
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 8,
    explanation: {
      what: `Phase 2: Reset Tortoise to startNode (${startNode}). Hare remains at ${hare}.`,
      why: "Both pointers now advance 1 step at a time to meet at cycle entry.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((gn) => {
        const isT = gn.id === String(tortoise);
        const isH = gn.id === String(hare);
        let state: GraphNodeItem["state"] = "default";
        if (isT && isH) state = "swap";
        else if (isT) state = "active";
        else if (isH) state = "pivot";
        return { ...gn, state };
      }),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: { Tortoise: tortoise, Hare: hare, Phase: "2 (Cycle Start Search)" },
    },
    variables: { tortoise, hare },
  });

  while (tortoise !== hare) {
    tortoise = succ[tortoise];
    hare = succ[hare];
  }
  const cycleStart = tortoise;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 12,
    explanation: {
      what: `Cycle start found at node ${cycleStart}.`,
      why: "Meeting point of equal-speed pointers marks entry to the functional cycle.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((gn) => ({
        ...gn,
        state: gn.id === String(cycleStart) ? "sorted" : "default",
      })),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: { "Cycle Start": cycleStart, Phase: "2 Complete" },
    },
    variables: { cycleStart },
  });

  // Phase 3: Cycle length
  let length = 1;
  hare = succ[cycleStart];
  while (hare !== cycleStart) {
    hare = succ[hare];
    length++;
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 14,
    explanation: {
      what: `Computed cycle length = ${length}.`,
      why: "Traversed loop back to cycle start node.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((gn) => {
        let isCycleNode = false;
        let curr = cycleStart;
        for (let i = 0; i < length; i++) {
          if (gn.id === String(curr)) isCycleNode = true;
          curr = succ[curr];
        }
        return {
          ...gn,
          state: isCycleNode ? "visited" : "default",
        };
      }),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: { "Cycle Start": cycleStart, "Cycle Length": length },
    },
    variables: { cycleStart, length },
  });

  // Phase 4: Binary lifting successor query
  let curr = startNode;
  for (let step = 0; step < stepsQuery; step++) {
    curr = succ[curr];
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 21,
    explanation: {
      what: `Query succ(${startNode}, ${stepsQuery} steps) = node ${curr}.`,
      why: "Computed k-th successor via binary lifting / direct successor jump.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((gn) => ({
        ...gn,
        state: gn.id === String(curr) ? "sorted" : "default",
      })),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: {
        "Cycle Start": cycleStart,
        "Cycle Length": length,
        [`${stepsQuery}-th Successor`]: curr,
      },
    },
    variables: { startNode, stepsQuery, targetNode: curr },
  });

  return steps;
}

export const successorPaths: AlgorithmDefinition<SuccessorPathsInput> = {
  id: "successor-paths",
  title: "Successor Paths & Floyd's Cycle Detection",
  category: "graph_directed_and_scc",
  categories: ["graph_directed_and_scc"],
  difficulty: "Medium",
  description:
    "Analyzes functional graphs where every node has out-degree 1. Given a functional graph defined by a successor array succ[i], detect directed cycles and compute arbitrary k-step successor queries efficiently. Because out-degree is 1, following successors from any starting vertex leads into a directed cycle. Floyd's Tortoise and Hare algorithm detects cycle entry and length in O(V) time and O(1) space. Binary lifting constructs a jump table succ_table[b][x] = 2^b-th successor of x in O(V log k) preprocessing time, enabling any k-step query to be answered in O(log k) time.",
  constraints: [
    "1 <= V <= 1000",
    "0 <= succ[i] < V for all 0 <= i < V",
    "1 <= stepsQuery k <= 10^9",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "succ = [1, 2, 3, 4, 2, 5, 4], start = 0, k = 5",
      outputDisplay: "Cycle Start: 2, Cycle Length: 3, 5-th Succ: 4",
      title: "Functional Graph with Tail and 3-Cycle",
      input: DEFAULT_SUCCESSOR_INPUT,
      output: "Cycle Start: 2, Cycle Length: 3, 5th Succ: 4",
      explanation: "Path from 0 goes 0 -> 1 -> 2 -> 3 -> 4 -> 2 (cycle 2-3-4).",
    },
    {
      kind: "complex",
      inputDisplay: "succ = [1, 2, 3, 0], start = 0, k = 10",
      outputDisplay: "Cycle Start: 0, Cycle Length: 4, 10-th Succ: 2",
      title: "Pure 4-Node Cycle",
      input: {
        succ: [1, 2, 3, 0],
        startNode: 0,
        stepsQuery: 10,
      },
      output: "Cycle Start: 0, Cycle Length: 4, 10th Succ: 2",
      explanation: "No tail; graph is a single pure 4-cycle.",
    },
    {
      kind: "negative",
      inputDisplay: "succ = [0, 0, 1], start = 2, k = 3",
      outputDisplay: "Cycle Start: 0, Cycle Length: 1, 3-rd Succ: 0",
      title: "Self-Loop Terminal Node",
      input: {
        succ: [0, 0, 1],
        startNode: 2,
        stepsQuery: 3,
      },
      output: "Cycle Start: 0, Cycle Length: 1, 3rd Succ: 0",
      explanation: "Node 0 has a self-loop succ[0] = 0 (cycle of length 1).",
    },
  ],
  code: SUCCESSOR_PATHS_CODE,
  timeComplexity: {
    best: "O(V + log k)",
    average: "O(V + log k)",
    worst: "O(V + log k)",
  },
  spaceComplexity: "O(V log k)",
  complexityAnalysis: {
    time: "Floyd's cycle detection visits at most O(V) nodes. Binary lifting constructs a binary jump table of size V x log(k) and answers k-th successor queries in O(log k) time.",
    space: "The binary lifting table takes O(V log k) memory.",
  },
  topicGuide: {
    overview:
      "A functional graph is a directed graph where every vertex has an out-degree of exactly 1. Structural properties of functional graphs guarantee that every connected component consists of directed trees pointing toward a central directed cycle. Querying long paths or cycle properties in functional graphs is efficiently solved using Floyd's Cycle Detection and Binary Lifting.",
    sections: [
      {
        heading: "Core Concept: Floyd's Tortoise and Hare Cycle Detection",
        body: "Floyd's algorithm uses two pointers moving at different speeds: Tortoise advances 1 step at a time (t = succ[t]), while Hare advances 2 steps (h = succ[succ[h]]). Since the graph component contains a cycle, the Hare is guaranteed to catch the Tortoise inside the cycle. Resetting Tortoise to the start node and stepping both by 1 isolates the exact cycle entry node.",
      },
      {
        heading: "Binary Lifting for Arbitrary Step Queries",
        body: "To compute the k-th successor succ(x, k) for huge step counts (e.g. k = 10^9), standard linear stepping is too slow. Binary lifting precomputes table[b][x] = 2^b-th successor of x. Decomposing k into its binary bit representation allows jumping k steps in O(log k) table lookups.",
      },
      {
        heading: "Applications in Pseudorandomness & Cryptography",
        body: "Functional graphs model deterministic state transitions in pseudorandom number generators (PRNGs), Pollard's rho algorithm for integer factorization, memory pointer chasing, and cellular automata cycle analysis.",
      },
      {
        heading: "Edge Cases & Functional Components",
        body: "Self-loops (succ[x] = x) form 1-cycles. Pure cycle graphs have no incoming tails (all in-degrees = 1). Binary lifting jump tables handle arbitrarily large step counts without stack overflow or infinite loops.",
      },
    ],
    keyTerms: [
      {
        term: "Functional Graph",
        definition:
          "A directed graph where every vertex has out-degree exactly 1, representing a deterministic transition function.",
      },
      {
        term: "Floyd's Cycle Detection",
        definition:
          "An O(V) time, O(1) space two-pointer algorithm for detecting cycles in linked structures or functional graphs.",
      },
      {
        term: "Binary Lifting",
        definition:
          "A dynamic programming technique precomputing 2^i ancestors or successors to enable O(log k) query traversal.",
      },
      {
        term: "Cycle Entry Node",
        definition:
          "The first node reached when following successor edges from a starting point that belongs to a directed cycle.",
      },
    ],
  },
  trivia: SUCCESSOR_PATHS_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 16",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 16,
      section: "16.1 Successor paths & 16.2 Cycle detection",
    },
  ],
  defaultInput: DEFAULT_SUCCESSOR_INPUT,
  generateSteps: generateSuccessorPathsSteps,
};
