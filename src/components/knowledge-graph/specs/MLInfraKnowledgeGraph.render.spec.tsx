import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MLInfraKnowledgeGraph, TOPIC_CLUSTERS } from "../MLInfraKnowledgeGraph";

describe("MLInfraKnowledgeGraph Component Render Spec", () => {
  it("renders 100% full-screen canvas container, header title, and 13 topic clusters badge", () => {
    render(<MLInfraKnowledgeGraph />);

    const rootRegion = screen.getByRole("region", {
      name: /ML Infrastructure & AI Systems Knowledge Tree/i,
    });
    expect(rootRegion).toBeInTheDocument();
    expect(rootRegion.className).toContain("h-[calc(100vh-3.5rem)]");

    expect(
      screen.getByText(/ML Infrastructure & AI Systems Knowledge Tree/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/13 Topic Clusters • 38 Curated Problems/i)).toBeInTheDocument();
  });

  it("renders real-time search input and zoom/pan control buttons", () => {
    render(<MLInfraKnowledgeGraph />);

    const searchInput = screen.getByPlaceholderText(/Search 13 topics & 38 questions/i);
    expect(searchInput).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Zoom In" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom Out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Zoom and Pan" })).toBeInTheDocument();
  });

  it("renders topic filter pills for all 13 Topic Clusters plus All Topics", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(screen.getByRole("button", { name: "All Topics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tensor Algebra & Layout" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tokenization & Tries" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GEMM & Roofline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Autograd & DAGs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Precision & Quantization" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vector Search" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tree Ensembles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convolutions & im2col" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recurrent Gates" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Attention & RoPE" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hardware Kernels" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Distributed Systems" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "LLM Serving" })).toBeInTheDocument();
  });

  it("renders all 13 Topic Cluster nodes on the SVG canvas", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(TOPIC_CLUSTERS.length).toBe(13);

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
  });

  it("opens Topic Drawer upon node click and lists inner questions with difficulty and type badges", () => {
    const onSelectCategoryFolder = vi.fn();
    render(<MLInfraKnowledgeGraph onSelectCategoryFolder={onSelectCategoryFolder} />);

    const tensorNode = screen.getByRole("button", { name: /Tensor Algebra & Memory Layout/i });
    fireEvent.click(tensorNode);

    expect(onSelectCategoryFolder).toHaveBeenCalledWith("ml_tensor_algebra");

    const drawer = screen.getByRole("dialog", { name: /Tensor Algebra & Memory Layout Drawer/i });
    expect(drawer).toBeInTheDocument();

    expect(screen.getByText(/Tier 1: Foundations/i)).toBeInTheDocument();
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

  it("filters topic clusters and inner questions when typing in search input", () => {
    render(<MLInfraKnowledgeGraph />);

    const searchInput = screen.getByPlaceholderText(/Search 13 topics & 38 questions/i);
    fireEvent.change(searchInput, { target: { value: "FlashAttention" } });

    expect(searchInput).toHaveValue("FlashAttention");
  });

  it("updates selected topic when clicking filter pills", () => {
    render(<MLInfraKnowledgeGraph />);

    const vectorSearchPill = screen.getByRole("button", { name: "Vector Search" });
    fireEvent.click(vectorSearchPill);

    expect(vectorSearchPill).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All Topics" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("resets zoom, pan, search, topic filter, and closes drawer when Reset button is clicked", () => {
    render(<MLInfraKnowledgeGraph />);

    const tensorNode = screen.getByRole("button", { name: /Tensor Algebra & Memory Layout/i });
    fireEvent.click(tensorNode);

    expect(
      screen.getByRole("dialog", { name: /Tensor Algebra & Memory Layout Drawer/i }),
    ).toBeInTheDocument();

    const resetButton = screen.getByRole("button", { name: "Reset Zoom and Pan" });
    fireEvent.click(resetButton);

    expect(screen.getByRole("button", { name: "All Topics" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("dialog", { name: /Tensor Algebra & Memory Layout Drawer/i }),
    ).not.toBeInTheDocument();
  });

  it("adheres strictly to Canvas Law with width 100%, height 100%, and viewBox", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);

    const svgs = container.querySelectorAll("svg");
    const canvasSvg = Array.from(svgs).find((s) => s.getAttribute("width") === "100%");
    expect(canvasSvg).toBeInTheDocument();
    expect(canvasSvg?.getAttribute("height")).toBe("100%");
    expect(canvasSvg?.getAttribute("viewBox")).toBeTruthy();
  });
});
