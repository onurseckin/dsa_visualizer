import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Well } from "../index";

describe("Well render spec", () => {
  it("renders children with default classes", () => {
    render(<Well>Test content</Well>);
    const element = screen.getByText("Test content");
    expect(element).toHaveClass("ui-well", "ui-well--padding-md");
  });

  it("supports subtle variant and custom padding", () => {
    render(
      <Well variant="subtle" padding="sm">
        Subtle content
      </Well>,
    );
    const element = screen.getByText("Subtle content");
    expect(element).toHaveClass("ui-well", "ui-well--subtle", "ui-well--padding-sm");
  });
});
