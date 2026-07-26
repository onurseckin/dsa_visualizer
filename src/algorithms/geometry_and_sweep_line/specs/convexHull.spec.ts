import { describe, it, expect } from "vitest";
import {
  convexHull,
  generateConvexHullSteps,
  DEFAULT_CONVEX_HULL_INPUT,
  PYTHON_CONVEX_HULL_CODE,
  type ConvexHullInput,
} from "../convexHull";

describe("convexHull algorithm logic spec", () => {
  it("generates valid steps for default 2D points input", () => {
    const steps = generateConvexHullSteps(DEFAULT_CONVEX_HULL_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe("graph");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.hullVerticesCount).toBeGreaterThanOrEqual(3);
  });

  it("correctly finds hull for a simple triangle plus interior point", () => {
    const input = {
      points: [
        { x: 0, y: 0, id: "A" },
        { x: 0, y: 100, id: "B" },
        { x: 100, y: 0, id: "C" },
        { x: 20, y: 20, id: "Inside" },
      ],
    };
    const steps = generateConvexHullSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.hullVerticesCount).toBe(3);
  });

  it("handles empty points array gracefully", () => {
    const steps = generateConvexHullSteps({ points: [] });
    expect(steps.length).toBe(1);
    expect(steps[0].variables.hullSize).toBe(0);
  });

  it("handles missing input/points and points without id/label with tiebreaker", () => {
    const stepsFallback = generateConvexHullSteps({} as ConvexHullInput);
    expect(stepsFallback.length).toBeGreaterThan(0);

    const stepsNoId = generateConvexHullSteps({
      points: [
        { x: 0, y: 10 },
        { x: 0, y: 0 },
        { x: 10, y: 5 },
      ],
    });
    expect(stepsNoId.length).toBeGreaterThan(0);
  });

  it("verifies algorithm definition metadata and Python representation", () => {
    expect(convexHull.id).toBe("convex-hull");
    expect(convexHull.category).toBe("geometry_and_sweep_line");
    expect(convexHull.difficulty).toBe("Hard");
    expect(convexHull.code).toBe(PYTHON_CONVEX_HULL_CODE);
    expect(convexHull.code).toContain("def convex_hull(");
  });

  it("teaches the topic through a topicGuide", () => {
    const guide = convexHull.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split(". ").length).toBeGreaterThanOrEqual(3);
      expect(section.body).not.toMatch(/[*#`_]|^- /);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("cross product");
    expect(allText).toContain("collinear");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Lower and upper chain");
  });
});
