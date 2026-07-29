import {
  defineScenarioItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def evaluate_promotion_gate(evidence):
    checks = [
        ("quality", evidence["quality"] >= evidence["minimum_quality"]),
        ("compatibility", bool(evidence["compatible"])),
        ("lineage", bool(evidence["lineage_complete"])),
        ("policy", bool(evidence["policy_passed"])),
        ("vulnerability", evidence["critical_vulnerabilities"] == 0),
        ("reproducibility", bool(evidence["reproducible"])),
    ]
    blockers = [name for name, passed in checks if not passed]
    return {
        "decision": "promote" if not blockers else "blocked",
        "blockers": blockers,
        "passed": len(checks) - len(blockers),
        "required": len(checks),
    }`;

const execution = functionExecution({
  entrypoint: "evaluate_promotion_gate",
  outputContract:
    "Return promote only when all six evidence gates pass; otherwise return ordered blockers and passed/required counts.",
  cases: [
    {
      id: "all-evidence",
      label: "All release evidence passes",
      input: {
        quality: 0.91,
        minimum_quality: 0.9,
        compatible: true,
        lineage_complete: true,
        policy_passed: true,
        critical_vulnerabilities: 0,
        reproducible: true,
      },
      expected: { decision: "promote", blockers: [], passed: 6, required: 6 },
      comparison: "deep-equal",
    },
    {
      id: "multiple-blockers",
      label: "Quality, lineage, and vulnerability fail",
      input: {
        quality: 0.88,
        minimum_quality: 0.9,
        compatible: true,
        lineage_complete: false,
        policy_passed: true,
        critical_vulnerabilities: 2,
        reproducible: true,
      },
      expected: {
        decision: "blocked",
        blockers: ["quality", "lineage", "vulnerability"],
        passed: 3,
        required: 6,
      },
      comparison: "deep-equal",
    },
    {
      id: "compatibility-only",
      label: "Incompatible serving signature",
      input: {
        quality: 0.94,
        minimum_quality: 0.9,
        compatible: false,
        lineage_complete: true,
        policy_passed: true,
        critical_vulnerabilities: 0,
        reproducible: true,
      },
      expected: {
        decision: "blocked",
        blockers: ["compatibility"],
        passed: 5,
        required: 6,
      },
      comparison: "deep-equal",
    },
  ],
});

export const modelPromotionGate = defineScenarioItem({
  id: "model-promotion-gate",
  title: "Design a Model Promotion Gate",
  topicIds: ["ml_model_registry"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Combine quality, serving compatibility, lineage, policy, vulnerability, and reproducibility evidence into a fail-closed promotion decision.",
  objective:
    "Design a promotion gate whose decision is reconstructable from independent release evidence rather than a single aggregate score.",
  completionEvidence:
    "A written decision names every critical gate, the owner of its evidence, and a remediation path for each blocker.",
  sources: [
    verifiedSource({
      label: "Google MLOps continuous delivery and automation pipelines",
      url: "https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning",
    }),
  ],
  prompt: {
    context:
      "A candidate improves aggregate quality but changes its signature, lacks complete lineage, and contains an unresolved critical vulnerability.",
    question:
      "Should it be promoted, which gates block it, and what evidence must each owner supply before reconsideration?",
    constraints: [
      "Do not average critical gates into a composite release score.",
      "The model version and its evidence must remain immutable.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "fail-closed",
        label: "Fail-closed decision",
        description: "Blocks promotion when any critical evidence gate fails.",
        points: 3,
        critical: true,
      },
      {
        id: "evidence-owners",
        label: "Evidence ownership",
        description:
          "Assigns quality, compatibility, lineage, policy, security, and reproducibility evidence.",
        points: 2,
        critical: true,
      },
      {
        id: "remediation",
        label: "Remediation",
        description: "Defines a concrete repair and re-evaluation path for each blocker.",
        points: 1,
      },
    ],
  },
  playground: {
    code,
    starterCode: semanticStarter({
      entrypoint: "evaluate_promotion_gate",
      parameters: ["evidence"],
      contract: "Return decision, ordered blockers, passed, and required for all six gates.",
    }),
    execution,
    generateSteps: () =>
      matrixSteps([
        {
          codeLine: 2,
          what: "Evaluate quality and compatibility independently.",
          why: "A better metric cannot offset an unusable serving signature.",
          values: [
            ["quality", "pending"],
            ["compatibility", "pending"],
            ["lineage", "pending"],
            ["policy", "pending"],
            ["vulnerability", "pending"],
            ["reproducibility", "pending"],
          ],
          colHeaders: ["gate", "status"],
          activeCells: [
            [0, 1],
            [1, 1],
          ],
        },
        {
          codeLine: 5,
          what: "Evaluate provenance and policy evidence.",
          why: "Release evidence must identify what was built and whether its use is permitted.",
          values: [
            ["quality", "pass"],
            ["compatibility", "pass"],
            ["lineage", "fail"],
            ["policy", "pass"],
            ["vulnerability", "pending"],
            ["reproducibility", "pending"],
          ],
          colHeaders: ["gate", "status"],
          completedCells: [
            [0, 1],
            [1, 1],
          ],
          activeCells: [
            [2, 1],
            [3, 1],
          ],
        },
        {
          codeLine: 8,
          what: "Finish security and reproducibility checks.",
          why: "All critical gates must pass; counts never dilute a blocker.",
          values: [
            ["quality", "pass"],
            ["compatibility", "pass"],
            ["lineage", "fail"],
            ["policy", "pass"],
            ["vulnerability", "fail"],
            ["reproducibility", "pass"],
          ],
          colHeaders: ["gate", "status"],
          completedCells: [
            [0, 1],
            [1, 1],
            [3, 1],
            [5, 1],
          ],
          activeCells: [
            [2, 1],
            [4, 1],
          ],
        },
      ]),
  },
  assessmentPayload: {
    variant: "changed-promotion-evidence",
    changedContext: true,
    isomorphicRetest: true,
    choices: ["promote", "block", "waive-without-evidence"],
    consequences:
      "A critical compatibility, lineage, policy, vulnerability, or reproducibility gap blocks release even when aggregate quality improves.",
  },
});
