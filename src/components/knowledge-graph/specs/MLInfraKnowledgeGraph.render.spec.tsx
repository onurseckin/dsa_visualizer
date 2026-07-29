import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MLInfraKnowledgeGraph, ML_INFRA_TREE_PLACEMENTS } from "../MLInfraKnowledgeGraph";

const originalResizeObserver = window.ResizeObserver;

afterEach(() => {
  window.ResizeObserver = originalResizeObserver;
  vi.restoreAllMocks();
});

describe("MLInfraKnowledgeGraph Component Render Spec", () => {
  it("renders the lifecycle-first family legend", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(
      screen.getByRole("region", { name: /ML Infrastructure Knowledge Tree/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /Topic family colors/i })).toBeInTheDocument();
    expect(screen.getByText("Foundations")).toBeInTheDocument();
    expect(screen.getByText("Training & Data Lifecycle")).toBeInTheDocument();
    expect(screen.getByText("Production Systems")).toBeInTheDocument();
    expect(screen.getByText("Operations & Governance")).toBeInTheDocument();
    expect(screen.getByText("Capstone")).toBeInTheDocument();
    expect(screen.getByText("Advanced Electives")).toBeInTheDocument();
  });

  it("uses the measured canvas box for the SVG viewBox", () => {
    const widthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
    const heightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get: () => 960,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get: () => 720,
    });
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }));

    try {
      const { container } = render(<MLInfraKnowledgeGraph />);
      const canvasSvg = container.querySelector("svg");

      expect(canvasSvg).toHaveAttribute("width", "100%");
      expect(canvasSvg).toHaveAttribute("height", "100%");
      expect(canvasSvg).toHaveAttribute("viewBox", "0 0 960 720");
    } finally {
      if (widthDescriptor) {
        Object.defineProperty(HTMLElement.prototype, "clientWidth", widthDescriptor);
      } else {
        delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
      }
      if (heightDescriptor) {
        Object.defineProperty(HTMLElement.prototype, "clientHeight", heightDescriptor);
      } else {
        delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
      }
    }
  });

  it("renders all 23 target topic nodes and no transitional legacy nodes", () => {
    render(<MLInfraKnowledgeGraph />);

    expect(ML_INFRA_TREE_PLACEMENTS).toHaveLength(23);
    expect(
      screen.getByRole("button", { name: /Python, Environments & Scientific Computing/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /End-to-End ML Platform Capstone/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Accelerator Performance, Roofline & Kernel Fundamentals/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /FlashAttention & Triton Hardware Kernels/i }),
    ).not.toBeInTheDocument();
  });

  it("renders cubic connectors for every authored prerequisite edge", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);
    const paths = container.querySelector(".connectors")?.querySelectorAll("path");
    const expectedEdgeCount = ML_INFRA_TREE_PLACEMENTS.reduce(
      (count, placement) => count + placement.prerequisites.length,
      0,
    );

    expect(paths).toHaveLength(expectedEdgeCount);
    paths?.forEach((path) => {
      expect(path.getAttribute("d") ?? "").toMatch(
        /^M\s+[\d.]+\s+[\d.]+\s+C\s+[\d.]+\s+[\d.]+,\s+[\d.]+\s+[\d.]+,\s+[\d.]+\s+[\d.]+$/,
      );
    });
  });

  it("opens and closes a target topic drawer and reports its canonical topic ID", () => {
    const onSelectTopic = vi.fn();
    render(<MLInfraKnowledgeGraph onSelectTopic={onSelectTopic} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Python, Environments & Scientific Computing/i,
      }),
    );

    expect(onSelectTopic).toHaveBeenCalledWith("ml_python_scientific_computing");
    expect(
      screen.getByRole("dialog", {
        name: /Python, Environments & Scientific Computing Drawer/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Curated Problems (0)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Topic Drawer" }));
    expect(
      screen.queryByRole("dialog", {
        name: /Python, Environments & Scientific Computing Drawer/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("supports keyboard selection and the drawer topic action", () => {
    const onSelectTopic = vi.fn();
    render(<MLInfraKnowledgeGraph onSelectTopic={onSelectTopic} />);
    const node = screen.getByRole("button", {
      name: /ML Problem Framing & Success Metrics/i,
    });

    fireEvent.keyDown(node, { key: "Enter" });
    fireEvent.click(
      screen.getByRole("button", {
        name: /View ML Problem Framing & Success Metrics Problems in Problem List/i,
      }),
    );

    expect(onSelectTopic).toHaveBeenNthCalledWith(1, "ml_problem_framing");
    expect(onSelectTopic).toHaveBeenNthCalledWith(2, "ml_problem_framing");
  });

  it("tracks pointer and focus states without changing node geometry", () => {
    const { container } = render(<MLInfraKnowledgeGraph />);
    const node = screen.getByRole("button", {
      name: /Inference Deployment & Serving Reliability/i,
    });
    const transform = node.getAttribute("transform");

    fireEvent.mouseEnter(node);
    expect(node).toHaveClass("scale-[1.02]");
    fireEvent.mouseLeave(node);
    expect(node).not.toHaveClass("scale-[1.02]");
    fireEvent.focus(node);
    expect(node).toHaveClass("scale-[1.02]");
    fireEvent.blur(node);
    expect(node).not.toHaveClass("scale-[1.02]");
    expect(node).toHaveAttribute("transform", transform);
    expect(container.querySelector(".nodes")).toContainElement(node);
  });
});
