import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
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
    fused_nodes = []
    i = 0
    n = len(nodes)
    while i < n:
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
    { id: "node1", opType: "Conv", inputs: ["X", "W1"], outputs: ["Y1"] },
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
    { id: "node7", opType: "Conv", inputs: ["Y6", "W3"], outputs: ["Y7"] },
    {
      id: "node8",
      opType: "BatchNormalization",
      inputs: ["Y7", "s3", "b3", "m3", "v3"],
      outputs: ["Y8"],
    },
    { id: "node9", opType: "Relu", inputs: ["Y8"], outputs: ["Y9"] },
    { id: "node10", opType: "Softmax", inputs: ["Y9"], outputs: ["Prob"] },
  ],
};

function buildGraphSnapshot(
  nodes: OnnxOpNode[],
  currentIndex: number,
  fusedRange: [number, number] | null,
  _fusedNodesSoFar: Array<{ id: string; opType: string; status: string }>,
): GraphVisualSnapshot {
  const graphNodes: GraphNodeItem[] = [];
  const graphEdges: GraphEdgeItem[] = [];
  const n = nodes.length;

  nodes.forEach((node, r) => {
    let state: ElementState = "default";

    if (fusedRange && r >= fusedRange[0] && r <= fusedRange[1]) {
      state = "active";
    } else if (r < currentIndex) {
      state = "sorted";
    } else if (r === currentIndex) {
      state = "pivot";
    }

    const cols = 5;
    const col = r % cols;
    const row = Math.floor(r / cols);
    const x = 100 + col * 160;
    const y = 100 + row * 150;

    graphNodes.push({
      id: node.id,
      label: `${node.id}\n[${node.opType}]`,
      x,
      y,
      state,
      val: r,
    });
  });

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const srcOutputs = nodes[i].outputs;
      const dstInputs = nodes[j].inputs;
      const connected = srcOutputs.some((out) => dstInputs.includes(out));

      if (connected) {
        const isTraversed = i < currentIndex && j <= currentIndex;
        const isPath = Boolean(fusedRange && i >= fusedRange[0] && j <= fusedRange[1]);

        graphEdges.push({
          from: nodes[i].id,
          to: nodes[j].id,
          isTraversed,
          isPath,
        });
      }
    }
  }

  return {
    kind: "graph",
    nodes: graphNodes,
    edges: graphEdges,
  };
}

export const generateOnnxOperatorFusionSteps = (
  input: OnnxOperatorFusionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const initialNodes = input.nodes;
  const n = initialNodes.length;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentIndex: number,
    fusedRange: [number, number] | null,
    fusedNodesSoFar: Array<{ id: string; opType: string; status: string }>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildGraphSnapshot(initialNodes, currentIndex, fusedRange, fusedNodesSoFar),
      auxiliaryState: {
        customState: {
          totalNodes: String(n),
          currentIndex: String(currentIndex),
          fusedNodesCount: String(fusedNodesSoFar.length),
        },
      },
      variables,
    });
  };

  const fusedNodes: OnnxOpNode[] = [];
  const fusedTracker: Array<{ id: string; opType: string; status: string }> = [];

  addStep(
    1,
    "Start ONNX Operator Fusion Pass",
    "Initializing graph pattern matching engine to identify candidate operator sequences for hardware kernel fusion.",
    { i: 0, n, fused_count: 0 },
    0,
    null,
    fusedTracker,
  );

  addStep(
    2,
    "Initialize Fused Node Output Queue",
    "Creating empty container fused_nodes to store transformed graph topology.",
    { i: 0, n, fused_count: 0 },
    0,
    null,
    fusedTracker,
  );

  addStep(
    3,
    "Initialize Pointer Index i = 0",
    "Setting iteration index pointer to 0.",
    { i: 0, n },
    0,
    null,
    fusedTracker,
  );

  addStep(
    4,
    `Compute Total Node Count n = ${n}`,
    `Loaded ${n} graph nodes for sequential pattern evaluation.`,
    { i: 0, n },
    0,
    null,
    fusedTracker,
  );

  let i = 0;
  while (i < n) {
    addStep(
      5,
      `Loop Evaluation at Index i = ${i}`,
      `Checking node ${initialNodes[i].id} (${initialNodes[i].opType}) against fusion pattern library.`,
      { i, n, current_op: initialNodes[i].opType },
      i,
      null,
      fusedTracker,
    );

    // Pattern 1: Conv -> BN -> Relu
    addStep(
      6,
      `Check Pattern 1: Conv -> BatchNormalization -> Relu at i = ${i}`,
      "Evaluating 3-node sequence window for convolution, batch normalization, and activation.",
      { i, pattern: "Conv+BN+Relu" },
      i,
      null,
      fusedTracker,
    );

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

      fusedNodes.push(fusedOp);
      fusedTracker.push({ id: fusedOp.id, opType: fusedOp.opType, status: "Fused 3-op" });

      addStep(
        12,
        `Fuse Nodes [${initialNodes[i].id}, ${initialNodes[i + 1].id}, ${initialNodes[i + 2].id}] into FusedConvBNRelu`,
        "Fused 3 ops into single kernel. Eliminates 2 intermediate DRAM memory writebacks.",
        { i, fused_id: fusedOp.id, new_opType: fusedOp.opType },
        i,
        [i, i + 2],
        fusedTracker,
      );

      i += 3;
      addStep(
        18,
        `Advance Index Pointer i by 3 to ${i}`,
        "Skipping consumed nodes in input graph.",
        { i },
        i,
        null,
        fusedTracker,
      );
      addStep(
        19,
        "Continue Optimization Loop",
        "Proceeding to next graph node window.",
        { i },
        i,
        null,
        fusedTracker,
      );
      continue;
    }

    // Pattern 2: MatMul -> Add -> Relu
    addStep(
      20,
      `Check Pattern 2: MatMul -> Add -> Relu at i = ${i}`,
      "Evaluating 3-node sequence window for matrix multiply, bias add, and activation.",
      { i, pattern: "MatMul+Add+Relu" },
      i,
      null,
      fusedTracker,
    );

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

      fusedNodes.push(fusedOp);
      fusedTracker.push({ id: fusedOp.id, opType: fusedOp.opType, status: "Fused 3-op GemmRelu" });

      addStep(
        26,
        `Fuse Nodes [${initialNodes[i].id}, ${initialNodes[i + 1].id}, ${initialNodes[i + 2].id}] into GemmRelu`,
        "Collapsed linear projection, bias add, and activation into monolithic GemmRelu kernel.",
        { i, fused_id: fusedOp.id },
        i,
        [i, i + 2],
        fusedTracker,
      );

      i += 3;
      addStep(
        32,
        `Advance Index Pointer i by 3 to ${i}`,
        "Skipping consumed linear projection nodes.",
        { i },
        i,
        null,
        fusedTracker,
      );
      addStep(
        33,
        "Continue Optimization Loop",
        "Proceeding to next graph node window.",
        { i },
        i,
        null,
        fusedTracker,
      );
      continue;
    }

    // Pattern 3: MatMul -> Add
    addStep(
      34,
      `Check Pattern 3: MatMul -> Add at i = ${i}`,
      "Evaluating 2-node sequence for matrix multiply and bias addition.",
      { i, pattern: "MatMul+Add" },
      i,
      null,
      fusedTracker,
    );

    if (i + 1 < n && initialNodes[i].opType === "MatMul" && initialNodes[i + 1].opType === "Add") {
      const fusedOp: OnnxOpNode = {
        id: `fused_${initialNodes[i].id}_${initialNodes[i + 1].id}`,
        opType: "Gemm",
        inputs: [...initialNodes[i].inputs, ...initialNodes[i + 1].inputs.slice(1)],
        outputs: initialNodes[i + 1].outputs,
      };

      fusedNodes.push(fusedOp);
      fusedTracker.push({ id: fusedOp.id, opType: fusedOp.opType, status: "Fused 2-op Gemm" });

      addStep(
        38,
        `Fuse Nodes [${initialNodes[i].id}, ${initialNodes[i + 1].id}] into Gemm`,
        "Fused matrix multiply and bias addition into standard ONNX Gemm operator.",
        { i, fused_id: fusedOp.id },
        i,
        [i, i + 1],
        fusedTracker,
      );

      i += 2;
      addStep(
        44,
        `Advance Index Pointer i by 2 to ${i}`,
        "Skipping fused Gemm nodes.",
        { i },
        i,
        null,
        fusedTracker,
      );
      addStep(
        45,
        "Continue Optimization Loop",
        "Proceeding to next graph node window.",
        { i },
        i,
        null,
        fusedTracker,
      );
      continue;
    }

    // Fallback: append unfused node
    fusedNodes.push(initialNodes[i]);
    fusedTracker.push({
      id: initialNodes[i].id,
      opType: initialNodes[i].opType,
      status: "Unfused",
    });

    addStep(
      46,
      `No Pattern Match for Node ${initialNodes[i].id} (${initialNodes[i].opType})`,
      "Retaining node as isolated unfused operator in transformed graph topology.",
      { i, node_id: initialNodes[i].id, opType: initialNodes[i].opType },
      i,
      null,
      fusedTracker,
    );

    i += 1;
    addStep(
      47,
      `Advance Index Pointer i to ${i}`,
      "Moving to next graph node.",
      { i },
      i,
      null,
      fusedTracker,
    );
  }

  addStep(
    48,
    "ONNX Operator Fusion Pass Complete",
    `Successfully transformed graph from ${n} original nodes to ${fusedNodes.length} optimized execution nodes.`,
    { originalCount: n, finalCount: fusedNodes.length },
    n,
    null,
    fusedTracker,
  );

  return steps;
};

const ONNX_OPERATOR_FUSION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "fused_nodes.append(nodes[i+1])",
    "if nodes[i]['opType'] == 'Relu': i += 2",
    "nodes[i]['inputs'] = nodes[i]['outputs']",
    "i -= 1",
  ],
  hints: [
    { line: 6, hint: "Check 3-node sequence window: Conv -> BatchNormalization -> Relu." },
    { line: 20, hint: "Check 3-node sequence window: MatMul -> Add -> Relu into GemmRelu." },
    { line: 34, hint: "Check 2-node sequence window: MatMul -> Add into Gemm." },
    { line: 46, hint: "Fallback path appending unfused node when no pattern matches." },
  ],
  lineExplanations: {
    1: "Function signature defining fuse_onnx_operators receiving graph node dictionary list.",
    2: "Initializes empty list fused_nodes to accumulate optimized graph operator nodes.",
    3: "Sets loop iteration pointer i to index 0.",
    4: "Calculates total number of graph nodes n = len(nodes).",
    5: "Main loop iterating while index i is less than total node count n.",
    6: "Evaluates condition for 3-node Conv -> BatchNormalization -> Relu pattern.",
    7: "Verifies current node at index i has opType 'Conv'.",
    8: "Verifies next node at index i+1 has opType 'BatchNormalization'.",
    9: "Verifies third node at index i+2 has opType 'Relu'.",
    10: "Validates tensor connectivity from Conv output to BatchNormalization input.",
    11: "Validates tensor connectivity from BatchNormalization output to Relu input.",
    12: "Appends new fused operator dictionary to fused_nodes list.",
    13: "Assigns composite identifier joining first and last node IDs.",
    14: "Sets opType to FusedConvBNRelu for consolidated kernel dispatch.",
    15: "Combines external inputs from Conv and BatchNormalization parameters.",
    16: "Sets output tensor reference to final Relu node output.",
    17: "Closes fused node dictionary payload.",
    18: "Advances loop index i by 3 to skip the three fused nodes.",
    19: "Continues to next iteration of optimization loop.",
    20: "Evaluates condition for 3-node MatMul -> Add -> Relu pattern.",
    21: "Verifies current node at index i has opType 'MatMul'.",
    22: "Verifies next node at index i+1 has opType 'Add'.",
    23: "Verifies third node at index i+2 has opType 'Relu'.",
    24: "Validates tensor output of MatMul matches input of Add.",
    25: "Validates tensor output of Add matches input of Relu.",
    26: "Appends GemmRelu fused operator node to fused_nodes.",
    27: "Assigns composite identifier for fused GemmRelu node.",
    28: "Sets opType to GemmRelu.",
    29: "Combines inputs from MatMul and bias addition.",
    30: "Sets output to final Relu output tensor.",
    31: "Closes GemmRelu dictionary payload.",
    32: "Advances loop index i by 3.",
    33: "Continues to next loop iteration.",
    34: "Evaluates condition for 2-node MatMul -> Add pattern.",
    35: "Verifies current node at index i has opType 'MatMul'.",
    36: "Verifies next node at index i+1 has opType 'Add'.",
    37: "Validates tensor output of MatMul feeds into Add input.",
    38: "Appends Gemm fused operator node.",
    39: "Assigns composite identifier for Gemm node.",
    40: "Sets opType to standard ONNX Gemm operator.",
    41: "Combines inputs from MatMul and Add.",
    42: "Sets output tensor to Add output.",
    43: "Closes Gemm dictionary payload.",
    44: "Advances loop index i by 2.",
    45: "Continues to next loop iteration.",
    46: "Appends unfused current node nodes[i] directly to fused_nodes list.",
    47: "Advances loop index i by 1 for unfused node.",
    48: "Returns list of optimized fused graph nodes.",
  },
};

export const onnxOperatorFusion: AlgorithmDefinition<OnnxOperatorFusionInput> = {
  id: "onnx-operator-fusion",
  title: "ONNX Operator Fusion & Pattern Matching Pass",
  topicIds: ["ml_graph_compilers"],
  difficulty: "Hard",
  description:
    "Open Neural Network Exchange (ONNX) operator fusion is a fundamental graph compiler pass designed to eliminate memory bandwidth bottlenecks in deep learning inference runtimes. In unoptimized graphs, every individual operator—such as Convolution, Batch Normalization, and Activation—executes as a separate GPU kernel launch. Each kernel reads input activation tensors from High Bandwidth Memory (HBM/DRAM) and writes output activation tensors back to HBM. Because elementwise and normalization operations are memory-bandwidth bound, reading and writing intermediate tensors dominates overall execution latency.\n\n### Mathematical Formulation & Kernel Fusion\nFor an un-fused sequence $\\text{Conv} \\to \\text{BatchNormalization} \\to \\text{ReLU}$ operating on input tensor $X \\in \\mathbb{R}^{B \\times C \\times H \\times W}$:\n$$\\text{Conv: } Y_1 = X \\ast W + b$$\n$$\\text{BN: } Y_2 = \\gamma \\left( \\frac{Y_1 - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}} \\right) + \\beta$$\n$$\\text{ReLU: } Y_3 = \\max(0, Y_2)$$\nExecuting this un-fused sequence requires 3 separate GPU kernel launches and 6 DRAM memory accesses per element (3 writes, 3 reads), producing total memory traffic $M_{\\text{unfused}} = 6 \\cdot S \\cdot \\text{sizeof}(\\text{float})$, where $S = B \\times C \\times H \\times W$.\n\nFusing these operations into a single monolithic kernel $\\text{FusedConvBNRelu}$ computes $Y_3 = \\max\\left(0, \\gamma \\left( \\frac{(X \\ast W + b) - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}} \\right) + \\beta \\right)$ directly within register space / L1 cache. Total DRAM memory traffic drops to $M_{\\text{fused}} = 2 \\cdot S \\cdot \\text{sizeof}(\\text{float})$ (1 input read, 1 output write), achieving a theoretical bandwidth speedup ratio:\n$$\\text{Speedup} = \\frac{M_{\\text{unfused}}}{M_{\\text{fused}}} = \\frac{6}{2} = 3\\times$$\n\n### Pass Algorithm Overview\nThis optimization pass traverses the computational Directed Acyclic Graph (DAG) in topological order using pattern matching heuristics. It identifies subgraphs of adjacent operations—such as $\\text{Conv} \\to \\text{BatchNormalization} \\to \\text{ReLU}$ or $\\text{MatMul} \\to \\text{Add} \\to \\text{ReLU}$—and replaces them with consolidated fused operators ($\\text{FusedConvBNRelu}$, $\\text{GemmRelu}$, $\\text{Gemm}$). During code generation or execution, fused operators launch as a single GPU kernel where intermediate outputs remain cached in high-speed SRAM registers or L1 cache, bypassing DRAM roundtrips entirely.\n\nInput Format:\n- `nodes`: Array of ONNX graph node objects containing `id`, `opType`, `inputs`, and `outputs` tensor references.\n\nOutput Format:\n- Returns optimized list of ONNX graph nodes with matched subgraphs collapsed into fused operators.\n\nEdge Cases & Constraints:\n- Branching DAG outputs: Nodes with fan-out $> 1$ (multiple downstream consumers) cannot be fused into single-consumer operators without duplicating work.\n- Tensor shape mismatches: Dynamic input dimensions require runtime shape verification prior to applying folded transformations.\n- Topological order preservation: Graph rewrites must maintain strict topological dependency invariants across node lists.",
  constraints: ["1 <= nodes.length <= 100", "node.opType is valid ONNX primitive string"],
  examples: [
    {
      kind: "basic",
      title: "Conv + BN + ReLU & MatMul + Add + ReLU Fusion",
      inputDisplay: "10 nodes: Conv->BN->Relu, MatMul->Add->Relu, Conv->BN->Relu, Softmax",
      outputDisplay: "FusedConvBNRelu -> GemmRelu -> FusedConvBNRelu -> Softmax",
      input: DEFAULT_ONNX_OPERATOR_FUSION_INPUT,
      output: "4 optimized nodes: FusedConvBNRelu, GemmRelu, FusedConvBNRelu, Softmax",
      explanation:
        "Pass matches three 3-node subgraphs and collapses 10 individual operators into 4 optimized execution nodes.",
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
      "ONNX Operator Fusion is an essential compilation pass in modern AI frameworks including ONNX Runtime, NVIDIA TensorRT, Apache TVM, and OpenVINO. By transforming fine-grained graph IR into coarse-grained fused kernels, compilers drastically reduce GPU kernel launch overheads and DRAM bandwidth traffic.",
    sections: [
      {
        heading: "Why It Exists",
        body: "Deep neural networks consist of millions of elementary operations. When executed individually, memory-bound operations (such as BatchNormalization, BiasAdd, and ReLU) spend up to $80\\%$ of their execution time waiting for memory transfers from GPU DRAM. Operator fusion bridges the gap between hardware compute capability ($T_{\\text{FLOPS}}$) and DRAM bandwidth constraints ($B_{\\text{DRAM}}$).",
      },
      {
        heading: "What It Solves",
        body: "By fusing sequences like $\\text{Conv} \\to \\text{BN} \\to \\text{ReLU}$ into a single GPU kernel, intermediate feature maps are stored in fast GPU SRAM registers or L1 cache instead of HBM. For $N$ elementwise operations, fusion converts $\\mathcal{O}(N)$ DRAM reads/writes into $\\mathcal{O}(1)$ register reads/writes, improving throughput by $2\\times - 4\\times$.",
      },
      {
        heading: "Step-by-Step Intuition",
        body: "The compiler pass iterates through the graph nodes sequentially. At each index $i$, it checks candidate pattern windows (e.g. 3-node patterns first, then 2-node patterns). If the node types and tensor connectivity match the pattern, a new composite node (such as `FusedConvBNRelu`) is created, and index pointer $i$ skips ahead by the pattern window length ($i \\leftarrow i + k$). If no pattern matches, the node passes through unfused.",
      },
      {
        heading: "Trade-offs & Systems Impact",
        body: "While operator fusion dramatically speeds up execution, large fused kernels increase GPU register pressure and shared memory requirements. If a fused kernel consumes too many registers ($R_{\\text{allocated}} > R_{\\text{max}}$), the GPU driver reduces thread block occupancy or spills registers to local DRAM, negating performance gains. Graph compilers rely on target device profiling to bound maximum fusion depth.",
      },
      {
        heading: "Complexity & Scalability",
        body: "The single-pass greedy pattern matcher runs in $\\mathcal{O}(N)$ linear time relative to graph node count $N$. Memory complexity is $\\mathcal{O}(N)$ to construct the optimized output graph.",
      },
    ],
    keyTerms: [
      {
        term: "Operator Fusion",
        definition:
          "Combining multiple adjacent operators into a single executable GPU kernel to eliminate intermediate DRAM transfers.",
      },
      {
        term: "Batch Normalization Folding",
        definition:
          "Absorbing linear BN parameters directly into Convolution weight matrices prior to kernel dispatch: $W_{\\text{folded}} = W \\cdot \\frac{\\gamma}{\\sqrt{\\sigma^2 + \\epsilon}}$.",
      },
      {
        term: "DRAM Bandwidth Bottleneck",
        definition:
          "Performance limitation where GPU execution speed is constrained by memory transfer rates ($B_{\\text{DRAM}}$) rather than compute TFLOPS.",
      },
      {
        term: "Pattern Matching Pass",
        definition:
          "Graph transformation pass that scans AST/DAG nodes for target subgraph sequences and applies replacement rules.",
      },
    ],
  },
  trivia: ONNX_OPERATOR_FUSION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_ONNX_OPERATOR_FUSION_INPUT,
  generateSteps: generateOnnxOperatorFusionSteps,
};
