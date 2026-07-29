import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

export const DE_BRUIJN_TRIVIA: TriviaMeta = {
  skipLines: [5, 12, 16, 24, 28],
  distractors: [
    "adj[node].append(node + char)",
    "stack.pop(0)",
    "res = ''.join(circuit)",
    "nodes = [str(i) for i in range(k**n)]",
  ],
  hints: [
    {
      line: 3,
      hint: "De Bruijn graph nodes represent prefixes of length n-1 over an alphabet of size k.",
    },
    {
      line: 8,
      hint: "Directed edges transition from node u to u[1:] + c, labeled with character c.",
    },
    {
      line: 17,
      hint: "Hierholzer's Eulerian circuit algorithm traverses every edge in the De Bruijn graph exactly once.",
    },
    {
      line: 25,
      hint: "Extracting the symbol of each node in the Eulerian path constructs the minimal cyclic sequence of length k^n.",
    },
  ],
  lineExplanations: {
    1: "Defines de_bruijn(k, n) function generating minimal length k^n cyclic sequence for alphabet size k and substring length n.",
    2: "Builds character alphabet array of size k (e.g. ['0', '1']).",
    3: "Initializes starting node string of length n - 1 (e.g. '00').",
    4: "Initializes graph adjacency list map adj.",
    5: "Blank line separating variable initialization from recursive node generator.",
    6: "Defines recursive helper generate_nodes(curr) to build all k^(n-1) state prefixes.",
    7: "Base case check: when current prefix length equals n - 1, register state node.",
    8: "Creates outgoing transition edges for node by shifting left and appending each alphabet character c.",
    9: "Returns from base case recursion.",
    10: "Iterates over alphabet characters to build next prefix level.",
    11: "Recursively calls generate_nodes(curr + c).",
    12: "Blank line separating helper definition from graph build call.",
    13: "Launches node generation starting with empty string.",
    14: "Initializes traversal stack with starting_node.",
    15: "Initializes empty circuit list to record post-order Eulerian state sequence.",
    16: "Blank line separating state initialization from main loop.",
    17: "Drives main loop while traversal stack contains active state nodes.",
    18: "Peeks top state node u from stack.",
    19: "Checks if state u has any remaining untraversed outgoing edges.",
    20: "Pops next target state v from u's transition list.",
    21: "Pushes target state v onto traversal stack.",
    22: "Else branch when state u has no remaining outgoing transition edges.",
    23: "Pops dead-end state u from stack and appends to post-order circuit.",
    24: "Blank line separating Eulerian traversal loop from string construction.",
    25: "Initializes output sequence with full prefix string of the first circuit state.",
    26: "Iterates over circuit state nodes in reverse order (excluding initial state).",
    27: "Appends the last character of each state node to sequence string.",
    28: "Blank line separating string assembly from return statement.",
    29: "Returns final minimal De Bruijn sequence B(k, n).",
  },
};

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

export function generateDeBruijnSteps(input: DeBruijnSequenceInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
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

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Constructing De Bruijn Graph for alphabet size k=${k}, substring length n=${n}.`,
      why: `Nodes represent length-${prefixLen} state prefixes (${nodeLabels.length} states). Total edges = k^n = ${Math.pow(k, n)}.`,
    },
    primarySnapshot: { kind: "graph", nodes: [...graphNodes], edges: [...graphEdges] },
    auxiliaryState: {
      visited: [],
      stack: [],
      customState: { Sequence: "" },
    },
    variables: { k, n, totalNodes: graphNodes.length, totalEdges: graphEdges.length },
  });

  const start = nodeLabels[0];
  const stack: string[] = [start];
  const circuit: string[] = [];
  const edgeUsed: Record<string, boolean> = {};

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 14,
    explanation: {
      what: `Initialized Eulerian Circuit starting at state node "${start}".`,
      why: "Hierholzer's algorithm starts traversal from the initial all-zeroes prefix.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: graphNodes.map((gn) => ({
        ...gn,
        state: gn.id === start ? "active" : "default",
      })),
      edges: [...graphEdges],
    },
    auxiliaryState: {
      stack: [...stack],
      customState: { Sequence: "" },
    },
    variables: { start, stackSize: stack.length },
  });

  while (stack.length > 0) {
    const curr = stack[stack.length - 1];

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 18,
      explanation: {
        what: `Inspecting top state node "${curr}".`,
        why: `Check if state "${curr}" has untraversed transitions (${adj[curr]?.length ?? 0} remaining).`,
      },
      primarySnapshot: {
        kind: "graph",
        nodes: graphNodes.map((gn) => ({
          ...gn,
          state: gn.id === curr ? "active" : stack.includes(gn.id) ? "in-stack" : "default",
        })),
        edges: graphEdges.map((ge) => ({
          ...ge,
          isTraversed: !!edgeUsed[`${ge.from}->${ge.to}-${ge.weight ?? 0}`],
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: { Current: curr, Circuit: `[${circuit.join(", ")}]` },
      },
      variables: { curr, remainingTransitions: adj[curr]?.length ?? 0 },
    });

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

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 20,
        explanation: {
          what: `Traversed transition "${curr}" -> "${nxt}" (symbol '${item.char}').`,
          why: "Pushed target state onto traversal stack to follow Eulerian circuit path.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: graphNodes.map((gn) => ({
            ...gn,
            state: gn.id === nxt ? "active" : stack.includes(gn.id) ? "in-stack" : "default",
          })),
          edges: graphEdges.map((ge) => ({
            ...ge,
            isTraversed: !!edgeUsed[`${ge.from}->${ge.to}-${ge.weight ?? 0}`],
            isPath: ge.from === curr && ge.to === nxt,
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          customState: { Circuit: `[${circuit.join(", ")}]` },
        },
        variables: { current: curr, next: nxt, symbol: item.char },
      });
    } else {
      const popped = stack.pop()!;
      circuit.push(popped);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 23,
        explanation: {
          what: `Popped state node "${popped}" to Eulerian circuit list.`,
          why: "State node has no remaining outgoing transition edges.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: graphNodes.map((gn) => ({
            ...gn,
            state: circuit.includes(gn.id)
              ? "visited"
              : stack.includes(gn.id)
                ? "in-stack"
                : "default",
          })),
          edges: graphEdges.map((ge) => ({
            ...ge,
            isTraversed: !!edgeUsed[`${ge.from}->${ge.to}-${ge.weight ?? 0}`],
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          customState: { Circuit: `[${circuit.join(", ")}]` },
        },
        variables: { popped, circuitLength: circuit.length },
      });
    }
  }

  // Construct De Bruijn sequence
  let sequence = circuit.length > 0 ? circuit[circuit.length - 1] : "";
  const revCircuit = [...circuit].reverse();
  for (let i = 1; i < revCircuit.length; i++) {
    const node = revCircuit[i];
    sequence += n > 1 ? node[node.length - 1] : node;
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 27,
    explanation: {
      what: `Constructed De Bruijn sequence B(${k},${n}) = "${sequence}".`,
      why: `Sequence of length ${sequence.length} contains every possible length-${n} combination over size-${k} alphabet exactly once as a substring.`,
    },
    primarySnapshot: {
      kind: "graph",
      nodes: graphNodes.map((gn) => ({ ...gn, state: "sorted" })),
      edges: graphEdges.map((ge) => ({ ...ge, isPath: true, isTraversed: true })),
    },
    auxiliaryState: {
      customState: {
        "De Bruijn Sequence": sequence,
        "Sequence Length": sequence.length,
        "Expected Length": Math.pow(k, n) + (n - 1),
      },
    },
    variables: { sequence, sequenceLength: sequence.length },
  });

  return steps;
}

export const deBruijnSequence: AlgorithmDefinition<DeBruijnSequenceInput> = {
  id: "de-bruijn-sequence",
  title: "De Bruijn Sequence Generator",
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "<p>A De Bruijn sequence B(k, n) is a cyclic sequence of length <code>k<sup>n</sup></code> containing every possible length-n combination over an alphabet of size <code>k</code> exactly once as a contiguous substring. It is constructed by building a directed De Bruijn graph—where vertices represent length-(n-1) state prefixes and edges represent length-n transitions—and finding an Eulerian circuit using Hierholzer's algorithm in optimal linear <code>O(k<sup>n</sup>)</code> time.</p>",
  constraints: [
    "2 <= Alphabet Size k <= 4",
    "2 <= Substring Length n <= 4",
    "Generated sequence length equals k^n",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "k=2 (binary), n=3",
      outputDisplay: '"00011101"',
      title: "Binary 3-Bit De Bruijn Sequence",
      input: DEFAULT_DE_BRUIJN_INPUT,
      output: '"00011101"',
      explanation:
        'Sequence of length 8 contains all 8 3-bit binary combinations ("000", "001", "011", "111", "110", "101", "010", "100") cyclically.',
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
        body: "<p><strong>Time Complexity:</strong> <code>O(k<sup>n</sup>)</code><br/><strong>Space Complexity:</strong> <code>O(k<sup>n</sup>)</code></p><ul><li><strong>Time:</strong> The graph has <code>|V| = k<sup>n-1</sup></code> and <code>|E| = k<sup>n</sup></code>. Traversing every edge once takes linear <code>O(k<sup>n</sup>)</code> time.</li><li><strong>Space:</strong> Storing graph edges, stack, and result sequence consumes <code>O(k<sup>n</sup>)</code> memory.</li></ul>",
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
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 17",
      label: "Competitive Programmer's Handbook, Ch 17",
    },
  ],
  defaultInput: DEFAULT_DE_BRUIJN_INPUT,
  generateSteps: generateDeBruijnSteps,
};
