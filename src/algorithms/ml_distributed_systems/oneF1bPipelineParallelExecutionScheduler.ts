import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
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
  const numMicrobatches = Math.max(numStages, input.data.length > 0 ? input.data.length : 8);

  interface ScheduleItem {
    step: number;
    phase: string;
    type: "FORWARD" | "BACKWARD";
    microbatch_id: number;
  }

  const scheduleList: ScheduleItem[] = [];

  const buildMatrixCells = (
    currentStepIdx?: number,
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    const totalScheduleSteps = scheduleList.length;
    const cols = Math.max(1, totalScheduleSteps);

    for (let r = 0; r < numStages; r++) {
      for (let c = 0; c < cols; c++) {
        const item = scheduleList[c];
        let val = "-";
        let state: MatrixCellItem["state"] = "default";

        if (item) {
          const passAbbr = item.type === "FORWARD" ? "F" : "B";
          val = `${passAbbr}${item.microbatch_id}`;

          if (c === currentStepIdx) {
            state = "active";
          } else if (c < currentStepIdx!) {
            state = item.type === "FORWARD" ? "compared" : "sorted";
          }
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: `Stage ${r} Step ${c}`,
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
  ) => {
    const currentStepIdx = scheduleList.length > 0 ? scheduleList.length - 1 : 0;
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: numStages,
        cols: Math.max(1, scheduleList.length),
        rowHeaders: Array.from({ length: numStages }, (_, r) => `Stage ${r}`),
        colHeaders: Array.from({ length: Math.max(1, scheduleList.length) }, (_, c) => `T${c}`),
        cells: buildMatrixCells(currentStepIdx),
      },
      auxiliaryState: {
        customState: {
          numStages: String(numStages),
          numMicrobatches: String(numMicrobatches),
          scheduleLength: String(scheduleList.length),
          bubbleFraction: ((numStages - 1) / numMicrobatches).toFixed(3),
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "Enter one_f1b_pipeline_parallel_execution_scheduler",
    `Initializing 1F1B schedule generation for P=${numStages} pipeline stages and M=${numMicrobatches} micro-batches.`,
    { num_stages: numStages, num_microbatches: numMicrobatches },
  );

  // Step 2: Validate input
  addStep(
    13,
    "Validate Pipeline Stages & Micro-batches",
    `Checking if num_stages (${numStages}) <= 0 or num_microbatches (${numMicrobatches}) <= 0. Validation passed.`,
    { num_stages: numStages, num_microbatches: numMicrobatches, valid: true },
  );

  // Step 3: Initialize schedule container
  addStep(
    16,
    "Initialize Schedule Array",
    "Created empty schedule list to record ordered 1F1B execution step descriptors.",
    { schedule_length: 0 },
  );

  // Step 4: Warmup steps formula
  const warmupSteps = Math.min(numStages, numMicrobatches);
  addStep(
    17,
    "Compute Warmup Steps Count",
    `warmup_steps = min(${numStages}, ${numMicrobatches}) = ${warmupSteps} forward pass steps.`,
    { warmup_steps: warmupSteps },
  );

  // Phase 1: Warmup loop
  addStep(
    19,
    "Phase 1: Begin Warmup Phase (Forward Passes Only)",
    `Executing ${warmupSteps} initial forward passes to fill pipeline depth and establish steady-state flow.`,
    { phase: "WARMUP", warmup_steps: warmupSteps },
  );

  for (let mb = 0; mb < warmupSteps; mb++) {
    addStep(
      20,
      `Warmup Step ${mb + 1}/${warmupSteps}: Loop Header`,
      `Iterating warmup loop for microbatch_id = ${mb}.`,
      { phase: "WARMUP", microbatch_id: mb },
    );

    const item: ScheduleItem = {
      step: scheduleList.length,
      phase: "WARMUP",
      type: "FORWARD",
      microbatch_id: mb,
    };
    scheduleList.push(item);

    addStep(
      21,
      `Warmup Step ${mb + 1}: Append FORWARD Micro-batch ${mb}`,
      `Scheduled Forward pass for micro-batch ${mb} (activation VRAM allocation +1).`,
      { step: item.step, phase: item.phase, type: item.type, microbatch_id: mb },
    );
  }

  // Phase 2: Steady State setup
  addStep(
    28,
    "Phase 2: Begin 1F1B Steady-State Phase (Interleaved 1 Forward, 1 Backward)",
    "Pointers fw_mb and bw_mb established. Alternating 1 Backward pass with 1 Forward pass to keep activation VRAM bounded.",
    { phase: "1F1B_STEADY_STATE", fw_mb: warmupSteps, bw_mb: 0 },
  );

  let fwMb = warmupSteps;
  let bwMb = 0;

  addStep(
    29,
    "Initialize Steady-State Forward Pointer",
    `Set fw_mb = warmup_steps = ${fwMb}.`,
    { fw_mb: fwMb },
  );

  addStep(
    30,
    "Initialize Steady-State Backward Pointer",
    "Set bw_mb = 0.",
    { bw_mb: 0 },
  );

  while (fwMb < numMicrobatches) {
    addStep(
      31,
      `Steady-State Loop Check: fw_mb (${fwMb}) < num_microbatches (${numMicrobatches})`,
      `Evaluating steady-state condition for forward micro-batch ${fwMb}.`,
      { fw_mb: fwMb, num_microbatches: numMicrobatches },
    );

    // Backward item
    const bwItem: ScheduleItem = {
      step: scheduleList.length,
      phase: "1F1B_STEADY_STATE",
      type: "BACKWARD",
      microbatch_id: bwMb,
    };
    scheduleList.push(bwItem);

    addStep(
      32,
      `1F1B Steady-State: Schedule BACKWARD Pass for Micro-batch ${bwMb}`,
      `Scheduled Backward pass for micro-batch ${bwMb} (gradient computed & activation VRAM freed -1).`,
      { step: bwItem.step, phase: bwItem.phase, type: bwItem.type, microbatch_id: bwMb },
    );

    bwMb++;
    addStep(
      38,
      `Increment Backward Micro-batch Pointer -> bw_mb = ${bwMb}`,
      `Updated bw_mb = ${bwMb}.`,
      { bw_mb: bwMb },
    );

    // Forward item
    const fwItem: ScheduleItem = {
      step: scheduleList.length,
      phase: "1F1B_STEADY_STATE",
      type: "FORWARD",
      microbatch_id: fwMb,
    };
    scheduleList.push(fwItem);

    addStep(
      40,
      `1F1B Steady-State: Schedule FORWARD Pass for Micro-batch ${fwMb}`,
      `Scheduled Forward pass for micro-batch ${fwMb} (reusing VRAM memory freed by backward pass).`,
      { step: fwItem.step, phase: fwItem.phase, type: fwItem.type, microbatch_id: fwMb },
    );

    fwMb++;
    addStep(
      46,
      `Increment Forward Micro-batch Pointer -> fw_mb = ${fwMb}`,
      `Updated fw_mb = ${fwMb}.`,
      { fw_mb: fwMb },
    );
  }

  // Phase 3: Cooldown Phase
  addStep(
    48,
    "Phase 3: Begin Cooldown Phase (Draining Remaining Backward Passes)",
    `Forward passes complete. Draining remaining backward micro-batches (${bwMb} to ${numMicrobatches - 1}).`,
    { phase: "COOLDOWN", remaining_backward: numMicrobatches - bwMb },
  );

  while (bwMb < numMicrobatches) {
    addStep(
      49,
      `Cooldown Loop Check: bw_mb (${bwMb}) < num_microbatches (${numMicrobatches})`,
      `Evaluating cooldown condition for backward micro-batch ${bwMb}.`,
      { bw_mb: bwMb, num_microbatches: numMicrobatches },
    );

    const bwItem: ScheduleItem = {
      step: scheduleList.length,
      phase: "COOLDOWN",
      type: "BACKWARD",
      microbatch_id: bwMb,
    };
    scheduleList.push(bwItem);

    addStep(
      50,
      `Cooldown Step: Schedule BACKWARD Pass for Micro-batch ${bwMb}`,
      `Scheduled final Backward pass for micro-batch ${bwMb}.`,
      { step: bwItem.step, phase: bwItem.phase, type: bwItem.type, microbatch_id: bwMb },
    );

    bwMb++;
    addStep(
      56,
      `Increment Backward Pointer -> bw_mb = ${bwMb}`,
      `Updated bw_mb = ${bwMb}.`,
      { bw_mb: bwMb },
    );
  }

  // Verification step
  const bubbleFraction = ((numStages - 1) / numMicrobatches).toFixed(3);
  addStep(
    58,
    "Verify Bounded Activation VRAM & Pipeline Bubble Overhead",
    `Verified 1F1B schedule bounds peak activation VRAM to O(${numStages}) micro-batches with pipeline bubble fraction of ${bubbleFraction}.`,
    { num_stages: numStages, num_microbatches: numMicrobatches, bubble_fraction: parseFloat(bubbleFraction) },
  );

  // Return step
  addStep(
    58,
    "Return Ordered 1F1B Execution Schedule",
    `Returning completed 1F1B pipeline schedule containing ${scheduleList.length} micro-batch execution steps.`,
    { completed: true, schedule_length: scheduleList.length },
  );

  return steps;
};

const ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  distractors: [
    "schedule = [('FORWARD', i) for i in range(M)] + [('BACKWARD', i) for i in range(M)]",
    "torch.cuda.synchronize()",
    "return schedule[::-1]",
  ],
  hints: [
    {
      line: 31,
      hint: "1F1B alternates 1 Backward pass with 1 Forward pass to immediately free activation tensors.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for 1F1B pipeline parallel execution scheduler function.",
    2: "Starts docstring detailing 1F1B scheduling purpose.",
    3: "Describes scheduling 1F1B (One Forward One Backward) pipeline micro-batch sequences.",
    4: "Notes reducing peak activation memory footprint from O(M) down to O(P).",
    5: "Blank line in docstring.",
    6: "Docstring section header for input arguments.",
    7: "Docstring describing num_stages parameter as pipeline GPU count P.",
    8: "Docstring describing num_microbatches parameter as total micro-batches M.",
    9: "Blank line in docstring.",
    10: "Docstring section header for return value.",
    11: "Docstring describing return format of scheduled step dictionaries.",
    12: "Closes docstring block.",
    13: "Validates positive stage count and positive micro-batch numbers.",
    14: "Returns empty list immediately if input arguments are invalid.",
    15: "Blank line before schedule list initialization.",
    16: "Initializes empty list to accumulate scheduled step objects.",
    17: "Calculates warmup steps count min(num_stages, num_microbatches).",
    18: "Blank line before Phase 1 Warmup loop.",
    19: "Comment documenting Phase 1 Warmup Phase (Forward passes only).",
    20: "For loop iterating over warmup micro-batches 0 to warmup_steps - 1.",
    21: "Appends dictionary payload for warmup FORWARD micro-batch pass.",
    22: "Sets step index field as current schedule length.",
    23: "Sets phase key to WARMUP.",
    24: "Sets type key to FORWARD.",
    25: "Sets microbatch_id key to current mb index.",
    26: "Closes warmup dictionary entry payload.",
    27: "Blank line before Phase 2 1F1B Steady-State loop.",
    28: "Comment documenting Phase 2 1F1B Steady-State Phase.",
    29: "Initializes fw_mb forward micro-batch pointer to warmup_steps.",
    30: "Initializes bw_mb backward micro-batch pointer to 0.",
    31: "While loop running steady-state 1F1B until all forward passes are scheduled.",
    32: "Appends dictionary payload for steady-state BACKWARD micro-batch pass.",
    33: "Sets step index field.",
    34: "Sets phase key to 1F1B_STEADY_STATE.",
    35: "Sets type key to BACKWARD.",
    36: "Sets microbatch_id key to current bw_mb index.",
    37: "Closes backward pass dictionary payload.",
    38: "Increments bw_mb pointer by 1.",
    39: "Blank line between backward and forward pass scheduling.",
    40: "Appends dictionary payload for steady-state FORWARD micro-batch pass.",
    41: "Sets step index field.",
    42: "Sets phase key to 1F1B_STEADY_STATE.",
    43: "Sets type key to FORWARD.",
    44: "Sets microbatch_id key to current fw_mb index.",
    45: "Closes forward pass dictionary payload.",
    46: "Increments fw_mb pointer by 1.",
    47: "Blank line before Phase 3 Cooldown loop.",
    48: "Comment documenting Phase 3 Cooldown Phase (Remaining Backward passes).",
    49: "While loop running cooldown phase until all backward passes are completed.",
    50: "Appends dictionary payload for cooldown BACKWARD micro-batch pass.",
    51: "Sets step index field.",
    52: "Sets phase key to COOLDOWN.",
    53: "Sets type key to BACKWARD.",
    54: "Sets microbatch_id key to current bw_mb index.",
    55: "Closes cooldown dictionary payload.",
    56: "Increments bw_mb pointer by 1.",
    57: "Blank line before returning schedule.",
    58: "Returns complete ordered list of 1F1B scheduled step dictionaries.",
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
      "Pipeline Parallelism (PP) partitions layers of a Large Language Model across $P$ pipeline stages. Naive scheduling (like GPipe) executes all $M$ forward micro-batches before any backward micro-batches, requiring VRAM to store peak activation tensors for all $M$ micro-batches ($O(M)$ memory scaling).\n\nThe **1F1B (One Forward, One Backward)** schedule (used in Megatron-LM and DeepSpeed) mitigates this memory bottleneck through a three-phase schedule:\n\n### Why It Exists & Problem Solved\nExecuting all forward passes first forces keeping intermediate activation tensors in VRAM until backward passes run. For large batch sizes (e.g. $M=64$ micro-batches), activation memory quickly causes Out-Of-Memory (OOM) crashes. 1F1B initiates backward passes as soon as the first micro-batch completes its forward pass through all stages. Executing a backward pass immediately computes gradients and frees peak activation memory, bounding activation VRAM capacity to $O(P)$ micro-batches regardless of global batch size $M$!\n\n### Step-by-Step Intuition\n1. **Phase 1: Warmup Phase**: Execute $P$ forward passes ($F_0, F_1, \\dots, F_{P-1}$) to fill the pipeline depth.\n2. **Phase 2: 1F1B Steady-State Phase**: Alternate 1 Backward pass with 1 Forward pass ($B_0, F_P, B_1, F_{P+1}, \\dots$). Each backward pass frees activation memory just before the next forward pass allocates memory.\n3. **Phase 3: Cooldown Phase**: Drain remaining backward passes ($B_{M-P}, \\dots, B_{M-1}$).\n\n### Trade-offs & Complexity\n- **Time Complexity**: $O(M)$ schedule construction step for $M$ micro-batches.\n- **Peak Activation Memory**: Bounded to $O(P)$ micro-batches instead of $O(M)$.\n- **Pipeline Bubble Overhead**: Idle GPU time fraction is $\\frac{P-1}{M}$. Setting $M \\ge 10P$ reduces bubble overhead below 10%.",
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
          heading: "Why It Exists & Problem Solved",
          body: "Naive pipeline parallel schedules (like GPipe) store activation tensors for all M micro-batches before executing backward passes. 1F1B solves this by initiating backward passes as soon as the first micro-batch completes its forward pass through all stages. Each completed backward pass frees activation VRAM, allowing the next forward pass to reuse freed memory.",
        },
        {
          heading: "Step-by-Step Intuition",
          body: "1. Phase 1 (Warmup): Run P forward passes to fill the pipeline depth.\n2. Phase 2 (Steady State): Alternate 1 Backward pass with 1 Forward pass. Running a backward pass frees activation memory right before the next forward pass allocates new memory.\n3. Phase 3 (Cooldown): Execute remaining backward passes to drain the pipeline.",
        },
        {
          heading: "Distributed Systems & Bandwidth Analysis",
          body: "1F1B bounds peak activation memory to O(P * layer_activations). This memory saving allows training multi-billion parameter models with batch sizes 10x larger than GPipe without triggering Out-Of-Memory (OOM) errors.",
        },
        {
          heading: "Hardware & Architecture Trade-offs",
          body: "The pipeline bubble fraction is given by (P-1)/M. To keep idle GPU time under 10%, global micro-batch count M must be at least 10 * P. Interleaved 1F1B (virtual pipeline stages) splits each physical GPU into v virtual stages, reducing bubble overhead down to (P-1)/(v * M).",
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

