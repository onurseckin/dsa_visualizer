import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface iterationLevelContinuousBatchSchedulerInput {
  incoming_requests: number[];
  max_batch_size: number;
}

export const ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_CODE = `def iteration_level_continuous_batch_scheduler(incoming_requests, max_batch_size=2):
    queue = list(incoming_requests)
    active_batch = []
    iterations = 0
    batch_snapshots = []

    while queue or active_batch:
        while len(active_batch) < max_batch_size and queue:
            active_batch.append(queue.pop(0))

        if not active_batch:
            break

        batch_snapshots.append(list(active_batch))

        iterations += 1
        active_batch = [req - 1 for req in active_batch if req - 1 > 0]

    return iterations, batch_snapshots`;

export const DEFAULT_ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_INPUT: iterationLevelContinuousBatchSchedulerInput =
  {
    incoming_requests: [2, 5, 3],
    max_batch_size: 2,
  };

export const generateIterationLevelContinuousBatchSchedulerSteps = (
  input: iterationLevelContinuousBatchSchedulerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { incoming_requests, max_batch_size } = input;
  const queue = [...incoming_requests];
  let activeBatch: number[] = [];
  let iterations = 0;
  const batchSnapshots: number[][] = [];

  const getElements = (): ArrayElement[] => {
    const activeElements: ArrayElement[] = [];
    for (let i = 0; i < max_batch_size; i++) {
      if (i < activeBatch.length) {
        activeElements.push({
          id: `active-${i}`,
          value: `Batch Slot ${i + 1}: Req (${activeBatch[i]} tokens left)`,
          state: "active" as const,
          pointers: [`Slot ${i + 1}`],
        });
      } else {
        activeElements.push({
          id: `active-empty-${i}`,
          value: `Batch Slot ${i + 1}: [Empty Slot]`,
          state: "default" as const,
          pointers: [`Slot ${i + 1}`],
        });
      }
    }

    const queueElements: ArrayElement[] = queue.map((req, idx) => ({
      id: `queue-${idx}`,
      value: `Queue Pos ${idx + 1}: Req (${req} tokens)`,
      state: "default" as const,
      pointers: idx === 0 ? ["Queue Head"] : undefined,
    }));

    return [...activeElements, ...queueElements];
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: getElements(),
      },
      auxiliaryState: {
        customState: {
          max_batch_size: String(max_batch_size),
          active_batch: `[${activeBatch.join(", ")}]`,
          queue: `[${queue.join(", ")}]`,
          iterations: String(iterations),
        },
      },
      variables,
    });
  };

  // Line 1: Entry
  addStep(
    1,
    "Enter iteration_level_continuous_batch_scheduler function",
    "Initializing continuous batching scheduler with queued requests and max batch size capacity.",
    { max_batch_size, queue_length: queue.length },
  );

  // Line 2: init queue
  addStep(
    2,
    `Initialize queue = list(incoming_requests) -> [${queue.join(", ")}]`,
    "Converted incoming request stream into mutable scheduler queue.",
    { queue: queue.join(", ") },
  );

  // Line 3: init active_batch
  addStep(
    3,
    "Initialize active_batch = []",
    "Empty active batch array representing open GPU execution slots.",
    { active_batch: "[]" },
  );

  // Line 4: init iterations
  addStep(
    4,
    "Initialize iterations = 0",
    "Iteration step counter tracking GPU forward pass execution loops.",
    { iterations: 0 },
  );

  // Line 5: init batch_snapshots
  addStep(
    5,
    "Initialize batch_snapshots = []",
    "Array to store iteration-level batch state history.",
    { batch_snapshots: "[]" },
  );

  while (queue.length > 0 || activeBatch.length > 0) {
    addStep(
      7,
      `Check outer while loop condition: queue (${queue.length}) or active_batch (${activeBatch.length})`,
      "Continuing execution while queued or active requests remain.",
      { queue_len: queue.length, active_len: activeBatch.length },
    );

    // Inner loop check
    addStep(
      8,
      `Check admission while loop: len(active_batch)=${activeBatch.length} < max_batch_size=${max_batch_size} and queue (${queue.length})`,
      "Inspecting whether open slots exist in the active batch to admit waiting requests.",
      { active_len: activeBatch.length, max_batch_size, queue_len: queue.length },
    );

    while (activeBatch.length < max_batch_size && queue.length > 0) {
      const admittedReq = queue.shift()!;
      activeBatch.push(admittedReq);
      addStep(
        9,
        `Admit request (${admittedReq} tokens) from queue -> active_batch = [${activeBatch.join(", ")}]`,
        `Continuous batching immediately fills freed slot with request of length ${admittedReq} tokens without waiting for batch to empty.`,
        { admitted_request: admittedReq, active_batch: activeBatch.join(", ") },
      );
    }

    addStep(
      11,
      `Check if not active_batch (len = ${activeBatch.length})`,
      "Verifying active batch is non-empty before executing forward pass step.",
      { active_len: activeBatch.length },
    );

    if (activeBatch.length === 0) break;

    batchSnapshots.push([...activeBatch]);
    addStep(
      14,
      `Record snapshot for iteration ${iterations + 1}: [${activeBatch.join(", ")}]`,
      "Logged active sequence remaining token counts at iteration start.",
      { iteration: iterations + 1, snapshot: activeBatch.join(", ") },
    );

    iterations++;
    addStep(
      16,
      `Execute GPU forward pass step: iterations += 1 -> ${iterations}`,
      `Generated 1 output token for all ${activeBatch.length} active requests simultaneously.`,
      { iterations },
    );

    const prevBatch = [...activeBatch];
    activeBatch = activeBatch.map((req) => req - 1).filter((req) => req > 0);
    const evictedCount = prevBatch.length - activeBatch.length;
    addStep(
      17,
      `Decrement remaining lengths & evict finished requests -> active_batch = [${activeBatch.join(", ")}]`,
      evictedCount > 0
        ? `Evicted ${evictedCount} completed request(s) immediately! Releasing GPU slots and KV cache blocks.`
        : `Updated remaining token counts: [${activeBatch.join(", ")}].`,
      { active_batch: activeBatch.join(", "), evicted_count: evictedCount },
    );
  }

  // Final check loop exit
  addStep(
    7,
    "Outer loop terminates: queue is empty and active_batch is empty",
    "All incoming requests have completed token generation.",
    { iterations, queue_len: 0, active_len: 0 },
  );

  addStep(
    19,
    `Return (iterations=${iterations}, batch_snapshots=[${batchSnapshots.map((s) => `[${s.join(",")}]`).join(", ")}])`,
    `Completed continuous batching simulation in ${iterations} total iteration steps.`,
    { iterations, snapshot_count: batchSnapshots.length },
  );

  return steps;
};

const ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [6, 10, 13, 15, 18],
  distractors: [
    "active_batch = list(incoming_requests)",
    "while len(active_batch) == max_batch_size:",
    "iterations += max_batch_size",
    "active_batch = [req for req in active_batch]",
  ],
  hints: [
    { line: 8, hint: "Greedy admission loop checks if open slots exist in active_batch." },
    {
      line: 17,
      hint: "Iteration-level eviction removes requests with 0 remaining tokens immediately.",
    },
  ],
  lineExplanations: {
    1: "Function signature for Iteration-Level Continuous Batch Scheduler taking incoming_requests and max_batch_size.",
    2: "Initialize scheduler queue list from incoming request generation lengths.",
    3: "Initialize empty active_batch list representing open GPU execution slots.",
    4: "Initialize iteration step counter tracking GPU forward pass loops.",
    5: "Initialize list to log batch state snapshots at each iteration.",
    6: "Blank line before main scheduling loop.",
    7: "Loop while requests remain in queue or active batch slots.",
    8: "Check if active batch has open slots and queue contains waiting requests.",
    9: "Admit head request from queue into active batch immediately.",
    10: "Blank line before active batch non-empty check.",
    11: "Check if active batch is empty after admission attempts.",
    12: "Break loop if no active requests remain.",
    13: "Blank line before snapshot logging.",
    14: "Append copy of current active_batch request state to snapshots list.",
    15: "Blank line before execution step.",
    16: "Increment total iteration counter by 1.",
    17: "Decrement remaining token count for all active requests and immediately evict requests with 0 tokens left.",
    18: "Blank line before returning results.",
    19: "Return total iterations and batch snapshots history to caller.",
  },
};

export const iterationLevelContinuousBatchScheduler: AlgorithmDefinition<iterationLevelContinuousBatchSchedulerInput> =
  {
    id: "iteration-level-continuous-batch-scheduler",
    title: "Iteration-Level Continuous Batching Scheduler",
    topicIds: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Hard",
    description:
      "Continuous Batching (iteration-level scheduling, introduced in Orca and vLLM) evaluates request admission and eviction at the granularity of a single forward pass token generation step. In traditional static batching, an inference engine groups $N$ requests into a static batch and waits for the longest sequence to complete before discharging the batch. Short requests finish early but sit idle while wasting GPU memory bandwidth and SM execution cycles.\n\nIteration-Level Continuous Batching resolves this by inspecting batch state at every iteration: whenever a sequence reaches its end-of-sequence (EOS) token or length limit, it is evicted immediately, releasing its slot and KV-cache blocks. New waiting requests from the scheduler queue are admitted into the batch right away, keeping Tensor Core matrix shapes saturated across all steps.\n\n### Analytical Execution Model\nAt each iteration step $t$:\n1. **Eviction Pass**: Active requests with $0$ remaining tokens are removed.\n2. **Admission Pass**: While $|\\text{active\\_batch}| < B_{\\max}$ and queue is non-empty, admit queue head request.\n3. **Forward Pass**: Execute 1 token generation step across active requests: $req_i \\leftarrow req_i - 1$.\n\n### Input Parameters\n- `incoming_requests`: Array of integer generation lengths (tokens remaining) for queued requests.\n- `max_batch_size`: Maximum allowed parallel requests $B_{\\max}$ in active batch.\n\n### Output\n- Returns total iterations executed and batch state history snapshots.",
    constraints: ["1 <= max_batch_size <= 100", "0 <= incoming_requests.length <= 100"],
    examples: [
      {
        kind: "basic",
        title: "Batch Size 2 Continuous Injection",
        inputDisplay: "incoming_requests = [2, 5, 3], max_batch_size = 2",
        outputDisplay: "6 iterations",
        input: { incoming_requests: [2, 5, 3], max_batch_size: 2 },
        output: "6 iterations",
        explanation:
          "Iterations 1-2: [2, 5]. At iteration 3, req-1 (len 2) finishes; req-3 (len 3) is admitted immediately into slot. Runs to completion in 6 iterations.",
      },
      {
        kind: "complex",
        title: "High Concurrency Batch Capacity",
        inputDisplay: "incoming_requests = [10, 10, 10], max_batch_size = 4",
        outputDisplay: "10 iterations",
        input: { incoming_requests: [10, 10, 10], max_batch_size: 4 },
        output: "10 iterations",
        explanation:
          "All 3 requests admitted simultaneously in step 1 and complete in parallel after 10 iterations.",
      },
      {
        kind: "negative",
        title: "Empty Queue Input",
        inputDisplay: "incoming_requests = [], max_batch_size = 2",
        outputDisplay: "0 iterations",
        input: { incoming_requests: [], max_batch_size: 2 },
        output: "0 iterations",
        explanation: "No incoming requests, completes in 0 iterations.",
      },
    ],
    code: ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_CODE,
    timeComplexity: { best: "O(T)", average: "O(T)", worst: "O(T)" },
    spaceComplexity: "O(B)",
    complexityAnalysis: {
      time: "$O(T)$ where $T$ is total iteration steps executed. Processes up to $B_{\\max}$ active requests per step.",
      space: "$O(B_{\\max})$ auxiliary space for active batch request queue.",
    },
    topicGuide: {
      overview:
        "Continuous Batching (iteration-level scheduling) evaluates request admission and eviction at every token step, maximizing GPU utilization.",
      sections: [
        {
          heading: "Overview & Production Motivation",
          body: "Static batching in LLM serving suffers from severe waste due to sequence length variance. In a static batch of requests with lengths $[2, 5, 3]$, a batch size of 2 will process $[2, 5]$, finishing the first request in 2 steps, but leaving GPU slots idle for 3 steps while waiting for length 5 to finish. Continuous batching evicts finished requests and injects new requests at every iteration step.",
        },
        {
          heading: "Iteration Scheduler Algorithm",
          body: "The continuous batch scheduler maintains two primary structures: a Waiting Queue and an Active Batch array of capacity $B_{\\max}$. At step $t$, the scheduler:\n1. Evicts requests with 0 remaining tokens;\n2. Admits queue requests into freed slots;\n3. Executes 1 token forward pass across all active sequences.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "By keeping the active batch saturated at $B_{\\max}$ capacity, continuous batching increases system throughput by 10x-23x over static batching. DRAM memory reads for model parameters are amortized over larger batch matrix shapes in every iteration.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Key implementation challenges include dynamic KV-cache block allocation via PagedAttention, managing prefill-decode disaggregation within the same batch, avoiding queue starvation, and handling variable length prompt prefill chunks.",
        },
      ],
      keyTerms: [
        {
          term: "Continuous Batching",
          definition:
            "Dynamically admitting and evicting requests at single-token iteration granularity.",
        },
        {
          term: "Iteration-Level Scheduling",
          definition: "Evaluating scheduling decisions before every individual GPU forward pass.",
        },
        {
          term: "Static Batching Waste",
          definition:
            "Idle GPU capacity caused by holding open slots for completed requests until all batch requests finish.",
        },
        {
          term: "Slot Eviction",
          definition:
            "Immediately releasing GPU slot and KV-cache resources upon receiving an EOS token.",
        },
      ],
    },
    trivia: ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_INPUT,
    generateSteps: generateIterationLevelContinuousBatchSchedulerSteps,
  };

export default iterationLevelContinuousBatchScheduler;
