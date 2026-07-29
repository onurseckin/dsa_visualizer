import {
  defineTraceItem,
  functionExecution,
  graphSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def plan_pipeline_execution(record):
    import hashlib

    tasks = {task["id"]: task for task in record["tasks"]}
    completed = set()
    planned = []
    while len(completed) < len(tasks):
        ready = sorted(
            task_id
            for task_id, task in tasks.items()
            if task_id not in completed
            and all(dependency in completed for dependency in task["depends_on"])
        )
        if not ready:
            raise ValueError("pipeline dependencies contain a cycle or unknown task")
        for task_id in ready:
            task = tasks[task_id]
            material = "|".join(
                [
                    task_id,
                    task["code_digest"],
                    task["config_digest"],
                    *sorted(task["input_digests"]),
                ]
            )
            cache_key = "sha256:" + hashlib.sha256(material.encode("utf-8")).hexdigest()
            if record.get("cache", {}).get(task_id) == cache_key:
                action = "cache-hit"
            elif task["attempt"] > 1 and not task["idempotent"]:
                action = "blocked-unsafe-retry"
            elif task["attempt"] > 1:
                action = "retry"
            else:
                action = "execute"
            planned.append(
                {"task": task_id, "cache_key": cache_key, "action": action}
            )
            completed.add(task_id)
    return planned`;

const execution = functionExecution({
  entrypoint: "plan_pipeline_execution",
  outputContract:
    "Return tasks in deterministic topological order with a full SHA-256 cache key over task/code/config/input digests and an action distinguishing cache hit, execute, retry, or blocked unsafe retry.",
  cases: [
    {
      id: "dependency-and-cache-hit",
      label: "Cached extraction precedes uncached training",
      input: {
        tasks: [
          {
            id: "extract",
            depends_on: [],
            code_digest: "code-a",
            config_digest: "cfg-1",
            input_digests: ["raw-1"],
            attempt: 1,
            idempotent: true,
          },
          {
            id: "train",
            depends_on: ["extract"],
            code_digest: "code-b",
            config_digest: "cfg-2",
            input_digests: ["features-2"],
            attempt: 1,
            idempotent: true,
          },
        ],
        cache: {
          extract: "sha256:a5fcac033a7aa8d1623a1be5c86a67fcef8327eab16ece4c554099c9fb599488",
        },
      },
      expected: [
        {
          task: "extract",
          cache_key: "sha256:a5fcac033a7aa8d1623a1be5c86a67fcef8327eab16ece4c554099c9fb599488",
          action: "cache-hit",
        },
        {
          task: "train",
          cache_key: "sha256:30e989cb457ccf7b37455525a4316035a2e513308df0a7c99f12cb31a502c861",
          action: "execute",
        },
      ],
      comparison: "deep-equal",
    },
    {
      id: "safe-idempotent-retry",
      label: "Failed deterministic training task can retry",
      input: {
        tasks: [
          {
            id: "train",
            depends_on: [],
            code_digest: "code-b",
            config_digest: "cfg-2",
            input_digests: ["features-2"],
            attempt: 2,
            idempotent: true,
          },
        ],
        cache: {},
      },
      expected: [
        {
          task: "train",
          cache_key: "sha256:30e989cb457ccf7b37455525a4316035a2e513308df0a7c99f12cb31a502c861",
          action: "retry",
        },
      ],
      comparison: "deep-equal",
    },
    {
      id: "unsafe-publish-retry",
      label: "Non-idempotent publication cannot retry blindly",
      input: {
        tasks: [
          {
            id: "publish",
            depends_on: [],
            code_digest: "code-c",
            config_digest: "cfg-3",
            input_digests: ["model-3"],
            attempt: 2,
            idempotent: false,
          },
        ],
        cache: {},
      },
      expected: [
        {
          task: "publish",
          cache_key: "sha256:b614f336df01777dfb24a36f48c6fe5a20fa8da7eeb867421611619d546bff1b",
          action: "blocked-unsafe-retry",
        },
      ],
      comparison: "deep-equal",
    },
  ],
});

const starterCode = semanticStarter({
  entrypoint: "plan_pipeline_execution",
  parameters: ["record"],
  contract:
    "Topologically order the DAG; compute a SHA-256 key from task/code/config/input digests; decide cache hit, execute, retry, or unsafe-retry block.",
});

function generateSteps(input: unknown) {
  const record = input as {
    tasks?: readonly {
      id: string;
      depends_on: readonly string[];
      attempt?: number;
      idempotent?: boolean;
    }[];
    cache?: Record<string, string>;
  };
  const tasks = record?.tasks ?? [];
  const nodes = tasks.map((task) => ({
    id: task.id,
    label: `${task.id}\nattempt ${String(task.attempt ?? 1)}`,
  }));
  const edges = tasks.flatMap((task) =>
    task.depends_on.map((dependency) => ({ from: dependency, to: task.id })),
  );
  const ready = tasks.filter((task) => task.depends_on.length === 0).map((task) => task.id);
  const cacheHits = tasks
    .filter((task) => Boolean(record?.cache?.[task.id]))
    .map((task) => task.id);
  const unsafe = tasks
    .filter((task) => Number(task.attempt ?? 1) > 1 && !task.idempotent)
    .map((task) => task.id);
  return graphSteps([
    {
      codeLine: 7,
      what: "Release only tasks whose dependency artifacts are complete.",
      why: "Topological readiness prevents consumers from observing partial upstream state.",
      nodes,
      edges,
      activeNodeIds: ready,
      variables: { ready: ready.join(", ") || "none" },
    },
    {
      codeLine: 23,
      what: "Compare content-addressed cache keys.",
      why: "Task identity, code, configuration, and every input digest jointly define reusable output.",
      nodes,
      edges,
      activeNodeIds: cacheHits,
      completedNodeIds: ready.filter((id) => !cacheHits.includes(id)),
      traversedEdgeIndexes: edges.map((_, index) => index),
      variables: { cacheHits: cacheHits.join(", ") || "none" },
    },
    {
      codeLine: 27,
      what: "Gate retries on explicit idempotence evidence.",
      why: "A retry is safe only when repeating side effects cannot duplicate or corrupt published state.",
      nodes,
      edges,
      activeNodeIds: unsafe,
      completedNodeIds: tasks.filter((task) => !unsafe.includes(task.id)).map((task) => task.id),
      traversedEdgeIndexes: edges.map((_, index) => index),
    },
  ]);
}

export const mlPipelineRetryCache = defineTraceItem({
  id: "ml-pipeline-retry-cache",
  title: "ML pipeline retry and cache trace",
  topicIds: ["ml_workflow_orchestration"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Trace dependency readiness, content-addressed artifact caching, and retry safety through a rerunnable ML workflow DAG.",
  objective:
    "Derive cache identity from declared immutable inputs and block retries that lack idempotence evidence.",
  completionEvidence:
    "The trace explains DAG order and every cache/retry action, while canonical code passes cached, safe-retry, and unsafe-retry cases.",
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
    variant: "changed-cache-and-retry-state",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Predict which ready task reuses cache, executes, retries, or must be blocked.",
    currentState: "A partially completed DAG exposes immutable task and artifact evidence.",
    referenceNextState: "Ready tasks receive content-addressed actions guarded by idempotence.",
  },
});
