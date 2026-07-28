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

export const SUCCESSOR_PATHS_TRIVIA: TriviaMeta = {
  skipLines: [5],
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
      hint: "Advances k_steps from start_node following successor pointers.",
    },
  ],
  lineExplanations: {
    1: "Defines cycle detection and successor path queries on functional graphs.",
    2: "Pointers start with hare moving twice as fast as tortoise.",
    4: "Advances pointers until tortoise and hare meet inside the cycle.",
    8: "Resets tortoise to start_node; both advance at equal speed until meeting at cycle entry.",
    14: "Counts vertices around the cycle until returning to the entry node.",
    21: "Executes k_steps successor queries from the starting vertex.",
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

  // Step 0: Algorithm Init
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Functional Graph initialized with ${n} nodes (0 to ${n - 1}). Each node has out-degree 1 defined by succ array.`,
      why: `Goal: Detect directed cycle starting from node ${startNode}, measure cycle length, and query the ${stepsQuery}-th successor.`,
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: {
      customState: {
        "Start Node": startNode,
        "Steps Query (k)": stepsQuery,
        "Succ Array": `[${succ.join(", ")}]`,
      },
    },
    variables: { totalNodes: n, startNode, stepsQuery },
  });

  // Phase 1: Tortoise & Hare Cycle Intersection Search
  let tortoise = succ[startNode];
  let hare = succ[succ[startNode]];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Phase 1: Initialized Tortoise at node ${tortoise} (succ[${startNode}]) and Hare at node ${hare} (succ[succ[${startNode}]]).`,
      why: "Hare advances twice as fast as Tortoise to catch up inside the directed cycle.",
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
        isPath: e.from === String(startNode) || e.from === String(tortoise),
      })),
    },
    auxiliaryState: {
      customState: {
        Phase: "1: Cycle Detection (Fast/Slow Pointers)",
        Tortoise: tortoise,
        Hare: hare,
      },
    },
    variables: { tortoise, hare, startNode },
  });

  let passCount = 0;
  while (tortoise !== hare && passCount < 50) {
    passCount++;
    tortoise = succ[tortoise];
    hare = succ[succ[hare]];

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 4,
      explanation: {
        what: `Phase 1 Step ${passCount}: Tortoise moved 1 step to node ${tortoise}, Hare moved 2 steps to node ${hare}.`,
        why:
          tortoise === hare
            ? `Tortoise and Hare intersected at node ${tortoise} inside the cycle!`
            : "Pointers advance around the graph until intersecting inside the cycle.",
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
        customState: {
          Phase: "1: Cycle Detection (Fast/Slow Pointers)",
          Tortoise: tortoise,
          Hare: hare,
          Iterations: passCount,
        },
      },
      variables: { tortoise, hare, passCount },
    });
  }

  // Phase 2: Find cycle start node
  tortoise = startNode;
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 8,
    explanation: {
      what: `Phase 2: Reset Tortoise to startNode (${startNode}). Hare remains at intersection node ${hare}.`,
      why: "Both pointers will now advance 1 step at a time. The point where they meet is the exact cycle entry node.",
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
      customState: {
        Phase: "2: Cycle Entry Search",
        Tortoise: tortoise,
        Hare: hare,
      },
    },
    variables: { tortoise, hare },
  });

  let phase2Steps = 0;
  while (tortoise !== hare && phase2Steps < 50) {
    phase2Steps++;
    tortoise = succ[tortoise];
    hare = succ[hare];

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 9,
      explanation: {
        what: `Phase 2 Step ${phase2Steps}: Tortoise moved 1 step to node ${tortoise}, Hare moved 1 step to node ${hare}.`,
        why:
          tortoise === hare
            ? `Both pointers met at node ${tortoise}, identifying the cycle entry node!`
            : "Advancing equal-speed pointers towards cycle entry node.",
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
        customState: {
          Phase: "2: Cycle Entry Search",
          Tortoise: tortoise,
          Hare: hare,
        },
      },
      variables: { tortoise, hare },
    });
  }

  const cycleStart = tortoise;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 12,
    explanation: {
      what: `Cycle start identified at node ${cycleStart}.`,
      why: "The meeting point of equal-speed pointers marks entry to the functional cycle.",
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
      customState: {
        Phase: "2 Complete",
        "Cycle Start": cycleStart,
      },
    },
    variables: { cycleStart },
  });

  // Phase 3: Cycle length computation
  let length = 1;
  hare = succ[cycleStart];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 15,
    explanation: {
      what: `Phase 3: Set Hare to succ[cycle_start] (${hare}), length initialized to 1.`,
      why: "Hare will traverse around the cycle until returning to cycleStart to count total vertices in cycle.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((gn) => {
        if (gn.id === String(cycleStart)) return { ...gn, state: "sorted" };
        if (gn.id === String(hare)) return { ...gn, state: "pivot" };
        return { ...gn, state: "default" };
      }),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: {
        Phase: "3: Cycle Length Measurement",
        "Cycle Start": cycleStart,
        Hare: hare,
        "Current Length": length,
      },
    },
    variables: { cycleStart, hare, length },
  });

  const cycleNodesSet = new Set<number>([cycleStart]);
  while (hare !== cycleStart && length < 50) {
    cycleNodesSet.add(hare);
    hare = succ[hare];
    length++;

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 16,
      explanation: {
        what: `Phase 3 Step: Hare advanced to node ${hare}, cycle length = ${length}.`,
        why:
          hare === cycleStart
            ? `Hare returned to cycleStart (${cycleStart}), loop completed!`
            : "Continuing around cycle vertices.",
      },
      primarySnapshot: {
        kind: "graph",
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
        customState: {
          Phase: "3: Cycle Length Measurement",
          "Cycle Start": cycleStart,
          Hare: hare,
          "Current Length": length,
        },
      },
      variables: { cycleStart, hare, length },
    });
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 19,
    explanation: {
      what: `Cycle length total = ${length}.`,
      why: "All nodes in the cycle traversed back to cycleStart.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((gn) => ({
        ...gn,
        state: cycleNodesSet.has(Number(gn.id)) ? "visited" : "default",
      })),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: {
        "Cycle Start": cycleStart,
        "Cycle Length": length,
      },
    },
    variables: { cycleStart, cycleLength: length },
  });

  // Phase 4: Successor query execution (k_steps)
  let curr = startNode;
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 21,
    explanation: {
      what: `Phase 4: Set curr = startNode (${startNode}) to trace ${stepsQuery} successor steps.`,
      why: "Starting traversal along successor pointers from start node.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((gn) => ({
        ...gn,
        state: gn.id === String(curr) ? "active" : "default",
      })),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: {
        Phase: "4: k-step Successor Traversal",
        "Start Node": startNode,
        "Current Node": curr,
        "Steps Remaining": stepsQuery,
      },
    },
    variables: { startNode, stepsQuery, curr },
  });

  for (let s = 1; s <= stepsQuery; s++) {
    const prev = curr;
    curr = succ[curr];

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 23,
      explanation: {
        what: `Phase 4 Step ${s}/${stepsQuery}: Advanced from node ${prev} to node ${curr} (succ[${prev}]).`,
        why:
          s === stepsQuery
            ? `Reached ${stepsQuery}-th successor node ${curr}!`
            : `Continuing successor path traversal (${stepsQuery - s} steps remaining).`,
      },
      primarySnapshot: {
        kind: "graph",
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
        customState: {
          Phase: "4: k-step Successor Traversal",
          "Start Node": startNode,
          "Current Node": curr,
          "Step Number": `${s} / ${stepsQuery}`,
        },
      },
      variables: { startNode, stepsQuery, currentStep: s, curr },
    });
  }

  // Final Step: Return
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 25,
    explanation: {
      what: `Completed Successor Paths analysis: Cycle Start = ${cycleStart}, Cycle Length = ${length}, ${stepsQuery}-th Successor = ${curr}.`,
      why: "Floyd's Cycle Detection and successor path traversal finished successfully.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((gn) => {
        if (gn.id === String(cycleStart)) return { ...gn, state: "sorted" };
        if (gn.id === String(curr)) return { ...gn, state: "active" };
        if (cycleNodesSet.has(Number(gn.id))) return { ...gn, state: "visited" };
        return { ...gn, state: "default" };
      }),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: {
        "Cycle Start": cycleStart,
        "Cycle Length": length,
        [`${stepsQuery}-th Successor`]: curr,
      },
    },
    variables: { cycleStart, cycleLength: length, kSucc: curr },
  });

  return steps;
}

export const successorPaths: AlgorithmDefinition<SuccessorPathsInput> = {
  id: "successor-paths",
  title: "Successor Paths & Floyd's Cycle Detection",
  topicIds: ["graph_directed_and_scc"],
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
      outputDisplay: "Cycle Start: 2, Cycle Length: 3, 5-th Succ: 2",
      title: "Functional Graph with Tail and 3-Cycle",
      input: DEFAULT_SUCCESSOR_INPUT,
      output: "Cycle Start: 2, Cycle Length: 3, 5th Succ: 2",
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
    time: "Floyd's cycle detection visits at most $\\mathcal{O}(V)$ nodes. Binary lifting constructs a binary jump table of size $V \\times \\log(k)$ and answers $k$-th successor queries in $\\mathcal{O}(\\log k)$ time.",
    space: "The binary lifting table takes $\\mathcal{O}(V \\log k)$ memory.",
  },
  topicGuide: {
    overview:
      "A **functional graph** is a directed graph where every vertex has an out-degree of exactly 1. Structural properties of functional graphs guarantee that every connected component consists of directed trees pointing toward a central directed cycle. Querying long paths or cycle properties in functional graphs is efficiently solved using **Floyd's Cycle Detection** and **Binary Lifting**.",
    sections: [
      {
        heading: "Core Concept: Floyd's Tortoise and Hare Cycle Detection",
        body: "Floyd's algorithm uses two pointers moving at different speeds: Tortoise advances 1 step at a time ($t = \\text{succ}[t]$), while Hare advances 2 steps ($h = \\text{succ}[\\text{succ}[h]]$). Since the graph component contains a cycle, the Hare is guaranteed to catch the Tortoise inside the cycle. Resetting Tortoise to the start node and stepping both by 1 isolates the exact cycle entry node.",
      },
      {
        heading: "Binary Lifting for Arbitrary Step Queries",
        body: "To compute the $k$-th successor $\\text{succ}(x, k)$ for huge step counts (e.g. $k = 10^9$), standard linear stepping is too slow. Binary lifting precomputes $\\text{table}[b][x] = 2^b$-th successor of $x$. Decomposing $k$ into its binary bit representation allows jumping $k$ steps in $\\mathcal{O}(\\log k)$ table lookups.",
      },
      {
        heading: "Applications in Pseudorandomness & Cryptography",
        body: "Functional graphs model deterministic state transitions in pseudorandom number generators (PRNGs), Pollard's rho algorithm for integer factorization, memory pointer chasing, and cellular automata cycle analysis.",
      },
      {
        heading: "Edge Cases & Functional Components",
        body: "Self-loops ($\\text{succ}[x] = x$) form 1-cycles. Pure cycle graphs have no incoming tails (all in-degrees = 1). Binary lifting jump tables handle arbitrarily large step counts without stack overflow or infinite loops.",
      },
      {
        heading: "Complexity Analysis",
        body: "$$\\text{Time Complexity}: \\mathcal{O}(V + \\log k)$$\n$$\\text{Space Complexity}: \\mathcal{O}(V \\log k)$$\n- **Cycle Detection**: Floyd's Tortoise and Hare runs in $\\mathcal{O}(V)$ time and $\\mathcal{O}(1)$ space.\n- **Binary Lifting Query**: Precomputes $V \\times \\log k$ table, answering queries in $\\mathcal{O}(\\log k)$ time.",
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
          "An $\\mathcal{O}(V)$ time, $\\mathcal{O}(1)$ space two-pointer algorithm for detecting cycles in linked structures or functional graphs.",
      },
      {
        term: "Binary Lifting",
        definition:
          "A dynamic programming technique precomputing $2^i$ ancestors or successors to enable $\\mathcal{O}(\\log k)$ query traversal.",
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
