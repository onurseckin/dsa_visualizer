import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
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
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const totalParams = input.data.reduce((a, b) => a + b, 0);

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          layerParams: `[${input.data.join(", ")}]`,
          totalParams: String(totalParams),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Mixed-Precision 16-Psi Model Memory Calculator",
    "Aggregating parameter counts across all model layers to compute 16-Psi memory allocations.",
    { total_layers: input.data.length, total_params: totalParams },
  );

  let runningSum = 0;
  input.data.forEach((val, idx) => {
    runningSum += val;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`Layer-${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      15,
      `Layer ${idx}: ${val} parameters -> Running Total: ${runningSum}`,
      `Accumulating ${val} parameters from layer ${idx} for baseline calculation.`,
      { layer_idx: idx, layer_params: val, running_total: runningSum },
      currentElements,
    );
  });

  const fp16ParamsMB = (totalParams * 2) / (1024 * 1024);
  const fp16GradsMB = (totalParams * 2) / (1024 * 1024);
  const fp32MasterMB = (totalParams * 4) / (1024 * 1024);
  const adamStatesMB = (totalParams * 8) / (1024 * 1024);
  const totalStaticGB = (totalParams * 16) / (1024 * 1024 * 1024);

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    30,
    "Execution Complete",
    `16-Psi Memory Breakdown: FP16 Params=${fp16ParamsMB.toFixed(1)}MB, Grads=${fp16GradsMB.toFixed(1)}MB, FP32 Master=${fp32MasterMB.toFixed(1)}MB, Adam States=${adamStatesMB.toFixed(1)}MB. Total Static VRAM=${totalStaticGB.toFixed(3)}GB.`,
    {
      completed: true,
      total_params: totalParams,
      fp16_params_mb: Math.round(fp16ParamsMB),
      fp16_grads_mb: Math.round(fp16GradsMB),
      fp32_master_mb: Math.round(fp32MasterMB),
      adam_states_mb: Math.round(adamStatesMB),
      total_static_gb: parseFloat(totalStaticGB.toFixed(3)),
    },
    finalElements,
  );

  return steps;
};

const FP16MODELMEMORYFOOTPRINTCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  distractors: [
    "total_memory = total_params * 2  # Only FP16 params needed",
    "torch.cuda.empty_cache()",
    "return layer_param_counts[::-1]",
  ],
  hints: [
    {
      line: 15,
      hint: "FP16 training static memory requires 16 bytes per parameter (2B params + 2B grads + 4B master + 8B Adam).",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for FP16 mixed-precision model memory footprint calculator.",
    14: "Sums parameter counts across all model layers.",
    18: "Computes 2B per parameter for FP16 weights.",
    19: "Computes 2B per parameter for FP16 gradients.",
    20: "Computes 4B per parameter for FP32 master weights.",
    23: "Computes 8B per parameter for Adam optimizer states (first & second momentum).",
    30: "Returns complete memory breakdown dictionary in MB and GB.",
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
      "Mixed-Precision FP16/BF16 training using the Adam optimizer requires tracking static memory allocations per parameter $\\Psi$:\n1. FP16 Model Parameters ($2\\Psi$ bytes)\n2. FP16 Gradients ($2\\Psi$ bytes)\n3. FP32 Master Parameters ($4\\Psi$ bytes)\n4. FP32 Adam Optimizer States: Momentum $m$ ($4\\Psi$ bytes) + Variance $v$ ($4\\Psi$ bytes)\n\nThis yields the standard $16\\Psi$ bytes static VRAM footprint equation for mixed-precision LLM training.\n\nInput Format:\n- data: Array of parameter counts per layer or block (e.g. `[1000000, 2000000]`).\n- target: Expected bytes per parameter multiplier (default `16`).\n\nOutput Format:\n- Returns detailed memory allocations (in MB and GB) for parameters, gradients, FP32 master weights, and optimizer momentum/variance.\n\nEdge Cases & Constraints:\n- Master weight precision: FP32 master weights are required in FP16 training to prevent underflow during optimizer parameter updates.\n- BF16 vs FP16: BF16 shares the exact same 16-byte multiplier as FP16 under Adam.\n- ZeRO Sharding: ZeRO-1 shards optimizer states ($8\\Psi / N$), ZeRO-2 shards gradients ($2\\Psi / N$), ZeRO-3 shards parameters ($2\\Psi / N$).",
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
          heading: "Core Concepts",
          body: "FP16 Tensor Cores compute GEMMs at 2x throughput of FP32. However, directly updating FP16 weights with small gradient learning rates causes underflow to zero due to FP16's limited 10-bit mantissa. Mixed-precision maintains an FP32 master copy of weights. The Adam optimizer updates FP32 master weights using FP32 momentum ($m$) and variance ($v$) states, which are then cast back to FP16 for the next forward pass.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "A 7B parameter LLM requires $7 \\times 10^9 \\times 16 = 112$ GB of VRAM just for static model states during training (excluding activation memory). This exceeds the 80GB VRAM capacity of an NVIDIA H100 GPU, necessitating memory optimization techniques like ZeRO-1/2/3 parameter sharding, activation checkpointing, or 8-bit optimizers.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Activation memory (storing intermediate hidden layer tensors for backward pass gradient computation) is dynamic and scales with batch size $\\times$ sequence length. While static memory is fixed at $16\\Psi$, activation memory often doubles peak VRAM requirements unless FlashAttention and activation checkpointing are enabled.",
        },
        {
          heading: "Architecture & Topology Trade-offs",
          body: "Switching from FP16 to BF16 (Bfloat16) retains the same 16-byte multiplier, but eliminates loss scaling requirements because BF16 shares FP32's 8-bit exponent range. Quantized optimizers (e.g. BitsAndBytes 8-bit Adam) reduce optimizer states from $8\\Psi$ to $2\\Psi$, shrinking static footprint to $10\\Psi$.",
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
