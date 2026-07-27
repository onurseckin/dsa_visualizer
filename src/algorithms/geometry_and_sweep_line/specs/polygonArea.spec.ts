import { describe, expect, it } from "vitest";
import {
  polygonArea,
  DEFAULT_POLYGON_AREA_INPUT,
  generatePolygonAreaSteps,
  PYTHON_POLYGON_AREA_CODE,
} from "../polygonArea";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("polygonArea spec logic", () => {
  it("has category geometry_and_sweep_line and valid metadata", () => {
    expect(polygonArea.id).toBe("polygon-area");
    expect(polygonArea.category).toBe("geometry_and_sweep_line");
    expect(polygonArea.defaultInput).toEqual(DEFAULT_POLYGON_AREA_INPUT);
    expect(polygonArea.code).toBe(PYTHON_POLYGON_AREA_CODE);
  });

  it("generates correct steps for default polygon input", () => {
    const steps = generatePolygonAreaSteps(DEFAULT_POLYGON_AREA_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snap.kind).toBe("graph");
    expect(lastStep.variables.final_area).toBe(50000);
  });

  it("handles square input correctly", () => {
    const squareInput = {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
    };
    const steps = generatePolygonAreaSteps(squareInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.final_area).toBe(100);
  });

  it("returns area 0 for less than 3 points", () => {
    const invalidInput = {
      points: [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ],
    };
    const steps = generatePolygonAreaSteps(invalidInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.area).toBe(0);

    const stepsOne = generatePolygonAreaSteps({ points: [{ x: 0, y: 0 }] });
    expect(stepsOne[stepsOne.length - 1].variables.area).toBe(0);
  });

  it("teaches the topic through a topicGuide", () => {
    const guide = polygonArea.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split(". ").length).toBeGreaterThanOrEqual(3);
      expect(section.body).not.toMatch(/[*#`_]|^- /);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("signed area");
    expect(allText).toContain("simple polygon");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Winding order");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(polygonArea.examples).toHaveLength(3);
    expect(polygonArea.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);
    expect(polygonArea.examples?.map((ex) => ex.title)).toEqual([
      "Basic Example",
      "Complex Edge Case",
      "Failing / Boundary Case",
    ]);

    for (const example of polygonArea.examples!) {
      const steps = polygonArea.generateSteps(example.input as { points: Array<{ x: number; y: number }> });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
