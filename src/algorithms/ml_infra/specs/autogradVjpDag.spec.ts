import { describe, expect, it } from "vitest";
import {
  autogradVjpDag,
  DEFAULT_AUTOGRAD_VJP_INPUT,
  generateAutogradVjpDagSteps,
} from "../autogradVjpDag";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("autogradVjpDag algorithm spec", () => {
  it("should have correct ML Infra Level 2 metadata", () => {
    expect(autogradVjpDag.id).toBe("autograd-vjp-dag");
    expect(autogradVjpDag.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(autogradVjpDag.topicIds).toContain("ml_autograd_dags");
    expect(autogradVjpDag.defaultInput).toEqual(DEFAULT_AUTOGRAD_VJP_INPUT);
    expect(autogradVjpDag.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" },
    ]);
  });

  it("should compute correct gradients for basic x*y + z computational DAG", () => {
    const steps = generateAutogradVjpDagSteps(DEFAULT_AUTOGRAD_VJP_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(24);

    const distanceTable = lastStep.auxiliaryState.distanceTable;
    expect(distanceTable).toBeDefined();
    expect(distanceTable?.x).toBe(3.0);
    expect(distanceTable?.y).toBe(2.0);
    expect(distanceTable?.z).toBe(1.0);
    expect(distanceTable?.out).toBe(1.0);

    const snap = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snap.kind).toBe("graph");
    expect(snap.nodes.length).toBe(5);
  });

  it("should handle ReLU gating when input value is negative", () => {
    const gatedInput = {
      nodes: [
        { id: "a", label: "a", op: "input" as const, val: 1.0, parents: [] },
        { id: "b", label: "b", op: "input" as const, val: 2.0, parents: [] },
        { id: "ab", label: "a+b", op: "add" as const, val: 3.0, parents: ["a", "b"] },
        { id: "c", label: "c", op: "input" as const, val: -3.0, parents: [] },
        { id: "rc", label: "relu(c)", op: "relu" as const, val: 0.0, parents: ["c"] },
        { id: "out", label: "out", op: "mul" as const, val: 0.0, parents: ["ab", "rc"] },
      ],
      outputId: "out",
      seedGrad: 1.0,
    };
    const steps = generateAutogradVjpDagSteps(gatedInput);
    const lastStep = steps[steps.length - 1];
    const distanceTable = lastStep.auxiliaryState.distanceTable;
    expect(distanceTable?.a).toBe(0.0);
    expect(distanceTable?.b).toBe(0.0);
    expect(distanceTable?.rc).toBe(3.0);
  });

  it("should handle zero seed gradient propagation", () => {
    const zeroSeedInput = {
      nodes: [
        { id: "x", label: "x", op: "input" as const, val: 2.0, parents: [] },
        { id: "y", label: "y", op: "input" as const, val: 3.0, parents: [] },
        { id: "xy", label: "out", op: "mul" as const, val: 6.0, parents: ["x", "y"] },
      ],
      outputId: "xy",
      seedGrad: 0.0,
    };
    const steps = generateAutogradVjpDagSteps(zeroSeedInput);
    const lastStep = steps[steps.length - 1];
    const distanceTable = lastStep.auxiliaryState.distanceTable;
    expect(distanceTable?.x).toBe(0.0);
    expect(distanceTable?.y).toBe(0.0);
    expect(distanceTable?.xy).toBe(0.0);
  });
});

describe("autogradVjpDag trivia metadata", () => {
  const meta = autogradVjpDag.trivia;
  const lines = autogradVjpDag.code.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at valid lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
    });
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
