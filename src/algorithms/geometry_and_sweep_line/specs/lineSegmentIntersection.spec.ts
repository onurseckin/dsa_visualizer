import { describe, it, expect } from "vitest";
import {
  generateLineSegmentIntersectionSteps,
  lineSegmentIntersection,
  DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT,
} from "../lineSegmentIntersection";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("lineSegmentIntersection algorithm unit tests", () => {
  it("has valid metadata and definitions", () => {
    expect(lineSegmentIntersection.id).toBe("line-segment-intersection");
    expect(lineSegmentIntersection.code).not.toContain("#");
    expect(lineSegmentIntersection.code).not.toContain('"""');
    expect(lineSegmentIntersection.code).not.toContain("'''");
  });

  it("handles standard intersecting segments correctly", () => {
    const input = DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT;
    const steps = generateLineSegmentIntersectionSteps(input);

    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.intersects).toBe(true);
    expect(lastStep.primarySnapshot.kind).toBe("graph");

    const snapshot = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snapshot.nodes.some((n) => n.id === "INT")).toBe(true);
  });

  it("handles non-intersecting parallel segments", () => {
    const input = {
      segment1: { p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } },
      segment2: { p1: { x: 0, y: 50 }, p2: { x: 100, y: 50 } },
    };
    const steps = generateLineSegmentIntersectionSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.intersects).toBe(false);
  });

  it("handles non-intersecting non-parallel segments", () => {
    const input = {
      segment1: { p1: { x: 0, y: 0 }, p2: { x: 100, y: 100 } },
      segment2: { p1: { x: 50, y: 0 }, p2: { x: 150, y: 50 } },
    };
    const steps = generateLineSegmentIntersectionSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.intersects).toBe(false);
  });

  it("handles collinear overlapping segments", () => {
    const input = {
      segment1: { p1: { x: 0, y: 0 }, p2: { x: 100, y: 100 } },
      segment2: { p1: { x: 50, y: 50 }, p2: { x: 150, y: 150 } },
    };
    const steps = generateLineSegmentIntersectionSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.intersects).toBe(true);
  });

  it("handles collinear non-overlapping segments", () => {
    const input = {
      segment1: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
      segment2: { p1: { x: 20, y: 20 }, p2: { x: 30, y: 30 } },
    };
    const steps = generateLineSegmentIntersectionSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.intersects).toBe(false);
  });

  it("ensures all steps have valid graph visual snapshot kinds", () => {
    const steps = generateLineSegmentIntersectionSteps(DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT);
    for (const step of steps) {
      expect(step.primarySnapshot.kind).toBe("graph");
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
    }
  });
});
