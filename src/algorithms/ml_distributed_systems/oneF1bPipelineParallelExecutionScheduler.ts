import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface oneF1bPipelineParallelExecutionSchedulerInput {
  data: number[];
  target?: number;
}

export const ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_CODE = `def one_f1b_pipeline_parallel_execution_scheduler(num_stages: int, num_microbatches: int) -> list[dict]:
    if num_stages <= 0 or num_microbatches <= 0:
        return []

    schedule = []
    warmup_steps = min(num_stages, num_microbatches)

    for mb in range(warmup_steps):
        schedule.append({
            "step": len(schedule),
            "phase": "WARMUP",
            "type": "FORWARD",
            "microbatch_id": mb
        })

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
  const totalScheduleSteps = 2 * numMicrobatches;
  const totalCols = totalScheduleSteps + numStages - 1;

  interface ScheduleItem {
    step: number;
    phase: string;
    type: "FORWARD" | "BACKWARD";
    microbatch_id: number;
  }

  const scheduleList: ScheduleItem[] = [];

  const buildMatrixCells = (currentStepIdx?: number): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < numStages; r++) {
      for (let c = 0; c < totalCols; c++) {
        const itemIdx = c - r;
        let val = "-";
        let state: MatrixCellItem["state"] = "default";

        if (itemIdx >= 0 && itemIdx < scheduleList.length) {
          const item = scheduleList[itemIdx];
          const passAbbr = item.type === "FORWARD" ? "F" : "B";
          val = `${passAbbr}${item.microbatch_id}`;

          if (itemIdx === currentStepIdx) {
            state = "active";
          } else if (itemIdx < currentStepIdx!) {
            state = item.type === "FORWARD" ? "compared" : "sorted";
          }
        } else if (itemIdx >= 0 && itemIdx < totalScheduleSteps) {
          val = "...";
          state = "default";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: `Stage ${r} Slot T${c}`,
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
        cols: totalCols,
        rowHeaders: Array.from({ length: numStages }, (_, r) => `Stage ${r}`),
        colHeaders: Array.from({ length: totalCols }, (_, c) => `T${c}`),
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
    2,
    "Validate Pipeline Stages & Micro-batches",
    `Checking if num_stages (${numStages}) <= 0 or num_microbatches (${numMicrobatches}) <= 0. Validation passed.`,
    { num_stages: numStages, num_microbatches: numMicrobatches, valid: true },
  );

  // Step 3: Initialize schedule container
  addStep(
    5,
    "Initialize Schedule Array",
    "Created empty schedule list to record ordered 1F1B execution step descriptors.",
    { schedule_length: 0 },
  );

  // Step 4: Warmup steps formula
  const warmupSteps = Math.min(numStages, numMicrobatches);
  addStep(
    6,
    "Compute Warmup Steps Count",
    `warmup_steps = min(${numStages}, ${numMicrobatches}) = ${warmupSteps} forward pass steps.`,
    { warmup_steps: warmupSteps },
  );

  // Phase 1: Warmup loop
  addStep(
    8,
    "Phase 1: Begin Warmup Phase (Forward Passes Only)",
    `Executing ${warmupSteps} initial forward passes to fill pipeline depth and establish steady-state flow.`,
    { phase: "WARMUP", warmup_steps: warmupSteps },
  );

  for (let mb = 0; mb < warmupSteps; mb++) {
    addStep(
      8,
      `Warmup Phase: Loop Header (Micro-batch ${mb})`,
      `Evaluating warmup loop boundary for microbatch_id = ${mb} < warmup_steps = ${warmupSteps}.`,
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
      9,
      `Warmup Step ${mb + 1}/${warmupSteps}: Append FORWARD Micro-batch ${mb}`,
      `Scheduled Forward pass for micro-batch ${mb} (activation VRAM allocated).`,
      { step: item.step, phase: item.phase, type: item.type, microbatch_id: mb },
    );
  }

  // Phase 2: Steady State setup
  addStep(
    16,
    "Phase 2: Begin 1F1B Steady-State Phase (Interleaved 1 Forward, 1 Backward)",
    "Pointers fw_mb and bw_mb established. Alternating 1 Backward pass with 1 Forward pass to keep activation VRAM bounded.",
    { phase: "1F1B_STEADY_STATE", fw_mb: warmupSteps, bw_mb: 0 },
  );

  let fwMb = warmupSteps;
  let bwMb = 0;

  addStep(16, "Initialize Steady-State Forward Pointer", `Set fw_mb = warmup_steps = ${fwMb}.`, {
    fw_mb: fwMb,
  });

  addStep(17, "Initialize Steady-State Backward Pointer", "Set bw_mb = 0.", { bw_mb: 0 });

  while (fwMb < numMicrobatches) {
    addStep(
      18,
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
      19,
      `1F1B Steady-State: Schedule BACKWARD Pass for Micro-batch ${bwMb}`,
      `Scheduled Backward pass for micro-batch ${bwMb} (gradient computed & activation VRAM freed).`,
      { step: bwItem.step, phase: bwItem.phase, type: bwItem.type, microbatch_id: bwMb },
    );

    bwMb++;
    addStep(
      25,
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
      27,
      `1F1B Steady-State: Schedule FORWARD Pass for Micro-batch ${fwMb}`,
      `Scheduled Forward pass for micro-batch ${fwMb} (reusing VRAM memory freed by backward pass).`,
      { step: fwItem.step, phase: fwItem.phase, type: fwItem.type, microbatch_id: fwMb },
    );

    fwMb++;
    addStep(
      33,
      `Increment Forward Micro-batch Pointer -> fw_mb = ${fwMb}`,
      `Updated fw_mb = ${fwMb}.`,
      { fw_mb: fwMb },
    );
  }

  // Phase 3: Cooldown Phase
  addStep(
    35,
    "Phase 3: Begin Cooldown Phase (Draining Remaining Backward Passes)",
    `Forward passes complete. Draining remaining backward micro-batches (${bwMb} to ${numMicrobatches - 1}).`,
    { phase: "COOLDOWN", remaining_backward: numMicrobatches - bwMb },
  );

  while (bwMb < numMicrobatches) {
    addStep(
      35,
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
      36,
      `Cooldown Step: Schedule BACKWARD Pass for Micro-batch ${bwMb}`,
      `Scheduled final Backward pass for micro-batch ${bwMb}.`,
      { step: bwItem.step, phase: bwItem.phase, type: bwItem.type, microbatch_id: bwMb },
    );

    bwMb++;
    addStep(42, `Increment Backward Pointer -> bw_mb = ${bwMb}`, `Updated bw_mb = ${bwMb}.`, {
      bw_mb: bwMb,
    });
  }

  // Verification step
  const bubbleFraction = ((numStages - 1) / numMicrobatches).toFixed(3);
  addStep(
    44,
    "Verify Bounded Activation VRAM & Pipeline Bubble Overhead",
    `Verified 1F1B schedule bounds peak activation VRAM to O(${numStages}) micro-batches with pipeline bubble fraction of ${bubbleFraction}.`,
    {
      num_stages: numStages,
      num_microbatches: numMicrobatches,
      bubble_fraction: parseFloat(bubbleFraction),
    },
  );

  // Return step
  addStep(
    44,
    "Return Ordered 1F1B Execution Schedule",
    `Returning completed 1F1B pipeline schedule containing ${scheduleList.length} micro-batch execution steps.`,
    { completed: true, schedule_length: scheduleList.length },
  );

  return steps;
};

const ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [4, 7, 15, 26, 34, 43],
  distractors: [
    "schedule = [('FORWARD', i) for i in range(M)] + [('BACKWARD', i) for i in range(M)]",
    "torch.cuda.synchronize()",
    "return schedule[::-1]",
  ],
  hints: [
    {
      line: 18,
      hint: "1F1B alternates 1 Backward pass with 1 Forward pass to immediately free activation tensors.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for 1F1B pipeline parallel execution scheduler function.",
    2: "Validates that num_stages and num_microbatches are both positive integers.",
    3: "Returns an empty schedule list if input validation fails.",
    4: "Blank line following input validation.",
    5: "Initializes an empty list 'schedule' to store ordered step descriptors.",
    6: "Calculates warmup steps count as min(num_stages, num_microbatches).",
    7: "Blank line preceding Phase 1 Warmup loop.",
    8: "Iterates through micro-batches 0 to warmup_steps - 1 for Phase 1 Warmup.",
    9: "Appends dictionary payload for warmup FORWARD micro-batch pass.",
    10: "Sets step index field to current schedule length.",
    11: "Sets phase attribute to WARMUP.",
    12: "Sets execution pass type to FORWARD.",
    13: "Sets microbatch_id attribute to current mb index.",
    14: "Closes warmup dictionary entry payload.",
    15: "Blank line preceding Phase 2 1F1B Steady-State loop.",
    16: "Initializes fw_mb forward micro-batch pointer to warmup_steps.",
    17: "Initializes bw_mb backward micro-batch pointer to 0.",
    18: "While loop executing steady-state 1F1B while fw_mb < num_microbatches.",
    19: "Appends dictionary payload for steady-state BACKWARD micro-batch pass.",
    20: "Sets step index field to current schedule length.",
    21: "Sets phase attribute to 1F1B_STEADY_STATE.",
    22: "Sets execution pass type to BACKWARD.",
    23: "Sets microbatch_id attribute to current bw_mb index.",
    24: "Closes steady-state backward pass dictionary payload.",
    25: "Increments backward micro-batch pointer bw_mb by 1.",
    26: "Blank line between steady-state backward and forward pass scheduling.",
    27: "Appends dictionary payload for steady-state FORWARD micro-batch pass.",
    28: "Sets step index field to current schedule length.",
    29: "Sets phase attribute to 1F1B_STEADY_STATE.",
    30: "Sets execution pass type to FORWARD.",
    31: "Sets microbatch_id attribute to current fw_mb index.",
    32: "Closes steady-state forward pass dictionary payload.",
    33: "Increments forward micro-batch pointer fw_mb by 1.",
    34: "Blank line preceding Phase 3 Cooldown loop.",
    35: "While loop executing Phase 3 Cooldown until all backward passes finish.",
    36: "Appends dictionary payload for cooldown BACKWARD micro-batch pass.",
    37: "Sets step index field to current schedule length.",
    38: "Sets phase attribute to COOLDOWN.",
    39: "Sets execution pass type to BACKWARD.",
    40: "Sets microbatch_id attribute to current bw_mb index.",
    41: "Closes cooldown backward pass dictionary payload.",
    42: "Increments backward micro-batch pointer bw_mb by 1.",
    43: "Blank line before returning schedule.",
    44: "Returns complete ordered list of 1F1B scheduled step descriptors.",
  },
};

export const oneF1bPipelineParallelExecutionScheduler: AlgorithmDefinition<oneF1bPipelineParallelExecutionSchedulerInput> =
  {
    id: "one-f1b-pipeline-parallel-execution-scheduler",
    title: "1F1B (One Forward One Backward) Pipeline Parallel Scheduler",
    topicIds: ["ml_distributed_systems", "ml_tensor_algebra"],
    difficulty: "Hard",
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
