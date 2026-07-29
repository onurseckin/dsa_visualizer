import {
  defineTraceItem,
  functionExecution,
  graphSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "time_group_split";

const code = `def time_group_split(record):
    cutoff = record["cutoff"]
    grouped = {}
    for row in record["records"]:
        grouped.setdefault(row["group"], []).append(row)
    train, test, dropped_groups = [], [], []
    for group in sorted(grouped):
        rows = grouped[group]
        times = [row["time"] for row in rows]
        if max(times) < cutoff:
            train.extend(row["id"] for row in sorted(rows, key=lambda row: (row["time"], row["id"])))
        elif min(times) >= cutoff:
            test.extend(row["id"] for row in sorted(rows, key=lambda row: (row["time"], row["id"])))
        else:
            dropped_groups.append(group)
    return {"train": train, "test": test, "dropped_groups": dropped_groups}`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Assign whole groups before cutoff to train, whole groups at/after cutoff to test, and boundary-spanning groups to dropped_groups.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return {train, test, dropped_groups}; no group may cross partitions, cutoff equality belongs to test, and outputs follow sorted group then time/id order.",
  cases: [
    {
      id: "separate-groups",
      label: "Groups fall on separate sides",
      input: {
        cutoff: 5,
        records: [
          { id: "a2", group: "account-a", time: 2 },
          { id: "b1", group: "account-b", time: 6 },
          { id: "a1", group: "account-a", time: 1 },
          { id: "b2", group: "account-b", time: 7 },
        ],
      },
      expected: { train: ["a1", "a2"], test: ["b1", "b2"], dropped_groups: [] },
      comparison: "deep-equal",
    },
    {
      id: "spanning-group",
      label: "One group spans the time boundary",
      input: {
        cutoff: 5,
        records: [
          { id: "m1", group: "mixed", time: 4 },
          { id: "m2", group: "mixed", time: 6 },
          { id: "t1", group: "train", time: 1 },
          { id: "e1", group: "test", time: 8 },
        ],
      },
      expected: { train: ["t1"], test: ["e1"], dropped_groups: ["mixed"] },
      comparison: "deep-equal",
    },
    {
      id: "cutoff-equality",
      label: "Cutoff equality belongs to test",
      input: {
        cutoff: 10,
        records: [
          { id: "old", group: "past", time: 9 },
          { id: "edge", group: "present", time: 10 },
          { id: "future", group: "present", time: 12 },
        ],
      },
      expected: { train: ["old"], test: ["edge", "future"], dropped_groups: [] },
      comparison: "deep-equal",
    },
  ],
});

const nodes = [
  { id: "account-a", label: "account-a" },
  { id: "account-b", label: "account-b" },
  { id: "train", label: "train" },
  { id: "test", label: "test" },
] as const;
const edges = [
  { from: "account-a", to: "train" },
  { from: "account-b", to: "test" },
] as const;

export const timeGroupSplitBuilder = defineTraceItem({
  id: "time-group-split-builder",
  title: "Time and Group Split Builder",
  topicIds: ["ml_data_contracts_splits"],
  difficultyProfile: profile(2, 2, 3, 2),
  description:
    "Trace a temporal split that keeps entity groups intact and quarantines groups spanning the cutoff.",
  objective:
    "Enforce both time ordering and group isolation instead of applying a random row split.",
  completionEvidence:
    "Correct train, test, and quarantined-group outputs for separated, spanning, and cutoff-equality cases.",
  sources: [
    verifiedSource({
      label: "Dataset partitions",
      url: "https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets",
    }),
    verifiedSource({
      label: "Scikit-learn cross-validation",
      url: "https://scikit-learn.org/stable/modules/cross_validation.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: () =>
    graphSteps([
      {
        codeLine: 3,
        what: "Group records before assigning partitions.",
        why: "Row-level assignment would allow one entity to appear on both sides.",
        nodes,
        edges: [],
        activeNodeIds: ["account-a", "account-b"],
      },
      {
        codeLine: 9,
        what: "Compare each whole group's time range with the cutoff.",
        why: "A group spanning the cutoff cannot satisfy both time and isolation constraints.",
        nodes,
        edges,
        activeNodeIds: ["account-a", "account-b"],
        traversedEdgeIndexes: [0],
      },
      {
        codeLine: 16,
        what: "Commit whole groups to train or test.",
        why: "The resulting split preserves time direction without entity leakage.",
        nodes,
        edges,
        completedNodeIds: ["account-a", "account-b", "train", "test"],
        traversedEdgeIndexes: [0, 1],
        variables: { cutoff: 5, invariant: "one group → at most one partition" },
      },
    ]),
  assessmentPayload: {
    variant: "group-spans-cutoff",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Predict the partition of each whole group at the cutoff.",
    currentState: "account-a times=[1,2], account-b times=[6,7], cutoff=5",
    referenceNextState: "account-a→train, account-b→test, dropped_groups=[]",
  },
});
