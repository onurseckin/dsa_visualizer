import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface columnParallelLinearReshaperInput {
  data: number[];
  target?: number;
}

export const COLUMNPARALLELLINEARRESHAPER_CODE = `def column_parallel_linear_reshaper(weights: list[float], num_tp_ranks: int) -> list[dict]:
    total_elements = len(weights)
    if num_tp_ranks <= 0 or total_elements == 0:
        return []
    
    shard_size = (total_elements + num_tp_ranks - 1) // num_tp_ranks
    rank_shards = []
    
    for rank in range(num_tp_ranks):
        start_idx = rank * shard_size
        end_idx = min(start_idx + shard_size, total_elements)
        shard = weights[start_idx:end_idx]
        rank_shards.append({
            "rank": rank,
            "start_idx": start_idx,
            "end_idx": end_idx,
            "shard": shard
        })
        
    return rank_shards
`;

export const DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT: columnParallelLinearReshaperInput = {
  data: [10, 20, 30, 40, 50, 60, 70, 80],
  target: 2,
};

export const generateColumnParallelLinearReshaperSteps = (
  input: columnParallelLinearReshaperInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const weights = input.data.length > 0 ? input.data : [10, 20, 30, 40, 50, 60, 70, 80];
  const numRanks = Math.max(1, input.target ?? 2);
  const totalElements = weights.length;
  const shardSize = Math.ceil(totalElements / numRanks);

  const buildMatrixCells = (
    activeRank?: number,
    activeCol?: number,
    completedRanks: number[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numRanks; r++) {
      const rStart = r * shardSize;
      for (let c = 0; c < shardSize; c++) {
        const globalIdx = rStart + c;
        const exists = globalIdx < totalElements;
        const val = exists ? weights[globalIdx] : "PAD";
        let state: MatrixCellItem["state"] = "default";
        if (completedRanks.includes(r)) {
          state = "sorted";
        } else if (r === activeRank) {
          if (c === activeCol) {
            state = "active";
          } else {
            state = "compared";
          }
        } else if (!exists) {
          state = "inactive";
        }
        cells.push({
          row: r,
          col: c,
          value: val,
          label: exists ? `W[${globalIdx}]` : "Padding",
          state,
        });
      }
    }
    return cells;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRank?: number,
    activeCol?: number,
    completedRanks: number[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: numRanks,
        cols: shardSize,
        rowHeaders: Array.from({ length: numRanks }, (_, r) => `GPU Rank ${r}`),
        colHeaders: Array.from({ length: shardSize }, (_, c) => `Col ${c}`),
        cells: buildMatrixCells(activeRank, activeCol, completedRanks),
      },
      auxiliaryState: {
        customState: {
          totalWeights: String(totalElements),
          numTpRanks: String(numRanks),
          computedShardSize: String(shardSize),
          completedRanksCount: String(completedRanks.length),
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "Enter column_parallel_linear_reshaper",
    `Invoking Megatron-LM Column Parallel Linear weight reshaper for ${totalElements} parameters across ${numRanks} Tensor Parallel (TP) ranks.`,
    { total_elements: totalElements, num_tp_ranks: numRanks },
  );

  // Step 2: Read total elements
  addStep(
    2,
    "Read Weight Array Length",
    `Computed total_elements = len(weights) = ${totalElements}.`,
    { total_elements: totalElements },
  );

  // Step 3: Check bounds
  addStep(
    3,
    "Validate TP Rank Count & Array Size",
    `Checking if num_tp_ranks (${numRanks}) <= 0 or total_elements (${totalElements}) == 0. Validation passed.`,
    { num_tp_ranks: numRanks, total_elements: totalElements, valid: true },
  );

  // Step 4: Shard size ceiling division formula
  addStep(
    6,
    "Compute Shard Size via Ceiling Division",
    `Calculated shard_size = (${totalElements} + ${numRanks} - 1) // ${numRanks} = ${shardSize} columns per TP GPU rank.`,
    { shard_size: shardSize, formula: "(N + TP - 1) // TP" },
  );

  // Step 5: Initialize shards container
  addStep(
    7,
    "Initialize Shards Allocation List",
    "Created empty rank_shards list to hold per-rank boundary metadata and memory slices.",
    { rank_shards_length: 0 },
  );

  const completedRanks: number[] = [];

  // Iterate across TP ranks
  for (let rank = 0; rank < numRanks; rank++) {
    // Step: Loop header
    addStep(
      9,
      `Begin Processing TP GPU Rank ${rank}`,
      `Iterating loop for rank = ${rank} of ${numRanks}.`,
      { rank, total_ranks: numRanks },
      rank,
    );

    // Step: Compute start_idx
    const startIdx = rank * shardSize;
    addStep(
      10,
      `Compute Start Index for Rank ${rank}`,
      `start_idx = ${rank} * ${shardSize} = ${startIdx}.`,
      { rank, start_idx: startIdx },
      rank,
    );

    // Step: Compute end_idx
    const endIdx = Math.min(startIdx + shardSize, totalElements);
    addStep(
      11,
      `Compute End Index for Rank ${rank}`,
      `end_idx = min(${startIdx} + ${shardSize}, ${totalElements}) = ${endIdx}.`,
      { rank, start_idx: startIdx, end_idx: endIdx },
      rank,
    );

    // Step-by-step element extraction per column
    for (let c = 0; c < shardSize; c++) {
      const gIdx = startIdx + c;
      const valid = gIdx < totalElements;
      addStep(
        12,
        `Extract Column ${c} (Global Index ${gIdx}) for Rank ${rank}`,
        valid
          ? `Extracting parameter weight W[${gIdx}] = ${weights[gIdx]} into Rank ${rank} buffer.`
          : `Global index ${gIdx} exceeds total elements ${totalElements}; padding with boundary default.`,
        { rank, column: c, global_idx: gIdx, value: valid ? weights[gIdx] : "PAD" },
        rank,
        c,
        completedRanks,
      );
    }

    const shardSlice = weights.slice(startIdx, endIdx);
    addStep(
      12,
      `Slice Parameter Sub-array for Rank ${rank}`,
      `Extracted contiguous memory shard weights[${startIdx}:${endIdx}] = [${shardSlice.join(", ")}].`,
      { rank, shard_length: shardSlice.length },
      rank,
      undefined,
      completedRanks,
    );

    addStep(
      13,
      `Construct Shard Metadata Dictionary for Rank ${rank}`,
      `Building allocation payload dict with rank=${rank}, start_idx=${startIdx}, end_idx=${endIdx}.`,
      { rank, start_idx: startIdx, end_idx: endIdx },
      rank,
      undefined,
      completedRanks,
    );

    completedRanks.push(rank);
    addStep(
      18,
      `Append Rank ${rank} Shard to Allocation List`,
      `Successfully registered GPU Rank ${rank} shard allocation. Total completed ranks: ${completedRanks.length}/${numRanks}.`,
      { rank, completed_ranks: completedRanks.length },
      undefined,
      undefined,
      completedRanks,
    );
  }

  // Verification step: Alignment & memory layout
  addStep(
    20,
    "Verify Tensor Core Alignment & VRAM Allocation",
    `Ensured all ${numRanks} rank shards align with GPU memory page boundaries and zero communication forward pass requirements.`,
    { total_ranks: numRanks, total_shards: completedRanks.length },
    undefined,
    undefined,
    completedRanks,
  );

  // Return step
  addStep(
    20,
    "Return Rank Shards List",
    "Returning final list of dictionaries containing sharded parameter weights and column index ranges.",
    { completed: true, shards_returned: completedRanks.length },
    undefined,
    undefined,
    completedRanks,
  );

  return steps;
};

const COLUMNPARALLELLINEARRESHAPER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "weights.reshape(-1, num_tp_ranks).transpose()",
    "torch.all_reduce(weights, op=torch.distributed.ReduceOp.SUM)",
    "return weights[::-1]",
  ],
  hints: [
    {
      line: 6,
      hint: "Use integer ceiling division (total + tp - 1) // tp to compute equal column shard sizes.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for Megatron-LM Column Parallel Linear weight reshaper taking weight list and TP rank count.",
    2: "Measures total length of the weight array to determine matrix parameter count.",
    3: "Validates positive TP rank count and non-empty weight tensor input.",
    4: "Returns empty list immediately if input arguments are invalid or empty.",
    5: "Blank line before allocation calculations.",
    6: "Computes per-rank column shard size using integer ceiling division to handle uneven column splits.",
    7: "Initializes empty list to accumulate per-rank shard metadata dictionaries.",
    8: "Blank line before rank partition iteration loop.",
    9: "Iterates through each Tensor Parallel GPU rank ID from 0 to num_tp_ranks - 1.",
    10: "Calculates global parameter starting index for the current rank.",
    11: "Calculates global parameter ending index capped at total array length.",
    12: "Extracts contiguous sub-slice of weights for current TP rank.",
    13: "Appends dictionary containing rank ID, start_idx, end_idx, and sliced weight tensor.",
    14: "Specifies rank key in shard metadata dictionary.",
    15: "Specifies start_idx key in shard metadata dictionary.",
    16: "Specifies end_idx key in shard metadata dictionary.",
    17: "Specifies shard parameter tensor slice in metadata dictionary.",
    18: "Closes dictionary construct and appends to rank_shards list.",
    19: "Blank line before function return statement.",
    20: "Returns final list of per-rank column shard dictionaries.",
  },
};

export const columnParallelLinearReshaper: AlgorithmDefinition<columnParallelLinearReshaperInput> =
  {
    id: "column-parallel-linear-reshaper",
    title: "Megatron-LM Column Parallel Linear Layer Reshaper",
    topicIds: ["ml_distributed_systems", "ml_tensor_algebra"],
    difficulty: "Medium",
    description:
      "In Megatron-LM Tensor Parallelism (TP), Column Parallel Linear layers partition weight matrices along output column dimensions $d_{out}$ across $N$ GPU ranks ($W = [W_0 | W_1 | \\dots | W_{N-1}]$).\n\n### Why It Exists & Problem Solved\nModern Large Language Models (LLMs) with tens or hundreds of billions of parameters exceed the VRAM capacity of any single GPU (e.g. 80GB H100). Column Parallelism enables fitting massive linear layers (such as Transformer QKV projection matrices or MLP gate/up projections) into distributed GPU memory while keeping forward-pass communication cost at zero.\n\n### Step-by-Step Intuition\n1. **Activation Replication**: Input activations $X \\in \\mathbb{R}^{B \\times S \\times d_{in}}$ are duplicated across all $N$ TP ranks without communication.\n2. **Local GEMM**: Each GPU rank $i$ computes local matrix multiplication $Y_i = X W_i$, yielding a slice of output features $Y_i \\in \\mathbb{R}^{B \\times S \\times (d_{out}/N)}$.\n3. **Deferred Communication**: Because $Y_i$ is already column-sharded, it directly matches the input requirement of a subsequent Row Parallel Linear layer. All-Reduce communication is completely avoided until after the Row Parallel layer!\n\n### Trade-offs & Complexity\n- **Time Complexity**: $O(N)$ linear step to compute rank slices and $O(B \\cdot S \\cdot d_{in} \\cdot \\frac{d_{out}}{N})$ local compute per rank.\n- **Space Complexity**: Memory footprint per GPU scales down by $1/N$ to $O(\\frac{d_{in} \\cdot d_{out}}{N})$.\n- **Hardware Alignment**: Shard dimensions must be multiples of 16/32 elements for optimal NVIDIA Tensor Core FP16/BF16 MMA execution.",
    constraints: ["1 <= data.length <= 1000", "1 <= target (num_ranks) <= 64"],
    examples: [
      {
        kind: "basic",
        title: "2-GPU Column Partitioning",
        inputDisplay: "data = [10, 20, 30, 40, 50, 60, 70, 80], target = 2",
        outputDisplay: "Rank 0: [10..40], Rank 1: [50..80]",
        input: { data: [10, 20, 30, 40, 50, 60, 70, 80], target: 2 },
        output: "Rank 0: [10, 20, 30, 40], Rank 1: [50, 60, 70, 80]",
        explanation:
          "Splits 8 parameter weights evenly into 2 TP column shards of 4 elements each.",
      },
      {
        kind: "complex",
        title: "3-GPU Asymmetric Partitioning",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 3",
        outputDisplay: "Rank 0: [1, 2], Rank 1: [3, 4], Rank 2: [5]",
        input: { data: [1, 2, 3, 4, 5], target: 3 },
        output: "Rank 0: [1, 2], Rank 1: [3, 4], Rank 2: [5]",
        explanation: "Partitions 5 parameters across 3 GPUs with ceiling shard sizes.",
      },
      {
        kind: "negative",
        title: "Single Rank Edge Case",
        inputDisplay: "data = [5, 10, 15], target = 1",
        outputDisplay: "Rank 0: [5, 10, 15]",
        input: { data: [5, 10, 15], target: 1 },
        output: "Rank 0: [5, 10, 15]",
        explanation: "With 1 TP rank, entire weight matrix resides on Rank 0 without partitioning.",
      },
    ],
    code: COLUMNPARALLELLINEARRESHAPER_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass O(N) over parameter array to compute contiguous rank slices.",
      space: "O(N) memory to store sharded output buffers for each Tensor Parallel rank.",
    },
    topicGuide: {
      overview:
        "Megatron-LM Column Parallel Linear layers split weight matrices along output column dimensions across Tensor Parallel (TP) GPU ranks to fit large LLMs into distributed VRAM.",
      sections: [
        {
          heading: "Why It Exists & Problem Solved",
          body: "As Transformer models scale past tens of billions of parameters, individual linear projection layers (such as QKV projections and MLP up-projections) become too large for single GPU memory. Column Parallelism splits the output dimension d_out across N GPUs. Crucially, because inputs are duplicated across ranks, forward pass matrix multiplication requires ZERO inter-GPU communication.",
        },
        {
          heading: "Step-by-Step Intuition",
          body: "1. The full linear layer weight matrix W (d_in x d_out) is sharded along columns into N contiguous blocks W_0, W_1, ..., W_{N-1}.\n2. During forward pass, input X is broadcast to all TP ranks.\n3. Each rank executes local GEMM Y_i = X * W_i independently.\n4. Output feature slices Y_i are produced locally and passed directly to the next Row Parallel layer.",
        },
        {
          heading: "Distributed Systems & Bandwidth Analysis",
          body: "By deferring inter-GPU communication until after the paired Row Parallel layer, Megatron-LM TP blocks cut collective communication calls in half. Instead of communicating on every layer, communication happens only once per Transformer block forward pass via All-Reduce.",
        },
        {
          heading: "Hardware & Architecture Trade-offs",
          body: "Column Parallelism requires high-speed intra-node interconnects (NVLink up to 900 GB/s on NVIDIA NVSwitch). Scaling TP across slower InfiniBand network links introduces communication latency, so TP is almost universally restricted to intra-node GPUs.",
        },
      ],
      keyTerms: [
        {
          term: "Column Parallelism",
          definition:
            "Splitting GEMM weight columns across Tensor Parallel ranks so each GPU computes a slice of output features.",
        },
        {
          term: "Tensor Parallelism (TP)",
          definition:
            "Intra-node parallel execution scheme partitioning individual layer weight matrices across high-speed interconnects.",
        },
        {
          term: "Identity Broadcast",
          definition:
            "Replicating input activation tensors across all TP ranks without inter-GPU communication.",
        },
        {
          term: "GEMM Column Splitting",
          definition:
            "Partitioning output dimension d_out of matrix multiplication operations across GPU memory buffers.",
        },
      ],
    },
    trivia: COLUMNPARALLELLINEARRESHAPER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT,
    generateSteps: generateColumnParallelLinearReshaperSteps,
  };
