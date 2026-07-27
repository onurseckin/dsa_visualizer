import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface chunkedPrefillTokenBudgetSchedulerInput {
  requests: Array<{ id: string; type: "prefill" | "decode"; remaining_tokens: number }>;
  max_token_budget: number;
  max_prefill_chunk: number;
}

export const CHUNKEDPREFILLTOKENBUDGETSCHEDULER_CODE = `
def chunked_prefill_token_budget_scheduler(requests, max_token_budget=256, max_prefill_chunk=128):
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

    return scheduled_batch, budget_remaining
`;

export const DEFAULT_CHUNKEDPREFILLTOKENBUDGETSCHEDULER_INPUT: chunkedPrefillTokenBudgetSchedulerInput =
  {
    requests: [
      { id: "req-1", type: "decode", remaining_tokens: 1 },
      { id: "req-2", type: "decode", remaining_tokens: 1 },
      { id: "req-3", type: "prefill", remaining_tokens: 512 },
      { id: "req-4", type: "prefill", remaining_tokens: 128 },
    ],
    max_token_budget: 256,
    max_prefill_chunk: 128,
  };

export const generateChunkedPrefillTokenBudgetSchedulerSteps = (
  input: chunkedPrefillTokenBudgetSchedulerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.requests.map((req, idx) => ({
    id: `req-${idx}`,
    value: `${req.id} (${req.type.toUpperCase()}:${req.remaining_tokens}t)`,
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
          max_token_budget: String(input.max_token_budget),
          max_prefill_chunk: String(input.max_prefill_chunk),
          total_requests: String(input.requests.length),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Chunked Prefill Token Budget Scheduler",
    "Setting up request queue, total token budget B_max, and maximum prefill chunk size B_chunk.",
    {
      num_requests: input.requests.length,
      max_token_budget: input.max_token_budget,
      max_prefill_chunk: input.max_prefill_chunk,
    },
  );

  let budgetRemaining = input.max_token_budget;
  const currentElements = elements.map((el) => ({ ...el }));

  // Phase 1: Decodes
  addStep(
    11,
    "Filter Decode Requests",
    "Decode requests are memory-bandwidth bound and take strictly 1 token per iteration to minimize latency degradation.",
    { budget_remaining: budgetRemaining },
  );

  input.requests.forEach((req, idx) => {
    if (req.type === "decode" && req.remaining_tokens > 0) {
      if (budgetRemaining >= 1) {
        budgetRemaining -= 1;
        currentElements[idx] = {
          ...currentElements[idx],
          state: "active",
          pointers: [`allocated=1`, `rem_budget=${budgetRemaining}`],
        };
        addStep(
          13,
          `Allocate 1 token to decode request ${req.id}`,
          "Allocated 1 token slot for active decode request. Token budget decremented by 1.",
          { req_id: req.id, allocated: 1, budget_remaining: budgetRemaining },
          currentElements,
        );
      }
    }
  });

  // Phase 2: Prefills
  addStep(
    20,
    "Process Chunked Prefill Requests",
    "Chunk long prompt prefills using remaining token budget B_rem and max chunk limit B_chunk.",
    { budget_remaining: budgetRemaining },
  );

  input.requests.forEach((req, idx) => {
    if (req.type === "prefill" && req.remaining_tokens > 0 && budgetRemaining > 0) {
      const chunk = Math.min(req.remaining_tokens, input.max_prefill_chunk, budgetRemaining);
      if (chunk > 0) {
        budgetRemaining -= chunk;
        currentElements[idx] = {
          ...currentElements[idx],
          state: "visited",
          pointers: [`chunk=${chunk}`, `rem_budget=${budgetRemaining}`],
        };
        addStep(
          24,
          `Chunk prefill request ${req.id}: allocate ${chunk} tokens`,
          `Splitting prefill prompt into chunk of ${chunk} tokens. Remaining budget is now ${budgetRemaining}.`,
          { req_id: req.id, chunk_size: chunk, budget_remaining: budgetRemaining },
          currentElements,
        );
      }
    }
  });

  const finalElements: ArrayElement[] = currentElements.map((el) => ({
    ...el,
    state: el.state === "default" ? "default" : "sorted",
  }));

  addStep(
    28,
    "Execution Complete",
    "Successfully scheduled token budget across active decode and chunked prefill requests.",
    { budget_remaining: budgetRemaining, scheduled_count: finalElements.length },
    finalElements,
  );

  return steps;
};

const CHUNKEDPREFILLTOKENBUDGETSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "chunk = req['remaining_tokens'] # allocating full prefill without budget limit",
    "budget_remaining += req['allocated_tokens']",
    "decodes.sort(key=lambda r: r['remaining_tokens'], reverse=True)",
  ],
  hints: [
    { line: 24, hint: "Chunk prefill prompt to min(remaining_tokens, max_chunk, budget_rem)." },
  ],
  lineExplanations: {
    1: "Entry point for Chunked Prefill Token Budget Scheduler.",
    11: "Identifies active decode requests requiring 1 token per forward step.",
    20: "Identifies prefill prompts to chunk within remaining token budget.",
    24: "Calculates maximum allowable chunk size without violating total token budget.",
    28: "Returns scheduled request batch and remaining unallocated token budget.",
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
      "Chunked Prefill (as introduced in Sarathi, vLLM, and Orca) disaggregates and schedules long prompt prefills by splitting them into fixed token chunks across multiple serving iterations. Standard LLM serving suffers from severe prefill bubbles: prefill requests are compute-bound (FLOP intensive) while decode requests are memory-bandwidth bound (transferring large KV-cache tensors for a single token). Mixing un-chunked 4k+ token prefills with single-token decodes causes severe decode latency spikes and degrades tail response times (p99 latency).\n\nThe Chunked Prefill Token Budget Scheduler resolves this by enforcing a strict total token budget B_max per iteration. Decodes are granted top priority (1 token slot each to maintain low inter-token latency), and the remaining token budget B_rem = B_max - N_decode is allocated to prefill requests, capped at a maximum prefill chunk size B_chunk. This aligns GPU compute and memory bandwidth utilization across every iteration step.\n\nInput Format:\n- requests: Array of request objects containing request ID, type ('prefill' or 'decode'), and remaining tokens.\n- max_token_budget: Total integer token count budget allocated per GPU iteration step B_max.\n- max_prefill_chunk: Maximum integer token chunk allowed for any single prefill prompt B_chunk.\n\nOutput Format:\n- Returns a tuple of scheduled batch request objects with assigned allocated_tokens and the remaining unallocated token budget.\n\nEdge Cases & Constraints:\n- Zero budget remaining: If decode requests consume the entire token budget B_max, prefill requests are deferred to subsequent iterations.\n- Single token remaining: Prefill chunks naturally reduce to 1 token when nearing prompt completion.\n- Budget underflow protection: Ensures total allocated tokens strictly satisfy sum(allocated) <= B_max.",
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
          "requests = [{id:'req-1', type:'decode', remaining:1}, {id:'req-2', type:'prefill', remaining:512}], B_max=256, B_chunk=128",
        outputDisplay: "Scheduled: [req-1: 1 token, req-2: 128 tokens], Budget Remaining: 127",
        input: {
          requests: [
            { id: "req-1", type: "decode", remaining_tokens: 1 },
            { id: "req-2", type: "prefill", remaining_tokens: 512 },
          ],
          max_token_budget: 256,
          max_prefill_chunk: 128,
        },
        output: "Scheduled 2 requests, 127 remaining budget",
        explanation:
          "Decode req-1 takes 1 token. Remaining budget 255 is used to chunk prefill req-2 up to max_chunk=128.",
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
          heading: "Overview",
          body: "In Large Language Model (LLM) serving, inference consists of two distinct computational phases: the Prefill phase (processing prompt tokens in parallel) and the Decode phase (generating output tokens autoregressively one by one). Prefills are compute-bound with high Tensor Core occupancy, whereas decodes are strictly memory-bandwidth bound. Mixing long, un-chunked prefills with decode iterations causes severe tail-latency spikes for interactive streaming users.",
        },
        {
          heading: "Core Concepts",
          body: "Chunked Prefill establishes an iteration-level Token Budget B_max. Decode requests are assigned mandatory 1-token slots to protect time-per-output-token (TTPT). The remaining token capacity is distributed among prefill prompts in chunks limited by B_chunk = min(prompt_rem, B_max_prefill, B_rem). This ensures that every GPU forward pass executes with uniform matrix dimensions and optimal GEMM arithmetic intensity.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "By standardizing total batch token count per step, Chunked Prefill eliminates prefill bubbles and stabilizes GPU SM (Streaming Multiprocessor) utilization. DRAM bandwidth transfers for model weights and KV-cache blocks are amortized evenly over chunked prompt matrix operations, improving overall throughput by up to 2.5x while keeping p99 inter-token latency low.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Key engineering considerations include partial KV-cache allocation (allocating PagedAttention blocks only for active chunk tokens), KV-cache state preservation across chunk steps, handling prompt boundary alignments, and handling zero-budget corner cases when active decodes saturate B_max.",
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
          term: "Prefill Bubble",
          definition:
            "Idle GPU hardware cycles caused by uneven matrix dimensions when un-chunked prefills block decode execution.",
        },
      ],
    },
    trivia: CHUNKEDPREFILLTOKENBUDGETSCHEDULER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_CHUNKEDPREFILLTOKENBUDGETSCHEDULER_INPUT,
    generateSteps: generateChunkedPrefillTokenBudgetSchedulerSteps,
  };
