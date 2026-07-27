import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProblemExamplesCard } from "../../ui";
import { ProblemExample } from "../../types/dsa";

describe("ProblemExamplesCard Component Spec", () => {
  const dummyExamples: ProblemExample[] = [
    {
      id: "example-0",
      input: "arr = [5, 2, 8, 1, 4]",
      output: "[1, 2, 4, 5, 8]",
      explanation: "Swaps inverted pairs until sorted",
    },
    {
      id: "example-1",
      input: "arr = [3, 2, 1]",
      output: "[1, 2, 3]",
      explanation: "Reverse sorted array",
    },
  ];

  it("renders null when examples array is empty or undefined", () => {
    const { container } = render(<ProblemExamplesCard examples={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders example cards when examples are provided", () => {
    render(<ProblemExamplesCard examples={dummyExamples} selectedExampleId="example-0" />);

    expect(screen.getByTestId("problem-examples-card")).toBeInTheDocument();
    const cards = screen.getAllByTestId("problem-example-card");
    expect(cards).toHaveLength(2);

    expect(cards[0]).toHaveAttribute("data-selected", "true");
    expect(cards[1]).toHaveAttribute("data-selected", "false");
    expect(cards[0]).toHaveTextContent("arr = [5, 2, 8, 1, 4]");
    expect(cards[1]).toHaveTextContent("arr = [3, 2, 1]");
  });

  it("triggers onSelectExample callback when an example card is clicked", () => {
    const onSelect = vi.fn();
    render(
      <ProblemExamplesCard
        examples={dummyExamples}
        selectedExampleId="example-0"
        onSelectExample={onSelect}
      />,
    );

    const cards = screen.getAllByTestId("problem-example-card");
    fireEvent.click(cards[1]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(dummyExamples[1], 1);
  });
});
