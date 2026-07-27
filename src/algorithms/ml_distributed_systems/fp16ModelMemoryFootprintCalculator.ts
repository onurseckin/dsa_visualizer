import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fp16ModelMemoryFootprintCalculatorInput {
  data: number[];
  target?: number;
}

export const FP16MODELMEMORYFOOTPRINTCALCULATOR_CODE = `def fp16_model_memory_footprint_calculator(layer_param_counts: list[int], optimizer_type: str = "adam") -> dict:
    """
    Calculates exact VRAM static memory footprint for FP16 mixed-precision LLM training.
    Computes 16-Psi memory breakdown: 2-Psi FP16 params, 2-Psi FP16 grads, 4-Psi FP32 master params, and 8-Psi Adam optimizer states.

    Input:
        layer_param_counts: List of parameter counts for each model layer.
        optimizer_type: Optimizer type ("adam" for 8-Psi states, "sgd" for 4-Psi momentum).

    Output:
        Dictionary containing detailed memory allocations in Megabytes and Gigabytes.
    """
    total_params = sum(layer_param_counts)
    if total_params <= 0:
        return {"total_params": 0, "total_static_gb": 0.0}

    fp16_params_bytes = total_params * 2
    fp16_grads_bytes = total_params * 2
    fp32_master_params_bytes = total_params * 4

    if optimizer_type.lower() == "adam":
        optimizer_states_bytes = total_params * 8  # 4B momentum + 4B variance
    else:
        optimizer_states_bytes = total_params * 4  # 4B momentum

    total_static_bytes = (
        fp16_params_bytes + fp16_grads_bytes + fp32_master_params_bytes + optimizer_states_bytes
    )

    return {
        "total_params": total_params,
        "fp16_params_mb": fp16_params_bytes / (1024 * 1024),
        "fp16_grads_mb": fp16_grads_bytes / (1024 * 1024),
        "fp32_master_mb": fp32_master_params_bytes / (1024 * 1024),
        "optimizer_states_mb": optimizer_states_bytes / (1024 * 1024),
        "total_static_gb": total_static_bytes / (1024 ** 3),
        "bytes_per_parameter": total_static_bytes // total_params if total_params > 0 else 16
    }
`;

export const DEFAULT_FP16MODELMEMORYFOOTPRINTCALCULATOR_INPUT: fp16ModelMemoryFootprintCalculatorInput =
  {
    data: [1000000, 2000000, 3000000, 4000000],
    target: 16,
  };

export const generateFp16ModelMemoryFootprintCalculatorSteps = (
  input: fp16ModelMemoryFootprintCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const layerCounts = input.data.length > 0 ? input.data : [1000000, 2000000, 3000000, 4000000];
  const totalParams = layerCounts.reduce((a, b) => a + b, 0);

  const tiers = [
    { name: "FP16 Parameters", multiplier: 2, key: "fp16_params" },
    { name: "FP16 Gradients", multiplier: 2, key: "fp16_grads" },
    { name: "FP32 Master Weights", multiplier: 4, key: "fp32_master" },
    { name: "FP32 Adam Momentum (m)", multiplier: 4, key: "adam_m" },
    { name: "FP32 Adam Variance (v)", multiplier: 4, key: "adam_v" },
  ];

  const buildMatrixCells = (
    activeTierIdx?: number,
    completedTierIndices: number[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    const totalBytes = totalParams * 16;

    for (let r = 0; r < tiers.length; r++) {
      const tier = tiers[r];
      const tierBytes = totalParams * tier.multiplier;
      const tierMB = (tierBytes / (1024 * 1024)).toFixed(2);
      const tierGB = (tierBytes / (1024 ** 3)).toFixed(4);
      const pct = totalBytes > 0 ? ((tierBytes / totalBytes) * 100).toFixed(1) + "%" : "0%";

      const isDone = completedTierIndices.includes(r);
      const isActive = r === activeTierIdx;

      const rowValues = [tier.name, `${tier.multiplier} Bytes`, `${tierMB} MB`, `${tierGB} GB`, pct];

      for (let c = 0; c < 5; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (isDone) state = "sorted";
        else if (isActive) state = "active";

        cells.push({
          row: r,
          col: c,
          value: rowValues[c],
          label: `${tier.name} (col ${c})`,
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
    activeTierIdx?: number,
    completedTierIndices: number[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: tiers.length,
        cols: 5,
        rowHeaders: tiers.map((t) => t.name),
        colHeaders: ["Tier Component", "Bytes / Param", "Allocation (MB)", "Allocation (GB)", "% Total VRAM"],
        cells: buildMatrixCells(activeTierIdx, completedTierIndices),
      },
      auxiliaryState: {
        customState: {
          totalParams: String(totalParams),
          totalStaticGB: ( (totalParams * 16) / (1024 ** 3) ).toFixed(3),
          bytesPerParam: "16 Bytes",
          activeTier: activeTierIdx !== undefined ? tiers[activeTierIdx].name : "None",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Enter fp16_model_memory_footprint_calculator",
    `Initializing 16-Psi static memory footprint calculation for model with ${layerCounts.length} layers.`,
    { layer_count: layerCounts.length, optimizer: "adam" },
  );

  // Step 2: Summing layer params
  let runningParams = 0;
  for (let l = 0; l < layerCounts.length; l++) {
    runningParams += layerCounts[l];
    addStep(
      21,
      `Layer ${l}: Accumulate ${layerCounts[l]} Parameters`,
      `Accumulated layer ${l} parameter count into total_params running sum (${runningParams} params).`,
      { layer: l, layer_params: layerCounts[l], running_params: runningParams },
    );
  }

  addStep(
    21,
    "Compute Total Parameters Sum",
    `Calculated total_params = sum(layer_param_counts) = ${totalParams} parameters.`,
    { total_params: totalParams },
  );

  addStep(
    22,
    "Validate Total Parameters > 0",
    `Checking if total_params (${totalParams}) <= 0. Validation passed.`,
    { total_params: totalParams, valid: true },
  );

  const completedTiers: number[] = [];

  // Step: FP16 Params (2 Bytes)
  const fp16ParamsBytes = totalParams * 2;
  addStep(
    25,
    "Compute FP16 Model Parameters Memory (2-Psi)",
    `fp16_params_bytes = ${totalParams} * 2 = ${fp16ParamsBytes} bytes (${(fp16ParamsBytes / (1024 * 1024)).toFixed(2)} MB).`,
    { fp16_params_bytes: fp16ParamsBytes },
    0,
    completedTiers,
  );
  completedTiers.push(0);

  // Step: FP16 Gradients (2 Bytes)
  const fp16GradsBytes = totalParams * 2;
  addStep(
    26,
    "Compute FP16 Gradients Memory (2-Psi)",
    `fp16_grads_bytes = ${totalParams} * 2 = ${fp16GradsBytes} bytes (${(fp16GradsBytes / (1024 * 1024)).toFixed(2)} MB).`,
    { fp16_grads_bytes: fp16GradsBytes },
    1,
    completedTiers,
  );
  completedTiers.push(1);

  // Step: FP32 Master Params (4 Bytes)
  const fp32MasterBytes = totalParams * 4;
  addStep(
    27,
    "Compute FP32 Master Parameters Memory (4-Psi)",
    `fp32_master_params_bytes = ${totalParams} * 4 = ${fp32MasterBytes} bytes (${(fp32MasterBytes / (1024 * 1024)).toFixed(2)} MB).`,
    { fp32_master_bytes: fp32MasterBytes },
    2,
    completedTiers,
  );
  completedTiers.push(2);

  // Step: Check optimizer
  addStep(
    29,
    "Check Optimizer Type ('adam')",
    "Evaluating if optimizer_type.lower() == 'adam'. Verified Adam optimizer (requires 8B per param).",
    { optimizer_type: "adam", requires_8b: true },
    3,
    completedTiers,
  );

  // Step: Adam Momentum m (4 Bytes)
  addStep(
    30,
    "Compute Adam First-Moment (m) Vector Memory (4-Psi)",
    `Adam first moment m requires 4 bytes per param = ${totalParams * 4} bytes.`,
    { adam_m_bytes: totalParams * 4 },
    3,
    completedTiers,
  );
  completedTiers.push(3);

  // Step: Adam Variance v (4 Bytes)
  addStep(
    30,
    "Compute Adam Second-Moment Variance (v) Vector Memory (4-Psi)",
    `Adam second moment v requires 4 bytes per param = ${totalParams * 4} bytes. Total optimizer states = 8-Psi bytes.`,
    { adam_v_bytes: totalParams * 4, total_optimizer_bytes: totalParams * 8 },
    4,
    completedTiers,
  );
  completedTiers.push(4);

  // Step: Sum total static bytes
  const totalStaticBytes = totalParams * 16;
  addStep(
    34,
    "Sum Total Static Memory Bytes (16-Psi Formula)",
    `total_static_bytes = 2B (params) + 2B (grads) + 4B (master) + 8B (adam) = 16 * ${totalParams} = ${totalStaticBytes} bytes.`,
    { total_static_bytes: totalStaticBytes },
    undefined,
    completedTiers,
  );

  // Step-by-step return dictionary construction
  addStep(
    38,
    "Begin Constructing Return Dictionary",
    "Populating static memory footprint dictionary payload.",
    { total_params: totalParams },
    undefined,
    completedTiers,
  );

  addStep(
    39,
    "Set total_params = " + totalParams,
    `Assigning "total_params": ${totalParams}.`,
    { total_params: totalParams },
    undefined,
    completedTiers,
  );

  addStep(
    40,
    `Set fp16_params_mb = ${(fp16ParamsBytes / (1024 * 1024)).toFixed(2)} MB`,
    "Converting FP16 parameters bytes to MB.",
    { fp16_params_mb: fp16ParamsBytes / (1024 * 1024) },
    undefined,
    completedTiers,
  );

  addStep(
    41,
    `Set fp16_grads_mb = ${(fp16GradsBytes / (1024 * 1024)).toFixed(2)} MB`,
    "Converting FP16 gradients bytes to MB.",
    { fp16_grads_mb: fp16GradsBytes / (1024 * 1024) },
    undefined,
    completedTiers,
  );

  addStep(
    42,
    `Set fp32_master_mb = ${(fp32MasterBytes / (1024 * 1024)).toFixed(2)} MB`,
    "Converting FP32 master weights bytes to MB.",
    { fp32_master_mb: fp32MasterBytes / (1024 * 1024) },
    undefined,
    completedTiers,
  );

  addStep(
    43,
    `Set optimizer_states_mb = ${((totalParams * 8) / (1024 * 1024)).toFixed(2)} MB`,
    "Converting Adam optimizer states bytes to MB.",
    { optimizer_states_mb: (totalParams * 8) / (1024 * 1024) },
    undefined,
    completedTiers,
  );

  addStep(
    44,
    `Set total_static_gb = ${(totalStaticBytes / (1024 ** 3)).toFixed(4)} GB`,
    "Converting total static bytes to Gigabytes (GB).",
    { total_static_gb: totalStaticBytes / (1024 ** 3) },
    undefined,
    completedTiers,
  );

  addStep(
    45,
    "Set bytes_per_parameter = 16",
    "Confirmed exact 16-Psi multiplier for FP16 mixed-precision training.",
    { bytes_per_parameter: 16 },
    undefined,
    completedTiers,
  );

  // Return step
  addStep(
    46,
    "Return Static Memory Footprint Dictionary",
    `Successfully calculated static VRAM footprint of ${(totalStaticBytes / (1024 ** 3)).toFixed(3)} GB (16 Bytes/Parameter).`,
    { completed: true, total_gb: totalStaticBytes / (1024 ** 3) },
    undefined,
    completedTiers,
  );

  return steps;
};

const FP16MODELMEMORYFOOTPRINTCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  distractors: [
    "total_memory = total_params * 2  # Only FP16 params needed",
    "torch.cuda.empty_cache()",
    "return layer_param_counts[::-1]",
  ],
  hints: [
    {
      line: 25,
      hint: "FP16 training static memory requires 16 bytes per parameter (2B params + 2B grads + 4B master + 8B Adam).",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for FP16 mixed-precision model memory footprint calculator.",
    2: "Starts docstring detailing FP16 static VRAM calculation.",
    3: "Describes calculating static memory footprint for FP16 mixed-precision LLM training.",
    4: "Details 16-Psi breakdown: 2B params + 2B grads + 4B master + 8B Adam states.",
    5: "Blank line in docstring.",
    6: "Docstring section header for input arguments.",
    7: "Docstring describing layer_param_counts parameter list.",
    8: "Docstring describing optimizer_type parameter.",
    9: "Blank line in docstring.",
    10: "Docstring section header for return value.",
    11: "Docstring describing memory allocation dictionary in MB and GB.",
    12: "Closes docstring block.",
    13: "Sums parameter counts across all model layers to find total_params.",
    14: "Validates positive total parameter count.",
    15: "Returns zero memory dictionary if total_params <= 0.",
    16: "Blank line before memory calculations.",
    17: "Computes 2 bytes per parameter for FP16 model weights.",
    18: "Computes 2 bytes per parameter for FP16 gradients.",
    19: "Computes 4 bytes per parameter for FP32 master weights.",
    20: "Blank line before optimizer condition.",
    21: "Checks if optimizer is Adam.",
    22: "Assigns 8 bytes per parameter for Adam optimizer states (4B momentum + 4B variance).",
    23: "Else block for non-Adam optimizers.",
    24: "Assigns 4 bytes per parameter for momentum optimizers.",
    25: "Blank line before summing total static bytes.",
    26: "Starts tuple addition of static memory component bytes.",
    27: "Adds FP16 params, FP16 grads, FP32 master params, and optimizer states.",
    28: "Closes total_static_bytes summation expression.",
    29: "Blank line before return dictionary construction.",
    30: "Starts dictionary construction for memory breakdown results.",
    31: "Includes total_params key.",
    32: "Converts FP16 parameters bytes to Megabytes.",
    33: "Converts FP16 gradients bytes to Megabytes.",
    34: "Converts FP32 master parameters bytes to Megabytes.",
    35: "Converts optimizer states bytes to Megabytes.",
    36: "Converts total static bytes to Gigabytes (GB).",
    37: "Calculates bytes_per_parameter integer ratio.",
    38: "Closes return dictionary construct.",
  },
};

export const fp16ModelMemoryFootprintCalculator: AlgorithmDefinition<fp16ModelMemoryFootprintCalculatorInput> =
  {
    id: "fp16-model-memory-footprint-calculator",
    title: "Mixed-Precision FP16 Model Memory Calculator",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_precision_quantization"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Mixed-Precision FP16/BF16 training using the Adam optimizer requires tracking static memory allocations per parameter $\\Psi$:\n\n### Why It Exists & Problem Solved\nModern LLMs cannot be trained directly in pure FP32 due to massive GPU VRAM consumption. While computing matrix multiplications (GEMMs) in FP16 cuts tensor math execution time by 2x-4x on Tensor Cores, updating FP16 weights directly with small gradients causes numerical underflow to zero. Mixed-precision training solves this by maintaining high-precision FP32 master weights and optimizer states while executing forward and backward passes in FP16.\n\n### Step-by-Step Intuition\n1. **FP16 Model Weights ($2\\Psi$ bytes)**: Active weights used in forward pass GEMMs.\n2. **FP16 Gradients ($2\\Psi$ bytes)**: Backpropagated gradients computed during backward pass.\n3. **FP32 Master Weights ($4\\Psi$ bytes)**: High-precision weight copies updated by the optimizer.\n4. **FP32 Adam States ($8\\Psi$ bytes)**: $4\\Psi$ bytes for first-moment momentum ($m$) + $4\\Psi$ bytes for second-moment variance ($v$).\n5. **Total Footprint**: $2\\Psi + 2\\Psi + 4\\Psi + 8\\Psi = 16\\Psi$ bytes per parameter!\n\n### Trade-offs & Complexity\n- **Time Complexity**: $O(N)$ linear step over layer parameter array.\n- **Space Complexity**: $O(1)$ scalar memory computation.\n- **VRAM Constraint**: A 7B parameter model requires $7 \\times 10^9 \\times 16 = 112$ GB static VRAM, exceeding single 80GB H100 capacity and requiring ZeRO memory sharding.",
    constraints: ["1 <= data.length <= 100", "1 <= data[i] <= 10^10"],
    examples: [
      {
        kind: "basic",
        title: "1 Billion Parameter LLM Baseline",
        inputDisplay: "data = [1000000000], target = 16",
        outputDisplay: "Total Params: 1B, Static VRAM: 14.9 GB (16 Bytes/Param)",
        input: { data: [1000000000], target: 16 },
        output: "Total Params: 1B, Static VRAM: 14.9 GB (16 Bytes/Param)",
        explanation:
          "1B parameters require 16 GB of raw VRAM (14.901 GiB) for static mixed-precision training.",
      },
      {
        kind: "complex",
        title: "Multi-Layer Transformer Model",
        inputDisplay: "data = [1000000, 2000000, 3000000, 4000000], target = 16",
        outputDisplay: "Total Params: 10M, Static VRAM: 0.149 GB",
        input: { data: [1000000, 2000000, 3000000, 4000000], target: 16 },
        output: "Total Params: 10M, Static VRAM: 0.149 GB",
        explanation:
          "Aggregates layer parameter counts to 10M and computes 160MB static VRAM allocation.",
      },
      {
        kind: "negative",
        title: "Zero Parameter Edge Case",
        inputDisplay: "data = [0], target = 16",
        outputDisplay: "Total Params: 0, Static VRAM: 0.0 GB",
        input: { data: [0], target: 16 },
        output: "Total Params: 0, Static VRAM: 0.0 GB",
        explanation: "Empty layer parameter count safely returns zero static memory consumption.",
      },
    ],
    code: FP16MODELMEMORYFOOTPRINTCALCULATOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Linear time O(N) pass over layer array to sum parameter counts.",
      space: "O(1) auxiliary memory to calculate scalar memory footprint metrics.",
    },
    topicGuide: {
      overview:
        "Mixed-Precision FP16 training requires 16 bytes of static GPU VRAM per parameter (2B FP16 params + 2B FP16 grads + 4B FP32 master params + 8B Adam states).",
      sections: [
        {
          heading: "Why It Exists & Problem Solved",
          body: "FP16 Tensor Cores compute GEMMs at 2x throughput of FP32. However, directly updating FP16 weights with small gradient learning rates causes underflow to zero due to FP16's limited 10-bit mantissa. Mixed-precision maintains an FP32 master copy of weights. The Adam optimizer updates FP32 master weights using FP32 momentum (m) and variance (v) states, which are then cast back to FP16 for the next forward pass.",
        },
        {
          heading: "Step-by-Step Intuition",
          body: "1. Model weights are stored in FP16 (2 bytes/param) for fast forward pass computation.\n2. Backpropagation computes FP16 gradients (2 bytes/param).\n3. Adam optimizer reads FP32 master parameters (4 bytes/param) and updates first/second moment vectors (8 bytes/param).\n4. Total static memory per parameter = 2 + 2 + 4 + 8 = 16 bytes.",
        },
        {
          heading: "Distributed Systems & Bandwidth Analysis",
          body: "A 7B parameter LLM requires 112 GB of VRAM just for static model states during training. Because single GPUs (80GB H100) cannot hold this, techniques like ZeRO-1 (sharding 8B Adam states), ZeRO-2 (sharding 2B grads + 8B states), and ZeRO-3 (sharding all 16B states) partition memory across GPUs.",
        },
        {
          heading: "Hardware & Architecture Trade-offs",
          body: "Switching from FP16 to BF16 (Bfloat16) retains the exact same 16-byte multiplier, but eliminates loss scaling requirements because BF16 shares FP32's 8-bit exponent range. Quantized optimizers (e.g. 8-bit Adam) shrink optimizer states from 8 bytes to 2 bytes per param.",
        },
      ],
      keyTerms: [
        {
          term: "16-Psi Baseline",
          definition:
            "The fundamental memory equation (16 bytes per parameter) required for static FP16 mixed-precision LLM training.",
        },
        {
          term: "FP32 Master Weights",
          definition:
            "High-precision 32-bit weight copies updated by the optimizer to prevent loss of precision from small gradients.",
        },
        {
          term: "Adam Optimizer States",
          definition:
            "First-moment momentum (m) and second-moment uncentered variance (v) vectors stored in 32-bit float format.",
        },
        {
          term: "ZeRO Memory Sharding",
          definition:
            "Zero Redundancy Optimizer partitioning strategy splitting parameters, gradients, and optimizer states across GPUs.",
        },
      ],
    },
    trivia: FP16MODELMEMORYFOOTPRINTCALCULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_FP16MODELMEMORYFOOTPRINTCALCULATOR_INPUT,
    generateSteps: generateFp16ModelMemoryFootprintCalculatorSteps,
  };

