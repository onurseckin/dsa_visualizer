import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DragHandle } from "../components/DragHandle";

describe("DragHandle render spec", () => {
  it("renders vertical handle with aria semantics and handles mouse and keyboard nudges", () => {
    const onDragStart = vi.fn();
    const onNudge = vi.fn();
    const onRestoreDefault = vi.fn();

    render(
      <DragHandle
        orientation="vertical"
        label="Resize columns"
        valueNow={60}
        valueMin={25}
        valueMax={80}
        valueText="60 percent"
        step={2}
        dragging={false}
        onDragStart={onDragStart}
        onNudge={onNudge}
        onRestoreDefault={onRestoreDefault}
      />,
    );

    const handle = screen.getByRole("separator", { name: "Resize columns" });
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("aria-valuenow", "60");
    expect(handle).toHaveAttribute("aria-valuemin", "25");
    expect(handle).toHaveAttribute("aria-valuemax", "80");
    expect(handle).toHaveAttribute("aria-valuetext", "60 percent");

    // Mouse events
    fireEvent.mouseDown(handle);
    expect(onDragStart).toHaveBeenCalledTimes(1);

    fireEvent.doubleClick(handle);
    expect(onRestoreDefault).toHaveBeenCalledTimes(1);

    // Keyboard ArrowLeft & ArrowRight for vertical orientation
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(onNudge).toHaveBeenLastCalledWith(-2);

    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onNudge).toHaveBeenLastCalledWith(2);

    // Hover and focus states update inner indicator background
    const line = handle.firstElementChild as HTMLElement;
    expect(line.style.background).toBe("transparent");

    fireEvent.mouseEnter(handle);
    expect(line.style.background).toBe("var(--accent)");

    fireEvent.mouseLeave(handle);
    expect(line.style.background).toBe("transparent");

    fireEvent.focus(handle);
    expect(line.style.background).toBe("var(--accent)");

    fireEvent.blur(handle);
    expect(line.style.background).toBe("transparent");
  });

  it("renders horizontal handle and handles ArrowUp / ArrowDown and touch events", () => {
    const onDragStart = vi.fn();
    const onNudge = vi.fn();

    render(
      <DragHandle
        orientation="horizontal"
        label="Resize rows"
        valueNow={200}
        valueMin={64}
        valueMax={500}
        step={10}
        dragging={true}
        onDragStart={onDragStart}
        onNudge={onNudge}
        onRestoreDefault={vi.fn()}
      />,
    );

    const handle = screen.getByRole("separator", { name: "Resize rows" });
    expect(handle).toHaveAttribute("aria-orientation", "horizontal");

    fireEvent.touchStart(handle);
    expect(onDragStart).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(onNudge).toHaveBeenLastCalledWith(-10);

    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(onNudge).toHaveBeenLastCalledWith(10);
  });
});
