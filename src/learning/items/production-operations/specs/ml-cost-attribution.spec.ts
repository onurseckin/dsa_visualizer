import { test } from "vitest";
import { mlCostAttribution } from "../ml-cost-attribution";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("attributes lifecycle costs and per-thousand prediction cost to model/product/tenant", () => {
  const lineItems = {
    ingestion: 1000 * 0.02,
    storage: 500 * 0.03,
    feature: 20 * 1.5,
    training: 40 * 3,
    registry: 5 * 1,
    inference: 300 * 0.7,
  };
  const total = Object.values(lineItems).reduce((sum, cost) => sum + cost, 0);

  expectFocusedProductionItem(mlCostAttribution, {
    id: "ml-cost-attribution",
    topic: "ml_governance_security_cost",
    kind: "calculator",
    caseId: "shared-product",
    expected: {
      owner: "fraud/risk-v3/tenant-a",
      line_items: lineItems,
      total,
      per_1000_predictions: (total / 500000) * 1000,
      budget_exceeded: total > 500,
    },
  });
});
