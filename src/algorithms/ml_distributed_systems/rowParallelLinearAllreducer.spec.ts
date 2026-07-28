import { describe, it, expect } from "vitest";
import {
  rowParallelLinearAllreducer,
  DEFAULT_ROWPARALLELLINEARALLREDUCER_INPUT,
  generateRowParallelLinearAllreducerSteps,
} from "./rowParallelLinearAllreducer";

describe("row-parallel-linear-allreducer (Megatron-LM Row Parallel Linear All-Reduce Engine)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(rowParallelLinearAllreducer.id).toBe("row-parallel-linear-allreducer");
    expect(rowParallelLinearAllreducer.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(rowParallelLinearAllreducer.topicIds).toContain("ml_distributed_systems");
    expect(rowParallelLinearAllreducer.topicIds).toContain("ml_distributed_systems");
    expect(rowParallelLinearAllreducer.defaultInput).toEqual(
      DEFAULT_ROWPARALLELLINEARALLREDUCER_INPUT,
    );

    const codeLines = rowParallelLinearAllreducer.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      rowParallelLinearAllreducer.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(rowParallelLinearAllreducer.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateRowParallelLinearAllreducerSteps(
      DEFAULT_ROWPARALLELLINEARALLREDUCER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize");
    expect(steps[steps.length - 1].explanation.what).toContain("Broadcast");
  });

  it("should handle edge cases (single rank and empty data) gracefully", () => {
    const singleSteps = generateRowParallelLinearAllreducerSteps({ data: [42], target: 42 });
    expect(singleSteps.length).toBe(3);
    expect(singleSteps[2].codeLine).toBe(3);

    const emptySteps = generateRowParallelLinearAllreducerSteps({ data: [] });
    expect(emptySteps.length).toBe(3);
    expect(emptySteps[2].codeLine).toBe(3);
  });
});
