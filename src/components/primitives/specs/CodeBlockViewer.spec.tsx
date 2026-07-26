import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CodeBlockViewer } from "../CodeBlockViewer";
import { N_QUEENS_CODE } from "../../../algorithms/backtracking/nQueens";

const EXPLAIN_LINES_STORAGE_KEY = "dsa_visualizer_explain_lines_enabled";

afterEach(() => {
  window.localStorage.clear();
});

const CODE = [
  "def two_sum(nums, target):",
  "    seen = {}",
  "    for i, n in enumerate(nums):",
  "        if target - n in seen:",
  "            return [seen[target - n], i]",
].join("\n");

const EXPLANATIONS = {
  2: "Creates an empty map that will remember every value seen so far.",
  4: "Checks whether the complement was already seen.",
};

describe("CodeBlockViewer Component Spec", () => {
  it("prints every source line with its 1-based line number", () => {
    const { container } = render(<CodeBlockViewer code={CODE} activeLine={1} />);
    const rows = container.querySelectorAll(".ui-code-line");

    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent("1");
    expect(rows[0]).toHaveTextContent("def two_sum(nums, target):");
    expect(rows[1]).toHaveTextContent("2");
    expect(rows[1]).toHaveTextContent("seen = {}");
  });

  it("renders no per-line explain buttons at all — the icon lives once in the header, not per row", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    expect(screen.queryAllByRole("button", { name: /^Explain line/ })).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "Toggle line explanations" })).toHaveLength(1);
  });

  it("defaults the header explain toggle to on", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    expect(screen.getByRole("button", { name: "Toggle line explanations" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows a line popover on hover while the toggle is on, positioned via the row anchor and tied to that line", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    fireEvent.mouseEnter(screen.getByTestId("code-row-2"));

    const popover = screen.getByTestId("line-explain-popover-2");
    expect(popover).toHaveTextContent(EXPLANATIONS[2]);
    expect(popover).toHaveTextContent("Line 2");
    expect(popover).toHaveAttribute("data-side", "left");
    expect(screen.getByTestId("line-explain-connector-2")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByTestId("code-row-2"));
    expect(screen.queryByTestId("line-explain-popover-2")).not.toBeInTheDocument();
  });

  it("shows nothing at all when hovering a line with no authored explanation", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    fireEvent.mouseEnter(screen.getByTestId("code-row-1"));

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("never shows more than one popover at once, even hovering rapidly across lines without an explicit leave", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    fireEvent.mouseEnter(screen.getByTestId("code-row-2"));
    expect(screen.getByTestId("line-explain-popover-2")).toBeInTheDocument();

    // Simulate the pointer jumping straight to another explained line before
    // a mouseleave on the first one is ever dispatched.
    fireEvent.mouseEnter(screen.getByTestId("code-row-4"));

    expect(screen.queryByTestId("line-explain-popover-2")).not.toBeInTheDocument();
    expect(screen.getByTestId("line-explain-popover-4")).toBeInTheDocument();
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
  });

  it("suppresses all hover popovers once the toggle is switched off, and restores them when switched back on", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    const toggle = screen.getByRole("button", { name: "Toggle line explanations" });
    fireEvent.click(toggle);
    expect(toggle).not.toHaveAttribute("aria-pressed");

    fireEvent.mouseEnter(screen.getByTestId("code-row-2"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.mouseEnter(screen.getByTestId("code-row-2"));
    expect(screen.getByTestId("line-explain-popover-2")).toBeInTheDocument();
  });

  it("tears down an open popover immediately when the toggle is switched off mid-hover", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    fireEvent.mouseEnter(screen.getByTestId("code-row-2"));
    expect(screen.getByTestId("line-explain-popover-2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Toggle line explanations" }));
    expect(screen.queryByTestId("line-explain-popover-2")).not.toBeInTheDocument();
  });

  it("persists switching the explain toggle off, restoring it across a reload", () => {
    const { unmount } = render(
      <CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle line explanations" }));
    expect(window.localStorage.getItem(EXPLAIN_LINES_STORAGE_KEY)).toBe("false");

    // A reload is just another mount reading the same persisted key.
    unmount();
    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    expect(screen.getByRole("button", { name: "Toggle line explanations" })).not.toHaveAttribute(
      "aria-pressed",
    );

    fireEvent.mouseEnter(screen.getByTestId("code-row-2"));
    expect(screen.queryByTestId("line-explain-popover-2")).not.toBeInTheDocument();
  });

  it("falls back to the explain toggle being on when the stored value is malformed", () => {
    window.localStorage.setItem(EXPLAIN_LINES_STORAGE_KEY, "{not json");

    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    expect(screen.getByRole("button", { name: "Toggle line explanations" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("falls back to the explain toggle being on when the stored value is the wrong type", () => {
    window.localStorage.setItem(EXPLAIN_LINES_STORAGE_KEY, JSON.stringify("yes"));

    render(<CodeBlockViewer code={CODE} activeLine={1} lineExplanations={EXPLANATIONS} />);

    expect(screen.getByRole("button", { name: "Toggle line explanations" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("omits lineExplanations entirely without throwing and without any popover ever appearing", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} />);

    fireEvent.mouseEnter(screen.getByTestId("code-row-1"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("preserves each line's leading indentation in its own dedicated element, unmodified", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} />);

    expect(screen.getByTestId("indent-1").textContent).toBe("");
    expect(screen.getByTestId("indent-2").textContent).toBe("    ");
    expect(screen.getByTestId("indent-4").textContent).toBe("        ");
    expect(screen.getByTestId("indent-5").textContent).toBe("            ");
  });

  it("keeps 4-space, 8-space, and 12-space indent levels visually distinct on a deeply nested real algorithm (nQueens)", () => {
    render(<CodeBlockViewer code={N_QUEENS_CODE} activeLine={1} />);

    // "    board = ..." — one level in.
    expect(screen.getByTestId("indent-2").textContent).toBe("    ".repeat(1));
    // "        if row == n:" — two levels in.
    expect(screen.getByTestId("indent-7").textContent).toBe("    ".repeat(2));
    // "            solutions.append(...)" — three levels in.
    expect(screen.getByTestId("indent-8").textContent).toBe("    ".repeat(3));
    // "                continue" — four levels in.
    expect(screen.getByTestId("indent-13").textContent).toBe("    ".repeat(4));

    expect(screen.getByTestId("indent-8").textContent?.length).toBeGreaterThan(
      screen.getByTestId("indent-7").textContent?.length ?? 0,
    );
    expect(screen.getByTestId("indent-7").textContent?.length).toBeGreaterThan(
      screen.getByTestId("indent-2").textContent?.length ?? 0,
    );
  });
});
