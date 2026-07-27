import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComplexityCard } from "../../ui";

describe("ComplexityCard render spec", () => {
  it("renders time/space complexity and analysis", () => {
    render(
      <ComplexityCard
        timeComplexity={{ best: "O(1)", average: "O(N)", worst: "O(N^2)" }}
        spaceComplexity="O(1)"
        complexityAnalysis={{ time: "Iterates once per item", space: "In-place memory" }}
        variableState={{ i: 5, target: 10 }}
      />,
    );
    expect(screen.getByText("Complexity")).toBeInTheDocument();
    expect(screen.getAllByText("O(1)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("O(N^2)")).toBeInTheDocument();
    expect(screen.getByText("Iterates once per item")).toBeInTheDocument();
    expect(screen.getByText("target")).toBeInTheDocument();
  });
});
