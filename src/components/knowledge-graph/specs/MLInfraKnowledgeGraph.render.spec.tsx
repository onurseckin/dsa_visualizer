import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MLInfraKnowledgeGraph, ML_INFRA_NODES } from "../MLInfraKnowledgeGraph";

describe("MLInfraKnowledgeGraph Component Render Spec", () => {
  it("renders knowledge graph container with topic family legend", () => {
    render(<MLInfraKnowledgeGraph />);

    const rootRegion = screen.getByRole("region", {
      name: /ML Infrastructure Knowledge Tree/i,
    });
    expect(rootRegion).toBeInTheDocument();

    const legend = screen.getByRole("list", { name: /Topic family colors/i });
    expect(legend).toBeInTheDocument();
    expect(screen.getByText("Foundations")).toBeInTheDocument();
    expect(screen.getByText("Core Math & DAGs")).toBeInTheDocument();
    expect(screen.getByText("Advanced Kernels")).toBeInTheDocument();
  });

  it("adheres strictly to Canvas Law with width 100%, height 100%, and viewBox", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);

    const svgs = container.querySelectorAll("svg");
    const canvasSvg = Array.from(svgs).find((s) => s.getAttribute("width") === "100%");
    expect(canvasSvg).toBeInTheDocument();
    expect(canvasSvg?.getAttribute("height")).toBe("100%");
    expect(canvasSvg?.getAttribute("viewBox")).toBe("-20 -60 1380 1060");
  });

  it("renders nodes for all 13 topic clusters with clean title and subtitle", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(ML_INFRA_NODES.length).toBe(13);

    // Verify presence of nodes by title
    expect(
      screen.getByRole("button", { name: /Tensor Algebra & Memory Layout/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Autograd & Computational DAGs/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hardware Kernels & Fusion/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /LLM Serving & Continuous Batching/i }),
    ).toBeInTheDocument();

    // Verify subtitle pattern: {count} Problems • {difficulty}
    expect(screen.getByText(/4 Problems • Medium/i)).toBeInTheDocument();
  });

  it("renders smooth cubic bezier curve connectors between prerequisite topics", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);

    const connectorGroup = container.querySelector(".connectors");
    expect(connectorGroup).toBeInTheDocument();

    const paths = connectorGroup?.querySelectorAll("path");
    expect(paths && paths.length).toBeGreaterThan(0);

    // Verify cubic bezier command pattern M startX startY C startX midY, endX midY, endX endY
    paths?.forEach((path) => {
      const d = path.getAttribute("d") || "";
      expect(d).toMatch(
        /^M\s+[\d.]+\s+[\d.]+\s+C\s+[\d.]+\s+[\d.]+,\s+[\d.]+\s+[\d.]+,\s+[\d.]+\s+[\d.]+$/,
      );
    });
  });

  it("calculates dynamic node widths based on title length and centers text elements", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);

    const nodesGroup = container.querySelector(".nodes");
    expect(nodesGroup).toBeInTheDocument();

    ML_INFRA_NODES.forEach((node) => {
      const expectedWidth = Math.max(190, node.title.length * 8.5 + 40);
      const expectedTransform = `translate(${node.x - expectedWidth / 2}, ${node.y - 32})`;

      // Find the g element for this node title
      const titleElement = screen.getByText(node.title);
      const gElement = titleElement.closest("g");
      expect(gElement).not.toBeNull();
      expect(gElement?.getAttribute("transform")).toBe(expectedTransform);

      const rectElement = gElement?.querySelector("rect");
      expect(rectElement?.getAttribute("width")).toBe(String(expectedWidth));

      const textElements = gElement?.querySelectorAll("text");
      textElements?.forEach((textEl) => {
        expect(textEl.getAttribute("x")).toBe(String(expectedWidth / 2));
      });
    });
  });

  it("opens slide-over topic sidebar drawer on node click and lists inner questions with difficulty and type badges", () => {
    const onSelectCategoryFolder = vi.fn();
    render(<MLInfraKnowledgeGraph onSelectCategoryFolder={onSelectCategoryFolder} />);

    const tensorNode = screen.getByRole("button", { name: /Tensor Algebra & Memory Layout/i });
    fireEvent.click(tensorNode);

    expect(onSelectCategoryFolder).toHaveBeenCalledWith("ml_tensor_algebra");

    const drawer = screen.getByRole("dialog", {
      name: /Tensor Algebra & Memory Layout Drawer/i,
    });
    expect(drawer).toBeInTheDocument();

    expect(screen.getByText(/2D Matrix Memory Traversal/i)).toBeInTheDocument();
    expect(screen.getByText(/Strided Index Arithmetic/i)).toBeInTheDocument();
    expect(screen.getByText(/Tensor Stride & Offset Layout/i)).toBeInTheDocument();
    expect(screen.getByText(/Tensor Contiguity & Zero-Copy Reshape/i)).toBeInTheDocument();

    expect(screen.getAllByText(/Foundational Math & DSA/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ML Systems Implementation/i).length).toBeGreaterThan(0);

    expect(
      screen.getByRole("button", { name: /Visualize tensor-stride-offset in Workspace →/i }),
    ).toBeInTheDocument();
  });

  it("navigates to workspace when clicking question action button inside drawer", () => {
    const onNavigateToAlgorithm = vi.fn();
    render(<MLInfraKnowledgeGraph onNavigateToAlgorithm={onNavigateToAlgorithm} />);

    const tensorNode = screen.getByRole("button", { name: /Tensor Algebra & Memory Layout/i });
    fireEvent.click(tensorNode);

    const visButton = screen.getByRole("button", {
      name: /Visualize tensor-stride-offset in Workspace →/i,
    });
    fireEvent.click(visButton);

    expect(onNavigateToAlgorithm).toHaveBeenCalledWith("tensor-stride-offset");
  });

  it("closes slide-over topic sidebar drawer when close button is clicked", () => {
    render(<MLInfraKnowledgeGraph />);

    const tensorNode = screen.getByRole("button", { name: /Tensor Algebra & Memory Layout/i });
    fireEvent.click(tensorNode);

    expect(
      screen.getByRole("dialog", { name: /Tensor Algebra & Memory Layout Drawer/i }),
    ).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "Close Topic Drawer" });
    fireEvent.click(closeButton);

    expect(
      screen.queryByRole("dialog", { name: /Tensor Algebra & Memory Layout Drawer/i }),
    ).not.toBeInTheDocument();
  });
});
