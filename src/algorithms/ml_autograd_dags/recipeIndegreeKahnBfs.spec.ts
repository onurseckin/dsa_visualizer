import { describe, it, expect } from "vitest";
import {
  recipeIndegreeKahnBfs,
  DEFAULT_RECIPEINDEGREEKAHNBFS_INPUT,
  generateRecipeIndegreeKahnBfsSteps,
} from "./recipeIndegreeKahnBfs";

describe("recipe-indegree-kahn-bfs (Kahn's BFS Topological Sort)", () => {
  it("should have correct metadata", () => {
    expect(recipeIndegreeKahnBfs.id).toBe("recipe-indegree-kahn-bfs");
    expect(recipeIndegreeKahnBfs.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(recipeIndegreeKahnBfs.topicIds).toContain("ml_autograd_dags");
    expect(recipeIndegreeKahnBfs.topicIds).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRecipeIndegreeKahnBfsSteps(DEFAULT_RECIPEINDEGREEKAHNBFS_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Kahn's BFS Topological Sort Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = recipeIndegreeKahnBfs.code.trim().split("\n").length;
    expect(recipeIndegreeKahnBfs.trivia).toBeDefined();
    expect(recipeIndegreeKahnBfs.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = recipeIndegreeKahnBfs.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = recipeIndegreeKahnBfs.code.trim().split("\n").length;
    const steps = generateRecipeIndegreeKahnBfsSteps(DEFAULT_RECIPEINDEGREEKAHNBFS_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
