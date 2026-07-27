import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import type { ComponentProps } from "react";
import { ResizableLayout } from "../../ui";

const stubRects = (rects: Record<string, DOMRect>): void => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement): DOMRect {
      const key = this.getAttribute("data-row") ?? this.getAttribute("data-rect") ?? "container";
      return rects[key] ?? rects.container;
    },
  );
};

const rect = (top: number, bottom: number, left = 0, right = 1000): DOMRect =>
  ({
    top,
    bottom,
    left,
    right,
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ResizableLayout (horizontal split)", () => {
  const renderLayout = (overrides: Partial<ComponentProps<typeof ResizableLayout>> = {}) => {
    const onSplitChange = vi.fn();
    const onSplitCommit = vi.fn();
    const utils = render(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        splitPercent={70}
        onSplitChange={onSplitChange}
        onSplitCommit={onSplitCommit}
        {...overrides}
      />,
    );
    return { ...utils, onSplitChange, onSplitCommit };
  };

  it("renders both panels with a vertical separator carrying range semantics", () => {
    renderLayout();

    expect(screen.getByText("Left Content")).toBeInTheDocument();
    expect(screen.getByText("Right Content")).toBeInTheDocument();

    const handle = screen.getByRole("separator");
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("aria-valuenow", "70");
    expect(handle).toHaveAttribute("aria-valuemin", "25");
    expect(handle).toHaveAttribute("aria-valuemax", "80");
    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle).toHaveAccessibleName("Resize visualizer and code columns");
  });

  it("reflects the controlled split percent in the column widths", () => {
    const { container } = renderLayout({ splitPercent: 35 });

    const columns = container.firstElementChild?.children;
    expect((columns?.[0] as HTMLElement).style.width).toBe("35%");
    expect((columns?.[2] as HTMLElement).style.width).toBe("65%");
  });

  it("nudges the split by 2% with ArrowLeft / ArrowRight and commits each nudge", () => {
    const onSplitCommit = vi.fn();
    const Harness = () => {
      const [percent, setPercent] = useState(70);
      return (
        <ResizableLayout
          leftPanel={<div>Left Content</div>}
          rightPanel={<div>Right Content</div>}
          splitPercent={percent}
          onSplitChange={setPercent}
          onSplitCommit={onSplitCommit}
        />
      );
    };
    render(<Harness />);
    const handle = screen.getByRole("separator");

    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "72");

    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "74");

    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle).toHaveAttribute("aria-valuenow", "72");

    expect(onSplitCommit).toHaveBeenCalledTimes(3);
    expect(onSplitCommit).toHaveBeenLastCalledWith(72);
  });

  it("ignores unrelated keys", () => {
    const { onSplitChange } = renderLayout();

    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowUp" });

    expect(onSplitChange).not.toHaveBeenCalled();
  });

  it("clamps keyboard nudges to the allowed range", () => {
    const { onSplitChange } = renderLayout({ splitPercent: 80 });

    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });

    expect(onSplitChange).toHaveBeenLastCalledWith(80);
  });

  it("restores the graph-focused 70% default split on double-click", () => {
    const { onSplitChange, onSplitCommit } = renderLayout({ splitPercent: 40 });

    fireEvent.doubleClick(screen.getByRole("separator"));

    expect(onSplitChange).toHaveBeenLastCalledWith(70);
    expect(onSplitCommit).toHaveBeenLastCalledWith(70);
  });

  it("restores an explicitly provided default split on double-click", () => {
    const { onSplitChange } = renderLayout({ splitPercent: 40, defaultSplitPercent: 55 });

    fireEvent.doubleClick(screen.getByRole("separator"));

    expect(onSplitChange).toHaveBeenLastCalledWith(55);
  });

  it("tracks a mouse drag and commits once on release", () => {
    stubRects({ container: rect(0, 500, 0, 1000) });
    const { onSplitChange, onSplitCommit } = renderLayout();
    const handle = screen.getByRole("separator");

    fireEvent.mouseDown(handle);
    fireEvent.mouseMove(window, { clientX: 300 });
    fireEvent.mouseMove(window, { clientX: 450 });

    expect(onSplitChange).toHaveBeenNthCalledWith(1, 30);
    expect(onSplitChange).toHaveBeenNthCalledWith(2, 45);
    expect(onSplitCommit).not.toHaveBeenCalled();

    fireEvent.mouseUp(window);

    expect(onSplitCommit).toHaveBeenCalledTimes(1);
    expect(onSplitCommit).toHaveBeenLastCalledWith(45);
  });

  it("renders a single panel with no separator when a side is hidden", () => {
    const { rerender } = renderLayout({ showRight: false });

    expect(screen.getByText("Left Content")).toBeInTheDocument();
    expect(screen.queryByText("Right Content")).not.toBeInTheDocument();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();

    rerender(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        splitPercent={70}
        showLeft={false}
        onSplitChange={vi.fn()}
      />,
    );

    expect(screen.queryByText("Left Content")).not.toBeInTheDocument();
    expect(screen.getByText("Right Content")).toBeInTheDocument();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("renders an empty container when both showLeft and showRight are false", () => {
    const { container } = renderLayout({ showLeft: false, showRight: false });

    expect(screen.queryByText("Left Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Right Content")).not.toBeInTheDocument();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    expect((container.firstChild as HTMLElement).style.width).toBe("100%");
  });
});
