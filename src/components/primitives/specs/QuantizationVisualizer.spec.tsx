import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuantizationVisualizer } from "../QuantizationVisualizer";

describe("QuantizationVisualizer", () => {
  it("renders quantization metadata and gives each bit state its semantic visual treatment", () => {
    const { container } = render(
      <QuantizationVisualizer
        title="INT8 quantization"
        originalValue={1.25}
        scale={0.1}
        zeroPoint={128}
        quantizedValue={141}
        bits={[
          { index: 0, value: 0, label: "sign", state: "sign" },
          { index: 1, value: 1, label: "exp", state: "exponent" },
          { index: 2, value: 1, label: "mantissa", state: "mantissa" },
          { index: 3, value: 0, label: "active", state: "active" },
          { index: 4, value: 1, label: "quantized", state: "quantized" },
          { index: 5, value: 0, label: "default" },
        ]}
      />,
    );

    expect(screen.getByText("INT8 quantization")).toBeInTheDocument();
    expect(screen.getByText("Original Float:")).toBeInTheDocument();
    expect(screen.getByText("Scale (S):")).toBeInTheDocument();
    expect(screen.getByText("Zero-Point (Z):")).toBeInTheDocument();
    expect(screen.getByText("Quantized Int:")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 800 450");

    const boxes = container.querySelectorAll("svg rect");
    expect(boxes).toHaveLength(6);
    expect(boxes[0]).toHaveAttribute("fill", "rgba(239, 68, 68, 0.25)");
    expect(boxes[0]).toHaveAttribute("stroke", "#ef4444");
    expect(boxes[1]).toHaveAttribute("fill", "rgba(59, 130, 246, 0.25)");
    expect(boxes[1]).toHaveAttribute("stroke", "var(--accent)");
    expect(boxes[2]).toHaveAttribute("fill", "rgba(16, 185, 129, 0.25)");
    expect(boxes[2]).toHaveAttribute("stroke", "#10b981");
    expect(boxes[3]).toHaveAttribute("fill", "rgba(245, 158, 11, 0.25)");
    expect(boxes[4]).toHaveAttribute("stroke", "#f59e0b");
    expect(boxes[5]).toHaveAttribute("fill", "var(--bg-surface)");
    expect(boxes[5]).toHaveAttribute("stroke", "var(--border-default)");
  });

  it("keeps an empty bit representation renderable without optional metadata", () => {
    const { container } = render(<QuantizationVisualizer bits={[]} />);

    expect(screen.getByTestId("canvas-container")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 800 450");
    expect(container.querySelectorAll("svg rect")).toHaveLength(0);
    expect(screen.queryByText("Original Float:")).not.toBeInTheDocument();
    expect(screen.queryByText("Quantized Int:")).not.toBeInTheDocument();
  });
});
