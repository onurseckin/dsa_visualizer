import { debugging } from "./shared";
export const distributedMemoryStraggler = debugging({
  id: "distributed-memory-straggler",
  title: "Diagnose Distributed Memory and Stragglers",
  topicId: "ml_distributed_training",
  entrypoint: "diagnose_distributed_step",
  contract:
    "Return sharded state memory and timing-skew classification from supplied observations; it does not inspect a cluster.",
  code: `def diagnose_distributed_step(record):
    state = (record["parameters_gb"] + record["gradients_gb"] + record["optimizer_gb"]) / record["ranks"]
    slowest = max(record["rank_seconds"])
    fastest = min(record["rank_seconds"])
    return {"sharded_state_gb": round(state, 6), "step_seconds": slowest, "straggler_gap_seconds": round(slowest - fastest, 6), "diagnosis": "straggler" if slowest > fastest * record["straggler_ratio"] else "balanced"}`,
  cases: [
    {
      id: "balanced",
      label: "Balanced ranks",
      input: {
        parameters_gb: 40,
        gradients_gb: 40,
        optimizer_gb: 80,
        ranks: 4,
        rank_seconds: [10, 10.5, 10.2],
        straggler_ratio: 1.2,
      },
      expected: {
        sharded_state_gb: 40,
        step_seconds: 10.5,
        straggler_gap_seconds: 0.5,
        diagnosis: "balanced",
      },
      comparison: "deep-equal",
    },
    {
      id: "straggler",
      label: "Slow rank",
      input: {
        parameters_gb: 24,
        gradients_gb: 24,
        optimizer_gb: 48,
        ranks: 4,
        rank_seconds: [8, 8.1, 12],
        straggler_ratio: 1.2,
      },
      expected: {
        sharded_state_gb: 24,
        step_seconds: 12,
        straggler_gap_seconds: 4,
        diagnosis: "straggler",
      },
      comparison: "deep-equal",
    },
    {
      id: "eight",
      label: "Eight-way shard",
      input: {
        parameters_gb: 64,
        gradients_gb: 64,
        optimizer_gb: 128,
        ranks: 8,
        rank_seconds: [4, 4, 4, 4],
        straggler_ratio: 1.1,
      },
      expected: {
        sharded_state_gb: 32,
        step_seconds: 4,
        straggler_gap_seconds: 0,
        diagnosis: "balanced",
      },
      comparison: "deep-equal",
    },
  ],
  source: ["PyTorch FSDP documentation", "https://docs.pytorch.org/docs/stable/fsdp.html"],
  values: (r) => {
    const timings = r.rank_seconds as number[];
    const state =
      (Number(r.parameters_gb) + Number(r.gradients_gb) + Number(r.optimizer_gb)) / Number(r.ranks);
    const gap = Math.max(...timings) - Math.min(...timings);
    return [
      ["sharded state GB", state],
      ["slowest rank seconds", Math.max(...timings)],
      ["timing gap seconds", gap],
      [
        "diagnosis",
        Math.max(...timings) > Math.min(...timings) * Number(r.straggler_ratio)
          ? "straggler"
          : "balanced",
      ],
    ];
  },
});
