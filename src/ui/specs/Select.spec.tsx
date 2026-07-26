import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "../Select";

describe("Select render spec", () => {
  it("renders select element with options", () => {
    render(
      <Select defaultValue="a">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Select>,
    );
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("a");
  });

  it('supports size="sm", disabled state, and custom className', () => {
    const { container } = render(
      <Select size="sm" disabled className="custom-select">
        <option value="x">Option X</option>
      </Select>,
    );
    const wrapper = container.querySelector(".ui-select");
    expect(wrapper).toHaveClass("ui-select", "ui-select--sm", "custom-select");

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
  });
});
