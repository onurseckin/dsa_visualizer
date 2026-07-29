import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProblemTable } from "../../../ui";
import { AlgorithmDefinition } from "../../../types/dsa";
import { adaptAlgorithmDefinition } from "../../../learning/algorithmAdapters";
import type {
  CapstoneLearningItem,
  ScenarioLearningItem,
  TraceLearningItem,
} from "../../../learning/types";

const sampleAlgorithm: AlgorithmDefinition = {
  id: "bubble-sort",
  title: "Bubble Sort",
  topicIds: ["arrays_and_hashing"],
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
  topicIds: ["two_pointers"],
  description: "Sparse complexity algorithm",
  timeComplexity: { best: "", average: "", worst: "" },
  spaceComplexity: "",
  complexityAnalysis: { time: "", space: "" },
  topicGuide: { overview: "", sections: [], keyTerms: [] },
  defaultInput: {},
  code: "def custom(): pass",
  generateSteps: () => [],
};

const sampleItem = adaptAlgorithmDefinition(sampleAlgorithm);
const sampleItemSparse = adaptAlgorithmDefinition(sampleAlgorithmSparse);
const rubricFixtureBase = {
  topicIds: sampleItem.topicIds,
  difficultyProfile: sampleItem.difficultyProfile,
  difficultyLabel: sampleItem.difficultyLabel,
  difficulty: sampleItem.difficulty,
  description: "Evaluate a realistic systems decision.",
  objective: "Defend a systems decision using the governing tradeoff.",
  completionEvidence: "A rubric-scored decision with explicit tradeoff evidence.",
  sources: sampleItem.sources,
  prompt: {
    context: "A service is approaching its latency budget.",
    question: "What should the team change and why?",
  },
  rubric: {
    criteria: [
      {
        id: "tradeoff",
        label: "Tradeoff",
        description: "Explains the selected tradeoff.",
        points: 1,
      },
    ],
  },
} as const;
const scenarioItem: ScenarioLearningItem = {
  ...rubricFixtureBase,
  id: "latency-scenario",
  kind: "scenario",
  title: "Latency Scenario",
  assessment: {
    kind: "scenario",
    renderer: "scenario-assessment",
    triviaEligible: false,
  },
};
const capstoneItem: CapstoneLearningItem = {
  ...rubricFixtureBase,
  id: "serving-capstone",
  kind: "capstone",
  title: "Serving Capstone",
  assessment: {
    kind: "capstone",
    renderer: "capstone-assessment",
    triviaEligible: false,
  },
};
const traceItem: TraceLearningItem = {
  id: "cache-trace",
  kind: "trace",
  title: "Cache Trace",
  topicIds: sampleItem.topicIds,
  difficultyProfile: sampleItem.difficultyProfile,
  difficultyLabel: sampleItem.difficultyLabel,
  difficulty: sampleItem.difficulty,
  description: "Trace cache behavior.",
  objective: "Trace cache behavior across a short request sequence.",
  completionEvidence: "A correct cache trace with invariant evidence.",
  sources: sampleItem.sources,
  code: "def trace_cache():\n    pass",
  generateSteps: () => [],
  assessment: {
    kind: "trace",
    renderer: "trace-assessment",
    triviaEligible: false,
  },
};

describe("ProblemTable render spec", () => {
  it("renders table headers and problem row details", () => {
    const onToggleSort = vi.fn();
    const onSelectAlgorithm = vi.fn();

    render(
      <ProblemTable
        filteredAlgorithms={[sampleItem]}
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

  it("renders complexity as not applicable instead of inventing fallback values", () => {
    render(
      <ProblemTable
        filteredAlgorithms={[sampleItemSparse]}
        sortBy="title"
        onToggleSort={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />,
    );

    expect(screen.getByText("Custom Alg")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Not applicable")).toHaveLength(2);
    expect(screen.getAllByText("N/A")).toHaveLength(2);
    expect(screen.queryByText("O(N)")).not.toBeInTheDocument();
    expect(screen.queryByText("O(1)")).not.toBeInTheDocument();
  });

  it("renders rubric items with N/A complexity and assessment actions", () => {
    const onSelectAlgorithm = vi.fn();

    render(
      <ProblemTable
        filteredAlgorithms={[scenarioItem, capstoneItem]}
        sortBy="title"
        onToggleSort={vi.fn()}
        onSelectAlgorithm={onSelectAlgorithm}
      />,
    );

    expect(screen.getAllByLabelText("Not applicable")).toHaveLength(4);
    expect(screen.getAllByText("N/A")).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "Visualize" })).not.toBeInTheDocument();
    const assessButtons = screen.getAllByRole("button", { name: "Assess" });
    expect(assessButtons).toHaveLength(2);
    expect(assessButtons[0]?.querySelector(".lucide-clipboard-check")).toBeInTheDocument();

    fireEvent.click(assessButtons[1]!);
    expect(onSelectAlgorithm).toHaveBeenLastCalledWith("serving-capstone");
    expect(
      screen.getByRole("row", { name: "Open assessment for Latency Scenario" }),
    ).toBeInTheDocument();
  });

  it("renders code-bearing nonalgorithm items with an open action", () => {
    render(
      <ProblemTable
        filteredAlgorithms={[traceItem]}
        sortBy="title"
        onToggleSort={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />,
    );

    const openButton = screen.getByRole("button", { name: "Open" });
    expect(openButton.querySelector(".lucide-arrow-right")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Visualize" })).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Not applicable")).toHaveLength(2);
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
        filteredAlgorithms={[sampleItem]}
        sortBy="title"
        onToggleSort={vi.fn()}
        onSelectAlgorithm={onSelectAlgorithm}
      />,
    );

    const row = screen.getByRole("row", { name: /Open visualization for Bubble Sort/i });

    // Hover and Focus state handlers
    expect(row.className).toContain("hover:bg-[var(--bg-surface-hover)]");

    // Keyboard selection (Enter & Space)
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onSelectAlgorithm).toHaveBeenLastCalledWith("bubble-sort");

    fireEvent.keyDown(row, { key: " " });
    expect(onSelectAlgorithm).toHaveBeenLastCalledWith("bubble-sort");

    // Visualize button click
    fireEvent.click(screen.getByRole("button", { name: "Visualize" }));
    expect(onSelectAlgorithm).toHaveBeenLastCalledWith("bubble-sort");

    // Row click
    fireEvent.click(row);
    expect(onSelectAlgorithm).toHaveBeenLastCalledWith("bubble-sort");
  });

  it("renders every canonical topic label and ignores unrelated keydown events", () => {
    const topicAlgorithm: AlgorithmDefinition = {
      ...sampleAlgorithm,
      id: "topic-alg",
      topicIds: ["two_pointers", "intervals"],
    };

    render(
      <ProblemTable
        filteredAlgorithms={[adaptAlgorithmDefinition(topicAlgorithm)]}
        sortBy="title"
        onToggleSort={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />,
    );

    expect(screen.getByText("Two Pointers")).toBeInTheDocument();
    expect(screen.getByText("Intervals")).toBeInTheDocument();

    const row = screen.getByRole("row", { name: /Open visualization for Bubble Sort/i });
    fireEvent.keyDown(row, { key: "Tab" }); // non-Enter, non-Space key
  });
});
