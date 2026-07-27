import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProblemListFilterToolbar } from "../../ui/organisms/ProblemListFilterToolbar";

describe("ProblemListFilterToolbar Component Spec", () => {
  const defaultProps = {
    searchTerm: "",
    onSearchTermChange: vi.fn(),
    selectedCategory: "All" as const,
    onCategorySelect: vi.fn(),
    selectedDifficulty: "All" as const,
    onDifficultySelect: vi.fn(),
    selectedSource: "All" as const,
    onSourceSelect: vi.fn(),
    filteredCount: 10,
    stats: { total: 10, easy: 4, medium: 4, hard: 2 },
  };

  it("renders search input, category, difficulty, source select options including ML Infra", () => {
    render(<ProblemListFilterToolbar {...defaultProps} />);

    expect(screen.getByRole("textbox", { name: /Filter problems/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Filter by Category/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Filter by Difficulty/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Filter by Source/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter by ML Infra/i })).toBeInTheDocument();
  });

  it("calls onSourceSelect when ML Infra option is chosen in dropdown or clicked via toggle button", () => {
    const onSourceSelectMock = vi.fn();
    render(
      <ProblemListFilterToolbar
        {...defaultProps}
        onSourceSelect={onSourceSelectMock}
      />,
    );

    const sourceSelect = screen.getByRole("combobox", { name: /Filter by Source/i });
    fireEvent.change(sourceSelect, { target: { value: "ml_infra" } });
    expect(onSourceSelectMock).toHaveBeenCalledWith("ml_infra");

    const mlInfraBtn = screen.getByRole("button", { name: /Filter by ML Infra/i });
    fireEvent.click(mlInfraBtn);
    expect(onSourceSelectMock).toHaveBeenCalledWith("ml_infra");
  });

  it("toggles ML Infra filter off when clicking active ML Infra button", () => {
    const onSourceSelectMock = vi.fn();
    render(
      <ProblemListFilterToolbar
        {...defaultProps}
        selectedSource="ml_infra"
        onSourceSelect={onSourceSelectMock}
      />,
    );

    const mlInfraBtn = screen.getByRole("button", { name: /Filter by ML Infra/i });
    expect(mlInfraBtn).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(mlInfraBtn);
    expect(onSourceSelectMock).toHaveBeenCalledWith("All");
  });
});
