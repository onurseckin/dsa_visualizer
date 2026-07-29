import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProblemListState } from "../hooks/useProblemListState";
import * as registry from "../../../learning/registry";
import { AlgorithmDefinition } from "../../../types/dsa";
import { adaptAlgorithmDefinition } from "../../../learning/algorithmAdapters";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("useProblemListState hook", () => {
  it("initializes with default search term, difficulty, topic, and stats", () => {
    const { result } = renderHook(() => useProblemListState({}));

    expect(result.current.searchTerm).toBe("");
    expect(result.current.selectedDifficulty).toBe("All");
    expect(result.current.selectedTopic).toBe("All");
    expect(result.current.stats.total).toBeGreaterThan(0);
    expect(
      result.current.stats.easy + result.current.stats.medium + result.current.stats.hard,
    ).toBe(result.current.stats.total);
  });

  it("updates search term, difficulty, and internal topic", () => {
    const { result } = renderHook(() => useProblemListState({}));

    act(() => result.current.setSearchTerm("bubble"));
    expect(result.current.searchTerm).toBe("bubble");
    expect(result.current.filteredAlgorithms.some((a) => a.id === "bubble-sort")).toBe(true);

    act(() => result.current.setSelectedDifficulty("Easy"));
    expect(result.current.selectedDifficulty).toBe("Easy");
    expect(window.localStorage.getItem("dsa_visualizer_problem_list_difficulty")).toBe('"Easy"');

    act(() => result.current.handleTopicSelect("two_pointers"));
    expect(result.current.selectedTopic).toBe("two_pointers");
  });

  it("delegates topic selection to onTopicChange prop when supplied", () => {
    const onTopicChange = vi.fn();
    const { result } = renderHook(() =>
      useProblemListState({ topic: "arrays_and_hashing", onTopicChange }),
    );

    expect(result.current.selectedTopic).toBe("arrays_and_hashing");

    act(() => result.current.setSelectedTopic("tree_fundamentals"));
    expect(onTopicChange).toHaveBeenCalledWith("tree_fundamentals");
  });

  it("toggles sort order and sort field across title, topic, and difficulty", () => {
    const { result } = renderHook(() => useProblemListState({}));

    // Default sort is title asc
    expect(result.current.sortBy).toBe("title");
    expect(result.current.sortOrder).toBe("asc");

    // Toggling title flips order to desc
    act(() => result.current.toggleSort("title"));
    expect(result.current.sortOrder).toBe("desc");

    // Switching to topic resets order to asc
    act(() => result.current.toggleSort("topic"));
    expect(result.current.sortBy).toBe("topic");
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

  it("filters algorithms by description text or topic label", () => {
    const { result } = renderHook(() => useProblemListState({}));

    // Search by topic label match (e.g. "array")
    act(() => result.current.setSearchTerm("arrays & hashing"));
    expect(result.current.filteredAlgorithms.length).toBeGreaterThan(0);

    // Search by description substring
    act(() => result.current.setSearchTerm("comparison"));
    expect(result.current.filteredAlgorithms.length).toBeGreaterThan(0);
  });

  it("sorts sparse definitions with canonical topic ids", () => {
    const mockAlgs: AlgorithmDefinition[] = [
      {
        id: "custom-1",
        title: "Custom Alg",
        topicIds: ["two_pointers"],
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
        topicIds: ["two_pointers"],
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
        topicIds: ["two_pointers"],
        difficulty: undefined,
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

    vi.spyOn(registry, "getAllLearningItems").mockReturnValue(
      mockAlgs.map(adaptAlgorithmDefinition),
    );

    const { result } = renderHook(() => useProblemListState({}));

    // Search by the canonical topic label.
    act(() => result.current.setSearchTerm("two pointers"));
    expect(result.current.filteredAlgorithms).toHaveLength(3);

    // Sort by the canonical topic.
    act(() => result.current.toggleSort("topic"));
    expect(result.current.filteredAlgorithms).toHaveLength(3);

    // Sort by sparse difficulty values.
    act(() => result.current.toggleSort("difficulty"));
    expect(result.current.filteredAlgorithms).toHaveLength(3);
  });

  it("does not return empty results when topic is specified but stored source filter is incompatible", () => {
    // Simulate stored selectedSource = "ml_infra" from previous page navigation
    window.localStorage.setItem("dsa_visualizer_problem_list_source", '"ml_infra"');

    const { result } = renderHook(() => useProblemListState({ topic: "backtracking" }));

    expect(result.current.selectedTopic).toBe("backtracking");
    expect(result.current.filteredAlgorithms.length).toBeGreaterThan(0);
    expect(
      result.current.filteredAlgorithms.every((a) => a.topicIds.includes("backtracking")),
    ).toBe(true);
  });

  it("preserves the full problem count when navigating to a topic with a stored Hard difficulty filter", () => {
    // Simulate stored selectedDifficulty = "Hard"
    window.localStorage.setItem("dsa_visualizer_problem_list_difficulty", '"Hard"');

    const { result } = renderHook(() => useProblemListState({ topic: "dp_1d" }));

    expect(result.current.selectedTopic).toBe("dp_1d");
    // dp_1d has three registered Medium algorithms.
    expect(result.current.filteredAlgorithms.length).toBe(3);
  });
});
