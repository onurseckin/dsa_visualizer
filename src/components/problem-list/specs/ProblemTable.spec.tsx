import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProblemTable } from "../../../ui";
import { AlgorithmDefinition } from "../../../types/dsa";

const sampleAlgorithm: AlgorithmDefinition = {
  id: "bubble-sort",
  title: "Bubble Sort",
  category: "arrays_and_hashing",
  difficulty: "Easy",
  description: "Simple comparison sort algorithm",
  timeComplexity: { best: "O(N)", average: "O(N^2)", worst: "O(N^2)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: { time: "", space: "" },
  topicGuide: { overview: "", sections: [], keyTerms: [] },
  defaultInput: { array: [1, 2] },
  code: "def bubble_sort(): pass",
  generateSteps: () => [],
};

const sampleAlgorithmSparse: AlgorithmDefinition = {
  id: "custom-alg",
  title: "Custom Alg",
  category: "two_pointers",
  description: "Sparse complexity algorithm",
  timeComplexity: { best: "", average: "", worst: "" },
  spaceComplexity: "",
  complexityAnalysis: { time: "", space: "" },
  topicGuide: { overview: "", sections: [], keyTerms: [] },
  defaultInput: {},
  code: "def custom(): pass",
  generateSteps: () => [],
};

describe("ProblemTable render spec", () => {
  it("renders table headers and problem row details", () => {
    const onToggleSort = vi.fn();
    const onSelectAlgorithm = vi.fn();

    render(
      <ProblemTable
        filteredAlgorithms={[sampleAlgorithm]}
        sortBy="title"
        onToggleSort={onToggleSort}
        onSelectAlgorithm={onSelectAlgorithm}
      />,
    );

    expect(screen.getByText("Bubble Sort")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("O(N^2)")).toBeInTheDocument();
    expect(screen.getByText("O(1)")).toBeInTheDocument();

    // Clicking header sort button triggers onToggleSort
    fireEvent.click(screen.getByRole("button", { name: "Sort by problem title" }));
    expect(onToggleSort).toHaveBeenCalledWith("title");
  });

  it("renders fallback complexity strings when omitted", () => {
    render(
      <ProblemTable
        filteredAlgorithms={[sampleAlgorithmSparse]}
        sortBy="title"
        onToggleSort={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />,
    );

    expect(screen.getByText("Custom Alg")).toBeInTheDocument();
    expect(screen.getByText("O(N)")).toBeInTheDocument(); // fallback time complexity
    expect(screen.getByText("O(1)")).toBeInTheDocument(); // fallback space complexity
  });

  it("displays empty message when filteredAlgorithms is empty", () => {
    render(
      <ProblemTable
        filteredAlgorithms={[]}
        sortBy="title"
        onToggleSort={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />,
    );

    expect(screen.getByText(/No matching problems found/i)).toBeInTheDocument();
  });

  it("triggers onSelectAlgorithm via row click, visualize button, and keyboard Enter/Space", () => {
    const onSelectAlgorithm = vi.fn();

    render(
      <ProblemTable
        filteredAlgorithms={[sampleAlgorithm]}
        sortBy="title"
        onToggleSort={vi.fn()}
        onSelectAlgorithm={onSelectAlgorithm}
      />,
    );

    const row = screen.getByRole("row", { name: /Open visualization for Bubble Sort/i });

    // Hover and Focus state handlers
    expect(row.className).toContain("hover:bg-[var(--bg-hover)]");

    // Keyboard selection (Enter & Space)
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onSelectAlgorithm).toHaveBeenLastCalledWith("bubble-sort", "arrays_and_hashing");

    fireEvent.keyDown(row, { key: " " });
    expect(onSelectAlgorithm).toHaveBeenLastCalledWith("bubble-sort", "arrays_and_hashing");

    // Visualize button click
    fireEvent.click(screen.getByRole("button", { name: "Visualize" }));
    expect(onSelectAlgorithm).toHaveBeenLastCalledWith("bubble-sort", "arrays_and_hashing");

    // Row click
    fireEvent.click(row);
    expect(onSelectAlgorithm).toHaveBeenLastCalledWith("bubble-sort", "arrays_and_hashing");
  });

  it("renders unknown category fallback label and ignorable keydown event", () => {
    const unknownAlg: AlgorithmDefinition = {
      ...sampleAlgorithm,
      id: "unknown-alg",
      category: "unknown_cat" as unknown as AlgorithmDefinition["category"],
    };

    render(
      <ProblemTable
        filteredAlgorithms={[unknownAlg]}
        sortBy="title"
        onToggleSort={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />,
    );

    expect(screen.getByText("unknown_cat")).toBeInTheDocument();

    const row = screen.getByRole("row", { name: /Open visualization for Bubble Sort/i });
    fireEvent.keyDown(row, { key: "Tab" }); // non-Enter, non-Space key
  });
});
