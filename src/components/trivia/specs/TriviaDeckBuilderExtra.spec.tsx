import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaDeckBuilder } from "../../../ui";
import type { AlgorithmDefinition, CategoryType } from "../../../types/dsa";
import * as registry from "../../../algorithms/registry";

describe("TriviaDeckBuilder extra coverage", () => {
  it("allows filtering by category, difficulty, search term, and resetting filters", () => {
    const onChange = vi.fn();
    render(<TriviaDeckBuilder deck={["bubble-sort"]} onChange={onChange} />);

    // Filter by Search term
    const searchInput = screen.getByRole("textbox", { name: "Filter algorithms" });
    fireEvent.change(searchInput, { target: { value: "bubble" } });
    expect(screen.getByText(/1 shown/i)).toBeInTheDocument();

    // Filter by Category
    const categorySelect = screen.getByRole("combobox", { name: "Filter by category" });
    fireEvent.change(categorySelect, { target: { value: "arrays_and_hashing" } });

    // Filter by Difficulty
    const difficultySelect = screen.getByRole("combobox", { name: "Filter by difficulty" });
    fireEvent.change(difficultySelect, { target: { value: "Easy" } });

    // Reset filters button click
    const resetButton = screen.getByRole("button", { name: "Reset filters" });
    fireEvent.click(resetButton);

    expect(categorySelect).toHaveValue("ALL");
    expect(difficultySelect).toHaveValue("ALL");
    expect(searchInput).toHaveValue("");
  });

  it("allows clearing the deck", () => {
    const onChange = vi.fn();
    render(<TriviaDeckBuilder deck={["bubble-sort", "two-sum"]} onChange={onChange} />);

    const clearButton = screen.getByRole("button", { name: "Clear deck" });
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("shows no matches message when filters match nothing", () => {
    render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    const searchInput = screen.getByRole("textbox", { name: "Filter algorithms" });
    fireEvent.change(searchInput, { target: { value: "non_existent_search_query_xyz" } });

    expect(screen.getByText("No algorithm matches that filter.")).toBeInTheDocument();
  });

  it("handles algorithms with unknown category in search query matching", () => {
    const spy = vi.spyOn(registry, "getAllAlgorithms").mockReturnValue([
      {
        id: "custom-alg",
        title: "Custom Alg",
        category: "unknown_cat" as CategoryType,
        difficulty: "Easy",
        description: "",
        constraints: [],
        examples: [],
        code: "pass",
      } as unknown as AlgorithmDefinition<unknown>,
    ]);
    render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);
    const searchInput = screen.getByRole("textbox", { name: "Filter algorithms" });
    fireEvent.change(searchInput, { target: { value: "custom" } });
    expect(screen.getByText(/0 of 1 algorithms selected/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it("renders correctly when CATEGORIES entries are matched", () => {
    const spy = vi.spyOn(registry, "getAllAlgorithms").mockReturnValue([
      {
        id: "two-sum",
        title: "Two Sum",
        category: "arrays_and_hashing",
        difficulty: "Easy",
        description: "",
        constraints: [],
        examples: [],
        code: "pass",
      } as unknown as AlgorithmDefinition<unknown>,
    ]);
    render(<TriviaDeckBuilder deck={["two-sum"]} onChange={vi.fn()} />);
    expect(screen.getAllByText("Arrays & Hashing")[0]).toBeInTheDocument();
    spy.mockRestore();
  });
});
