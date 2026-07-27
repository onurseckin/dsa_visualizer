import { describe, it, expect } from "vitest";
import { recipeIndegreeKahnBfs, DEFAULT_RECIPEINDEGREEKAHNBFS_INPUT, generateRecipeIndegreeKahnBfsSteps } from "./recipeIndegreeKahnBfs";

describe("recipe-indegree-kahn-bfs (Kahn's BFS Topological Sort)", () => {
  it("should have correct metadata", () => {
    expect(recipeIndegreeKahnBfs.id).toBe("recipe-indegree-kahn-bfs");
    expect(recipeIndegreeKahnBfs.isMlInfra).toBe(true);
    expect(recipeIndegreeKahnBfs.mlInfraLevel).toBe(3);
    expect(recipeIndegreeKahnBfs.mlInfraCategory).toBe("ml_autograd_dags");
    expect(recipeIndegreeKahnBfs.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRecipeIndegreeKahnBfsSteps(DEFAULT_RECIPEINDEGREEKAHNBFS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Kahn's BFS Topological Sort");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
