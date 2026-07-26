import { render, act } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { useCanvasBox, Size } from "../vizGeometry";

function CanvasTestHarness({ fallback }: { fallback: Size }) {
  const { ref, box } = useCanvasBox(fallback);
  return (
    <div ref={ref} data-testid="canvas-container">
      {box.width}x{box.height}
    </div>
  );
}

describe("useCanvasBox hook", () => {
  const originalResizeObserver = window.ResizeObserver;

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
  });

  it("uses fallback box when ResizeObserver is undefined", () => {
    delete (window as { ResizeObserver?: unknown }).ResizeObserver;

    const { getByTestId } = render(<CanvasTestHarness fallback={{ width: 800, height: 400 }} />);
    expect(getByTestId("canvas-container")).toHaveTextContent("800x400");
  });

  it("measures client dimensions and observes resize events when ResizeObserver exists", () => {
    let observerCallback: ResizeObserverCallback | null = null;
    const observeMock = vi.fn();
    const disconnectMock = vi.fn();

    window.ResizeObserver = vi.fn().mockImplementation((cb: ResizeObserverCallback) => {
      observerCallback = cb;
      return {
        observe: observeMock,
        unobserve: vi.fn(),
        disconnect: disconnectMock,
      };
    });

    const { getByTestId, unmount } = render(
      <CanvasTestHarness fallback={{ width: 800, height: 400 }} />,
    );

    const element = getByTestId("canvas-container");

    // Initially with zero dimensions in jsdom, fallback is kept
    expect(element).toHaveTextContent("800x400");
    expect(observeMock).toHaveBeenCalledWith(element);

    // Mock clientWidth/clientHeight getters
    Object.defineProperty(element, "clientWidth", { configurable: true, value: 1024 });
    Object.defineProperty(element, "clientHeight", { configurable: true, value: 768 });

    // Trigger observer callback
    act(() => {
      observerCallback?.([], {} as ResizeObserver);
    });

    expect(getByTestId("canvas-container")).toHaveTextContent("1024x768");

    // Triggering callback with same dimensions skips unnecessary state updates
    act(() => {
      observerCallback?.([], {} as ResizeObserver);
    });

    expect(getByTestId("canvas-container")).toHaveTextContent("1024x768");

    // Triggering callback with zero dimension ignores the zero measurement
    Object.defineProperty(element, "clientWidth", { configurable: true, value: 0 });
    act(() => {
      observerCallback?.([], {} as ResizeObserver);
    });

    expect(getByTestId("canvas-container")).toHaveTextContent("1024x768");

    // Unmount disconnects the observer
    unmount();
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
