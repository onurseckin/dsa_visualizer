import { describe, it, expect } from "vitest";
import {
  tasksAndDeadlines,
  generateTasksAndDeadlinesSteps,
  DEFAULT_TASKS_AND_DEADLINES_INPUT,
} from "../tasksAndDeadlines";

describe("tasksAndDeadlines logic spec", () => {
  it("generates >= 20 steps for default input", () => {
    const steps = generateTasksAndDeadlinesSteps(DEFAULT_TASKS_AND_DEADLINES_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Return");
  });

  it("ships a rich topic guide teaching Shortest Processing Time and mathematical reductions", () => {
    const guide = tasksAndDeadlines.topicGuide;
    expect(guide.overview).toContain("Tasks and Deadlines");
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split(". ").length).toBeGreaterThanOrEqual(3);
    });
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Shortest Processing Time (SPT)");
  });

  it("verifies algorithm definition metadata and complete lineExplanations mapping", () => {
    expect(tasksAndDeadlines.id).toBe("tasks-and-deadlines");
    expect(tasksAndDeadlines.category).toBe("greedy_algorithms");
    expect(tasksAndDeadlines.difficulty).toBe("Medium");
    expect(tasksAndDeadlines.code).toContain("def tasks_and_deadlines");

    const lines = tasksAndDeadlines.code.split("\n");
    expect(tasksAndDeadlines.trivia?.lineExplanations).toBeDefined();
    for (let i = 1; i <= lines.length; i++) {
      expect(tasksAndDeadlines.trivia?.lineExplanations?.[i]).toBeDefined();
      expect(typeof tasksAndDeadlines.trivia?.lineExplanations?.[i]).toBe("string");
    }
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(tasksAndDeadlines.examples).toHaveLength(3);
    expect(tasksAndDeadlines.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of tasksAndDeadlines.examples!) {
      const steps = tasksAndDeadlines.generateSteps(
        example.input as { tasks: Array<{ id: string; duration: number; deadline: number }> },
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
