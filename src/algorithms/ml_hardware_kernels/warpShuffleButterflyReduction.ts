import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface warpShuffleButterflyReductionInput {
  thread_values?: number[];
  warp_size?: number;
  op?: string;
  data?: number[];
  [key: string]: unknown;
}

export const WARPSHUFFLEBUTTERFLYREDUCTION_CODE = `def warp_shuffle_butterfly_reduction(
    thread_values: list[float],
    warp_size: int = 8,
    op: str = "sum"
) -> tuple[list[float], list[list[tuple[int, int, float, float]]]]:
    """
    Simulates CUDA Warp Butterfly Reduction Primitive (__shfl_xor_sync).
    Reduces register values across threads in a warp in O(log2 N) butterfly stages.
    At step delta in [N/2, N/4, ..., 1], thread i exchanges values with thread (i ^ delta).
    Returns: (final_reduced_registers, step_exchanges_history)
    """
    registers = [float(v) for v in thread_values]
    n = len(registers)
    history = []

    delta = n // 2
    while delta > 0:
        step_exchanges = []
        new_registers = list(registers)
        for i in range(n):
            partner = i ^ delta
            if i < partner:
                val_i = registers[i]
                val_p = registers[partner]

                if op == "sum":
                    res = val_i + val_p
                elif op == "max":
                    res = max(val_i, val_p)
                else:
                    res = val_i + val_p

                new_registers[i] = res
                new_registers[partner] = res
                step_exchanges.append((i, partner, val_i, val_p))

        registers = new_registers
        history.append(step_exchanges)
        delta //= 2

    return registers, history
`;

export const DEFAULT_WARPSHUFFLEBUTTERFLYREDUCTION_INPUT: warpShuffleButterflyReductionInput = {
  thread_values: [1, 2, 3, 4, 5, 6, 7, 8],
  warp_size: 8,
  op: "sum",
};

export const generateWARPSHUFFLEBUTTERFLYREDUCTIONSteps = (
  input: warpShuffleButterflyReductionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const vals = input.thread_values || input.data || [1, 2, 3, 4, 5, 6, 7, 8];
  const warpSize = vals.length;
  const op = input.op || "sum";

  let registers = [...vals];

  const initialElements: ArrayElement[] = registers.map((val, idx) => ({
    id: `t-${idx}`,
    value: `T${idx}:${val}`,
    state: "default",
    pointers: [`Reg=${val}`],
  }));

  // Step 1: Initialize Warp Registers
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initialize ${warpSize}-Thread CUDA Warp Butterfly Reduction (${op.toUpperCase()})`,
      why: "All warp thread registers initialized in SIMD registers prior to intra-warp shuffle exchanges.",
    },
    primarySnapshot: {
      kind: "array",
      elements: initialElements,
    },
    auxiliaryState: {
      customState: {
        warp_size: String(warpSize),
        op: op,
        primitive: "__shfl_xor_sync",
        sram_usage: "0 Bytes (Pure Intra-Warp Register Shuffle)",
      },
    },
    variables: { warpSize, op },
  });

  let delta = Math.floor(warpSize / 2);
  let stageNum = 1;

  while (delta > 0) {
    const nextRegisters = [...registers];
    const pairs: string[] = [];

    for (let i = 0; i < warpSize; i++) {
      const partner = i ^ delta;
      if (i < partner) {
        const valI = registers[i];
        const valP = registers[partner];
        const res = op === "max" ? Math.max(valI, valP) : valI + valP;
        nextRegisters[i] = res;
        nextRegisters[partner] = res;
        pairs.push(`(T${i}, T${partner})`);
      }
    }

    const stepElements: ArrayElement[] = nextRegisters.map((val, idx) => {
      const partner = idx ^ delta;
      return {
        id: `t-${idx}`,
        value: `T${idx}:${val}`,
        state: "active",
        pointers: [`<-> T${partner}`, `Reg=${val}`],
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Butterfly Stage ${stageNum}: Exchange across delta ${delta} using __shfl_xor_sync(mask, val, ${delta})`,
        why: `Pairs ${pairs.join(", ")} exchange register values across SM interconnect in 1 clock cycle without SRAM overhead.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: stepElements,
      },
      auxiliaryState: {
        customState: {
          stage: String(stageNum),
          delta: String(delta),
          exchanging_pairs: pairs.join(", "),
          accumulated_registers: nextRegisters.join(", "),
        },
      },
      variables: { stage: stageNum, delta, pairsCount: pairs.length },
    });

    registers = nextRegisters;
    delta = Math.floor(delta / 2);
    stageNum++;
  }

  // Final Step: Complete Warp Reduction
  const totalVal = registers[0];
  const finalElements: ArrayElement[] = registers.map((val, idx) => ({
    id: `t-${idx}`,
    value: `T${idx}:${val}`,
    state: "sorted",
    pointers: ["Reduced Sum"],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 35,
    explanation: {
      what: `Warp Butterfly Reduction Complete: Total Warp ${op.toUpperCase()} = ${totalVal}`,
      why: `All ${warpSize} threads now hold the warp-wide reduced value in O(log2 N) = ${stageNum - 1} steps.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        status: "Completed",
        total_warp_reduction: String(totalVal),
        steps_taken: String(stageNum - 1),
        bandwidth_saved: "100% SRAM traffic eliminated",
      },
    },
    variables: { completed: true, totalVal },
  });

  return steps;
};

const WARPSHUFFLEBUTTERFLYREDUCTION_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: ["partner = i + delta", "res = val_i * val_p", "delta = delta - 1"],
  hints: [
    { line: 18, hint: "Compute partner thread ID using bitwise XOR: partner = i ^ delta." },
    { line: 20, hint: "Exchange register values across warp thread pair." },
    { line: 30, hint: "Halve butterfly delta offset for the next stage." },
  ],
  lineExplanations: {
    1: "Defines CUDA warp butterfly reduction primitive entry point.",
    18: "Calculates partner thread index using XOR mask i ^ delta.",
    20: "Executes intra-warp register exchange and reduction operation.",
    30: "Halves butterfly stride delta (16 -> 8 -> 4 -> 2 -> 1).",
  },
};

export const warpShuffleButterflyReduction: AlgorithmDefinition<warpShuffleButterflyReductionInput> =
  {
    id: "warp-shuffle-butterfly-reduction",
    title: "CUDA Warp Butterfly Reduction Primitive",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "In CUDA and Triton GPU kernels, warp-level reductions (sum, max, min) are fundamental operations used in Softmax, LayerNorm, and FlashAttention online log-sum-exp updates. Traditional block reductions write register values to GPU Shared Memory (SRAM), issue a block barrier (`__syncthreads()`), and perform reduction reads from SRAM, incurring latency stalls and memory allocation overhead.\n\nThe **CUDA Warp Butterfly Reduction Primitive** uses intra-warp register shuffle instructions (`__shfl_xor_sync`) to exchange register values directly between thread registers across the GPU warp interconnect. In $\\log_2 32 = 5$ butterfly communication steps with offsets $\\delta \\in \\{16, 8, 4, 2, 1\\}$, thread $i$ exchanges register values with thread $i \\oplus \\delta$:\n$$\\text{val}_i = \\text{val}_i + \\text{\\_\\_shfl\\_xor\\_sync}(0\\text{xffffffff}, \\text{val}_i, \\delta)$$\n\nThis butterfly tree topology achieves all-reduce in 5 clock cycles with zero shared memory usage and zero thread barriers.\n\nInput Format:\n- thread_values: Array of register values across warp threads.\n- warp_size: Number of active threads in warp (e.g. 8, 16, or 32).\n- op: Reduction operator ('sum' or 'max').\n\nOutput Format:\n- Tuple of (final_reduced_registers, step_exchanges_history).",
    constraints: ["warp_size is a power of 2 (2, 4, 8, 16, 32)", "op in ['sum', 'max']"],
    examples: [
      {
        kind: "basic",
        title: "8-Thread Warp Sum Reduction",
        inputDisplay: "thread_values = [1, 2, 3, 4, 5, 6, 7, 8], warp_size = 8, op = 'sum'",
        outputDisplay: "All threads hold total sum 36 in 3 butterfly steps",
        input: { thread_values: [1, 2, 3, 4, 5, 6, 7, 8], warp_size: 8, op: "sum" },
        output: "Registers all equal 36.0",
        explanation: "Reduces 8 threads in log2(8) = 3 steps (delta = 4, 2, 1) to sum 36.",
      },
      {
        kind: "complex",
        title: "Warp Max Reduction for Softmax",
        inputDisplay: "thread_values = [2.5, 9.1, 4.0, 1.2, 8.8, 3.3, 0.5, 7.4], op = 'max'",
        outputDisplay: "All threads hold row maximum 9.1",
        input: { thread_values: [2.5, 9.1, 4.0, 1.2, 8.8, 3.3, 0.5, 7.4], warp_size: 8, op: "max" },
        output: "Registers all equal 9.1",
        explanation: "Computes warp max in 3 butterfly stages for online softmax normalization.",
      },
      {
        kind: "negative",
        title: "2-Thread Minimal Warp Butterfly",
        inputDisplay: "thread_values = [10, 20], warp_size = 2",
        outputDisplay: "Both threads equal 30.0 in 1 step",
        input: { thread_values: [10, 20], warp_size: 2, op: "sum" },
        output: "[30.0, 30.0]",
        explanation: "Reduces 2 threads in log2(2) = 1 step (delta = 1).",
      },
    ],
    code: WARPSHUFFLEBUTTERFLYREDUCTION_CODE,
    timeComplexity: { best: "O(log2 N)", average: "O(log2 N)", worst: "O(log2 N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Reduces $N$ thread values in $\\log_2 N$ butterfly communication stages.",
      space:
        "Operates directly in GPU registers using $O(N)$ register memory with zero SRAM allocation.",
    },
    topicGuide: {
      overview:
        "The CUDA Warp Butterfly Reduction Primitive is the fastest mechanism for intra-warp data exchange in GPU programming. By using hardware instruction __shfl_xor_sync, it bypasses shared memory completely.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For warp size $N = 2^k$, the butterfly reduction executes $k$ stages. In stage $s$ with $\\delta = 2^{k-s}$, thread $i$ exchanges data with thread $j = i \\oplus \\delta$. Because XOR is symmetric and self-inverting ($i \\oplus \\delta = j \\implies j \\oplus \\delta = i$), thread pairs $(i, j)$ exchange values simultaneously. After $k$ stages, all threads contain the reduced sum $\\sum_{t=0}^{N-1} v_t$.",
        },
        {
          heading: "Systems & Hardware Performance",
          body: "SRAM reduction requires DRAM/SRAM write, `__syncthreads()` barrier (~30 clock cycles), and SRAM read (~20 cycles). Register butterfly shuffle requires 1 clock cycle per instruction. For a 32-thread warp, 5 shuffle instructions execute in ~5 cycles vs ~50 cycles for SRAM, yielding 10x lower latency.",
        },
        {
          heading: "Implementation Nuances & CUDA Intrinsics",
          body: "In CUDA C++, `__shfl_xor_sync(unsigned mask, T val, int laneMask)` uses a thread warp mask (`0xffffffff` for full warp). In Triton, `tl.reduce` automatically synthesizes warp shuffle butterfly instructions for row-wise reductions.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Incomplete warps (warp size $< 32$ or inactive threads) require proper warp mask parameters (`0xffffffff >> (32 - warp_size)`) to prevent reading undefined register values from inactive thread lanes.",
        },
      ],
      keyTerms: [
        {
          term: "__shfl_xor_sync",
          definition:
            "CUDA hardware intrinsic executing intra-warp register exchange based on bitwise XOR lane masks.",
        },
        {
          term: "Butterfly Network",
          definition:
            "A symmetric hypercube communication topology enabling all-to-all reduce in log2 N parallel steps.",
        },
        {
          term: "Warp Synchronization",
          definition:
            "Intra-warp SIMD execution state where 32 threads execute instructions in lockstep without thread block barriers.",
        },
        {
          term: "Zero-SRAM Overhead",
          definition:
            "Executing operations entirely in GPU SIMD registers, leaving shared memory fully available for GEMM tiles.",
        },
      ],
    },
    trivia: WARPSHUFFLEBUTTERFLYREDUCTION_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_WARPSHUFFLEBUTTERFLYREDUCTION_INPUT,
    generateSteps: generateWARPSHUFFLEBUTTERFLYREDUCTIONSteps,
  };
