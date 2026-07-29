import {
  arraySteps,
  defineScenarioItem,
  functionExecution,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "audit_replay";

const code = `def audit_replay(record):
    checks = [
        ("seed", record.get("seed") is not None),
        ("dependency_lock", bool(record.get("dependency_lock"))),
        ("platform", bool(record.get("platform"))),
        ("deterministic_algorithms", record.get("deterministic_algorithms") is True),
        ("input_digest", bool(record.get("input_digest"))),
    ]
    return [name for name, present in checks if not present]`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Return missing replay-evidence field names in seed, dependency_lock, platform, deterministic_algorithms, input_digest order.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return the missing replay-evidence names in canonical boundary order; an empty list means all required evidence is present.",
  cases: [
    {
      id: "complete-record",
      label: "Complete replay record",
      input: {
        seed: 7,
        dependency_lock: "sha256:lock",
        platform: "linux-x86_64",
        deterministic_algorithms: true,
        input_digest: "sha256:data",
      },
      expected: [],
      comparison: "deep-equal",
    },
    {
      id: "missing-boundaries",
      label: "Missing seed and platform",
      input: {
        dependency_lock: "sha256:lock",
        deterministic_algorithms: true,
        input_digest: "sha256:data",
      },
      expected: ["seed", "platform"],
      comparison: "deep-equal",
    },
    {
      id: "unsupported-claim",
      label: "Missing lock, deterministic mode, and data digest",
      input: {
        seed: 19,
        dependency_lock: "",
        platform: "macos-arm64",
        deterministic_algorithms: false,
        input_digest: "",
      },
      expected: ["dependency_lock", "deterministic_algorithms", "input_digest"],
      comparison: "deep-equal",
    },
  ],
});

const replayFields = [
  "seed",
  "dependency lock",
  "platform",
  "deterministic algorithms",
  "input digest",
] as const;

export const determinismTriage = defineScenarioItem({
  id: "determinism-triage",
  title: "Determinism Triage",
  topicIds: ["ml_python_scientific_computing"],
  difficultyProfile: profile(2, 2, 3, 3),
  description:
    "Triage a replay divergence and scope deterministic claims to the recorded software, platform, algorithm, and input boundaries.",
  objective:
    "Separate evidence that enables replay from an unsupported promise of identical results across releases and platforms.",
  completionEvidence:
    "A rubric-scored incident response plus a passing replay-evidence auditor across three changed records.",
  sources: [
    verifiedSource({
      label: "PyTorch reproducibility",
      url: "https://docs.pytorch.org/docs/stable/notes/randomness.html",
    }),
  ],
  prompt: {
    context:
      "A training rerun diverged after the base image and accelerator host changed. The original run stored a seed but no lock digest, platform fingerprint, or input digest.",
    question:
      "What evidence will you collect, what boundary will you replay first, and how will you word the deterministic guarantee?",
    constraints: [
      "Do not promise bitwise identity across arbitrary releases or platforms.",
      "Identify both data and algorithm sources of nondeterminism.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "evidence-boundary",
        label: "Evidence boundary",
        description:
          "Names interpreter/dependency, platform, input, seed, and deterministic-algorithm evidence.",
        points: 3,
        critical: true,
      },
      {
        id: "controlled-replay",
        label: "Controlled replay",
        description: "Changes one boundary at a time and compares stable intermediate artifacts.",
        points: 2,
      },
      {
        id: "scoped-guarantee",
        label: "Scoped guarantee",
        description: "Scopes the guarantee to recorded versions and hardware conditions.",
        points: 2,
        critical: true,
      },
    ],
  },
  playground: {
    code,
    starterCode,
    execution,
    generateSteps: (input) =>
      inputEvidenceSteps(
        arraySteps([
          {
            codeLine: 2,
            what: "List every boundary required for a controlled replay.",
            why: "A seed alone does not identify software, platform, algorithms, or data.",
            values: replayFields,
            activeIndices: [0, 1, 2, 3, 4],
          },
          {
            codeLine: 3,
            what: "Check each recorded boundary independently.",
            why: "Independent checks expose exactly which evidence is missing.",
            values: replayFields,
            activeIndices: [1, 2, 4],
            completedIndices: [0, 3],
          },
          {
            codeLine: 9,
            what: "Return the missing evidence in a stable order.",
            why: "A deterministic audit artifact supports comparison without overstating replay guarantees.",
            values: ["dependency lock", "platform", "input digest"],
            completedIndices: [0, 1, 2],
            variables: { missingCount: 3 },
          },
        ]),
        input,
        ["seed", "platform", "input_digest"],
        execution.cases,
      ),
  },
  assessmentPayload: {
    variant: "platform-and-release-change",
    changedContext: true,
    isomorphicRetest: true,
    consequences:
      "A broad guarantee hides unsupported boundaries; a controlled replay localizes divergence before remediation.",
  },
});
