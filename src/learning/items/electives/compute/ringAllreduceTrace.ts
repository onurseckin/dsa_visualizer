import { trace } from "./shared";
export const ringAllreduceTrace = trace({
  id: "ring-allreduce-trace",
  title: "Trace Ring All-Reduce",
  topicId: "ml_distributed_training",
  entrypoint: "trace_ring_allreduce",
  contract: "Return modeled ring phases and bytes per rank; no distributed process is executed.",
  code: `def trace_ring_allreduce(record):
    ranks = record["ranks"]
    phases = 2 * (ranks - 1)
    bytes_per_rank = phases * record["tensor_bytes"] / ranks
    return {"phases": phases, "bytes_per_rank": bytes_per_rank, "surviving_ranks": ranks - (1 if record.get("failed_rank") is not None else 0)}`,
  cases: [
    {
      id: "four-rank",
      label: "Four ranks",
      input: { ranks: 4, tensor_bytes: 120 },
      expected: { phases: 6, bytes_per_rank: 180, surviving_ranks: 4 },
      comparison: "deep-equal",
    },
    {
      id: "two-rank",
      label: "Two ranks",
      input: { ranks: 2, tensor_bytes: 80 },
      expected: { phases: 2, bytes_per_rank: 80, surviving_ranks: 2 },
      comparison: "deep-equal",
    },
    {
      id: "failure",
      label: "Rank failure",
      input: { ranks: 8, tensor_bytes: 800, failed_rank: 3 },
      expected: { phases: 14, bytes_per_rank: 1400, surviving_ranks: 7 },
      comparison: "deep-equal",
    },
  ],
  source: [
    "NCCL collective communication",
    "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html",
  ],
  values: (r) => {
    const ranks = Number(r.ranks);
    const phases = 2 * (ranks - 1);
    return [
      ["ranks", ranks],
      ["ring phases", phases],
      ["bytes per rank", (phases * Number(r.tensor_bytes)) / ranks],
      ["surviving ranks", ranks - (r.failed_rank === undefined ? 0 : 1)],
    ];
  },
});
