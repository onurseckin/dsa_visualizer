import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
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
    """
    Lowers high-level TVM Relay IR expression graph down to Tensor Intermediate Representation (TIR)
    through progressive optimization passes:
    1. Layout Transformation Pass (e.g. NCHW -> NCHW8c for vectorization / SIMD alignment)
    2. FuseOps Pass (grouping operators into primitive functions)
    3. Target-Specific TIR lowering & schedule binding (LLVM / CUDA AST generation)
    """
    transformed_nodes = []
    
    # Pass 1: Layout Transformation Pass
    for node in relay_nodes:
        transformed = dict(node)
        if node["layout"] == "NCHW" and target_layout != "NCHW":
            transformed["layout"] = target_layout
            # Adjust shape dimensions for blocked channel layout (C -> C/8, c8)
            shape = list(node["shape"])
            if len(shape) == 4 and shape[1] % 8 == 0:
                shape[1] = shape[1] // 8
                shape.append(8)
            transformed["shape"] = shape
        transformed_nodes.append(transformed)
        
    # Pass 2: FuseOps Pass
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

    # Pass 3: TIR Code Generation
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
  ],
  targetHardware: "cuda",
  targetLayout: "NCHW8c",
};

export const generateTvmRelayGraphLoweringSteps = (
  input: TvmRelayGraphLoweringInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { relayNodes, targetHardware, targetLayout } = input;

  const initialElements: ArrayElement[] = relayNodes.map((node, idx) => ({
    id: `relay-${idx}`,
    value: node.op,
    state: "default",
    pointers: [`${node.layout} [${node.shape.join(",")}]`],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize Apache TVM Relay IR Graph Lowering Engine",
      why: `Target Hardware: ${targetHardware.toUpperCase()}, Target Memory Layout: ${targetLayout}. Processing ${relayNodes.length} Relay expression AST nodes.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: initialElements,
    },
    auxiliaryState: {
      customState: {
        targetHardware,
        targetLayout,
        relayNodeCount: String(relayNodes.length),
      },
    },
    variables: { totalNodes: relayNodes.length, targetHardware },
  });

  // Pass 1: Layout transformation
  const layoutTransformed: RelayOpNode[] = relayNodes.map((node) => {
    const copy = { ...node };
    if (node.layout === "NCHW" && targetLayout !== "NCHW") {
      copy.layout = targetLayout;
      const sh = [...node.shape];
      if (sh.length === 4 && sh[1] % 8 === 0) {
        sh[1] = sh[1] / 8;
        sh.push(8);
      }
      copy.shape = sh;
    }
    return copy;
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: `Pass 1: AlterOpLayout Pass (NCHW -> ${targetLayout})`,
      why: `Transformed tensor layout for vectorization. Channel dimension split into sub-blocks [${layoutTransformed[0].shape.join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: layoutTransformed.map((node, idx) => ({
        id: `layout-${idx}`,
        value: node.op,
        state: "active",
        pointers: [`${node.layout} [${node.shape.join(",")}]`],
      })),
    },
    auxiliaryState: {
      customState: {
        pass: "AlterOpLayout",
        newLayout: targetLayout,
      },
    },
    variables: { pass: "AlterOpLayout", targetLayout },
  });

  // Pass 2: FuseOps Pass
  const fusedPrimitiveGroups: Array<{ groupId: string; primitiveOp: string; layout: string }> = [];
  let i = 0;
  const n = layoutTransformed.length;

  while (i < n) {
    if (
      i + 2 < n &&
      layoutTransformed[i].op === "nn.conv2d" &&
      layoutTransformed[i + 1].op === "nn.bias_add" &&
      layoutTransformed[i + 2].op === "relu"
    ) {
      fusedPrimitiveGroups.push({
        groupId: `prim_func_${i}`,
        primitiveOp: "fused_conv2d_bias_relu",
        layout: targetLayout,
      });
      i += 3;
    } else {
      fusedPrimitiveGroups.push({
        groupId: `prim_func_${i}`,
        primitiveOp: layoutTransformed[i].op,
        layout: layoutTransformed[i].layout,
      });
      i++;
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: "Pass 2: FuseOps Pass (Relay IR -> Primitive Function AST Groups)",
      why: `Grouped Relay expression operators into ${fusedPrimitiveGroups.length} primitive function boundary targets for TIR lowering.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: fusedPrimitiveGroups.map((grp, idx) => ({
        id: `prim-${idx}`,
        value: grp.primitiveOp,
        state: "visited",
        pointers: [grp.groupId],
      })),
    },
    auxiliaryState: {
      customState: {
        pass: "FuseOps",
        fusedCount: String(fusedPrimitiveGroups.length),
      },
    },
    variables: { pass: "FuseOps", primitiveGroups: fusedPrimitiveGroups.length },
  });

  // Pass 3: TIR Code Generation
  const tirStatements = fusedPrimitiveGroups.map((grp) => ({
    groupId: grp.groupId,
    primitiveOp: grp.primitiveOp,
    tirCode:
      targetHardware === "cuda"
        ? `__global__ void ${grp.primitiveOp}_kernel(float* A, float* Out)`
        : `void ${grp.primitiveOp}_llvm(float* Out)`,
  }));

  const finalElements: ArrayElement[] = tirStatements.map((tir, idx) => ({
    id: `tir-${idx}`,
    value: tir.primitiveOp,
    state: "sorted",
    pointers: [tir.tirCode.slice(0, 32) + "..."],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 45,
    explanation: {
      what: `Pass 3: TIR Lowering Complete for ${targetHardware.toUpperCase()} Backend`,
      why: `Generated low-level Tensor Intermediate Representation (TIR) AST for ${targetHardware.toUpperCase()} execution. Ready for LLVM / nvcc code compilation.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        targetBackend: targetHardware,
        tirKernelsGenerated: String(tirStatements.length),
      },
    },
    variables: { complete: true, tirCount: tirStatements.length },
  });

  return steps;
};

const TVM_RELAY_GRAPH_LOWERING_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8],
  hints: [
    {
      line: 14,
      hint: "Transform tensor layout from NCHW to blocked layout NCHW8c for SIMD alignment.",
    },
    {
      line: 26,
      hint: "Fuse sequence of Relay expression nodes into primitive function boundaries.",
    },
    { line: 45, hint: "Emit target-specific TIR AST code for LLVM C++ or CUDA kernel execution." },
  ],
  distractors: ["transformed['layout'] = 'INVALID'", "tir = 'exit(0)'", "fused_groups.clear()"],
  lineExplanations: {
    1: "Defines entry point for TVM Relay IR to TIR lowering compiler.",
    14: "Executes AlterOpLayout pass converting NCHW tensors into blocked NCHW8c formats.",
    26: "Executes FuseOps pass grouping Relay expression nodes into primitive functions.",
    45: "Emits target-specific low-level Tensor IR statements.",
  },
};

export const tvmRelayGraphLowering: AlgorithmDefinition<TvmRelayGraphLoweringInput> = {
  id: "tvm-relay-graph-lowering",
  title: "Apache TVM Relay Graph Lowering & TIR Compiler",
  category: "ml_graph_compilers",
  categories: ["ml_graph_compilers"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_graph_compilers",
  description:
    "Apache TVM is an end-to-end open-source machine learning compiler framework. It lowers high-level functional computational graphs (Relay IR) down to low-level Tensor Intermediate Representation (TIR) through progressive compiler passes, including `AlterOpLayout` (converting NCHW tensors to vector-friendly NCHWc layouts), `FuseOps`, and hardware schedule binding for LLVM CPUs, CUDA GPUs, and custom ML accelerators.\n\nInput Format:\n- relayNodes: List of Relay IR expression node metadata objects.\n- targetHardware: String specifying compilation target backend (`'llvm'` or `'cuda'`).\n- targetLayout: Target blocked tensor memory layout string (e.g. `'NCHW8c'`).\n\nOutput Format:\n- Returns dictionary containing `layoutTransformedNodes`, `fusedPrimitiveGroups`, `tirStatements`, and target metadata.\n\nEdge Cases & Constraints:\n- Channel unaligned dimensions: Channels not divisible by block size $8$ or $16$ require padding before `NCHW8c` transformation.\n- Cross-target compilation: Heterogeneous graphs containing CPU host control-flow and GPU compute kernels require graph splitting into target-specific sub-functions.",
  constraints: ["1 <= relayNodes.length <= 100", "targetHardware in ['llvm', 'cuda']"],
  examples: [
    {
      kind: "basic",
      title: "Relay IR to CUDA TIR Lowering",
      inputDisplay:
        "relayNodes=[nn.conv2d, nn.bias_add, relu], targetHardware='cuda', targetLayout='NCHW8c'",
      outputDisplay: "TIR CUDA Kernel (NCHW8c layout)",
      input: DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT,
      output: "primitive_func fused_conv2d_bias_relu (CUDA TIR)",
      explanation:
        "Transforms layout to NCHW8c, fuses operators into a primitive group, and emits CUDA TIR kernel code.",
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
      "Apache TVM bridges high-level deep learning frameworks (PyTorch, TensorFlow, ONNX) with diverse hardware backends (CPUs, GPUs, embedded ARM, microcontrollers). Its multi-level Intermediate Representation (IR) architecture separates functional graph optimizations in Relay IR from imperative hardware schedule transformations in Tensor IR (TIR).",
    sections: [
      {
        heading: "Core Concepts & Two-Level IR Stack (Relay & TIR)",
        body: "TVM employs a two-tier IR design: Relay IR is a functional language representing high-level dataflow DAGs with static/dynamic shapes and type inference. TIR (Tensor Intermediate Representation) is an imperative loop AST representing explicit memory buffers, iteration domains, thread indices, and vector instructions.",
      },
      {
        heading: "Layout Transformation Passes (NCHW to NCHWc)",
        body: "Standard NCHW memory layouts perform poorly on vector SIMD hardware due to non-contiguous channel memory accesses. The `AlterOpLayout` pass transforms $N \\times C \\times H \\times W$ into packed blocked layouts $N \\times \\lfloor C/v \\rfloor \\times H \\times W \\times v$ (such as `NCHW8c` or `NCHW16c`), aligning channel blocks directly with 256-bit AVX2 or 512-bit AVX-512 vector registers.",
      },
      {
        heading: "Implementation Nuances & FuseOps Compiler Pass",
        body: "The `FuseOps` pass groups Relay expression nodes into four primitive function categories: `kInjective` (elementwise 1-to-1), `kBroadcast`, `kOutElemFused` (fused reductions), and `kOpaque` (unfusable ops like convolutions). Fused groups are compiled as single TIR function primitives.",
      },
      {
        heading: "Auto-Tuning with MetaSchedule & Edge Hardware",
        body: "TVM uses machine learning search engines (AutoTVM and MetaSchedule) to automatically explore space transformations—tile sizes, loop unrolling, thread binding, and vectorization factors—benchmarking thousands of candidate TIR schedules on actual target hardware.",
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
          "TVM compiler pass packing tensor dimensions into vector-aligned sub-blocks for maximum SIMD instruction throughput.",
      },
      {
        term: "MetaSchedule Auto-Tuner",
        definition:
          "ML-driven search framework automatically discovering optimal low-level hardware loop schedules for TIR functions.",
      },
    ],
  },
  trivia: TVM_RELAY_GRAPH_LOWERING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT,
  generateSteps: generateTvmRelayGraphLoweringSteps,
};
