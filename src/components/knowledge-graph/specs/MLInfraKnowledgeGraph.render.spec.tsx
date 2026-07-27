import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MLInfraKnowledgeGraph } from "../MLInfraKnowledgeGraph";

describe("MLInfraKnowledgeGraph Component Spec", () => {
  it("renders roadmap container title, subtitle, and level filter buttons", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(screen.getByText(/Machine Learning Infrastructure Systems Roadmap/i)).toBeInTheDocument();
    expect(screen.getByText(/10-level hierarchical prerequisite tree/i)).toBeInTheDocument();

    const allFilterButton = screen.getByRole("button", { name: "All Levels" });
    expect(allFilterButton).toBeInTheDocument();
    expect(allFilterButton).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByRole("button", { name: "L1: Memory & Layout" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "L10: LLM Scheduling" })).toBeInTheDocument();
  });

  it("renders all 10 Level nodes and 10 algorithm child nodes in SVG", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(screen.getByRole("button", { name: /Level 1: Memory Layout/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Level 2: Automatic Differentiation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Level 10: LLM Serving/i })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Tensor Stride & Offset/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Autograd VJP DAG/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuous Batching/i })).toBeInTheDocument();
  });

  it("updates active level filter when a filter button is clicked", () => {
    render(<MLInfraKnowledgeGraph />);

    const l2Filter = screen.getByRole("button", { name: "L2: Autograd VJP" });
    fireEvent.click(l2Filter);

    expect(l2Filter).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All Levels" })).toHaveAttribute("aria-pressed", "false");
  });

  it("displays node hover info card with prerequisites, concepts, and key equations", () => {
    render(<MLInfraKnowledgeGraph />);

    const level2Node = screen.getByRole("button", { name: /Level 2: Automatic Differentiation/i });

    fireEvent.mouseEnter(level2Node);

    expect(screen.getAllByText(/Level 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Autograd & DAGs").length).toBeGreaterThan(0);
    expect(screen.getByText(/Reverse-Mode AD/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Vector-Jacobian Product/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/v_x = J_f\^T \\cdot v_y/i)).toBeInTheDocument();
  });

  it("invokes navigation callbacks on node click and keyboard Enter/Space", () => {
    const onSelectCategoryFolder = vi.fn();
    const onNavigateToAlgorithm = vi.fn();

    render(
      <MLInfraKnowledgeGraph
        onSelectCategoryFolder={onSelectCategoryFolder}
        onNavigateToAlgorithm={onNavigateToAlgorithm}
      />
    );

    const tensorNode = screen.getByRole("button", { name: /Tensor Stride & Offset/i });

    fireEvent.click(tensorNode);
    expect(onNavigateToAlgorithm).toHaveBeenLastCalledWith("tensor-stride-offset");

    fireEvent.keyDown(tensorNode, { key: "Enter" });
    expect(onNavigateToAlgorithm).toHaveBeenLastCalledWith("tensor-stride-offset");

    fireEvent.keyDown(tensorNode, { key: " " });
    expect(onNavigateToAlgorithm).toHaveBeenLastCalledWith("tensor-stride-offset");
  });

  it("follows Canvas Law with 100% width and height and boxViewBoxAttr", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("width")).toBe("100%");
    expect(svg?.getAttribute("height")).toBe("100%");
    expect(svg?.getAttribute("viewBox")).toBeTruthy();
  });
});
