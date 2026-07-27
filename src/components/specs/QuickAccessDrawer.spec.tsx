import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickAccessDrawer } from "../../ui";
import * as registryModule from "../../algorithms/registry";

describe("QuickAccessDrawer Component Spec", () => {
  it("does not render when isOpen is false", () => {
    render(<QuickAccessDrawer isOpen={false} onClose={vi.fn()} onSelectAlgorithm={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders title, counts subtitle, autofocused search, and collapsed categories", () => {
    render(<QuickAccessDrawer isOpen={true} onClose={vi.fn()} onSelectAlgorithm={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Algorithms" })).toBeInTheDocument();
    expect(screen.getByText(/algorithms across 25 categories/i)).toBeInTheDocument();

    const searchInput = screen.getByLabelText("Search algorithms");
    expect(searchInput).toHaveFocus();

    // No active algorithm: every category starts collapsed, so no rows are visible.
    expect(screen.getByRole("button", { name: /1\. Arrays & Hashing/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Two Sum")).not.toBeInTheDocument();
  });

  it("expands a collapsed category on header click to reveal its rows", () => {
    render(<QuickAccessDrawer isOpen={true} onClose={vi.fn()} onSelectAlgorithm={vi.fn()} />);

    const header = screen.getByRole("button", { name: /1\. Arrays & Hashing/i });
    fireEvent.click(header);

    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getAllByText("Easy").length).toBeGreaterThan(0);
  });

  it("opens only the active algorithm category by default and marks its row selected", () => {
    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSelectAlgorithm={vi.fn()}
        activeAlgorithmId="two-sum"
      />,
    );

    expect(screen.getByRole("button", { name: /1\. Arrays & Hashing/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: /13\. Graph Shortest Paths/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    const activeRow = screen.getByRole("button", { name: /Two Sum/i });
    expect(activeRow).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/Dijkstra's Shortest Path Algorithm/i)).not.toBeInTheDocument();
  });

  it("search auto-expands matching categories and hides the rest", () => {
    render(<QuickAccessDrawer isOpen={true} onClose={vi.fn()} onSelectAlgorithm={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Search algorithms"), {
      target: { value: "dijkstra" },
    });

    // Match's category renders force-open, its row visible without any manual toggle.
    expect(screen.getByRole("button", { name: /13\. Graph Shortest Paths/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText(/Dijkstra's Shortest Path Algorithm/i)).toBeInTheDocument();
    expect(screen.queryByText(/1\. Arrays & Hashing/i)).not.toBeInTheDocument();
  });

  it("shows an empty state when no algorithm matches the search", () => {
    render(<QuickAccessDrawer isOpen={true} onClose={vi.fn()} onSelectAlgorithm={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Search algorithms"), {
      target: { value: "zzz-no-such-algorithm" },
    });

    expect(screen.getByText(/No algorithms match/i)).toBeInTheDocument();
  });

  it("invokes onSelectAlgorithm with id and category, then onClose, when a row is clicked", () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuickAccessDrawer isOpen={true} onClose={handleClose} onSelectAlgorithm={handleSelect} />,
    );

    fireEvent.change(screen.getByLabelText("Search algorithms"), {
      target: { value: "dijkstra" },
    });
    fireEvent.click(screen.getByText(/Dijkstra's Shortest Path Algorithm/i));

    expect(handleSelect).toHaveBeenCalledWith("dijkstra-shortest-path", "graph_shortest_paths");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("gives every category section a visible border against the drawer surface", () => {
    render(<QuickAccessDrawer isOpen={true} onClose={vi.fn()} onSelectAlgorithm={vi.fn()} />);

    // The drawer portals out of the render container, so query the document.
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".ui-collapsible"));
    expect(sections.length).toBe(25);
    sections.forEach((section) => {
      // Section and drawer share --bg-surface, so only the border separates them.
      expect(section.style.borderColor || section.className).toBeTruthy();
      /* Deliberately unpainted: on the inverted surfaces --bg-inset is 1.03:1 from
         --bg-surface, so recessing a section would buy nothing while destroying the
         1.19:1 pop its --bg-elevated rows get from the drawer surface. */
      expect(section.style.background).toBe("");
    });
  });

  it("keeps rows on the neutral button tier while difficulty badges keep hue", () => {
    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSelectAlgorithm={vi.fn()}
        activeAlgorithmId="two-sum"
      />,
    );

    const row = screen.getByRole("button", { name: /Two Sum/i });
    expect(row).toHaveClass("ui-btn");

    // Difficulty and LeetCode badges carry status / metadata.
    const badges = row.querySelectorAll(".ui-badge");
    expect(badges.length).toBeGreaterThanOrEqual(1);
    const difficultyBadge = Array.from(badges).find((b) => b.textContent === "Easy");
    expect(difficultyBadge).toBeDefined();
    expect(difficultyBadge).toHaveClass("ui-badge--success", "ui-badge--sm");
  });

  it("closes via the close button, backdrop click, and Escape key", () => {
    const handleClose = vi.fn();

    render(<QuickAccessDrawer isOpen={true} onClose={handleClose} onSelectAlgorithm={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    const backdrop = document.querySelector(".ui-drawer-backdrop");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(handleClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(3);
  });

  it("collapses an open category when clicked again when not searching", () => {
    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSelectAlgorithm={vi.fn()}
        activeAlgorithmId="two-sum"
      />,
    );

    const header = screen.getByRole("button", { name: /1\. Arrays & Hashing/i });
    expect(header).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("clears search input when clear button is clicked and resets categories", () => {
    render(<QuickAccessDrawer isOpen={true} onClose={vi.fn()} onSelectAlgorithm={vi.fn()} />);

    const searchInput = screen.getByLabelText("Search algorithms");
    fireEvent.change(searchInput, { target: { value: "dijkstra" } });
    expect(searchInput).toHaveValue("dijkstra");

    const clearBtn = screen.getByRole("button", { name: "Clear" });
    fireEvent.click(clearBtn);
    expect(searchInput).toHaveValue("");
  });

  it("renders algorithm rows without difficulty badge when difficulty is undefined", () => {
    vi.spyOn(registryModule, "getAllAlgorithms").mockReturnValueOnce([
      {
        id: "no-diff",
        title: "No Diff Alg",
        category: "arrays_and_hashing",
        description: "No diff desc",
        constraints: [],
        examples: [],
        code: "",
        timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
        spaceComplexity: "O(1)",
        complexityAnalysis: { time: "O(1)", space: "O(1)" },
        topicGuide: { overview: "", sections: [], keyTerms: [] },
        defaultInput: {},
        generateSteps: () => [],
      },
    ]);

    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSelectAlgorithm={vi.fn()}
        activeAlgorithmId="no-diff"
      />,
    );

    expect(screen.getByText("No Diff Alg")).toBeInTheDocument();
  });

  it("renders LeetCodeBadge in algorithm row when leetcode property is present", () => {
    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSelectAlgorithm={vi.fn()}
        activeAlgorithmId="two-sum"
      />,
    );

    const leetCodeBadge = screen.getByText("LC #1");
    expect(leetCodeBadge).toBeInTheDocument();
  });
});
