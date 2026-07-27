import React from "react";

/* Shared window-level drag wiring: pointer events must be tracked on the window
   so a fast drag that leaves the 8px handle keeps resizing. */
export const usePointerDrag = (
  dragging: boolean,
  onMove: (clientX: number, clientY: number) => void,
  onEnd: () => void,
): void => {
  React.useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (event: MouseEvent) => onMove(event.clientX, event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      onMove(event.touches[0].clientX, event.touches[0].clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragging, onMove, onEnd]);
};
