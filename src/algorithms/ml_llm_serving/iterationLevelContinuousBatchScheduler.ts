import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface iterationLevelContinuousBatchSchedulerInput {
  incoming_requests: number[];
  max_batch_size: number;
}

export const ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_CODE = `
def iteration_level_continuous_batch_scheduler(incoming_requests, max_batch_size=2):
    """
    Simulates iteration-level continuous batching (Orca / vLLM).
    At every token generation step (iteration), completed requests are evicted immediately,
    and waiting requests from the queue are admitted into open batch slots.
    """
    queue = list(incoming_requests)
    active_batch = []
    iterations = 0
    batch_snapshots = []

    while queue or active_batch:
        # Admit waiting requests from queue until max_batch_size capacity is reached
        while len(active_batch) < max_batch_size and queue:
            active_batch.append(queue.pop(0))

        if not active_batch:
            break

        # Log active batch state at iteration start
        batch_snapshots.append(list(active_batch))

        # Perform 1 token generation step (decrement remaining length for all active requests)
        iterations += 1
        active_batch = [req - 1 for req in active_batch if req - 1 > 0]

    return iterations, batch_snapshots
`;

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

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: customElements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          max_batch_size: String(input.max_batch_size),
        },
      },
      variables,
    });
  };

  const requestQueue = [...input.incoming_requests];
  let activeBatch: number[] = [];
  let totalIterations = 0;

  const getElements = (): ArrayElement[] => {
    return [
      ...activeBatch.map((req, idx) => ({
        id: `active-${idx}`,
        value: `Req (${req} left)`,
        state: "active" as const,
      })),
      ...requestQueue.map((req, idx) => ({
        id: `queue-${idx}`,
        value: `Wait (${req})`,
        state: "default" as const,
      })),
    ];
  };

  addStep(
    6,
    "Initialize Continuous Batching",
    "Prepare the queue of incoming requests.",
    { total_iterations: totalIterations },
    getElements(),
  );

  while (requestQueue.length > 0 || activeBatch.length > 0) {
    addStep(
      11,
      "Check active requests and queue",
      "If there's work left, start a new iteration.",
      { total_iterations: totalIterations },
      getElements(),
    );

    let admitted = false;
    while (activeBatch.length < input.max_batch_size && requestQueue.length > 0) {
      activeBatch.push(requestQueue.shift()!);
      admitted = true;
    }

    if (admitted) {
      addStep(
        14,
        "Admit requests to batch",
        "Continuous batching doesn't wait for the batch to empty. We fill empty slots immediately.",
        { total_iterations: totalIterations },
        getElements(),
      );
    }

    totalIterations++;
    activeBatch = activeBatch.map((req) => req - 1).filter((req) => req > 0);

    addStep(
      23,
      "Simulate forward pass",
      "Generated one token for all active requests.",
      { total_iterations: totalIterations },
      getElements(),
    );
  }

  addStep(
    26,
    "Batching Complete",
    "All requests finished generating tokens.",
    { total_iterations: totalIterations },
    getElements(),
  );

  return steps;
};

const ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4],
  distractors: [
    "while request_queue: active_batch.append(request_queue.pop(0))",
    "active_batch = []",
  ],
  hints: [{ line: 14, hint: "Continuous batching admits new requests at the iteration level." }],
  lineExplanations: {
    6: "Initialize the state variables.",
    14: "Greedily admit waiting requests until max_batch_size capacity is hit.",
    23: "Process one token for all active requests simultaneously.",
    26: "Return total steps taken.",
  },
};

export const iterationLevelContinuousBatchScheduler: AlgorithmDefinition<iterationLevelContinuousBatchSchedulerInput> =
  {
    id: "iteration-level-continuous-batch-scheduler",
    title: "Iteration-Level Continuous Batching",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "Continuous Batching (iteration-level scheduling, as introduced in Orca and vLLM) evaluates request admission and eviction at the granularity of a single forward pass token generation step. In traditional static batching, an inference engine groups N requests into a static batch and waits for the longest sequence to complete before discharging the batch. Short requests finish early but sit idle while wasting GPU memory bandwidth and SM execution cycles.\n\nIteration-Level Continuous Batching resolves this by inspecting batch state at every iteration: whenever a sequence reaches its end-of-sequence (EOS) token or length limit, it is evicted immediately, releasing its slot and KV-cache blocks. New waiting requests from the scheduler queue are admitted into the batch right away, keeping Tensor Core matrix shapes saturated across all steps.\n\nInput Format:\n- incoming_requests: Array of integer generation lengths (tokens remaining) for queued requests.\n- max_batch_size: Maximum allowed parallel requests in active batch.\n\nOutput Format:\n- Returns total iterations executed and batch state history snapshots.\n\nEdge Cases & Constraints:\n- Empty initial queue: Returns 0 iterations immediately.\n- Uniform generation lengths: Degenerates into static batch behavior when all sequences have identical lengths.",
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
      time: "O(T) where T is the total iteration steps executed. Processes up to B active requests per step.",
      space: "O(B) auxiliary space for the active batch request queue.",
    },
    topicGuide: {
      overview:
        "Continuous Batching (iteration-level scheduling) evaluates request admission and eviction at every token step, maximizing GPU utilization.",
      sections: [
        {
          heading: "Overview",
          body: "Static batching in LLM serving suffers from Severe Waste due to sequence length variance. In a static batch of requests with lengths [2, 5, 3], a batch size of 2 will process [2, 5], finishing the first request in 2 steps, but leaving GPU slots idle for 3 steps while waiting for length 5 to finish. Continuous batching evicts finished requests and injects new requests at every iteration step.",
        },
        {
          heading: "Core Concepts",
          body: "The continuous batch scheduler maintains two primary structures: a Waiting Queue and an Active Batch array of capacity max_batch_size. At step t, the scheduler (1) evicts requests with 0 remaining tokens; (2) admits queue requests into freed slots; (3) executes 1 token forward pass across all active sequences.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "By keeping the active batch saturated at max_batch_size capacity, continuous batching increases system throughput by 10x-23x over static batching. DRAM memory reads for model parameters are amortized over larger batch matrix shapes in every iteration.",
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
