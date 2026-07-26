import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GraphVisualizer from "../../../components/primitives/GraphVisualizer";
import { generatePolygonAreaSteps, DEFAULT_POLYGON_AREA_INPUT } from "../polygonArea";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("polygonArea React component spec", () => {
  it("renders GraphVisualizer with polygon area graph snapshot", () => {
    const steps = generatePolygonAreaSteps(DEFAULT_POLYGON_AREA_INPUT);
    const snapshot = steps[0].primarySnapshot as GraphVisualSnapshot;

    render(
      <GraphVisualizer
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        title="Polygon Area Visualization"
      />,
    );

    expect(screen.getByText("Polygon Area Visualization")).toBeInTheDocument();
  });

  it("renders completed polygon state without crashing", () => {
    const steps = generatePolygonAreaSteps(DEFAULT_POLYGON_AREA_INPUT);
    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot as GraphVisualSnapshot;

    const { container } = render(<GraphVisualizer nodes={snapshot.nodes} edges={snapshot.edges} />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
