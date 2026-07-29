import {
  defineCalculatorItem,
  functionExecution,
  inputEvidenceSteps,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def attribute_ml_cost(request):
    usage = request["usage"]
    rates = request["rates"]
    line_items = {
        "ingestion": usage["ingestion_gb"] * rates["ingestion_per_gb"],
        "storage": usage["storage_gb_month"] * rates["storage_per_gb_month"],
        "feature": usage["feature_compute_hours"] * rates["feature_per_hour"],
        "training": usage["training_gpu_hours"] * rates["training_per_gpu_hour"],
        "registry": usage["registry_artifacts"] * rates["registry_per_artifact"],
        "inference": usage["inference_replica_hours"] * rates["inference_per_replica_hour"],
    }
    rounded = {name: round(value, 6) for name, value in line_items.items()}
    total = round(sum(line_items.values()), 6)
    predictions = usage["predictions"]
    return {
        "owner": f'{request["product"]}/{request["model"]}/{request["tenant"]}',
        "line_items": rounded,
        "total": total,
        "per_1000_predictions": round(total / predictions * 1000, 6) if predictions else 0,
        "budget_exceeded": total > request["budget"],
    }`;

const execution = functionExecution({
  entrypoint: "attribute_ml_cost",
  outputContract:
    "Return product/model/tenant owner, six lifecycle line items, total, cost per thousand predictions, and strict budget result.",
  cases: [
    {
      id: "shared-product",
      label: "Shared fraud product tenant",
      input: {
        product: "fraud",
        model: "risk-v3",
        tenant: "tenant-a",
        usage: {
          ingestion_gb: 1000,
          storage_gb_month: 500,
          feature_compute_hours: 20,
          training_gpu_hours: 40,
          registry_artifacts: 5,
          inference_replica_hours: 300,
          predictions: 500000,
        },
        rates: {
          ingestion_per_gb: 0.02,
          storage_per_gb_month: 0.03,
          feature_per_hour: 1.5,
          training_per_gpu_hour: 3,
          registry_per_artifact: 1,
          inference_per_replica_hour: 0.7,
        },
        budget: 500,
      },
      expected: {
        owner: "fraud/risk-v3/tenant-a",
        line_items: {
          ingestion: 20,
          storage: 15,
          feature: 30,
          training: 120,
          registry: 5,
          inference: 210,
        },
        total: 400,
        per_1000_predictions: 0.8,
        budget_exceeded: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "training-heavy",
      label: "Training-heavy research model",
      input: {
        product: "ranking",
        model: "ranker-v8",
        tenant: "internal",
        usage: {
          ingestion_gb: 100,
          storage_gb_month: 100,
          feature_compute_hours: 10,
          training_gpu_hours: 200,
          registry_artifacts: 2,
          inference_replica_hours: 50,
          predictions: 100000,
        },
        rates: {
          ingestion_per_gb: 0.01,
          storage_per_gb_month: 0.02,
          feature_per_hour: 1,
          training_per_gpu_hour: 4,
          registry_per_artifact: 1,
          inference_per_replica_hour: 0.5,
        },
        budget: 800,
      },
      expected: {
        owner: "ranking/ranker-v8/internal",
        line_items: {
          ingestion: 1,
          storage: 2,
          feature: 10,
          training: 800,
          registry: 2,
          inference: 25,
        },
        total: 840,
        per_1000_predictions: 8.4,
        budget_exceeded: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "no-predictions",
      label: "Candidate has not served predictions",
      input: {
        product: "search",
        model: "retriever-candidate",
        tenant: "tenant-b",
        usage: {
          ingestion_gb: 50,
          storage_gb_month: 20,
          feature_compute_hours: 5,
          training_gpu_hours: 10,
          registry_artifacts: 1,
          inference_replica_hours: 0,
          predictions: 0,
        },
        rates: {
          ingestion_per_gb: 0.02,
          storage_per_gb_month: 0.05,
          feature_per_hour: 2,
          training_per_gpu_hour: 5,
          registry_per_artifact: 2,
          inference_per_replica_hour: 1,
        },
        budget: 100,
      },
      expected: {
        owner: "search/retriever-candidate/tenant-b",
        line_items: {
          ingestion: 1,
          storage: 1,
          feature: 10,
          training: 50,
          registry: 2,
          inference: 0,
        },
        total: 64,
        per_1000_predictions: 0,
        budget_exceeded: false,
      },
      comparison: "deep-equal",
    },
  ],
});

function numberField(record: Record<string, unknown>, field: string): number {
  const value = record[field];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function recordField(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function displayNumber(value: number): string {
  return String(Math.round(value * 1_000_000) / 1_000_000);
}

function costDecisionState(input: unknown) {
  const request = recordField(input);
  const usage = recordField(request.usage);
  const rates = recordField(request.rates);
  const stages = [
    ["ingestion", "ingestion_gb", "ingestion_per_gb"],
    ["storage", "storage_gb_month", "storage_per_gb_month"],
    ["feature", "feature_compute_hours", "feature_per_hour"],
    ["training", "training_gpu_hours", "training_per_gpu_hour"],
    ["registry", "registry_artifacts", "registry_per_artifact"],
    ["inference", "inference_replica_hours", "inference_per_replica_hour"],
  ] as const;
  const rows = stages.map(([stage, usageField, rateField]) => {
    const units = numberField(usage, usageField);
    const rate = numberField(rates, rateField);
    return { stage, units, rate, cost: units * rate };
  });
  const total = rows.reduce((sum, row) => sum + row.cost, 0);
  const predictions = numberField(usage, "predictions");
  const budget = numberField(request, "budget");
  return {
    rows,
    total,
    budget,
    perThousand: predictions === 0 ? 0 : (total / predictions) * 1000,
    owner: `${String(request.product ?? "")}/${String(request.model ?? "")}/${String(request.tenant ?? "")}`,
  };
}

export const mlCostAttribution = defineCalculatorItem({
  id: "ml-cost-attribution",
  title: "Attribute ML Lifecycle Cost",
  topicIds: ["ml_governance_security_cost"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Attribute ingestion, storage, feature, training, registry, and inference cost to a model, product, and tenant with a usable unit cost.",
  objective:
    "Build an auditable lifecycle cost model that distinguishes ownership, line-item drivers, total budget, and cost per thousand predictions.",
  completionEvidence:
    "The calculation reconciles every line item to usage × rate, handles zero predictions, and identifies the driver behind a budget breach.",
  sources: [
    verifiedSource({
      label: "AWS Well-Architected Machine Learning Lens",
      url: "https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "attribute_ml_cost",
    parameters: ["request"],
    contract: "Return owner, six line_items, total, per_1000_predictions, and budget_exceeded.",
  }),
  execution,
  generateSteps: (input) => {
    const { rows, total, budget, perThousand, owner } = costDecisionState(input);
    const formattedRows = rows.map((row) => [
      row.stage,
      displayNumber(row.units),
      displayNumber(row.rate),
      displayNumber(row.cost),
    ]);
    const totalLabel = `${displayNumber(total)} total`;
    return inputEvidenceSteps(
      matrixSteps([
        {
          codeLine: 4,
          what: "Multiply ingestion, storage, and feature usage by explicit rates.",
          why: "Attribution begins with dimensional usage rather than an unallocated cloud bill.",
          values: [
            formattedRows[0] ?? ["ingestion", "0", "0", "0"],
            formattedRows[1] ?? ["storage", "0", "0", "0"],
            formattedRows[2] ?? ["feature", "0", "0", "0"],
            ["training", "pending", "pending", "pending"],
            ["registry", "pending", "pending", "pending"],
            ["inference", "pending", "pending", "pending"],
          ],
          colHeaders: ["stage", "usage", "rate", "cost"],
          activeCells: [
            [0, 3],
            [1, 3],
            [2, 3],
          ],
        },
        {
          codeLine: 7,
          what: "Add training, registry, and inference costs.",
          why: "The lifecycle total must include both build-time and serving-time work.",
          values: formattedRows,
          colHeaders: ["stage", "usage", "rate", "cost"],
          completedCells: [
            [0, 3],
            [1, 3],
            [2, 3],
          ],
          activeCells: [
            [3, 3],
            [4, 3],
            [5, 3],
          ],
        },
        {
          codeLine: 12,
          what: "Reconcile all line items to the lifecycle total.",
          why: "A budget decision must be reproducible from its component costs.",
          values: rows.map((row) => [row.stage, displayNumber(row.cost), "included", totalLabel]),
          colHeaders: ["stage", "cost", "reconciled", "total"],
          completedCells: [
            [0, 2],
            [1, 2],
            [2, 2],
            [3, 2],
            [4, 2],
            [5, 2],
          ],
          activeCells: [[5, 3]],
        },
        {
          codeLine: 18,
          what: "Normalize total cost per thousand predictions and compare budget.",
          why: "Unit cost enables product/tenant comparison while total preserves budget accountability.",
          values: [
            ["owner", owner],
            ["unit cost", `${displayNumber(perThousand)} per 1k`],
            [
              "budget",
              `${displayNumber(total)} ${total > budget ? ">" : "<="} ${displayNumber(budget)}`,
            ],
          ],
          colHeaders: ["decision field", "value"],
          completedCells: [[0, 1]],
          activeCells: [
            [1, 1],
            [2, 1],
          ],
        },
      ]),
      input,
      ["product", "usage", "budget"],
      execution.cases,
      false,
    );
  },
  assessmentPayload: {
    variant: "changed-tenant-usage-and-budget",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Attribute lifecycle costs and determine the budget and unit-cost result.",
    inputs: [
      { id: "training_gpu_hours", label: "Training", unit: "GPU-hours", defaultValue: "40" },
      {
        id: "inference_replica_hours",
        label: "Inference",
        unit: "replica-hours",
        defaultValue: "300",
      },
      { id: "predictions", label: "Predictions", unit: "predictions", defaultValue: "500000" },
      { id: "budget", label: "Budget", unit: "currency", defaultValue: "500" },
    ],
    result: { value: 400, unit: "currency", tolerance: 0.000001 },
  },
});
