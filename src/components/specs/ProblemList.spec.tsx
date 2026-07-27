import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProblemList } from "../../ui";

/* Difficulty filter and sort order now persist to localStorage (flat,
   versionless keys — see ProblemList.tsx); isolate every test from whatever
   an earlier test wrote. */
afterEach(() => {
  window.localStorage.clear();
});

describe("ProblemList Component Spec", () => {
  it("renders filter controls and problems table", () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    expect(screen.getByRole("textbox", { name: /Filter problems/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Filter by Category/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Filter by Difficulty/i })).toBeInTheDocument();
  });

  it("gives every panel a visible border and recesses the sort strip", () => {
    const { container } = render(<ProblemList onSelectAlgorithm={vi.fn()} />);

    const cards = Array.from(container.querySelectorAll<HTMLElement>(".ui-card"));
    expect(cards.length).toBeGreaterThanOrEqual(1);
    cards.forEach((card) => {
      expect(card).toHaveClass("border-[var(--border-default)]");
    });

    const headerRow = container.querySelector<HTMLElement>("thead tr");
    expect(headerRow?.className).toContain("bg-[#1a1a22]");
    expect(headerRow?.className).toContain("border-b");

    const rows = Array.from(container.querySelectorAll<HTMLElement>("tbody tr"));
    expect(rows.length).toBeGreaterThan(10);
  });

  it("filters table rows dynamically when typing in the ui search input", () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByPlaceholderText(/Search problems by title/i);
    expect(input).toHaveClass("ui-input__field");
    fireEvent.change(input, { target: { value: "Bubble Sort" } });

    expect(screen.getByText("Bubble Sort")).toBeInTheDocument();

    // Clear button resets the search
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveValue("");
  });

  it("filters rows via category select dropdown", () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const select = screen.getByRole("combobox", { name: /Filter by Category/i });
    fireEvent.change(select, { target: { value: "arrays_and_hashing" } });

    expect(screen.getByText("Bubble Sort")).toBeInTheDocument();
  });

  it("navigates to workspace when clicking table row or Visualize button", () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const row = screen.getByText("Bubble Sort");
    fireEvent.click(row);

    expect(onSelectMock).toHaveBeenCalledWith("bubble-sort", "arrays_and_hashing");
  });

  it("drives the category filter from the controlled category prop", () => {
    render(
      <ProblemList
        onSelectAlgorithm={vi.fn()}
        category="two_pointers"
        onCategoryChange={vi.fn()}
      />,
    );

    const select = screen.getByRole("combobox", {
      name: /Filter by Category/i,
    }) as HTMLSelectElement;
    expect(select.value).toBe("two_pointers");
    expect(screen.queryByText("Bubble Sort")).not.toBeInTheDocument();
  });

  it("round-trips the sort field, sort direction, and difficulty filter across a reload", () => {
    const categoryButtonName = /Sort by topic \/ category/i;
    const firstRowTitle = () => screen.getAllByRole("row")[1]?.textContent ?? "";

    const { unmount } = render(<ProblemList onSelectAlgorithm={vi.fn()} />);

    // Title is the default sort column, so switching to a different one is what
    // actually exercises (and persists) a change to sort_by.
    fireEvent.click(screen.getByRole("button", { name: categoryButtonName }));
    const ascendingFirstTitle = firstRowTitle();

    // Same column again flips asc -> desc.
    fireEvent.click(screen.getByRole("button", { name: categoryButtonName }));
    const descendingFirstTitle = firstRowTitle();
    expect(descendingFirstTitle).not.toBe(ascendingFirstTitle);

    fireEvent.change(screen.getByRole("combobox", { name: /Filter by Difficulty/i }), {
      target: { value: "Hard" },
    });

    expect(window.localStorage.getItem("dsa_visualizer_problem_list_sort_by")).toBe('"category"');
    expect(window.localStorage.getItem("dsa_visualizer_problem_list_sort_order")).toBe('"desc"');
    expect(window.localStorage.getItem("dsa_visualizer_problem_list_difficulty")).toBe('"Hard"');

    unmount();
    render(<ProblemList onSelectAlgorithm={vi.fn()} />);

    expect(
      (screen.getByRole("combobox", { name: /Filter by Difficulty/i }) as HTMLSelectElement).value,
    ).toBe("Hard");
    expect(screen.getByRole("button", { name: categoryButtonName })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("falls back to defaults, including sort direction, when stored problem-list preferences are malformed", () => {
    const clean = render(<ProblemList onSelectAlgorithm={vi.fn()} />);
    const cleanFirstRowTitle = screen.getAllByRole("row")[1]?.textContent ?? "";
    clean.unmount();

    window.localStorage.setItem("dsa_visualizer_problem_list_difficulty", "{not json");
    window.localStorage.setItem("dsa_visualizer_problem_list_sort_by", JSON.stringify("bogus"));
    window.localStorage.setItem("dsa_visualizer_problem_list_sort_order", JSON.stringify(42));

    render(<ProblemList onSelectAlgorithm={vi.fn()} />);

    expect(
      (screen.getByRole("combobox", { name: /Filter by Difficulty/i }) as HTMLSelectElement).value,
    ).toBe("All");
    expect(screen.getByRole("button", { name: /Sort by problem title/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByRole("row")[1]?.textContent ?? "").toBe(cleanFirstRowTitle);
  });
});
