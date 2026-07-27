import { describe, it, expect } from "vitest";
import {
  columnParallelLinearReshaper,
  COLUMNPARALLELLINEARRESHAPER_CODE,
  DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT,
  generateColumnParallelLinearReshaperSteps,
} from "./columnParallelLinearReshaper";

describe("column-parallel-linear-reshaper (Megatron-LM Column Parallel Linear Layer Reshaper)", () => {
  it("should have correct metadata", () => {
    expect(columnParallelLinearReshaper.id).toBe("column-parallel-linear-reshaper");
    expect(columnParallelLinearReshaper.isMlInfra).toBe(true);
    expect(columnParallelLinearReshaper.mlInfraLevel).toBe(11);
    expect(columnParallelLinearReshaper.mlInfraCategory).toBe("ml_distributed_systems");
    expect(columnParallelLinearReshaper.categories).toContain("ml_distributed_systems");
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateColumnParallelLinearReshaperSteps(
      DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Enter column_parallel_linear_reshaper");
    expect(steps[steps.length - 1].explanation.what).toBe("Return Rank Shards List");
  });

  it("should have lineExplanations mapping every code line", () => {
    const codeLines = COLUMNPARALLELLINEARRESHAPER_CODE.trimEnd().split("\n").length;
    const explanations = columnParallelLinearReshaper.trivia?.lineExplanations || {};
    expect(Object.keys(explanations).length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i]).toBeDefined();
    }
  });
});

