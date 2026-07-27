import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface OnnxOpNode {
  id: string;
  opType: string;
  inputs: string[];
  outputs: string[];
}

export interface OnnxOperatorFusionInput {
  nodes: OnnxOpNode[];
}

export const ONNX_OPERATOR_FUSION_CODE = `def fuse_onnx_operators(nodes: list[dict]) -> list[dict]:
    """
    Passes over an ONNX computational graph to fuse adjacent operator patterns
    (e.g., Conv -> BatchNormalization -> Relu => FusedConvBNRelu,
           MatMul -> Add -> Relu => GemmRelu) into consolidated operators.
    Reduces memory bandwidth by eliminating intermediate tensor materialization in DRAM.
    """
    fused_nodes = []
    i = 0
    n = len(nodes)
    
    while i < n:
        # Check 3-node fusion pattern: Conv -> BatchNormalization -> Relu
        if (i + 2 < n and 
            nodes[i]["opType"] == "Conv" and 
            nodes[i+1]["opType"] == "BatchNormalization" and 
            nodes[i+2]["opType"] == "Relu" and
            nodes[i]["outputs"] == nodes[i+1]["inputs"][:1] and
            nodes[i+1]["outputs"] == nodes[i+2]["inputs"]):
            
            fused_nodes.append({
                "id": f"fused_{nodes[i]['id']}_{nodes[i+2]['id']}",
                "opType": "FusedConvBNRelu",
                "inputs": nodes[i]["inputs"] + nodes[i+1]["inputs"][1:],
                "outputs": nodes[i+2]["outputs"]
            })
            i += 3
            continue
            
        # Check 3-node fusion pattern: MatMul -> Add -> Relu
        if (i + 2 < n and 
            nodes[i]["opType"] == "MatMul" and 
            nodes[i+1]["opType"] == "Add" and 
            nodes[i+2]["opType"] == "Relu" and
            nodes[i]["outputs"] == nodes[i+1]["inputs"][:1] and
            nodes[i+1]["outputs"] == nodes[i+2]["inputs"]):
            
            fused_nodes.append({
                "id": f"fused_{nodes[i]['id']}_{nodes[i+2]['id']}",
                "opType": "GemmRelu",
                "inputs": nodes[i]["inputs"] + nodes[i+1]["inputs"][1:],
                "outputs": nodes[i+2]["outputs"]
            })
            i += 3
            continue
            
        # Check 2-node fusion pattern: MatMul -> Add
        if (i + 1 < n and 
            nodes[i]["opType"] == "MatMul" and 
            nodes[i+1]["opType"] == "Add" and
            nodes[i]["outputs"] == nodes[i+1]["inputs"][:1]):
            
            fused_nodes.append({
                "id": f"fused_{nodes[i]['id']}_{nodes[i+1]['id']}",
                "opType": "Gemm",
                "inputs": nodes[i]["inputs"] + nodes[i+1]["inputs"][1:],
                "outputs": nodes[i+1]["outputs"]
            })
            i += 2
            continue
            
        fused_nodes.append(nodes[i])
        i += 1
        
    return fused_nodes`;

export const DEFAULT_ONNX_OPERATOR_FUSION_INPUT: OnnxOperatorFusionInput = {
  nodes: [
    { id: "node1", opType: "Conv", inputs: ["X", "W"], outputs: ["Y1"] },
    {
      id: "node2",
      opType: "BatchNormalization",
      inputs: ["Y1", "scale", "bias", "mean", "var"],
      outputs: ["Y2"],
    },
    { id: "node3", opType: "Relu", inputs: ["Y2"], outputs: ["Y3"] },
    { id: "node4", opType: "MatMul", inputs: ["Y3", "W2"], outputs: ["Y4"] },
    { id: "node5", opType: "Add", inputs: ["Y4", "B2"], outputs: ["Y5"] },
    { id: "node6", opType: "Relu", inputs: ["Y5"], outputs: ["Y6"] },
  ],
};

export const generateOnnxOperatorFusionSteps = (
  input: OnnxOperatorFusionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const initialNodes = input.nodes;
  const elements: ArrayElement[] = initialNodes.map((node, index) => ({
    id: `node-${index}`,
    value: node.opType,
    state: "default",
    pointers: [`[${node.inputs.join(",")}] -> ${node.outputs.join(",")}`],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize ONNX Graph Pattern Fusion Pass",
      why: `Loaded graph with ${initialNodes.length} ONNX operator nodes. Analyzing graph topology for kernel fusion targets.`,
    },
    primarySnapshot: {
      kind: "array",
      elements,
    },
    auxiliaryState: {
      customState: {
        totalNodes: String(initialNodes.length),
        fusedCount: "0",
      },
    },
    variables: { initialCount: initialNodes.length, index: 0 },
  });

  const fusedNodes: OnnxOpNode[] = [];
  let i = 0;
  const n = initialNodes.length;

  while (i < n) {
    // Check Conv -> BN -> Relu
    if (
      i + 2 < n &&
      initialNodes[i].opType === "Conv" &&
      initialNodes[i + 1].opType === "BatchNormalization" &&
      initialNodes[i + 2].opType === "Relu"
    ) {
      const fusedOp: OnnxOpNode = {
        id: `fused_${initialNodes[i].id}_${initialNodes[i + 2].id}`,
        opType: "FusedConvBNRelu",
        inputs: [...initialNodes[i].inputs, ...initialNodes[i + 1].inputs.slice(1)],
        outputs: initialNodes[i + 2].outputs,
      };

      const stepElements: ArrayElement[] = initialNodes.map((node, idx) => {
        let state: ElementState = "default";
        if (idx >= i && idx <= i + 2) state = "active";
        else if (idx < i) state = "visited";
        return {
          id: `node-${idx}`,
          value: node.opType,
          state,
          pointers: [node.id],
        };
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Match 3-Node Pattern: Conv -> BatchNormalization -> Relu at indices ${i}..${i + 2}`,
          why: `Fused nodes [${initialNodes[i].opType}, ${initialNodes[i + 1].opType}, ${initialNodes[i + 2].opType}] into single ONNX operator 'FusedConvBNRelu'. Eliminates 2 intermediate DRAM writes.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: stepElements,
        },
        auxiliaryState: {
          customState: {
            fusedOp: fusedOp.opType,
            eliminatedTensors: `${initialNodes[i].outputs.join(",")}, ${initialNodes[i + 1].outputs.join(",")}`,
          },
        },
        variables: { index: i, patternMatched: "Conv+BN+Relu" },
      });

      fusedNodes.push(fusedOp);
      i += 3;
      continue;
    }

    // Check MatMul -> Add -> Relu
    if (
      i + 2 < n &&
      initialNodes[i].opType === "MatMul" &&
      initialNodes[i + 1].opType === "Add" &&
      initialNodes[i + 2].opType === "Relu"
    ) {
      const fusedOp: OnnxOpNode = {
        id: `fused_${initialNodes[i].id}_${initialNodes[i + 2].id}`,
        opType: "GemmRelu",
        inputs: [...initialNodes[i].inputs, ...initialNodes[i + 1].inputs.slice(1)],
        outputs: initialNodes[i + 2].outputs,
      };

      const stepElements: ArrayElement[] = initialNodes.map((node, idx) => {
        let state: ElementState = "default";
        if (idx >= i && idx <= i + 2) state = "active";
        else if (idx < i) state = "visited";
        return {
          id: `node-${idx}`,
          value: node.opType,
          state,
          pointers: [node.id],
        };
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 28,
        explanation: {
          what: `Match 3-Node Pattern: MatMul -> Add -> Relu at indices ${i}..${i + 2}`,
          why: `Fused linear projection + bias add + activation into consolidated 'GemmRelu' kernel.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: stepElements,
        },
        auxiliaryState: {
          customState: {
            fusedOp: fusedOp.opType,
            eliminatedTensors: `${initialNodes[i].outputs.join(",")}`,
          },
        },
        variables: { index: i, patternMatched: "MatMul+Add+Relu" },
      });

      fusedNodes.push(fusedOp);
      i += 3;
      continue;
    }

    // Check MatMul -> Add
    if (i + 1 < n && initialNodes[i].opType === "MatMul" && initialNodes[i + 1].opType === "Add") {
      const fusedOp: OnnxOpNode = {
        id: `fused_${initialNodes[i].id}_${initialNodes[i + 1].id}`,
        opType: "Gemm",
        inputs: [...initialNodes[i].inputs, ...initialNodes[i + 1].inputs.slice(1)],
        outputs: initialNodes[i + 1].outputs,
      };

      const stepElements: ArrayElement[] = initialNodes.map((node, idx) => {
        let state: ElementState = "default";
        if (idx >= i && idx <= i + 1) state = "active";
        else if (idx < i) state = "visited";
        return {
          id: `node-${idx}`,
          value: node.opType,
          state,
          pointers: [node.id],
        };
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 42,
        explanation: {
          what: `Match 2-Node Pattern: MatMul -> Add at indices ${i}..${i + 1}`,
          why: `Fused matrix multiply and bias add into standard ONNX Gemm operator.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: stepElements,
        },
        auxiliaryState: {
          customState: {
            fusedOp: fusedOp.opType,
          },
        },
        variables: { index: i, patternMatched: "MatMul+Add" },
      });

      fusedNodes.push(fusedOp);
      i += 2;
      continue;
    }

    fusedNodes.push(initialNodes[i]);
    i++;
  }

  const finalElements: ArrayElement[] = fusedNodes.map((node, idx) => ({
    id: `fused-node-${idx}`,
    value: node.opType,
    state: "sorted",
    pointers: [node.id],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 52,
    explanation: {
      what: "ONNX Graph Pattern Fusion Complete",
      why: `Reduced computational graph from ${initialNodes.length} nodes to ${fusedNodes.length} optimized nodes.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        originalNodes: String(initialNodes.length),
        fusedNodes: String(fusedNodes.length),
        reductionRatio: `${(((initialNodes.length - fusedNodes.length) / initialNodes.length) * 100).toFixed(1)}%`,
      },
    },
    variables: { completed: true, finalCount: fusedNodes.length },
  });

  return steps;
};

const ONNX_OPERATOR_FUSION_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7],
  hints: [
    { line: 14, hint: "Match 3-node sequence: Conv -> BatchNormalization -> Relu." },
    { line: 28, hint: "Match 3-node sequence: MatMul -> Add -> Relu into GemmRelu." },
    { line: 42, hint: "Match 2-node sequence: MatMul -> Add into Gemm." },
  ],
  distractors: [
    "fused_nodes.append(nodes[i+1])",
    "if nodes[i]['opType'] == 'Relu': i += 2",
    "nodes[i]['inputs'] = nodes[i]['outputs']",
  ],
  lineExplanations: {
    1: "Defines entry point for ONNX operator fusion optimization pass.",
    14: "Fuses Convolution, Batch Normalization, and ReLU into a single fused ONNX op node.",
    28: "Fuses MatMul, Add, and ReLU into a GemmRelu op node.",
    42: "Fuses MatMul and Add into an ONNX Gemm node.",
    52: "Returns the optimized graph node list.",
  },
};

export const onnxOperatorFusion: AlgorithmDefinition<OnnxOperatorFusionInput> = {
  id: "onnx-operator-fusion",
  title: "ONNX Operator Fusion & Pattern Matching Pass",
  category: "ml_graph_compilers",
  categories: ["ml_graph_compilers"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_graph_compilers",
  description:
    "Open Neural Network Exchange (ONNX) operator fusion is a graph optimization pass that identifies subgraph patterns of adjacent operators—such as $\\text{Conv} \\to \\text{BatchNormalization} \\to \\text{ReLU}$ or $\\text{MatMul} \\to \\text{Add} \\to \\text{ReLU}$—and replaces them with a single fused operator node.\n\nFusing operations eliminates intermediate tensor allocations in high-bandwidth GPU memory (HBM) and replaces multiple GPU kernel launches with a single monolithic kernel call.\n\nInput Format:\n- nodes: Array of ONNX graph node objects containing `id`, `opType`, `inputs`, and `outputs` tensor references.\n\nOutput Format:\n- Returns optimized list of ONNX graph nodes with matched subgraphs collapsed into fused operators.\n\nEdge Cases & Constraints:\n- Branching DAG outputs: Nodes with fan-out $> 1$ (multiple downstream consumers) cannot be fused into single-consumer operators.\n- Tensor shape mismatches: Dynamic input dimensions require runtime shape verification prior to applying folded transformations.\n- Topological order preservation: Graph rewrites must maintain strict topological dependency invariants across node lists.",
  constraints: ["1 <= nodes.length <= 100", "node.opType is valid ONNX primitive string"],
  examples: [
    {
      kind: "basic",
      title: "Conv + BN + ReLU Fusion",
      inputDisplay: "Conv -> BatchNormalization -> Relu -> MatMul -> Add -> Relu",
      outputDisplay: "FusedConvBNRelu -> GemmRelu",
      input: DEFAULT_ONNX_OPERATOR_FUSION_INPUT,
      output: "FusedConvBNRelu, GemmRelu",
      explanation:
        "Pass matches two 3-node subgraphs and collapses 6 individual operators into 2 optimized fused execution nodes.",
    },
    {
      kind: "complex",
      title: "MatMul + Add Gemm Conversion",
      inputDisplay: "MatMul -> Add",
      outputDisplay: "Gemm",
      input: {
        nodes: [
          { id: "n1", opType: "MatMul", inputs: ["A", "B"], outputs: ["C"] },
          { id: "n2", opType: "Add", inputs: ["C", "bias"], outputs: ["D"] },
        ],
      },
      output: "Gemm",
      explanation:
        "Fuses matrix multiplication and bias addition into standard ONNX Gemm operator.",
    },
    {
      kind: "negative",
      title: "Unfusable Isolated Operators",
      inputDisplay: "Softmax -> Reshape",
      outputDisplay: "Softmax -> Reshape",
      input: {
        nodes: [
          { id: "n1", opType: "Softmax", inputs: ["X"], outputs: ["Y"] },
          { id: "n2", opType: "Reshape", inputs: ["Y", "shape"], outputs: ["Z"] },
        ],
      },
      output: "Softmax, Reshape",
      explanation:
        "No fusion pattern matches Softmax -> Reshape, so original topology is preserved.",
    },
  ],
  code: ONNX_OPERATOR_FUSION_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N) linear sweep over N graph nodes matching candidate pattern subgraphs.",
    space: "O(N) memory allocation for rewritten fused graph topology.",
  },
  topicGuide: {
    overview:
      "ONNX Operator Fusion is an essential compilation pass in deep learning runtimes like ONNX Runtime, TensorRT, and OpenVINO. By analyzing the Directed Acyclic Graph (DAG) representation of a neural network, graph compilers replace sequences of fine-grained primitive operations with coarse-grained fused kernels, radically reducing DRAM memory bandwidth consumption.",
    sections: [
      {
        heading: "Core Concepts & Mathematical Operator Folding",
        body: "Operator fusion operates at two levels: mathematical folding and kernel fusion. Batch Normalization folding mathematically merges linear BN parameters $(\\gamma, \\beta, \\mu, \\sigma^2)$ directly into Convolution weights and biases: $W_{\\text{fused}} = W \\cdot \\frac{\\gamma}{\\sqrt{\\sigma^2 + \\epsilon}}$, $b_{\\text{fused}} = (b - \\mu) \\cdot \\frac{\\gamma}{\\sqrt{\\sigma^2 + \\epsilon}} + \\beta$. This eliminates the BatchNormalization operator completely prior to execution.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance Impact",
        body: "Without fusion, an unoptimized sequence $\\text{Conv} \\to \\text{BN} \\to \\text{ReLU}$ requires writing intermediate feature maps to GPU High Bandwidth Memory (HBM) and re-reading them twice. Under memory-bound regimes, DRAM reads/writes dominate latency. Fused kernels compute convolution, batch norm scaling, and ReLU activation inside SRAM registers, achieving near-zero overhead for elementwise steps.",
      },
      {
        heading: "Implementation Nuances & Compiler Pass Architecture",
        body: "Graph rewriters traverse nodes in topological order using pattern matchers (e.g. tree-matching AST rewrites). When a candidate pattern matches, the rewriter validates edge constraints (ensuring intermediate outputs have out-degree $1$) and substitutes the subgraph with a new `NodeProto`.",
      },
      {
        heading: "Edge Cases & Production Optimization Bounds",
        body: "If an intermediate tensor is referenced by multiple downstream nodes (fan-out $> 1$), naive fusion would require recomputing the intermediate value or result in incorrect execution. Advanced compilers duplicate small elementwise computations or split the graph at branch points.",
      },
    ],
    keyTerms: [
      {
        term: "Operator Fusion",
        definition:
          "Graph compiler optimization combining multiple adjacent operations into a single kernel to avoid memory roundtrips.",
      },
      {
        term: "Batch Normalization Folding",
        definition:
          "Mathematical transformation absorbing linear BN parameters directly into Convolution weight matrices at compile time.",
      },
      {
        term: "DRAM Bandwidth Bottleneck",
        definition:
          "Performance limit where GPU execution speed is constrained by memory transfer rate rather than compute TFLOPS.",
      },
      {
        term: "Topological Graph Rewrite",
        definition:
          "Algorithmic modification of a computational DAG maintaining valid execution dependency order.",
      },
    ],
  },
  trivia: ONNX_OPERATOR_FUSION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_ONNX_OPERATOR_FUSION_INPUT,
  generateSteps: generateOnnxOperatorFusionSteps,
};
