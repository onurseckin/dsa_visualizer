import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

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

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        minHeight: '480px',
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
          minHeight: '480px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: isDragging ? 'none' : 'width 0.1s ease',
        }}
      >
        {leftPanel}
      </div>

      {/* Draggable Vertical Splitter Handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(splitRatio)}
        aria-valuemin={minLeftPercent}
        aria-valuemax={maxLeftPercent}
        aria-label="Resize layout columns"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => updateAndPersistRatio(initialSplitRatio)}
        style={{
          width: '8px',
          height: '100%',
          background: isDragging
            ? 'var(--accent-emerald)'
            : 'var(--bg-darkest)',
          borderLeft: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!isDragging) e.currentTarget.style.background = 'rgba(0, 255, 157, 0.2)';
        }}
        onMouseLeave={(e) => {
          if (!isDragging) e.currentTarget.style.background = 'var(--bg-darkest)';
        }}
      >
        <GripVertical
          style={{
            width: '12px',
            height: '12px',
            color: isDragging ? 'var(--bg-darkest)' : 'var(--text-dim)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Right Resizable Panel */}
      <div
        style={{
          width: `${100 - splitRatio}%`,
          height: '100%',
          minHeight: '480px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: isDragging ? 'none' : 'width 0.1s ease',
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
};
