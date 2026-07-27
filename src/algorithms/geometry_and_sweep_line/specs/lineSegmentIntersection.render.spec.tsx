import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GraphVisualizer from "../../../components/primitives/GraphVisualizer";
import { generateLineSegmentIntersectionSteps, DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT } from "../lineSegmentIntersection";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("lineSegmentIntersection React component spec", () => {
  it("renders GraphVisualizer with generated segment snapshot", () => {
    const steps = generateLineSegmentIntersectionSteps(DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT);
    const snapshot = steps[0].primarySnapshot as GraphVisualSnapshot;

    render(<GraphVisualizer nodes={snapshot.nodes} edges={snapshot.edges} title="Line Segment Intersection" />);

    expect(screen.getByText("Line Segment Intersection")).toBeInTheDocument();
  });

  it("evaluates intersection cleanly without crashing", () => {
    const steps = generateLineSegmentIntersectionSteps(DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT);
    expect(steps.length).toBeGreaterThan(1);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.intersects).toBe(true);
  });
});
