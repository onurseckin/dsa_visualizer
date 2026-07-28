import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  ProblemExample,
} from "../../types/dsa";

export interface ZeroShardingInput {
  numRanks: number;
  stage: 1 | 2 | 3;
  modelParamsMB: number;
}

export const DEEPSPEED_ZERO_SHARDING_CODE = `def deepspeed_zero_sharding(
    model_params_mb: float,
    num_ranks: int,
    stage: int
) -> dict:
    p_mem = 2 * model_params_mb
    g_mem = 2 * model_params_mb
    opt_mem = 12 * model_params_mb

    if stage == 1:
        opt_mem /= num_ranks
    elif stage == 2:
        opt_mem /= num_ranks
        g_mem /= num_ranks
    elif stage == 3:
        opt_mem /= num_ranks
        g_mem /= num_ranks
        p_mem /= num_ranks

    total_mem_per_gpu = p_mem + g_mem + opt_mem
    return {
        "stage": stage,
        "num_ranks": num_ranks,
        "param_mem_per_gpu": p_mem,
        "grad_mem_per_gpu": g_mem,
        "opt_mem_per_gpu": opt_mem,
        "total_mem_per_gpu": total_mem_per_gpu
    }`;

export const DEFAULT_ZERO_SHARDING_INPUT: ZeroShardingInput = {
  numRanks: 4,
  stage: 2,
  modelParamsMB: 1000,
};

export const ZERO_SHARDING_EXAMPLES: ProblemExample<ZeroShardingInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "ZeRO Stage 2 Memory Partitioning (4 GPUs, 1GB Model)",
    input: {
      numRanks: 4,
      stage: 2,
      modelParamsMB: 1000,
    },
    output: "Optimizer states & Gradients sharded across 4 GPUs; parameters replicated",
    explanation:
      "Shards 12GB optimizer states and 2GB gradients down to 3GB + 0.5GB per GPU, saving 10.5GB per node.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "ZeRO Stage 3 Full Sharding (8 GPUs, 10GB Model)",
    input: {
      numRanks: 8,
      stage: 3,
      modelParamsMB: 10000,
    },
    output: "Parameters, Gradients, and Optimizer states sharded by 8x",
    explanation:
      "Achieves 8x memory reduction across all model states, enabling 100B+ model training on 8 GPUs.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "ZeRO Stage 1 Optimizer State Sharding (2 GPUs, 500MB Model)",
    input: {
      numRanks: 2,
      stage: 1,
      modelParamsMB: 500,
    },
    output: "Optimizer states sharded by 2x",
    explanation: "Stage 1 only shards Adam FP32 optimizer states (moments + master weights).",
  },
];

export function generateZeroShardingSteps(input: ZeroShardingInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { numRanks: N, stage, modelParamsMB: P } = input;

  if (N <= 0 || P <= 0 || (stage !== 1 && stage !== 2 && stage !== 3)) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid ZeRO Sharding Configuration",
        why: "Ranks N and params P must be positive, and stage must be 1, 2, or 3.",
      },
      primarySnapshot: {
        kind: "matrix",
        rows: 1,
        cols: 1,
        rowHeaders: ["Error"],
        colHeaders: ["Status"],
        cells: [
          {
            row: 0,
            col: 0,
            value: "Invalid Input",
            state: "inactive",
          },
        ],
      },
      auxiliaryState: { customState: { error: "Stage must be 1, 2, or 3, N > 0, P > 0" } },
      variables: {},
    });
    return steps;
  }

  const baseP = 2 * P;
  const baseG = 2 * P;
  const baseOpt = 12 * P;
  const baselineTotal = baseP + baseG + baseOpt;

  let currP = baseP;
  let currG = baseG;
  let currOpt = baseOpt;

  const buildMatrix = (activeCol?: number, activeRank?: number, isFinished = false) => {
    const total = currP + currG + currOpt;
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < N; r++) {
      const rowValues = [
        `GPU #${r}`,
        `${currP.toFixed(1)} MB`,
        `${currG.toFixed(1)} MB`,
        `${currOpt.toFixed(1)} MB`,
        `${total.toFixed(1)} MB`,
      ];
      for (let c = 0; c < 5; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (isFinished) {
          state = "sorted";
        } else if (activeRank !== undefined && r === activeRank) {
          state = "active";
        } else if (activeCol !== undefined && c === activeCol) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: rowValues[c],
          label: `GPU #${r} Col ${c}`,
          state,
        });
      }
    }
    return {
      kind: "matrix" as const,
      rows: N,
      cols: 5,
      rowHeaders: Array.from({ length: N }, (_, i) => `GPU #${i}`),
      colHeaders: ["GPU Rank", "Params (MB)", "Gradients (MB)", "Adam Opt (MB)", "Total VRAM (MB)"],
      cells,
      title: `ZeRO-Stage ${stage} Memory Sharding Breakdown (${N} GPUs)`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    vars: Record<string, string | number | boolean>,
    activeCol?: number,
    activeRank?: number,
    isFinished = false,
  ) => {
    const totalPerGpu = currP + currG + currOpt;
    const reductionFactor = (baselineTotal / totalPerGpu).toFixed(2);
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildMatrix(activeCol, activeRank, isFinished),
      auxiliaryState: {
        customState: {
          zeROStage: `ZeRO-Stage ${stage}`,
          numRanks: N,
          baselineMemoryPerGpu: `${baselineTotal} MB`,
          shardedMemoryPerGpu: `${totalPerGpu.toFixed(1)} MB`,
          memorySavings: `${((1 - totalPerGpu / baselineTotal) * 100).toFixed(1)}%`,
          efficiencyGain: `${reductionFactor}x`,
          partitioningDetails: `Params: ${currP.toFixed(1)}MB | Grads: ${currG.toFixed(1)}MB | Opt: ${currOpt.toFixed(1)}MB`,
        },
      },
      variables: vars,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    `Initialize DeepSpeed ZeRO-Stage ${stage} Memory Sharding`,
    `Baseline FP16 model memory requirement per GPU is ${baselineTotal} MB (${baseP}MB params + ${baseG}MB grads + ${baseOpt}MB Adam states). Applying ZeRO-${stage} sharding across ${N} GPUs.`,
    { stage, N, modelParamsMB: P, baselineTotalMB: baselineTotal },
  );

  // Step 2: Compute FP16 Params memory (2-Psi)
  addStep(
    6,
    `Compute FP16 Model Parameters Memory (2-Psi): p_mem = 2 × ${P} = ${baseP} MB`,
    `Each model parameter requires 2 bytes in FP16 precision. Unsharded parameter footprint is ${baseP} MB.`,
    { p_mem: baseP, model_params_mb: P },
    1,
  );

  // Step 3: Compute FP16 Gradients memory (2-Psi)
  addStep(
    7,
    `Compute FP16 Gradients Memory (2-Psi): g_mem = 2 × ${P} = ${baseG} MB`,
    `Backpropagation gradients require 2 bytes per parameter in FP16 precision. Unsharded gradient footprint is ${baseG} MB.`,
    { g_mem: baseG, model_params_mb: P },
    2,
  );

  // Step 4: Compute FP32 Adam Optimizer States memory (12-Psi)
  addStep(
    8,
    `Compute FP32 Adam Optimizer States Memory (12-Psi): opt_mem = 12 × ${P} = ${baseOpt} MB`,
    `Adam optimizer requires 4B FP32 master weights + 4B FP32 momentum (m) + 4B FP32 variance (v) = 12 bytes/param. Unsharded optimizer footprint is ${baseOpt} MB.`,
    { opt_mem: baseOpt, model_params_mb: P },
    3,
  );

  // Step 5: Evaluate ZeRO stage condition
  const condLine = stage === 1 ? 10 : stage === 2 ? 12 : 15;
  addStep(
    condLine,
    `Evaluate ZeRO-Stage ${stage} Condition`,
    `Checking execution branch for stage == ${stage}.`,
    { stage, num_ranks: N },
  );

  // Step 6: Shard Optimizer States (Stage 1, 2, 3)
  currOpt = baseOpt / N;
  const optLine = stage === 1 ? 11 : stage === 2 ? 13 : 16;
  addStep(
    optLine,
    `Partition Adam Optimizer States: opt_mem /= ${N} => ${currOpt.toFixed(1)} MB`,
    `ZeRO-Stage 1+ shards the 12-Psi Adam optimizer states equally across all ${N} GPUs, reducing per-GPU optimizer memory from ${baseOpt}MB to ${currOpt.toFixed(1)}MB.`,
    { opt_mem: currOpt, num_ranks: N },
    3,
  );

  // Step 7: Shard Gradients (Stage 2 & 3)
  if (stage >= 2) {
    currG = baseG / N;
    const gradLine = stage === 2 ? 14 : 17;
    addStep(
      gradLine,
      `Partition FP16 Gradients: g_mem /= ${N} => ${currG.toFixed(1)} MB`,
      `ZeRO-Stage 2+ shards FP16 gradients across ${N} GPUs via Reduce-Scatter, reducing per-GPU gradient memory from ${baseG}MB to ${currG.toFixed(1)}MB.`,
      { g_mem: currG, num_ranks: N },
      2,
    );
  }

  // Step 8: Shard Parameters (Stage 3)
  if (stage === 3) {
    currP = baseP / N;
    addStep(
      18,
      `Partition FP16 Model Parameters: p_mem /= ${N} => ${currP.toFixed(1)} MB`,
      `ZeRO-Stage 3 shards FP16 model parameters across ${N} GPUs. Parameters are gathered dynamically via All-Gather before forward/backward passes, reducing per-GPU parameter memory from ${baseP}MB to ${currP.toFixed(1)}MB.`,
      { p_mem: currP, num_ranks: N },
      1,
    );
  }

  // Step 9: Iterate per-GPU allocations
  for (let r = 0; r < N; r++) {
    addStep(
      20,
      `Allocated Memory for GPU Rank #${r}`,
      `GPU #${r} holds ${currP.toFixed(1)}MB Params, ${currG.toFixed(1)}MB Gradients, and ${currOpt.toFixed(1)}MB Adam Optimizer States.`,
      { rank: r, stage, memPerGpuMB: (currP + currG + currOpt).toFixed(1) },
      undefined,
      r,
    );
  }

  // Step 10: Compute total memory per GPU
  const finalTotalPerGpu = currP + currG + currOpt;
  addStep(
    20,
    `Calculate Total Memory Per GPU: total_mem_per_gpu = ${finalTotalPerGpu.toFixed(1)} MB`,
    `Summing per-GPU allocations: ${currP.toFixed(1)}MB (params) + ${currG.toFixed(1)}MB (grads) + ${currOpt.toFixed(1)}MB (opt) = ${finalTotalPerGpu.toFixed(1)}MB per GPU.`,
    { total_mem_per_gpu: finalTotalPerGpu },
  );

  // Step 11: Return dictionary
  const finalReductionFactor = (baselineTotal / finalTotalPerGpu).toFixed(2);
  addStep(
    21,
    `ZeRO-Stage ${stage} Sharding Complete: total_mem_per_gpu = ${finalTotalPerGpu.toFixed(1)} MB`,
    `Memory per GPU reduced from ${baselineTotal} MB to ${finalTotalPerGpu.toFixed(1)} MB (${finalReductionFactor}x memory efficiency).`,
    { stage, numRanks: N, reductionFactor: `${finalReductionFactor}x` },
    undefined,
    undefined,
    true,
  );

  return steps;
}

export const deepspeedZeroSharding: AlgorithmDefinition<ZeroShardingInput> = {
  id: "deepspeed-zero-sharding",
  title: "DeepSpeed ZeRO Memory Sharding",
  topicIds: ["ml_distributed_systems"],
  difficulty: "Hard",
  description:
    "Zero Redundancy Optimizer (ZeRO, Rajbhandari et al.) that memory-shards optimizer states (Stage 1), gradients (Stage 2), and model parameters (Stage 3) across data-parallel GPU nodes to eliminate memory redundancy.",
  constraints: [
    "Number of GPU ranks N > 0",
    "Model parameters MB > 0",
    "ZeRO Stage must be 1, 2, or 3",
  ],
  examples: ZERO_SHARDING_EXAMPLES,
  code: DEEPSPEED_ZERO_SHARDING_CODE,
  timeComplexity: {
    best: "O(P / N)",
    average: "O(P / N)",
    worst: "O(P / N)",
  },
  spaceComplexity: "O(P / N)",
  complexityAnalysis: {
    time: "Communication overhead is 1.5x (ZeRO-3 All-Gather) to 2x (standard DDP All-Reduce) compared to baseline data parallelism.",
    space:
      "Memory footprint scales down linearly from O(P) to O(P / N) at Stage 3, enabling training of models far exceeding single GPU VRAM.",
  },
  topicGuide: {
    overview:
      "DeepSpeed ZeRO (Zero Redundancy Optimizer) eliminates memory redundancies in data-parallel training by sharding the 3 main components of model memory: Optimizer States (12B per param), Gradients (2B per param), and Parameters (2B per param).",
    sections: [
      {
        heading: "ZeRO Stages 1, 2, 3",
        body: "Stage 1 (Pos): Shards Adam 4x FP32 optimizer states. Stage 2 (Pos+g): Shards optimizer states and gradients. Stage 3 (Pos+g+p): Shards parameters too, dynamically gathering weights via All-Gather right before forward/backward pass.",
      },
      {
        heading: "ZeRO-Offload",
        body: "Extends ZeRO-Stage 2/3 by offloading optimizer updates to host CPU RAM or NVMe storage to enable training 10B+ models on single GPUs.",
      },
    ],
    keyTerms: [
      {
        term: "ZeRO",
        definition: "Zero Redundancy Optimizer for memory-sharded data parallel training.",
      },
      {
        term: "Optimizer State Partitioning",
        definition:
          "Splitting Adam momentum/variance buffers across GPUs to save 12x model memory.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 9" }],
  defaultInput: DEFAULT_ZERO_SHARDING_INPUT,
  generateSteps: generateZeroShardingSteps,
};
