import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface iterationLevelContinuousBatchSchedulerInput {
  incoming_requests: number[];
  max_batch_size: number;
}

export const ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_CODE = `def continuous_batching(incoming_requests: list[int], max_batch_size: int) -> int:
    # Simulates Iteration-Level Continuous Batching (Orca).
    # Instead of waiting for the longest request in a batch to finish,
    # we inject new requests into the batch at each token iteration.
    
    active_batch = []
    total_iterations = 0
    request_queue = incoming_requests.copy()
    
    while request_queue or active_batch:
        # 1. Admit new requests if there is batch capacity
        while len(active_batch) < max_batch_size and request_queue:
            active_batch.append(request_queue.pop(0))
            
        # 2. Simulate one token iteration for all active requests
        total_iterations += 1
        active_batch = [req - 1 for req in active_batch if req - 1 > 0]
        
    return total_iterations
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

  let requestQueue = [...input.incoming_requests];
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
      9,
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
        11,
        "Admit requests to batch",
        "Continuous batching doesn't wait for the batch to empty. We fill empty slots immediately.",
        { total_iterations: totalIterations },
        getElements(),
      );
    }

    totalIterations++;
    activeBatch = activeBatch.map((req) => req - 1).filter((req) => req > 0);

    addStep(
      15,
      "Simulate forward pass",
      "Generated one token for all active requests.",
      { total_iterations: totalIterations },
      getElements(),
    );
  }

  addStep(
    18,
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
  hints: [{ line: 11, hint: "Continuous batching admits new requests at the iteration level." }],
  lineExplanations: {
    6: "Initialize the state variables.",
    11: "Greedily admit waiting requests until the batch size is hit.",
    15: "Process one token for all requests simultaneously.",
    18: "Return total steps taken.",
  },
};

export const iterationLevelContinuousBatchScheduler: AlgorithmDefinition<iterationLevelContinuousBatchSchedulerInput> =
  {
    id: "iteration-level-continuous-batch-scheduler",
    title: "Iteration-Level Continuous Batching",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "arrays_and_hashing"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "Simulates iteration-level continuous batching (Orca), injecting requests dynamically instead of waiting for full batch completion.",
    constraints: ["1 <= max_batch_size <= 100", "0 <= requests.length <= 100"],
    examples: [
      {
        kind: "basic",
        title: "Batch Size 2",
        inputDisplay: "requests = [2, 5, 3], max_batch_size = 2",
        outputDisplay: "6",
        input: { incoming_requests: [2, 5, 3], max_batch_size: 2 },
        output: "6 iterations",
        explanation:
          "Iteration 1-2: [2, 5]. Iteration 3: [5, 3]. Iteration 4-5: [5, 3]. Iteration 6: [5]. Total 6 steps.",
      },
      {
        kind: "complex",
        title: "Large Batch Capacity",
        inputDisplay: "requests = [10, 10, 10], max_batch_size = 4",
        outputDisplay: "10",
        input: { incoming_requests: [10, 10, 10], max_batch_size: 4 },
        output: "10 iterations",
        explanation:
          "All are admitted immediately. They run in parallel and finish in 10 iterations.",
      },
      {
        kind: "negative",
        title: "Empty Queue",
        inputDisplay: "requests = [], max_batch_size = 2",
        outputDisplay: "0",
        input: { incoming_requests: [], max_batch_size: 2 },
        output: "0 iterations",
        explanation: "No requests, completes in 0 iterations.",
      },
    ],
    code: ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_CODE,
    timeComplexity: { best: "O(T)", average: "O(T)", worst: "O(T)" },
    spaceComplexity: "O(B)",
    complexityAnalysis: {
      time: "O(T) where T is the maximum number of iterations. We process a max of B requests per step.",
      space: "O(B) auxiliary space for the active batch array.",
    },
    topicGuide: {
      overview:
        "Continuous Batching (or iteration-level scheduling) evaluates requests at the granularity of a single token generation step, rather than waiting for an entire batch to finish.",
      sections: [
        {
          heading: "Static vs Continuous",
          body: "In static batching, if requests are of length 2, 5, and 3, a batch of size 2 will process [2, 5] taking 5 steps, leaving one GPU idle for 3 steps. Continuous batching evicts the finished request and injects the request of length 3 at step 3.",
        },
        {
          heading: "Throughput Gains",
          body: "This dramatically increases GPU utilization and throughput in LLM serving, at the cost of slightly more complex scheduler state.",
        },
      ],
      keyTerms: [
        {
          term: "Continuous Batching",
          definition: "Dynamically injecting and evicting requests at the iteration level.",
        },
        { term: "Iteration", definition: "A single forward pass yielding one token." },
      ],
    },
    trivia: ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_INPUT,
    generateSteps: generateIterationLevelContinuousBatchSchedulerSteps,
  };
