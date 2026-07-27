import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface chunkedPrefillTokenBudgetSchedulerInput {
  requests: Array<{ id: string; type: "prefill" | "decode"; remaining_tokens: number }>;
  max_token_budget: number;
  max_prefill_chunk: number;
}

export const CHUNKEDPREFILLTOKENBUDGETSCHEDULER_CODE = `def chunked_prefill_token_budget_scheduler(requests, max_token_budget=256, max_prefill_chunk=128):
    """
    Schedules an iteration budget under Chunked Prefill & Piggybacked Decoding constraints.
    Prioritizes decode requests (1 token each), then chunks prefill prompts to fill remaining budget.
    """
    scheduled_batch = []
    budget_remaining = max_token_budget

    # Phase 1: Allocate 1 token to each active decode request
    decodes = [r for r in requests if r['type'] == 'decode' and r['remaining_tokens'] > 0]
    for req in decodes:
        if budget_remaining >= 1:
            scheduled_batch.append({
                'id': req['id'],
                'type': 'decode',
                'allocated_tokens': 1
            })
            budget_remaining -= 1

    # Phase 2: Chunk prefill prompts using remaining token budget
    prefills = [r for r in requests if r['type'] == 'prefill' and r['remaining_tokens'] > 0]
    for req in prefills:
        if budget_remaining <= 0:
            break
        chunk = min(req['remaining_tokens'], max_prefill_chunk, budget_remaining)
        if chunk > 0:
            scheduled_batch.append({
                'id': req['id'],
                'type': 'prefill',
                'allocated_tokens': chunk
            })
            budget_remaining -= chunk

    return scheduled_batch, budget_remaining`;

export const DEFAULT_CHUNKEDPREFILLTOKENBUDGETSCHEDULER_INPUT: chunkedPrefillTokenBudgetSchedulerInput =
  {
    requests: [
      { id: "req-1", type: "decode", remaining_tokens: 1 },
      { id: "req-2", type: "decode", remaining_tokens: 1 },
      { id: "req-3", type: "decode", remaining_tokens: 1 },
      { id: "req-4", type: "prefill", remaining_tokens: 512 },
      { id: "req-5", type: "prefill", remaining_tokens: 256 },
      { id: "req-6", type: "prefill", remaining_tokens: 128 },
      { id: "req-7", type: "decode", remaining_tokens: 1 },
      { id: "req-8", type: "prefill", remaining_tokens: 64 },
    ],
    max_token_budget: 256,
    max_prefill_chunk: 128,
  };

function buildSchedulerMatrixSnapshot(
  requests: chunkedPrefillTokenBudgetSchedulerInput["requests"],
  allocations: Record<string, number>,
  activeId: string | null,
  budgetRemaining: number,
  phase: string,
): MatrixVisualSnapshot {
  const colHeaders = ["Req ID", "Type", "Remaining Tokens", "Allocated Tokens", "Status"];
  const rows = requests.length;
  const cells: MatrixCellItem[] = [];

  requests.forEach((req, r) => {
    let state: MatrixCellItem["state"] = "default";
    let statusText = "Queued";

    if (req.id === activeId) {
      state = "active";
      statusText = `Scheduling (${phase})`;
    } else if (allocations[req.id] !== undefined) {
      state = "sorted";
      statusText = `Scheduled (${allocations[req.id]}t)`;
    }

    cells.push(
      { row: r, col: 0, value: req.id, state },
      { row: r, col: 1, value: req.type.toUpperCase(), state },
      { row: r, col: 2, value: req.remaining_tokens, state },
      { row: r, col: 3, value: allocations[req.id] ?? 0, state },
      { row: r, col: 4, value: statusText, state },
    );
  });

  return {
    kind: "matrix",
    rows,
    cols: 5,
    colHeaders,
    cells,
    title: `Token Budget Allocation Matrix (Budget Remaining: ${budgetRemaining})`,
  };
}

export const generateChunkedPrefillTokenBudgetSchedulerSteps = (
  input: chunkedPrefillTokenBudgetSchedulerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const { requests, max_token_budget, max_prefill_chunk } = input;
  let budgetRemaining = max_token_budget;
  const allocations: Record<string, number> = {};

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeId: string | null,
    phase: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildSchedulerMatrixSnapshot(
        requests,
        allocations,
        activeId,
        budgetRemaining,
        phase,
      ),
      auxiliaryState: {
        customState: {
          max_token_budget: String(max_token_budget),
          max_prefill_chunk: String(max_prefill_chunk),
          budgetRemaining: String(budgetRemaining),
          phase,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Chunked Prefill Token Budget Scheduler",
    `Setting max_token_budget = ${max_token_budget}, max_prefill_chunk = ${max_prefill_chunk}. Processing ${requests.length} incoming requests.`,
    { max_token_budget, max_prefill_chunk, num_requests: requests.length },
    null,
    "Init",
  );

    addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Opening delimiter of the Python docstring.",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "Schedules an iteration budget under Chunked Prefill & Piggybacked Decoding ",
    {},
  );

  addStep(
    4,
    "Docstring body: algorithm description",
    "Prioritizes decode requests (1 token each), then chunks prefill prompts to ",
    {},
  );

addStep(
    5,
    "Initialize scheduled_batch List",
    "Creating container scheduled_batch to collect scheduled token allocations.",
    { budget_remaining: budgetRemaining },
    null,
    "Init",
  );

  addStep(
    6,
    `Initialize budget_remaining = ${budgetRemaining}`,
    "Setting remaining token budget counter.",
    { budget_remaining: budgetRemaining },
    null,
    "Init",
  );

  // Phase 1: Decodes
  const decodes = requests.filter((r) => r.type === "decode" && r.remaining_tokens > 0);

  addStep(
    9,
    `Phase 1 Filter: Found ${decodes.length} Active Decode Requests`,
    "Decode requests receive highest priority (1 token per step) to maintain tight time-per-output-token (TTPT) SLAs.",
    { num_decodes: decodes.length, budget_remaining: budgetRemaining },
    null,
    "Phase 1: Decode",
  );

  decodes.forEach((req) => {
    addStep(
      10,
      `Evaluate Decode Request '${req.id}'`,
      `Checking remaining budget (${budgetRemaining}) for decode request ${req.id}.`,
      { req_id: req.id, budget_remaining: budgetRemaining },
      req.id,
      "Phase 1: Decode",
    );

    if (budgetRemaining >= 1) {
      addStep(
        11,
        `Budget Check Passed for Decode '${req.id}'`,
        `Budget remaining (${budgetRemaining}) >= 1.`,
        { req_id: req.id, budget_remaining: budgetRemaining },
        req.id,
        "Phase 1: Decode",
      );

      allocations[req.id] = 1;
      budgetRemaining -= 1;

      addStep(
        13,
        `Allocate 1 Token to Decode Request '${req.id}'`,
        `Assigned 1 token slot to ${req.id}. Budget decremented to ${budgetRemaining}.`,
        { req_id: req.id, allocated: 1, budget_remaining: budgetRemaining },
        req.id,
        "Phase 1: Decode",
      );
    }
  });

  // Phase 2: Prefills
  const prefills = requests.filter((r) => r.type === "prefill" && r.remaining_tokens > 0);

  addStep(
    20,
    `Phase 2 Filter: Found ${prefills.length} Active Prefill Requests`,
    `Allocating remaining budget (${budgetRemaining} tokens) to compute-heavy prefill prompts in chunks capped at ${max_prefill_chunk}.`,
    { num_prefills: prefills.length, budget_remaining: budgetRemaining },
    null,
    "Phase 2: Prefill",
  );

  for (const req of prefills) {
    addStep(
      21,
      `Evaluate Prefill Request '${req.id}' (${req.remaining_tokens} tokens remaining)`,
      `Checking budget for prefill request ${req.id}. Budget remaining = ${budgetRemaining}.`,
      { req_id: req.id, remaining: req.remaining_tokens, budget_remaining: budgetRemaining },
      req.id,
      "Phase 2: Prefill",
    );

    if (budgetRemaining <= 0) {
      addStep(
        22,
        `Budget Exhausted (${budgetRemaining} <= 0)`,
        `Token budget fully exhausted. Deferring remaining prefill request '${req.id}' to next iteration.`,
        { req_id: req.id, budget_remaining: budgetRemaining },
        req.id,
        "Phase 2: Prefill",
      );
      break;
    }

    const chunk = Math.min(req.remaining_tokens, max_prefill_chunk, budgetRemaining);

    addStep(
      24,
      `Calculate Chunk Size for '${req.id}': ${chunk} Tokens`,
      `chunk = min(remaining=${req.remaining_tokens}, max_chunk=${max_prefill_chunk}, budget=${budgetRemaining}) = ${chunk}.`,
      { req_id: req.id, chunk, budget_remaining: budgetRemaining },
      req.id,
      "Phase 2: Prefill",
    );

    if (chunk > 0) {
      allocations[req.id] = chunk;
      budgetRemaining -= chunk;

      addStep(
        27,
        `Allocate ${chunk} Tokens to Prefill Request '${req.id}'`,
        `Assigned ${chunk} tokens to ${req.id}. Remaining budget is now ${budgetRemaining}.`,
        { req_id: req.id, allocated: chunk, budget_remaining: budgetRemaining },
        req.id,
        "Phase 2: Prefill",
      );
    }
  }

  addStep(
    33,
    "Execution Complete: Token Budget Scheduled",
    `Successfully scheduled token allocations across active decodes and chunked prefills. Total unallocated budget: ${budgetRemaining}.`,
    { complete: true, budget_remaining: budgetRemaining, scheduled_count: Object.keys(allocations).length },
    null,
    "Final",
  );

  return steps;
};

const CHUNKEDPREFILLTOKENBUDGETSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 7, 8, 18, 19, 32],
  distractors: [
    "chunk = req['remaining_tokens'] # allocating full prefill without budget limit",
    "budget_remaining += req['allocated_tokens']",
    "decodes.sort(key=lambda r: r['remaining_tokens'], reverse=True)",
    "budget_remaining = 0",
  ],
  hints: [
    { line: 9, hint: "Extract active decode requests taking strictly 1 token each." },
    { line: 24, hint: "Calculate chunk = min(remaining_tokens, max_prefill_chunk, budget_remaining)." },
    { line: 33, hint: "Return scheduled_batch list and remaining unallocated token budget." },
  ],
  lineExplanations: {
    1: "Function signature defining chunked_prefill_token_budget_scheduler with requests and budget constraints.",
    2: "Docstring start describing Chunked Prefill & Piggybacked Decoding scheduling logic.",
    3: "Explains priority scheduling for decode requests and budget chunking for prefill prompts.",
    4: "Docstring end.",
    5: "Initializes scheduled_batch list to hold assigned request allocations for current GPU iteration.",
    6: "Initializes budget_remaining counter to total iteration token budget max_token_budget.",
    7: "Blank line before Phase 1.",
    8: "Comment indicating Phase 1: Allocate 1 token to each active decode request.",
    9: "Filters requests list to extract active decode requests with remaining_tokens > 0.",
    10: "Iterates through active decode requests in decodes list.",
    11: "Checks if remaining token budget is at least 1 token.",
    12: "Opens dictionary payload for scheduled decode request.",
    13: "Assigns request identifier.",
    14: "Sets request type to decode.",
    15: "Allocates exactly 1 token slot for current iteration step.",
    16: "Closes request dictionary payload.",
    17: "Decrements budget_remaining by 1 allocated decode token.",
    18: "Blank line before Phase 2.",
    19: "Comment indicating Phase 2: Chunk prefill prompts using remaining token budget.",
    20: "Filters requests list to extract active prefill prompts with remaining_tokens > 0.",
    21: "Iterates through active prefill requests in prefills list.",
    22: "Checks if remaining token budget budget_remaining is less than or equal to 0.",
    23: "Breaks loop immediately if token budget is completely exhausted.",
    24: "Calculates chunk size as min(remaining_tokens, max_prefill_chunk, budget_remaining).",
    25: "Checks if calculated chunk size is greater than 0.",
    26: "Opens dictionary payload for scheduled prefill request.",
    27: "Assigns prefill request identifier.",
    28: "Sets request type to prefill.",
    29: "Assigns calculated chunk size to allocated_tokens.",
    30: "Closes prefill request dictionary payload.",
    31: "Decrements budget_remaining by allocated chunk size.",
    32: "Blank line before final return.",
    33: "Returns tuple of scheduled_batch allocations and budget_remaining count.",
    34: "Returns tuple of scheduled_batch allocations and budget_remaining count.",
  },
};

export const chunkedPrefillTokenBudgetScheduler: AlgorithmDefinition<chunkedPrefillTokenBudgetSchedulerInput> =
  {
    id: "chunked-prefill-token-budget-scheduler",
    title: "Chunked Prefill Token Budget Scheduler",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "Chunked Prefill (introduced in Sarathi, vLLM, and Orca) disaggregates and schedules long prompt prefills by splitting them into fixed token chunks across multiple serving iterations. Standard LLM serving suffers from severe prefill bubbles: prefill requests are compute-bound (FLOP intensive) while decode requests are memory-bandwidth bound (transferring large KV-cache tensors for a single token). Mixing un-chunked 4k+ token prefills with single-token decodes causes severe decode latency spikes and degrades tail response times (p99 latency).\n\nThe Chunked Prefill Token Budget Scheduler resolves this by enforcing a strict total token budget B_max per iteration. Decodes are granted top priority (1 token slot each to maintain low inter-token latency), and the remaining token budget B_rem = B_max - N_decode is allocated to prefill requests, capped at a maximum prefill chunk size B_chunk. This aligns GPU compute and memory bandwidth utilization across every iteration step.\n\nInput Format:\n- requests: Array of request objects containing request ID, type ('prefill' or 'decode'), and remaining tokens.\n- max_token_budget: Total integer token count budget allocated per GPU iteration step B_max.\n- max_prefill_chunk: Maximum integer token chunk allowed for any single prefill prompt B_chunk.\n\nOutput Format:\n- Returns a tuple of scheduled batch request objects with assigned allocated_tokens and the remaining unallocated token budget.\n\nEdge Cases & Constraints:\n- Zero budget remaining: If decode requests consume the entire token budget B_max, prefill requests are deferred to subsequent iterations.\n- Single token remaining: Prefill chunks naturally reduce to 1 token when nearing prompt completion.\n- Budget underflow protection: Ensures total allocated tokens strictly satisfy sum(allocated) <= B_max.",
    constraints: [
      "1 <= max_token_budget <= 16384",
      "1 <= max_prefill_chunk <= max_token_budget",
      "0 <= requests.length <= 512",
    ],
    examples: [
      {
        kind: "basic",
        title: "Piggybacked Decode and Prefill Chunking",
        inputDisplay:
          "requests = [4 decodes, 4 prefills (512, 256, 128, 64)], B_max=256, B_chunk=128",
        outputDisplay: "Scheduled 4 decodes (4t) + 2 prefill chunks (252t), Budget Remaining: 0",
        input: DEFAULT_CHUNKEDPREFILLTOKENBUDGETSCHEDULER_INPUT,
        output: "Scheduled 6 requests, 0 remaining budget",
        explanation:
          "Decode reqs take 4 tokens. Remaining budget 252 is allocated to chunk prefills req-4 (128t) and req-5 (124t).",
      },
      {
        kind: "complex",
        title: "Budget Exhaustion by Multiple Decodes",
        inputDisplay: "requests = 4 decodes + 1 prefill(256), B_max=4, B_chunk=128",
        outputDisplay: "Scheduled: 4 decodes, Prefill Deferred, Budget Remaining: 0",
        input: {
          requests: [
            { id: "req-1", type: "decode", remaining_tokens: 1 },
            { id: "req-2", type: "decode", remaining_tokens: 1 },
            { id: "req-3", type: "decode", remaining_tokens: 1 },
            { id: "req-4", type: "decode", remaining_tokens: 1 },
            { id: "req-5", type: "prefill", remaining_tokens: 256 },
          ],
          max_token_budget: 4,
          max_prefill_chunk: 128,
        },
        output: "Scheduled 4 decodes, 0 remaining budget",
        explanation:
          "Decodes consume all 4 budget slots. Prefill req-5 receives 0 tokens and is deferred.",
      },
    ],
    code: CHUNKEDPREFILLTOKENBUDGETSCHEDULER_CODE,
    timeComplexity: { best: "O(R)", average: "O(R)", worst: "O(R)" },
    spaceComplexity: "O(R)",
    complexityAnalysis: {
      time: "Linear time pass O(R) over active request list R to categorize and allocate token slots.",
      space: "O(R) memory allocation to construct scheduled batch metadata structures.",
    },
    topicGuide: {
      overview:
        "Chunked Prefill disaggregates long prompt prefills by splitting compute-heavy prompts into token budget chunks, enabling piggybacked decoding without latency spikes.",
      sections: [
        {
          heading: "Why It Exists",
          body: "LLM serving engines (vLLM, TensorRT-LLM, TGI) handle two types of requests: prefill requests (processing input prompt tokens) and decode requests (generating output tokens autoregressively). Un-chunked long prefills occupy the GPU for hundreds of milliseconds, causing inter-token latency spikes for streaming decode users.",
        },
        {
          heading: "What It Solves",
          body: "Chunked Prefill enforces a total token budget B_max per iteration. By giving decodes top priority (1 token each) and chunking prefills into remaining budget slots, engines maintain low p99 inter-token latency while ensuring high GPU Tensor Core utilization.",
        },
        {
          heading: "Step-by-Step Intuition",
          body: "The scheduler executes two phases: Phase 1 iterates through active decode requests and allocates 1 token to each, decrementing the budget. Phase 2 takes the remaining budget B_rem and chunks prefill requests up to B_chunk = min(remaining, max_chunk, B_rem) until the budget reaches zero.",
        },
        {
          heading: "Trade-offs & Systems Impact",
          body: "Chunking prefills increases total prefill completion time slightly for a single request, but dramatically improves system throughput and streaming response consistency under heavy multi-user loads.",
        },
        {
          heading: "Complexity & Scalability",
          body: "The scheduler operates in linear O(R) time over active requests R, requiring O(R) space for scheduled batch metadata.",
        },
      ],
      keyTerms: [
        {
          term: "Chunked Prefill",
          definition:
            "Technique of splitting long prompt token sequences into budget-capped chunks across iterations.",
        },
        {
          term: "Piggybacked Decoding",
          definition:
            "Co-scheduling single-token decode requests alongside chunked prefill prompt matrices in the same batch.",
        },
        {
          term: "Token Budget (B_max)",
          definition:
            "Maximum total token capacity allocated across all requests in a single GPU forward pass.",
        },
        {
          term: "Inter-Token Latency (TTPT)",
          definition:
            "Time elapsed between emitting consecutive output tokens in streaming LLM inference.",
        },
      ],
    },
    trivia: CHUNKEDPREFILLTOKENBUDGETSCHEDULER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_CHUNKEDPREFILLTOKENBUDGETSCHEDULER_INPUT,
    generateSteps: generateChunkedPrefillTokenBudgetSchedulerSteps,
  };
