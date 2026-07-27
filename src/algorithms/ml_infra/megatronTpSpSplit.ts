import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

export interface MegatronTpSpInput {
  tpWorldSize: number; // e.g. 2 or 4 GPUs
  seqLen: number;
  hiddenDim: number;
}

export const MEGATRON_TP_SP_SPLIT_CODE = `def megatron_tp_sp_split(
    seq_len: int,
    hidden_dim: int,
    tp_world_size: int
) -> dict:
    # Column Parallel Linear (e.g. QKV projection or MLP gate)
  # Weights split along hidden_dim columns: [hidden_dim, hidden_dim // tp_world_size]
  col_weight_cols = hidden_dim // tp_world_size
  
  # Row Parallel Linear (e.g. Output projection or MLP down)
  # Weights split along hidden_dim rows: [hidden_dim // tp_world_size, hidden_dim]
  row_weight_rows = hidden_dim // tp_world_size
  
  # Sequence Parallelism (SP)
  # Activations (LayerNorm / Dropout) split along seq_len: [seq_len // tp_world_size, hidden_dim]
  sp_seq_len_per_rank = seq_len // tp_world_size
  
  return {
      "tp_world_size": tp_world_size,
      "column_parallel_slice": (hidden_dim, col_weight_cols),
      "row_parallel_slice": (row_weight_rows, hidden_dim),
      "sp_activation_slice": (sp_seq_len_per_rank, hidden_dim)
  }`;

export const DEFAULT_MEGATRON_TP_SP_INPUT: MegatronTpSpInput = {
  tpWorldSize: 4,
  seqLen: 8,
  hiddenDim: 16,
};

export const MEGATRON_TP_SP_EXAMPLES: ProblemExample<MegatronTpSpInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "4-GPU Megatron TP+SP Split (SeqLen 8, HiddenDim 16)",
    input: {
      tpWorldSize: 4,
      seqLen: 8,
      hiddenDim: 16,
    },
    output: "Column-Parallel & Row-Parallel weight slices with Sequence-Parallel activation partitioning",
    explanation: "Splits Column-Parallel MLP/Attention weights across 4 GPUs (4 columns each) and Sequence-Parallel LayerNorm activations (2 sequence tokens each).",
  },
  {
    id: "complex",
    kind: "complex",
    title: "8-GPU Tensor & Sequence Parallel Cluster (SeqLen 32, HiddenDim 64)",
    input: {
      tpWorldSize: 8,
      seqLen: 32,
      hiddenDim: 64,
    },
    output: "8-Way TP+SP Sharding; 8 columns per weight slice, 4 tokens per SP rank",
    explanation: "Replaces standard All-Reduce in Megatron-LM with All-Gather + Reduce-Scatter to eliminate activation duplication.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "2-GPU Minimal TP Partition",
    input: {
      tpWorldSize: 2,
      seqLen: 4,
      hiddenDim: 8,
    },
    output: "2-Way TP+SP split",
    explanation: "Minimal 2-rank Tensor/Sequence parallel split.",
  },
];

export function generateMegatronTpSpSteps(input: MegatronTpSpInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { tpWorldSize: TP, seqLen: S, hiddenDim: H } = input;

  if (TP <= 0 || S <= 0 || H <= 0 || S % TP !== 0 || H % TP !== 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid Megatron TP+SP Configuration",
        why: "Sequence length and hidden dimension must be divisible by TP world size.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "SeqLen & HiddenDim must be divisible by TP" } },
      variables: {},
    });
    return steps;
  }

  const colCols = H / TP;
  const rowRows = H / TP;
  const spSeq = S / TP;

  const elements: ArrayElement[] = Array.from({ length: TP }, (_, idx) => ({
    id: `gpu-${idx}`,
    value: idx,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeGpu: number,
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
          state: idx === activeGpu ? "active" : idx < activeGpu ? "sorted" : "default",
          pointers: [`GPU Rank #${idx}`],
        })),
      },
      auxiliaryState: {
        customState: {
          tpWorldSize: TP,
          columnParallelWeightShape: `[${H}, ${colCols}] per GPU`,
          rowParallelWeightShape: `[${rowRows}, ${H}] per GPU`,
          spActivationShape: `[${spSeq}, ${H}] per GPU`,
          communicationPrimitive: activeGpu < 0 ? "Initialization" : activeGpu % 2 === 0 ? "All-Gather (SP -> TP)" : "Reduce-Scatter (TP -> SP)",
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize Megatron-LM Tensor & Sequence Parallel (TP+SP) Partitioning",
    `Splitting model weights and activations across ${TP} GPUs. Column Parallel slices = [${H}, ${colCols}], SP token slices = [${spSeq}, ${H}].`,
    -1,
    { TP, S, H, colCols, spSeq }
  );

  for (let r = 0; r < TP; r++) {
    const tokenStart = r * spSeq;
    const tokenEnd = tokenStart + spSeq - 1;
    const colStart = r * colCols;
    const colEnd = colStart + colCols - 1;

    addStep(
      10,
      `GPU Rank #${r} TP/SP Partition Assigned`,
      `GPU #${r} holds Column-Parallel weight cols ${colStart}..${colEnd} and Sequence-Parallel activation tokens ${tokenStart}..${tokenEnd}.`,
      r,
      { rank: r, weightCols: `${colStart}..${colEnd}`, tokens: `${tokenStart}..${tokenEnd}` }
    );
  }

  elements.forEach((el) => {
    el.state = "sorted";
  });

  addStep(
    20,
    "Megatron TP+SP Partitioning Complete",
    `Successfully sharded Transformer layer across ${TP} GPUs with zero activation memory redundancy.`,
    TP,
    { totalGpus: TP, activationMemoryReduction: `${TP}x` }
  );

  return steps;
}

export const megatronTpSpSplit: AlgorithmDefinition<MegatronTpSpInput> = {
  id: "megatron-tp-sp-split",
  title: "Megatron-LM Tensor & Sequence Parallelism",
  category: "ml_distributed_systems",
  difficulty: "Hard",
  description:
    "Shards Transformer MLP/Attention weight matrices column-wise and row-wise across Tensor Parallel (TP) GPU ranks, while partitioning non-linear activations along the sequence length across Sequence Parallel (SP) ranks.",
  isMlInfra: true,
  mlInfraLevel: 9,
  constraints: [
    "TP World Size > 0",
    "Sequence length S divisible by TP World Size",
    "Hidden dimension H divisible by TP World Size",
  ],
  examples: MEGATRON_TP_SP_EXAMPLES,
  code: MEGATRON_TP_SP_SPLIT_CODE,
  timeComplexity: {
    best: "O((S * H^2) / TP)",
    average: "O((S * H^2) / TP)",
    worst: "O((S * H^2) / TP)",
  },
  spaceComplexity: "O((S * H + H^2) / TP)",
  complexityAnalysis: {
    time: "Matrix multiplication FLOPS scale down linearly with TP world size, reducing compute time by factor TP.",
    space: "Weight memory and activation memory scale down by 1/TP, enabling training of multi-hundred-billion parameter LLMs.",
  },
  topicGuide: {
    overview:
      "Megatron-LM (Shoeybi et al. 2019, Korthikanti et al. 2022) introduces 1D Tensor Parallelism for Multi-Head Attention and MLP layers. Adding Sequence Parallelism (SP) partitions LayerNorm and Dropout activations across TP ranks, replacing All-Reduce with All-Gather and Reduce-Scatter collectives.",
    sections: [
      {
        heading: "Column & Row Parallel Linear",
        body: "Column Parallel splits weight matrix W into [H, H/TP] (e.g. QKV proj). Row Parallel splits W into [H/TP, H] (e.g. Output proj). The product between them requires only 1 communication operation.",
      },
      {
        heading: "Sequence Parallelism (SP)",
        body: "Standard TP duplicates LayerNorm inputs across all TP GPUs. SP shards activations along sequence dimension S, eliminating activation memory overhead entirely.",
      },
    ],
    keyTerms: [
      {
        term: "Tensor Parallelism (TP)",
        definition: "Splitting intra-layer weight matrices across GPUs.",
      },
      {
        term: "Sequence Parallelism (SP)",
        definition: "Splitting activation tensors along sequence length to save memory.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 9" }],
  defaultInput: DEFAULT_MEGATRON_TP_SP_INPUT,
  generateSteps: generateMegatronTpSpSteps,
};
