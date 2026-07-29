import React, { useState, useRef, useCallback } from "react";

export function usePanZoom(options?: { minScale?: number; maxScale?: number }) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const minScale = options?.minScale ?? 0.4;
  const maxScale = options?.maxScale ?? 2.5;

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.altKey) {
        return;
      }
      e.preventDefault();
      const zoomStep = Math.exp(-e.deltaY * 0.0012);
      setScale((prev) => Math.min(maxScale, Math.max(minScale, prev * zoomStep)));
    },
    [minScale, maxScale],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsPanning(true);
        startRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      setPan({ x: startRef.current.panX + dx, y: startRef.current.panY + dy });
    },
    [isPanning],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    startRef.current = null;
  }, []);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(maxScale, s * 1.2));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(minScale, s / 1.2));
  }, [minScale]);

  const resetPanZoom = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return {
    scale,
    pan,
    isPanning,
    containerProps: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
    controls: {
      zoomIn,
      zoomOut,
      resetPanZoom,
      scalePercentage: Math.round(scale * 100),
    },
  };
}
