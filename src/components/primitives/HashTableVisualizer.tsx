import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import {
  elementStateToken,
  HashBucketItem,
  HashEntryItem,
  AuxiliaryState,
  DisplayValue,
} from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";

export interface HashTableVisualizerProps {
  buckets: HashBucketItem[];
  hashFunction?: string;
  probingSequence?: number[];
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const HashTableVisualizer: React.FC<HashTableVisualizerProps> = ({
  buckets,
  hashFunction,
  probingSequence = [],
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 850, height: 540 });

  const numBuckets = Math.max(buckets.length, 1);
  const topPad = title ? 40 : 20;
  const headerH = hashFunction ? 36 : 10;
  const availH = Math.max(box.height - topPad - headerH - 40, 100);

  const bucketH = Math.min(44, Math.max(28, availH / numBuckets));
  const bucketW = 90;
  const startX = 40;

  const isProbed = (bIdx: number): boolean => probingSequence.includes(bIdx);

  const getEntryFill = (entry: HashEntryItem): string => {
    if (entry.color) return entry.color;
    const token = entry.state ? elementStateToken(entry.state) : "default";
    switch (token) {
      case "active":
        return "rgba(59, 130, 246, 0.35)";
      case "compare":
        return "rgba(245, 158, 11, 0.35)";
      case "sorted":
      case "pivot":
        return "rgba(16, 185, 129, 0.35)";
      default:
        return "var(--bg-surface)";
    }
  };

  const getEntryStroke = (entry: HashEntryItem): string => {
    const token = entry.state ? elementStateToken(entry.state) : "default";
    switch (token) {
      case "active":
        return "var(--accent)";
      case "compare":
        return "#f59e0b";
      case "sorted":
      case "pivot":
        return "#10b981";
      default:
        return "var(--border-default)";
    }
  };

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
          <defs>
            <marker
              id="hash-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--text-muted)" />
            </marker>
          </defs>

          {/* Hash Function Banner */}
          {hashFunction && (
            <g transform={`translate(${startX}, ${topPad})`}>
              <rect
                width={Math.min(300, box.width - 80)}
                height={26}
                rx={6}
                fill="var(--bg-surface)"
                stroke="var(--accent)"
                strokeWidth={1}
              />
              <text
                x={12}
                y={17}
                fill="var(--accent)"
                fontSize="12"
                fontWeight="bold"
                fontFamily="var(--font-mono, monospace)"
              >
                {hashFunction}
              </text>
            </g>
          )}

          {/* Probing Sequence Header Info */}
          {probingSequence.length > 0 && (
            <g transform={`translate(${box.width - 240}, ${topPad})`}>
              <text fill="var(--text-muted)" fontSize="11" fontWeight="bold">
                Probing Sequence: [{probingSequence.join(" → ")}]
              </text>
            </g>
          )}

          {/* Bucket Slots & Collision Chains */}
          {buckets.map((b, bIdx) => {
            const bY = topPad + headerH + bIdx * (bucketH + 6);
            const probed = isProbed(bIdx);

            return (
              <g key={`bucket-${b.index}`}>
                {/* Bucket Slot Header Box */}
                <rect
                  x={startX}
                  y={bY}
                  width={bucketW}
                  height={bucketH - 2}
                  rx={6}
                  fill={probed ? "rgba(245, 158, 11, 0.2)" : "var(--bg-surface)"}
                  stroke={probed ? "#f59e0b" : "var(--border-default)"}
                  strokeWidth={probed ? 2 : 1}
                />
                <text
                  x={startX + 10}
                  y={bY + (bucketH - 2) / 2 + 4}
                  fill="var(--text-muted)"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="var(--font-mono, monospace)"
                >
                  [{b.index}]
                </text>
                <text
                  x={startX + bucketW - 10}
                  y={bY + (bucketH - 2) / 2 + 4}
                  fill={probed ? "#f59e0b" : "var(--text-primary)"}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="end"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {b.label || `h:${b.index}`}
                </text>

                {/* Empty Bucket Indicator or Chain Entries */}
                {b.entries.length === 0 ? (
                  <g transform={`translate(${startX + bucketW + 15}, ${bY + (bucketH - 2) / 2})`}>
                    <line
                      x1={0}
                      y1={0}
                      x2={20}
                      y2={0}
                      stroke="var(--border-subtle)"
                      strokeDasharray="2 2"
                    />
                    <text x={28} y={4} fill="var(--text-muted)" fontSize="11" fontStyle="italic">
                      empty
                    </text>
                  </g>
                ) : (
                  b.entries.map((entry, eIdx) => {
                    const nodeW = 110;
                    const nodeX = startX + bucketW + 25 + eIdx * (nodeW + 25);
                    const prevX = eIdx === 0 ? startX + bucketW : nodeX - 25;

                    return (
                      <g key={`entry-${b.index}-${eIdx}`}>
                        {/* Connecting Pointer Arrow */}
                        <line
                          x1={prevX}
                          y1={bY + (bucketH - 2) / 2}
                          x2={nodeX}
                          y2={bY + (bucketH - 2) / 2}
                          stroke={getEntryStroke(entry)}
                          strokeWidth={1.5}
                          markerEnd="url(#hash-arrow)"
                        />

                        {/* Linked Node / Slot Box */}
                        <rect
                          x={nodeX}
                          y={bY + 2}
                          width={nodeW}
                          height={bucketH - 6}
                          rx={6}
                          fill={getEntryFill(entry)}
                          stroke={getEntryStroke(entry)}
                          strokeWidth={entry.state && entry.state !== "default" ? 2 : 1}
                        />

                        <text
                          x={nodeX + nodeW / 2}
                          y={bY + (bucketH - 6) / 2 + 5}
                          fill="var(--text-primary)"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="var(--font-mono, monospace)"
                        >
                          {`${entry.key} : ${entry.value}`}
                        </text>
                      </g>
                    );
                  })
                )}
              </g>
            );
          })}

          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>
    </div>
  );
};

export default HashTableVisualizer;
