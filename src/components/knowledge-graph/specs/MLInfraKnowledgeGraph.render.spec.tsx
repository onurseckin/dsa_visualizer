import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MLInfraKnowledgeGraph, TOPIC_CLUSTERS } from "../MLInfraKnowledgeGraph";

describe("MLInfraKnowledgeGraph Component Render Spec", () => {
  it("renders full-screen edge-to-edge container without top title banner", () => {
    render(<MLInfraKnowledgeGraph />);

    const rootRegion = screen.getByRole("region", {
      name: /ML Infrastructure Knowledge Tree/i,
    });
    expect(rootRegion).toBeInTheDocument();
    expect(rootRegion.className).toContain("h-[calc(100vh-3.5rem)]");

    // Top title header, search bar, and topic pills are removed
    expect(
      screen.queryByText(/ML Infrastructure & AI Systems Knowledge Tree/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search 13 topics/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All Topics" })).not.toBeInTheDocument();
  });

  it("adheres strictly to Canvas Law with width 100%, height 100%, and viewBox", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);

    const svgs = container.querySelectorAll("svg");
    const canvasSvg = Array.from(svgs).find((s) => s.getAttribute("width") === "100%");
    expect(canvasSvg).toBeInTheDocument();
    expect(canvasSvg?.getAttribute("height")).toBe("100%");
    expect(canvasSvg?.getAttribute("viewBox")).toBeTruthy();
  });

  it("renders centered nodes for all 13 topic clusters with clean title and subtitle without lightning icon or tier labels", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(TOPIC_CLUSTERS.length).toBe(13);

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

    // Verify removal of lightning icons ⚡ and Tier 1 / Tier 2 labels from canvas nodes
    const nodeTexts = screen.getAllByRole("button").map((btn) => btn.textContent || "");
    nodeTexts.forEach((text) => {
      expect(text).not.toContain("⚡");
      expect(text).not.toMatch(/Tier \d/i);
    });
  });

  it("renders 90-degree orthogonal connectors between prerequisite topics", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);

    const connectorGroup = container.querySelector(".connectors");
    expect(connectorGroup).toBeInTheDocument();

    const paths = connectorGroup?.querySelectorAll("path");
    expect(paths && paths.length).toBeGreaterThan(0);

    // Verify orthogonal line command pattern M startX startY L startX midY L endX midY L endX endY
    paths?.forEach((path) => {
      const d = path.getAttribute("d") || "";
      expect(d).toMatch(/^M\s+[\d.]+\s+[\d.]+\s+L\s+[\d.]+\s+[\d.]+\s+L\s+[\d.]+\s+[\d.]+\s+L\s+[\d.]+\s+[\d.]+$/);
    });
  });

  it("opens slide-over topic sidebar drawer on node click and lists inner questions with difficulty and type badges", () => {
    const onSelectCategoryFolder = vi.fn();
    render(<MLInfraKnowledgeGraph onSelectCategoryFolder={onSelectCategoryFolder} />);

    const tensorNode = screen.getByRole("button", { name: /Tensor Algebra & Memory Layout/i });
    fireEvent.click(tensorNode);

    expect(onSelectCategoryFolder).toHaveBeenCalledWith("ml_tensor_algebra");

    const drawer = screen.getByRole("dialog", { name: /Tensor Algebra & Memory Layout Drawer/i });
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
