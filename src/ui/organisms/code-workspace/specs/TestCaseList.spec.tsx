import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestCaseList } from "../TestCaseList";

describe("TestCaseList", () => {
  it("supports authored test selection with visible labels", () => {
    const onSelectionChange = vi.fn();
    render(
      <TestCaseList
        cases={[
          {
            id: "a",
            label: "Typical input",
            input: [1],
            expected: 1,
            comparison: "deep-equal",
          },
          {
            id: "b",
            label: "Edge input",
            input: [],
            expected: 0,
            comparison: "deep-equal",
          },
        ]}
        selectedIds={["a", "b"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Edge input" }));
    expect(onSelectionChange).toHaveBeenCalledWith(["a"]);
  });

  it("shows a clear message before execution specs are authored", () => {
    render(<TestCaseList />);
    expect(screen.getByText(/tests are not available yet/i)).toBeInTheDocument();
  });
});
