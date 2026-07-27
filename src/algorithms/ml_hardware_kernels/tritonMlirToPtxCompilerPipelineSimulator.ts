import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonMlirToPtxCompilerPipelineSimulatorInput {
  operation_type?: string;
  block_m?: number;
  block_n?: number;
  num_warps?: number;
  data?: number[];
  [key: string]: unknown;
}

export const TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_CODE = `def triton_mlir_to_ptx_compiler_pipeline_simulator(
    operation_type: str = "dot",
    block_m: int = 64,
    block_n: int = 64,
    num_warps: int = 4
) -> dict[str, str]:
    """
    Simulates the 5 lowering stages of the Triton MLIR-to-PTX compiler pipeline:
    1. Python AST (@triton.jit AST parse)
    2. Triton-IR (High-level MLIR block tensor dialect)
    3. Tritongpu-IR (Layout-aware IR with #tritongpu.blocked / #tritongpu.mma layout attributes)
    4. LLVM-IR (Target-specific lowering with NVVM intrinsics)
    5. PTX Assembly (NVIDIA Parallel Thread Execution machine assembly)
    """
    pipeline = {}

    # Stage 1: Python AST Parsing
    pipeline["1_python_ast"] = (
        f"@triton.jit\\n"
        f"def kernel_{operation_type}(A_ptr, B_ptr, C_ptr):\\n"
        f"    a = tl.load(A_ptr)\\n"
        f"    b = tl.load(B_ptr)\\n"
        f"    c = tl.dot(a, b)\\n"
        f"    tl.store(C_ptr, c)"
    )

    # Stage 2: Triton-IR (High-Level MLIR Dialect)
    pipeline["2_triton_ir"] = (
        f"%a = tt.load %A_ptr : tensor<{block_m}x{block_n}xf16>\\n"
        f"%b = tt.load %B_ptr : tensor<{block_m}x{block_n}xf16>\\n"
        f"%c = tt.dot %a, %b : tensor<{block_m}x{block_n}xf16> -> tensor<{block_m}x{block_n}xf32>"
    )

    # Stage 3: Tritongpu-IR (Layout & Warp Allocation)
    threads_per_warp = 32
    total_threads = num_warps * threads_per_warp
    pipeline["3_tritongpu_ir"] = (
        f"#layout = #tritongpu.mma<version=2, warpsPerCTA=[{num_warps}, 1]>\\n"
        f"%c_gpu = tritongpu.mma %a_gpu, %b_gpu {{layout = #layout}} : "
        f"tensor<{block_m}x{block_n}xf32, #layout>"
    )

    # Stage 4: LLVM-IR (NVVM Intrinsics Lowering)
    pipeline["4_llvm_ir"] = (
        f"call {{ float, float, float, float }} "
        f"@llvm.nvvm.mma.m16n8k16.row.col.f32.f32(i32 %a_reg, i32 %b_reg, float %c_accum)"
    )

    # Stage 5: PTX Assembly Generation
    pipeline["5_ptx_assembly"] = (
        f"// Generated PTX for {total_threads} threads ({num_warps} warps)\\n"
        f"mma.sync.aligned.m16n8k16.row.col.f32.f32.f32.f32\\n"
        f"    {{%f0, %f1, %f2, %f3}}, {{%r0, %r1}}, {{%r2}}, {{%f0, %f1, %f2, %f3}};"
    )

    return pipeline
`;

export const DEFAULT_TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_INPUT: tritonMlirToPtxCompilerPipelineSimulatorInput =
  {
    operation_type: "dot",
    block_m: 64,
    block_n: 64,
    num_warps: 4,
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

  const stages = [
    {
      name: "1. Python AST Parsing",
      code: `@triton.jit def kernel_${opType}(A_ptr, B_ptr, C_ptr): a = tl.load(A_ptr); c = tl.dot(a,b); tl.store(C_ptr, c)`,
      desc: "Parses Python AST syntax tree into Triton JIT dialect nodes.",
    },
    {
      name: "2. Triton-IR Lowering",
      code: `%c = tt.dot %a, %b : tensor<${blockM}x${blockN}xf16> -> tensor<${blockM}x${blockN}xf32>`,
      desc: "Transforms Python AST into hardware-agnostic Triton MLIR block tensor operations.",
    },
    {
      name: "3. Tritongpu-IR Layout Synthesis",
      code: `#layout = #tritongpu.mma<version=2, warpsPerCTA=[${numWarps}, 1]>`,
      desc: "Assigns CTA thread block layouts, warp tensor slices, and shared memory swizzle attributes.",
    },
    {
      name: "4. LLVM-IR NVVM Intrinsics",
      code: `@llvm.nvvm.mma.m16n8k16.row.col.f32.f32(i32 %a_reg, i32 %b_reg, float %c_accum)`,
      desc: "Lowers Tritongpu-IR into LLVM intermediate representation with NVVM target intrinsics.",
    },
    {
      name: "5. NVIDIA PTX Assembly Generation",
      code: `mma.sync.aligned.m16n8k16.row.col.f32.f32.f32.f32 {%f0..3}, {%r0,1}, {%r2}, {%f0..3};`,
      desc: "Emits NVIDIA PTX assembly code targeting Tensor Core hardware instructions.",
    },
  ];

  const initialElements: ArrayElement[] = stages.map((st, i) => ({
    id: `stage-${i}`,
    value: st.name,
    state: "default",
  }));

  // Step 1: Pipeline Initialization
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize Triton MLIR-to-PTX Compiler Pipeline Simulator",
      why: "Triton compiles Python code into optimized PTX assembly through 5 MLIR dialect lowering passes.",
    },
    primarySnapshot: {
      kind: "array",
      elements: initialElements.map((e) => ({ ...e, pointers: ["Pending"] })),
    },
    auxiliaryState: {
      customState: {
        operation_type: opType,
        block_size: `${blockM}x${blockN}`,
        num_warps: String(numWarps),
        pipeline_status: "Initialized",
      },
    },
    variables: { opType, blockM, blockN, numWarps },
  });

  // Steps 2-6: Step through each stage
  stages.forEach((st, i) => {
    const currentElements: ArrayElement[] = initialElements.map((el, idx) => {
      if (idx === i) return { ...el, state: "active", pointers: ["Executing Pass"] };
      if (idx < i) return { ...el, state: "sorted", pointers: ["Compiled"] };
      return el;
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: (i + 1) * 7,
      explanation: {
        what: `Execute Stage ${i + 1}: ${st.name}`,
        why: st.desc,
      },
      primarySnapshot: {
        kind: "array",
        elements: currentElements,
      },
      auxiliaryState: {
        customState: {
          active_stage: st.name,
          ir_snippet: st.code,
          stage_number: String(i + 1),
        },
      },
      variables: { stage: i + 1, snippet: st.code },
    });
  });

  // Final Step: Complete Compilation
  const finalElements: ArrayElement[] = initialElements.map((el) => ({
    ...el,
    state: "sorted",
    pointers: ["PTX Ready"],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 35,
    explanation: {
      what: "Triton Compiler Lowering Pipeline Complete",
      why: "Successfully compiled high-level Python tensor code to native NVIDIA PTX assembly.",
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        pipeline_status: "PTX_Assembly_Generated",
        total_passes: "5 MLIR Passes Completed",
      },
    },
    variables: { completed: true },
  });

  return steps;
};

const TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "pipeline['2_triton_ir'] = 'def cuda_kernel()'",
    "pipeline['3_tritongpu_ir'] = 'gcc -O3 main.c'",
    "pipeline['5_ptx_assembly'] = 'mov eax, ebx'",
  ],
  hints: [
    { line: 17, hint: "Parse Python syntax into AST dialect representation." },
    { line: 25, hint: "Lower high-level block tensors into layout-aware Tritongpu-IR dialects." },
    { line: 35, hint: "Emit native hardware Tensor Core PTX instructions." },
  ],
  lineExplanations: {
    1: "Defines Triton MLIR-to-PTX compiler simulator function.",
    17: "Generates Python AST source parsing stage.",
    21: "Emits Triton-IR MLIR block tensor dialect.",
    27: "Synthesizes Tritongpu-IR CTA layouts and warp assignment attributes.",
    34: "Lowers to LLVM-IR with NVVM mma target intrinsics.",
    38: "Emits final NVIDIA PTX hardware assembly instructions.",
  },
};

export const tritonMlirToPtxCompilerPipelineSimulator: AlgorithmDefinition<tritonMlirToPtxCompilerPipelineSimulatorInput> =
  {
    id: "triton-mlir-to-ptx-compiler-pipeline-simulator",
    title: "Triton MLIR-to-PTX Compiler Pipeline Simulator",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "Modern machine learning domain-specific compilers (e.g. OpenAI Triton, PyTorch Inductor) allow developers to write GPU kernels in high-level Python code (`@triton.jit`). The compiler transforms this code into highly optimized NVIDIA PTX machine assembly through a 5-stage lowering pipeline based on MLIR (Multi-Level Intermediate Representation):\n\n1. **Python AST Parsing**: Extracts tensor block syntax (`tl.load`, `tl.dot`, `tl.store`) into an AST representation.\n2. **Triton-IR Lowering**: Translates code into hardware-agnostic MLIR block tensor operations (`tt.load`, `tt.dot`).\n3. **Tritongpu-IR Layout Synthesis**: Annotates tensors with GPU hardware layout attributes (`#tritongpu.blocked`, `#tritongpu.mma`), assigning warps to block tiles.\n4. **LLVM-IR Lowering**: Converts GPU dialects into LLVM-IR using target-specific NVVM intrinsics (`@llvm.nvvm.mma.m16n8k16`).\n5. **PTX Code Generation**: Emits native PTX assembly instructions (`mma.sync.aligned...`) for hardware Tensor Cores.\n\nInput Format:\n- operation_type: Core operation name (e.g. 'dot').\n- block_m: Block tile height (e.g. 64).\n- block_n: Block tile width (e.g. 64).\n- num_warps: Number of GPU warps allocated per CTA (e.g. 4).\n\nOutput Format:\n- Dictionary containing string representations of the code at all 5 compilation pipeline stages.",
    constraints: ["block_m > 0", "block_n > 0", "num_warps in [1, 2, 4, 8, 16]"],
    examples: [
      {
        kind: "basic",
        title: "Standard 64x64 GEMM Dot Compile Pass",
        inputDisplay: "operation_type = 'dot', block_m = 64, block_n = 64, num_warps = 4",
        outputDisplay: "5 MLIR stage lowering outputs ending in PTX mma.sync",
        input: { operation_type: "dot", block_m: 64, block_n: 64, num_warps: 4 },
        output: "5-Stage IR Dictionary",
        explanation:
          "Simulates full lowering pipeline from Python AST to PTX Tensor Core assembly.",
      },
      {
        kind: "complex",
        title: "Large 128x128 Tile with 8 Warps",
        inputDisplay: "block_m = 128, block_n = 128, num_warps = 8",
        outputDisplay: "Tritongpu-IR synthesized with 8 warpsPerCTA",
        input: { operation_type: "dot", block_m: 128, block_n: 128, num_warps: 8 },
        output: "Synthesized 8-warp layout IR",
        explanation: "Allocates 8 GPU warps (256 threads) to process large 128x128 tile blocks.",
      },
      {
        kind: "negative",
        title: "Small 16x16 Single Warp Compile Pass",
        inputDisplay: "block_m = 16, block_n = 16, num_warps = 1",
        outputDisplay: "Single warp MMA PTX code",
        input: { operation_type: "dot", block_m: 16, block_n: 16, num_warps: 1 },
        output: "Single warp PTX assembly",
        explanation: "Generates compact single-warp PTX assembly code for tiny matrix tiles.",
      },
    ],
    code: TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Simulates compiler pipeline transformation passes in $O(1)$ constant steps.",
      space: "Stores string outputs for the 5 lowering stages in $O(1)$ memory.",
    },
    topicGuide: {
      overview:
        "The Triton MLIR-to-PTX compiler pipeline automates the generation of high-performance GPU kernels. By abstracting thread block layouts and warp synchronization into MLIR dialects, Triton allows Python developers to achieve CUTLASS-level performance without writing CUDA C++ code.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Triton compilation uses progressive dialect lowering. Python AST is lowered to Triton-IR (operating on 2D block tensors), then to Tritongpu-IR (annotating tensors with layout attributes mapping elements to warps and registers: $\\text{layout} = (\\text{warpsPerCTA}, \\text{threadsPerWarp})$), then to LLVM-IR, and finally to PTX assembly.",
        },
        {
          heading: "Systems & Compiler Pipeline Architecture",
          body: "Traditional CUDA requires manual thread indexing (`threadIdx.x`), shared memory allocation, and `__syncthreads()` synchronization. Triton's MLIR pipeline automates memory swizzling, vectorization, and CTA warp layouts using pass managers, reducing kernel development time from weeks to hours.",
        },
        {
          heading: "Implementation Nuances & Dialect Passes",
          body: "Key passes include `TritonGPUToLLVM` (lowering MMA layout attributes to hardware `mma.sync` instructions), `CoalescePass` (ensuring contiguous 128-bit memory accesses), and `RemoveLayoutConversions` (eliminating redundant shared memory copies between warps).",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Unsupported tile sizes or unaligned block dimensions trigger compilation failures during layout synthesis. The pipeline ensures block dimensions are powers of 2 and multiples of target MMA hardware shapes (e.g. 16x8x16 for NVIDIA Ampere/Hopper).",
        },
      ],
      keyTerms: [
        {
          term: "Triton-IR",
          definition:
            "A high-level MLIR dialect representing programs operating on 2D block tensors rather than individual threads.",
        },
        {
          term: "Tritongpu-IR",
          definition:
            "A hardware-aware MLIR dialect that encodes layout attributes specifying thread/warp mapping and shared memory layout.",
        },
        {
          term: "PTX Assembly",
          definition:
            "NVIDIA Parallel Thread Execution low-level virtual assembly language targeted by NVPTX code generation.",
        },
        {
          term: "MMA Instruction",
          definition:
            "Matrix Multiply-Accumulate hardware instruction executed directly on GPU Tensor Cores (e.g., mma.sync).",
        },
      ],
    },
    trivia: TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_INPUT,
    generateSteps: generateTRITONMLIRTOPTXCOMPILERPIPELINESIMULATORSteps,
  };
