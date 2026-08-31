import React, { useEffect, useState } from "react";
import {
  BreakpointFactory,
  type CourseVisualStep,
  type StepStateDiff,
  TimeTravelController,
} from "../../curriculum";

export interface TimeTravelStepControlsProps {
  readonly controller: TimeTravelController;
  readonly currentStep?: CourseVisualStep;
  readonly diff?: StepStateDiff;
  readonly onStepChange?: (step?: CourseVisualStep, diff?: StepStateDiff) => void;
  readonly playbackSpeed?: number;
  readonly onSpeedChange?: (fps: number) => void;
  readonly className?: string;
}

export const TimeTravelStepControls: React.FC<TimeTravelStepControlsProps> = ({
  controller,
  currentStep,
  diff: _diff,
  onStepChange,
  playbackSpeed = 2,
  onSpeedChange,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showBreakpointDrawer, setShowBreakpointDrawer] = useState(false);
  const [customVarName, setCustomVarName] = useState("");
  const [customVarVal, setCustomVarVal] = useState("");
  const [hitBreakpointLabel, setHitBreakpointLabel] = useState<string | null>(null);

  // Sync playing state with controller
  useEffect(() => {
    return () => {
      controller.pause();
    };
  }, [controller]);

  const handleStepForward = () => {
    controller.pause();
    setIsPlaying(false);
    const result = controller.stepForward();
    onStepChange?.(result.step, result.diff);
  };

  const handleStepBackward = () => {
    controller.pause();
    setIsPlaying(false);
    const result = controller.stepBackward();
    onStepChange?.(result.step, result.diff);
  };

  const handleReset = () => {
    controller.reset();
    setIsPlaying(false);
    onStepChange?.(controller.currentStep, undefined);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetIdx = parseInt(e.target.value, 10);
    controller.pause();
    setIsPlaying(false);
    const step = controller.jumpToStep(targetIdx);
    onStepChange?.(step, undefined);
  };

  const togglePlay = () => {
    if (isPlaying) {
      controller.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      controller.play(playbackSpeed, (step, stepDiff) => {
        onStepChange?.(step, stepDiff);
        if (controller.isAtEnd) {
          setIsPlaying(false);
        }
      });
    }
  };

  const handleResumeUntilBreakpoint = () => {
    controller.pause();
    setIsPlaying(false);
    const res = controller.resumeUntilBreakpoint();
    if (res.hitBreakpoint) {
      setHitBreakpointLabel(res.hitBreakpoint.label);
    } else {
      setHitBreakpointLabel(null);
    }
    onStepChange?.(res.finalStep, undefined);
  };

  const addVarBreakpoint = () => {
    if (!customVarName) return;
    const bp = BreakpointFactory.createVariableBreakpoint(
      customVarName.trim(),
      (val) => String(val) === customVarVal.trim(),
      `Break: ${customVarName} == ${customVarVal}`,
    );
    controller.addBreakpoint(bp);
    setCustomVarName("");
    setCustomVarVal("");
  };

  const addCacheMissBreakpoint = () => {
    controller.addBreakpoint(
      BreakpointFactory.createCacheMissBreakpoint("DRAM Eviction / Cache Miss"),
    );
  };

  const addInvariantViolationBreakpoint = () => {
    controller.addBreakpoint(
      BreakpointFactory.createInvariantViolationBreakpoint("Invariant Anomaly Trigger"),
    );
  };

  const dirtyMemoryCount = (currentStep?.memoryTrace ?? []).filter((m) => m.isDirty).length;
  const cacheMissCount = (currentStep?.memoryTrace ?? []).filter(
    (m) => m.isCacheHit === false,
  ).length;

  return (
    <div
      className={`time-travel-step-controls ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "10px 14px",
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid var(--border-default, #334155)",
        borderRadius: "8px",
        color: "var(--text-primary, #e2e8f0)",
      }}
    >
      {/* Top Bar: Live Inspector Metadata */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              background: "#0284c7",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "11px",
            }}
          >
            Step {controller.currentIndex + 1}/{controller.totalSteps}
          </span>
          {currentStep?.codeLine !== undefined && (
            <span
              style={{
                padding: "2px 6px",
                borderRadius: "4px",
                background: "#334155",
                color: "#94a3b8",
                fontSize: "11px",
                fontFamily: "monospace",
              }}
            >
              Line {currentStep.codeLine}
            </span>
          )}
          {currentStep?.activeInvariant && (
            <span
              style={{
                color: "#38bdf8",
                fontSize: "11px",
                fontStyle: "italic",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "360px",
              }}
              title={currentStep.activeInvariant}
            >
              📌 {currentStep.activeInvariant}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {dirtyMemoryCount > 0 && (
            <span
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "10px",
                background: "rgba(234, 179, 8, 0.2)",
                color: "#eab308",
                border: "1px solid rgba(234, 179, 8, 0.4)",
              }}
            >
              {dirtyMemoryCount} Dirty Writes
            </span>
          )}
          {cacheMissCount > 0 && (
            <span
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.2)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.4)",
              }}
            >
              {cacheMissCount} Cache Misses
            </span>
          )}
          {hitBreakpointLabel && (
            <span
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "10px",
                background: "rgba(168, 85, 247, 0.2)",
                color: "#c084fc",
                border: "1px solid rgba(168, 85, 247, 0.4)",
              }}
            >
              ⚡ {hitBreakpointLabel}
            </span>
          )}
        </div>
      </div>

      {/* Scrubber Timeline */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          type="range"
          min="0"
          max={Math.max(0, controller.totalSteps - 1)}
          value={controller.currentIndex}
          onChange={handleScrubberChange}
          style={{
            flex: 1,
            accentColor: "#38bdf8",
            cursor: "pointer",
          }}
        />
      </div>

      {/* Bottom Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        {/* Playback Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={handleReset}
            title="Reset to Step 1"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#cbd5e1",
              cursor: "pointer",
            }}
          >
            ↺ Reset
          </button>
          <button
            onClick={handleStepBackward}
            disabled={controller.isAtStart}
            title="Step Backward"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid #334155",
              background: controller.isAtStart ? "#0f172a" : "#1e293b",
              color: controller.isAtStart ? "#475569" : "#cbd5e1",
              cursor: controller.isAtStart ? "not-allowed" : "pointer",
            }}
          >
            ◀ Back
          </button>
          <button
            onClick={togglePlay}
            title={isPlaying ? "Pause Playback" : "Play Animated Trace"}
            style={{
              padding: "4px 14px",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid #0284c7",
              background: isPlaying ? "#0284c7" : "#0369a1",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={handleStepForward}
            disabled={controller.isAtEnd}
            title="Step Forward"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid #334155",
              background: controller.isAtEnd ? "#0f172a" : "#1e293b",
              color: controller.isAtEnd ? "#475569" : "#cbd5e1",
              cursor: controller.isAtEnd ? "not-allowed" : "pointer",
            }}
          >
            Forward ▶
          </button>
          <button
            onClick={handleResumeUntilBreakpoint}
            title="Resume Until Next Breakpoint"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid #8b5cf6",
              background: "rgba(139, 92, 246, 0.15)",
              color: "#c4b5fd",
              cursor: "pointer",
            }}
          >
            ⏩ Resume
          </button>
        </div>

        {/* Speed & Breakpoint Drawer Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={playbackSpeed}
            onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="2">2.0x</option>
            <option value="4">4.0x</option>
            <option value="8">8.0x</option>
          </select>

          <button
            onClick={() => setShowBreakpointDrawer(!showBreakpointDrawer)}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid #475569",
              background: showBreakpointDrawer ? "#334155" : "#1e293b",
              color: "#cbd5e1",
              cursor: "pointer",
            }}
          >
            ⚙ Breakpoints ({controller.breakpoints.length})
          </button>
        </div>
      </div>

      {/* Collapsible Conditional Breakpoints Drawer */}
      {showBreakpointDrawer && (
        <div
          style={{
            marginTop: "8px",
            padding: "10px",
            background: "rgba(30, 41, 59, 0.9)",
            borderRadius: "6px",
            border: "1px solid #475569",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>
            Add Conditional Breakpoints:
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              onClick={addCacheMissBreakpoint}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "4px",
                background: "rgba(239, 68, 68, 0.2)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                cursor: "pointer",
              }}
            >
              + Cache Miss Trigger
            </button>
            <button
              onClick={addInvariantViolationBreakpoint}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "4px",
                background: "rgba(234, 179, 8, 0.2)",
                color: "#eab308",
                border: "1px solid rgba(234, 179, 8, 0.4)",
                cursor: "pointer",
              }}
            >
              + Invariant Violation Trigger
            </button>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
            <input
              type="text"
              placeholder="Variable (e.g. max_flow)"
              value={customVarName}
              onChange={(e) => setCustomVarName(e.target.value)}
              style={{
                padding: "3px 6px",
                fontSize: "11px",
                borderRadius: "4px",
                background: "#0f172a",
                border: "1px solid #334155",
                color: "#f8fafc",
                width: "140px",
              }}
            />
            <input
              type="text"
              placeholder="Value (e.g. 14)"
              value={customVarVal}
              onChange={(e) => setCustomVarVal(e.target.value)}
              style={{
                padding: "3px 6px",
                fontSize: "11px",
                borderRadius: "4px",
                background: "#0f172a",
                border: "1px solid #334155",
                color: "#f8fafc",
                width: "100px",
              }}
            />
            <button
              onClick={addVarBreakpoint}
              style={{
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "4px",
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Add Variable Breakpoint
            </button>
          </div>

          {/* Active Breakpoint Tags */}
          {controller.breakpoints.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
              {controller.breakpoints.map((bp) => (
                <span
                  key={bp.id}
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "#0f172a",
                    border: "1px solid #64748b",
                    color: "#cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {bp.label}
                  <button
                    onClick={() => controller.removeBreakpoint(bp.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: "bold",
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
