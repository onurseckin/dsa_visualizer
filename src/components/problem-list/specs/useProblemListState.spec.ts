import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProblemListState } from "../hooks/useProblemListState";
import * as registry from "../../../algorithms/registry";
import { AlgorithmDefinition } from "../../../types/dsa";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("useProblemListState hook", () => {
  it("initializes with default search term, difficulty, category, and stats", () => {
    const { result } = renderHook(() => useProblemListState({}));

    expect(result.current.searchTerm).toBe("");
    expect(result.current.selectedDifficulty).toBe("All");
    expect(result.current.selectedCategory).toBe("All");
    expect(result.current.stats.total).toBeGreaterThan(0);
    expect(
      result.current.stats.easy + result.current.stats.medium + result.current.stats.hard,
    ).toBe(result.current.stats.total);
  });

  it("updates search term, difficulty, and internal category", () => {
    const { result } = renderHook(() => useProblemListState({}));

    act(() => result.current.setSearchTerm("bubble"));
    expect(result.current.searchTerm).toBe("bubble");
    expect(result.current.filteredAlgorithms.some((a) => a.id === "bubble-sort")).toBe(true);

    act(() => result.current.setSelectedDifficulty("Easy"));
    expect(result.current.selectedDifficulty).toBe("Easy");
    expect(window.localStorage.getItem("dsa_visualizer_problem_list_difficulty")).toBe('"Easy"');

    act(() => result.current.handleCategorySelect("two_pointers"));
    expect(result.current.selectedCategory).toBe("two_pointers");
  });

  it("delegates category selection to onCategoryChange prop when supplied", () => {
    const onCategoryChange = vi.fn();
    const { result } = renderHook(() =>
      useProblemListState({ category: "arrays_and_hashing", onCategoryChange }),
    );

    expect(result.current.selectedCategory).toBe("arrays_and_hashing");

    act(() => result.current.setSelectedCategory("tree_fundamentals"));
    expect(onCategoryChange).toHaveBeenCalledWith("tree_fundamentals");
  });

  it("toggles sort order and sort field across title, category, and difficulty", () => {
    const { result } = renderHook(() => useProblemListState({}));

    // Default sort is title asc
    expect(result.current.sortBy).toBe("title");
    expect(result.current.sortOrder).toBe("asc");

    // Toggling title flips order to desc
    act(() => result.current.toggleSort("title"));
    expect(result.current.sortOrder).toBe("desc");

    // Switching to category resets order to asc
    act(() => result.current.toggleSort("category"));
    expect(result.current.sortBy).toBe("category");
    expect(result.current.sortOrder).toBe("asc");

    // Switching to difficulty resets order to asc
    act(() => result.current.toggleSort("difficulty"));
    expect(result.current.sortBy).toBe("difficulty");
    expect(result.current.sortOrder).toBe("asc");

    // Toggling difficulty flips order to desc
    act(() => result.current.toggleSort("difficulty"));
    expect(result.current.sortOrder).toBe("desc");
  });

  it("toggles sort order back to asc when sortOrder is desc", () => {
    const { result } = renderHook(() => useProblemListState({}));

    // First toggle title -> desc
    act(() => result.current.toggleSort("title"));
    expect(result.current.sortOrder).toBe("desc");

    // Second toggle title -> asc
    act(() => result.current.toggleSort("title"));
    expect(result.current.sortOrder).toBe("asc");
  });

  it("filters algorithms by description text or category label", () => {
    const { result } = renderHook(() => useProblemListState({}));

    // Search by category label match (e.g. "array")
    act(() => result.current.setSearchTerm("arrays & hashing"));
    expect(result.current.filteredAlgorithms.length).toBeGreaterThan(0);

    // Search by description substring
    act(() => result.current.setSearchTerm("comparison"));
    expect(result.current.filteredAlgorithms.length).toBeGreaterThan(0);
  });

  it("handles fallback category and difficulty sorting when fields are missing or unknown", () => {
    const mockAlgs: AlgorithmDefinition[] = [
      {
        id: "custom-1",
        title: "Custom Alg",
        category: "custom_cat" as unknown as AlgorithmDefinition["category"],
        difficulty: undefined as unknown as AlgorithmDefinition["difficulty"],
        description: "Custom description text",
        timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
        spaceComplexity: "O(1)",
        complexityAnalysis: { time: "", space: "" },
        topicGuide: { overview: "", sections: [], keyTerms: [] },
        defaultInput: {},
        generateSteps: () => [],
        code: "pass",
      },
      {
        id: "custom-2",
        title: "Another Alg",
        category: "custom_cat" as unknown as AlgorithmDefinition["category"],
        difficulty: "Easy",
        description: "Another description",
        timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
        spaceComplexity: "O(1)",
        complexityAnalysis: { time: "", space: "" },
        topicGuide: { overview: "", sections: [], keyTerms: [] },
        defaultInput: {},
        generateSteps: () => [],
        code: "pass",
      },
      {
        id: "custom-3",
        title: "Third Alg",
        category: "custom_cat" as unknown as AlgorithmDefinition["category"],
        difficulty: "UnknownDifficulty" as unknown as AlgorithmDefinition["difficulty"],
        description: "Third description",
        timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
        spaceComplexity: "O(1)",
        complexityAnalysis: { time: "", space: "" },
        topicGuide: { overview: "", sections: [], keyTerms: [] },
        defaultInput: {},
        generateSteps: () => [],
        code: "pass",
      },
    ];

    vi.spyOn(registry, "getAllAlgorithms").mockReturnValue(mockAlgs);

    const { result } = renderHook(() => useProblemListState({}));

    // Search by unknown category label fallback
    act(() => result.current.setSearchTerm("custom_cat"));
    expect(result.current.filteredAlgorithms).toHaveLength(3);

    // Sort by unknown category fallback
    act(() => result.current.toggleSort("category"));
    expect(result.current.filteredAlgorithms).toHaveLength(3);

    // Sort by undefined difficulty fallback
    act(() => result.current.toggleSort("difficulty"));
    expect(result.current.filteredAlgorithms).toHaveLength(3);
  });

  it("does not return empty results when category is specified but stored source filter is incompatible", () => {
    // Simulate stored selectedSource = "ml_infra" from previous page navigation
    window.localStorage.setItem("dsa_visualizer_problem_list_source", '"ml_infra"');

    const { result } = renderHook(() => useProblemListState({ category: "backtracking" }));

    expect(result.current.selectedCategory).toBe("backtracking");
    expect(result.current.filteredAlgorithms.length).toBeGreaterThan(0);
    expect(result.current.filteredAlgorithms.every((a) => a.category === "backtracking")).toBe(true);
  });

  it("preserves exact full problem count (e.g. 5 for dp_1d) when navigating to category with stored Hard difficulty filter", () => {
    // Simulate stored selectedDifficulty = "Hard"
    window.localStorage.setItem("dsa_visualizer_problem_list_difficulty", '"Hard"');

    const { result } = renderHook(() => useProblemListState({ category: "dp_1d" }));

    expect(result.current.selectedCategory).toBe("dp_1d");
    // dp_1d registered algorithms total 5 (3 Medium + 2 Hard)
    expect(result.current.filteredAlgorithms.length).toBe(5);
  });
});
