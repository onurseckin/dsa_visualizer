import {
  defineDebuggingItem,
  functionExecution,
  graphSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def diagnose_stale_artifact(record):
    cached = record["cached_manifest"]
    current = record["current_manifest"]
    fields = (
        ("code", "code_digest"),
        ("input", "input_digest"),
        ("schema", "schema_digest"),
    )
    mismatches = sorted(
        label
        for label, field in fields
        if cached.get(field) != current.get(field)
    )
    unsafe_retry = record["attempt"] > 1 and not record["idempotent"]
    if mismatches and unsafe_retry:
        action = "invalidate-cache-and-block-retry"
    elif mismatches:
        action = "invalidate-cache"
    elif unsafe_retry:
        action = "block-retry"
    else:
        action = "reuse-safe"
    return {
        "action": action,
        "mismatches": mismatches,
        "unsafe_retry": unsafe_retry,
    }`;

const execution = functionExecution({
  entrypoint: "diagnose_stale_artifact",
  outputContract:
    "Return action, sorted code/input/schema cache-manifest mismatches, and unsafe_retry; invalidate on any digest change and block repeated non-idempotent side effects.",
  cases: [
    {
      id: "mutable-input-replaced",
      label: "Input partition changed behind a stable path",
      input: {
        cached_manifest: {
          code_digest: "sha256:code-8",
          input_digest: "sha256:data-41",
          schema_digest: "sha256:schema-5",
        },
        current_manifest: {
          code_digest: "sha256:code-8",
          input_digest: "sha256:data-42",
          schema_digest: "sha256:schema-5",
        },
        attempt: 1,
        idempotent: true,
      },
      expected: {
        action: "invalidate-cache",
        mismatches: ["input"],
        unsafe_retry: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "code-and-schema-changed",
      label: "Cached output is incompatible with current code and schema",
      input: {
        cached_manifest: {
          code_digest: "sha256:code-8",
          input_digest: "sha256:data-42",
          schema_digest: "sha256:schema-5",
        },
        current_manifest: {
          code_digest: "sha256:code-9",
          input_digest: "sha256:data-42",
          schema_digest: "sha256:schema-6",
        },
        attempt: 1,
        idempotent: true,
      },
      expected: {
        action: "invalidate-cache",
        mismatches: ["code", "schema"],
        unsafe_retry: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "unsafe-publication-retry",
      label: "Matching cache evidence does not make duplicate publication safe",
      input: {
        cached_manifest: {
          code_digest: "sha256:code-9",
          input_digest: "sha256:data-42",
          schema_digest: "sha256:schema-6",
        },
        current_manifest: {
          code_digest: "sha256:code-9",
          input_digest: "sha256:data-42",
          schema_digest: "sha256:schema-6",
        },
        attempt: 2,
        idempotent: false,
      },
      expected: { action: "block-retry", mismatches: [], unsafe_retry: true },
      comparison: "deep-equal",
    },
  ],
});

const starterCode = semanticStarter({
  entrypoint: "diagnose_stale_artifact",
  parameters: ["record"],
  contract:
    "Compare cached and current code/input/schema digests, then combine cache invalidation with retry idempotence evidence.",
});

function generateSteps(input: unknown) {
  const record = input as {
    cached_manifest?: Record<string, unknown>;
    current_manifest?: Record<string, unknown>;
    attempt?: number;
    idempotent?: boolean;
  };
  const cached = record?.cached_manifest ?? {};
  const current = record?.current_manifest ?? {};
  const dimensions = [
    ["code", "code_digest"],
    ["input", "input_digest"],
    ["schema", "schema_digest"],
  ] as const;
  const nodes = [
    ...dimensions.map(([label, field]) => ({
      id: `cached-${label}`,
      label: `cached ${label}\n${String(cached[field] ?? "missing")}`,
    })),
    ...dimensions.map(([label, field]) => ({
      id: `current-${label}`,
      label: `current ${label}\n${String(current[field] ?? "missing")}`,
    })),
    { id: "artifact", label: "cached output artifact" },
    { id: "retry", label: `attempt ${String(record?.attempt ?? 1)}` },
  ];
  const edges = [
    ...dimensions.map(([label]) => ({ from: `cached-${label}`, to: "artifact" })),
    { from: "artifact", to: "retry" },
  ];
  const mismatches = dimensions
    .filter(([, field]) => cached[field] !== current[field])
    .map(([label]) => label);
  return graphSteps([
    {
      codeLine: 2,
      what: "Load the cache manifest stored with the output artifact.",
      why: "A path or task name cannot prove which code, input, and schema produced bytes.",
      nodes,
      edges,
      activeNodeIds: ["artifact", ...dimensions.map(([label]) => `cached-${label}`)],
    },
    {
      codeLine: 8,
      what: "Compare every declared digest with current execution evidence.",
      why: "Any changed dependency invalidates the cached output contract.",
      nodes,
      edges,
      activeNodeIds: mismatches.flatMap((label) => [`cached-${label}`, `current-${label}`]),
      completedNodeIds: dimensions
        .filter(([label]) => !mismatches.includes(label))
        .flatMap(([label]) => [`cached-${label}`, `current-${label}`]),
      traversedEdgeIndexes: edges.slice(0, 3).map((_, index) => index),
      variables: { mismatches: mismatches.join(", ") || "none" },
    },
    {
      codeLine: 14,
      what: "Evaluate retry idempotence independently from cache freshness.",
      why: "Matching artifact inputs do not make repeated external publication side effects safe.",
      nodes,
      edges,
      activeNodeIds: Number(record?.attempt ?? 1) > 1 && !record?.idempotent ? ["retry"] : [],
      completedNodeIds: ["artifact"],
      traversedEdgeIndexes: edges.map((_, index) => index),
    },
  ]);
}

export const staleArtifactPipelineDebugging = defineDebuggingItem({
  id: "stale-artifact-pipeline-debugging",
  title: "Stale artifact pipeline debugging",
  topicIds: ["ml_workflow_orchestration"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Diagnose cache reuse and retry failures by comparing immutable code, input, and schema evidence stored with an artifact.",
  objective:
    "Invalidate incompatible cached output and independently block unsafe repeated side effects.",
  completionEvidence:
    "The diagnosis identifies every stale digest and distinguishes cache compatibility from retry idempotence across three typed failure cases.",
  sources: [
    verifiedSource({
      label: "Kubeflow Pipelines concepts",
      url: "https://www.kubeflow.org/docs/components/pipelines/concepts/pipeline/",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps,
  assessmentPayload: {
    variant: "changed-artifact-manifest",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def diagnose_stale_artifact(record):
    if record["cached_path"] == record["current_path"]:
        return {"action": "reuse-safe", "mismatches": [], "unsafe_retry": False}
    return {"action": "execute", "mismatches": [], "unsafe_retry": False}`,
    evidence: [
      {
        label: "Cached artifact manifest",
        content: "The output records code, input-snapshot, and schema digests from attempt one.",
      },
      {
        label: "Retry event",
        content:
          "Attempt two follows a partial publication failure; the current digests and idempotence declaration are available.",
      },
    ],
    failingTests: [
      "Invalidate cached output when any declared digest changes.",
      "Report every incompatible code, input, and schema dimension.",
      "Block a repeated non-idempotent publication independently of cache freshness.",
    ],
    hints: [
      "Compare content identities, not mutable locations.",
      "Cache validity and side-effect idempotence answer different questions.",
    ],
  },
});
