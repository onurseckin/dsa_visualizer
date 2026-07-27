import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface oneF1bPipelineParallelExecutionSchedulerInput {
  data: number[];
  target?: number;
}

export const ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_CODE = `def one_f1b_pipeline_parallel_execution_scheduler(num_stages: int, num_microbatches: int) -> list[dict]:
    """
    Schedules 1F1B (One Forward One Backward) pipeline parallel micro-batch execution sequences.
    Reduces peak activation memory footprint from O(M) down to O(P) by interleaving forward and backward passes.

    Input:
        num_stages: Number of Pipeline Parallel GPU stages (P).
        num_microbatches: Total micro-batches in the global training batch (M).

    Output:
        List of scheduled execution step dictionaries specifying pass type (FORWARD / BACKWARD) and micro-batch ID.
    """
    if num_stages <= 0 or num_microbatches <= 0:
        return []

    schedule = []
    warmup_steps = min(num_stages, num_microbatches)

    # Phase 1: Warmup Phase (Forward passes only)
    for mb in range(warmup_steps):
        schedule.append({
            "step": len(schedule),
            "phase": "WARMUP",
            "type": "FORWARD",
            "microbatch_id": mb
        })

    # Phase 2: 1F1B Steady-State Phase (1 Forward, 1 Backward)
    fw_mb = warmup_steps
    bw_mb = 0
    while fw_mb < num_microbatches:
        schedule.append({
            "step": len(schedule),
            "phase": "1F1B_STEADY_STATE",
            "type": "BACKWARD",
            "microbatch_id": bw_mb
        })
        bw_mb += 1

        schedule.append({
            "step": len(schedule),
            "phase": "1F1B_STEADY_STATE",
            "type": "FORWARD",
            "microbatch_id": fw_mb
        })
        fw_mb += 1

    # Phase 3: Cooldown Phase (Remaining Backward passes)
    while bw_mb < num_microbatches:
        schedule.append({
            "step": len(schedule),
            "phase": "COOLDOWN",
            "type": "BACKWARD",
            "microbatch_id": bw_mb
        })
        bw_mb += 1

    return schedule
`;

export const DEFAULT_ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_INPUT: oneF1bPipelineParallelExecutionSchedulerInput =
  {
    data: [0, 1, 2, 3, 4, 5, 6, 7],
    target: 4,
  };

export const generateOneF1bPipelineParallelExecutionSchedulerSteps = (
  input: oneF1bPipelineParallelExecutionSchedulerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const numStages = Math.max(2, input.target ?? 4);
  const numMicrobatches = Math.max(numStages, input.data.length);

  const elements: ArrayElement[] = Array.from({ length: numMicrobatches }, (_, idx) => ({
    id: `mb-${idx}`,
    value: idx,
    state: "default",
  }));

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
          stages: String(numStages),
          microbatches: String(numMicrobatches),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize 1F1B (One Forward One Backward) Pipeline Parallel Scheduler",
    `Configuring pipeline with ${numStages} GPU stages and ${numMicrobatches} micro-batches.`,
    { num_stages: numStages, num_microbatches: numMicrobatches },
  );

  const warmupSteps = Math.min(numStages, numMicrobatches);

  // Warmup phase
  for (let mb = 0; mb < warmupSteps; mb++) {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === mb) return { ...el, state: "active", pointers: [`FW-MB-${mb}`] };
      if (i < mb) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      19,
      `Warmup Step ${mb + 1}/${warmupSteps}: Forward Pass MB-${mb}`,
      `Pipelining forward activation micro-batch ${mb} across stage pipeline to fill buffer queues.`,
      { phase: "WARMUP", type: "FORWARD", microbatch_id: mb },
      currentElements,
    );
  }

  // Steady-state phase
  let fwMb = warmupSteps;
  let bwMb = 0;
  while (fwMb < numMicrobatches) {
    const currentElementsBw: ArrayElement[] = elements.map((el, i) => {
      if (i === bwMb) return { ...el, state: "compare", pointers: [`BW-MB-${bwMb}`] };
      return el;
    });

    addStep(
      28,
      `1F1B Steady-State: Backward Pass MB-${bwMb}`,
      `Executing backward gradient pass on micro-batch ${bwMb} and freeing peak activation memory.`,
      { phase: "STEADY_STATE", type: "BACKWARD", microbatch_id: bwMb },
      currentElementsBw,
    );
    bwMb++;

    const currentElementsFw: ArrayElement[] = elements.map((el, i) => {
      if (i === fwMb) return { ...el, state: "active", pointers: [`FW-MB-${fwMb}`] };
      return el;
    });

    addStep(
      36,
      `1F1B Steady-State: Forward Pass MB-${fwMb}`,
      `Executing forward pass on micro-batch ${fwMb} while maintaining constant activation buffer capacity.`,
      { phase: "STEADY_STATE", type: "FORWARD", microbatch_id: fwMb },
      currentElementsFw,
    );
    fwMb++;
  }

  // Cooldown phase
  while (bwMb < numMicrobatches) {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === bwMb) return { ...el, state: "compare", pointers: [`BW-MB-${bwMb}`] };
      if (i < bwMb) return { ...el, state: "sorted" };
      return el;
    });

    addStep(
      45,
      `Cooldown Step: Backward Pass MB-${bwMb}`,
      `Draining remaining micro-batches; executing backward pass for MB-${bwMb}.`,
      { phase: "COOLDOWN", type: "BACKWARD", microbatch_id: bwMb },
      currentElements,
    );
    bwMb++;
  }

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
    pointers: ["Completed"],
  }));

  const bubbleFraction = ((numStages - 1) / numMicrobatches).toFixed(3);

  addStep(
    52,
    "Execution Complete",
    `Successfully scheduled 1F1B pipeline execution. Total steps: ${numMicrobatches * 2}. Pipeline bubble fraction: ${bubbleFraction}. Peak activation VRAM bounded by O(${numStages}).`,
    {
      completed: true,
      total_microbatches: numMicrobatches,
      bubble_fraction: parseFloat(bubbleFraction),
    },
    finalElements,
  );

  return steps;
};

const ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  distractors: [
    "schedule = [('FORWARD', i) for i in range(M)] + [('BACKWARD', i) for i in range(M)]",
    "torch.cuda.synchronize()",
    "return schedule[::-1]",
  ],
  hints: [
    {
      line: 28,
      hint: "1F1B alternates 1 Backward pass with 1 Forward pass to immediately free activation tensors.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for 1F1B pipeline parallel execution scheduler.",
    15: "Validates non-empty stage count and micro-batch numbers.",
    18: "Executes Warmup Phase issuing P forward micro-batches to fill pipeline depth.",
    26: "Executes 1F1B Steady-State Phase alternating backward and forward micro-batches.",
    43: "Executes Cooldown Phase running remaining backward micro-batches.",
    52: "Returns complete ordered 1F1B pipeline execution schedule.",
  },
};

export const oneF1bPipelineParallelExecutionScheduler: AlgorithmDefinition<oneF1bPipelineParallelExecutionSchedulerInput> =
  {
    id: "one-f1b-pipeline-parallel-execution-scheduler",
    title: "1F1B (One Forward One Backward) Pipeline Parallel Scheduler",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_tensor_algebra"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Pipeline Parallelism (PP) partitions layers of a Large Language Model across $P$ pipeline stages. Naive scheduling (like GPipe) executes all $M$ forward micro-batches before any backward micro-batches, requiring VRAM to store peak activation tensors for all $M$ micro-batches ($O(M)$ memory scaling).\n\nThe **1F1B (One Forward, One Backward)** schedule (used in Megatron-LM and DeepSpeed) mitigates this memory bottleneck through a three-phase schedule:\n1. **Warmup Phase**: Executes $P - i - 1$ forward passes to fill the pipeline depth.\n2. **1F1B Steady-State Phase**: Alternates 1 Backward micro-batch pass with 1 Forward micro-batch pass. Executing a backward pass immediately computes gradients and frees peak activation memory, bounding activation VRAM capacity to $O(P)$ micro-batches regardless of global batch size $M$.\n3. **Cooldown Phase**: Drains remaining backward passes.\n\nInput Format:\n- data: Array of micro-batch index identifiers (e.g. `[0, 1, 2, 3, 4, 5, 6, 7]`).\n- target: Number of Pipeline Parallel GPU stages ($P$).\n\nOutput Format:\n- Returns sequential execution schedule specifying pass type (`FORWARD` / `BACKWARD`), micro-batch ID, and step indices.\n\nEdge Cases & Constraints:\n- Micro-batch depth $M \\ge P$: Requires $M \\ge P$ to achieve high pipeline efficiency; bubble overhead fraction is $\\frac{P-1}{M}$.\n- Interleaved 1F1B: Virtual pipeline stages assign multiple non-contiguous layer blocks per GPU rank to shrink bubble size to $\\frac{P-1}{v M}$.",
    constraints: ["2 <= target (num_stages) <= 64", "1 <= data.length <= 1000"],
    examples: [
      {
        kind: "basic",
        title: "4-Stage 8-Microbatch 1F1B Schedule",
        inputDisplay: "data = [0, 1, 2, 3, 4, 5, 6, 7], target = 4",
        outputDisplay: "Warmup: 4 FW -> Steady-State: 4 (BW/FW) -> Cooldown: 4 BW",
        input: { data: [0, 1, 2, 3, 4, 5, 6, 7], target: 4 },
        output: "Warmup: 4 FW -> Steady-State: 4 (BW/FW) -> Cooldown: 4 BW",
        explanation:
          "Fills pipeline with 4 forward passes, then alternates 1 Backward and 1 Forward, ending with 4 backward passes.",
      },
      {
        kind: "complex",
        title: "2-Stage 4-Microbatch Schedule",
        inputDisplay: "data = [0, 1, 2, 3], target = 2",
        outputDisplay: "Warmup: 2 FW -> Steady-State: 2 (BW/FW) -> Cooldown: 2 BW",
        input: { data: [0, 1, 2, 3], target: 2 },
        output: "Warmup: 2 FW -> Steady-State: 2 (BW/FW) -> Cooldown: 2 BW",
        explanation:
          "Executes 1F1B schedule across 2 pipeline stages with 50% lower activation VRAM footprint.",
      },
      {
        kind: "negative",
        title: "Single Stage Edge Case",
        inputDisplay: "data = [0, 1], target = 1",
        outputDisplay: "Direct Execution without Pipeline Bubbles",
        input: { data: [0, 1], target: 1 },
        output: "Direct Execution without Pipeline Bubbles",
        explanation:
          "Single GPU stage executes forward and backward sequentially without pipeline bubble overhead.",
      },
    ],
    code: ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_CODE,
    timeComplexity: { best: "O(M)", average: "O(M)", worst: "O(M)" },
    spaceComplexity: "O(M)",
    complexityAnalysis: {
      time: "Linear time O(M) where M is total micro-batch count to generate complete 2M step schedule.",
      space: "O(M) memory to store ordered execution schedule descriptors for pipeline execution.",
    },
    topicGuide: {
      overview:
        "1F1B pipeline scheduling alternates forward and backward micro-batch execution to keep peak activation VRAM bounded by pipeline depth P rather than global micro-batch count M.",
      sections: [
        {
          heading: "Core Concepts",
          body: "Naive pipeline parallel schedules (like GPipe) store activation tensors for all $M$ micro-batches before executing backward passes. 1F1B solves this by initiating backward passes as soon as the first micro-batch completes its forward pass through all stages. Each completed backward pass frees activation VRAM, allowing the next forward pass to reuse freed memory.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "1F1B bounds peak activation memory to $O(P \\times \\text{layer_activations})$. This memory saving allows training multi-billion parameter models with batch sizes 10x larger than GPipe without triggering Out-Of-Memory (OOM) errors.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "The pipeline bubble fraction is given by $\\frac{P-1}{M}$. To keep idle GPU time under 10%, global micro-batch count $M$ must be at least $10 \\times P$. Interleaved 1F1B (virtual pipeline stages) splits each physical GPU into $v$ virtual stages, reducing bubble overhead down to $\\frac{P-1}{v \\cdot M}$.",
        },
        {
          heading: "Architecture & Topology Trade-offs",
          body: "Point-to-point (P2P) peer transfers (e.g. `ncclSend` and `ncclRecv`) stream activation tensors between adjacent pipeline stage GPUs. High-speed inter-node connections (such as InfiniBand or RoCEv2) prevent stage communication bottlenecks.",
        },
      ],
      keyTerms: [
        {
          term: "1F1B Scheduling",
          definition:
            "Execution pattern alternating 1 forward micro-batch with 1 backward micro-batch in steady state.",
        },
        {
          term: "Pipeline Bubble",
          definition:
            "Idle GPU time during pipeline warmup and cooldown phases when stages wait for activations or gradients.",
        },
        {
          term: "Activation VRAM Bound",
          definition:
            "Bounding peak stored activation tensors proportional to pipeline depth P rather than micro-batch count M.",
        },
        {
          term: "Interleaved 1F1B",
          definition:
            "Advanced PP variant assigning multiple non-contiguous layer blocks per GPU to shrink bubble overhead.",
        },
      ],
    },
    trivia: ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_INPUT,
    generateSteps: generateOneF1bPipelineParallelExecutionSchedulerSteps,
  };
