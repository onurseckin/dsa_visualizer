import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface SuccessorPathsInput {
  succ: number[];
  startNode?: number;
  stepsQuery?: number;
}

export const SUCCESSOR_PATHS_CODE = `def successor_paths(succ, start_node, k_steps):
    tortoise = succ[start_node]
    hare = succ[succ[start_node]]
    while tortoise != hare:
        tortoise = succ[tortoise]
        hare = succ[succ[hare]]
        
    tortoise = start_node
    while tortoise != hare:
        tortoise = succ[tortoise]
        hare = succ[hare]
    cycle_start = tortoise
    
    length = 1
    hare = succ[tortoise]
    while hare != tortoise:
        hare = succ[hare]
        length += 1
    cycle_length = length
    
    curr = start_node
    for _ in range(k_steps):
        curr = succ[curr]
        
    return cycle_start, cycle_length, curr`;

export const DEFAULT_SUCCESSOR_INPUT: SuccessorPathsInput = {
  succ: [1, 2, 3, 4, 2, 5, 4],
  startNode: 0,
  stepsQuery: 5,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Functional Graph is a directed graph where every vertex has an out-degree of exactly 1, defined by a successor function succ[i].",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "active" },
        { id: "1", label: "1", state: "default" },
        { id: "2", label: "2", state: "default" },
        { id: "3", label: "3", state: "default" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "3" },
        { from: "3", to: "1" },
      ],
    },
  },
  {
    narrative:
      "The structural property of functional graphs guarantees that every connected component consists of directed tree branches pointing into a central directed cycle.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0 (Tail)", state: "visited" },
        { id: "1", label: "1 (Cycle)", state: "swap" },
        { id: "2", label: "2 (Cycle)", state: "swap" },
        { id: "3", label: "3 (Cycle)", state: "swap" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2", isPath: true },
        { from: "2", to: "3", isPath: true },
        { from: "3", to: "1", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Naive step-by-step traversal to query the k-th successor takes O(k) time, which becomes prohibitively slow when k is large (e.g. k >= 10^9).",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "active" },
        { id: "1", label: "1 (Step 1)", state: "compare" },
        { id: "2", label: "2 (Step 2)", state: "compare" },
        { id: "3", label: "3 (Step 3)", state: "compare" },
      ],
      edges: [
        { from: "0", to: "1", isTraversed: true },
        { from: "1", to: "2", isTraversed: true },
        { from: "2", to: "3", isTraversed: true },
        { from: "3", to: "1" },
      ],
    },
  },
  {
    narrative:
      "Floyd's Tortoise and Hare algorithm uses two pointers: Tortoise moves 1 step per turn while Hare moves 2 steps per turn.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "default" },
        { id: "1", label: "1 (Tortoise)", state: "active" },
        { id: "2", label: "2 (Hare)", state: "pivot" },
        { id: "3", label: "3", state: "default" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "3" },
        { from: "3", to: "1" },
      ],
    },
  },
  {
    narrative:
      "Because the Hare advances at double speed, it is mathematically guaranteed to catch up to the Tortoise inside the directed cycle.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "default" },
        { id: "1", label: "1", state: "default" },
        { id: "2", label: "2", state: "default" },
        { id: "3", label: "3 (Intersect)", state: "swap" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "3" },
        { from: "3", to: "1" },
      ],
    },
  },
  {
    narrative:
      "Resetting Tortoise to the start node while leaving Hare at the intersection, then advancing both 1 step at a time, identifies the exact cycle entry node.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0 (Tortoise)", state: "active" },
        { id: "1", label: "1 (Entry)", state: "sorted" },
        { id: "2", label: "2", state: "default" },
        { id: "3", label: "3 (Hare)", state: "pivot" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "3" },
        { from: "3", to: "1" },
      ],
    },
  },
  {
    narrative:
      "Advancing a single pointer around the cycle until returning to the entry node counts the exact number of vertices in the cycle.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "default" },
        { id: "1", label: "1 (Len 3)", state: "sorted" },
        { id: "2", label: "2 (Len 3)", state: "sorted" },
        { id: "3", label: "3 (Len 3)", state: "sorted" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2", isPath: true },
        { from: "2", to: "3", isPath: true },
        { from: "3", to: "1", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Binary Lifting precomputes 2^b-th successors in O(V log k) time, allowing any k-step query to be answered in O(log k) binary jump lookups.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "active" },
        { id: "1", label: "1 (2^0)", state: "compare" },
        { id: "2", label: "2 (2^1)", state: "compare" },
        { id: "3", label: "3", state: "default" },
      ],
      edges: [
        { from: "0", to: "1", isTraversed: true },
        { from: "1", to: "2", isTraversed: true },
        { from: "2", to: "3" },
        { from: "3", to: "1" },
      ],
    },
  },
  {
    narrative:
      "Floyd's cycle detection runs in optimal O(V) time and O(1) space, providing complete structural insight into any functional graph.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "sorted" },
        { id: "1", label: "Cycle Entry: 1", state: "sorted" },
        { id: "2", label: "Len: 3", state: "sorted" },
        { id: "3", label: "k-Succ: 3", state: "sorted" },
      ],
      edges: [
        { from: "0", to: "1", isPath: true },
        { from: "1", to: "2", isPath: true },
        { from: "2", to: "3", isPath: true },
        { from: "3", to: "1", isPath: true },
      ],
    },
  },
];

export function generateSuccessorPathsSteps(input: SuccessorPathsInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  // Intro Phase (9 snapshots)
  const intro = createIntroSnapshots();
  for (const item of intro) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "intro",
        narrative: item.narrative,
        primarySnapshot: item.primarySnapshot,
      }),
    );
  }

  // Walkthrough Phase
  const safeInput = input && typeof input === "object" ? input : DEFAULT_SUCCESSOR_INPUT;
  const succ =
    Array.isArray(safeInput.succ) && safeInput.succ.length > 0
      ? safeInput.succ
      : DEFAULT_SUCCESSOR_INPUT.succ;
  const startNode: number =
    typeof safeInput.startNode === "number" &&
    safeInput.startNode >= 0 &&
    safeInput.startNode < succ.length
      ? safeInput.startNode
      : (DEFAULT_SUCCESSOR_INPUT.startNode ?? 0);
  const stepsQuery = safeInput.stepsQuery ?? DEFAULT_SUCCESSOR_INPUT.stepsQuery;

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

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized Functional Graph with ${n} vertices. Each vertex has out-degree 1 defined by the succ array.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((gn) => ({ ...gn, state: "active" })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { totalNodes: n, startNode, stepsQuery },
    }),
  );

  let tortoise = succ[startNode] ?? 0;
  let hare = succ[succ[startNode] ?? 0] ?? 0;

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Phase 1: Initialized Tortoise pointer at node ${tortoise} and Hare pointer at node ${hare}.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
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
          isPath: e.from === String(startNode) || e.from === String(tortoise),
        })),
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { tortoise, hare, startNode },
    }),
  );

  let passCount = 0;
  while (tortoise !== hare && passCount < 50) {
    passCount++;
    tortoise = succ[tortoise];
    hare = succ[succ[hare]];

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Phase 1 Step ${passCount}: Tortoise moved 1 step to node ${tortoise}, Hare moved 2 steps to node ${hare}.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
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
          stack: [],
          visited: [],
        },
        variables: { tortoise, hare, passCount },
      }),
    );
  }

  tortoise = startNode;
  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Phase 2: Reset Tortoise to startNode (${startNode}). Hare remains at intersection node ${hare}. Advancing both 1 step per turn.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
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
        stack: [],
        visited: [],
      },
      variables: { tortoise, hare },
    }),
  );

  let phase2Steps = 0;
  while (tortoise !== hare && phase2Steps < 50) {
    phase2Steps++;
    tortoise = succ[tortoise];
    hare = succ[hare];

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Phase 2 Step ${phase2Steps}: Tortoise moved 1 step to node ${tortoise}, Hare moved 1 step to node ${hare}.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
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
          stack: [],
          visited: [],
        },
        variables: { tortoise, hare },
      }),
    );
  }

  const cycleStart = tortoise;

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Identified cycle start entry at node ${cycleStart}. Both pointers met at the cycle entry node!`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((gn) => ({
          ...gn,
          state: gn.id === String(cycleStart) ? "sorted" : "default",
        })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { cycleStart },
    }),
  );

  let length = 1;
  hare = succ[cycleStart];

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Phase 3: Set Hare to succ[cycle_start] (${hare}) and initialized cycle length to 1.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((gn) => {
          if (gn.id === String(cycleStart)) return { ...gn, state: "compare" };
          if (gn.id === String(hare)) return { ...gn, state: "pivot" };
          return { ...gn, state: "default" };
        }),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { cycleStart, hare, length },
    }),
  );

  const cycleNodesSet = new Set<number>([cycleStart]);
  while (hare !== cycleStart && length < 50) {
    cycleNodesSet.add(hare);
    hare = succ[hare];
    length++;

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Phase 3 Step: Hare advanced to node ${hare}, updating measured cycle length to ${length}.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((gn) => {
            const idNum = Number(gn.id);
            if (gn.id === String(cycleStart)) return { ...gn, state: "sorted" };
            if (gn.id === String(hare)) return { ...gn, state: "pivot" };
            if (cycleNodesSet.has(idNum)) return { ...gn, state: "visited" };
            return { ...gn, state: "default" };
          }),
          edges: edges.map((e) => ({
            ...e,
            isPath: cycleNodesSet.has(Number(e.from)),
          })),
        },
        auxiliaryState: {
          stack: [],
          visited: Array.from(cycleNodesSet).map(String),
        },
        variables: { cycleStart, hare, length },
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Measured cycle length total = ${length}. Hare returned to cycleStart node ${cycleStart}.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((gn) => ({
          ...gn,
          state: cycleNodesSet.has(Number(gn.id)) ? "visited" : "default",
        })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: Array.from(cycleNodesSet).map(String),
      },
      variables: { cycleStart, cycleLength: length },
    }),
  );

  let curr: number = startNode;
  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Phase 4: Set curr = startNode (${startNode}) to execute ${stepsQuery}-step successor query traversal.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((gn) => ({
          ...gn,
          state: gn.id === String(curr) ? "active" : "default",
        })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { startNode, stepsQuery, curr },
    }),
  );

  const totalQuerySteps = stepsQuery ?? 5;
  for (let s = 1; s <= totalQuerySteps; s++) {
    const prev = curr;
    curr = succ[curr] ?? 0;

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Phase 4 Step ${s}/${totalQuerySteps}: Advanced from node ${prev} to node ${curr} (succ[${prev}]).`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((gn) => ({
            ...gn,
            state: gn.id === String(curr) ? "active" : "default",
          })),
          edges: edges.map((e) => ({
            ...e,
            isPath: e.from === String(prev) && e.to === String(curr),
          })),
        },
        auxiliaryState: {
          stack: [],
          visited: [],
        },
        variables: { startNode, stepsQuery, currentStep: s, curr },
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Completed Successor Paths analysis: Cycle Start = ${cycleStart}, Cycle Length = ${length}, ${stepsQuery}-th Successor = ${curr}.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((gn) => {
          if (gn.id === String(cycleStart)) return { ...gn, state: "sorted" };
          if (gn.id === String(curr)) return { ...gn, state: "active" };
          if (cycleNodesSet.has(Number(gn.id))) return { ...gn, state: "visited" };
          return { ...gn, state: "default" };
        }),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: Array.from(cycleNodesSet).map(String),
      },
      variables: { completed: true, cycleStart, cycleLength: length, kSucc: curr },
    }),
  );

  return steps;
}

export const SUCCESSOR_PATHS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines cycle detection and successor path queries on functional graphs.",
    2: "Pointers start with hare moving twice as fast as tortoise.",
    4: "Advances pointers until tortoise and hare meet inside cycle.",
    8: "Resets tortoise to start_node; both advance at equal speed.",
    14: "Counts vertices around cycle until returning to entry node.",
    21: "Executes k_steps successor queries from starting vertex.",
  },
};

export const successorPaths: AlgorithmDefinition<SuccessorPathsInput> = {
  id: "successor-paths",
  title: "Successor Paths & Floyd's Cycle Detection",
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Medium",
  description:
    "<p>Given a functional graph where every node has out-degree 1 defined by successor array <code>succ[i]</code>, detect directed cycles and answer arbitrary k-step successor queries efficiently.</p><h3>Problem Statement</h3><p>Compute the cycle entry vertex, cycle length, and the k-th successor node using Floyd's Tortoise and Hare algorithm and binary lifting concepts.</p><h3>Input Parameters</h3><ul><li><code>succ</code>: Array of integers where <code>succ[i]</code> is the unique target vertex of node i.</li><li><code>startNode</code>: Starting vertex ID for cycle detection and path queries.</li><li><code>stepsQuery</code>: Integer k representing the number of successor steps to jump.</li></ul><h3>Output</h3><p>Returns the cycle start vertex, cycle length, and the k-th successor vertex ID.</p>",
  constraints: [
    "1 <= V <= 1000",
    "0 <= succ[i] < V for all 0 <= i < V",
    "1 <= stepsQuery k <= 10^9",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "succ = [1, 2, 3, 4, 2, 5, 4], start = 0, k = 5",
      outputDisplay: "Cycle Start: 2, Cycle Length: 3, 5-th Succ: 2",
      title: "Standard Functional Graph with Tail and 3-Cycle",
      input: DEFAULT_SUCCESSOR_INPUT,
      output: "Cycle Start: 2, Cycle Length: 3, 5th Succ: 2",
      explanation: "Path from 0 goes 0 -> 1 -> 2 -> 3 -> 4 -> 2 (cycle 2-3-4).",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "succ = [1, 2, 3, 0], start = 0, k = 10",
      outputDisplay: "Cycle Start: 0, Cycle Length: 4, 10-th Succ: 2",
      title: "Adversarial Pure 4-Node Cycle Graph",
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
      scenario: "boundary",
      inputDisplay: "succ = [0, 0, 1], start = 2, k = 3",
      outputDisplay: "Cycle Start: 0, Cycle Length: 1, 3-rd Succ: 0",
      title: "Boundary Self-Loop Terminal Node Graph",
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
      "<p>A <strong>functional graph</strong> is a directed graph where every vertex has an out-degree of exactly 1. Structural properties of functional graphs guarantee that every connected component consists of directed trees pointing toward a central directed cycle. Querying long paths or cycle properties in functional graphs is efficiently solved using <strong>Floyd's Cycle Detection</strong> and <strong>Binary Lifting</strong>.</p>",
    sections: [
      {
        heading: "Core Concept: Floyd's Tortoise and Hare Cycle Detection",
        body: "<p>Floyd's algorithm uses two pointers moving at different speeds: Tortoise advances 1 step at a time (<code>t = succ[t]</code>), while Hare advances 2 steps (<code>h = succ[succ[h]]</code>). Since the graph component contains a cycle, the Hare is guaranteed to catch the Tortoise inside the cycle. Resetting Tortoise to the start node and stepping both by 1 isolates the exact cycle entry node.</p>",
      },
      {
        heading: "Binary Lifting for Arbitrary Step Queries",
        body: "<p>To compute the <code>k</code>-th successor <code>succ(x, k)</code> for huge step counts (e.g. <code>k = 10<sup>9</sup></code>), standard linear stepping is too slow. Binary lifting precomputes <code>table[b][x] = 2<sup>b</sup></code>-th successor of <code>x</code>. Decomposing <code>k</code> into its binary bit representation allows jumping <code>k</code> steps in <code>O(log k)</code> table lookups.</p>",
      },
      {
        heading: "Applications in Pseudorandomness & Cryptography",
        body: "<p>Functional graphs model deterministic state transitions in pseudorandom number generators (PRNGs), Pollard's rho algorithm for integer factorization, memory pointer chasing, and cellular automata cycle analysis.</p>",
      },
      {
        heading: "Edge Cases & Functional Components",
        body: "<p>Self-loops (<code>succ[x] = x</code>) form 1-cycles. Pure cycle graphs have no incoming tails (all in-degrees = 1). Binary lifting jump tables handle arbitrarily large step counts without stack overflow or infinite loops.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(V + log k)</code><br/><strong>Space Complexity:</strong> <code>O(V log k)</code><br/>Floyd's Tortoise and Hare runs in <code>O(V)</code> time and <code>O(1)</code> space. Precomputes <code>V &times; log k</code> table, answering queries in <code>O(log k)</code> time.</p>",
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

export default successorPaths;
