import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
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
    # Baseline FP16 training memory breakdown (in MB per GPU):
    # FP16 Params: 2 * params
    # FP16 Gradients: 2 * params
    # FP32 Optimizer states (Adam: 4 bytes Master Weights + 4 Momentum + 4 Variance): 12 * params
    
    p_mem = 2 * model_params_mb
    g_mem = 2 * model_params_mb
    opt_mem = 12 * model_params_mb
    
    if stage == 1:
        # ZeRO-Stage 1: Partition Optimizer States (12x / N)
        opt_mem /= num_ranks
    elif stage == 2:
        # ZeRO-Stage 2: Partition Optimizer States & Gradients
        opt_mem /= num_ranks
        g_mem /= num_ranks
    elif stage == 3:
        # ZeRO-Stage 3: Partition Optimizer States, Gradients & Parameters
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
    explanation: "Shards 12GB optimizer states and 2GB gradients down to 3GB + 0.5GB per GPU, saving 10.5GB per node.",
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
    explanation: "Achieves 8x memory reduction across all model states, enabling 100B+ model training on 8 GPUs.",
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
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Stage must be 1, 2, or 3" } },
      variables: {},
    });
    return steps;
  }

  const baseP = 2 * P;
  const baseG = 2 * P;
  const baseOpt = 12 * P;
  const baselineTotal = baseP + baseG + baseOpt;

  let shardP = baseP;
  let shardG = baseG;
  let shardOpt = baseOpt;

  if (stage >= 1) shardOpt /= N;
  if (stage >= 2) shardG /= N;
  if (stage >= 3) shardP /= N;

  const totalPerGpu = shardP + shardG + shardOpt;
  const memoryReductionFactor = (baselineTotal / totalPerGpu).toFixed(2);

  const elements: ArrayElement[] = Array.from({ length: N }, (_, idx) => ({
    id: `gpu-${idx}`,
    value: idx,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeRank: number,
    vars: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el, idx) => ({
          ...el,
          state: idx === activeRank ? "active" : idx < activeRank ? "sorted" : "default",
          pointers: [`GPU Rank #${idx}`],
        })),
      },
      auxiliaryState: {
        customState: {
          zeROStage: `ZeRO-Stage ${stage}`,
          numRanks: N,
          baselineMemoryPerGpu: `${baselineTotal} MB`,
          shardedMemoryPerGpu: `${totalPerGpu.toFixed(1)} MB`,
          memorySavings: `${((1 - totalPerGpu / baselineTotal) * 100).toFixed(1)}%`,
          partitioningDetails: `Params: ${shardP.toFixed(1)}MB | Grads: ${shardG.toFixed(1)}MB | Opt: ${shardOpt.toFixed(1)}MB`,
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    `Initialize DeepSpeed ZeRO-Stage ${stage} Memory Sharding`,
    `Baseline FP16 model memory requirement per GPU is ${baselineTotal} MB. Applying ZeRO-${stage} sharding across ${N} GPUs.`,
    -1,
    { stage, N, modelParamsMB: P, baselineTotalMB: baselineTotal }
  );

  for (let r = 0; r < N; r++) {
    addStep(
      10,
      `Allocated Sharded State for GPU Rank #${r}`,
      `GPU #${r} holds ${shardP.toFixed(1)}MB FP16 Params, ${shardG.toFixed(1)}MB Gradients, and ${shardOpt.toFixed(1)}MB Adam Optimizer States.`,
      r,
      { rank: r, stage, memPerGpuMB: totalPerGpu.toFixed(1) }
    );
  }

  elements.forEach((el) => {
    el.state = "sorted";
  });

  addStep(
    25,
    `ZeRO-Stage ${stage} Sharding Complete`,
    `Memory per GPU reduced from ${baselineTotal} MB to ${totalPerGpu.toFixed(1)} MB (${memoryReductionFactor}x memory efficiency).`,
    N,
    { stage, numRanks: N, reductionFactor: `${memoryReductionFactor}x` }
  );

  return steps;
}

export const deepspeedZeroSharding: AlgorithmDefinition<ZeroShardingInput> = {
  id: "deepspeed-zero-sharding",
  title: "DeepSpeed ZeRO Memory Sharding",
  category: "ml_distributed_systems",
  difficulty: "Hard",
  description:
    "Zero Redundancy Optimizer (ZeRO, Rajbhandari et al.) that memory-shards optimizer states (Stage 1), gradients (Stage 2), and model parameters (Stage 3) across data-parallel GPU nodes to eliminate memory redundancy.",
  isMlInfra: true,
  mlInfraLevel: 9,
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
    space: "Memory footprint scales down linearly from O(P) to O(P / N) at Stage 3, enabling training of models far exceeding single GPU VRAM.",
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
        definition: "Splitting Adam momentum/variance buffers across GPUs to save 12x model memory.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 9" }],
  defaultInput: DEFAULT_ZERO_SHARDING_INPUT,
  generateSteps: generateZeroShardingSteps,
};
