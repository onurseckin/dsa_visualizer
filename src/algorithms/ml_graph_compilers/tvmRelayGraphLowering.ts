import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface RelayOpNode {
  id: string;
  op: string;
  layout: string;
  shape: number[];
}

export interface TvmRelayGraphLoweringInput {
  relayNodes: RelayOpNode[];
  targetHardware: "llvm" | "cuda";
  targetLayout: string;
}

export const TVM_RELAY_GRAPH_LOWERING_CODE = `def lower_relay_to_tir(relay_nodes: list[dict], target_hardware: str, target_layout: str) -> dict:
    transformed_nodes = []
    for node in relay_nodes:
        transformed = dict(node)
        if node["layout"] == "NCHW" and target_layout != "NCHW":
            transformed["layout"] = target_layout
            shape = list(node["shape"])
            if len(shape) == 4 and shape[1] % 8 == 0:
                shape[1] = shape[1] // 8
                shape.append(8)
            transformed["shape"] = shape
        transformed_nodes.append(transformed)
    fused_groups = []
    i = 0
    n = len(transformed_nodes)
    while i < n:
        if (i + 2 < n and 
            transformed_nodes[i]["op"] == "nn.conv2d" and 
            transformed_nodes[i+1]["op"] == "nn.bias_add" and 
            transformed_nodes[i+2]["op"] == "relu"):
            fused_groups.append({
                "groupId": f"prim_func_{i}",
                "primitiveOp": "fused_conv2d_bias_relu",
                "nodes": [transformed_nodes[i]["id"], transformed_nodes[i+1]["id"], transformed_nodes[i+2]["id"]],
                "layout": target_layout
            })
            i += 3
        else:
            fused_groups.append({
                "groupId": f"prim_func_{i}",
                "primitiveOp": transformed_nodes[i]["op"],
                "nodes": [transformed_nodes[i]["id"]],
                "layout": transformed_nodes[i]["layout"]
            })
            i += 1
    tir_statements = []
    for group in fused_groups:
        if target_hardware == "cuda":
            tir = f"__global__ void {group['primitiveOp']}_kernel(float* __restrict__ A, float* __restrict__ Out) {{ // gridDim, blockDim CUDA TIR }}"
        else:
            tir = f"void {group['primitiveOp']}_llvm(float* Out) {{ // Vectorized LLVM AVX-512 TIR loop }}"
        tir_statements.append({
            "groupId": group["groupId"],
            "primitiveOp": group["primitiveOp"],
            "tirCode": tir
        })
    return {
        "layoutTransformedNodes": transformed_nodes,
        "fusedPrimitiveGroups": fused_groups,
        "tirStatements": tir_statements,
        "targetHardware": target_hardware
    }`;

export const DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT: TvmRelayGraphLoweringInput = {
  relayNodes: [
    { id: "r1", op: "nn.conv2d", layout: "NCHW", shape: [1, 64, 56, 56] },
    { id: "r2", op: "nn.bias_add", layout: "NCHW", shape: [1, 64, 56, 56] },
    { id: "r3", op: "relu", layout: "NCHW", shape: [1, 64, 56, 56] },
    { id: "r4", op: "nn.conv2d", layout: "NCHW", shape: [1, 128, 28, 28] },
    { id: "r5", op: "nn.bias_add", layout: "NCHW", shape: [1, 128, 28, 28] },
    { id: "r6", op: "relu", layout: "NCHW", shape: [1, 128, 28, 28] },
    { id: "r7", op: "nn.dense", layout: "NCHW", shape: [1, 512, 1, 1] },
    { id: "r8", op: "relu", layout: "NCHW", shape: [1, 512, 1, 1] },
  ],
  targetHardware: "cuda",
  targetLayout: "NCHW8c",
};

function buildTvmGraphSnapshot(
  nodes: RelayOpNode[],
  currentIndex: number,
  fusedGroups?: Array<{ groupId: string; primitiveOp: string; nodes: string[] }>,
): GraphVisualSnapshot {
  const graphNodes: GraphNodeItem[] = nodes.map((node, r) => {
    let state: ElementState = "default";
    if (r < currentIndex) {
      state = "sorted";
    } else if (r === currentIndex) {
      state = "pivot";
    }

    let group: number | undefined = undefined;
    if (fusedGroups) {
      const gIdx = fusedGroups.findIndex((g) => g.nodes.includes(node.id));
      if (gIdx !== -1) {
        group = gIdx;
      }
    }

    const x = 80 + (r % 4) * 160;
    const y = 80 + Math.floor(r / 4) * 120;

    return {
      id: node.id,
      label: `${node.id}:${node.op}\n${node.layout}[${node.shape.join(",")}]`,
      state,
      x,
      y,
      val: node.shape[1] ?? 1,
      group,
    };
  });

  const graphEdges: GraphEdgeItem[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const isTraversed = i < currentIndex;
    const isPath = i === currentIndex;
    graphEdges.push({
      from: nodes[i].id,
      to: nodes[i + 1].id,
      isTraversed,
      isPath,
    });
  }

  return {
    kind: "graph",
    nodes: graphNodes,
    edges: graphEdges,
  };
}

export const generateTvmRelayGraphLoweringSteps = (
  input: TvmRelayGraphLoweringInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { relayNodes, targetHardware, targetLayout } = input;
  const n = relayNodes.length;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    nodesForSnap: RelayOpNode[],
    currentIndex: number,
    passName: string,
    fusedGroups?: Array<{ groupId: string; primitiveOp: string; nodes: string[] }>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildTvmGraphSnapshot(nodesForSnap, currentIndex, fusedGroups),
      auxiliaryState: {
        customState: {
          targetHardware,
          targetLayout,
          relayNodeCount: String(n),
          currentPass: passName,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Apache TVM Relay IR Lowering Engine",
    `Target Hardware: ${targetHardware.toUpperCase()}, Target Memory Layout: ${targetLayout}. Processing ${n} Relay expression AST nodes.`,
    { n, targetHardware, targetLayout },
    relayNodes,
    0,
    "Init",
  );

  addStep(
    2,
    "Initialize Container transformed_nodes",
    "Creating empty list to store layout-transformed AST nodes.",
    { n },
    relayNodes,
    0,
    "Init",
  );

  // Pass 1: Layout Transformation Pass
  addStep(
    3,
    "Start Pass 1: AlterOpLayout Pass — loop over relay_nodes",
    `Transforming NCHW tensors into SIMD-blocked layout ${targetLayout} for vector register alignment.`,
    { pass: "AlterOpLayout", targetLayout },
    relayNodes,
    0,
    "Pass 1: AlterOpLayout",
  );

  const layoutTransformed: RelayOpNode[] = [];
  relayNodes.forEach((node, idx) => {
    addStep(
      4,
      `Inspect Relay Node '${node.id}' (${node.op}) in Pass 1`,
      `Original layout: ${node.layout}, Original shape: [${node.shape.join(", ")}].`,
      { idx, node_id: node.id, op: node.op },
      relayNodes,
      idx,
      "Pass 1: AlterOpLayout",
    );

    const copy = { ...node };
    if (node.layout === "NCHW" && targetLayout !== "NCHW") {
      copy.layout = targetLayout;
      const sh = [...node.shape];
      if (sh.length === 4 && sh[1] % 8 === 0) {
        sh[1] = sh[1] / 8;
        sh.push(8);
      }
      copy.shape = sh;

      addStep(
        6,
        `Transform Layout for Node '${node.id}' to ${targetLayout}`,
        `Split channel dimension into sub-blocks of 8. New shape: [${copy.shape.join(", ")}].`,
        { idx, new_layout: targetLayout, new_shape: copy.shape.join(",") },
        relayNodes,
        idx,
        "Pass 1: AlterOpLayout",
      );
    }
    layoutTransformed.push(copy);

    addStep(
      12,
      `Append Node '${node.id}' to transformed_nodes`,
      "Layout transformation applied; stored in transformed_nodes buffer.",
      { idx, count: layoutTransformed.length },
      layoutTransformed,
      idx + 1,
      "Pass 1: AlterOpLayout",
    );
  });

  // Pass 2: FuseOps Pass
  addStep(
    13,
    "Start Pass 2: FuseOps Pass — init fused_groups, i, n",
    "Grouping Relay AST expression nodes into primitive function boundaries (kInjective, kFusedConv).",
    { pass: "FuseOps" },
    layoutTransformed,
    0,
    "Pass 2: FuseOps",
  );

  const fusedPrimitiveGroups: Array<{
    groupId: string;
    primitiveOp: string;
    nodes: string[];
    layout: string;
  }> = [];

  let i = 0;
  while (i < n) {
    addStep(
      16,
      `Pass 2 FuseOps Window Check at i = ${i}`,
      `Inspecting node ${layoutTransformed[i].id} (${layoutTransformed[i].op}) for primitive fusion.`,
      { i, op: layoutTransformed[i].op },
      layoutTransformed,
      i,
      "Pass 2: FuseOps",
      fusedPrimitiveGroups,
    );

    if (
      i + 2 < n &&
      layoutTransformed[i].op === "nn.conv2d" &&
      layoutTransformed[i + 1].op === "nn.bias_add" &&
      layoutTransformed[i + 2].op === "relu"
    ) {
      const group = {
        groupId: `prim_func_${i}`,
        primitiveOp: "fused_conv2d_bias_relu",
        nodes: [layoutTransformed[i].id, layoutTransformed[i + 1].id, layoutTransformed[i + 2].id],
        layout: targetLayout,
      };
      fusedPrimitiveGroups.push(group);

      addStep(
        21,
        `Fuse 3-Node Conv Sequence into Primitive Function '${group.groupId}'`,
        `Fused [${group.nodes.join(", ")}] into monolithic primitive op '${group.primitiveOp}'.`,
        { i, group_id: group.groupId, prim_op: group.primitiveOp },
        layoutTransformed,
        i,
        "Pass 2: FuseOps",
        fusedPrimitiveGroups,
      );

      i += 3;
      addStep(
        27,
        `Advance Index Pointer i by 3 to ${i}`,
        "Skipping fused Relay expression nodes.",
        { i },
        layoutTransformed,
        i,
        "Pass 2: FuseOps",
        fusedPrimitiveGroups,
      );
    } else {
      const group = {
        groupId: `prim_func_${i}`,
        primitiveOp: layoutTransformed[i].op,
        nodes: [layoutTransformed[i].id],
        layout: layoutTransformed[i].layout,
      };
      fusedPrimitiveGroups.push(group);

      addStep(
        29,
        `Create Single Primitive Function '${group.groupId}' for '${group.primitiveOp}'`,
        `Wrapped single Relay op in primitive function boundary.`,
        { i, group_id: group.groupId, prim_op: group.primitiveOp },
        layoutTransformed,
        i,
        "Pass 2: FuseOps",
        fusedPrimitiveGroups,
      );

      i += 1;
      addStep(
        35,
        `Advance Index Pointer i to ${i}`,
        "Moving to next Relay node.",
        { i },
        layoutTransformed,
        i,
        "Pass 2: FuseOps",
        fusedPrimitiveGroups,
      );
    }
  }

  // Pass 3: TIR Code Generation
  addStep(
    36,
    "Start Pass 3: Tensor IR (TIR) Code Generation",
    `Emitting hardware-bound TIR loop AST for backend '${targetHardware.toUpperCase()}'.`,
    { pass: "TIR_Codegen", targetHardware },
    layoutTransformed,
    n,
    "Pass 3: TIR Codegen",
    fusedPrimitiveGroups,
  );

  const tirStatements: Array<{ groupId: string; primitiveOp: string; tirCode: string }> = [];

  fusedPrimitiveGroups.forEach((grp, idx) => {
    addStep(
      37,
      `Emit TIR Code for Group '${grp.groupId}' (${grp.primitiveOp})`,
      `Generating imperative loop AST for target hardware '${targetHardware}'.`,
      { idx, groupId: grp.groupId, primOp: grp.primitiveOp },
      layoutTransformed,
      n,
      "Pass 3: TIR Codegen",
      fusedPrimitiveGroups,
    );

    const tir =
      targetHardware === "cuda"
        ? `__global__ void ${grp.primitiveOp}_kernel(float* __restrict__ A, float* __restrict__ Out) { // gridDim, blockDim CUDA TIR }`
        : `void ${grp.primitiveOp}_llvm(float* Out) { // Vectorized LLVM AVX-512 TIR loop }`;

    tirStatements.push({
      groupId: grp.groupId,
      primitiveOp: grp.primitiveOp,
      tirCode: tir,
    });

    addStep(
      42,
      `Store TIR Kernel Signature for '${grp.primitiveOp}'`,
      `TIR AST generated: ${tir.slice(0, 45)}...`,
      { idx, tir_preview: tir.slice(0, 30) },
      layoutTransformed,
      n,
      "Pass 3: TIR Codegen",
      fusedPrimitiveGroups,
    );
  });

  addStep(
    47,
    "TVM Relay IR Graph Lowering Pass Complete",
    `Successfully lowered ${n} Relay IR expression nodes into ${tirStatements.length} executable TIR hardware kernels for ${targetHardware.toUpperCase()}.`,
    { complete: true, totalRelayNodes: n, totalTirKernels: tirStatements.length },
    layoutTransformed,
    n,
    "Final",
    fusedPrimitiveGroups,
  );

  return steps;
};

const TVM_RELAY_GRAPH_LOWERING_TRIVIA: TriviaMeta = {
  skipLines: [21, 26, 28, 29, 34, 40, 42, 46, 47, 52],
  distractors: [
    "transformed['layout'] = 'INVALID'",
    "tir = 'exit(0)'",
    "fused_groups.clear()",
    "shape[1] = shape[1] * 8",
  ],
  hints: [
    {
      line: 6,
      hint: "Transform tensor layout from NCHW to blocked layout NCHW8c for SIMD alignment.",
    },
    {
      line: 17,
      hint: "Fuse sequence of Relay expression nodes into primitive function boundaries.",
    },
    { line: 39, hint: "Emit CUDA __global__ kernel launch TIR statement for GPU backend." },
    { line: 47, hint: "Return dictionary payload with lowered TIR statements and layout nodes." },
  ],
  lineExplanations: {
    1: "Function signature defining lower_relay_to_tir receiving relay_nodes, target_hardware, and target_layout.",
    2: "Initializes transformed_nodes list for layout-transformed node definitions.",
    3: "Loop iterating over each node in relay_nodes.",
    4: "Creates copy dictionary of node.",
    5: "Checks if node layout is NCHW and target_layout differs from NCHW.",
    6: "Updates node layout to target_layout.",
    7: "Copies node shape array to list.",
    8: "Checks if 4D tensor shape has channel dimension divisible by 8.",
    9: "Divides channel dimension C by 8.",
    10: "Appends inner sub-block dimension of 8 to shape list.",
    11: "Assigns transformed shape to node record.",
    12: "Appends transformed node to transformed_nodes.",
    13: "Initializes fused_groups list for primitive function target groups.",
    14: "Sets loop index i to 0.",
    15: "Calculates total count n of transformed nodes.",
    16: "Loop iterating while index i is less than node count n.",
    17: "Checks if 3-node window matches fused conv2d+bias+relu sequence pattern.",
    18: "Verifies node i is nn.conv2d.",
    19: "Verifies node i+1 is nn.bias_add.",
    20: "Verifies node i+2 is relu.",
    21: "Opens fused primitive group dictionary payload.",
    22: "Assigns group identifier prim_func_i.",
    23: "Sets primitiveOp name to fused_conv2d_bias_relu.",
    24: "Collects list of constituent node IDs in fused group.",
    25: "Sets group layout to target_layout.",
    26: "Closes fused group payload.",
    27: "Advances index i by 3 to skip fused nodes.",
    28: "Else branch for single unfused operator node.",
    29: "Opens single-operator primitive group dictionary.",
    30: "Assigns group identifier prim_func_i.",
    31: "Sets primitiveOp to single node op name.",
    32: "Assigns single node ID to nodes list.",
    33: "Preserves single node layout.",
    34: "Closes single primitive group payload.",
    35: "Advances index i by 1.",
    36: "Initializes tir_statements list to store emitted TIR AST statements.",
    37: "Loop iterating over each group in fused_groups.",
    38: "Checks if target_hardware backend is cuda.",
    39: "Constructs CUDA __global__ kernel launch TIR signature string.",
    40: "Else branch for CPU LLVM backend target hardware.",
    41: "Constructs vectorized LLVM AVX-512 TIR function loop signature.",
    42: "Opens TIR statement dictionary payload.",
    43: "Sets groupId matching primitive group.",
    44: "Sets primitiveOp name.",
    45: "Assigns emitted TIR code string.",
    46: "Closes TIR statement dictionary and appends to list.",
    47: "Opens return dictionary payload.",
    48: "Returns layoutTransformedNodes list.",
    49: "Returns fusedPrimitiveGroups list.",
    50: "Returns tirStatements list.",
    51: "Returns targetHardware string.",
    52: "Closes return dictionary payload.",
  },
};

export const tvmRelayGraphLowering: AlgorithmDefinition<TvmRelayGraphLoweringInput> = {
  id: "tvm-relay-graph-lowering",
  title: "Apache TVM Relay Graph Lowering & TIR Compiler",
  topicIds: ["ml_graph_compilers"],
  difficulty: "Hard",
  description:
    "Apache TVM is an open-source deep learning compiler framework designed to decouple high-level neural network graphs from low-level hardware target backends. Neural network frameworks represent computations as high-level functional expression DAGs (Relay IR). However, executing Relay IR directly on hardware is inefficient due to unaligned memory layouts and un-fused operator boundaries.\n\n### Mathematical Formulation & Layout Transformations\n1. **Layout Transformation (`AlterOpLayout`)**: Down-casts or reshapes spatial/channel dimensions for vector register alignment. Transforming a standard 4D tensor $X \\in \\mathbb{R}^{B \\times C \\times H \\times W}$ into a 5D blocked layout $X_{\\text{blocked}} \\in \\mathbb{R}^{B \\times \\lfloor C/v \\rfloor \\times H \\times W \\times v}$ (e.g. `NCHW8c` where $v = 8$, or `NCHW16c` where $v = 16$):\n$$C = C_{\\text{outer}} \\cdot v + c_{\\text{inner}}, \\quad v \\in \\{8, 16\\}$$\nThis guarantees that vector load instructions (`_mm256_load_ps` for AVX2 or `_mm512_load_ps` for AVX-512) operate on contiguous 32-byte or 64-byte memory blocks without unaligned penalty: $\\text{Stride}_{c_{\\text{inner}}} = 1$.\n\n2. **Operator Fusion (`FuseOps`)**: Groups fine-grained Relay operators (such as `nn.conv2d`, `nn.bias_add`, and `relu`) into primitive function boundaries (`kInjective`, `kFusedConv`):\n$$Y = \\text{ReLU}(\\text{Conv2D}(X, W) + b)$$\n\n3. **TIR Code Generation & Schedule Binding**: Translates primitive functions into target-specific imperative loop ASTs, emitting vectorized C++ for LLVM CPUs or CUDA `__global__` kernel definitions for NVIDIA GPUs.\n\nInput Format:\n- `relayNodes`: List of Relay IR expression node metadata objects containing `id`, `op`, `layout`, and `shape`.\n- `targetHardware`: String specifying compilation target backend (`'llvm'` or `'cuda'`).\n- `targetLayout`: Target blocked tensor memory layout string (e.g. `'NCHW8c'`).\n\nOutput Format:\n- Returns dictionary containing `layoutTransformedNodes`, `fusedPrimitiveGroups`, `tirStatements`, and target metadata.\n\nEdge Cases & Constraints:\n- Channel unaligned dimensions: Channels not divisible by block size 8 or 16 ($C \\pmod v \\neq 0$) require padding before `NCHW8c` transformation.\n- Cross-target compilation: Heterogeneous graphs containing CPU host control-flow and GPU compute kernels require graph splitting into target-specific sub-functions.",
  constraints: ["1 <= relayNodes.length <= 100", "targetHardware in ['llvm', 'cuda']"],
  examples: [
    {
      kind: "basic",
      title: "Relay IR to CUDA TIR Lowering",
      inputDisplay:
        "8 Relay nodes: 2 Conv+Bias+Relu blocks + 1 Dense+Relu block, targetHardware='cuda', targetLayout='NCHW8c'",
      outputDisplay: "3 CUDA TIR Kernels (NCHW8c blocked layout)",
      input: DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT,
      output: "3 CUDA TIR kernel statements",
      explanation:
        "Transforms tensor shapes to NCHW8c, groups operators into 3 primitive functions, and emits CUDA TIR kernel code.",
    },
    {
      kind: "complex",
      title: "LLVM CPU Lowering",
      inputDisplay: "relayNodes=[nn.conv2d], targetHardware='llvm', targetLayout='NCHW16c'",
      outputDisplay: "Vectorized LLVM AVX-512 TIR loop",
      input: {
        relayNodes: [{ id: "r1", op: "nn.conv2d", layout: "NCHW", shape: [1, 128, 28, 28] }],
        targetHardware: "llvm",
        targetLayout: "NCHW16c",
      },
      output: "Vectorized LLVM AVX-512 TIR",
      explanation: "Lowers Relay conv2d to AVX-512 vectorized C++ LLVM TIR loop.",
    },
    {
      kind: "negative",
      title: "Identity Layout Transformation",
      inputDisplay: "targetLayout='NCHW'",
      outputDisplay: "Standard NCHW TIR lowered kernel",
      input: {
        relayNodes: [{ id: "r1", op: "relu", layout: "NCHW", shape: [1, 32, 14, 14] }],
        targetHardware: "llvm",
        targetLayout: "NCHW",
      },
      output: "NCHW TIR lowered kernel",
      explanation: "When target layout matches input layout, no shape transformation is performed.",
    },
  ],
  code: TVM_RELAY_GRAPH_LOWERING_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N) traversal across N Relay AST expression nodes for layout alteration and TIR emission.",
    space: "O(N) memory allocation for generated TIR AST nodes.",
  },
  topicGuide: {
    overview:
      "Apache TVM bridges deep learning frameworks (PyTorch, TensorFlow, ONNX) with diverse hardware backends (CPUs, GPUs, ARM NPUs). Its two-level Intermediate Representation (IR) stack separates high-level functional graph semantics from low-level hardware loop schedules.",
    sections: [
      {
        heading: "Why It Exists",
        body: "Deep learning models expressed in high-level frameworks carry framework-specific abstractions and unoptimized memory layouts. Compiling directly to assembly without intermediate representation leads to brittle, hardware-bound code generation. TVM's two-level IR architecture allows graph-level transformations in Relay IR before lowering to loop-level optimizations in TIR.",
      },
      {
        heading: "What It Solves",
        body: "TVM solves memory stride inefficiencies and kernel dispatch overheads. Blocked tensor layouts (`NCHW8c`: $[B, C/8, H, W, 8]$) guarantee contiguous memory access for vector SIMD instructions (AVX-512, NEON), while `FuseOps` collapses multiple Relay expressions into single imperative TIR loop kernels.",
      },
      {
        heading: "Step-by-Step Intuition",
        body: "The compiler pass executes three sequential transformations: First, `AlterOpLayout` inspects tensor shapes and splits channel dimensions $C \\to \\lfloor C/v \\rfloor \\times v$. Second, `FuseOps` scans adjacent expression nodes to group them into primitive function AST boundaries. Third, the TIR code generator emits imperative C++ or CUDA code for each primitive group.",
      },
      {
        heading: "Trade-offs & Systems Impact",
        body: "Blocked layouts require explicit packing (`LayoutTransform`) and unpacking tensors at input/output boundaries. If a neural network graph contains frequent layout changes, packing overhead can outweigh vectorization gains. Compilers perform layout propagation analysis to minimize packing steps.",
      },
      {
        heading: "Complexity & Scalability",
        body: "Relay graph lowering operates in linear $\\mathcal{O}(N)$ time relative to node count $N$. Generated TIR AST memory footprint scales linearly $\\mathcal{O}(N)$.",
      },
    ],
    keyTerms: [
      {
        term: "Relay IR",
        definition:
          "High-level functional computation graph representation in Apache TVM supporting graph optimization passes.",
      },
      {
        term: "TIR (Tensor IR)",
        definition:
          "Low-level imperative loop AST representation in Apache TVM modeling memory buffers, loop schedules, and vectorization.",
      },
      {
        term: "AlterOpLayout (NCHWc)",
        definition:
          "TVM compiler pass packing tensor dimensions into vector-aligned sub-blocks ($C \\to \\lfloor C/v \\rfloor \\times v$) for maximum SIMD instruction throughput.",
      },
      {
        term: "FuseOps Pass",
        definition:
          "Compiler pass grouping functional Relay IR nodes into primitive function boundaries for TIR generation.",
      },
    ],
  },
  trivia: TVM_RELAY_GRAPH_LOWERING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT,
  generateSteps: generateTvmRelayGraphLoweringSteps,
};
