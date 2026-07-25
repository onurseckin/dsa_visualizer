import React, { useState, useRef, useCallback, useEffect } from 'react';

export const LAYOUT_SPLIT_STORAGE_KEY = 'dsa_visualizer_layout_split';

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  initialSplitRatio?: number; // Percentage for left panel (e.g. 60 for 60%/40%)
  minLeftPercent?: number;
  maxLeftPercent?: number;
  showLeft?: boolean;
  showRight?: boolean;
  resetKey?: number;
  onSplitChange?: (ratio: number) => void;
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftPanel,
  rightPanel,
  initialSplitRatio = 60,
  minLeftPercent = 25,
  maxLeftPercent = 80,
  showLeft = true,
  showRight = true,
  resetKey,
  onSplitChange,
}) => {
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(LAYOUT_SPLIT_STORAGE_KEY);
        if (saved !== null) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed >= minLeftPercent && parsed <= maxLeftPercent) {
            return parsed;
          }
        }
      } catch {
        // Fallback if localStorage read throws
      }
    }
    return initialSplitRatio;
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateAndPersistRatio = useCallback(
    (ratio: number) => {
      const clampedRatio = Math.max(minLeftPercent, Math.min(maxLeftPercent, ratio));
      setSplitRatio(clampedRatio);
      if (onSplitChange) {
        onSplitChange(clampedRatio);
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(LAYOUT_SPLIT_STORAGE_KEY, String(clampedRatio));
        } catch {
          // Ignore localStorage write errors
        }
      }
    },
    [minLeftPercent, maxLeftPercent, onSplitChange]
  );

  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    if (resetKey !== undefined && resetKey !== prevResetKey.current) {
      prevResetKey.current = resetKey;
      updateAndPersistRatio(initialSplitRatio);
    }
  }, [resetKey, initialSplitRatio, updateAndPersistRatio]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      updateAndPersistRatio(newRatio);
    },
    [isDragging, updateAndPersistRatio]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !containerRef.current || e.touches.length === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX;
      const newRatio = ((touchX - rect.left) / rect.width) * 100;
      updateAndPersistRatio(newRatio);
    },
    [isDragging, updateAndPersistRatio]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Handle single visible panel cases
  if (!showLeft && !showRight) {
    return <div style={{ width: '100%', height: '100%' }} />;
  }

  if (!showLeft) {
    return <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>{rightPanel}</div>;
  }

  if (!showRight) {
    return <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>{leftPanel}</div>;
  }

  const handleActive = isDragging || isHovered;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* Left Resizable Panel */}
      <div
        style={{
          width: `${splitRatio}%`,
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: isDragging ? 'none' : 'width var(--transition-fast)',
        }}
      >
        {leftPanel}
      </div>

      {/* Draggable Vertical Splitter Handle — 8px hit area around a thin line */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(splitRatio)}
        aria-valuemin={minLeftPercent}
        aria-valuemax={maxLeftPercent}
        aria-label="Resize layout columns"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={() => updateAndPersistRatio(initialSplitRatio)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '8px',
          height: '100%',
          flexShrink: 0,
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          background: 'transparent',
          touchAction: 'none',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '2px',
            background: handleActive ? 'var(--accent)' : 'var(--border-default)',
            borderRadius: 'var(--radius-full)',
            transition: 'background var(--transition-fast)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Right Resizable Panel */}
      <div
        style={{
          width: `${100 - splitRatio}%`,
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: isDragging ? 'none' : 'width var(--transition-fast)',
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
};
