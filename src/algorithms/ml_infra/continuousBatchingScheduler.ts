import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  ProblemExample,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ServingRequest {
  id: string;
  promptLen: number;
  maxTokens: number;
  arrivalStep: number;
}

export interface ContinuousBatchingInput {
  maxBatchSize: number;
  maxMemoryBlocks: number;
  requests: ServingRequest[];
}

export const CONTINUOUS_BATCHING_SCHEDULER_CODE = `def continuous_batching_scheduler(requests, max_batch_size, max_blocks):
    step = 0
    waiting_queue = []
    active_batch = []
    completed = []
    used_blocks = 0
    unprocessed = sorted(requests, key=lambda r: r['arrivalStep'])
    while unprocessed or waiting_queue or active_batch:
        arrivals = [r for r in unprocessed if r['arrivalStep'] <= step]
        unprocessed = [r for r in unprocessed if r['arrivalStep'] > step]
        waiting_queue.extend(arrivals)
        i = 0
        while i < len(waiting_queue) and len(active_batch) < max_batch_size:
            req = waiting_queue[i]
            needed_blocks = req['promptLen'] + req.get('generatedTokens', 0) + 1
            if used_blocks + needed_blocks <= max_blocks:
                req['state'] = 'prefill'
                req['generatedTokens'] = 0
                active_batch.append(req)
                used_blocks += req['promptLen']
                waiting_queue.pop(i)
            else:
                i += 1
        for req in active_batch:
            if req['state'] == 'prefill':
                req['state'] = 'decode'
            req['generatedTokens'] += 1
            used_blocks += 1
        still_active = []
        for req in active_batch:
            if req['generatedTokens'] >= req['maxTokens']:
                req['state'] = 'finished'
                completed.append(req)
                freed = req['promptLen'] + req['generatedTokens']
                used_blocks -= freed
            else:
                still_active.append(req)
        active_batch = still_active
        step += 1
    return completed`;

export const DEFAULT_CONTINUOUS_BATCHING_INPUT: ContinuousBatchingInput = {
  maxBatchSize: 3,
  maxMemoryBlocks: 16,
  requests: [
    { id: "req-1", promptLen: 3, maxTokens: 4, arrivalStep: 0 },
    { id: "req-2", promptLen: 2, maxTokens: 2, arrivalStep: 0 },
    { id: "req-3", promptLen: 4, maxTokens: 5, arrivalStep: 1 },
    { id: "req-4", promptLen: 1, maxTokens: 3, arrivalStep: 2 },
  ],
};

export const CONTINUOUS_BATCHING_EXAMPLES: ProblemExample<ContinuousBatchingInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "Dynamic Iteration Scheduling (4 Requests, Batch Size 3)",
    input: {
      maxBatchSize: 3,
      maxMemoryBlocks: 16,
      requests: [
        { id: "req-1", promptLen: 3, maxTokens: 4, arrivalStep: 0 },
        { id: "req-2", promptLen: 2, maxTokens: 2, arrivalStep: 0 },
        { id: "req-3", promptLen: 4, maxTokens: 5, arrivalStep: 1 },
        { id: "req-4", promptLen: 1, maxTokens: 3, arrivalStep: 2 },
      ],
    },
    output:
      "Evicts finished requests step-by-step and immediately admits waiting items into freed batch slots",
    explanation:
      "Req-2 finishes at step 2, instantly freeing a batch slot for Req-3/4 without waiting for long Req-1 or Req-3 sequences.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "High-Traffic Continuous Batching with Memory Constraints",
    input: {
      maxBatchSize: 2,
      maxMemoryBlocks: 12,
      requests: [
        { id: "req-A", promptLen: 4, maxTokens: 3, arrivalStep: 0 },
        { id: "req-B", promptLen: 5, maxTokens: 2, arrivalStep: 0 },
        { id: "req-C", promptLen: 2, maxTokens: 4, arrivalStep: 1 },
        { id: "req-D", promptLen: 3, maxTokens: 2, arrivalStep: 2 },
      ],
    },
    output: "Schedules requests subject to GPU KV-cache memory block limits",
    explanation:
      "Requests are deferred in queue if total KV-cache blocks exceed maxMemoryBlocks capacity.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "Single Request Instant Serving",
    input: {
      maxBatchSize: 2,
      maxMemoryBlocks: 10,
      requests: [{ id: "req-single", promptLen: 2, maxTokens: 2, arrivalStep: 0 }],
    },
    output: "Completes in 2 iteration steps",
    explanation: "Minimal iteration scheduling loop for a single serving request.",
  },
];

interface InternalReq {
  id: string;
  promptLen: number;
  maxTokens: number;
  arrivalStep: number;
  state: "waiting" | "prefill" | "decode" | "finished";
  generatedTokens: number;
}

export function generateContinuousBatchingSteps(input: ContinuousBatchingInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { maxBatchSize, maxMemoryBlocks, requests } = input;

  if (!requests || requests.length === 0 || maxBatchSize <= 0 || maxMemoryBlocks <= 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid Scheduler Configuration",
        why: "Requests array, batch size, and memory blocks must be valid and positive.",
      },
      primarySnapshot: {
        kind: "matrix",
        rows: 1,
        cols: 5,
        rowHeaders: ["Error"],
        colHeaders: ["State", "Prompt Len", "Gen/Max", "KV Blocks", "Arrival"],
        title: "LLM Serving Continuous Batching Matrix",
        cells: [
          { row: 0, col: 0, value: "Invalid", state: "inactive" },
          { row: 0, col: 1, value: 0, state: "inactive" },
          { row: 0, col: 2, value: "0/0", state: "inactive" },
          { row: 0, col: 3, value: 0, state: "inactive" },
          { row: 0, col: 4, value: 0, state: "inactive" },
        ],
      },
      auxiliaryState: { customState: { error: "Invalid serving inputs" } },
      variables: {},
    });
    return steps;
  }

  const allReqs: InternalReq[] = requests.map((r) => ({
    ...r,
    state: "waiting",
    generatedTokens: 0,
  }));

  let currentStep = 0;
  let waitingQueue: InternalReq[] = [];
  let activeBatch: InternalReq[] = [];
  const completed: InternalReq[] = [];
  let usedBlocks = 0;

  const snapshotState = () => ({
    activeBatch: activeBatch
      .map((r) => `${r.id}(${r.state}:${r.generatedTokens}/${r.maxTokens})`)
      .join(", "),
    waitingQueue: waitingQueue.map((r) => r.id).join(", "),
    completed: completed.map((r) => r.id).join(", "),
    usedBlocks: `${usedBlocks}/${maxMemoryBlocks}`,
  });

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    vars: Record<string, string | number | boolean>,
  ) => {
    const cells: MatrixCellItem[] = [];
    allReqs.forEach((req, rIdx) => {
      let cellState: MatrixCellItem["state"] = "default";
      if (req.state === "prefill") cellState = "pivot";
      else if (req.state === "decode") cellState = "active";
      else if (req.state === "finished") cellState = "sorted";
      else if (req.state === "waiting") cellState = "inactive";

      const blocksNeeded =
        req.state === "waiting" || req.state === "finished"
          ? 0
          : req.promptLen + req.generatedTokens;

      cells.push({ row: rIdx, col: 0, value: req.state, state: cellState });
      cells.push({ row: rIdx, col: 1, value: req.promptLen, state: cellState });
      cells.push({
        row: rIdx,
        col: 2,
        value: `${req.generatedTokens}/${req.maxTokens}`,
        state: cellState,
      });
      cells.push({ row: rIdx, col: 3, value: blocksNeeded, state: cellState });
      cells.push({ row: rIdx, col: 4, value: req.arrivalStep, state: cellState });
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: allReqs.length,
        cols: 5,
        rowHeaders: allReqs.map((r) => r.id),
        colHeaders: ["State", "Prompt Len", "Gen/Max", "KV Blocks", "Arrival"],
        title: "LLM Serving Continuous Batching Matrix",
        cells,
      },
      auxiliaryState: {
        customState: snapshotState(),
      },
      variables: vars,
    });
  };

  // Line 1: def continuous_batching_scheduler
  addStep(
    1,
    "Initialize Continuous Batching LLM Scheduler Engine",
    `Configured vLLM/Orca iteration scheduler with max batch size ${maxBatchSize} and ${maxMemoryBlocks} KV-cache memory blocks.`,
    { maxBatchSize, maxMemoryBlocks, totalRequests: requests.length },
  );

  // Line 2: step = 0
  addStep(
    2,
    "Set Initial Step Counter `step = 0`",
    "Setting iteration step counter to 0 prior to admitting request arrivals.",
    { step: 0 },
  );

  // Line 3: waiting_queue = []
  addStep(
    3,
    "Allocate Empty waiting_queue List `waiting_queue = []`",
    "Initializing empty waiting queue to buffer arriving serving requests.",
    { queueSize: 0 },
  );

  // Line 4: active_batch = []
  addStep(
    4,
    "Allocate Empty active_batch List `active_batch = []`",
    "Initializing empty active batch array for concurrent token generation passes.",
    { activeSize: 0 },
  );

  // Line 5: completed = []
  addStep(
    5,
    "Allocate Empty completed List `completed = []`",
    "Initializing empty list to record served requests upon EOS/maxTokens termination.",
    { completedSize: 0 },
  );

  // Line 6: used_blocks = 0
  addStep(
    6,
    "Initialize KV-Cache Memory Tracker `used_blocks = 0`",
    "Setting active KV-cache block count used_blocks = 0.",
    { usedBlocks: 0, maxMemoryBlocks },
  );

  // Line 7: unprocessed = sorted(requests)
  let unprocessed = [...allReqs].sort((a, b) => a.arrivalStep - b.arrivalStep);
  addStep(
    7,
    "Sort Requests by Arrival Step",
    `Sorted ${unprocessed.length} requests by arrivalStep timestamp for temporal sequence scheduling.`,
    { unprocessedCount: unprocessed.length },
  );

  // Line 8: while loop
  while (
    (unprocessed.length > 0 || waitingQueue.length > 0 || activeBatch.length > 0) &&
    currentStep < 50
  ) {
    addStep(
      8,
      `Iterate Step #${currentStep}: Check Scheduler Loop Condition`,
      `Scheduler loop check at step #${currentStep}: ${unprocessed.length} unprocessed, ${waitingQueue.length} waiting, ${activeBatch.length} active.`,
      {
        currentStep,
        unprocessed: unprocessed.length,
        waiting: waitingQueue.length,
        active: activeBatch.length,
      },
    );

    // Line 9: arrivals = [r for r in unprocessed if r['arrivalStep'] <= step]
    const arrivals = unprocessed.filter((r) => r.arrivalStep <= currentStep);

    addStep(
      9,
      `Step #${currentStep}: Check New Arrivals (arrivalStep <= ${currentStep})`,
      `Identified ${arrivals.length} new request arrival(s) at step #${currentStep}: [${arrivals.map((r) => r.id).join(", ")}].`,
      { currentStep, newArrivals: arrivals.length },
    );

    // Line 10: unprocessed = [r for r in unprocessed if r['arrivalStep'] > step]
    unprocessed = unprocessed.filter((r) => r.arrivalStep > currentStep);

    addStep(
      10,
      `Step #${currentStep}: Retain Future Unprocessed Arrivals`,
      `Retained ${unprocessed.length} future request(s) in unprocessed buffer.`,
      { currentStep, futureUnprocessed: unprocessed.length },
    );

    // Line 11: waiting_queue.extend(arrivals)
    for (const arr of arrivals) {
      arr.state = "waiting";
      waitingQueue.push(arr);
    }

    addStep(
      11,
      `Step #${currentStep}: Extend Waiting Queue with Arrivals`,
      `Admitted ${arrivals.length} arrival(s) into waiting_queue. Total waiting: ${waitingQueue.length}.`,
      { currentStep, waitingQueueSize: waitingQueue.length },
    );

    // Line 12: i = 0
    let i = 0;
    addStep(
      12,
      `Step #${currentStep}: Reset Waiting Queue Index Pointer i = 0`,
      "Setting queue iteration pointer i = 0 for batch admission check.",
      { i: 0 },
    );

    // Line 13: while i < len(waiting_queue) and len(active_batch) < max_batch_size
    while (i < waitingQueue.length && activeBatch.length < maxBatchSize) {
      const req = waitingQueue[i];
      const neededBlocks = req.promptLen + req.generatedTokens + 1;

      addStep(
        13,
        `Step #${currentStep}: Check Admission for Request ${req.id} (Queue Slot i=${i})`,
        `Inspecting candidate request ${req.id}: needs ${neededBlocks} KV blocks (prompt=${req.promptLen}, gen=${req.generatedTokens}). Batch size ${activeBatch.length}/${maxBatchSize}.`,
        {
          currentStep,
          i,
          reqId: req.id,
          neededBlocks,
          activeBatchSize: activeBatch.length,
          maxBatchSize,
        },
      );

      // Line 16: if used_blocks + needed_blocks <= max_blocks
      if (usedBlocks + neededBlocks <= maxMemoryBlocks) {
        req.state = "prefill";
        activeBatch.push(req);
        usedBlocks += req.promptLen;
        waitingQueue.splice(i, 1);

        addStep(
          17,
          `Step #${currentStep}: Admit ${req.id} to Active Batch (State -> 'prefill')`,
          `Admitted ${req.id} into active batch in 'prefill' state. Allocated ${req.promptLen} prompt KV-cache blocks. Total memory: ${usedBlocks}/${maxMemoryBlocks}.`,
          { currentStep, reqId: req.id, state: "prefill", usedBlocks, maxMemoryBlocks },
        );
      } else {
        i++;
        addStep(
          23,
          `Step #${currentStep}: Memory Limit Exceeded for ${req.id} (Defer to Queue)`,
          `Insufficient KV-cache memory blocks (${usedBlocks} + ${neededBlocks} > ${maxMemoryBlocks}). Deferred ${req.id} in waiting queue.`,
          { currentStep, reqId: req.id, usedBlocks, neededBlocks, maxMemoryBlocks },
        );
      }
    }

    // Line 24: for req in active_batch
    addStep(
      24,
      `Step #${currentStep}: Execute Iteration Forward Pass for ${activeBatch.length} Active Request(s)`,
      `Generating 1 token for each of the ${activeBatch.length} active batch request(s).`,
      { currentStep, activeCount: activeBatch.length },
    );

    for (const req of activeBatch) {
      if (req.state === "prefill") {
        req.state = "decode";
        addStep(
          26,
          `Step #${currentStep}: Transition ${req.id} Prefill -> Decode Phase`,
          `Prefill phase completed for ${req.id}. Transitioned to iterative autoregressive 'decode' phase.`,
          { currentStep, reqId: req.id, state: "decode" },
        );
      }
      req.generatedTokens += 1;
      usedBlocks += 1;

      addStep(
        27,
        `Step #${currentStep}: Generate Token #${req.generatedTokens}/${req.maxTokens} for ${req.id}`,
        `Generated token #${req.generatedTokens}/${req.maxTokens} for ${req.id}. Allocated 1 KV-cache block (used: ${usedBlocks}/${maxMemoryBlocks}).`,
        {
          currentStep,
          reqId: req.id,
          generatedTokens: req.generatedTokens,
          maxTokens: req.maxTokens,
          usedBlocks,
        },
      );
    }

    // Line 30: Evict finished requests
    addStep(
      30,
      `Step #${currentStep}: Evict Completed Requests from Active Batch`,
      "Inspecting active requests to immediately evict sequences that reached maxTokens.",
      { currentStep, activeCount: activeBatch.length },
    );

    const stillActive: InternalReq[] = [];
    for (const req of activeBatch) {
      if (req.generatedTokens >= req.maxTokens) {
        req.state = "finished";
        completed.push(req);
        const freed = req.promptLen + req.generatedTokens;
        usedBlocks = Math.max(0, usedBlocks - freed);

        addStep(
          32,
          `Step #${currentStep}: Evict Finished Request ${req.id} (Freed ${freed} KV Blocks)`,
          `Request ${req.id} generated ${req.generatedTokens}/${req.maxTokens} tokens and finished. Freed ${freed} KV-cache blocks. Memory: ${usedBlocks}/${maxMemoryBlocks}.`,
          { currentStep, reqId: req.id, state: "finished", freedBlocks: freed, usedBlocks },
        );
      } else {
        stillActive.push(req);
      }
    }
    activeBatch = stillActive;

    currentStep++;
  }

  // Line 40: return completed
  addStep(
    40,
    "Continuous Batching Simulation Complete",
    `All ${completed.length} requests served across ${currentStep} iteration steps with zero GPU batch padding bubbles.`,
    { totalCompleted: completed.length, totalIterations: currentStep },
  );

  return steps;
}

export const CONTINUOUS_BATCHING_SCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "waiting_queue = sorted(requests)",
    "active_batch.clear() after every step",
    "used_blocks = max_blocks * len(active_batch)",
    "return waiting_queue",
  ],
  hints: [
    {
      line: 8,
      hint: "Main iteration loop runs while unprocessed items, waiting queue, or active batch exist.",
    },
    {
      line: 13,
      hint: "Admit waiting requests into active batch if batch size and KV memory permit.",
    },
    {
      line: 24,
      hint: "Generate 1 token for each active request during GPU iteration forward pass.",
    },
    {
      line: 31,
      hint: "Evict finished requests instantly upon reaching maxTokens and free KV memory blocks.",
    },
  ],
  lineExplanations: {
    1: "Declares function signature continuous_batching_scheduler accepting requests list, max_batch_size, and max_blocks.",
    2: "Initializes iteration step counter step = 0.",
    3: "Initializes empty waiting queue waiting_queue = [] for arriving serving requests.",
    4: "Initializes empty active batch array active_batch = [] for requests executing GPU forward passes.",
    5: "Initializes completed requests tracker list completed = [].",
    6: "Initializes used KV-cache memory block counter used_blocks = 0.",
    7: "Sorts input requests by arrivalStep timestamp to process incoming request streams in order.",
    8: "Main scheduler loop running while unprocessed requests, waiting queue, or active batch exist.",
    9: "Filters unprocessed requests arriving at or before current iteration step: arrivalStep <= step.",
    10: "Updates unprocessed requests list to retain only future arrivals: arrivalStep > step.",
    11: "Appends newly arrived requests to waiting_queue.",
    12: "Initializes waiting queue index pointer i = 0.",
    13: "Inner loop admitting waiting requests while queue items exist and active_batch size < max_batch_size.",
    14: "Inspects candidate waiting request req = waiting_queue[i].",
    15: "Calculates required KV-cache memory blocks: promptLen + generatedTokens + 1.",
    16: "Checks if total memory used_blocks + needed_blocks <= max_blocks capacity limit.",
    17: "Sets request state to 'prefill' for initial prompt processing pass.",
    18: "Initializes generatedTokens counter to 0.",
    19: "Appends admitted request to active_batch.",
    20: "Allocates needed memory blocks into used_blocks total.",
    21: "Pops admitted request from waiting_queue.",
    22: "Else branch executed if insufficient memory blocks are available.",
    23: "Increments waiting queue index i to inspect next request.",
    24: "Loops through active requests in active_batch for 1-token generation iteration pass.",
    25: "Checks if request is in 'prefill' state.",
    26: "Transitions request state from 'prefill' to 'decode'.",
    27: "Increments generatedTokens counter by 1 token.",
    28: "Allocates 1 KV-cache block for newly generated token KV entry.",
    29: "Initializes empty list still_active to filter continuing requests.",
    30: "Loops through active_batch to inspect request completion status.",
    31: "Checks if generatedTokens >= maxTokens completion limit.",
    32: "Sets request state to 'finished'.",
    33: "Appends finished request to completed results list.",
    34: "Calculates freed KV-cache memory blocks: promptLen + generatedTokens.",
    35: "Frees memory blocks: used_blocks -= freed.",
    36: "Else branch executed if request has not yet generated maxTokens.",
    37: "Appends still active request to still_active list.",
    38: "Updates active_batch = still_active to evict completed sequences instantly.",
    39: "Increments iteration step counter step += 1.",
    40: "Returns completed list of served requests with generation metrics.",
  },
};

export const continuousBatchingScheduler: AlgorithmDefinition<ContinuousBatchingInput> = {
  id: "continuous-batching-scheduler",
  title: "Continuous Batching Iteration Scheduler",
  topicIds: ["ml_llm_serving"],
  difficulty: "Hard",
  description: `### Continuous Batching Iteration Scheduler

Continuous Batching (Yu et al., 2022 — Orca, vLLM) is the core iteration-level scheduling paradigm for high-throughput Large Language Model (LLM) serving systems.

#### Why It Exists & What It Solves
In traditional static request-level batching, a batch of $B$ requests executes together until the **longest sequence** finishes generating all its tokens. Short sequences finish early but sit idle as "batch bubbles" while the GPU waits for the longest request. 

Continuous batching operates at **iteration-level granularity**: after every single token generation step, finished sequences are evicted instantly, and waiting requests are admitted into freed batch slots during the same forward pass iteration.

#### Prefill vs Decode Iteration Fusing
1. **Prefill Phase**: Initial forward pass over prompt tokens $L_{\\text{prompt}}$. Computes initial KV-cache matrices in parallel:
   $$\\text{Prefill Compute}: \\mathcal{O}(L_{\\text{prompt}}^2)$$
2. **Decode Phase**: Step-by-step autoregressive generation of 1 token using cached KV keys/values:
   $$\\text{Decode Compute}: \\mathcal{O}(1 \\cdot L_{\\text{seq}})$$
3. **Chunked Prefill / Continuous Admission**: Admits new request prefills into active decode batches without interrupting running sequence generation.

#### GPU KV-Cache Memory Allocation
Total KV-cache memory requirement per request $r$ with prompt length $L_{\\text{prompt}}$ and generated tokens $L_{\\text{gen}}$:
$$\\text{KV\\_Memory}(r) = 2 \\cdot n_{\\text{layers}} \\cdot n_{\\text{heads}} \\cdot d_{\\text{head}} \\cdot (L_{\\text{prompt}} + L_{\\text{gen}})$$

Schedulers track available memory blocks (PagedAttention) to prevent GPU Out-Of-Memory (OOM) preemptions during peak throughput traffic.

#### Throughput & Efficiency
$$\\text{GPU Batch Bubble Ratio} = 1 - \\frac{\\sum_{i=1}^B L_{\\text{gen}, i}}{B \\cdot \\max_{i} L_{\\text{gen}, i}} \\quad \\xrightarrow{\\text{Continuous Batching}} \\quad \\approx 0$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(T \\cdot B)$ scheduling check across $T$ generation iterations and active batch size $B$.
- **Space Complexity**: $\\mathcal{O}(B \\cdot L)$ memory for KV-cache blocks allocated across active sequences.
- **Trade-Off**: Increases LLM serving throughput by $2\\times - 4\\times$ and reduces time-to-first-token (TTFT) latency at the cost of managing dynamic KV-cache block allocation.`,
  constraints: [
    "Max batch size > 0",
    "Max KV-cache memory blocks > 0",
    "Request prompt length and max tokens > 0",
  ],
  examples: CONTINUOUS_BATCHING_EXAMPLES,
  code: CONTINUOUS_BATCHING_SCHEDULER_CODE,
  timeComplexity: {
    best: "O(T * B)",
    average: "O(T * B)",
    worst: "O(T * B)",
  },
  spaceComplexity: "O(B * (Prompt + GenTokens))",
  complexityAnalysis: {
    time: "O(T * B) scheduling check where T is total generation steps and B is active batch size.",
    space: "Requires O(B * L) memory blocks for KV-cache allocation across active sequences.",
  },
  topicGuide: {
    overview:
      "Continuous Batching (Orca / vLLM) fundamentally changes LLM serving from static request-level batching to iteration-level batching. Because different requests require different generation lengths, static batching leaves GPU cores idle waiting for the longest sequence. Continuous batching schedules at the granularity of individual forward pass iterations.",
    sections: [
      {
        heading: "Core Concept & Iteration-Level Scheduling",
        body: "Rather than holding batch slots until all requests complete, completed requests are evicted immediately after generating their EOS token, and waiting requests are admitted into the active batch for prefill.",
      },
      {
        heading: "Practical Applications in Production LLM Serving",
        body: "vLLM, TensorRT-LLM, TGI (Text Generation Inference), and SGLang implement continuous batching to maximize H100/A100 GPU tensor core utilization.",
      },
      {
        heading: "Implementation Details & KV-Cache Block Allocation",
        body: "PagedAttention manages Key/Value memory in fixed-size blocks (like OS virtual memory), allowing continuous batching schedulers to allocate and free KV memory dynamically without fragmentation.",
      },
      {
        heading: "Edge Case Analysis & Memory Preemption",
        body: "When total KV-cache blocks approach GPU memory limit max_blocks, the scheduler defers new prefill admissions or preempts/swaps low-priority decode requests to host CPU RAM.",
      },
    ],
    keyTerms: [
      {
        term: "Continuous Batching",
        definition:
          "Iteration-level scheduling that admits and evicts LLM serving requests at every token generation step.",
      },
      {
        term: "Batch Bubble",
        definition:
          "Idle GPU compute capacity wasted when static batching waits for uneven sequence lengths to finish.",
      },
      {
        term: "Prefill vs Decode",
        definition:
          "Initial parallel processing of prompt tokens vs step-by-step autoregressive single-token generation.",
      },
    ],
  },
  trivia: CONTINUOUS_BATCHING_SCHEDULER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 10" }],
  defaultInput: DEFAULT_CONTINUOUS_BATCHING_INPUT,
  generateSteps: generateContinuousBatchingSteps,
};
