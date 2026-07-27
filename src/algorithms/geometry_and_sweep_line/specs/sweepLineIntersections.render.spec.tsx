import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GraphVisualizer from "../../../components/primitives/GraphVisualizer";
import {
  generateSweepLineIntersectionsSteps,
  DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT,
} from "../sweepLineIntersections";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("sweepLineIntersections React component spec", () => {
  it("renders GraphVisualizer with sweep line snapshot", () => {
    const steps = generateSweepLineIntersectionsSteps(DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT);
    const snapshot = steps[0].primarySnapshot as GraphVisualSnapshot;

    render(
      <GraphVisualizer
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        title="Sweep Line Segment Intersections"
      />,
    );

    expect(screen.getByText("Sweep Line Segment Intersections")).toBeInTheDocument();
  });

  it("completes sweep line step generation without crashing", () => {
    const steps = generateSweepLineIntersectionsSteps(DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT);
    expect(steps.length).toBeGreaterThan(1);
  });
});
