import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface microgradReverseGradientsInput {
  data: number[];
  target?: number;
}

export const MICROGRADREVERSEGRADIENTSS_CODE = `def micrograd_reverse_gradients(nodes, edges):
    topo = []
    visited = set()

    def build_topo(v):
        if v not in visited:
            visited.add(v)
            for child in edges.get(v, []):
                build_topo(child)
            topo.append(v)

    for node in nodes:
        build_topo(node)

    gradients = {v: 0.0 for v in nodes}
    if topo:
        gradients[topo[-1]] = 1.0

    for v in reversed(topo):
        g = gradients[v]
        for child in edges.get(v, []):
            gradients[child] += g

    return gradients`;

export const DEFAULT_MICROGRADREVERSEGRADIENTS_INPUT: microgradReverseGradientsInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};
export const DEFAULT_MICROGRADREVERSEGRADIENTSS_INPUT = DEFAULT_MICROGRADREVERSEGRADIENTS_INPUT;

export const generateMicrogradReverseGradientsSteps = (
  input: microgradReverseGradientsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayData = input?.data || [10, 20, 30, 40, 50];
  const target = input?.target ?? 30;
  const numNodes = arrayData.length;

  const edgesMap: Record<number, number[]> = {};
  const allEdgePairs: [number, number][] = [];
  for (let i = 0; i < numNodes; i++) {
    edgesMap[i] = [];
    if (i > 0) {
      edgesMap[i].push(i - 1);
      allEdgePairs.push([i, i - 1]);
    }
  }
  if (numNodes >= 5) {
    edgesMap[4].push(2);
    allEdgePairs.push([4, 2]);
  }

  const buildGraphSnapshot = (
    activeNode: number | null,
    activeChild: number | null,
    visitedSet: Set<number>,
    gradients: Record<number, number>,
    traversedEdges: Set<string>,
    currentEdge: string | null,
  ): { nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } => {
    const nodes: GraphNodeItem[] = arrayData.map((val, idx) => {
      let state: GraphNodeItem["state"] = "default";
      if (idx === activeNode) state = "active";
      else if (idx === activeChild) state = "compare";
      else if (visitedSet.has(idx)) state = "visited";

      const gradVal = gradients[idx] ?? 0.0;
      return {
        id: `node-${idx}`,
        label: `v${idx} (val:${val}) dL:${gradVal}`,
        val: gradVal,
        state,
        x: 80 + idx * 130,
        y: idx % 2 === 0 ? 120 : 200,
      };
    });

    const edgeItems: GraphEdgeItem[] = allEdgePairs.map(([u, v]) => {
      const edgeKey = `${u}->${v}`;
      const isCurrent = currentEdge === edgeKey;
      const isTraversed = traversedEdges.has(edgeKey);
      return {
        from: `node-${u}`,
        to: `node-${v}`,
        isTraversed,
        isPath: isCurrent,
      };
    });

    return { nodes, edges: edgeItems };
  };

  const topoList: number[] = [];
  const visitedSet = new Set<number>();
  const gradients: Record<number, number> = {};
  const traversedEdges = new Set<string>();

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeNode: number | null = null,
    activeChild: number | null = null,
    currentEdge: string | null = null,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        ...buildGraphSnapshot(
          activeNode,
          activeChild,
          visitedSet,
          gradients,
          traversedEdges,
          currentEdge,
        ),
      },
      auxiliaryState: {
        customState: {
          data: `[${arrayData.join(", ")}]`,
          target: String(target),
          topo: `[${topoList.join(", ")}]`,
          gradients: JSON.stringify(gradients),
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Line 1 - Init Micrograd Engine
  addStep(
    1,
    "Initialize Micrograd Reverse-Mode Autograd Engine",
    "Setting up topological sorting structures and gradient accumulation map for reverse-mode backpropagation.",
    { nodeCount: numNodes, target, phase: "INIT_REVERSE_AUTOGRAD" },
  );

  // Line 2: topo = []
  addStep(
    2,
    "Allocate `topo = []`",
    "Initializing post-order DFS stack for graph topological sorting.",
    { phase: "ALLOC_TOPO_STACK" },
  );

  // Line 3: visited = set()
  addStep(
    3,
    "Allocate `visited = set()`",
    "Initializing visited set to track graph nodes during DFS traversal.",
    { phase: "ALLOC_VISITED_SET" },
  );

  // Phase 1: Build Topological Sort Order via DFS
  const buildTopoDFS = (v: number) => {
    addStep(
      6,
      `DFS Check: Is Node ${v} visited?`,
      `Checking if Node ${v} has already been processed in topological DFS traversal.`,
      { node: v, isVisited: visitedSet.has(v) },
      v,
    );

    if (!visitedSet.has(v)) {
      visitedSet.add(v);
      addStep(
        7,
        `Mark Node ${v} as Visited`,
        `Added Node ${v} to visited set to prevent cycle traversal.`,
        { node: v, visitedCount: visitedSet.size },
        v,
      );

      const children = edgesMap[v] || [];
      addStep(
        8,
        `Inspect Children of Node ${v}`,
        `Node ${v} has children: [${children.join(", ")}]. Traversing child subtrees.`,
        { node: v, childrenCount: children.length },
        v,
      );

      for (const child of children) {
        addStep(
          9,
          `Recursively Visit Child Node ${child}`,
          `Invoking build_topo(${child}) to process child dependency before Node ${v}.`,
          { parent: v, child },
          v,
          child,
          `${v}->${child}`,
        );

        buildTopoDFS(child);
      }

      topoList.push(v);
      addStep(
        10,
        ["Append Node", v, "to `topo` List"].join(" "),
        `All downstream dependencies of Node ${v} visited; appending Node ${v} to topological sort order.`,
        { node: v, topoLength: topoList.length },
        v,
      );
    }
  };

  for (let i = 0; i < numNodes; i++) {
    addStep(
      12,
      `Outer DFS Loop: Select Graph Node ${i}`,
      `Iterating through input nodes to trigger DFS topological traversal for component Node ${i}.`,
      { node: i, phase: "OUTER_DFS_LOOP" },
      i,
    );

    buildTopoDFS(i);
  }

  for (let i = 0; i < numNodes; i++) {
    gradients[i] = 0.0;
  }
  addStep(
    15,
    "Initialize `gradients = {v: 0.0}` for All Graph Nodes",
    "Allocating gradient map with initial zero partial derivative values for all graph nodes.",
    { nodeCount: numNodes, phase: "INIT_GRADIENTS_MAP" },
  );

  addStep(
    16,
    "Check if Topological Order List `topo` is Non-Empty",
    "Verifying topological sort produced node sequence for reverse gradient propagation.",
    { topoLength: topoList.length, isNonEmpty: topoList.length > 0 },
  );

  const lossNode = topoList.length > 0 ? topoList[topoList.length - 1] : 0;
  gradients[lossNode] = 1.0;
  addStep(
    17,
    `Seed Upstream Loss Gradient: gradients[Node ${lossNode}] = 1.0`,
    `Setting output loss node derivative dL/dL = 1.0 to seed reverse-mode autograd chain rule backpropagation.`,
    { lossNode, lossGrad: 1.0, phase: "SEED_LOSS_GRAD" },
    lossNode,
  );

  for (let tIdx = topoList.length - 1; tIdx >= 0; tIdx--) {
    const v = topoList[tIdx];

    addStep(
      19,
      `Reverse Topological Loop: Process Node ${v}`,
      `Evaluating Node ${v} in reverse topological order guarantees all upstream gradients are accumulated before propagating downstream.`,
      { node: v, phase: "REVERSE_TOPO_NEXT" },
      v,
    );

    const g = gradients[v];
    addStep(
      20,
      `Fetch Accumulated Gradient for Node ${v}: g = ${g}`,
      `Retrieved total accumulated upstream gradient dL/dv = ${g} for Node ${v}.`,
      { node: v, g, phase: "FETCH_NODE_GRAD" },
      v,
    );

    const children = edgesMap[v] || [];
    addStep(
      21,
      `Inspect Downstream Children of Node ${v}`,
      `Node ${v} has child dependencies [${children.join(", ")}]. Propagating gradient g = ${g}.`,
      { node: v, childCount: children.length },
      v,
    );

    for (const child of children) {
      const edgeKey = `${v}->${child}`;
      traversedEdges.add(edgeKey);
      gradients[child] = Number((gradients[child] + g).toFixed(4));

      addStep(
        22,
        `Propagate Gradient to Child Node ${child}: gradients[${child}] += ${g} -> ${gradients[child]}`,
        `Multivariable chain rule: propagating upstream gradient ${g} from Node ${v} to child Node ${child}. New dL/d_${child} = ${gradients[child]}.`,
        { parentNode: v, childNode: child, propagatedGrad: g, updatedChildGrad: gradients[child] },
        v,
        child,
        edgeKey,
      );
    }
  }

  addStep(
    24,
    "Verify Full Micrograd Reverse Backpropagation Pass",
    "Checking that all graph nodes received accumulated gradients in reverse topological order.",
    { totalNodesProcessed: numNodes, backpropComplete: true },
  );

  addStep(
    24,
    "Execution Complete",
    "Successfully completed reverse-mode automatic differentiation on computation graph.",
    { completed: true, totalSteps: stepIndex },
  );

  return steps;
};

const MICROGRADREVERSEGRADIENTSS_TRIVIA: TriviaMeta = {
  skipLines: [4, 11, 14, 18, 23],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "gradients[child] = g",
  ],
  hints: [
    { line: 5, hint: "Perform post-order DFS to build topological sort order topo." },
    { line: 17, hint: "Seed output loss node gradient (topo[-1]) to 1.0 (dL/dL = 1.0)." },
    { line: 19, hint: "Iterate through nodes v in reverse topological order." },
    { line: 22, hint: "Accumulate gradient g into child nodes: gradients[child] += g." },
  ],
  lineExplanations: {
    1: "Defines entry point for micrograd_reverse_gradients backpropagation function.",
    2: "Initializes list topo to store graph nodes in topological sorting order.",
    3: "Initializes set visited to track DFS visited graph nodes.",
    4: "Blank line separating topological structures from recursive DFS helper function.",
    5: "Defines recursive post-order depth-first search helper function build_topo(v).",
    6: "Checks if graph node v has not yet been visited in DFS traversal.",
    7: "Adds node v to visited set.",
    8: "Iterates through child dependency nodes in adjacency dictionary edges.get(v, []).",
    9: "Recursively invokes build_topo(child) for unvisited child node.",
    10: "Appends node v to topo list in post-order after visiting all downstream child subtrees.",
    11: "Blank line separating DFS helper definition from outer graph traversal loop.",
    12: "Iterates through all nodes in input graph to process disconnected components.",
    13: "Invokes build_topo(node) for each seed graph node.",
    14: "Blank line separating topological ordering from gradient dictionary allocation.",
    15: "Allocates gradients dictionary initializing all graph node partial derivatives to 0.0.",
    16: "Checks if topo list contains nodes.",
    17: "Seeds output loss node (last node in topo) gradient to 1.0 (dL/dL = 1.0).",
    18: "Blank line separating gradient initialization from reverse topological backpropagation loop.",
    19: "Iterates through graph nodes v in reverse topological order (reversed(topo)).",
    20: "Fetches total accumulated upstream gradient g = gradients[v] for current node v.",
    21: "Iterates through child dependency nodes in adjacency dictionary edges.get(v, []).",
    22: "Accumulates gradient contribution into child node: gradients[child] += g.",
    23: "Blank line before returning computed gradient map.",
    24: "Returns gradients dictionary mapping all graph node IDs to their computed loss derivatives.",
  },
};

export const microgradReverseGradients: AlgorithmDefinition<microgradReverseGradientsInput> = {
  id: "micrograd-reverse-gradients",
  title: "Micrograd Reverse-Mode Automatic Differentiation",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Hard",
  description: `### Micrograd Reverse-Mode Automatic Differentiation

Reverse-mode automatic differentiation (**backpropagation**) computes the partial derivatives of a scalar output loss $L$ with respect to all leaf input weight parameters ($W, b$) in a single $\\mathcal{O}(V + E)$ pass.

#### Why It Exists & What It Solves
When training deep neural networks with millions or billions of parameters:
1. **Forward-mode autograd** requires running one forward pass per input parameter ($N$ passes for $N$ parameters), which is intractable for large networks.
2. **Reverse-mode autograd** evaluates $\\frac{\\partial L}{\\partial x}$ for all parameters simultaneously in a single backward pass, regardless of parameter count.

Topological sorting is essential:
- Nodes must be evaluated in **reverse topological order**.
- Evaluating nodes in reverse topological order guarantees that a node's total upstream gradient $\\text{dL/d}v$ is fully accumulated from all downstream paths before $v$ propagates its gradient to its children.

#### Step-by-Step Mechanism
1. **Topological Sort**: Perform a post-order DFS traversal to populate list \`topo\` storing graph nodes.
2. **Gradient Map Allocation**: Initialize \`gradients = {v: 0.0 for v in nodes}\`.
3. **Loss Seed**: Set loss output node derivative \`gradients[topo[-1]] = 1.0\` ($dL/dL = 1.0$).
4. **Backward Chain Rule Loop**: Iterate through nodes \`v\` in \`reversed(topo)\`:
   - Fetch accumulated gradient $g = \\text{gradients}[v]$.
   - For each child node, accumulate gradient: \`gradients[child] += g\`.
5. **Return Parameter Gradients**: Return \`gradients\` dictionary.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V + E)$ linear time across $V$ vertices and $E$ edges in the computation DAG.
- **Space Complexity**: $\\mathcal{O}(V)$ auxiliary memory for recursion stack and gradient storage.
- **Trade-Off**: Provides optimal computational speed for scalar loss backpropagation at the cost of retaining forward activation tensors in memory until backward execution completes.`,
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Pass",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Standard execution pass over computation graph.",
    },
    {
      kind: "complex",
      title: "Larger DAG Input",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30, 40, 50] },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates multi-node computation graph DAG.",
    },
    {
      kind: "negative",
      title: "Edge Case DAG",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "Evaluated Graph State",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Edge case handling completes safely.",
    },
  ],
  code: MICROGRADREVERSEGRADIENTSS_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and directed edges.",
    space: "Linear memory allocation for topological sorting list and gradient map.",
  },
  topicGuide: {
    overview:
      "Reverse-mode autograd (backpropagation) is the core algorithm powering PyTorch torch.autograd.backward() and Micrograd value.backward(). Topologically sorting nodes guarantees that a node's total upstream gradient is fully accumulated before propagating gradients to its children.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, reverse mode evaluates $\\frac{\\partial L}{\\partial x}$ for all nodes $x$ in $\\mathcal{O}(|V| + |E|)$ time regardless of input parameter count. This enables training deep neural networks with billions of parameters in a single backward pass.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Without topological sorting, propagating gradients out-of-order yields incomplete intermediate gradients, producing incorrect final weight derivatives.",
      },
      {
        heading: "Implementation Details & Topological Sort",
        body: "Implementation builds topological ordering via post-order DFS, initializes loss gradient to 1.0, and steps backward through topo list accumulating gradients to children.",
      },
      {
        heading: "Edge Case Analysis & Diamond DAGs",
        body: "Edge cases include diamond DAG structures (where node output branches to multiple paths, requiring multivariable chain rule summation $\\sum_i \\frac{\\partial L}{\\partial y_i} \\frac{\\partial y_i}{\\partial x}$).",
      },
    ],
    keyTerms: [
      {
        term: "Reverse Topological Order",
        definition:
          "Ordering graph nodes such that parent nodes are evaluated before child nodes during backward pass.",
      },
      {
        term: "Backpropagation",
        definition:
          "Propagating loss gradients backwards through a computation DAG using the chain rule.",
      },
      {
        term: "Multivariable Accumulation",
        definition:
          "Summing gradients from multiple downstream paths to compute total partial derivative.",
      },
    ],
  },
  trivia: MICROGRADREVERSEGRADIENTSS_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_MICROGRADREVERSEGRADIENTSS_INPUT,
  generateSteps: generateMicrogradReverseGradientsSteps,
};
