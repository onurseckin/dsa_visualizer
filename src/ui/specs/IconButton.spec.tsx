import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Play } from "lucide-react";
import { IconButton } from "../IconButton";

describe("IconButton", () => {
  it("renders a square button named by its required aria-label", () => {
    render(<IconButton icon={<Play />} aria-label="Play animation" />);
    const button = screen.getByRole("button", { name: "Play animation" });
    expect(button).toHaveClass("ui-btn", "ui-icon-btn", "ui-btn--secondary", "ui-btn--md");
  });

  it("applies variant, size, and selected modifiers", () => {
    render(<IconButton icon={<Play />} aria-label="Play" variant="ghost" size="sm" selected />);
    const button = screen.getByRole("button", { name: "Play" });
    expect(button).toHaveClass("ui-btn--ghost", "ui-btn--sm", "ui-btn--selected");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("forwards click handlers", () => {
    const onClick = vi.fn();
    render(<IconButton icon={<Play />} aria-label="Play" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
