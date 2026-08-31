import React, { useState } from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";

export interface MLPBackpropVisualizerProps {
  readonly initialInputs?: readonly number[];
  readonly initialTargets?: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
}

export type MLPPhase = "forward" | "backward" | "relu_mask";

export const MLPBackpropVisualizer: React.FC<MLPBackpropVisualizerProps> = ({
  initialInputs = [1.2, -0.8, 0.5],
  initialTargets = [1.0, 0.0],
  width = 860,
  height = 500,
  title = "MLP Backpropagation & Computational Graph Adjoint Flow Visualizer",
}) => {
  const { ref, box } = useCanvasBox({ width, height });
  const [phase, setPhase] = useState<MLPPhase>("forward");
  const [inputs, setInputs] = useState<readonly number[]>(initialInputs);
  const targets = initialTargets;

  // Layer architecture: 3 -> 4 -> 2
  const numIn = 3;
  const numHid = 4;
  const numOut = 2;

  // Weights W1 (4 x 3) and W2 (2 x 4)
  const W1 = [
    [0.8, -0.5, 0.3],
    [-0.2, 0.9, -0.7],
    [0.6, 0.4, 0.8],
    [-0.5, -0.6, 0.1],
  ];
  const b1 = [0.1, -0.2, 0.05, -0.1];

  const W2 = [
    [0.7, -0.4, 0.9, -0.3],
    [-0.6, 0.8, -0.5, 0.4],
  ];
  const b2 = [0.2, -0.1];

  // Forward Pass Computations
  // Z1 = W1 * X + b1
  const Z1 = W1.map((row, i) => {
    let sum = b1[i];
    for (let j = 0; j < numIn; j++) {
      sum += row[j] * inputs[j];
    }
    return sum;
  });

  // A1 = ReLU(Z1), mask = Z1 > 0
  const mask = Z1.map((z) => z > 0);
  const A1 = Z1.map((z) => Math.max(0, z));

  // Z2 = W2 * A1 + b2 (Linear output)
  const Z2 = W2.map((row, i) => {
    let sum = b2[i];
    for (let j = 0; j < numHid; j++) {
      sum += row[j] * A1[j];
    }
    return sum;
  });
  const Y_hat = Z2;

  // Loss = 0.5 * sum((y_hat - target)^2)
  const loss = 0.5 * Y_hat.reduce((acc, y, i) => acc + Math.pow(y - targets[i], 2), 0);

  // Backward Pass Adjoints
  // delta_out = y_hat - target
  const deltaOut = Y_hat.map((y, i) => y - targets[i]);

  // delta_hid = (W2^T * delta_out) * (Z1 > 0)
  const deltaHid = A1.map((_, j) => {
    if (!mask[j]) return 0.0;
    let sum = 0;
    for (let i = 0; i < numOut; i++) {
      sum += W2[i][j] * deltaOut[i];
    }
    return sum;
  });

  // Layout node coordinates
  const leftX = 140;
  const midX = box.width / 2;
  const rightX = box.width - 140;

  const inY = (i: number) => 120 + (i * (box.height - 200)) / (numIn - 1);
  const hidY = (j: number) => 90 + (j * (box.height - 160)) / (numHid - 1);
  const outY = (k: number) => 150 + (k * (box.height - 260)) / (numOut - 1);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#020617",
        borderRadius: "12px",
        border: "1px solid #1e293b",
        overflow: "hidden",
        fontFamily: "monospace",
        color: "#f8fafc",
      }}
    >
      {/* Control Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          borderBottom: "1px solid #1e293b",
          backgroundColor: "#090d16",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "#38bdf8" }}>{title}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
            Loss $\mathcal&#123;L&#125;$:{" "}
            <span style={{ color: "#f59e0b" }}>{loss.toFixed(4)}</span> | Phase:{" "}
            <span
              style={{
                color:
                  phase === "forward" ? "#10b981" : phase === "backward" ? "#ef4444" : "#8b5cf6",
              }}
            >
              {phase.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Phase Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setPhase("forward")}
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              backgroundColor: phase === "forward" ? "#065f46" : "#1e293b",
              color: phase === "forward" ? "#6ee7b7" : "#cbd5e1",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Forward ($a = \text&#123;ReLU&#125;(z)$)
          </button>
          <button
            onClick={() => setPhase("backward")}
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              backgroundColor: phase === "backward" ? "#7f1d1d" : "#1e293b",
              color: phase === "backward" ? "#fca5a5" : "#cbd5e1",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Backward ($\delta = W^T \delta \odot \mathbb&#123;I&#125;$)
          </button>
          <button
            onClick={() => setPhase("relu_mask")}
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              backgroundColor: phase === "relu_mask" ? "#581c87" : "#1e293b",
              color: phase === "relu_mask" ? "#d8b4fe" : "#cbd5e1",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            1-Bit ReLU Mask
          </button>
          <button
            onClick={() =>
              setInputs([
                Math.round((Math.random() * 2 - 1) * 10) / 10,
                Math.round((Math.random() * 2 - 1) * 10) / 10,
                Math.round((Math.random() * 2 - 1) * 10) / 10,
              ])
            }
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              backgroundColor: "#1e293b",
              color: "#93c5fd",
              border: "1px solid #3b82f6",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Randomize Inputs
          </button>
        </div>
      </div>

      {/* SVG Stage */}
      <div
        ref={ref}
        style={{ flex: "1 1 auto", width: "100%", minHeight: 0, position: "relative" }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: "block" }}
        >
          {/* Synapses Layer 1 (Input -> Hidden) */}
          {inputs.map((_, i) =>
            A1.map((_, j) => {
              const w = W1[j][i];
              const isMaskedOut = phase === "relu_mask" && !mask[j];
              const strokeColor =
                phase === "backward"
                  ? deltaHid[j] !== 0
                    ? "#f87171"
                    : "#334155"
                  : w >= 0
                    ? isMaskedOut
                      ? "#1e293b"
                      : "#10b981"
                    : isMaskedOut
                      ? "#1e293b"
                      : "#ef4444";
              const strokeW = isMaskedOut ? 1 : Math.max(1, Math.min(4, Math.abs(w) * 3));

              return (
                <line
                  key={`syn1_${i}_${j}`}
                  x1={leftX}
                  y1={inY(i)}
                  x2={midX}
                  y2={hidY(j)}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  strokeOpacity={isMaskedOut ? 0.2 : 0.6}
                />
              );
            }),
          )}

          {/* Synapses Layer 2 (Hidden -> Output) */}
          {A1.map((_, j) =>
            Y_hat.map((_, k) => {
              const w = W2[k][j];
              const isMaskedOut = phase === "relu_mask" && !mask[j];
              const strokeColor =
                phase === "backward"
                  ? deltaOut[k] !== 0
                    ? "#f87171"
                    : "#334155"
                  : w >= 0
                    ? isMaskedOut
                      ? "#1e293b"
                      : "#10b981"
                    : isMaskedOut
                      ? "#1e293b"
                      : "#ef4444";
              const strokeW = isMaskedOut ? 1 : Math.max(1, Math.min(4, Math.abs(w) * 3));

              return (
                <line
                  key={`syn2_${j}_${k}`}
                  x1={midX}
                  y1={hidY(j)}
                  x2={rightX}
                  y2={outY(k)}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  strokeOpacity={isMaskedOut ? 0.2 : 0.6}
                />
              );
            }),
          )}

          {/* Layer 1: Input Neurons */}
          {inputs.map((val, i) => (
            <g key={`in_${i}`} transform={`translate(${leftX}, ${inY(i)})`}>
              <circle r={22} fill="#0f172a" stroke="#38bdf8" strokeWidth={2.5} />
              <text textAnchor="middle" dy="-3" fill="#f8fafc" fontSize="11" fontWeight="bold">
                x_{i + 1}
              </text>
              <text textAnchor="middle" dy="12" fill="#38bdf8" fontSize="10">
                {val.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Layer 2: Hidden Neurons */}
          {A1.map((act, j) => {
            const isAlive = mask[j];
            const circleFill =
              phase === "relu_mask"
                ? isAlive
                  ? "#064e3b"
                  : "#450a0a"
                : phase === "backward"
                  ? isAlive
                    ? "#3b0764"
                    : "#1e1b4b"
                  : "#0f172a";
            const circleStroke = isAlive ? "#10b981" : "#ef4444";

            return (
              <g key={`hid_${j}`} transform={`translate(${midX}, ${hidY(j)})`}>
                <circle
                  r={26}
                  fill={circleFill}
                  stroke={circleStroke}
                  strokeWidth={isAlive ? 2.5 : 1.5}
                />
                {/* 1-Bit Activation Mask Indicator LED */}
                <circle cx={18} cy={-18} r={5} fill={isAlive ? "#10b981" : "#ef4444"} />

                <text textAnchor="middle" dy="-6" fill="#f8fafc" fontSize="11" fontWeight="bold">
                  h_{j + 1}
                </text>
                <text
                  textAnchor="middle"
                  dy="8"
                  fill={isAlive ? "#a7f3d0" : "#fca5a5"}
                  fontSize="10"
                >
                  {phase === "backward" ? `δ=${deltaHid[j].toFixed(2)}` : `a=${act.toFixed(2)}`}
                </text>
                <text textAnchor="middle" dy="20" fill="#94a3b8" fontSize="9">
                  {isAlive ? "ReLU=1" : "ReLU=0 (Dormant)"}
                </text>
              </g>
            );
          })}

          {/* Layer 3: Output Neurons */}
          {Y_hat.map((pred, k) => (
            <g key={`out_${k}`} transform={`translate(${rightX}, ${outY(k)})`}>
              <circle r={25} fill="#0f172a" stroke="#f59e0b" strokeWidth={2.5} />
              <text textAnchor="middle" dy="-5" fill="#f8fafc" fontSize="11" fontWeight="bold">
                ŷ_{k + 1}
              </text>
              <text textAnchor="middle" dy="8" fill="#fcd34d" fontSize="10">
                {phase === "backward" ? `δ=${deltaOut[k].toFixed(2)}` : pred.toFixed(2)}
              </text>
              <text textAnchor="middle" dy="20" fill="#94a3b8" fontSize="9">
                y*={targets[k].toFixed(1)}
              </text>
            </g>
          ))}

          {/* Layer Headings */}
          <text x={leftX} y={45} textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="bold">
            Input ($d_&#123;\text&#123;in&#125;&#125;=3$)
          </text>
          <text x={midX} y={45} textAnchor="middle" fill="#a7f3d0" fontSize="13" fontWeight="bold">
            Hidden ($d_&#123;\text&#123;hid&#125;&#125;=4$, ReLU)
          </text>
          <text
            x={rightX}
            y={45}
            textAnchor="middle"
            fill="#fcd34d"
            fontSize="13"
            fontWeight="bold"
          >
            Output ($d_&#123;\text&#123;out&#125;&#125;=2$)
          </text>
        </svg>
      </div>
    </div>
  );
};
