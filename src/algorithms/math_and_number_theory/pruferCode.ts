import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface PruferCodeInput {
  edges: [number, number][];
}

export const PYTHON_PRUFER_CODE_CODE = `def prufer_code(n: int, edges: list[list[int]]) -> list[int]:
    degree = [0] * n
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
        degree[u] += 1
        degree[v] += 1
    
    ptr = 0
    while ptr < n and degree[ptr] != 1:
        ptr += 1
    
    leaf = ptr
    code = []
    
    for _ in range(n - 2):
        v = adj[leaf][0]
        code.append(v)
        degree[v] -= 1
        adj[leaf].remove(v)
        adj[v].remove(leaf)
        
        if v < ptr and degree[v] == 1:
            leaf = v
        else:
            ptr += 1
            while ptr < n and degree[ptr] != 1:
                ptr += 1
            leaf = ptr
            
    return code`;

export const DEFAULT_PRUFER_CODE_INPUT: PruferCodeInput = {
  edges: [
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 4],
    [4, 5],
  ],
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const getIntroNodes = (
    activeLeaf?: number,
    activeNeighbor?: number,
    prunedNodes: number[] = [],
    nodeStateOverride?: ElementState,
  ): GraphNodeItem[] => {
    const rawPos = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 300, y: 100 },
      { x: 200, y: 200 },
      { x: 200, y: 300 },
      { x: 200, y: 400 },
    ];

    return Array.from({ length: 6 }, (_, i) => {
      let state: ElementState = nodeStateOverride ?? "default";
      if (prunedNodes.includes(i)) {
        state = "visited";
      } else if (i === activeLeaf) {
        state = "active";
      } else if (i === activeNeighbor) {
        state = "pivot";
      }

      return {
        id: `intro-node-${i}`,
        label: `${i}`,
        state,
        x: rawPos[i].x,
        y: rawPos[i].y,
      };
    });
  };

  const getIntroEdges = (prunedNodes: number[] = []): GraphEdgeItem[] => {
    const rawEdges: [number, number][] = [
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 4],
      [4, 5],
    ];

    return rawEdges.map(([u, v]) => {
      const isPruned = prunedNodes.includes(u) || prunedNodes.includes(v);
      return {
        from: `intro-node-${u}`,
        to: `intro-node-${v}`,
        state: isPruned ? "rejected" : "default",
      };
    });
  };

  const introData = [
    {
      narrative:
        "A Prüfer code uniquely encodes a labeled tree with n vertices into a sequence of n - 2 integer labels between 0 and n - 1.",
      code: [],
      degrees: [1, 1, 1, 4, 2, 1],
      pruned: [],
      activeLeaf: undefined,
      activeNeighbor: undefined,
      nodeState: "default" as ElementState,
      vars: { "Tree Nodes n": 6, "Code Length": 4 },
    },
    {
      narrative:
        "Cayley's Formula states that there are exactly n^(n-2) distinct labeled trees on n vertices, proved by the bijective mapping of Prüfer codes.",
      code: [],
      degrees: [1, 1, 1, 4, 2, 1],
      pruned: [],
      activeLeaf: undefined,
      activeNeighbor: undefined,
      nodeState: "pivot" as ElementState,
      vars: { Formula: "n^(n-2)", "For n = 6": "6^4 = 1296 trees" },
    },
    {
      narrative:
        "A tree with n >= 2 vertices always contains at least two leaf nodes (vertices with degree equal to 1).",
      code: [],
      degrees: [1, 1, 1, 4, 2, 1],
      pruned: [],
      activeLeaf: 0,
      activeNeighbor: undefined,
      nodeState: undefined,
      vars: { "Leaves (degree 1)": "Nodes 0, 1, 2, 5" },
    },
    {
      narrative:
        "The encoding algorithm iteratively finds the leaf with the smallest label, appends its unique neighbor to the sequence, and prunes the leaf from the tree.",
      code: [3],
      degrees: [0, 1, 1, 3, 2, 1],
      pruned: [0],
      activeLeaf: 0,
      activeNeighbor: 3,
      nodeState: undefined,
      vars: { "Smallest Leaf": 0, Neighbor: 3, Action: "Append 3 to code" },
    },
    {
      narrative:
        "This pruning step repeats exactly n - 2 times until only two connected vertices remain, which carry no further sequence information.",
      code: [3, 3, 3, 4],
      degrees: [0, 0, 0, 1, 1, 0],
      pruned: [0, 1, 2, 5],
      activeLeaf: 5,
      activeNeighbor: 4,
      nodeState: undefined,
      vars: { "Pruned Steps": "n - 2", "Remaining Nodes": "3 and 4" },
    },
    {
      narrative:
        "Each vertex v appears in the Prüfer code sequence exactly (degree(v) - 1) times. Vertices never appearing in the code are the original leaves.",
      code: [3, 3, 3, 4],
      degrees: [1, 1, 1, 4, 2, 1],
      pruned: [],
      activeLeaf: 3,
      activeNeighbor: undefined,
      nodeState: undefined,
      vars: { "Frequency of 3": "3 times (deg 4 - 1)", "Leaves Frequency": "0 times" },
    },
    {
      narrative:
        "Maintaining a pointer ptr and a degree array accelerates leaf identification from naive O(n^2) to linear O(n) total runtime.",
      code: [3, 3, 3, 4],
      degrees: [1, 1, 1, 4, 2, 1],
      pruned: [],
      activeLeaf: undefined,
      activeNeighbor: undefined,
      nodeState: "compare" as ElementState,
      vars: { "Pointer ptr": 0, "Time Complexity": "O(n) linear" },
    },
    {
      narrative:
        "The reverse decoding algorithm reconstructs the original tree by pairing the smallest available degree-1 vertex with each element in the code.",
      code: [3, 3, 3, 4],
      degrees: [1, 1, 1, 4, 2, 1],
      pruned: [],
      activeLeaf: undefined,
      activeNeighbor: undefined,
      nodeState: "active" as ElementState,
      vars: { Mapping: "1-to-1 Bijective", Operation: "Reconstruct Tree" },
    },
    {
      narrative:
        "Prüfer encoding uses O(n) space to maintain adjacency lists, degree vectors, and the output Prüfer code sequence.",
      code: [3, 3, 3, 4],
      degrees: [1, 1, 1, 4, 2, 1],
      pruned: [],
      activeLeaf: undefined,
      activeNeighbor: undefined,
      nodeState: "sorted" as ElementState,
      vars: { "Space Complexity": "O(n)", "Time Complexity": "O(n)" },
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      variables: data.vars,
      primarySnapshot: {
        kind: "composite",
        layout: "horizontal",
        heading: "Prüfer Code Tree Encoding",
        items: [
          {
            id: "tree_graph",
            role: "primary",
            snapshot: {
              kind: "graph",
              name: "tree",
              directed: false,
              nodes: getIntroNodes(
                data.activeLeaf,
                data.activeNeighbor,
                data.pruned,
                data.nodeState,
              ),
              edges: getIntroEdges(data.pruned),
            },
          },
          {
            id: "code_sequence",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "prufer_sequence",
              mode: "box",
              elements:
                data.code.length > 0
                  ? data.code.map((val, cIdx) => ({
                      id: `intro-c-${cIdx}`,
                      value: val,
                      label: `code[${cIdx}]`,
                      state: "sorted" as ElementState,
                    }))
                  : [
                      {
                        id: "intro-c-empty",
                        value: "Empty",
                        label: "code",
                        state: "default" as ElementState,
                      },
                    ],
            },
          },
          {
            id: "degree_vector",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "degrees",
              mode: "box",
              elements: data.degrees.map((dVal, dIdx) => ({
                id: `intro-d-${dIdx}`,
                value: dVal,
                label: `deg(${dIdx})`,
                state: dVal === 1 ? ("active" as ElementState) : ("default" as ElementState),
              })),
            },
          },
        ],
      },
    }),
  );
};

export const generatePruferCodeSteps = (input?: PruferCodeInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawEdges =
    input?.edges && Array.isArray(input.edges) && input.edges.length > 0
      ? input.edges
      : DEFAULT_PRUFER_CODE_INPUT.edges;

  // Find number of vertices n
  let maxNode = 0;
  for (const [u, v] of rawEdges) {
    if (u > maxNode) maxNode = u;
    if (v > maxNode) maxNode = v;
  }
  const n = maxNode + 1;

  // Build adjacency list and initial degrees
  const adj = new Map<number, Set<number>>();
  const degree = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    adj.set(i, new Set<number>());
  }

  for (const [u, v] of rawEdges) {
    adj.get(u)!.add(v);
    adj.get(v)!.add(u);
    degree[u]++;
    degree[v]++;
  }

  // Active / removed state for graph snapshot
  const activeNodes = new Set<number>(Array.from({ length: n }, (_, i) => i));
  const activeEdges = new Set<string>();
  for (const [u, v] of rawEdges) {
    const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
    activeEdges.add(edgeKey);
  }

  // Layout positions for nodes in a circle or neat grid
  const nodePositions: { x: number; y: number }[] = [];
  const radius = 180;
  const centerX = 220;
  const centerY = 220;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    nodePositions.push({
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle)),
    });
  }

  const createCompositeSnapshot = (
    currentLeaf?: number,
    currentNeighbor?: number,
    currentCode: number[] = [],
    currentDegrees: number[] = [...degree],
    ptrVal: number = 0,
    headingText: string = "Prüfer Code Encoding",
    isFinal: boolean = false,
  ) => {
    const graphNodes: GraphNodeItem[] = Array.from({ length: n }, (_, i) => {
      let state: ElementState = "default";
      if (!activeNodes.has(i)) {
        state = "visited";
      } else if (i === currentLeaf) {
        state = "active";
      } else if (i === currentNeighbor) {
        state = "pivot";
      } else if (currentDegrees[i] === 1) {
        state = "compare";
      }

      return {
        id: `node-${i}`,
        label: `${i}`,
        x: nodePositions[i].x,
        y: nodePositions[i].y,
        state,
      };
    });

    const graphEdges: GraphEdgeItem[] = [];
    for (const [u, v] of rawEdges) {
      const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
      const isPresent = activeEdges.has(edgeKey);
      const isCurrentActive =
        isPresent &&
        ((u === currentLeaf && v === currentNeighbor) ||
          (v === currentLeaf && u === currentNeighbor));

      graphEdges.push({
        from: `node-${u}`,
        to: `node-${v}`,
        state: isCurrentActive ? "candidate" : isPresent ? "default" : "rejected",
        isTraversed: isCurrentActive,
      });
    }

    const codeElements: ArrayElement[] =
      currentCode.length > 0
        ? currentCode.map((val, idx) => ({
            id: `code-${idx}`,
            value: val,
            label: `code[${idx}]`,
            state: isFinal ? ("sorted" as ElementState) : ("active" as ElementState),
          }))
        : [
            {
              id: "code-empty",
              value: "Empty",
              label: "code",
              state: "default" as ElementState,
            },
          ];

    const degreeElements: ArrayElement[] = currentDegrees.map((dVal, i) => ({
      id: `deg-${i}`,
      value: dVal,
      label: `deg(${i})`,
      state: !activeNodes.has(i)
        ? ("visited" as ElementState)
        : i === currentLeaf
          ? ("active" as ElementState)
          : i === currentNeighbor
            ? ("pivot" as ElementState)
            : dVal === 1
              ? ("compare" as ElementState)
              : ("default" as ElementState),
      pointers: i === ptrVal ? ["ptr"] : undefined,
    }));

    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: headingText,
      items: [
        {
          id: "tree_graph",
          role: "primary" as const,
          snapshot: {
            kind: "graph" as const,
            name: "tree",
            directed: false,
            nodes: graphNodes,
            edges: graphEdges,
          },
        },
        {
          id: "code_sequence",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "prufer_sequence",
            mode: "box" as const,
            elements: codeElements,
          },
        },
        {
          id: "degree_vector",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "degrees",
            mode: "box" as const,
            elements: degreeElements,
          },
        },
      ],
    };
  };

  // Step 1: Initialize
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize Prüfer encoding for tree on ${n} vertices with degree array [${degree.join(", ")}]. Target code length is n - 2 = ${n - 2}.`,
      variables: {
        "Tree Vertices n": n,
        "Target Code Length": Math.max(0, n - 2),
        "Initial Degrees": degree.join(", "),
        "Pointer ptr": 0,
      },
      primarySnapshot: createCompositeSnapshot(
        undefined,
        undefined,
        [],
        [...degree],
        0,
        "Initialization",
      ),
    }),
  );

  // Boundary case n <= 2
  if (n <= 2) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Tree has n = ${n} <= 2 vertices. No edge pruning is needed; the output Prüfer code sequence is empty [].`,
        variables: {
          "Tree Vertices n": n,
          "Prüfer Code": "[]",
          Result: "Empty sequence",
        },
        primarySnapshot: createCompositeSnapshot(
          undefined,
          undefined,
          [],
          [...degree],
          0,
          "Boundary Execution",
          true,
        ),
      }),
    );
    return steps;
  }

  // Linear Prüfer code algorithm execution
  let ptr = 0;
  while (ptr < n && degree[ptr] !== 1) {
    ptr++;
  }
  let leaf = ptr;

  const code: number[] = [];
  const runningDegrees = [...degree];

  for (let stepCount = 0; stepCount < n - 2; stepCount++) {
    // Sole neighbor of current leaf
    const neighbors = Array.from(adj.get(leaf)!);
    const v = neighbors[0];

    // Inspect frame
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Step ${stepCount + 1}/${n - 2}: identified smallest degree-1 leaf node ${leaf}. Its unique connected neighbor in the tree is node ${v}.`,
        variables: {
          "Pruning Step": `${stepCount + 1}/${n - 2}`,
          "Selected Leaf": leaf,
          "Unique Neighbor v": v,
          "Pointer ptr": ptr,
        },
        primarySnapshot: createCompositeSnapshot(
          leaf,
          v,
          [...code],
          [...runningDegrees],
          ptr,
          `Inspecting Leaf ${leaf}`,
        ),
      }),
    );

    // Append v to code and update structures
    code.push(v);
    runningDegrees[leaf]--;
    runningDegrees[v]--;
    adj.get(leaf)!.delete(v);
    adj.get(v)!.delete(leaf);

    activeNodes.delete(leaf);
    const edgeKey = leaf < v ? `${leaf}-${v}` : `${v}-${leaf}`;
    activeEdges.delete(edgeKey);

    // Determine next leaf
    let nextLeaf: number;
    if (v < ptr && runningDegrees[v] === 1) {
      nextLeaf = v;
    } else {
      ptr++;
      while (ptr < n && runningDegrees[ptr] !== 1) {
        ptr++;
      }
      nextLeaf = ptr;
    }

    // Consequence frame
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Appended neighbor node ${v} to Prüfer code sequence and pruned leaf node ${leaf} from the tree. Updated degrees: deg(${v}) = ${runningDegrees[v]}. Next leaf is node ${nextLeaf}.`,
        variables: {
          "Appended Code Element": v,
          "Pruned Node": leaf,
          "Current Code Sequence": `[${code.join(", ")}]`,
          "Next Target Leaf": nextLeaf,
          "Pointer ptr": ptr,
        },
        primarySnapshot: createCompositeSnapshot(
          leaf,
          v,
          [...code],
          [...runningDegrees],
          ptr,
          `Pruned Leaf ${leaf} -> Added ${v}`,
        ),
      }),
    );

    leaf = nextLeaf;
  }

  // Completion step
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Prüfer code encoding complete: generated sequence [${code.join(", ")}] of length ${code.length}. Exactly 2 connected vertices remain in the tree.`,
      variables: {
        "Final Prüfer Code": `[${code.join(", ")}]`,
        "Code Length": code.length,
        "Remaining Vertices": Array.from(activeNodes).join(", "),
      },
      primarySnapshot: createCompositeSnapshot(
        undefined,
        undefined,
        [...code],
        [...runningDegrees],
        ptr,
        "Encoding Complete",
        true,
      ),
    }),
  );

  return steps;
};

export const PRUFER_CODE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The Prüfer code is a unique sequence of <code>n - 2</code> integers encoding a labeled tree on <code>n</code> vertices. It establishes a 1-to-1 bijection between labeled trees and sequences, directly proving Cayley's formula <code>n<sup>n-2</sup></code>.</p>",
  sections: [
    {
      heading: "Leaf Pruning Mechanism",
      body: "<p>The encoding algorithm repeatedly finds the leaf with the smallest integer label, appends its unique neighbor to the sequence, and prunes the leaf. The process halts when exactly 2 connected vertices remain.</p>",
    },
    {
      heading: "Linear O(n) Encoding & Cayley's Formula",
      body: "<p>By maintaining a pointer <code>ptr</code> and a degree array, leaf selection runs in <code>O(n)</code> linear time. Because each of the <code>n - 2</code> positions in the sequence can take any of the <code>n</code> vertex labels independently, there exist exactly <code>n<sup>n-2</sup></code> distinct labeled trees on <code>n</code> vertices.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Prüfer Sequence",
      definition: "A sequence of n - 2 labels representing a labeled tree on n vertices.",
    },
    {
      term: "Cayley's Formula",
      definition:
        "The mathematical theorem stating there are n^(n-2) distinct labeled trees on n vertices.",
    },
  ],
};

export const PRUFER_CODE_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const pruferCode: AlgorithmDefinition<PruferCodeInput> = {
  id: "prufer-code",
  title: "Prüfer Code & Cayley's Formula",
  topicIds: ["math_and_number_theory"],
  difficulty: "Hard",
  description:
    "<p>Generate the Prüfer code for a labeled tree on <code>n</code> vertices, demonstrating the bijective encoding that proves Cayley's formula <code>n<sup>n-2</sup></code>.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>edges</code> (<code>int[][]</code>): Array of undirected edge pairs <code>[u, v]</code> defining a labeled tree.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int[]</code>: The <code>n - 2</code> length Prüfer sequence.</li></ul>",
  constraints: ["1 <= n <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Star/Tree (6 Vertices)",
      input: {
        edges: [
          [0, 3],
          [1, 3],
          [2, 3],
          [3, 4],
          [4, 5],
        ],
      },
      output: "[3, 3, 3, 4]",
      explanation: "Sequentially prunes leaves 0, 1, 2, 5, yielding code [3, 3, 3, 4].",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Boundary Case (2 Vertices)",
      input: { edges: [[0, 1]] },
      output: "[]",
      explanation: "A 2-vertex tree requires 0 pruning steps, producing an empty code sequence [].",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Adversarial Line Graph (4 Vertices)",
      input: {
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      },
      output: "[1, 2]",
      explanation: "Prunes leaves 0 then 3, yielding code [1, 2].",
    },
  ],
  code: PYTHON_PRUFER_CODE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear-time Prüfer code generation using degree array and pointer.",
    space: "O(N) auxiliary space to store adjacency lists, degrees, and code sequence.",
  },
  topicGuide: PRUFER_CODE_TOPIC_GUIDE,
  trivia: PRUFER_CODE_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 2477,
      leetcodeId: 2477,
      url: "https://leetcode.com/problems/minimum-fuel-cost-to-report-to-the-capital/",
      label: "LeetCode #2477",
      title: "Minimum Fuel Cost to Report to the Capital",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      chapterTitle: "Combinatorics",
      section: "22.5 Cayley's formula & Prüfer sequence",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 2477,
    url: "https://leetcode.com/problems/minimum-fuel-cost-to-report-to-the-capital/",
  },
  defaultInput: DEFAULT_PRUFER_CODE_INPUT,
  generateSteps: generatePruferCodeSteps,
};

export default pruferCode;
