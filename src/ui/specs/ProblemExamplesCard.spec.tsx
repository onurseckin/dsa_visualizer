import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProblemExamplesCard } from "../index";
import type { ProblemExample } from "../../types/dsa";

describe("ProblemExamplesCard component", () => {
  const sampleExamples: ProblemExample[] = [
    {
      id: "example-1",
      title: "Basic Example",
      input: [2, 7, 11, 15],
      inputDisplay: "nums = [2, 7, 11, 15], target = 9",
      outputDisplay: "[0, 1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      kind: "basic",
    },
    {
      id: "example-2",
      title: "Complex Edge Case",
      input: [3, 2, 4],
      inputDisplay: "nums = [3, 2, 4], target = 6",
      outputDisplay: "[1, 2]",
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
      kind: "complex",
    },
    {
      id: "example-3",
      title: "Negative / Boundary Case",
      input: [-1, -8, 0, 5],
      inputDisplay: "nums = [-1, -8, 0, 5], target = -9",
      outputDisplay: "[0, 1]",
      explanation: "Negative numbers handle complementary pairs correctly.",
      kind: "negative",
    },
  ];

  it("renders algorithm example cards with title, input, output, and explanation", () => {
    render(<ProblemExamplesCard examples={sampleExamples} selectedExampleId="example-1" />);

    expect(screen.getByTestId("problem-examples-card")).toBeInTheDocument();
    expect(screen.getByText("Basic Example")).toBeInTheDocument();
    expect(screen.getByText("Complex Edge Case")).toBeInTheDocument();
    expect(screen.getByText("Negative / Boundary Case")).toBeInTheDocument();

    expect(screen.getByText("nums = [2, 7, 11, 15], target = 9")).toBeInTheDocument();
    expect(
      screen.getByText("Because nums[0] + nums[1] == 9, we return [0, 1]."),
    ).toBeInTheDocument();
  });

  it("applies selected card highlight styling on selected card", () => {
    render(<ProblemExamplesCard examples={sampleExamples} selectedExampleId="example-2" />);

    const cards = screen.getAllByTestId("problem-example-card");
    const selectedCard = cards[1];
    const unselectedCard = cards[0];

    expect(selectedCard).toHaveAttribute("data-selected", "true");
    expect(unselectedCard).toHaveAttribute("data-selected", "false");
  });

  it("calls onSelectExample when an example card is clicked", () => {
    const onSelect = vi.fn();
    render(
      <ProblemExamplesCard
        examples={sampleExamples}
        selectedExampleId="example-1"
        onSelectExample={onSelect}
      />,
    );

    const cards = screen.getAllByTestId("problem-example-card");
    fireEvent.click(cards[1]);
    expect(onSelect).toHaveBeenCalledWith(sampleExamples[1], 1);
  });
});
