import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MLInfraKnowledgeGraph, ML_INFRA_NODES } from "../MLInfraKnowledgeGraph";

describe("MLInfraKnowledgeGraph Component Spec", () => {
  it("renders 100% full-screen canvas container, header title, and 28 topics badge", () => {
    render(<MLInfraKnowledgeGraph />);

    const rootRegion = screen.getByRole("region", {
      name: /ML Infrastructure & AI Systems Knowledge Tree/i,
    });
    expect(rootRegion).toBeInTheDocument();
    expect(rootRegion.className).toContain("h-[calc(100vh-3.5rem)]");

    expect(
      screen.getByText(/ML Infrastructure & AI Systems Knowledge Tree/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/28 Topics & Algorithms/i)).toBeInTheDocument();
  });

  it("renders real-time search input and zoom/pan control buttons", () => {
    render(<MLInfraKnowledgeGraph />);

    const searchInput = screen.getByPlaceholderText(/Search 28 ML infra topics/i);
    expect(searchInput).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Zoom In" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom Out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Zoom and Pan" })).toBeInTheDocument();
  });

  it("renders topic filter pills including all 12 ML Systems Topics", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(screen.getByRole("button", { name: "All Topics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tensor Algebra & Strides" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GEMM & Roofline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Autograd & DAGs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Precision & Quantization" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vector Search" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tokenization & Tries" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tree Ensembles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convolutions & im2col" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recurrent Gates" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Attention & RoPE" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hardware Kernels" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Distributed Systems" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "LLM Serving" })).toBeInTheDocument();
  });

  it("renders all 28 ML Infrastructure algorithm nodes in the SVG canvas", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(ML_INFRA_NODES.length).toBe(28);

    expect(screen.getByRole("button", { name: /Tensor Stride & Offset Layout/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Autograd VJP DAG/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /FlashAttention IO Tiling/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuous Batching Scheduler/i })).toBeInTheDocument();
  });

  it("filters nodes in real-time when typing in the search input", () => {
    render(<MLInfraKnowledgeGraph />);

    const searchInput = screen.getByPlaceholderText(/Search 28 ML infra topics/i);
    fireEvent.change(searchInput, { target: { value: "FlashAttention" } });

    expect(searchInput).toHaveValue("FlashAttention");
  });

  it("updates selected topic when clicking a filter pill", () => {
    render(<MLInfraKnowledgeGraph />);

    const attentionPill = screen.getByRole("button", { name: "Attention & RoPE" });
    fireEvent.click(attentionPill);

    expect(attentionPill).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All Topics" })).toHaveAttribute("aria-pressed", "false");
  });

  it("resets zoom, pan, search, and topic filter when Reset button is clicked", () => {
    render(<MLInfraKnowledgeGraph />);

    const searchInput = screen.getByPlaceholderText(/Search 28 ML infra topics/i);
    fireEvent.change(searchInput, { target: { value: "Quantization" } });

    const vectorSearchPill = screen.getByRole("button", { name: "Vector Search" });
    fireEvent.click(vectorSearchPill);

    const resetButton = screen.getByRole("button", { name: "Reset Zoom and Pan" });
    fireEvent.click(resetButton);

    expect(searchInput).toHaveValue("");
    expect(screen.getByRole("button", { name: "All Topics" })).toHaveAttribute("aria-pressed", "true");
  });

  it("displays node hover details card with prerequisites, core concepts, and key equations", () => {
    render(<MLInfraKnowledgeGraph />);

    const flashNode = screen.getByRole("button", { name: /FlashAttention IO Tiling/i });
    fireEvent.mouseEnter(flashNode);

    expect(screen.getAllByText(/FlashAttention IO Tiling/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/IO-Aware SRAM Tiling/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero HBM Intermediate Write/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualize flash-attention-tiling in Workspace →/i)).toBeInTheDocument();
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

    const tensorNode = screen.getByRole("button", { name: /Tensor Stride & Offset Layout/i });

    fireEvent.click(tensorNode);
    expect(onNavigateToAlgorithm).toHaveBeenLastCalledWith("tensor-stride-offset");

    fireEvent.keyDown(tensorNode, { key: "Enter" });
    expect(onNavigateToAlgorithm).toHaveBeenLastCalledWith("tensor-stride-offset");

    fireEvent.keyDown(tensorNode, { key: " " });
    expect(onNavigateToAlgorithm).toHaveBeenLastCalledWith("tensor-stride-offset");
  });

  it("follows Canvas Law with 100% width and height and boxViewBoxAttr", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);

    const svgs = container.querySelectorAll("svg");
    const canvasSvg = Array.from(svgs).find((s) => s.getAttribute("width") === "100%");
    expect(canvasSvg).toBeInTheDocument();
    expect(canvasSvg?.getAttribute("height")).toBe("100%");
    expect(canvasSvg?.getAttribute("viewBox")).toBeTruthy();
  });
});
