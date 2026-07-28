import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuxiliaryPanel, hasAuxiliaryContent } from "../../../ui";

describe("hasAuxiliaryContent", () => {
  it("returns false for empty state and variables", () => {
    expect(hasAuxiliaryContent(undefined, undefined)).toBe(false);
    expect(hasAuxiliaryContent({}, {})).toBe(false);
  });

  it("returns true when variables are present", () => {
    expect(hasAuxiliaryContent(undefined, { x: 10 })).toBe(true);
  });

  it("returns true when stack, queue, visited, hashMap, distanceTable or customState are present", () => {
    expect(hasAuxiliaryContent({ stack: [1] }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ queue: ["a"] }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ visited: ["n1"] }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ hashMap: { a: 1 } }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ distanceTable: { n1: 5, n2: Infinity } }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ customState: { mode: "active" } }, undefined)).toBe(true);
  });
});

describe("AuxiliaryPanel", () => {
  it("returns null when no data groups present", () => {
    const { container } = render(<AuxiliaryPanel state={{}} variables={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all data groups and handles onClose", () => {
    render(
      <AuxiliaryPanel
        state={{
          stack: [10, 20],
          queue: ["a", "b"],
          visited: ["v1", "v2"],
          hashMap: { key1: "val1" },
          distanceTable: { n1: 0, n2: Infinity },
          customState: { step: 3 },
        }}
        variables={{ i: 0, found: true }}
      />,
    );

    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
    expect(screen.getByText("Stack")).toBeInTheDocument();
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("Visited (2)")).toBeInTheDocument();
    expect(screen.getByText("Hash map")).toBeInTheDocument();
    expect(screen.getByText("Distances")).toBeInTheDocument();
    expect(screen.getByText("State")).toBeInTheDocument();
    expect(screen.getByText("Variables")).toBeInTheDocument();

    expect(screen.getByText("top")).toBeInTheDocument();
    expect(screen.getByText("front")).toBeInTheDocument();
    expect(screen.getByText("∞")).toBeInTheDocument();
  });

  it("renders correctly when state is present but variables is undefined", () => {
    render(<AuxiliaryPanel state={{ stack: [42] }} />);
    expect(screen.getByText("Stack")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders correctly when state contains finite distances", () => {
    render(<AuxiliaryPanel state={{ distanceTable: { A: 10 } }} />);
    expect(screen.getByText("Distances")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders structured algorithm state without losing nested values", () => {
    render(
      <AuxiliaryPanel
        state={{
          hashMap: { frontier: [1, 2], flags: [true, false] },
          customState: { bounds: { left: 0, right: 3 } },
        }}
        variables={{ candidate: undefined }}
      />,
    );

    expect(screen.getByText("[1, 2]")).toBeInTheDocument();
    expect(screen.getByText("[true, false]")).toBeInTheDocument();
    expect(screen.getByText('{"left": 0, "right": 3}')).toBeInTheDocument();
    expect(screen.getByText("undefined")).toBeInTheDocument();
  });
});
