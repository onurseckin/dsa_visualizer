import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import {
  elementStateToken,
  IntervalItem,
  SweepLineEventPoint,
  AuxiliaryState,
  DisplayValue,
  ElementState,
} from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";
import { vizSlotBg, vizSlotColor } from "./vizPalette";

export interface IntervalVisualizerProps {
  intervals: IntervalItem[];
  sweepLine?: { position: number; label?: string; state?: ElementState };
  eventPoints?: SweepLineEventPoint[];
  axis?: { min?: number; max?: number; label?: string };
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const IntervalVisualizer: React.FC<IntervalVisualizerProps> = ({
  intervals,
  sweepLine,
  eventPoints,
  axis,
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 800, height: 480 });

  // 1. Calculate axis bounds (min / max)
  let axisMin = axis?.min;
  let axisMax = axis?.max;

  if (axisMin === undefined || axisMax === undefined) {
    let minVal = Infinity;
    let maxVal = -Infinity;

    intervals.forEach((inv) => {
      if (inv.start < minVal) minVal = inv.start;
      if (inv.end > maxVal) maxVal = inv.end;
    });

    if (sweepLine !== undefined) {
      if (sweepLine.position < minVal) minVal = sweepLine.position;
      if (sweepLine.position > maxVal) maxVal = sweepLine.position;
    }

    if (eventPoints) {
      eventPoints.forEach((ep) => {
        if (ep.position < minVal) minVal = ep.position;
        if (ep.position > maxVal) maxVal = ep.position;
      });
    }

    if (!Number.isFinite(minVal)) minVal = 0;
    if (!Number.isFinite(maxVal) || maxVal <= minVal) maxVal = minVal + 10;

    const pad = Math.max((maxVal - minVal) * 0.1, 1);
    if (axisMin === undefined) axisMin = Math.floor(minVal - pad);
    if (axisMax === undefined) axisMax = Math.ceil(maxVal + pad);
  }

  const min = axisMin;
  const max = Math.max(axisMax, min + 1);
  const domainSpan = max - min;

  // 2. Assign tracks for intervals if not set
  const assignedTracks: number[] = [];
  const trackEndTimes: number[] = [];

  intervals.forEach((inv, i) => {
    if (inv.track !== undefined) {
      assignedTracks[i] = inv.track;
    } else {
      let trackIdx = 0;
      while (trackIdx < trackEndTimes.length && trackEndTimes[trackIdx] > inv.start) {
        trackIdx += 1;
      }
      trackEndTimes[trackIdx] = inv.end;
      assignedTracks[i] = trackIdx;
    }
  });

  const maxTrack = Math.max(0, ...assignedTracks);
  const numTracks = maxTrack + 1;

  // 3. Layout geometry inside measured box
  const padLeft = 60;
  const padRight = 40;
  const padTop = title ? 40 : 24;
  const padBottom = 60;

  const width = Math.max(box.width, 1);
  const height = Math.max(box.height, 1);

  const plotW = Math.max(width - padLeft - padRight, 10);
  const plotH = Math.max(height - padTop - padBottom, 40);

  const trackH = Math.min(36, Math.max(20, plotH / Math.max(numTracks, 1)));
  const axisY = padTop + plotH + 10;

  const mapX = (val: number): number => {
    const ratio = (val - min) / domainSpan;
    return padLeft + ratio * plotW;
  };

  const getBarFill = (item: IntervalItem): string => {
    if (item.group !== undefined) {
      return vizSlotBg(item.group, 30);
    }
    const token = item.state ? elementStateToken(item.state) : "default";
    switch (token) {
      case "active":
        return "rgba(59, 130, 246, 0.35)";
      case "compare":
        return "rgba(245, 158, 11, 0.35)";
      case "sorted":
      case "pivot":
        return "rgba(16, 185, 129, 0.35)";
      case "in-stack":
        return "rgba(168, 85, 247, 0.35)";
      default:
        return "var(--bg-surface)";
    }
  };

  const getBarStroke = (item: IntervalItem): string => {
    if (item.group !== undefined) {
      return vizSlotColor(item.group);
    }
    const token = item.state ? elementStateToken(item.state) : "default";
    switch (token) {
      case "active":
        return "var(--accent)";
      case "compare":
        return "#f59e0b";
      case "sorted":
      case "pivot":
        return "#10b981";
      case "in-stack":
        return "#a855f7";
      default:
        return "var(--border-default)";
    }
  };

  // Generate tick marks along the axis
  const tickCount = Math.min(10, Math.max(4, Math.floor(plotW / 80)));
  const tickStep = domainSpan / tickCount;
  const ticks: number[] = [];
  for (let i = 0; i <= tickCount; i += 1) {
    ticks.push(min + i * tickStep);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        alignSelf: "stretch",
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: "var(--space-1)",
            textAlign: "center",
          }}
        >
          {title}
        </div>
      )}
      <div
        ref={ref}
        data-testid="canvas-container"
        style={{
          flex: "1 1 auto",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-inset)",
          padding: 0,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: "block" }}
        >
          {/* Background Grid Lines for Ticks */}
          {ticks.map((tVal, idx) => {
            const tx = mapX(tVal);
            return (
              <line
                key={`grid-tick-${idx}`}
                x1={tx}
                y1={padTop}
                x2={tx}
                y2={axisY}
                stroke="var(--border-subtle)"
                strokeDasharray="2 4"
                strokeWidth={1}
              />
            );
          })}

          {/* Interval Segment Bars */}
          {intervals.map((item, idx) => {
            const track = assignedTracks[idx];
            const startX = mapX(item.start);
            const endX = mapX(item.end);
            const barW = Math.max(endX - startX, 4);
            const barY = padTop + track * (trackH + 6);
            const barH = trackH - 4;

            return (
              <g key={item.id || `inv-${idx}`}>
                <rect
                  x={startX}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx={6}
                  fill={getBarFill(item)}
                  stroke={getBarStroke(item)}
                  strokeWidth={item.state && item.state !== "default" ? 2 : 1}
                />
                <text
                  x={startX + barW / 2}
                  y={barY + barH / 2 + 4}
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {item.label || `[${item.start}, ${item.end}]`}
                </text>
              </g>
            );
          })}

          {/* Sweep Line */}
          {sweepLine !== undefined && (
            <g className="sweep-line" transform={`translate(${mapX(sweepLine.position)}, 0)`}>
              <line
                x1={0}
                y1={padTop - 10}
                x2={0}
                y2={axisY + 5}
                stroke={
                  sweepLine.state
                    ? getBarStroke({ id: "", start: 0, end: 0, state: sweepLine.state })
                    : "#f59e0b"
                }
                strokeWidth={2}
                strokeDasharray="4 2"
              />
              <polygon points="-5,20 5,20 0,26" fill="#f59e0b" />
              <rect
                x={-30}
                y={padTop - 24}
                width={60}
                height={18}
                rx={4}
                fill="var(--bg-surface)"
                stroke="#f59e0b"
                strokeWidth={1}
              />
              <text
                x={0}
                y={padTop - 11}
                fill="var(--text-primary)"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="var(--font-mono, monospace)"
              >
                {sweepLine.label || `x=${sweepLine.position}`}
              </text>
            </g>
          )}

          {/* Event Points */}
          {eventPoints &&
            eventPoints.map((ep, idx) => {
              const eX = mapX(ep.position);
              const eY = axisY;
              const pointColor =
                ep.type === "start" ? "#10b981" : ep.type === "end" ? "#ef4444" : "var(--accent)";

              return (
                <g key={ep.id || `ep-${idx}`} transform={`translate(${eX}, ${eY})`}>
                  <circle r={5} fill={pointColor} stroke="var(--bg-surface)" strokeWidth={1.5} />
                  {ep.label && (
                    <text
                      y={18}
                      fill="var(--text-muted)"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {ep.label}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Main Axis Line */}
          <line
            x1={padLeft - 10}
            y1={axisY}
            x2={padLeft + plotW + 10}
            y2={axisY}
            stroke="var(--border-default)"
            strokeWidth={2}
          />

          {/* Axis Ticks and Labels */}
          {ticks.map((tVal, idx) => {
            const tx = mapX(tVal);
            return (
              <g key={`tick-lbl-${idx}`}>
                <line
                  x1={tx}
                  y1={axisY}
                  x2={tx}
                  y2={axisY + 6}
                  stroke="var(--border-default)"
                  strokeWidth={1.5}
                />
                <text
                  x={tx}
                  y={axisY + 20}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {Number.isInteger(tVal) ? tVal : tVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {axis?.label && (
            <text
              x={padLeft + plotW / 2}
              y={axisY + 38}
              fill="var(--text-muted)"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
            >
              {axis.label}
            </text>
          )}

          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>
    </div>
  );
};

export default IntervalVisualizer;
