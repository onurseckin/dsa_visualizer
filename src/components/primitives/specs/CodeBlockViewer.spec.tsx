import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CodeBlockViewer } from "../../../ui";
import { N_QUEENS_CODE } from "../../../algorithms/backtracking/nQueens";

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

  it("renders container with p-0 padding and no header field", () => {
    const { container } = render(<CodeBlockViewer code={CODE} activeLine={1} />);
    expect(container.querySelector(".ui-card__header")).toBeNull();
    const card = container.querySelector('[data-testid="code-viewer"]');
    expect(card?.className).toContain("p-0");
  });

  it("omits lineExplanations when not provided", () => {
    render(<CodeBlockViewer code={CODE} activeLine={1} />);
    expect(screen.queryByTestId("line-explanation-2")).toBeNull();
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
