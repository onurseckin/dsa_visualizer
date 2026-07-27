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
  target?: number;
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
  data: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0],
  target: 0,
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
  const stageSnapshots: number[][] = [[...registers]];

  const getSnapshot = (
    activeThreadI: number = -1,
    activeThreadP: number = -1,
  ) => {
    const totalStages = stageSnapshots.length;
    const rows = totalStages;
    const cols = n;
    const cells: MatrixCellItem[] = [];

    stageSnapshots.forEach((snap, stageIdx) => {
      for (let t = 0; t < n; t++) {
        const val = snap[t];
        const isCurrentStage = stageIdx === totalStages - 1;
        const isPair = isCurrentStage && (t === activeThreadI || t === activeThreadP);
        const state = isPair ? "active" : isCurrentStage ? "compare" : "sorted";

        cells.push({
          row: stageIdx,
          col: t,
          value: val.toFixed(2),
          label: `S${stageIdx} T${t}:${val.toFixed(2)}`,
          state,
        });
      }
    });

    return {
      kind: "matrix" as const,
      rows,
      cols,
      rowHeaders: Array.from({ length: totalStages }, (_, s) => `Stage ${s}`),
      colHeaders: Array.from({ length: n }, (_, t) => `Thread ${t}`),
      cells,
      title: `CUDA Warp Butterfly Register Reduction Matrix (${n} Threads, op="${op}", __shfl_xor_sync)`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeThreadI: number = -1,
    activeThreadP: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeThreadI, activeThreadP),
      auxiliaryState: {
        customState: {
          "Algorithm": "CUDA Warp Butterfly Reduction Primitive (__shfl_xor_sync)",
          "Warp Threads Count": String(n),
          "Reduction Operator": op,
          "Register Exchange Speed": "Zero Shared Memory / DRAM Latency!",
          "Time Complexity": "O(log2 W) = 3 Steps for 8 Threads",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "CUDA Warp Butterfly Reduction Primitive Entry",
    `Started CUDA warp butterfly reduction across ${n} SIMD registers (__shfl_xor_sync, op="${op}").`,
    { n, warpSize, op },
  );

  // Step 2: Init registers (3)
  addStep(
    3,
    "Convert Input Thread Values to Register Floats: registers = [float(v)]",
    `Initialised ${n} SIMD thread registers: [${registers.map((r) => r.toFixed(2)).join(", ")}].`,
    { registers: JSON.stringify(registers.map((r) => r.toFixed(2))) },
  );

  // Step 3: Measure n (4)
  addStep(
    4,
    `Measure Warp Threads Count: n = ${n}`,
    `Warp thread register count n = ${n}.`,
    { n },
  );

  // Step 4: Init history (5)
  addStep(
    5,
    "Allocate history [] List",
    "Allocated list to record exchange steps per reduction pass.",
    { history_len: 0 },
  );

  let delta = Math.floor(n / 2);
  addStep(
    7,
    `Calculate Initial XOR Offset Mask: delta = n // 2 = ${delta}`,
    `Evaluated initial butterfly offset delta = ${delta}. Butterfly reduction completes in log2(${n}) = ${Math.log2(n)} stages.`,
    { delta },
  );

  while (delta > 0) {
    addStep(
      8,
      `Outer Stage Loop: while delta > 0 (delta = ${delta})`,
      `Starting butterfly reduction pass with XOR mask delta = ${delta}.`,
      { delta },
    );

    addStep(
      9,
      "Allocate step_exchanges [] List for Current Stage",
      `Allocated list for stage delta=${delta} butterfly register exchanges.`,
      { delta },
    );

    const newRegisters = [...registers];
    addStep(
      10,
      "Copy Current Register Array: new_registers = list(registers)",
      "Copied thread registers to store updated stage values.",
      { delta },
    );

    for (let i = 0; i < n; i++) {
      const partner = i ^ delta;

      addStep(
        11,
        `Thread Loop ${i + 1}/${n}: Thread ${i} XOR Partner Calculation`,
        `Thread ${i} partner index = ${i} ^ ${delta} = ${partner}.`,
        { i, delta, partner },
        i,
        partner,
      );

      addStep(
        12,
        `Check Process Unique Pair Condition: if ${i} < ${partner}`,
        i < partner
          ? `True (${i} < ${partner}): Unique thread pair (${i}, ${partner}). Executing __shfl_xor_sync.`
          : `False (${i} >= ${partner}): Mirror pair already processed during this pass.`,
        { i, partner, isUniquePair: i < partner },
        i,
        partner,
      );

      if (i < partner) {
        const valI = registers[i];
        addStep(
          13,
          `Thread ${i} Load Register Value: val_i = ${valI.toFixed(2)}`,
          `Read register value val_i = ${valI.toFixed(2)} from Thread ${i}.`,
          { i, valI },
          i,
          partner,
        );

        const valP = registers[partner];
        addStep(
          14,
          `Thread ${partner} Load Register Value: val_p = ${valP.toFixed(2)}`,
          `Read register value val_p = ${valP.toFixed(2)} from Thread ${partner}.`,
          { partner, valP },
          i,
          partner,
        );

        addStep(
          16,
          `Evaluate Reduction Operator Condition: if op == "sum" ("${op}")`,
          `Checking reduction operator: op = "${op}".`,
          { op },
          i,
          partner,
        );

        let res = valI + valP;
        if (op === "sum") {
          res = valI + valP;
          addStep(
            17,
            `Execute Sum Reduction: res = ${valI.toFixed(2)} + ${valP.toFixed(2)} = ${res.toFixed(2)}`,
            `Summed partner thread values: ${valI.toFixed(2)} + ${valP.toFixed(2)} = ${res.toFixed(2)}.`,
            { i, partner, valI, valP, res },
            i,
            partner,
          );
        } else if (op === "max") {
          res = Math.max(valI, valP);
          addStep(
            19,
            `Execute Max Reduction: res = max(${valI.toFixed(2)}, ${valP.toFixed(2)}) = ${res.toFixed(2)}`,
            `Evaluated maximum partner thread value: max(${valI.toFixed(2)}, ${valP.toFixed(2)}) = ${res.toFixed(2)}.`,
            { i, partner, valI, valP, res },
            i,
            partner,
          );
        } else {
          res = valI + valP;
          addStep(
            21,
            `Execute Fallback Sum Reduction: res = ${valI.toFixed(2)} + ${valP.toFixed(2)} = ${res.toFixed(2)}`,
            `Executed fallback sum reduction: ${res.toFixed(2)}.`,
            { i, partner, valI, valP, res },
            i,
            partner,
          );
        }

        newRegisters[i] = res;
        addStep(
          23,
          `Update Thread ${i} Register: new_registers[${i}] = ${res.toFixed(2)}`,
          `Updated Thread ${i} register value = ${res.toFixed(2)}.`,
          { i, res },
          i,
          partner,
        );

        newRegisters[partner] = res;
        addStep(
          24,
          `Update Thread ${partner} Register: new_registers[${partner}] = ${res.toFixed(2)}`,
          `Updated Thread ${partner} register value = ${res.toFixed(2)}.`,
          { partner, res },
          i,
          partner,
        );

        addStep(
          25,
          `Log Exchange (${i}, ${partner}, ${valI.toFixed(2)}, ${valP.toFixed(2)})`,
          `Logged exchange record for pair (${i}, ${partner}).`,
          { i, partner, valI, valP, res },
          i,
          partner,
        );
      }
    }

    registers = newRegisters;
    stageSnapshots.push([...registers]);
    addStep(
      27,
      `Update Stage Registers: registers = new_registers for delta=${delta}`,
      `Completed butterfly exchange pass for delta=${delta}. Registers: [${registers.map((r) => r.toFixed(2)).join(", ")}].`,
      { delta, registers: JSON.stringify(registers.map((r) => r.toFixed(2))) },
    );

    addStep(
      28,
      "Log Stage Exchanges to history List",
      `Persisted exchange records for stage delta=${delta}.`,
      { delta },
    );

    delta = Math.floor(delta / 2);
    addStep(
      29,
      `Halve Butterfly Offset Mask: delta //= 2 -> delta = ${delta}`,
      `Halved butterfly offset delta = ${delta}.`,
      { delta },
    );
  }

  // Return step (32)
  addStep(
    32,
    "Execution Complete: Return (registers, history)",
    `Completed CUDA Warp Butterfly Reduction primitive in ${stageSnapshots.length - 1} steps (log2 ${n}). Final warp reduction result across all ${n} threads: ${registers[0].toFixed(2)}!`,
    { n, result: registers[0], completed: true },
  );

  return steps;
};

const WARPSHUFFLEBUTTERFLYREDUCTION_TRIVIA: TriviaMeta = {
  skipLines: [2, 6, 15, 18, 20, 22, 26, 30, 31],
  distractors: [
    "partner = i + delta",
    "delta = n - 1",
    "registers = [sum(thread_values)] * n",
    "res = val_i * val_p",
  ],
  hints: [
    { line: 11, hint: "CUDA warp butterfly XOR partner calculation: partner = i ^ delta." },
    { line: 29, hint: "Halving XOR offset mask in butterfly reduction loop: delta //= 2." },
  ],
  lineExplanations: {
    1: "Defines entry point for warp_shuffle_butterfly_reduction function simulating CUDA __shfl_xor_sync.",
    2: "Docstring describing CUDA Warp Butterfly Reduction Primitive (__shfl_xor_sync).",
    3: "Converts input values to float register list registers = [float(v) for v in thread_values].",
    4: "Measures warp threads count n = len(registers).",
    5: "Initializes empty list history to record exchange steps per reduction pass.",
    6: "Blank line before delta calculation.",
    7: "Calculates initial butterfly XOR offset mask delta = n // 2.",
    8: "Outer loop executing while butterfly mask delta > 0.",
    9: "Initializes empty list step_exchanges for current reduction pass.",
    10: "Copies thread registers to store updated stage values new_registers = list(registers).",
    11: "Iterates over thread index i from 0 to n - 1.",
    12: "Calculates XOR partner thread index partner = i ^ delta.",
    13: "Checks unique pair condition if i < partner to prevent duplicate processing.",
    14: "Reads register value val_i from Thread i.",
    15: "Reads register value val_p from Thread partner.",
    16: "Blank line before operation check.",
    17: "Checks if reduction operator op == 'sum'.",
    18: "Executes sum reduction res = val_i + val_p.",
    19: "Checks if reduction operator op == 'max'.",
    20: "Executes max reduction res = max(val_i, val_p).",
    21: "Else branch for default sum reduction.",
    22: "Executes fallback sum reduction res = val_i + val_p.",
    23: "Blank line before updating registers.",
    24: "Updates Thread i register value new_registers[i] = res.",
    25: "Updates Thread partner register value new_registers[partner] = res.",
    26: "Appends exchange tuple to step_exchanges list.",
    27: "Blank line before updating stage registers.",
    28: "Updates warp registers registers = new_registers after completing pass.",
    29: "Appends step_exchanges to history list.",
    30: "Halves butterfly XOR offset mask delta //= 2.",
    31: "Blank line separating reduction loop from return statement.",
    32: "Returns tuple of (registers, history).",
  },
};

export const warpShuffleButterflyReduction: AlgorithmDefinition<warpShuffleButterflyReductionInput> =
  {
    id: "warpShuffleButterflyReduction",
    title: "CUDA Warp Butterfly Reduction Primitive (__shfl_xor_sync)",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "The CUDA Warp Butterfly Reduction Primitive simulates NVIDIA CUDA's hardware-level warp shuffle instruction (`__shfl_xor_sync`). In GPU computing, a **warp** consists of 32 threads executing in lockstep SIMD. Standard parallel reduction requires writing intermediate thread outputs to GPU Shared Memory (SRAM) with `__syncthreads()` barriers. Butterfly reduction uses bitwise XOR register shuffles (`partner = thread_id ^ delta`) to exchange data directly between GPU SIMD register files in **$\\log_2(W)$ steps** with **zero shared memory or DRAM latency**.\n\n### Why It Exists\nSoftmax normalization, LayerNorm, and FlashAttention require computing parallel reductions (sum, max) across sequence keys or feature dimensions. Using shared memory for warp-level reductions incurs memory write/read stalls and barrier synchronization overhead. CUDA warp shuffle intrinsics (`__shfl_xor_sync`) perform register-to-register data exchanges in a single clock cycle.\n\n### Mathematical Formulation\nFor warp size $W = 32$ (or $W = 8$), thread rank $i \\in \\{0, \\dots, W-1\\}$, and reduction operator $\\oplus \\in \\{+, \\max\\}$:\n\n$$1. \\quad \\delta_{start} = \\frac{W}{2} \\quad (\\text{Initial Butterfly XOR Mask})$$\n\n$$2. \\quad \\text{partner}_i = i \\oplus \\delta \\quad (\\text{Hardware Register Exchange Partner})$$\n\n$$3. \\quad R_{i, \\text{step}+1} = R_{i, \\text{step}} \\oplus \\text{Shuffle}_{XOR}(R_{\\text{partner}, \\text{step}}, \\delta) \\quad (\\text{Register Update})$$\n\n$$4. \\quad \\delta \\leftarrow \\lfloor \\frac{\\delta}{2} \\rfloor \\quad (\\text{Halve Offset Mask over } \\log_2 W \\text{ Steps})$$\n\n### Step-by-Step Intuition\n1. **Initial Register Load**: Threads load scalar data into local SIMD registers $R_0, R_1, \\dots, R_{W-1}$.\n2. **Pass 1 ($\\delta = 4$)**: Thread $i$ exchanges register values with partner $i \\oplus 4$ (e.g. Thread 0 pairs with Thread 4). Compute $R_i + R_{i \\oplus 4}$.\n3. **Pass 2 ($\\delta = 2$)**: Thread $i$ exchanges register values with partner $i \\oplus 2$ (e.g. Thread 0 pairs with Thread 2). Compute $R_i + R_{i \\oplus 2}$.\n4. **Pass 3 ($\\delta = 1$)**: Thread $i$ exchanges register values with partner $i \\oplus 1$ (e.g. Thread 0 pairs with Thread 1). Compute $R_i + R_{i \\oplus 1}$.\n5. **All-Reduce Complete**: In just 3 steps ($\\log_2 8$), *every* thread in the warp holds the exact global sum across all 8 registers!\n\n### Key Trade-Offs & Hardware Execution\n- **Zero Shared Memory Latency**: Exchanges data directly across GPU register files via hardware crossbar switches in 1 clock cycle.\n- **All-Reduce Advantage**: Because butterfly reduction exchanges data symmetrically (`i` and `partner` both update), every thread in the warp receives the final reduced sum simultaneously without extra broadcast steps.",
    constraints: [
      "2 <= thread_values.length <= 32",
      "thread_values.length is a power of 2",
      "op in ['sum', 'max']",
    ],
    examples: [
      {
        kind: "basic",
        title: "8-Thread CUDA Warp Sum Reduction (__shfl_xor_sync)",
        inputDisplay: "8 Thread Values [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0], op='sum'",
        outputDisplay: "Final Warp Registers: All 36.0 (Sum = 36.0 in 3 steps)",
        input: DEFAULT_WARPSHUFFLEBUTTERFLYREDUCTION_INPUT,
        output: "([36.0, 36.0, 36.0, 36.0, 36.0, 36.0, 36.0, 36.0], history)",
        explanation: "Executes 3 butterfly exchange steps (delta=4, 2, 1). Reduces 8 registers in log2(8)=3 steps to sum 36.0 with zero shared memory latency.",
      },
    ],
    code: WARPSHUFFLEBUTTERFLYREDUCTION_CODE,
    timeComplexity: {
      best: "O(\\log_2 W)",
      average: "O(\\log_2 W)",
      worst: "O(\\log_2 W)",
    },
    spaceComplexity: "O(W)",
    complexityAnalysis: {
      time: "Logarithmic in warp size $O(\\log_2 W)$, completing reduction across $W$ threads in $\\log_2 W$ steps (e.g. 5 steps for 32 threads).",
      space: "Requires $O(W)$ memory to store SIMD thread register state and exchange history.",
    },
    topicGuide: {
      overview:
        "The CUDA Warp Butterfly Reduction Primitive models hardware warp shuffles (__shfl_xor_sync) for register-to-register reductions in log2(W) steps.",
      sections: [
        {
          heading: "Core Concept & Hardware Warp Shuffles",
          body: "CUDA __shfl_xor_sync allows SIMD threads within a 32-thread warp to exchange register values directly without shared memory allocation or __syncthreads() barriers.",
        },
        {
          heading: "Logarithmic Butterfly Reduction Pattern",
          body: "Halving XOR offset mask delta (W/2, W/4, ..., 1) reduces W registers in log2(W) steps (3 steps for 8 threads, 5 steps for 32 threads).",
        },
        {
          heading: "Symmetric All-Reduce Advantage",
          body: "Because butterfly XOR exchanges values symmetrically between partner threads (i ^ delta), all threads end up holding the exact global reduced sum simultaneously.",
        },
        {
          heading: "Building Block for FlashAttention & Softmax",
          body: "Warp shuffle butterfly reductions are used inside FlashAttention, Softmax, and LayerNorm GPU kernels to compute row max and logsumexp normalizers instantly.",
        },
      ],
      keyTerms: [
        {
          term: "__shfl_xor_sync",
          definition: "CUDA C++ hardware intrinsic instruction exchanging register data between SIMD threads using bitwise XOR rank mask.",
        },
        {
          term: "Warp",
          definition: "Group of 32 parallel GPU CUDA threads executing instructions in lockstep SIMD.",
        },
        {
          term: "Butterfly Reduction",
          definition: "Symmetric register exchange pattern reducing N items in log2(N) steps across pairs (i ^ delta).",
        },
        {
          term: "All-Reduce",
          definition: "Reduction operation where every participating thread or rank receives the final reduced output value.",
        },
      ],
    },
    trivia: WARPSHUFFLEBUTTERFLYREDUCTION_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_WARPSHUFFLEBUTTERFLYREDUCTION_INPUT,
    generateSteps: generateWARPSHUFFLEBUTTERFLYREDUCTIONSteps,
  };
