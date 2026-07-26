import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePointerDrag } from "../hooks/usePointerDrag";

describe("usePointerDrag hook", () => {
  it("does nothing when dragging is false", () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();

    renderHook(({ dragging }) => usePointerDrag(dragging, onMove, onEnd), {
      initialProps: { dragging: false },
    });

    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 200 }));
    window.dispatchEvent(new MouseEvent("mouseup"));

    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("tracks mousemove and mouseup events on window when dragging is true", () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();

    const { rerender } = renderHook(({ dragging }) => usePointerDrag(dragging, onMove, onEnd), {
      initialProps: { dragging: true },
    });

    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 150, clientY: 250 }));
    expect(onMove).toHaveBeenCalledWith(150, 250);

    window.dispatchEvent(new MouseEvent("mouseup"));
    expect(onEnd).toHaveBeenCalledTimes(1);

    // After setting dragging to false, listeners are cleaned up
    rerender({ dragging: false });
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 300, clientY: 400 }));
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it("tracks touchmove and touchend events on window when dragging is true", () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();

    renderHook(({ dragging }) => usePointerDrag(dragging, onMove, onEnd), {
      initialProps: { dragging: true },
    });

    // TouchMove with no touches in array is safely ignored
    const emptyTouchEv = new Event("touchmove") as TouchEvent;
    Object.defineProperty(emptyTouchEv, "touches", { value: [] });
    window.dispatchEvent(emptyTouchEv);
    expect(onMove).not.toHaveBeenCalled();

    // TouchMove with active touches
    const touchEv = new Event("touchmove") as TouchEvent;
    Object.defineProperty(touchEv, "touches", {
      value: [{ clientX: 400, clientY: 500 }],
    });
    window.dispatchEvent(touchEv);
    expect(onMove).toHaveBeenCalledWith(400, 500);

    window.dispatchEvent(new Event("touchend"));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
