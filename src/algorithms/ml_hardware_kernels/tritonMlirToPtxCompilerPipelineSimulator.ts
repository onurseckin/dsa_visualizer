import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonMlirToPtxCompilerPipelineSimulatorInput {
  operation_type?: string;
  block_m?: number;
  block_n?: number;
  num_warps?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_CODE = `def triton_mlir_to_ptx_compiler_pipeline_simulator(operation_type: str = "dot", block_m: int = 64, block_n: int = 64, num_warps: int = 4) -> dict[str, str]:
    """Simulates the 5 lowering stages of the Triton MLIR-to-PTX compiler pipeline."""
    pipeline = {}

    pipeline["1_python_ast"] = (
        f"@triton.jit\\n"
        f"def kernel_{operation_type}(A_ptr, B_ptr, C_ptr):\\n"
        f"    a = tl.load(A_ptr)\\n"
        f"    b = tl.load(B_ptr)\\n"
        f"    c = tl.dot(a, b)\\n"
        f"    tl.store(C_ptr, c)"
    )

    pipeline["2_triton_ir"] = (
        f"%a = tt.load %A_ptr : tensor<{block_m}x{block_n}xf16>\\n"
        f"%b = tt.load %B_ptr : tensor<{block_m}x{block_n}xf16>\\n"
        f"%c = tt.dot %a, %b : tensor<{block_m}x{block_n}xf16> -> tensor<{block_m}x{block_n}xf32>"
    )

    threads_per_warp = 32
    total_threads = num_warps * threads_per_warp
    pipeline["3_tritongpu_ir"] = (
        f"#layout = #tritongpu.mma<version=2, warpsPerCTA=[{num_warps}, 1]>\\n"
        f"%c_gpu = tritongpu.mma %a_gpu, %b_gpu {{layout = #layout}} : "
        f"tensor<{block_m}x{block_n}xf32, #layout>"
    )

    pipeline["4_llvm_ir"] = (
        f"call {{ float, float, float, float }} "
        f"@llvm.nvvm.mma.m16n8k16.row.col.f32.f32(i32 %a_reg, i32 %b_reg, float %c_accum)"
    )

    pipeline["5_ptx_assembly"] = (
        f"// Generated PTX for {total_threads} threads ({num_warps} warps)\\n"
        f"mma.sync.aligned.m16n8k16.row.col.f32.f32.f32.f32\\n"
        f"    {{%f0, %f1, %f2, %f3}}, {{%r0, %r1}}, {{%r2}}, {{%f0, %f1, %f2, %f3}};"
    )

    return pipeline`;

export const DEFAULT_TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_INPUT: tritonMlirToPtxCompilerPipelineSimulatorInput = {
  operation_type: "dot",
  block_m: 64,
  block_n: 64,
  num_warps: 4,
  data: [64, 64, 4],
  target: 0,
};

export const generateTRITONMLIRTOPTXCOMPILERPIPELINESIMULATORSteps = (
  input: tritonMlirToPtxCompilerPipelineSimulatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const opType = input.operation_type || "dot";
  const blockM = input.block_m !== undefined ? input.block_m : 64;
  const blockN = input.block_n !== undefined ? input.block_n : 64;
  const numWarps = input.num_warps !== undefined ? input.num_warps : 4;
  const totalThreads = numWarps * 32;

  const stageNames = [
    "1_python_ast",
    "2_triton_ir",
    "3_tritongpu_ir",
    "4_llvm_ir",
    "5_ptx_assembly",
  ];

  const pipelineMap: Record<string, string> = {};

  const getSnapshot = (
    activeStageIdx: number = -1,
  ) => {
    const rows = 5;
    const cols = 3;
    const cells: MatrixCellItem[] = [];

    const headers = ["Stage Name", "Compiler Dialect", "IR Snippet"];
    for (let c = 0; c < 3; c++) {
      cells.push({ row: 0, col: c, value: headers[c], label: "Header", state: "default" });
    }

    const dialects = ["Python @triton.jit", "Triton IR (tt)", "TritonGPU IR (tritongpu)", "LLVM IR (nvvm)", "NVIDIA PTX Assembly"];

    for (let r = 0; r < 5; r++) {
      const rowIdx = r + 1;
      const name = stageNames[r];
      const codeStr = pipelineMap[name];
      const isCurrent = r === activeStageIdx;
      const state = isCurrent ? "active" : codeStr ? "sorted" : "default";

      cells.push(
        { row: rowIdx, col: 0, value: name, state },
        { row: rowIdx, col: 1, value: dialects[r], state },
        { row: rowIdx, col: 2, value: codeStr ? codeStr.split("\n")[0] : "-", state },
      );
    }

    return {
      kind: "matrix" as const,
      rows: 6,
      cols: 3,
      title: `Triton MLIR-to-PTX 5-Stage Compiler Pipeline (Tile ${blockM}x${blockN}, ${numWarps} Warps)`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeStageIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeStageIdx),
      auxiliaryState: {
        customState: {
          "Algorithm": "Triton MLIR-to-PTX 5-Stage Compiler Pipeline",
          "Kernel Operation": opType,
          "Tile Size": `${blockM} x ${blockN}`,
          "GPU Warps Count": String(numWarps),
          "Total CUDA Threads": String(totalThreads),
        },
      },
      variables,
    });
  };

  // Step 1: Entry (1)
  addStep(
    1,
    "Triton MLIR-to-PTX Compiler Pipeline Simulator Entry",
    `Started 5-stage MLIR lowering simulation for kernel_${opType} (tile ${blockM}x${blockN}, ${numWarps} warps / ${totalThreads} CUDA threads).`,
    { opType, blockM, blockN, numWarps, totalThreads },
  );

  // Step 2: Init pipeline dict (3)
  addStep(
    3,
    "Initialize pipeline {} Dictionary",
    "Allocated dictionary to log IR output for all 5 compiler passes.",
    { stages_count: 0 },
  );

  // Stage 1: Python AST (5..12)
  const stage1Code = `@triton.jit\ndef kernel_${opType}(A_ptr, B_ptr, C_ptr):\n    a = tl.load(A_ptr)\n    b = tl.load(B_ptr)\n    c = tl.dot(a, b)\n    tl.store(C_ptr, c)`;
  addStep(
    5,
    "Stage 1 Lowering: Parse Python AST (@triton.jit Decorator)",
    "Parsed Python AST containing high-level block-level tensor operations.",
    { stage: 1, opType },
    0,
  );

  addStep(
    6,
    "Stage 1: Parse Function Decorator @triton.jit",
    "Identified JIT kernel entry point decorator @triton.jit.",
    { stage: 1, decorator: "@triton.jit" },
    0,
  );

  addStep(
    7,
    `Stage 1: Parse Kernel Function Signature def kernel_${opType}`,
    `Parsed kernel signature def kernel_${opType}(A_ptr, B_ptr, C_ptr).`,
    { stage: 1, fn: `kernel_${opType}` },
    0,
  );

  addStep(
    8,
    "Stage 1: Parse Vector Load Operations tl.load",
    "Parsed high-level block vector loads: a = tl.load(A_ptr) and b = tl.load(B_ptr).",
    { stage: 1, load: "tl.load" },
    0,
  );

  addStep(
    10,
    "Stage 1: Parse Block Matrix Multiplication tl.dot",
    "Parsed high-level block GEMM matrix multiplication: c = tl.dot(a, b).",
    { stage: 1, dot: "tl.dot" },
    0,
  );

  addStep(
    11,
    "Stage 1: Parse Vector Store Operation tl.store",
    "Parsed high-level block vector store: tl.store(C_ptr, c).",
    { stage: 1, store: "tl.store" },
    0,
  );

  pipelineMap["1_python_ast"] = stage1Code;
  addStep(
    12,
    "Stage 1 Output: Generated 1_python_ast IR",
    `Generated Python AST string for @triton.jit def kernel_${opType}.`,
    { stage: 1, code_len: stage1Code.length },
    0,
  );

  // Stage 2: Triton IR (14..18)
  const stage2Code = `%a = tt.load %A_ptr : tensor<${blockM}x${blockN}xf16>\n%b = tt.load %B_ptr : tensor<${blockM}x${blockN}xf16>\n%c = tt.dot %a, %b : tensor<${blockM}x${blockN}xf16> -> tensor<${blockM}x${blockN}xf32>`;
  addStep(
    14,
    "Stage 2 Lowering: Lower to High-Level Triton IR (tt Dialect)",
    `Lowered Python AST to High-Level Triton IR (tt dialect) representing block tensors: tensor<${blockM}x${blockN}xf16>.`,
    { stage: 2, blockM, blockN },
    1,
  );

  addStep(
    15,
    `Stage 2: Type Inference for Tensor Block Shapes tensor<${blockM}x${blockN}xf16>`,
    `Inferred explicit tensor types and memory strides for tt.load and tt.dot.`,
    { stage: 2, tensorShape: `${blockM}x${blockN}xf16` },
    1,
  );

  pipelineMap["2_triton_ir"] = stage2Code;
  addStep(
    18,
    "Stage 2 Output: Generated 2_triton_ir IR",
    `Generated tt dialect IR string with explicit type annotations: %c = tt.dot %a, %b.`,
    { stage: 2, code_len: stage2Code.length },
    1,
  );

  // Measure threads (20, 21)
  const threadsPerWarp = 32;
  addStep(
    20,
    "Set GPU Warp Constant: threads_per_warp = 32",
    "Loaded hardware CUDA warp thread constant: 32 threads per warp.",
    { threadsPerWarp },
    1,
  );

  addStep(
    21,
    `Calculate Total CUDA Threads: total_threads = ${numWarps} * 32 = ${totalThreads}`,
    `Evaluated total threads count: ${numWarps} warps * 32 threads/warp = ${totalThreads} CUDA threads.`,
    { totalThreads },
    1,
  );

  // Stage 3: TritonGPU IR (22..26)
  const stage3Code = `#layout = #tritongpu.mma<version=2, warpsPerCTA=[${numWarps}, 1]>\n%c_gpu = tritongpu.mma %a_gpu, %b_gpu {#layout = #layout} : tensor<${blockM}x${blockN}xf32, #layout>`;
  addStep(
    22,
    "Stage 3 Lowering: Lower to Target-Specific TritonGPU IR (tritongpu Dialect)",
    `Applied block layout swizzling & thread layout assignment: #tritongpu.mma<warpsPerCTA=[${numWarps}, 1]>.`,
    { stage: 3, numWarps },
    2,
  );

  addStep(
    23,
    `Stage 3: Assign Warp Layout Attribute warpsPerCTA=[${numWarps}, 1]`,
    `Mapped 2D block tensor tile across ${numWarps} GPU warps in CTA.`,
    { stage: 3, warpsPerCTA: `[${numWarps}, 1]` },
    2,
  );

  pipelineMap["3_tritongpu_ir"] = stage3Code;
  addStep(
    26,
    "Stage 3 Output: Generated 3_tritongpu_ir IR",
    "Generated tritongpu dialect IR containing GPU memory layouts, warp assignments, and Tensor Core layouts.",
    { stage: 3, code_len: stage3Code.length },
    2,
  );

  // Stage 4: LLVM IR (28..31)
  const stage4Code = `call { float, float, float, float } @llvm.nvvm.mma.m16n8k16.row.col.f32.f32(i32 %a_reg, i32 %b_reg, float %c_accum)`;
  addStep(
    28,
    "Stage 4 Lowering: Lower to Target LLVM IR (nvvm Intrinsics)",
    "Decomposed block tensor operations into scalar/warp register operations and LLVM NVVM intrinsic function calls: @llvm.nvvm.mma.m16n8k16.",
    { stage: 4 },
    3,
  );

  addStep(
    29,
    "Stage 4: Map Tensor Core Intrinsics @llvm.nvvm.mma.m16n8k16",
    "Selected 16x8x16 row-col Tensor Core GEMM intrinsic function.",
    { stage: 4, intrinsic: "@llvm.nvvm.mma.m16n8k16" },
    3,
  );

  pipelineMap["4_llvm_ir"] = stage4Code;
  addStep(
    31,
    "Stage 4 Output: Generated 4_llvm_ir IR",
    "Generated LLVM IR string targeting NVIDIA NVPTX backend compiler.",
    { stage: 4, code_len: stage4Code.length },
    3,
  );

  // Stage 5: PTX Assembly (33..37)
  const stage5Code = `// Generated PTX for ${totalThreads} threads (${numWarps} warps)\nmma.sync.aligned.m16n8k16.row.col.f32.f32.f32.f32\n    {%f0, %f1, %f2, %f3}, {%r0, %r1}, {%r2}, {%f0, %f1, %f2, %f3};`;
  addStep(
    33,
    "Stage 5 Lowering: Emit Final NVIDIA PTX GPU Assembly",
    `LLVM NVPTX backend compiled LLVM IR into raw NVIDIA PTX GPU Assembly containing mma.sync Tensor Core instructions!`,
    { stage: 5, totalThreads },
    4,
  );

  addStep(
    34,
    "Stage 5: Emit Tensor Core Assembly Instruction mma.sync.aligned",
    `Emitted PTX assembly mma.sync.aligned.m16n8k16 instruction targeting ${totalThreads} CUDA threads.`,
    { stage: 5, instruction: "mma.sync.aligned" },
    4,
  );

  pipelineMap["5_ptx_assembly"] = stage5Code;
  addStep(
    37,
    "Stage 5 Output: Generated 5_ptx_assembly Code",
    `Generated executable PTX assembly string containing mma.sync Tensor Core instructions targeting ${totalThreads} CUDA threads.`,
    { stage: 5, code_len: stage5Code.length },
    4,
  );

  // Return step (39)
  addStep(
    39,
    "Execution Complete: Return All 5 Compiler Pipeline Stage IRs",
    `Successfully simulated Triton MLIR-to-PTX compiler pipeline across all 5 lowering stages: Python AST -> Triton IR -> TritonGPU IR -> LLVM IR -> PTX Assembly.`,
    { numStages: 5, completed: true },
  );

  return steps;
};

const TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 13, 19, 25, 27, 32, 36, 38],
  distractors: [
    "Stage 1 converts Python to C++ source code",
    "TritonGPU IR generates CUDA C++ __global__ functions",
    "LLVM IR produces ARM v8 assembly",
    "PTX assembly is executed directly by Python interpreter",
  ],
  hints: [
    { line: 14, hint: "Stage 2: High-Level Triton IR (tt dialect) representing block tensors." },
    { line: 22, hint: "Stage 3: Target-Specific TritonGPU IR (tritongpu dialect) assigning warp layouts." },
    { line: 33, hint: "Stage 5: Final NVIDIA PTX Assembly containing mma.sync instructions." },
  ],
  lineExplanations: {
    1: "Defines entry point for triton_mlir_to_ptx_compiler_pipeline_simulator function.",
    2: "Docstring describing the 5 lowering stages of the Triton MLIR-to-PTX compiler pipeline.",
    3: "Initializes empty dictionary pipeline to log intermediate representation (IR) strings.",
    4: "Blank line before Stage 1 Python AST.",
    5: "Assigns 1_python_ast IR string representing high-level @triton.jit function definition.",
    6: "@triton.jit decorator tag.",
    7: "Function signature for kernel_{operation_type}.",
    8: "High-level block load: a = tl.load(A_ptr).",
    9: "High-level block load: b = tl.load(B_ptr).",
    10: "High-level block matrix multiply: c = tl.dot(a, b).",
    11: "High-level block store: tl.store(C_ptr, c).",
    12: "Closing parenthesis for Stage 1 string.",
    13: "Blank line before Stage 2 Triton IR.",
    14: "Assigns 2_triton_ir IR string representing tt dialect block tensor operations.",
    15: "tt.load instruction for tensor A: tensor<block_m x block_n x f16>.",
    16: "tt.load instruction for tensor B: tensor<block_m x block_n x f16>.",
    17: "tt.dot instruction performing block matrix multiply: tt.dot %a, %b.",
    18: "Closing parenthesis for Stage 2 string.",
    19: "Blank line before Stage 3 TritonGPU IR.",
    20: "Sets GPU warp thread constant threads_per_warp = 32.",
    21: "Calculates total CUDA threads total_threads = num_warps * 32.",
    22: "Assigns 3_tritongpu_ir IR string representing tritongpu dialect with explicit warp layouts.",
    23: "Defines #tritongpu.mma layout attribute with warpsPerCTA=[num_warps, 1].",
    24: "tritongpu.mma instruction assigned to specific GPU warp layout.",
    25: "Closing parenthesis for Stage 3 string.",
    26: "Blank line before Stage 4 LLVM IR.",
    27: "Assigns 4_llvm_ir IR string representing LLVM IR with NVVM intrinsic calls.",
    28: "LLVM intrinsic call @llvm.nvvm.mma.m16n8k16 representing low-level Tensor Core operation.",
    29: "Closing parenthesis for Stage 4 string.",
    30: "Blank line before Stage 5 PTX Assembly.",
    31: "Assigns 5_ptx_assembly string representing raw NVIDIA PTX GPU assembly.",
    32: "PTX assembly comment logging total threads and warp count.",
    33: "NVIDIA PTX mma.sync Tensor Core matrix multiply instruction.",
    34: "PTX register operand list: {%f0..}, {%r0..}.",
    35: "Closing parenthesis for Stage 5 string.",
    36: "Blank line separating pipeline construction from return statement.",
    37: "Returns dictionary pipeline containing all 5 compiler stage IR strings.",
    38: "Docstring continuation tag.",
    39: "Docstring continuation tag.",
  },
};

export const tritonMlirToPtxCompilerPipelineSimulator: AlgorithmDefinition<tritonMlirToPtxCompilerPipelineSimulatorInput> =
  {
    id: "tritonMlirToPtxCompilerPipelineSimulator",
    title: "Triton MLIR-to-PTX 5-Stage Compiler Pipeline Simulator",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "The Triton MLIR-to-PTX 5-Stage Compiler Pipeline Simulator models the multi-level lowering architecture of **OpenAI Triton (`tritonc`)**. Triton transforms high-level Python block-tensor code (`@triton.jit`) into machine-executable NVIDIA PTX GPU assembly through 5 distinct compiler passes built on **MLIR (Multi-Level Intermediate Representation)** and **LLVM**. Understanding these 5 lowering stages exposes how block-level tile abstractions (`tl.dot`) are lowered into register allocations, warp layouts, and hardware Tensor Core instructions (`mma.sync`).\n\n### Why It Exists\nWriting raw CUDA C++ or PTX assembly for Tensor Cores requires managing complex warp register layouts (`m16n8k16`), shared memory bank swizzling, and barrier synchronization. Triton's MLIR compiler pipeline automates these low-level hardware mappings, compiling Python code directly into PTX assembly that matches or beats hand-written CUDA C++.\n\n### Mathematical Formulation\nThe 5 Lowering Stages of the Triton Compiler Pipeline:\n\n$$1. \\quad \\mathbf{\\text{Python AST}} \\xrightarrow{\\text{AST Parser}} \\text{@triton.jit Python AST} \\quad (\\text{High-Level Block Ops: } \\texttt{tl.dot(a, b)})$$\n\n$$2. \\quad \\mathbf{\\text{Triton IR (tt Dialect)}} \\xrightarrow{\\text{Triton-to-TritonGPU}} \\text{tt.dot } \\%a, \\%b \\quad (\\text{Block Tensor Types: } \\texttt{tensor<128x64xf16>})$$\n\n$$3. \\quad \\mathbf{\\text{TritonGPU IR}} \\xrightarrow{\\text{TritonGPU-to-LLVM}} \\text{tritongpu.mma } \\%a, \\%b \\quad (\\text{Warp Layouts: } \\texttt{\\#tritongpu.mma<warpsPerCTA=[4,1]>})$$\n\n$$4. \\quad \\mathbf{\\text{LLVM IR (NVVM)}} \\xrightarrow{\\text{LLVM NVPTX Backend}} \\text{@llvm.nvvm.mma.m16n8k16} \\quad (\\text{Hardware Intrinsics})$$\n\n$$5. \\quad \\mathbf{\\text{NVIDIA PTX Assembly}} \\xrightarrow{\\text{CUDA Driver JIT}} \\texttt{mma.sync.aligned.m16n8k16} \\quad (\\text{Executable GPU Assembly})$$\n\n### Step-by-Step Intuition\n1. **Stage 1 (Python AST)**: Parse `@triton.jit` Python AST, extracting block load, dot, and store operations.\n2. **Stage 2 (Triton IR / `tt` Dialect)**: Lower Python AST into High-Level Triton MLIR dialect (`tt`). Tensors carry block shapes (`tensor<128x64xf16>`).\n3. **Stage 3 (TritonGPU IR / `tritongpu` Dialect)**: Apply target-specific layout transformations (`tritongpu`). Assign warp layouts (`#tritongpu.mma`), shared memory layouts, and thread ownership.\n4. **Stage 4 (LLVM IR / `nvvm` Dialect)**: Lower block operations into thread-level register loops and NVVM intrinsic calls (`@llvm.nvvm.mma.m16n8k16`).\n5. **Stage 5 (NVIDIA PTX Assembly)**: LLVM NVPTX backend emits hardware-executable PTX assembly containing `mma.sync` Tensor Core instructions.\n\n### Key Trade-Offs & Hardware Execution\n- **Extensible MLIR Dialects**: Decouples high-level algorithm logic (`tt` dialect) from GPU hardware details (`tritongpu` dialect), allowing Triton to target NVIDIA CUDA (PTX), AMD ROCm (GCN), and Intel Xe (SPIR-V) seamlessly.\n- **Zero Overhead**: Lowered PTX code contains zero runtime reflection or Python overhead, executing directly on GPU Streaming Multiprocessors.",
    constraints: [
      "operation_type in ['dot', 'add', 'softmax']",
      "block_m in [16, 32, 64, 128, 256]",
      "num_warps in [1, 2, 4, 8, 16]",
    ],
    examples: [
      {
        kind: "basic",
        title: "Triton Compiler Lowering Pipeline for GEMM Dot Kernel",
        inputDisplay: "operation_type = 'dot', block_m = 64, block_n = 64, num_warps = 4",
        outputDisplay: "5 Compiler Stage IR Snippets (Python AST -> Triton IR -> TritonGPU IR -> LLVM IR -> PTX)",
        input: DEFAULT_TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_INPUT,
        output: "Dictionary with 5 Stage IR strings",
        explanation: "Simulates the 5 lowering stages of Triton compiler, producing executable PTX assembly with mma.sync Tensor Core instructions targeting 128 CUDA threads.",
      },
    ],
    code: TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Constant time $O(1)$ to simulate and generate the 5 compiler pipeline IR stage strings.",
      space: "Constant space $O(1)$ to store the compiler stage output dictionary.",
    },
    topicGuide: {
      overview:
        "The Triton MLIR-to-PTX 5-Stage Compiler Pipeline Simulator models the multi-level lowering passes of OpenAI Triton from Python AST to NVIDIA PTX assembly.",
      sections: [
        {
          heading: "Core Concept & MLIR Multi-Level Lowering",
          body: "Triton uses MLIR (Multi-Level Intermediate Representation) to progressively lower Python block code (@triton.jit) through 5 stages into NVIDIA PTX GPU assembly.",
        },
        {
          heading: "Stage 2 vs Stage 3: High-Level vs Target-Specific IR",
          body: "Stage 2 (Triton IR) represents machine-agnostic block tensors (tensor<128x64xf16>). Stage 3 (TritonGPU IR) assigns specific GPU warp layouts (#tritongpu.mma) and shared memory swizzles.",
        },
        {
          heading: "Stage 4 vs Stage 5: LLVM IR & PTX Emission",
          body: "Stage 4 decomposes block operations into NVVM intrinsic calls (@llvm.nvvm.mma). Stage 5's LLVM NVPTX backend emits hardware mma.sync PTX assembly instructions.",
        },
        {
          heading: "Cross-Architecture Targetability",
          body: "Decoupling high-level Triton IR from target GPU dialects allows Triton to compile Python code for NVIDIA CUDA (PTX), AMD ROCm (GCN), and Intel Xe GPUs without code changes.",
        },
      ],
      keyTerms: [
        {
          term: "MLIR Dialect",
          definition: "Custom domain-specific intermediate representation pass in MLIR (e.g. tt dialect, tritongpu dialect).",
        },
        {
          term: "Lowering",
          definition: "Process of transforming high-level compiler abstractions into progressively lower-level machine IR instructions.",
        },
        {
          term: "NVVM Intrinsics",
          definition: "LLVM compiler intrinsic functions representing low-level NVIDIA GPU hardware operations.",
        },
        {
          term: "PTX Assembly",
          definition: "NVIDIA Parallel Thread Execution virtual instruction set architecture compiled to native SASS GPU machine code.",
        },
      ],
    },
    trivia: TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_INPUT,
    generateSteps: generateTRITONMLIRTOPTXCOMPILERPIPELINESIMULATORSteps,
  };
