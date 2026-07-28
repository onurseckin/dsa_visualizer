import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface AutogradNode {
  id: string;
  label: string;
  op: "input" | "add" | "mul" | "relu";
  val: number;
  parents: string[];
}

export interface AutogradVjpInput {
  nodes: AutogradNode[];
  outputId: string;
  seedGrad: number;
}

export const AUTOGRAD_VJP_DAG_CODE = `def autograd_vjp_backward(nodes: list[dict], output_id: str, seed_grad: float) -> dict[str, float]:
    grads = {n["id"]: 0.0 for n in nodes}
    grads[output_id] = seed_grad
    node_map = {n["id"]: n for n in nodes}
    
    for node in reversed(topological_sort(nodes)):
        nid = node["id"]
        g = grads[nid]
        op = node["op"]
        parents = node.get("parents", [])
        
        if op == "add":
            grads[parents[0]] += g
            grads[parents[1]] += g
        elif op == "mul":
            p0_val = node_map[parents[0]]["val"]
            p1_val = node_map[parents[1]]["val"]
            grads[parents[0]] += g * p1_val
            grads[parents[1]] += g * p0_val
        elif op == "relu":
            p0_val = node_map[parents[0]]["val"]
            grads[parents[0]] += g * (1.0 if p0_val > 0 else 0.0)
            
    return grads`;

export const DEFAULT_AUTOGRAD_VJP_INPUT: AutogradVjpInput = {
  nodes: [
    { id: "x", label: "x", op: "input", val: 2.0, parents: [] },
    { id: "y", label: "y", op: "input", val: 3.0, parents: [] },
    { id: "xy", label: "x*y", op: "mul", val: 6.0, parents: ["x", "y"] },
    { id: "z", label: "z", op: "input", val: 5.0, parents: [] },
    { id: "out", label: "out", op: "add", val: 11.0, parents: ["xy", "z"] },
  ],
  outputId: "out",
  seedGrad: 1.0,
};

export const generateAutogradVjpDagSteps = (input: AutogradVjpInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodeMap = new Map<string, AutogradNode>();
  input.nodes.forEach((n) => nodeMap.set(n.id, n));

  const grads: Record<string, number> = {};
  input.nodes.forEach((n) => {
    grads[n.id] = 0.0;
  });

  // Calculate dynamic layout levels for custom graph inputs
  const depthMap = new Map<string, number>();
  const getDepth = (id: string): number => {
    if (depthMap.has(id)) return depthMap.get(id)!;
    const n = nodeMap.get(id);
    if (!n || !n.parents || n.parents.length === 0) {
      depthMap.set(id, 0);
      return 0;
    }
    let maxP = 0;
    for (const p of n.parents) {
      maxP = Math.max(maxP, getDepth(p));
    }
    const d = maxP + 1;
    depthMap.set(id, d);
    return d;
  };
  input.nodes.forEach((n) => getDepth(n.id));

  const levelNodes: Record<number, string[]> = {};
  input.nodes.forEach((n) => {
    const d = depthMap.get(n.id) || 0;
    if (!levelNodes[d]) levelNodes[d] = [];
    levelNodes[d].push(n.id);
  });

  const presetPositions: Record<string, { x: number; y: number }> = {
    x: { x: 100, y: 100 },
    y: { x: 100, y: 250 },
    xy: { x: 300, y: 175 },
    z: { x: 300, y: 325 },
    out: { x: 500, y: 250 },
    a: { x: 100, y: 100 },
    b: { x: 100, y: 220 },
    c: { x: 100, y: 340 },
    ab: { x: 300, y: 160 },
    rc: { x: 300, y: 340 },
  };

  const getNodePosition = (n: AutogradNode) => {
    if (presetPositions[n.id]) return presetPositions[n.id];
    const d = depthMap.get(n.id) || 0;
    const nodesInLevel = levelNodes[d] || [n.id];
    const idx = nodesInLevel.indexOf(n.id);
    const totalInLevel = nodesInLevel.length;
    const startY = 200 - ((totalInLevel - 1) * 120) / 2;
    return {
      x: 100 + d * 200,
      y: Math.max(80, startY + (idx >= 0 ? idx : 0) * 120),
    };
  };

  const getGraphSnapshot = (activeNodeId?: string, visitedNodes: Set<string> = new Set()) => {
    const graphNodes: GraphNodeItem[] = input.nodes.map((n) => {
      const pos = getNodePosition(n);
      let state: GraphNodeItem["state"] = "default";
      if (n.id === activeNodeId) {
        state = "active";
      } else if (visitedNodes.has(n.id)) {
        state = "sorted";
      }

      return {
        id: n.id,
        label: `${n.label}\nv=${n.val}\ndL=${grads[n.id].toFixed(2)}`,
        x: pos.x,
        y: pos.y,
        state,
        val: n.val,
      };
    });

    const graphEdges: GraphEdgeItem[] = [];
    input.nodes.forEach((n) => {
      n.parents.forEach((parentId) => {
        const isTraversed =
          visitedNodes.has(n.id) || (activeNodeId !== undefined && n.id === activeNodeId);
        graphEdges.push({
          from: parentId,
          to: n.id,
          isTraversed,
        });
      });
    });

    return {
      kind: "graph" as const,
      nodes: graphNodes,
      edges: graphEdges,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeNodeId?: string,
    visitedNodes: Set<string> = new Set(),
  ) => {
    const auxGrads: Record<string, number> = { ...grads };
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getGraphSnapshot(activeNodeId, visitedNodes),
      auxiliaryState: {
        distanceTable: auxGrads,
        customState: {
          outputId: input.outputId,
          seedGrad: input.seedGrad,
        },
      },
      variables,
    });
  };

  addStep(
    2,
    "Initialize Autograd VJP Backward Pass",
    `Setting initial loss seed gradient dL/d(${input.outputId}) = ${input.seedGrad}. All other node gradients zeroed.`,
    { outputId: input.outputId, seedGrad: input.seedGrad },
  );

  grads[input.outputId] = input.seedGrad;
  const visited = new Set<string>();

  addStep(
    3,
    `Seed loss gradient for output '${input.outputId}'`,
    `Output node '${input.outputId}' receives upstream loss gradient dL/dout = ${input.seedGrad}.`,
    { outputId: input.outputId, grad: input.seedGrad },
    input.outputId,
    visited,
  );

  // Reverse order (topological backpropagation)
  const revNodes = [...input.nodes].reverse();

  for (const node of revNodes) {
    const nid = node.id;
    const g = grads[nid];
    visited.add(nid);

    addStep(
      6,
      `Backpropagate through node '${nid}' (op: ${node.op})`,
      `Node '${nid}' has value=${node.val} and accumulated gradient dL/d(${nid}) = ${g.toFixed(
        2,
      )}.`,
      { nid, op: node.op, val: node.val, grad: g },
      nid,
      visited,
    );

    if (node.op === "add" && node.parents.length >= 2) {
      const p0 = node.parents[0];
      const p1 = node.parents[1];
      grads[p0] += g;
      grads[p1] += g;

      addStep(
        13,
        `VJP rule for ADD gate '${nid}': distribute grad ${g} to ${p0} & ${p1}`,
        `Addition gate passes incoming gradient equally to both inputs: dL/d(${p0}) += ${g}, dL/d(${p1}) += ${g}.`,
        { p0, p1, gradPassed: g },
        nid,
        visited,
      );
    } else if (node.op === "mul" && node.parents.length >= 2) {
      const p0 = node.parents[0];
      const p1 = node.parents[1];
      const p0Node = nodeMap.get(p0);
      const p1Node = nodeMap.get(p1);
      const p0Val = p0Node ? p0Node.val : 0;
      const p1Val = p1Node ? p1Node.val : 0;

      const g0 = g * p1Val;
      const g1 = g * p0Val;
      grads[p0] += g0;
      grads[p1] += g1;

      addStep(
        18,
        `VJP rule for MUL gate '${nid}': swap-multiply with forward values`,
        `Multiplication gate VJP: dL/d(${p0}) += dL * val(${p1}) = ${g} * ${p1Val} = ${g0}; dL/d(${p1}) += dL * val(${p0}) = ${g} * ${p0Val} = ${g1}.`,
        { p0, p1, gradP0: g0, gradP1: g1 },
        nid,
        visited,
      );
    } else if (node.op === "relu" && node.parents.length >= 1) {
      const p0 = node.parents[0];
      const p0Node = nodeMap.get(p0);
      const p0Val = p0Node ? p0Node.val : 0;
      const pass = p0Val > 0 ? 1.0 : 0.0;
      const g0 = g * pass;
      grads[p0] += g0;

      addStep(
        22,
        `VJP rule for RELU gate '${nid}': gate gradient by indicator (val > 0)`,
        `ReLU subgradient: dL/d(${p0}) += dL * (val(${p0}) > 0 ? 1 : 0) = ${g} * ${pass} = ${g0}.`,
        { p0, p0Val, pass, gradP0: g0 },
        nid,
        visited,
      );
    }
  }

  addStep(
    24,
    "Autograd VJP Backward Pass complete",
    `Gradients successfully accumulated for all nodes in computational DAG. Leaf input gradients ready for optimizer.`,
    { ...grads },
    undefined,
    visited,
  );

  return steps;
};

const AUTOGRAD_VJP_DAG_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "grads[parents[0]] = g * p0_val",
    "grads[parents[0]] += g / p1_val",
    "if op == 'add': grads[parents[0]] *= g",
    "for node in topological_sort(nodes):",
  ],
  hints: [
    {
      line: 6,
      hint: "Traverse computational DAG nodes in reverse topological order (output to input leaves).",
    },
    {
      line: 13,
      hint: "Add operation derivative distributes incoming gradient uniformly to both parent inputs.",
    },
    {
      line: 18,
      hint: "Multiply operation derivative multiplies incoming gradient by the sibling's forward activation value.",
    },
  ],
  lineExplanations: {
    1: "Defines autograd VJP backward pass for computational graphs.",
    2: "Initializes node gradients dictionary with zeros for all DAG nodes.",
    3: "Seeds the output node gradient with upstream loss gradient (typically 1.0).",
    6: "Iterates through nodes in reverse topological order.",
    13: "Propagates additive VJP: dL/dx += dL/dz for z = x + y.",
    18: "Propagates multiplicative VJP: dL/dx += dL/dz * y for z = x * y.",
    22: "Propagates ReLU VJP: gates gradient based on forward sign indicator.",
    24: "Returns dictionary of accumulated Vector-Jacobian Product gradients for all nodes.",
  },
};

export const autogradVjpDag: AlgorithmDefinition<AutogradVjpInput> = {
  id: "autograd-vjp-dag",
  title: "Autograd Computational Graph & VJP Accumulation",
  topicIds: ["ml_autograd_dags"],
  difficulty: "Medium",
  description:
    "Executes automatic differentiation via Vector-Jacobian Product (VJP) backpropagation over a directed computational graph DAG (Reverse-Mode AD).",
  constraints: [
    "Computational graph is a valid DAG",
    "len(nodes) >= 1",
    "output_id exists in nodes",
    "Supported ops: input, add, mul, relu",
  ],
  examples: [
    {
      kind: "basic",
      title: "Basic Linear Combination (x*y + z)",
      inputDisplay: "x=2, y=3, xy=x*y=6, z=5, out=xy+z=11, seed=1.0",
      outputDisplay: "{x: 3.0, y: 2.0, z: 1.0, xy: 1.0, out: 1.0}",
      input: DEFAULT_AUTOGRAD_VJP_INPUT,
      output: "{x: 3.0, y: 2.0, z: 1.0, xy: 1.0, out: 1.0}",
      explanation:
        "dL/dout = 1. dL/d(xy) = 1, dL/dz = 1. dL/dx = dL/d(xy) * y = 1*3 = 3. dL/dy = dL/d(xy) * x = 1*2 = 2.",
    },
    {
      kind: "complex",
      title: "Gated ReLU Path ((a + b) * relu(c)) with c < 0",
      inputDisplay: "a=1, b=2, c=-3 (relu=0), out=(a+b)*relu(c)=0",
      outputDisplay: "{a: 0.0, b: 0.0, c: 0.0, out: 1.0}",
      input: {
        nodes: [
          { id: "a", label: "a", op: "input", val: 1.0, parents: [] },
          { id: "b", label: "b", op: "input", val: 2.0, parents: [] },
          { id: "ab", label: "a+b", op: "add", val: 3.0, parents: ["a", "b"] },
          { id: "c", label: "c", op: "input", val: -3.0, parents: [] },
          { id: "rc", label: "relu(c)", op: "relu", val: 0.0, parents: ["c"] },
          { id: "out", label: "out", op: "mul", val: 0.0, parents: ["ab", "rc"] },
        ],
        outputId: "out",
        seedGrad: 1.0,
      },
      output: "{a: 0.0, b: 0.0, c: 0.0, ab: 0.0, rc: 3.0, out: 1.0}",
      explanation:
        "Because relu(c) = 0, the multiplicative derivative for (a+b) is 1.0 * relu(c) = 0, blocking gradient flow to a and b.",
    },
    {
      kind: "negative",
      title: "Zero Upstream Seed Gradient Propagation",
      inputDisplay: "x=2, y=3, xy=6, seedGrad=0.0",
      outputDisplay: "{x: 0.0, y: 0.0, xy: 0.0}",
      input: {
        nodes: [
          { id: "x", label: "x", op: "input", val: 2.0, parents: [] },
          { id: "y", label: "y", op: "input", val: 3.0, parents: [] },
          { id: "xy", label: "out", op: "mul", val: 6.0, parents: ["x", "y"] },
        ],
        outputId: "xy",
        seedGrad: 0.0,
      },
      output: "{x: 0.0, y: 0.0, xy: 0.0}",
      explanation:
        "Seeding loss gradient with 0.0 results in 0.0 gradient propagation to all upstream nodes.",
    },
  ],
  code: AUTOGRAD_VJP_DAG_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "Traverses each node and edge in the computational DAG exactly once in reverse topological order, yielding optimal linear time complexity O(V + E).",
    space:
      "Stores accumulated gradients for each node V in auxiliary hash map and topological stack.",
  },
  topicGuide: {
    overview:
      "Reverse-mode Automatic Differentiation (Autograd) powers modern deep learning frameworks like PyTorch and Jax. By traversing the computational graph in reverse topological order, it computes gradients of a scalar loss function with respect to millions/billions of input parameters in a single backward pass.",
    sections: [
      {
        heading: "Vector-Jacobian Products (VJP)",
        body: "Rather than computing full Jacobian matrices explicitly (which would require massive memory), reverse-mode AD computes vector-Jacobian products by propagating scalar loss adjoints backwards through composite functions using the chain rule.",
      },
      {
        heading: "Gradient Accumulation",
        body: "When a node's output feeds into multiple downstream ops (fan-out > 1), multivariate calculus requires summing the gradients coming from all child branches: dL/dx = sum_i (dL/dy_i * dy_i/dx).",
      },
    ],
    keyTerms: [
      {
        term: "Reverse-Mode AD",
        definition:
          "Algorithmic differentiation technique that evaluates derivatives from output loss backward to inputs.",
      },
      {
        term: "Topological Sort",
        definition:
          "Ordering of DAG nodes such that for every directed edge u -> v, node u comes before v.",
      },
    ],
  },
  trivia: AUTOGRAD_VJP_DAG_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_AUTOGRAD_VJP_INPUT,
  generateSteps: generateAutogradVjpDagSteps,
};
