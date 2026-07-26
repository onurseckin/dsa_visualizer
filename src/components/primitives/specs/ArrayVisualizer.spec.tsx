import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ArrayVisualizer from "../ArrayVisualizer";
import type { ArrayElement } from "../../../types/dsa";

describe("ArrayVisualizer Spec", () => {
  const sampleElements: ArrayElement[] = [
    { id: "1", value: 15, state: "default", pointers: ["i", "left"] },
    { id: "2", value: 42, state: "active", pointers: ["j"] },
    { id: "3", value: 8, state: "sorted" },
  ];

  it("renders elements in bar mode with title and pointers", () => {
    render(<ArrayVisualizer elements={sampleElements} title="Sample Array" mode="bar" />);

    expect(screen.getByText("Sample Array")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("[0]")).toBeInTheDocument();
    expect(screen.getByText("[1]")).toBeInTheDocument();
    expect(screen.getByText("[2]")).toBeInTheDocument();
    expect(screen.getByText("i")).toBeInTheDocument();
    expect(screen.getByText("left")).toBeInTheDocument();
    expect(screen.getByText("j")).toBeInTheDocument();
  });

  it("renders elements in box mode", () => {
    render(<ArrayVisualizer elements={sampleElements} mode="box" />);

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("handles empty elements list without title", () => {
    const { container } = render(<ArrayVisualizer elements={[]} />);

    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("Sample Array")).toBeNull();
  });

  it("handles elements without explicit id by generating index keys", () => {
    const elementsWithoutId: ArrayElement[] = [
      { id: "", value: 100, state: "default" },
      { id: "", value: 200, state: "active" },
    ];

    render(<ArrayVisualizer elements={elementsWithoutId} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });
});
