import {
  arraySteps,
  defineScenarioItem,
  defineTraceItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../../authoring";

const pagedCacheCode = `def allocate_paged_kv(record):
    block_size = record["block_size"]
    allocations = {}
    used_blocks = 0
    fragmentation_slots = 0
    for request in record["requests"]:
        tokens = max(0, request["tokens"] - request.get("evicted_tokens", 0))
        logical_blocks = (tokens + block_size - 1) // block_size
        physical_blocks = max(0, logical_blocks - request.get("shared_blocks", 0))
        allocations[request["id"]] = physical_blocks
        used_blocks += physical_blocks
        fragmentation_slots += logical_blocks * block_size - tokens
    return {
        "allocations": allocations,
        "used_blocks": used_blocks,
        "free_blocks": record["capacity_blocks"] - used_blocks,
        "fragmentation_slots": fragmentation_slots,
        "fits": used_blocks <= record["capacity_blocks"],
    }`;

const pagedCacheExecution = functionExecution({
  entrypoint: "allocate_paged_kv",
  outputContract:
    "Return per-request physical page allocations, used and free blocks, unused tail-token slots, and whether the bounded page pool fits. Shared prefix pages reduce physical allocation only.",
  cases: [
    {
      id: "shared-prefix",
      label: "Shared prefix saves a page",
      input: {
        block_size: 4,
        capacity_blocks: 6,
        requests: [
          { id: "a", tokens: 6, shared_blocks: 0 },
          { id: "b", tokens: 7, shared_blocks: 1 },
        ],
      },
      expected: {
        allocations: { a: 2, b: 1 },
        used_blocks: 3,
        free_blocks: 3,
        fragmentation_slots: 3,
        fits: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "eviction",
      label: "Eviction releases logical tail pages",
      input: {
        block_size: 4,
        capacity_blocks: 3,
        requests: [{ id: "a", tokens: 9, evicted_tokens: 4, shared_blocks: 0 }],
      },
      expected: {
        allocations: { a: 2 },
        used_blocks: 2,
        free_blocks: 1,
        fragmentation_slots: 3,
        fits: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "over-capacity",
      label: "Pages may not fit",
      input: {
        block_size: 8,
        capacity_blocks: 2,
        requests: [
          { id: "a", tokens: 9 },
          { id: "b", tokens: 8 },
        ],
      },
      expected: {
        allocations: { a: 2, b: 1 },
        used_blocks: 3,
        free_blocks: -1,
        fragmentation_slots: 7,
        fits: false,
      },
      comparison: "deep-equal",
    },
  ],
});

interface PagedCacheInput {
  readonly block_size: number;
  readonly capacity_blocks: number;
  readonly requests: readonly {
    readonly id: string;
    readonly tokens: number;
    readonly evicted_tokens?: number;
    readonly shared_blocks?: number;
  }[];
}

export const pagedKvCacheAllocation = defineTraceItem({
  id: "paged-kv-cache-allocation",
  title: "Paged KV-cache allocation",
  topicIds: ["ml_llm_serving"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Trace a bounded, page-oriented cache model with tail fragmentation, prefix sharing, and explicit eviction effects.",
  objective:
    "Calculate page occupancy without treating an educational allocator trace as a GPU kernel or a production serving runtime.",
  completionEvidence:
    "The learner accounts for logical pages, physical shared-prefix savings, tail waste, eviction, and a capacity breach from the same request state.",
  sources: [
    verifiedSource({
      label: "Efficient Memory Management for Large Language Model Serving with PagedAttention",
      url: "https://arxiv.org/abs/2309.06180",
    }),
    verifiedSource({
      label: "vLLM Paged Attention design",
      url: "https://docs.vllm.ai/en/latest/design/paged_attention/",
    }),
  ],
  code: pagedCacheCode,
  starterCode: semanticStarter({
    entrypoint: "allocate_paged_kv",
    parameters: ["record"],
    contract:
      "Model page allocation from logical tokens, sharing, eviction, and a bounded capacity.",
  }),
  execution: pagedCacheExecution,
  generateSteps: (input) => {
    const record = input as PagedCacheInput;
    const live = record.requests.map((request) => ({
      ...request,
      liveTokens: Math.max(0, request.tokens - (request.evicted_tokens ?? 0)),
    }));
    const pages = live.map((request) => ({
      ...request,
      logical: Math.ceil(request.liveTokens / record.block_size),
    }));
    const physical = pages.map((request) => ({
      ...request,
      physical: Math.max(0, request.logical - (request.shared_blocks ?? 0)),
    }));
    const used = physical.reduce((total, request) => total + request.physical, 0);
    const fragmentation = pages.reduce(
      (total, request) => total + request.logical * record.block_size - request.liveTokens,
      0,
    );
    return arraySteps([
      {
        codeLine: 2,
        what: "Read the fixed page size and incoming token counts.",
        why: "Page units bound allocation bookkeeping even when request lengths differ.",
        values: [
          `block=${record.block_size}`,
          ...live.map((request) => `${request.id}:${request.liveTokens} live tokens`),
        ],
        activeIndices: [0],
      },
      {
        codeLine: 8,
        what: "Round each live sequence into logical pages before sharing.",
        why: "A partial final page still consumes a page and exposes tail fragmentation.",
        values: pages.map((request) => `${request.id}:${request.logical} logical pages`),
        activeIndices: pages.map((_, index) => index),
      },
      {
        codeLine: 10,
        what: "Subtract only explicitly shared prefix pages from physical occupancy.",
        why: "Sharing changes memory ownership while logical token accounting remains per request.",
        values: physical.map(
          (request) =>
            `${request.id}:${request.logical}-${request.shared_blocks ?? 0}=${request.physical}`,
        ),
        activeIndices: physical.map((_, index) => index),
      },
      {
        codeLine: 14,
        what: "Expose free capacity and tail waste as separate invariants.",
        why: "A page pool can fit while still carrying fragmentation that affects admission decisions.",
        values: [
          `used=${used}`,
          `free=${record.capacity_blocks - used}`,
          `tail=${fragmentation}`,
          `fits=${used <= record.capacity_blocks}`,
        ],
        activeIndices: [3],
        completedIndices: [0, 1, 2],
      },
    ]);
  },
  assessmentPayload: {
    variant: "changed-page-size-and-prefix-sharing",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Trace page allocation after a changed mix of prefixes, tails, and evictions.",
    currentState: "bounded page pool with uneven request lengths",
    referenceNextState:
      "physical occupancy is derived from logical pages minus explicit shared pages",
  },
});

const batchingCode = `def trace_continuous_batching(record):
    pending = {request["id"] for request in record["requests"]}
    active = {}
    admitted = set()
    completed = set()
    cancelled = set()
    trace = []
    for tick in range(record["ticks"]):
        cancelling = {request["id"] for request in record["requests"] if request.get("cancel_at") == tick}
        for request_id in cancelling:
            if request_id in pending or request_id in active:
                pending.discard(request_id)
                active.pop(request_id, None)
                cancelled.add(request_id)
        for request in record["requests"]:
            if request["arrival"] == tick and request["id"] in pending:
                pending.remove(request["id"])
                admitted.add(request["id"])
                active[request["id"]] = request["decode_tokens"]
        prefill_tokens = sum(request.get("prompt_tokens", 0) for request in record["requests"] if request["arrival"] == tick and request["id"] in active)
        trace.append({"tick": tick, "active": sorted(active), "prefill_tokens": prefill_tokens})
        for request_id in list(active):
            active[request_id] -= 1
            if active[request_id] <= 0:
                del active[request_id]
                completed.add(request_id)
    return {"ticks": trace, "pending": sorted(pending), "admitted": sorted(admitted), "completed": sorted(completed), "cancelled": sorted(cancelled)}`;

const batchingExecution = functionExecution({
  entrypoint: "trace_continuous_batching",
  outputContract:
    "Return an educational tick-by-tick active-request trace, admitted prompt-token total, and explicit pending, admitted, completed, and cancelled request IDs. It models mixed arrival, prompt and decode lengths, and cancellation; it does not execute model inference.",
  cases: [
    {
      id: "mixed-arrivals",
      label: "New work joins an ongoing decode batch",
      input: {
        ticks: 3,
        requests: [
          { id: "a", arrival: 0, prompt_tokens: 8, decode_tokens: 2 },
          { id: "b", arrival: 1, prompt_tokens: 3, decode_tokens: 2 },
        ],
      },
      expected: {
        ticks: [
          { tick: 0, active: ["a"], prefill_tokens: 8 },
          { tick: 1, active: ["a", "b"], prefill_tokens: 3 },
          { tick: 2, active: ["b"], prefill_tokens: 0 },
        ],
        pending: [],
        admitted: ["a", "b"],
        completed: ["a", "b"],
        cancelled: [],
      },
      comparison: "deep-equal",
    },
    {
      id: "cancellation",
      label: "Cancellation removes queued decode work",
      input: {
        ticks: 3,
        requests: [{ id: "a", arrival: 0, prompt_tokens: 12, decode_tokens: 3, cancel_at: 1 }],
      },
      expected: {
        ticks: [
          { tick: 0, active: ["a"], prefill_tokens: 12 },
          { tick: 1, active: [], prefill_tokens: 0 },
          { tick: 2, active: [], prefill_tokens: 0 },
        ],
        pending: [],
        admitted: ["a"],
        completed: [],
        cancelled: ["a"],
      },
      comparison: "deep-equal",
    },
    {
      id: "same-tick",
      label: "Multiple requests can enter together",
      input: {
        ticks: 2,
        requests: [
          { id: "a", arrival: 0, prompt_tokens: 1, decode_tokens: 1 },
          { id: "b", arrival: 0, prompt_tokens: 5, decode_tokens: 2 },
        ],
      },
      expected: {
        ticks: [
          { tick: 0, active: ["a", "b"], prefill_tokens: 6 },
          { tick: 1, active: ["b"], prefill_tokens: 0 },
        ],
        pending: [],
        admitted: ["a", "b"],
        completed: ["a", "b"],
        cancelled: [],
      },
      comparison: "deep-equal",
    },
    {
      id: "late-arrival-pending",
      label: "A request arriving after the trace stays pending",
      input: {
        ticks: 2,
        requests: [{ id: "late", arrival: 3, prompt_tokens: 9, decode_tokens: 1 }],
      },
      expected: {
        ticks: [
          { tick: 0, active: [], prefill_tokens: 0 },
          { tick: 1, active: [], prefill_tokens: 0 },
        ],
        pending: ["late"],
        admitted: [],
        completed: [],
        cancelled: [],
      },
      comparison: "deep-equal",
    },
  ],
});

interface BatchingRequest {
  readonly id: string;
  readonly arrival: number;
  readonly prompt_tokens: number;
  readonly decode_tokens: number;
  readonly cancel_at?: number;
}

interface BatchingInput {
  readonly ticks: number;
  readonly requests: readonly BatchingRequest[];
}

function batchingTrace(record: BatchingInput) {
  const pending = new Set(record.requests.map((request) => request.id));
  const active = new Map<string, number>();
  const admitted = new Set<string>();
  const completed = new Set<string>();
  const cancelled = new Set<string>();
  const ticks: { tick: number; active: string[]; prefillTokens: number }[] = [];
  for (let tick = 0; tick < record.ticks; tick += 1) {
    for (const request of record.requests) {
      if (request.cancel_at === tick && (pending.has(request.id) || active.has(request.id))) {
        pending.delete(request.id);
        active.delete(request.id);
        cancelled.add(request.id);
      }
    }
    for (const request of record.requests) {
      if (request.arrival === tick && pending.has(request.id)) {
        pending.delete(request.id);
        admitted.add(request.id);
        active.set(request.id, request.decode_tokens);
      }
    }
    const prefillTokens = record.requests
      .filter((request) => request.arrival === tick && active.has(request.id))
      .reduce((total, request) => total + request.prompt_tokens, 0);
    ticks.push({ tick, active: [...active.keys()].sort(), prefillTokens });
    for (const [requestId, remaining] of [...active.entries()]) {
      if (remaining <= 1) {
        active.delete(requestId);
        completed.add(requestId);
      } else {
        active.set(requestId, remaining - 1);
      }
    }
  }
  return { ticks, pending, admitted, completed, cancelled };
}

export const continuousBatchingTrace = defineTraceItem({
  id: "continuous-batching-trace",
  title: "Continuous batching trace",
  topicIds: ["ml_llm_serving"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Trace mixed arrivals and cancellation through an educational decode scheduler rather than a vendor or GPU execution engine.",
  objective:
    "Distinguish dynamic request membership from a static batch and reason about cancellation and per-token retirement over scheduler ticks.",
  completionEvidence:
    "A correct trace shows requests joining after arrival, leaving after their decode budget, and disappearing immediately at cancellation boundaries.",
  sources: [
    verifiedSource({
      label: "Orca: a distributed serving system for transformer-based generative models",
      url: "https://www.usenix.org/conference/osdi22/presentation/yu",
    }),
    verifiedSource({
      label: "Efficient Memory Management for Large Language Model Serving with PagedAttention",
      url: "https://arxiv.org/abs/2309.06180",
    }),
  ],
  code: batchingCode,
  starterCode: semanticStarter({
    entrypoint: "trace_continuous_batching",
    parameters: ["record"],
    contract:
      "Trace prompt-token admission, cancellation, and one decode token retired per active request each tick.",
  }),
  execution: batchingExecution,
  generateSteps: (input) => {
    const record = input as BatchingInput;
    const state = batchingTrace(record);
    const arrivalValues = record.requests.map(
      (request) =>
        `${request.id}@${request.arrival}:p${request.prompt_tokens}/d${request.decode_tokens}`,
    );
    return arraySteps([
      {
        codeLine: 4,
        what: "Admit requests whose arrival tick has occurred and record their prompt work.",
        why: "Continuous batching changes membership over time instead of waiting for a fixed batch to finish.",
        values: arrivalValues.length > 0 ? arrivalValues : ["no requests"],
        activeIndices: arrivalValues.map((_, index) => index),
      },
      {
        codeLine: 6,
        what: "Remove cancellation targets before the decode step.",
        why: "Cancelled work must stop consuming the modeled scheduler budget at its cancellation boundary.",
        values: [
          `pending=${[...state.pending].sort().join(",") || "none"}`,
          `cancelled=${[...state.cancelled].sort().join(",") || "none"}`,
        ],
        activeIndices: [1],
      },
      {
        codeLine: 8,
        what: "Record each active set at the tick boundary.",
        why: "The trace makes changing membership inspectable without claiming measured throughput.",
        values: state.ticks.map(
          (tick) =>
            `t${tick.tick}:${tick.active.join(",") || "idle"};prefill=${tick.prefillTokens}`,
        ),
        activeIndices: state.ticks.map((_, index) => index),
      },
      {
        codeLine: 10,
        what: "Retire one modeled decode token and release completed requests.",
        why: "Per-request completion lets later arrivals share the next tick without a static-batch barrier.",
        values: [
          `admitted=${[...state.admitted].sort().join(",") || "none"}`,
          `completed=${[...state.completed].sort().join(",") || "none"}`,
          `cancelled=${[...state.cancelled].sort().join(",") || "none"}`,
          `pending=${[...state.pending].sort().join(",") || "none"}`,
        ],
        activeIndices: [1],
        completedIndices: [0],
      },
    ]);
  },
  assessmentPayload: {
    variant: "changed-arrival-cancellation-mix",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Predict active requests at each changed scheduler tick.",
    currentState: "mixed prompt and decode arrivals",
    referenceNextState: "only live, uncancelled requests consume a decode tick",
  },
});

const policyCode = `def validate_llm_serving_policy(policy):
    missing = []
    if policy.get("admission_limit", 0) < 1: missing.append("admission_limit")
    if policy.get("queue_timeout_ms", -1) > policy.get("slo_p95_ms", -1): missing.append("queue_timeout")
    if policy.get("prefix_cache") and not policy.get("cache_key_version"): missing.append("cache_key_version")
    if policy.get("speculative") and policy.get("draft_acceptance_rate", 0) <= 0: missing.append("acceptance_measurement")
    if policy.get("overload_action") not in ("reject", "degrade", "shed"): missing.append("overload_action")
    missing.sort()
    return {"valid": not missing, "missing": missing, "policy_artifact": "measured-constraints"}`;

const policyExecution = functionExecution({
  entrypoint: "validate_llm_serving_policy",
  outputContract:
    "Return whether a submitted policy artifact names bounded admission, queue/SLO relation, cache key versioning, speculative-decoding measurement when used, and an overload action. It does not prescribe one serving architecture.",
  cases: [
    {
      id: "bounded-policy",
      label: "Measured policy artifact",
      input: {
        admission_limit: 12,
        queue_timeout_ms: 80,
        slo_p95_ms: 150,
        prefix_cache: true,
        cache_key_version: "model-v4",
        speculative: true,
        draft_acceptance_rate: 0.6,
        overload_action: "shed",
      },
      expected: { valid: true, missing: [], policy_artifact: "measured-constraints" },
      comparison: "deep-equal",
    },
    {
      id: "missing-cache-key",
      label: "Prefix cache needs a key version",
      input: {
        admission_limit: 2,
        queue_timeout_ms: 30,
        slo_p95_ms: 90,
        prefix_cache: true,
        speculative: false,
        overload_action: "reject",
      },
      expected: {
        valid: false,
        missing: ["cache_key_version"],
        policy_artifact: "measured-constraints",
      },
      comparison: "deep-equal",
    },
    {
      id: "unbounded-overload",
      label: "Policy lacks measurable protection",
      input: {
        admission_limit: 0,
        queue_timeout_ms: 200,
        slo_p95_ms: 100,
        prefix_cache: false,
        speculative: true,
        draft_acceptance_rate: 0,
        overload_action: "wait",
      },
      expected: {
        valid: false,
        missing: ["acceptance_measurement", "admission_limit", "overload_action", "queue_timeout"],
        policy_artifact: "measured-constraints",
      },
      comparison: "deep-equal",
    },
  ],
});

interface ServingPolicyInput {
  readonly admission_limit: number;
  readonly queue_timeout_ms: number;
  readonly slo_p95_ms: number;
  readonly prefix_cache: boolean;
  readonly cache_key_version?: string;
  readonly speculative: boolean;
  readonly draft_acceptance_rate?: number;
  readonly overload_action: string;
}

function servingPolicyFailures(policy: ServingPolicyInput): string[] {
  const missing: string[] = [];
  if (policy.admission_limit < 1) missing.push("admission_limit");
  if (policy.queue_timeout_ms > policy.slo_p95_ms) missing.push("queue_timeout");
  if (policy.prefix_cache && !policy.cache_key_version) missing.push("cache_key_version");
  if (policy.speculative && (policy.draft_acceptance_rate ?? 0) <= 0) {
    missing.push("acceptance_measurement");
  }
  if (!["reject", "degrade", "shed"].includes(policy.overload_action)) {
    missing.push("overload_action");
  }
  return missing.sort();
}

export const llmServingPolicy = defineScenarioItem({
  id: "llm-serving-policy",
  title: "LLM serving policy",
  topicIds: ["ml_llm_serving"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Choose a policy from workload evidence, including prefill/decode priorities, cache behavior, admission, overload handling, and SLO measurements.",
  objective:
    "Defend a serving policy using observed constraints while preserving explicit overload behavior and avoiding claims that one scheduling strategy is universally optimal.",
  completionEvidence:
    "The rubric evaluates the rationale; the playground only verifies that its submitted policy artifact includes measurable protections and cache/speculation invariants.",
  sources: [
    verifiedSource({
      label: "Efficient Memory Management for Large Language Model Serving with PagedAttention",
      url: "https://arxiv.org/abs/2309.06180",
    }),
    verifiedSource({
      label: "vLLM automatic prefix caching",
      url: "https://docs.vllm.ai/en/latest/features/automatic_prefix_caching.html",
    }),
  ],
  prompt: {
    context:
      "An interactive assistant has bursty long prompts, short follow-up turns, a p95 first-token SLO, and an explicit error budget for overload.",
    question:
      "Propose a serving policy and state what you will measure before changing prefill/decode priority, prefix caching, or speculative decoding.",
    constraints: [
      "Define bounded admission and an overload response.",
      "Separate the policy rationale from the quantifiable artifact validator.",
      "Do not claim that the scratchpad runs a model, GPU, or vendor runtime.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "slo",
        label: "SLO and overload",
        description: "Connects admission, queueing, rejection/degradation, and a measurable SLO.",
        points: 3,
        critical: true,
      },
      {
        id: "scheduling",
        label: "Scheduling tradeoffs",
        description: "Explains prefill/decode and batching tradeoffs for the supplied workload.",
        points: 3,
        critical: true,
      },
      {
        id: "cache",
        label: "Cache and speculation evidence",
        description:
          "Names key invalidation and acceptance/quality measurements when using cache or speculation.",
        points: 2,
      },
    ],
  },
  playground: {
    code: policyCode,
    starterCode: semanticStarter({
      entrypoint: "validate_llm_serving_policy",
      parameters: ["policy"],
      contract:
        "Validate the measurable invariants of a serving-policy artifact; leave its qualitative design to the rubric.",
    }),
    execution: policyExecution,
    generateSteps: (input) => {
      const policy = input as ServingPolicyInput;
      const failures = servingPolicyFailures(policy);
      return arraySteps([
        {
          codeLine: 3,
          what: "Check that policy admission is explicitly bounded.",
          why: "A bounded system must decide what happens before saturation rather than silently accumulating work.",
          values: [
            `limit=${policy.admission_limit}`,
            `overload=${policy.overload_action}`,
            `bounded=${policy.admission_limit >= 1}`,
          ],
          activeIndices: [0],
        },
        {
          codeLine: 4,
          what: "Compare queue timeout with the stated tail-latency budget.",
          why: "Queueing can consume an SLO before any modeled decode work begins.",
          values: [
            `queue=${policy.queue_timeout_ms}ms`,
            `slo=${policy.slo_p95_ms}ms`,
            `within=${policy.queue_timeout_ms <= policy.slo_p95_ms}`,
          ],
          activeIndices: [2],
          completedIndices: [0, 1],
        },
        {
          codeLine: 5,
          what: "Require a versioned cache key when prefix reuse is enabled.",
          why: "Cache reuse is only safe when ownership and invalidation semantics are explicit.",
          values: [
            `prefix=${policy.prefix_cache}`,
            `key=${policy.cache_key_version || "missing"}`,
            `speculative=${policy.speculative}`,
            `acceptance=${policy.draft_acceptance_rate ?? "missing"}`,
          ],
          activeIndices: [2],
          completedIndices: [0, 1],
        },
        {
          codeLine: 9,
          what: "Return a structural policy result, not an architecture verdict.",
          why: "The scenario rubric judges the design rationale while this artifact checks measurable commitments.",
          values: [
            `valid=${failures.length === 0}`,
            `missing=${failures.join(",") || "none"}`,
            `overload=${policy.overload_action}`,
          ],
          activeIndices: [2],
          completedIndices: [0, 1],
        },
      ]);
    },
  },
  assessmentPayload: {
    variant: "changed-slo-and-prompt-mix",
    changedContext: true,
    isomorphicRetest: true,
    choices: ["Prefill-biased", "Decode-biased", "Adaptive"],
    consequences:
      "The choice is not automatically correct; the rationale is rubric-scored and the playground validates only explicit policy invariants.",
  },
});
