import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Segmented } from "../Segmented";

const options = [
  { value: "graph", label: "Graph" },
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
];

describe("Segmented", () => {
  it("renders one button per option inside a group", () => {
    render(<Segmented options={options} value="graph" onChange={() => undefined} />);
    const group = screen.getByRole("group");
    expect(group).toHaveClass("ui-segmented", "ui-segmented--md");
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("marks only the current value as selected", () => {
    render(<Segmented options={options} value="list" onChange={() => undefined} />);
    const selected = screen.getByRole("button", { name: "List" });
    expect(selected).toHaveClass("ui-segmented__btn--selected");
    expect(selected).toHaveAttribute("aria-pressed", "true");
    const other = screen.getByRole("button", { name: "Graph" });
    expect(other).not.toHaveClass("ui-segmented__btn--selected");
    expect(other).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the clicked option value", () => {
    const onChange = vi.fn();
    render(<Segmented options={options} value="graph" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    expect(onChange).toHaveBeenCalledWith("grid");
  });

  it("does not call onChange when the selected option is clicked again", () => {
    const onChange = vi.fn();
    render(<Segmented options={options} value="graph" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Graph" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies the size modifier", () => {
    render(<Segmented options={options} value="graph" size="sm" onChange={() => undefined} />);
    expect(screen.getByRole("group")).toHaveClass("ui-segmented--sm");
  });
});
