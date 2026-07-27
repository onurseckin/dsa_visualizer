import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ButtonGroup } from "../index";
import { Button } from "../index";

describe("ButtonGroup render spec", () => {
  it("renders buttons in a group container", () => {
    render(
      <ButtonGroup attached fullWidth>
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("button", { name: "First" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Second" })).toBeInTheDocument();
  });

  it("supports vertical direction, fullWidth, gap variants, and custom className", () => {
    const { container: c1 } = render(
      <ButtonGroup direction="column" gap="none" className="my-bg">
        <Button>A</Button>
      </ButtonGroup>,
    );
    const group1 = c1.querySelector(".ui-button-group");
    expect(group1).toHaveClass("ui-button-group--vertical", "ui-button-group--gap-none", "my-bg");

    const { container: c2 } = render(
      <ButtonGroup attached={false} gap="md">
        <Button>B</Button>
      </ButtonGroup>,
    );
    const group2 = c2.querySelector(".ui-button-group");
    expect(group2).toHaveClass("ui-button-group--gap-md");
    expect(group2).not.toHaveClass("ui-button-group--attached");
  });
});
