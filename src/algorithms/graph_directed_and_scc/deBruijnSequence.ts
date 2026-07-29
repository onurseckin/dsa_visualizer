import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface DeBruijnSequenceInput {
  k: number;
  n: number;
  alphabet?: string[];
}

export const DE_BRUIJN_CODE = `def de_bruijn(k, n):
    alphabet = [str(i) for i in range(k)]
    starting_node = "0" * (n - 1) if n > 1 else ""
    adj = {}
    
    def generate_nodes(curr):
        if len(curr) == n - 1:
            adj[curr] = [curr[1:] + c for c in alphabet]
            return
        for c in alphabet:
            generate_nodes(curr + c)
            
    generate_nodes("")
    stack = [starting_node]
    circuit = []
    
    while stack:
        u = stack[-1]
        if u in adj and adj[u]:
            v = adj[u].pop()
            stack.append(v)
        else:
            circuit.append(stack.pop())
            
    sequence = circuit[-1] if circuit else ""
    for node in reversed(circuit[:-1]):
        sequence += node[-1] if n > 1 else node
        
    return sequence`;

export const DEFAULT_DE_BRUIJN_INPUT: DeBruijnSequenceInput = {
  k: 2,
  n: 3,
};

function generateCombinations(alphabet: string[], length: number): string[] {
  if (length === 0) return [""];
  const res: string[] = [];
  function backtrack(curr: string) {
    if (curr.length === length) {
      res.push(curr);
      return;
    }
    for (const char of alphabet) {
      backtrack(curr + char);
    }
  }
  backtrack("");
  return res;
}

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A De Bruijn sequence B(k, n) is a minimal cyclic sequence of length k^n containing every possible length-n substring over a size-k alphabet exactly once.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "00", label: "00", state: "active" },
        { id: "01", label: "01", state: "default" },
        { id: "10", label: "10", state: "default" },
        { id: "11", label: "11", state: "default" },
      ],
      edges: [
        { from: "00", to: "00", weight: 0 },
        { from: "00", to: "01", weight: 1 },
        { from: "01", to: "10", weight: 0 },
        { from: "01", to: "11", weight: 1 },
      ],
    },
  },
  {
    narrative:
      "Naive concatenation of all k^n length-n strings requires n * k^n symbols, whereas De Bruijn sequences compress total length to k^n by overlapping adjacent n-1 characters.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "00", label: "00", state: "visited" },
        { id: "01", label: "01 (Overlap)", state: "swap" },
        { id: "11", label: "11", state: "visited" },
      ],
      edges: [
        { from: "00", to: "01", weight: 1, isTraversed: true },
        { from: "01", to: "11", weight: 1, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "The De Bruijn Graph represents length-(n-1) state prefixes as vertices, and length-n transitions as directed edges labeled with the next appended character c.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "00", label: "00 (Prefix)", state: "active" },
        { id: "01", label: "01", state: "default" },
        { id: "10", label: "10", state: "default" },
        { id: "11", label: "11", state: "default" },
      ],
      edges: [
        { from: "00", to: "01", weight: 1 },
        { from: "01", to: "10", weight: 0 },
        { from: "10", to: "01", weight: 1 },
      ],
    },
  },
  {
    narrative:
      "Because every state node has in_degree = k and out_degree = k, the De Bruijn Graph is balanced and guaranteed to contain an Eulerian Circuit.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "00", label: "00 (in:2, out:2)", state: "visited" },
        { id: "01", label: "01 (in:2, out:2)", state: "visited" },
        { id: "10", label: "10 (in:2, out:2)", state: "visited" },
        { id: "11", label: "11 (in:2, out:2)", state: "visited" },
      ],
      edges: [
        { from: "00", to: "00", weight: 0 },
        { from: "00", to: "01", weight: 1 },
        { from: "01", to: "10", weight: 0 },
        { from: "01", to: "11", weight: 1 },
      ],
    },
  },
  {
    narrative:
      "Constructing the graph involves generating all k^(n-1) state vertices and k^n directed transition edges for alphabet size k and substring length n.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "00", label: "State 00", state: "active" },
        { id: "01", label: "State 01", state: "active" },
        { id: "10", label: "State 10", state: "active" },
        { id: "11", label: "State 11", state: "active" },
      ],
      edges: [
        { from: "00", to: "00", weight: 0 },
        { from: "00", to: "01", weight: 1 },
        { from: "01", to: "10", weight: 0 },
        { from: "01", to: "11", weight: 1 },
      ],
    },
  },
  {
    narrative:
      "Hierholzer's algorithm initializes a LIFO stack at start state 0^(n-1) to traverse directed transition edges without duplicating any transition.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "00", label: "Start 00", state: "active" },
        { id: "01", label: "01", state: "default" },
        { id: "10", label: "10", state: "default" },
        { id: "11", label: "11", state: "default" },
      ],
      edges: [
        { from: "00", to: "00", weight: 0 },
        { from: "00", to: "01", weight: 1 },
      ],
    },
  },
  {
    narrative:
      "Following unvisited outgoing transition edges consumes transitions and pushes target state nodes onto the active traversal stack.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "00", label: "Stack 00", state: "visited" },
        { id: "01", label: "Top 01", state: "swap" },
        { id: "10", label: "10", state: "default" },
        { id: "11", label: "11", state: "default" },
      ],
      edges: [
        { from: "00", to: "01", weight: 1, isTraversed: true },
        { from: "01", to: "11", weight: 1 },
      ],
    },
  },
  {
    narrative:
      "When a top state has no remaining unvisited outgoing transitions, popping it onto a post-order circuit array seals sub-cycles cleanly.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "00", label: "Stack 00", state: "visited" },
        { id: "01", label: "Stack 01", state: "visited" },
        { id: "11", label: "Circuit 11", state: "sorted" },
      ],
      edges: [
        { from: "00", to: "01", weight: 1, isTraversed: true },
        { from: "01", to: "11", weight: 1, isPath: true },
      ],
    },
  },
  {
    narrative:
      "Extracting trailing symbols from each state in the reversed Eulerian circuit builds minimal sequence B(k, n) in optimal linear O(k^n) time.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "00", label: "00011101", state: "sorted" },
        { id: "01", label: "01", state: "sorted" },
        { id: "10", label: "10", state: "sorted" },
        { id: "11", label: "11", state: "sorted" },
      ],
      edges: [
        { from: "00", to: "01", weight: 1, isPath: true },
        { from: "01", to: "11", weight: 1, isPath: true },
        { from: "11", to: "10", weight: 0, isPath: true },
        { from: "10", to: "01", weight: 1, isPath: true },
      ],
    },
  },
];

export function generateDeBruijnSteps(input: DeBruijnSequenceInput): AlgorithmStep[] {
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
  const safeInput = input && typeof input === "object" ? input : DEFAULT_DE_BRUIJN_INPUT;
  const k = Math.max(2, Math.min(safeInput.k ?? DEFAULT_DE_BRUIJN_INPUT.k, 4));
  const n = Math.max(2, Math.min(safeInput.n ?? DEFAULT_DE_BRUIJN_INPUT.n, 4));
  const alphabet = Array.isArray(safeInput.alphabet)
    ? safeInput.alphabet
    : Array.from({ length: k }, (_, i) => String(i));

  const prefixLen = n - 1;
  const nodeLabels = generateCombinations(alphabet, prefixLen);

  const radius = 140;
  const centerX = 250;
  const centerY = 180;

  const graphNodes: GraphNodeItem[] = nodeLabels.map((label, idx) => {
    const angle = (2 * Math.PI * idx) / nodeLabels.length - Math.PI / 2;
    return {
      id: label,
      label,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      state: "default",
    };
  });

  const graphEdges: GraphEdgeItem[] = [];
  const adj: Record<string, Array<{ to: string; char: string }>> = {};

  for (const node of nodeLabels) {
    adj[node] = [];
    for (const char of alphabet) {
      const nxt = node.slice(1) + char;
      adj[node].push({ to: nxt, char });
      graphEdges.push({
        from: node,
        to: nxt,
        weight: Number.parseInt(char, 10) || 0,
      });
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Constructed De Bruijn Graph for alphabet size k=${k}, substring length n=${n}. Total state vertices = ${graphNodes.length}, total transitions = ${graphEdges.length}.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: graphNodes.map((gn) => ({ ...gn, state: "active" })),
        edges: [...graphEdges],
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { k, n, totalNodes: graphNodes.length, totalEdges: graphEdges.length },
    }),
  );

  const start = nodeLabels[0];
  const stack: string[] = [start];
  const circuit: string[] = [];
  const edgeUsed: Record<string, boolean> = {};

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized Eulerian Circuit traversal stack with starting state "${start}".`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: graphNodes.map((gn) => ({
          ...gn,
          state: gn.id === start ? "compare" : "default",
        })),
        edges: [...graphEdges],
      },
      auxiliaryState: {
        stack: [...stack],
        visited: [],
      },
      variables: { start, stackSize: stack.length },
    }),
  );

  while (stack.length > 0) {
    const curr = stack[stack.length - 1];

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Inspecting top state node "${curr}": checking for untraversed transitions (${adj[curr]?.length ?? 0} remaining).`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: graphNodes.map((gn) => ({
            ...gn,
            state: gn.id === curr ? "active" : stack.includes(gn.id) ? "visited" : "default",
          })),
          edges: graphEdges.map((ge) => ({
            ...ge,
            isTraversed: !!edgeUsed[`${ge.from}->${ge.to}-${ge.weight ?? 0}`],
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          visited: [...circuit],
        },
        variables: { curr, remainingTransitions: adj[curr]?.length ?? 0 },
      }),
    );

    if (adj[curr] && adj[curr].length > 0) {
      const item = adj[curr].pop()!;
      const nxt = item.to;

      const edgeObj =
        graphEdges.find(
          (e) =>
            e.from === curr &&
            e.to === nxt &&
            String(e.weight) === item.char &&
            !edgeUsed[`${e.from}->${e.to}-${e.weight}`],
        ) ||
        graphEdges.find((e) => e.from === curr && e.to === nxt && !edgeUsed[`${e.from}->${e.to}`]);

      if (edgeObj) {
        edgeUsed[`${edgeObj.from}->${edgeObj.to}-${edgeObj.weight ?? 0}`] = true;
      }

      stack.push(nxt);

      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Traversed transition "${curr}" -> "${nxt}" (symbol '${item.char}') and pushed state "${nxt}" onto stack.`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: graphNodes.map((gn) => ({
              ...gn,
              state: gn.id === nxt ? "swap" : stack.includes(gn.id) ? "visited" : "default",
            })),
            edges: graphEdges.map((ge) => ({
              ...ge,
              isTraversed: !!edgeUsed[`${ge.from}->${ge.to}-${ge.weight ?? 0}`],
              isPath: ge.from === curr && ge.to === nxt,
            })),
          },
          auxiliaryState: {
            stack: [...stack],
            visited: [...circuit],
          },
          variables: { current: curr, next: nxt, symbol: item.char },
        }),
      );
    } else {
      const popped = stack.pop()!;
      circuit.push(popped);

      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Popped state node "${popped}" to Eulerian circuit list: [${circuit.join(", ")}].`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: graphNodes.map((gn) => ({
              ...gn,
              state: circuit.includes(gn.id)
                ? "sorted"
                : stack.includes(gn.id)
                  ? "visited"
                  : "default",
            })),
            edges: graphEdges.map((ge) => ({
              ...ge,
              isTraversed: !!edgeUsed[`${ge.from}->${ge.to}-${ge.weight ?? 0}`],
            })),
          },
          auxiliaryState: {
            stack: [...stack],
            visited: [...circuit],
          },
          variables: { popped, circuitLength: circuit.length },
        }),
      );
    }
  }

  let sequence = circuit.length > 0 ? circuit[circuit.length - 1] : "";
  const revCircuit = [...circuit].reverse();
  for (let i = 1; i < revCircuit.length; i++) {
    const node = revCircuit[i];
    sequence += n > 1 ? node[node.length - 1] : node;
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Constructed De Bruijn sequence B(${k},${n}) = "${sequence}". Contains all ${Math.pow(k, n)} substrings of length ${n}.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: graphNodes.map((gn) => ({ ...gn, state: "sorted" })),
        edges: graphEdges.map((ge) => ({ ...ge, isPath: true, isTraversed: true })),
      },
      auxiliaryState: {
        visited: [...circuit],
        stack: [],
      },
      variables: { completed: true, sequence, sequenceLength: sequence.length },
    }),
  );

  return steps;
}

export const DE_BRUIJN_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines de_bruijn(k, n) function generating minimal length k^n cyclic sequence.",
    2: "Builds character alphabet array of size k.",
    3: "Initializes starting node string of length n - 1.",
    4: "Initializes graph adjacency list map adj.",
    6: "Defines recursive helper generate_nodes(curr) to build state prefixes.",
    7: "Base case check: when current prefix length equals n - 1.",
    8: "Creates outgoing transition edges for node.",
    9: "Returns from base case recursion.",
    10: "Iterates over alphabet characters.",
    11: "Recursively calls generate_nodes(curr + c).",
    13: "Launches node generation.",
    14: "Initializes traversal stack with starting_node.",
    15: "Initializes empty circuit list.",
    17: "Drives main loop while traversal stack contains active nodes.",
    18: "Peeks top state node u from stack.",
    19: "Checks if state u has untraversed outgoing edges.",
    20: "Pops next target state v.",
    21: "Pushes target state v onto stack.",
    23: "Pops dead-end state u and appends to circuit.",
    25: "Initializes output sequence.",
    26: "Iterates over circuit state nodes in reverse order.",
    27: "Appends last character of each state node to sequence string.",
    29: "Returns final De Bruijn sequence B(k, n).",
  },
};

export const deBruijnSequence: AlgorithmDefinition<DeBruijnSequenceInput> = {
  id: "de-bruijn-sequence",
  title: "De Bruijn Sequence Generator",
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "<p>Given an alphabet size <code>k</code> and substring length <code>n</code>, generate a minimal cyclic De Bruijn sequence <code>B(k, n)</code> containing every possible length-n combination over the size-k alphabet exactly once as a substring.</p><h3>Problem Statement</h3><p>Construct a directed De Bruijn graph where vertices represent length-(n-1) state prefixes and edges represent length-n transitions. Compute an Eulerian circuit using Hierholzer's algorithm to output the minimal sequence.</p><h3>Input Parameters</h3><ul><li><code>k</code>: Size of the character alphabet (e.g. 2 for binary '0','1').</li><li><code>n</code>: Length of each target substring combination.</li><li><code>alphabet</code>: Optional array of character symbols.</li></ul><h3>Output</h3><p>Returns a string representing the minimal De Bruijn sequence B(k, n).</p>",
  constraints: [
    "2 <= Alphabet Size k <= 4",
    "2 <= Substring Length n <= 4",
    "Generated sequence length equals k^n",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "k=2 (binary), n=3",
      outputDisplay: '"00011101"',
      title: "Standard Binary 3-Bit De Bruijn Sequence",
      input: DEFAULT_DE_BRUIJN_INPUT,
      output: '"00011101"',
      explanation:
        'Sequence of length 8 contains all 8 3-bit binary combinations ("000", "001", "011", "111", "110", "101", "010", "100") cyclically.',
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "k=3 (ternary), n=2",
      outputDisplay: '"001221021"',
      title: "Adversarial Ternary 2-Digit De Bruijn Sequence",
      input: {
        k: 3,
        n: 2,
        alphabet: ["0", "1", "2"],
      },
      output: '"001221021"',
      explanation:
        "Ternary alphabet with 9 combinations of length 2 mapped via 3-vertex De Bruijn graph.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "k=2 (binary), n=2",
      outputDisplay: '"0011"',
      title: "Boundary Binary 2-Bit De Bruijn Sequence",
      input: {
        k: 2,
        n: 2,
      },
      output: '"0011"',
      explanation:
        "Minimal 4-character binary sequence containing all 4 2-bit combinations ('00', '01', '11', '10').",
    },
  ],
  code: DE_BRUIJN_CODE,
  timeComplexity: {
    best: "O(k^n)",
    average: "O(k^n)",
    worst: "O(k^n)",
  },
  spaceComplexity: "O(k^n)",
  complexityAnalysis: {
    time: "The graph has k^(n-1) vertices and k^n edges. Hierholzer's Eulerian circuit algorithm traverses each edge once, resulting in optimal linear O(k^n) time.",
    space: "O(k^n) memory to store De Bruijn graph edges, traversal stack, and sequence output.",
  },
  topicGuide: {
    overview:
      "<p>A <strong>De Bruijn sequence</strong> <code>B(k, n)</code> is a minimal-length cyclic sequence containing every possible substring of length <code>n</code> over a <code>k</code>-element alphabet exactly once. By mapping the problem to finding an <strong>Eulerian circuit</strong> on a directed De Bruijn graph, the sequence can be constructed efficiently in <code>O(k<sup>n</sup>)</code> time.</p>",
    sections: [
      {
        heading: "Why It Exists & What It Solves",
        body: "<p>De Bruijn sequences enable optimal rotary position encoding in robotics, lock combination cracking (entering minimal test keystroke streams), memory pattern testing in hardware, and genome sequence assembly in bioinformatics.</p>",
      },
      {
        heading: "The De Bruijn Graph Model",
        body: "<p>Construct a directed graph <code>G</code> where vertices are strings of length <code>n - 1</code> over an alphabet of size <code>k</code>. Draw a directed edge from vertex <code>u</code> to vertex <code>v</code> labeled with character <code>c</code> if <code>v = u[1:] + c</code>. Because every vertex has <code>in_degree = k</code> and <code>out_degree = k</code>, the graph is Eulerian, guaranteeing an Eulerian circuit exists.</p>",
      },
      {
        heading: "Step-by-Step Intuition",
        body: "<ol><li><strong>Generate State Nodes:</strong> Generate all <code>k<sup>n-1</sup></code> prefix state nodes.</li><li><strong>Build Transition Edges:</strong> Add directed edges transitioning from state <code>u</code> to <code>u[1:] + c</code> for each symbol <code>c</code>.</li><li><strong>Run Hierholzer:</strong> Execute Hierholzer's Eulerian circuit algorithm from starting state <code>0<sup>n-1</sup></code>.</li><li><strong>Extract Sequence:</strong> Extract the trailing symbol of each circuit node to assemble the minimal sequence <code>B(k, n)</code>.</li></ol>",
      },
      {
        heading: "Trade-offs & Minimal Length Guarantee",
        body: "<p>A naive concatenation of all <code>k<sup>n</sup></code> length-n strings requires <code>n &middot; k<sup>n</sup></code> symbols. A De Bruijn sequence overlapping adjacent substrings reduces the required length down to exactly <code>k<sup>n</sup></code> (cyclic) or <code>k<sup>n</sup> + n - 1</code> (linear), representing a factor of <code>n</code> compression.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(k<sup>n</sup>)</code><br/><strong>Space Complexity:</strong> <code>O(k<sup>n</sup>)</code><br/>The graph has <code>|V| = k<sup>n-1</sup></code> and <code>|E| = k<sup>n</sup></code>. Traversing every edge once takes linear <code>O(k<sup>n</sup>)</code> time. Storing graph edges, stack, and result sequence consumes <code>O(k<sup>n</sup>)</code> memory.</p>",
      },
    ],
    keyTerms: [
      {
        term: "De Bruijn Sequence B(k, n)",
        definition:
          "A minimal cyclic sequence containing all k^n length-n words over an alphabet of size k.",
      },
      {
        term: "De Bruijn Graph",
        definition:
          "A directed graph whose vertices are length-(n-1) sequences and edges are length-n sequences.",
      },
      {
        term: "Rotary Position Encoder",
        definition:
          "Physical sensor measuring absolute angular position using De Bruijn code tracks.",
      },
      {
        term: "Overlapping Substrings",
        definition:
          "Property allowing adjacent n-length windows to share n-1 characters, compressing total sequence length.",
      },
    ],
  },
  trivia: DE_BRUIJN_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 17,
      label: "Competitive Programmer's Handbook, Ch 17",
    },
  ],
  defaultInput: DEFAULT_DE_BRUIJN_INPUT,
  generateSteps: generateDeBruijnSteps,
};

export default deBruijnSequence;
