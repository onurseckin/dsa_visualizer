import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface microgradForwardPassInput {
  data: number[];
  target?: number;
}

export const MICROGRADFORWARDPASS_CODE = `def micrograd_forward_pass(a, b, op="+"):
    if op == "+":
        out_val = a + b
        local_grad_a, local_grad_b = 1.0, 1.0
    elif op == "*":
        out_val = a * b
        local_grad_a, local_grad_b = b, a
    else:
        out_val, local_grad_a, local_grad_b = a, 1.0, 0.0

    return out_val, local_grad_a, local_grad_b`;

export const DEFAULT_MICROGRADFORWARDPASS_INPUT: microgradForwardPassInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateMicrogradForwardPassSteps = (
  input: microgradForwardPassInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayData = input?.data || [10, 20, 30, 40, 50];
  const target = input?.target ?? 30;

  const buildGraphSnapshot = (
    activeIdx: number | null,
    activeStage: "inspect" | "op" | "grad" | "done" | "init",
  ): { nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    arrayData.forEach((val, idx) => {
      const a = val;
      const b = (idx + 1) * 5;
      const op = idx % 2 === 0 ? "+" : "*";
      const outVal = op === "+" ? a + b : a * b;
      const localGradA = op === "+" ? 1.0 : b;
      const localGradB = op === "+" ? 1.0 : a;

      const isCurrent = activeIdx === idx;
      const isPast = activeIdx !== null && idx < activeIdx;
      const isFinished = activeStage === "done" || isPast;

      let nodeAState: GraphNodeItem["state"] = "default";
      let nodeBState: GraphNodeItem["state"] = "default";
      let nodeOutState: GraphNodeItem["state"] = "default";

      if (isFinished) {
        nodeAState = "visited";
        nodeBState = "visited";
        nodeOutState = "sorted";
      } else if (isCurrent) {
        if (activeStage === "inspect") {
          nodeAState = "compare";
          nodeBState = "compare";
          nodeOutState = "default";
        } else if (activeStage === "op") {
          nodeAState = "compare";
          nodeBState = "compare";
          nodeOutState = "active";
        } else if (activeStage === "grad") {
          nodeAState = "active";
          nodeBState = "active";
          nodeOutState = "sorted";
        }
      }

      nodes.push({
        id: `node-a-${idx}`,
        label: `a${idx}=${a}`,
        val: a,
        state: nodeAState,
        x: 80 + idx * 160,
        y: 70,
      });

      nodes.push({
        id: `node-b-${idx}`,
        label: `b${idx}=${b}`,
        val: b,
        state: nodeBState,
        x: 80 + idx * 160,
        y: 230,
      });

      nodes.push({
        id: `node-out-${idx}`,
        label: `out${idx}(${op})=${isFinished || (isCurrent && activeStage !== "inspect") ? outVal : "?"}`,
        val: outVal,
        state: nodeOutState,
        x: 160 + idx * 160,
        y: 150,
      });

      const isEdgeTraversed = isFinished || (isCurrent && activeStage !== "inspect");
      const isEdgeActive = isCurrent && (activeStage === "op" || activeStage === "grad");

      edges.push({
        from: `node-a-${idx}`,
        to: `node-out-${idx}`,
        weight: isEdgeTraversed ? localGradA : undefined,
        isTraversed: isEdgeTraversed,
        isPath: isEdgeActive,
      });

      edges.push({
        from: `node-b-${idx}`,
        to: `node-out-${idx}`,
        weight: isEdgeTraversed ? localGradB : undefined,
        isTraversed: isEdgeTraversed,
        isPath: isEdgeActive,
      });
    });

    return { nodes, edges };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIdx: number | null = null,
    activeStage: "inspect" | "op" | "grad" | "done" | "init" = "init",
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        ...buildGraphSnapshot(activeIdx, activeStage),
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

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Micrograd Computational Graph Forward Engine",
    "Setting up scalar `Value` node evaluation pass for dynamic autograd graph execution.",
    { n: arrayData.length, target, phase: "INIT_MICROGRAD_FORWARD" },
    null,
    "init",
    { engine_mode: "EAGER_EXECUTION", grad_enabled: "True" },
  );

  // Step 2: Begin DAG operation traversal
  addStep(
    1,
    "Inspect Operator Input Parameters (a, b, op)",
    "Preparing to evaluate forward mathematical operation and compute local partial derivatives.",
    { operandCount: arrayData.length, phase: "INSPECT_OPERANDS" },
    null,
    "init",
  );

  arrayData.forEach((val, idx) => {
    const a = val;
    const b = (idx + 1) * 5;
    const op = idx % 2 === 0 ? "+" : "*";

    addStep(
      op === "+" ? 2 : 5,
      `Check Op Type for Pair ${idx}: op == "${op}"`,
      `Evaluating operator condition for operands a = ${a}, b = ${b}.`,
      { idx, a, b, op, phase: "CHECK_OP_TYPE" },
      idx,
      "inspect",
      { active_a: String(a), active_b: String(b), active_op: op },
    );

    let outVal = 0;
    let localGradA = 0;
    let localGradB = 0;

    if (op === "+") {
      outVal = a + b;
      localGradA = 1.0;
      localGradB = 1.0;

      addStep(
        3,
        `Compute Forward Addition Sum: out_val = ${a} + ${b} -> ${outVal}`,
        "Executing forward scalar addition operator: out_val = a + b.",
        { a, b, op: "+", outVal, phase: "COMPUTE_ADD_SUM" },
        idx,
        "op",
        { out_val: String(outVal) },
      );

      addStep(
        4,
        `Set Addition Local Derivatives: (d_out/d_a = 1.0, d_out/d_b = 1.0)`,
        "For addition, derivative with respect to both input operands is identity factor 1.0.",
        { localGradA: 1.0, localGradB: 1.0, phase: "SET_ADD_DERIVS" },
        idx,
        "grad",
        { d_out_d_a: "1.0", d_out_d_b: "1.0" },
      );
    } else {
      outVal = a * b;
      localGradA = b;
      localGradB = a;

      addStep(
        6,
        `Compute Forward Multiplication Product: out_val = ${a} * ${b} -> ${outVal}`,
        "Executing forward scalar multiplication operator: out_val = a * b.",
        { a, b, op: "*", outVal, phase: "COMPUTE_MUL_PROD" },
        idx,
        "op",
        { out_val: String(outVal) },
      );

      addStep(
        7,
        `Set Multiplication Local Derivatives: (d_out/d_a = ${b}, d_out/d_b = ${a})`,
        `For multiplication, d(a*b)/da = b (${b}) and d(a*b)/db = a (${a}).`,
        { localGradA: b, localGradB: a, phase: "SET_MUL_DERIVS" },
        idx,
        "grad",
        { d_out_d_a: String(b), d_out_d_b: String(a) },
      );
    }

    addStep(
      11,
      `Return Value Node [Node_${idx}]: (out_val=${outVal}, local_grad_a=${localGradA}, local_grad_b=${localGradB})`,
      `Constructed Micrograd Value node with computed forward scalar ${outVal} and backward derivative closures.`,
      { idx, outVal, localGradA, localGradB, phase: "RETURN_VALUE_NODE" },
      idx,
      "done",
      { node_out: String(outVal), node_d_a: String(localGradA), node_d_b: String(localGradB) },
    );
  });

  addStep(
    11,
    "Verify Full Forward Pass Computational Graph",
    "Checking that all scalar Value objects were instantiated with forward data and backward derivative hooks.",
    { totalNodesEvaluated: arrayData.length, graphBuilt: true },
    null,
    "done",
  );

  addStep(
    11,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    null,
    "done",
  );

  return steps;
};

const MICROGRADFORWARDPASS_TRIVIA: TriviaMeta = {
  skipLines: [10],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "local_grad_a, local_grad_b = a, b",
  ],
  hints: [
    { line: 2, hint: "Check if binary operator is addition (+) or multiplication (*)." },
    { line: 4, hint: "Addition derivatives d(a+b)/da and d(a+b)/db are both 1.0." },
    {
      line: 7,
      hint: "Multiplication derivative d(a*b)/da equals opponent operand b, d(a*b)/db equals a.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for micrograd_forward_pass scalar autograd function.",
    2: "Checks if binary operator string symbol is addition ('+').",
    3: "Computes forward scalar addition sum (out_val = a + b).",
    4: "Sets local partial derivatives for addition: d_out/d_a = 1.0, d_out/d_b = 1.0.",
    5: "Checks if binary operator string symbol is multiplication ('*').",
    6: "Computes forward scalar multiplication product (out_val = a * b).",
    7: "Sets local partial derivatives for multiplication: d_out/d_a = b, d_out/d_b = a.",
    8: "Else fallback branch for identity or custom operator pass.",
    9: "Sets fallback identity values: out_val = a, local_grad_a = 1.0, local_grad_b = 0.0.",
    10: "Empty line before returning computed tuple.",
    11: "Returns triple tuple containing forward output scalar and local partial derivative factors.",
  },
};

export const microgradForwardPass: AlgorithmDefinition<microgradForwardPassInput> = {
  id: "micrograd-forward-pass",
  title: "Micrograd Computational Graph Forward Pass",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  description: `### Micrograd Computational Graph Forward Pass

In Andrej Karpathy's **Micrograd** autograd engine and PyTorch's C++ **ATen core**, every scalar \`Value\` object records its forward mathematical data payload alongside local derivative rules ($\\frac{\\partial \\text{out}}{\\partial a}$ and $\\frac{\\partial \\text{out}}{\\partial b}$) for reverse-mode automatic differentiation.

#### Why It Exists & What It Solves
Eager-mode deep learning frameworks (PyTorch "define-by-run") construct computation graphs dynamically as Python code executes forward instructions.

Without recording local derivatives during the forward pass:
1. The autograd engine cannot determine partial derivative rules for individual math ops during backpropagation.
2. Symbolic derivative generators require complex expression trees, whereas local derivative rules can be computed instantly from forward operand values.

With forward pass local gradient binding:
- **Addition ($z = a + b$)**:
  $$\\frac{\\partial z}{\\partial a} = 1.0, \\quad \\frac{\\partial z}{\\partial b} = 1.0$$
- **Multiplication ($z = a \\times b$)**:
  $$\\frac{\\partial z}{\\partial a} = b, \\quad \\frac{\\partial z}{\\partial b} = a$$
- Each \`Value\` node encapsulates its scalar output \`out_val\` and a \`_backward\` closure that multiplies upstream incoming gradients by these local derivative factors.

#### Step-by-Step Mechanism
1. **Operator Inspection**: Check operator type (\`+\`, \`*\`, or identity fallback).
2. **Forward Value Evaluation**: Compute scalar output \`out_val\` (e.g. $a + b$ or $a \\times b$).
3. **Local Derivative Calculation**:
   - For addition: set \`local_grad_a = 1.0\`, \`local_grad_b = 1.0\`.
   - For multiplication: set \`local_grad_a = b\`, \`local_grad_b = a\`.
4. **Return Value Node Tuple**: Return \`(out_val, local_grad_a, local_grad_b)\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(1)$ constant time per scalar operator evaluation ($\\mathcal{O}(N)$ for $N$ graph ops).
- **Space Complexity**: $\\mathcal{O}(1)$ space per \`Value\` object ($\\mathcal{O}(V)$ for storing activation graph nodes).
- **Trade-Off**: Enables seamless eager-mode execution at the cost of allocating graph node wrappers for every intermediate forward calculation.`,
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
  code: MICROGRADFORWARDPASS_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Constant time O(1) evaluation for individual scalar arithmetic operations.",
    space: "Constant memory O(1) per scalar Value node instantiation.",
  },
  topicGuide: {
    overview:
      "Micrograd demonstrates automatic differentiation in its simplest form. Each arithmetic operation returns a new Value object storing its forward data value, child pointers, and local derivative rules.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For $z = a + b$, $\\frac{\\partial z}{\\partial a} = 1.0, \\frac{\\partial z}{\\partial b} = 1.0$. For $z = a \\times b$, $\\frac{\\partial z}{\\partial a} = b, \\frac{\\partial z}{\\partial b} = a$. Backpropagation multiplies upstream gradient $\\text{grad}\\_z$ by these local derivatives.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Building forward computation graphs dynamically enables PyTorch's eager-mode define-by-run autograd execution model with near-zero overhead.",
      },
      {
        heading: "Implementation Details & Local Gradients",
        body: "Implementation evaluates operator math, computes local partial derivatives, and returns output value node wrappers.",
      },
      {
        heading: "Edge Case Analysis & Zero Operands",
        body: "Edge cases include zero operands in multiplication (where local derivative $\\frac{\\partial (a \\times b)}{\\partial a} = b = 0$).",
      },
    ],
    keyTerms: [
      {
        term: "Micrograd Value",
        definition:
          "A scalar wrapper object storing data value, gradient, children, and backward derivative function.",
      },
      {
        term: "Local Derivative",
        definition:
          "Partial derivative of an operation with respect to its immediate input operands.",
      },
      {
        term: "Eager Autograd",
        definition:
          "Building autograd computation graphs dynamically on-the-fly during forward execution.",
      },
    ],
  },
  trivia: MICROGRADFORWARDPASS_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_MICROGRADFORWARDPASS_INPUT,
  generateSteps: generateMicrogradForwardPassSteps,
};
