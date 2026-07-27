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
  skipLines: [4, 5],
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
    1: "Defines the generator for a De Bruijn sequence B(k, n) of length k^n.",
    2: "Builds the alphabet of size k (e.g. ['0', '1']).",
    3: "Initializes starting node of length n - 1.",
    6: "Recursively constructs all k^(n-1) nodes representing state prefixes.",
    8: "Builds out-edges by appending each alphabet symbol c to the suffix of the current node.",
    14: "Starts Hierholzer's traversal at the initial all-zeroes prefix.",
    17: "Drives the post-order Eulerian circuit traversal with an explicit LIFO stack.",
    25: "Concatenates the trailing symbol of each circuit node in reverse order to form the De Bruijn sequence.",
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
  const k = Math.max(2, Math.min(input.k, 4));
  const n = Math.max(2, Math.min(input.n, 4));
  const alphabet = input.alphabet || Array.from({ length: k }, (_, i) => String(i));

  const prefixLen = n - 1;
  const nodeLabels = generateCombinations(alphabet, prefixLen);

  const radius = 140;
  const centerX = 250;
  const centerY = 180;

  const graphNodes: GraphNodeItem[] = nodeLabels.map((label, idx) => {
    const angle = (2 * Math.PI * idx) / nodeLabels.length;
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
      what: `Constructing De Bruijn Graph for k=${k}, n=${n}.`,
      why: `Nodes are length-${prefixLen} prefixes (${nodeLabels.length} states). Total edges = k^n = ${Math.pow(k, n)}.`,
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
    codeLine: 10,
    explanation: {
      what: `Initialized Eulerian Circuit starting at node "${start}".`,
      why: "Hierholzer's algorithm starts traversal from the first state.",
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
        codeLine: 16,
        explanation: {
          what: `Traversed edge ${curr} -> ${nxt} (symbol '${item.char}').`,
          why: "Push next state onto stack to follow Eulerian circuit path.",
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
        codeLine: 19,
        explanation: {
          what: `Popped node "${popped}" to Eulerian circuit list.`,
          why: "Node has no remaining outgoing edges in De Bruijn graph.",
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

  const reversedCircuit = [...circuit].reverse();
  const sequenceStr = reversedCircuit.map((node) => node[node.length - 1] || "0").join("");

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 21,
    explanation: {
      what: `De Bruijn Sequence computed: "${sequenceStr}".`,
      why: `The generated cyclic string of length ${sequenceStr.length} contains every length-${n} binary substring exactly once.`,
    },
    primarySnapshot: {
      kind: "graph",
      nodes: graphNodes.map((gn) => ({ ...gn, state: "sorted" })),
      edges: graphEdges.map((ge) => ({ ...ge, isPath: true, isTraversed: true })),
    },
    auxiliaryState: {
      stack: [],
      customState: { "De Bruijn Sequence": sequenceStr },
    },
    variables: { sequence: sequenceStr, length: sequenceStr.length },
  });

  return steps;
}

export const deBruijnSequence: AlgorithmDefinition<DeBruijnSequenceInput> = {
  id: "de-bruijn-sequence",
  title: "De Bruijn Sequence",
  category: "graph_directed_and_scc",
  categories: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "A De Bruijn sequence B(k, n) is a cyclic sequence of order n over an alphabet of size k that contains every possible length-n sequence as a contiguous substring exactly once. Given alphabet size k and length n, construct the De Bruijn sequence by finding an Eulerian circuit in a De Bruijn graph (whose vertices are strings of length n-1 and directed edges represent length-n transitions) using Hierholzer's algorithm in O(k^n) time.",
  constraints: ["2 <= k <= 4", "2 <= n <= 4", "Generated cyclic sequence has exact length k^n"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "k = 2, n = 3",
      outputDisplay: '"00011101"',
      title: "Binary Order-3 De Bruijn Sequence",
      input: { k: 2, n: 3 },
      output: '"00011101"',
      explanation:
        "Contains all 8 length-3 binary substrings: 000, 001, 011, 111, 110, 101, 010, 100.",
    },
    {
      kind: "complex",
      inputDisplay: "k = 2, n = 4",
      outputDisplay: '"0000111101100101"',
      title: "Binary Order-4 De Bruijn Sequence",
      input: { k: 2, n: 4 },
      output: '"0000111101100101"',
      explanation: "Contains all 16 length-4 binary substrings.",
    },
    {
      kind: "negative",
      inputDisplay: "k = 2, n = 2",
      outputDisplay: '"0011"',
      title: "Binary Order-2 De Bruijn Sequence",
      input: { k: 2, n: 2 },
      output: '"0011"',
      explanation: "Minimal De Bruijn sequence for length-2 substrings: 00, 01, 11, 10.",
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
    time: "The De Bruijn graph has k^(n-1) vertices and k^n edges. Hierholzer's algorithm traverses every edge in O(k^n) time.",
    space: "Constructing the graph and holding the Eulerian stack takes O(k^n) space.",
  },
  topicGuide: {
    overview:
      "A De Bruijn sequence B(k, n) represents the shortest possible cyclic string containing all k^n length-n strings over an alphabet of size k. It maps directly to an Eulerian circuit on a De Bruijn graph, demonstrating the deep link between combinatorics and graph theory.",
    sections: [
      {
        heading: "Core Concept: De Bruijn Graph Topology & Overlaps",
        body: "Each vertex in a De Bruijn graph represents a prefix string of length n-1. A directed edge exists from vertex u to vertex v with label c if appending character c to the suffix of u forms a valid length-n string whose suffix matches v. The graph is k-regular, meaning every vertex has in-degree k and out-degree k.",
      },
      {
        heading: "Eulerian Construction via Hierholzer's Algorithm",
        body: "Because every node in a De Bruijn graph has in-degree equal to out-degree, an Eulerian circuit is guaranteed to exist. Hierholzer's algorithm visits every directed edge exactly once, yielding the complete sequence in linear O(k^n) time.",
      },
      {
        heading: "Systems & Real-World Applications",
        body: "De Bruijn sequences are fundamental in DNA de novo genome assembly (De Bruijn graph assemblers like SPAdes and Velvet), rotary position encoders in robotics, pseudo-random number generation, and cryptographic stream ciphers.",
      },
      {
        heading: "Implementation & Edge Cases",
        body: "The output sequence is cyclic, so reading the last n-1 characters combined with the start wraps seamlessly around. Minimal cases k=2, n=1 yield simple binary toggles '01'.",
      },
    ],
    keyTerms: [
      {
        term: "De Bruijn Sequence",
        definition:
          "A cyclic sequence of order n over an alphabet of size k containing every length-n substring exactly once.",
      },
      {
        term: "De Bruijn Graph",
        definition:
          "A directed graph representing overlaps between sequences of symbols, where edges represent length-n words.",
      },
      {
        term: "k-Regular Directed Graph",
        definition:
          "A directed graph where every vertex has in-degree equal to out-degree equal to k.",
      },
      {
        term: "Genome Assembly",
        definition:
          "Reconstructing long genomic DNA sequences from short sequencing reads using De Bruijn graphs.",
      },
    ],
  },
  trivia: DE_BRUIJN_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 19",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 19,
      section: "19.2 De Bruijn sequences",
    },
  ],
  defaultInput: DEFAULT_DE_BRUIJN_INPUT,
  generateSteps: generateDeBruijnSteps,
};
