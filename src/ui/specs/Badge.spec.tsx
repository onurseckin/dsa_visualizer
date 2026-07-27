import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, difficultyBadgeVariant } from "../index";

describe("Badge", () => {
  it("renders neutral sm by default", () => {
    render(<Badge>Arrays</Badge>);
    const badge = screen.getByText("Arrays");
    expect(badge).toHaveClass("ui-badge", "ui-badge--neutral", "ui-badge--sm");
  });

  it("applies variant and size modifiers", () => {
    render(
      <Badge variant="warning" size="md">
        Medium
      </Badge>,
    );
    const badge = screen.getByText("Medium");
    expect(badge).toHaveClass("ui-badge--warning", "ui-badge--md");
  });

  it("merges custom className", () => {
    render(
      <Badge variant="info" className="extra">
        Info
      </Badge>,
    );
    expect(screen.getByText("Info")).toHaveClass("ui-badge--info", "extra");
  });
});

describe("difficultyBadgeVariant", () => {
  it("maps Easy to success, Medium to warning, Hard to danger", () => {
    expect(difficultyBadgeVariant("Easy")).toBe("success");
    expect(difficultyBadgeVariant("Medium")).toBe("warning");
    expect(difficultyBadgeVariant("Hard")).toBe("danger");
  });
});
