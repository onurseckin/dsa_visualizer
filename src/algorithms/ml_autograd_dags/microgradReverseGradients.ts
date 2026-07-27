import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface microgradReverseGradientsInput {
  data: number[];
  target?: number;
}

export const MICROGRADREVERSEGRADIENTSS_CODE = `def micrograd_reverse_gradients(nodes, edges):
    """
    Topologically sorts computation DAG and triggers reverse-mode gradient propagation.
    """
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

  const elements: ArrayElement[] = arrayData.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          data: `[${arrayData.join(", ")}]`,
          target: String(target),
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Init Reverse Mode Autograd Engine
  addStep(
    1,
    "Initialize Micrograd Reverse-Mode Autograd Engine",
    "Setting up topological sorting structures and gradient accumulation map for reverse-mode backpropagation.",
    { nodeCount: arrayData.length, target, phase: "INIT_REVERSE_AUTOGRAD" },
    undefined,
    { topo_order: "[]", visited_count: "0" },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Topologically sorts computation DAG and triggers reverse-mode gradient propagati",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Step 2: Init topo list and visited set
  addStep(
    5,
    "Allocate `topo = []` and `visited = set()`",
    "Initializing post-order DFS stacks for graph topological sorting.",
    { phase: "ALLOC_TOPO_STACKS" },
  );

  // Phase 1: Build Topological Sort Order
  const topoOrder: number[] = [];
  arrayData.forEach((val, idx) => {
    topoOrder.push(idx);

    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`DFS_${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      9,
      `Build Topo DFS Visit Node ${idx}`,
      `Checking if node ${idx} is in visited set. Adding to visited set and traversing children.`,
      { node: idx, isVisited: false, phase: "DFS_VISIT" },
      stateA,
      { activeNode: `Node_${idx}` },
    );

    addStep(
      13,
      `Append Node ${idx} to ` + "`topo`" + ` List`,
      `Post-order DFS complete for Node_${idx}. Appended to topological ordering.`,
      { node: idx, topoLength: topoOrder.length, phase: "TOPO_APPEND" },
      stateA,
      { topo_order: `[${topoOrder.join(", ")}]` },
    );
  });

  // Step 3: Initialize gradients map
  const gradMap: Record<number, number> = {};
  arrayData.forEach((_, idx) => {
    gradMap[idx] = 0.0;
  });

  addStep(
    18,
    "Initialize `gradients = {v: 0.0}` for All Graph Nodes",
    "Allocating gradient map with initial zero partial derivative values for all graph nodes.",
    { nodeCount: arrayData.length, phase: "INIT_GRADIENTS_MAP" },
  );

  // Step 4: Seed loss node gradient
  const lossNode = topoOrder[topoOrder.length - 1] ?? 0;
  gradMap[lossNode] = 1.0;

  addStep(
    20,
    `Seed Upstream Loss Gradient: gradients[Node_${lossNode}] = 1.0`,
    `Setting output loss node derivative dL/dL = 1.0 to begin reverse-mode autograd chain rule traversal.`,
    { lossNode, lossGrad: 1.0, phase: "SEED_LOSS_GRAD" },
    undefined,
    { loss_node: `Node_${lossNode}` },
  );

  // Phase 2: Reverse Topological Gradient Backpropagation Pass
  for (let tIdx = topoOrder.length - 1; tIdx >= 0; tIdx--) {
    const v = topoOrder[tIdx];
    const g = gradMap[v];
    const isTarget = arrayData[v] === target;

    const stateB: ArrayElement[] = elements.map((el, i) => {
      if (i === v) return { ...el, state: isTarget ? "active" : "sorted", value: g, pointers: [`dL/d_${v}=${g}`] };
      if (i > v) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      23,
      `Fetch Accumulated Gradient for Node ${v}: g = ${g}`,
      `Traversing in reverse topological order. Node ${v} total accumulated upstream gradient dL/d_${v} = ${g}.`,
      { node: v, g, phase: "FETCH_NODE_GRAD" },
      stateB,
      { currentNode: `Node_${v}`, currentGrad: String(g) },
    );

    if (v > 0) {
      const child = v - 1;
      gradMap[child] = Number((gradMap[child] + g).toFixed(4));

      addStep(
        25,
        `Propagate Gradient to Child Node ${child}: gradients[${child}] += ${g} -> ${gradMap[child]}`,
        `Applying multivariable chain rule sum: sending gradient contribution ${g} from Node_${v} to child Node_${child}.`,
        { parentNode: v, childNode: child, propagatedGrad: g, updatedChildGrad: gradMap[child], phase: "PROPAGATE_CHILD_GRAD" },
        stateB,
        { [`dL/d_${child}`]: String(gradMap[child]) },
      );
    }
  }

  // Step final-1: Verify Backprop Completion
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    27,
    "Verify Full Micrograd Reverse Backpropagation Pass",
    "Checking that all nodes received accumulated gradients in reverse topological order.",
    { totalNodesProcessed: arrayData.length, backpropComplete: true },
    finalElements,
  );

  // Step final: Complete
  addStep(
    27,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const MICROGRADREVERSEGRADIENTSS_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 7, 14, 17, 21, 26],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "gradients[child] = g",
  ],
  hints: [
    { line: 8, hint: "Perform post-order DFS to build topological sort order topo." },
    { line: 20, hint: "Seed output loss node gradient (topo[-1]) to 1.0 (dL/dL = 1.0)." },
    { line: 22, hint: "Iterate through nodes v in reverse topological order." },
    { line: 25, hint: "Accumulate gradient g into child nodes: gradients[child] += g." },
  ],
  lineExplanations: {
    1: "Defines entry point for micrograd_reverse_gradients backpropagation function.",
    2: "Docstring opening: describes topological sorting and reverse-mode gradient propagation.",
    3: "Docstring body: topologically sorts computation DAG and triggers backward autograd pass.",
    4: "Docstring closing.",
    5: "Initializes list topo to store nodes in topological sorting order.",
    6: "Initializes set visited to track DFS visited graph nodes.",
    7: "Empty line separating topological variables from recursive DFS helper function.",
    8: "Defines recursive post-order depth-first search helper function build_topo(v).",
    9: "Checks if graph node v has not yet been visited in DFS traversal.",
    10: "Adds node v to visited set.",
    11: "Iterates through child dependency nodes in adjacency dictionary edges.get(v, []).",
    12: "Recursively invokes build_topo(child) for unvisited child node.",
    13: "Appends node v to topo list in post-order after visiting all downstream child subtrees.",
    14: "Empty line separating DFS helper definition from outer graph traversal loop.",
    15: "Iterates through all nodes in input graph to process disconnected components.",
    16: "Invokes build_topo(node) for each seed graph node.",
    17: "Empty line separating topological ordering from gradient dictionary allocation.",
    18: "Allocates gradients dictionary initializing all graph node partial derivatives to 0.0.",
    19: "Checks if topo list contains nodes.",
    20: "Seeds output loss node (last node in topo) gradient to 1.0 (dL/dL = 1.0).",
    21: "Empty line separating gradient initialization from reverse topological backpropagation loop.",
    22: "Iterates through graph nodes v in reverse topological order (reversed(topo)).",
    23: "Fetches total accumulated upstream gradient g = gradients[v] for current node v.",
    24: "Iterates through child dependency nodes in adjacency dictionary edges.get(v, []).",
    25: "Accumulates gradient contribution into child node: gradients[child] += g.",
    26: "Empty line before returning computed gradient map.",
    27: "Returns gradients dictionary mapping all graph node IDs to their computed loss derivatives.",
  },
};

export const microgradReverseGradients: AlgorithmDefinition<microgradReverseGradientsInput> = {
  id: "micrograd-reverse-gradients",
  title: "Micrograd Reverse-Mode Automatic Differentiation",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
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
