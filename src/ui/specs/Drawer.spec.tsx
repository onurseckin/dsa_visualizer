import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Drawer } from "../Drawer";

describe("Drawer UI component", () => {
  it("returns null when isOpen is false", () => {
    const { container } = render(
      <Drawer isOpen={false} onClose={vi.fn()} title="Test Drawer">
        Content
      </Drawer>,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders portal with title, children, footer, and default width/side when isOpen is true", () => {
    render(
      <Drawer
        isOpen={true}
        onClose={vi.fn()}
        title="My Drawer Title"
        footer={<div data-testid="drawer-footer">Footer Content</div>}
        className="custom-drawer"
        style={{ color: "red" }}
      >
        <p>Drawer Body Content</p>
      </Drawer>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("My Drawer Title")).toBeInTheDocument();
    expect(screen.getByText("Drawer Body Content")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-footer")).toBeInTheDocument();
    expect(dialog).toHaveClass("ui-drawer", "ui-drawer--right", "custom-drawer");
    expect(dialog).toHaveStyle({ width: "440px", color: "rgb(255, 0, 0)" });
  });

  it("supports string width and side property", () => {
    render(
      <Drawer isOpen={true} onClose={vi.fn()} title="Custom Width" width="80vw">
        Body
      </Drawer>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveStyle({ width: "80vw" });
  });

  it("triggers onClose when backdrop is clicked, close button is clicked, or Escape key is pressed", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Drawer isOpen={true} onClose={handleClose} title="Interactive Drawer">
        Body
      </Drawer>,
    );

    // Click close button
    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Click backdrop (first child in portal)
    const backdrop = container.ownerDocument.querySelector(".ui-drawer-backdrop");
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(2);
    }

    // Press key other than Escape (should not call onClose)
    fireEvent.keyDown(document, { key: "Enter" });
    expect(handleClose).toHaveBeenCalledTimes(2);

    // Press Escape key
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(3);
  });

  it("locks body overflow to hidden when open and restores previous overflow on unmount", () => {
    document.body.style.overflow = "auto";

    const { unmount } = render(
      <Drawer isOpen={true} onClose={vi.fn()} title="Scroll Lock Drawer">
        Body
      </Drawer>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});
