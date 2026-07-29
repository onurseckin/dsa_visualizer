import { trace } from "./shared";
export const ringAllreduceTrace = trace({
  id: "ring-allreduce-trace",
  title: "Trace Ring All-Reduce",
  topicId: "ml_distributed_training",
  entrypoint: "trace_ring_allreduce",
  contract:
    "Return completed, aborted, or explicitly restarted ring accounting; a failed current collective never continues on surviving ranks, and no distributed process is executed.",
  code: `def trace_ring_allreduce(record):
    original_ranks = record["ranks"]
    failed = record.get("failed_rank") is not None
    if failed:
        restarted_ranks = record.get("reconfigured_ranks")
        restarted = record.get("restart") is True and restarted_ranks == original_ranks - 1
        if not restarted:
            return {"status": "aborted", "active_ranks": 0, "phases": 0, "bytes_per_rank": 0, "restart_required": True}
        ranks = restarted_ranks
        status = "restarted"
    else:
        ranks = original_ranks
        status = "completed"
    phases = 2 * (ranks - 1)
    bytes_per_rank = round(phases * record["tensor_bytes"] / ranks, 6)
    return {"status": status, "active_ranks": ranks, "phases": phases, "bytes_per_rank": bytes_per_rank, "restart_required": False}`,
  cases: [
    {
      id: "four-rank",
      label: "Four ranks",
      input: { ranks: 4, tensor_bytes: 120 },
      expected: {
        status: "completed",
        active_ranks: 4,
        phases: 6,
        bytes_per_rank: 180,
        restart_required: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "two-rank",
      label: "Two ranks",
      input: { ranks: 2, tensor_bytes: 80 },
      expected: {
        status: "completed",
        active_ranks: 2,
        phases: 2,
        bytes_per_rank: 80,
        restart_required: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "failure-aborts",
      label: "Failure aborts current collective",
      input: { ranks: 8, tensor_bytes: 800, failed_rank: 3 },
      expected: {
        status: "aborted",
        active_ranks: 0,
        phases: 0,
        bytes_per_rank: 0,
        restart_required: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "explicit-restart",
      label: "Reconfigured smaller ring",
      input: { ranks: 8, tensor_bytes: 800, failed_rank: 3, reconfigured_ranks: 7, restart: true },
      expected: {
        status: "restarted",
        active_ranks: 7,
        phases: 12,
        bytes_per_rank: 1371.428571,
        restart_required: false,
      },
      comparison: "deep-equal",
    },
  ],
  source: [
    "NCCL collective communication",
    "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html",
  ],
  values: (r) => {
    const originalRanks = Number(r.ranks);
    const hasFailure = r.failed_rank !== undefined;
    const restarted =
      hasFailure && r.restart === true && Number(r.reconfigured_ranks) === originalRanks - 1;
    const ranks = hasFailure ? (restarted ? originalRanks - 1 : 0) : originalRanks;
    const phases = ranks === 0 ? 0 : 2 * (ranks - 1);
    const status = hasFailure ? (restarted ? "restarted" : "aborted") : "completed";
    return [
      ["current collective", hasFailure ? "failed" : "healthy"],
      ["reconfigured and restarted", restarted],
      ["status", status],
      ["active ranks", ranks],
      ["ring phases", phases],
      ["bytes per rank", ranks === 0 ? 0 : (phases * Number(r.tensor_bytes)) / ranks],
    ];
  },
});
