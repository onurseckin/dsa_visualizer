import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

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

export const CONTINUOUS_BATCHING_SCHEDULER_CODE = `def continuous_batching_scheduler(
    requests: list[dict],
    max_batch_size: int,
    max_blocks: int
) -> list[dict]:
    step = 0
    waiting_queue = []
    active_batch = []
    completed = []
    used_blocks = 0
    
    unprocessed = sorted(requests, key=lambda r: r['arrivalStep'])
    
    while unprocessed or waiting_queue or active_batch:
        # 1. Admit new arrivals into waiting queue
        arrivals = [r for r in unprocessed if r['arrivalStep'] <= step]
        unprocessed = [r for r in unprocessed if r['arrivalStep'] > step]
        waiting_queue.extend(arrivals)
        
        # 2. Schedule waiting requests into active batch if slots & memory permit
        i = 0
        while i < len(waiting_queue) and len(active_batch) < max_batch_size:
            req = waiting_queue[i]
            needed_blocks = req['promptLen'] + req.get('generatedTokens', 0) + 1
            if used_blocks + needed_blocks <= max_blocks:
                req['state'] = 'prefill'
                req['generatedTokens'] = 0
                active_batch.append(req)
                used_blocks += needed_blocks
                waiting_queue.pop(i)
            else:
                i += 1
                
        # 3. Iteration forward pass (generate 1 token for active requests)
        for req in active_batch:
            if req['state'] == 'prefill':
                req['state'] = 'decode'
            req['generatedTokens'] += 1
            used_blocks += 1
            
        # 4. Evict finished requests instantly
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
    output: "Evicts finished requests step-by-step and immediately admits waiting items into freed batch slots",
    explanation: "Req-2 finishes at step 2, instantly freeing a batch slot for Req-3/4 without waiting for long Req-1 or Req-3 sequences.",
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
    explanation: "Requests are deferred in queue if total KV-cache blocks exceed maxMemoryBlocks capacity.",
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
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Invalid serving inputs" } },
      variables: {},
    });
    return steps;
  }

  const elements: ArrayElement[] = requests.map((r, idx) => ({
    id: r.id,
    value: idx,
    state: "default",
  }));

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
    activeBatch: activeBatch.map((r) => `${r.id}(${r.state}:${r.generatedTokens}/${r.maxTokens})`).join(", "),
    waitingQueue: waitingQueue.map((r) => r.id).join(", "),
    completed: completed.map((r) => r.id).join(", "),
    usedBlocks: `${usedBlocks}/${maxMemoryBlocks}`,
  });

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    vars: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => {
          const req = allReqs.find((r) => r.id === el.id);
          let state: ArrayElement["state"] = "default";
          if (req?.state === "prefill") state = "active";
          else if (req?.state === "decode") state = "queued";
          else if (req?.state === "finished") state = "sorted";

          return {
            ...el,
            state,
            pointers: req ? [`${req.state}:${req.generatedTokens}/${req.maxTokens}`] : undefined,
          };
        }),
      },
      auxiliaryState: {
        customState: snapshotState(),
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize Continuous Batching LLM Scheduler",
    `Configured vLLM/Orca iteration scheduler with max batch size ${maxBatchSize} and ${maxMemoryBlocks} KV-cache memory blocks.`,
    { maxBatchSize, maxMemoryBlocks, totalRequests: requests.length }
  );

  let unprocessed = [...allReqs].sort((a, b) => a.arrivalStep - b.arrivalStep);

  while ((unprocessed.length > 0 || waitingQueue.length > 0 || activeBatch.length > 0) && currentStep < 50) {
    // 1. Admit new arrivals
    const arrivals = unprocessed.filter((r) => r.arrivalStep <= currentStep);
    unprocessed = unprocessed.filter((r) => r.arrivalStep > currentStep);

    for (const arr of arrivals) {
      arr.state = "waiting";
      waitingQueue.push(arr);
    }

    // 2. Schedule waiting requests
    let i = 0;
    while (i < waitingQueue.length && activeBatch.length < maxBatchSize) {
      const req = waitingQueue[i];
      const neededBlocks = req.promptLen + req.generatedTokens + 1;

      if (usedBlocks + neededBlocks <= maxMemoryBlocks) {
        req.state = "prefill";
        activeBatch.push(req);
        usedBlocks += neededBlocks;
        waitingQueue.splice(i, 1);
      } else {
        i++;
      }
    }

    addStep(
      15,
      `Step Iteration #${currentStep}: Scheduling & Admission`,
      `Active batch running ${activeBatch.length}/${maxBatchSize} requests; ${waitingQueue.length} waiting in queue. Memory KV-blocks used: ${usedBlocks}/${maxMemoryBlocks}.`,
      { currentStep, activeCount: activeBatch.length, waitingCount: waitingQueue.length, usedBlocks }
    );

    // 3. Forward pass generation (1 token per active request)
    for (const req of activeBatch) {
      if (req.state === "prefill") {
        req.state = "decode";
      }
      req.generatedTokens += 1;
      usedBlocks += 1;
    }

    // 4. Evict finished requests
    const stillActive: InternalReq[] = [];
    for (const req of activeBatch) {
      if (req.generatedTokens >= req.maxTokens) {
        req.state = "finished";
        completed.push(req);
        const freed = req.promptLen + req.generatedTokens;
        usedBlocks = Math.max(0, usedBlocks - freed);
      } else {
        stillActive.push(req);
      }
    }
    activeBatch = stillActive;

    currentStep++;
  }

  addStep(
    30,
    "Continuous Batching Simulation Complete",
    `All ${completed.length} requests served with zero GPU batch padding bubble cycles.`,
    { totalCompleted: completed.length, totalIterations: currentStep }
  );

  return steps;
}

export const continuousBatchingScheduler: AlgorithmDefinition<ContinuousBatchingInput> = {
  id: "continuous-batching-scheduler",
  title: "Continuous Batching Iteration Scheduler",
  category: "ml_llm_serving",
  difficulty: "Hard",
  description:
    "Iteration-level dynamic batching scheduler (as in vLLM and Orca) that evicts completed sequences instantly and admits new requests at every token generation step to eliminate batch bubbles.",
  isMlInfra: true,
  mlInfraLevel: 10,
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
        heading: "Iteration-Level Scheduling",
        body: "Rather than holding batch slots until all requests complete, completed requests are evicted immediately after generating their EOS token, and waiting requests are admitted into the active batch for prefill.",
      },
      {
        heading: "KV-Cache Block Management",
        body: "PagedAttention manages Key/Value memory in fixed-size blocks (like OS virtual memory), allowing continuous batching schedulers to allocate and free KV memory dynamically without fragmentation.",
      },
    ],
    keyTerms: [
      {
        term: "Continuous Batching",
        definition: "Iteration-level scheduling that admits and evicts LLM serving requests at every token generation step.",
      },
      {
        term: "Batch Bubble",
        definition: "Idle GPU compute capacity wasted when static batching waits for uneven sequence lengths to finish.",
      },
      {
        term: "Prefill vs Decode",
        definition: "Initial parallel processing of prompt tokens vs step-by-step autoregressive single-token generation.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 10" }],
  defaultInput: DEFAULT_CONTINUOUS_BATCHING_INPUT,
  generateSteps: generateContinuousBatchingSteps,
};
