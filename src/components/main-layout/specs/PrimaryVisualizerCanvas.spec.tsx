import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PrimaryVisualizerCanvas } from "../components/PrimaryVisualizerCanvas";
import { AlgorithmStep } from "../../../types/dsa";

const makeStepWithKind = (snapshot: AlgorithmStep["primarySnapshot"]): AlgorithmStep => ({
  stepIndex: 0,
  codeLine: 1,
  explanation: { what: "test", why: "test" },
  primarySnapshot: snapshot,
  auxiliaryState: {},
  variables: {},
});

describe("PrimaryVisualizerCanvas render spec", () => {
  it("renders ArrayVisualizer for array snapshot", () => {
    const step = makeStepWithKind({
      kind: "array",
      elements: [{ id: "1", value: 10, state: "default" }],
    });
    render(<PrimaryVisualizerCanvas currentStep={step} resolvedControlProps={null} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders GridVisualizer for grid snapshot", () => {
    const step = makeStepWithKind({
      kind: "grid",
      grid: [[{ row: 0, col: 0, isStart: true, state: "default" }]],
    });
    const { container } = render(
      <PrimaryVisualizerCanvas currentStep={step} resolvedControlProps={null} />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("title")?.textContent).toBe("Row 0, Col 0");
  });

  it("renders GraphVisualizer for graph snapshot", () => {
    const step = makeStepWithKind({
      kind: "graph",
      nodes: [{ id: "n1", label: "Node 1", state: "default" }],
      edges: [],
    });
    render(<PrimaryVisualizerCanvas currentStep={step} resolvedControlProps={null} />);
    expect(screen.getByText("Node 1")).toBeInTheDocument();
  });

  it("renders TreeVisualizer for tree snapshot", () => {
    const step = makeStepWithKind({
      kind: "tree",
      rootId: "root",
      nodes: [{ id: "root", val: 99, state: "default" }],
    });
    render(<PrimaryVisualizerCanvas currentStep={step} resolvedControlProps={null} />);
    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("renders empty fallback when currentStep or primarySnapshot is missing", () => {
    render(<PrimaryVisualizerCanvas currentStep={null} resolvedControlProps={null} />);
    expect(screen.getByText("No visual snapshot available")).toBeInTheDocument();
    expect(
      screen.getByText("Select an algorithm step or click Play to begin visualization."),
    ).toBeInTheDocument();
  });

  it("renders embedded ControlPanel when resolvedControlProps is provided", () => {
    const controlProps = {
      isPlaying: false,
      onPlayPause: vi.fn(),
      onStepBack: vi.fn(),
      onStepForward: vi.fn(),
      onReset: vi.fn(),
      currentStep: 0,
      totalSteps: 5,
      speed: 300,
      onSpeedChange: vi.fn(),
      dataSize: 10,
      onDataSizeChange: vi.fn(),
      onGenerateRandom: vi.fn(),
      supportsCustomSize: false,
    };

    const { container } = render(
      <PrimaryVisualizerCanvas currentStep={null} resolvedControlProps={controlProps} />,
    );
    expect(container.querySelector('[data-region="controls"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: /Play|Pause/i })).toBeInTheDocument();
  });

  it("renders fallback when primarySnapshot has an unrecognized kind", () => {
    const step = makeStepWithKind({
      kind: "invalid-kind",
    } as unknown as AlgorithmStep["primarySnapshot"]);

    render(<PrimaryVisualizerCanvas currentStep={step} resolvedControlProps={null} />);
    expect(screen.getByText("No visual snapshot available")).toBeInTheDocument();
  });
});
