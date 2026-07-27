import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ExchangeRecord {
  threadI: number;
  threadP: number;
  valI: number;
  valP: number;
  result: number;
}

export interface warpShuffleButterflyReductionInput {
  thread_values?: number[];
  warp_size?: number;
  op?: string;
  data?: number[];
  [key: string]: unknown;
}

export const WARPSHUFFLEBUTTERFLYREDUCTION_CODE = `def warp_shuffle_butterfly_reduction(thread_values: list[float], warp_size: int = 8, op: str = "sum") -> tuple[list[float], list[list[tuple[int, int, float, float]]]]:
    """Simulates CUDA Warp Butterfly Reduction Primitive (__shfl_xor_sync)."""
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

    return registers, history`;

export const DEFAULT_WARPSHUFFLEBUTTERFLYREDUCTION_INPUT: warpShuffleButterflyReductionInput = {
  thread_values: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0],
  warp_size: 8,
  op: "sum",
};

export const generateWARPSHUFFLEBUTTERFLYREDUCTIONSteps = (
  input: warpShuffleButterflyReductionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawVals = input.thread_values || input.data || DEFAULT_WARPSHUFFLEBUTTERFLYREDUCTION_INPUT.thread_values!;
  const warpSize = input.warp_size !== undefined ? input.warp_size : rawVals.length;
  const op = input.op || "sum";

  let registers: number[] = rawVals.map((v) => Number(v));
  const n = registers.length;
  const history: ExchangeRecord[][] = [];

  const stageSnapshots: number[][] = [[...registers]];

  const createMatrixSnapshot = (
    activeThreadI?: number,
    activeThreadP?: number,
  ): MatrixCellItem[][] => {
    const grid: MatrixCellItem[][] = [];
    const totalStages = stageSnapshots.length;

    stageSnapshots.forEach((snap, stageIdx) => {
      const rowItems: MatrixCellItem[] = [];
      for (let t = 0; t < n; t++) {
        const val = snap[t];
        let state: MatrixCellItem["state"] = "default";
        if (stageIdx === totalStages - 1 && (activeThreadI === t || activeThreadP === t)) {
          state = "active";
        } else if (stageIdx === totalStages - 1) {
          state = "compare";
        } else {
          state = "sorted";
        }

        rowItems.push({
          row: stageIdx,
          col: t,
          val: Number(val.toFixed(2)),
          label: `S${stageIdx} T${t}:${val.toFixed(2)}`,
          state,
        });
      }
      grid.push(rowItems);
    });
    return grid;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeThreadI?: number,
    activeThreadP?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        matrix: createMatrixSnapshot(activeThreadI, activeThreadP),
      },
      auxiliaryState: {
        customState: customState ?? {
          warp_size: String(warpSize),
          op,
          primitive: "__shfl_xor_sync",
          sram_usage: "0 Bytes (Pure SIMD Register Shuffle)",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize CUDA Warp Butterfly Reduction Primitive (__shfl_xor_sync)",
    `Setting up ${n}-thread SIMD warp register reduction (op=${op.toUpperCase()}).`,
    { warp_size: n, op },
  );

  addStep(
    3,
    `Initialize floating-point registers = [${registers.join(", ")}]`,
    "SIMD thread registers loaded with initial values.",
    { registers: JSON.stringify(registers) },
  );

  addStep(
    4,
    `Read n = len(registers) = ${n}`,
    `Warp thread count n=${n}.`,
    { n },
  );

  addStep(
    5,
    "Initialize exchange history list",
    "Container allocated for tracking butterfly shuffle steps.",
    { capacity: Math.log2(n) },
  );

  let delta = Math.floor(n / 2);
  addStep(
    7,
    `Calculate initial butterfly stride delta = n // 2 = ${n} // 2 = ${delta}`,
    `Initial XOR stride delta=${delta} for stage 1 butterfly exchange.`,
    { delta },
  );

  while (delta > 0) {
    addStep(
      8,
      `While loop delta = ${delta} > 0: Execute Butterfly Stage (delta=${delta})`,
      `Beginning intra-warp register shuffle stage with XOR offset delta=${delta}.`,
      { delta },
    );

    addStep(
      9,
      "Initialize step_exchanges list",
      "Container for current stage exchange records.",
      { delta },
    );

    const newRegisters = [...registers];
    addStep(
      10,
      "Copy active registers to new_registers",
      "Preparing register buffer for simultaneous SIMD exchange.",
      { delta },
    );

    const currentStageExchanges: ExchangeRecord[] = [];

    for (let i = 0; i < n; i++) {
      addStep(
        11,
        `Loop thread i = ${i}/${n - 1}`,
        `Evaluating warp thread ${i} partner index.`,
        { i, delta },
        i,
      );

      const partner = i ^ delta;
      addStep(
        12,
        `Calculate partner = i ^ delta = ${i} ^ ${delta} = ${partner}`,
        `Bitwise XOR yields partner thread index ${partner}.`,
        { i, delta, partner },
        i,
        partner,
      );

      if (i < partner) {
        addStep(
          13,
          `Check condition i (${i}) < partner (${partner}): True`,
          `Evaluating thread pair (T${i}, T${partner}) to avoid duplicate reduction.`,
          { i, partner },
          i,
          partner,
        );

        const valI = registers[i];
        addStep(
          14,
          `Read val_i = registers[${i}] = ${valI.toFixed(2)}`,
          `Reading register value for thread ${i}.`,
          { i, val_i: valI },
          i,
          partner,
        );

        const valP = registers[partner];
        addStep(
          15,
          `Read val_p = registers[${partner}] = ${valP.toFixed(2)}`,
          `Reading register value for partner thread ${partner}.`,
          { partner, val_p: valP },
          i,
          partner,
        );

        let res = 0.0;
        if (op === "sum") {
          res = valI + valP;
          addStep(
            18,
            `Execute op == 'sum': res = ${valI.toFixed(2)} + ${valP.toFixed(2)} = ${res.toFixed(2)}`,
            `Addition reduction for thread pair (T${i}, T${partner}).`,
            { i, partner, val_i: valI, val_p: valP, res },
            i,
            partner,
          );
        } else if (op === "max") {
          res = Math.max(valI, valP);
          addStep(
            20,
            `Execute op == 'max': res = max(${valI.toFixed(2)}, ${valP.toFixed(2)}) = ${res.toFixed(2)}`,
            `Maximum reduction for thread pair (T${i}, T${partner}).`,
            { i, partner, val_i: valI, val_p: valP, res },
            i,
            partner,
          );
        } else {
          res = valI + valP;
          addStep(
            22,
            `Execute fallback sum: res = ${valI.toFixed(2)} + ${valP.toFixed(2)} = ${res.toFixed(2)}`,
            `Fallback reduction for thread pair (T${i}, T${partner}).`,
            { i, partner, val_i: valI, val_p: valP, res },
            i,
            partner,
          );
        }

        newRegisters[i] = res;
        addStep(
          24,
          `Update new_registers[${i}] = ${res.toFixed(2)}`,
          `Stored reduced scalar into thread ${i} register.`,
          { i, res },
          i,
          partner,
        );

        newRegisters[partner] = res;
        addStep(
          25,
          `Update new_registers[${partner}] = ${res.toFixed(2)}`,
          `Stored reduced scalar into partner thread ${partner} register.`,
          { partner, res },
          i,
          partner,
        );

        const rec: ExchangeRecord = { threadI: i, threadP: partner, valI, valP, result: res };
        currentStageExchanges.push(rec);
        addStep(
          26,
          `Append exchange pair (T${i}, T${partner}, ${valI.toFixed(2)}, ${valP.toFixed(2)}) to step_exchanges`,
          `Recorded exchange step for threads T${i} and T${partner}.`,
          { i, partner, res },
          i,
          partner,
        );
      }
    }

    registers = [...newRegisters];
    stageSnapshots.push([...registers]);

    addStep(
      28,
      `Update active registers = [${registers.join(", ")}]`,
      `Completed butterfly exchange for stride delta=${delta}.`,
      { delta, registers: JSON.stringify(registers) },
    );

    history.push(currentStageExchanges);
    addStep(
      29,
      "Append step_exchanges to history list",
      "Saved butterfly stage exchange history.",
      { history_len: history.length },
    );

    delta = Math.floor(delta / 2);
    addStep(
      30,
      `Halve butterfly stride delta //= 2 -> new delta = ${delta}`,
      `Next butterfly exchange stride delta=${delta}.`,
      { delta },
    );
  }

  addStep(
    32,
    "Return (registers, history)",
    `CUDA Warp Butterfly Reduction Complete: All ${n} threads now hold final reduced ${op.toUpperCase()} scalar = ${registers[0].toFixed(2)} in 0 SRAM bytes and 0 thread barriers.`,
    { completed: true, reduced_val: registers[0], num_stages: history.length },
  );

  return steps;
};

export const WARPSHUFFLEBUTTERFLYREDUCTION_TRIVIA: TriviaMeta = {
  skipLines: [2, 6, 16, 23, 27, 31],
  distractors: [
    "partner = i + delta",
    "res = val_i * val_p",
    "delta = delta - 1",
    "partner = i % delta",
  ],
  hints: [
    { line: 12, hint: "Compute partner thread ID using bitwise XOR: partner = i ^ delta." },
    { line: 18, hint: "Exchange register values across warp thread pair." },
    { line: 30, hint: "Halve butterfly delta offset for the next stage." },
  ],
  lineExplanations: {
    1: "Defines warp_shuffle_butterfly_reduction signature with thread_values, warp_size, and reduction operator.",
    2: "Docstring explaining CUDA __shfl_xor_sync butterfly reduction primitive.",
    3: "Initializes floating-point registers list from thread_values.",
    4: "Retrieves warp thread count n.",
    5: "Initializes history container for recording butterfly exchange pairs.",
    6: "Blank line preceding initial delta calculation.",
    7: "Calculates initial butterfly stride delta = n // 2.",
    8: "While loop while delta > 0 stepping through log2 N butterfly stages.",
    9: "Initializes step_exchanges container for current butterfly stage.",
    10: "Copies current registers into new_registers for stage update.",
    11: "Loops through warp thread index i from 0 to n - 1.",
    12: "Calculates partner thread index partner = i ^ delta using bitwise XOR.",
    13: "Filters thread pair (i < partner) to avoid duplicate exchange logic.",
    14: "Reads register value val_i from thread i.",
    15: "Reads register value val_p from partner thread.",
    16: "Blank line preceding operator reduction branch.",
    17: "Checks if reduction operator op == 'sum'.",
    18: "Executes addition reduction res = val_i + val_p.",
    19: "Checks if reduction operator op == 'max'.",
    20: "Executes maximum reduction res = max(val_i, val_p).",
    21: "Fallback branch for default operator.",
    22: "Executes fallback addition reduction res = val_i + val_p.",
    23: "Blank line preceding register update.",
    24: "Stores reduced value res into new_registers[i].",
    25: "Stores reduced value res into new_registers[partner].",
    26: "Appends exchange record (i, partner, val_i, val_p) to step_exchanges.",
    27: "Blank line preceding stage completion.",
    28: "Updates active registers = new_registers for next butterfly stage.",
    29: "Appends step_exchanges to history list.",
    30: "Halves butterfly stride delta //= 2.",
    31: "Blank line preceding return statement.",
    32: "Returns tuple of (registers, history) with all warp thread registers holding final reduced scalar.",
  },
};

export const warpShuffleButterflyReduction: AlgorithmDefinition<warpShuffleButterflyReductionInput> = {
  id: "warp-shuffle-butterfly-reduction",
  title: "CUDA Warp Butterfly Reduction Primitive",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master CUDA Intra-Warp Register Shuffles: execute parallel all-reduction (sum, max) across 32 warp threads in $\\log_2 32 = 5$ butterfly steps using hardware \`__shfl_xor_sync\` with zero SRAM memory reads or thread barriers.

### Why It Exists & What It Solves
In CUDA and Triton GPU kernels, warp-level reductions (sum, max, min) are fundamental operations used in Softmax, LayerNorm, and FlashAttention online log-sum-exp updates. Traditional block reductions write register values to GPU Shared Memory (SRAM), issue a block barrier (\`__syncthreads()\`), and perform reduction reads from SRAM, incurring ~50 clock cycles of latency stalls and memory allocation overhead.

The **CUDA Warp Butterfly Reduction Primitive** uses intra-warp register shuffle instructions (\`__shfl_xor_sync\`) to exchange register values directly between thread registers across the GPU warp interconnect. In $\\log_2 32 = 5$ butterfly communication steps with offsets $\\delta \\in \\{16, 8, 4, 2, 1\\}$, thread $i$ exchanges register values with thread $i \\oplus \\delta$:
$$\\text{val}_i = \\text{val}_i + \\text{\\_\\_shfl\\_xor\\_sync}(0\\text{xffffffff}, \\text{val}_i, \\delta)$$

This butterfly tree topology achieves all-reduce in **5 clock cycles** with zero shared memory usage and zero thread barriers.

### Step-by-Step Intuition
1. **Initialize Stride Delta**: Start with $\\delta = N / 2$ (e.g. 16 for a 32-thread warp).
2. **Butterfly Exchange Stage**: For each active thread $i$, find partner thread index $\\text{partner} = i \\oplus \\delta$.
3. **Execute Register Reduction**: Thread $i$ and partner exchange values and compute $\\text{res} = \\text{val}_i \\text{ op } \\text{val}_{\\text{partner}}$.
4. **Halve Stride Delta**: Halve $\\delta \\leftarrow \\lfloor \\delta / 2 \\rfloor$ until $\\delta = 0$.
5. **Result**: After $\\log_2 N$ stages, all warp threads contain the exact reduced scalar in fast SIMD registers.

### Input Parameters
- \`thread_values\`: Array of initial register values across warp threads.
- \`warp_size\`: Number of threads in warp (e.g. 8, 16, or 32).
- \`op\`: Reduction operator (\`"sum"\` or \`"max"\`).

### Output
- Returns tuple of \`(final_reduced_registers, step_exchanges_history)\`.

### Trade-offs & Complexity
- **Time Complexity**: $O(\\log_2 N)$ butterfly communication stages.
- **Space Complexity**: $O(N)$ register space with zero SRAM allocation.`,
  constraints: ["warp_size is a power of 2 (2, 4, 8, 16, 32)", "op in ['sum', 'max']"],
  examples: [
    {
      kind: "basic",
      title: "8-Thread Warp Sum Reduction",
      inputDisplay: "thread_values = [1..8], warp_size = 8, op = 'sum'",
      outputDisplay: "All threads hold total sum 36 in 3 butterfly steps",
      input: { thread_values: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0], warp_size: 8, op: "sum" },
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
      input: { thread_values: [10.0, 20.0], warp_size: 2, op: "sum" },
      output: "[30.0, 30.0]",
      explanation: "Reduces 2 threads in log2(2) = 1 step (delta = 1).",
    },
  ],
  code: WARPSHUFFLEBUTTERFLYREDUCTION_CODE,
  timeComplexity: { best: "O(log2 N)", average: "O(log2 N)", worst: "O(log2 N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Reduces N thread values in log2 N butterfly communication stages.",
    space: "Operates directly in GPU registers using O(N) register memory with zero SRAM allocation.",
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
