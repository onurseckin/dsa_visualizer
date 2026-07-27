import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GraphVisualizer from "../../../components/primitives/GraphVisualizer";
import {
  generateClosestPairOfPointsSteps,
  DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT,
} from "../closestPairOfPoints";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("closestPairOfPoints React component spec", () => {
  it("renders GraphVisualizer with closest pair snapshot", () => {
    const steps = generateClosestPairOfPointsSteps(DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT);
    const snapshot = steps[0].primarySnapshot as GraphVisualSnapshot;

    render(
      <GraphVisualizer
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        title="Closest Pair of Points via Sweep Line"
      />,
    );

    expect(screen.getByText("Closest Pair of Points via Sweep Line")).toBeInTheDocument();
  });

  it("calculates minimum distance cleanly without crashing", () => {
    const steps = generateClosestPairOfPointsSteps(DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT);
    expect(steps.length).toBeGreaterThan(1);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.minDist).toBeGreaterThan(0);
  });
});
