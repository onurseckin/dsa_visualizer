import { defineCapstoneItem, functionExecution } from "../../authoring";
import {
  batchPlatformSource,
  CAPSTONE_DIFFICULTY,
  CAPSTONE_TOPIC_IDS,
  capstoneStarter,
  lifecycleGraphSteps,
  platformChecklist,
  batchPlatformRubric,
  platformTimeline,
} from "./shared";

const code = `import math

def plan_batch_platform(spec):
    daily_records = int(spec["daily_records"])
    bytes_per_record = int(spec["bytes_per_record"])
    shards = int(spec["shards"])
    worker_records_per_second = float(spec["worker_records_per_second"])
    window_seconds = int(spec["window_seconds"])
    backfill_days = int(spec["backfill_days"])

    if daily_records < 0 or bytes_per_record < 0 or shards <= 0:
        raise ValueError("record counts must be non-negative and shards positive")
    if worker_records_per_second <= 0 or window_seconds <= 0 or backfill_days < 0:
        raise ValueError("throughput/window must be positive and backfill non-negative")

    required_rps = daily_records / window_seconds
    required_workers = max(1, math.ceil(required_rps / worker_records_per_second))
    records_per_shard = math.ceil(daily_records / shards)
    backfill_records = daily_records * backfill_days

    return {
        "required_rps": round(required_rps, 4),
        "required_workers": required_workers,
        "records_per_shard": records_per_shard,
        "backfill_records": backfill_records,
        "backfill_storage_bytes": backfill_records * bytes_per_record,
    }`;

const outputContract =
  "Return required throughput/workers, ceiling records per shard, and exact backfill records/storage from the stated batch assumptions.";

const execution = functionExecution({
  entrypoint: "plan_batch_platform",
  outputContract,
  cases: [
    {
      id: "daily-window",
      label: "Daily workload in a one-hour window",
      input: {
        daily_records: 86_400,
        bytes_per_record: 200,
        shards: 8,
        worker_records_per_second: 12,
        window_seconds: 3_600,
        backfill_days: 7,
      },
      expected: {
        required_rps: 24,
        required_workers: 2,
        records_per_shard: 10_800,
        backfill_records: 604_800,
        backfill_storage_bytes: 120_960_000,
      },
      comparison: "deep-equal",
    },
    {
      id: "no-backfill",
      label: "Small job with no backfill",
      input: {
        daily_records: 1_000,
        bytes_per_record: 128,
        shards: 1,
        worker_records_per_second: 10,
        window_seconds: 1_000,
        backfill_days: 0,
      },
      expected: {
        required_rps: 1,
        required_workers: 1,
        records_per_shard: 1_000,
        backfill_records: 0,
        backfill_storage_bytes: 0,
      },
      comparison: "deep-equal",
    },
    {
      id: "large-backfill",
      label: "Million-record workload with a two-week backfill",
      input: {
        daily_records: 1_000_000,
        bytes_per_record: 512,
        shards: 64,
        worker_records_per_second: 35,
        window_seconds: 7_200,
        backfill_days: 14,
      },
      expected: {
        required_rps: 138.8889,
        required_workers: 4,
        records_per_shard: 15_625,
        backfill_records: 14_000_000,
        backfill_storage_bytes: 7_168_000_000,
      },
      comparison: "deep-equal",
    },
  ],
});

export const batchMlPlatformCapstone = defineCapstoneItem({
  id: "batch-ml-platform-capstone",
  title: "Batch ML Platform Capstone",
  topicIds: CAPSTONE_TOPIC_IDS,
  difficultyProfile: CAPSTONE_DIFFICULTY,
  description:
    "Design a governed batch prediction product from decision framing and snapshot contracts through training, promotion, scheduled inference, backfills, and delayed-outcome monitoring.",
  objective:
    "Produce an end-to-end batch ML platform design whose artifacts, capacity, failure recovery, release evidence, and ownership can be independently audited.",
  completionEvidence:
    "A rubric-scored platform design plus a passing batch capacity and backfill sizing artifact.",
  sources: [batchPlatformSource],
  prompt: {
    context:
      "A risk model scores a daily snapshot before a fixed downstream decision window. Labels arrive weeks later, historical backfills are mandatory, and the team must reproduce every released prediction.",
    question:
      "Design the batch ML lifecycle, including decision/metric contract, datasets and splits, training execution, registry promotion, scheduled inference, backfill semantics, monitoring, rollback, governance, and cost ownership.",
    constraints: [
      "The daily decision window cannot consume a partially published snapshot.",
      "A backfill must not overwrite previously released predictions without a new version.",
      "Model-quality evaluation is delayed, so service success alone cannot prove correctness.",
    ],
  },
  rubric: batchPlatformRubric,
  playground: {
    code,
    starterCode: capstoneStarter("plan_batch_platform", outputContract),
    execution,
    generateSteps: () => lifecycleGraphSteps(["frame", "data", "train", "release", "operate"]),
  },
  assessmentPayload: {
    variant: "daily-risk-snapshot",
    changedContext: true,
    isomorphicRetest: false,
    checklist: platformChecklist,
    incidentTimeline: platformTimeline,
  },
});
