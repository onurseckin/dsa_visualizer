import React, { useState } from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";

export interface RMSNormVisualizerProps {
  readonly initialVector?: readonly number[];
  readonly initialGains?: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly eps?: number;
}

export const RMSNormVisualizer: React.FC<RMSNormVisualizerProps> = ({
  initialVector = [3.0, -4.0, 1.5, 2.5],
  initialGains = [1.0, 1.2, 0.8, 1.1],
  width = 860,
  height = 500,
  title = "Root Mean Square Normalization (RMSNorm) & Orthogonal Gradient Projection",
  eps = 1e-6,
}) => {
  const { ref, box } = useCanvasBox({ width, height });
  const [vector, setVector] = useState<readonly number[]>(initialVector);
  const [gains] = useState<readonly number[]>(initialGains);
  const [showGradientProjection, setShowGradientProjection] = useState(true);

  const D = vector.length;

  // 1. RMS Calculation: RMS(x) = sqrt(1/D * sum(x_i^2) + eps)
  const sumSq = vector.reduce((acc, v) => acc + v * v, 0);
  const meanSq = sumSq / D;
  const rms = Math.sqrt(meanSq + eps);

  // 2. Normalized vector x_bar = x / RMS(x)
  const xBar = vector.map((v) => v / rms);

  // 3. Simulated incoming loss gradient dL/dy = [1.0, -0.5, 0.8, -0.2]
  const dL_dy = [1.0, -0.5, 0.8, -0.2];
  // dL/dx_bar = dL/dy * gamma
  const dL_dxBar = dL_dy.map((grad, i) => grad * gains[i]);

  // Dot product <dL/dx_bar, x_bar>
  const dotProduct = dL_dxBar.reduce((acc, g, i) => acc + g * xBar[i], 0);

  // Orthogonal projection: dL/dx = (1/RMS) * [dL/dx_bar - x_bar * (1/D * <dL/dx_bar, x_bar>)]
  const dL_dx = dL_dxBar.map((g, i) => (1 / rms) * (g - (xBar[i] * dotProduct) / D));

  // Verify orthogonality: <dL/dx, vector> approx 0
  const orthogonalCheck = dL_dx.reduce((acc, g, i) => acc + g * vector[i], 0);

  // Layout metrics
  const sphereCenterX = box.width - 220;
  const sphereCenterY = box.height / 2 + 10;
  const sphereR = 100;

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
      {/* Header */}
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
            $\text&#123;RMS&#125;(x) = \sqrt&#123;\frac&#123;1&#125;&#123;D&#125;\sum x_i^2&#125;$:{" "}
            <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{rms.toFixed(4)}</span> |
            Orthogonal Inner Product:{" "}
            <span style={{ color: "#10b981", fontWeight: "bold" }}>
              {Math.abs(orthogonalCheck).toFixed(6)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowGradientProjection(!showGradientProjection)}
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              backgroundColor: showGradientProjection ? "#0369a1" : "#1e293b",
              color: "#f8fafc",
              border: "1px solid #38bdf8",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {showGradientProjection ? "Hide Gradient Tangent Plane" : "Show Gradient Tangent Plane"}
          </button>
          <button
            onClick={() =>
              setVector([
                Math.round((Math.random() * 6 - 3) * 10) / 10,
                Math.round((Math.random() * 6 - 3) * 10) / 10,
                Math.round((Math.random() * 6 - 3) * 10) / 10,
                Math.round((Math.random() * 6 - 3) * 10) / 10,
              ])
            }
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              backgroundColor: "#1e293b",
              color: "#38bdf8",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Randomize $x \in \mathbb&#123;R&#125;^D$
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
          {/* Left Side: Vector Element Bars */}
          <g transform="translate(40, 60)">
            <text x={0} y={0} fill="#38bdf8" fontSize="13" fontWeight="bold">
              1. Raw Input Vector $x \in \mathbb&#123;R&#125;^4$
            </text>

            {vector.map((val, i) => {
              const barH = Math.min(100, Math.abs(val) * 20);
              const barY = val >= 0 ? 60 - barH : 60;
              const barFill = val >= 0 ? "#38bdf8" : "#f43f5e";
              return (
                <g key={`raw_${i}`} transform={`translate(${i * 65}, 0)`}>
                  <line x1={0} y1={60} x2={45} y2={60} stroke="#334155" strokeWidth={1} />
                  <rect
                    x={5}
                    y={barY}
                    width={35}
                    height={barH}
                    fill={barFill}
                    rx={3}
                    fillOpacity={0.7}
                  />
                  <text x={22} y={135} textAnchor="middle" fill="#94a3b8" fontSize="10">
                    x_{i + 1}
                  </text>
                  <text
                    x={22}
                    y={val >= 0 ? barY - 5 : barY + barH + 12}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="10"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>

          <g transform="translate(40, 220)">
            <text x={0} y={0} fill="#10b981" fontSize="13" fontWeight="bold">
              2. Normalized Vector $\bar&#123;x&#125; = x / \text&#123;RMS&#125;(x)$ (Zero Mean
              Shift Omitted)
            </text>

            {xBar.map((val, i) => {
              const barH = Math.min(100, Math.abs(val) * 30);
              const barY = val >= 0 ? 60 - barH : 60;
              const barFill = val >= 0 ? "#10b981" : "#fb7185";
              return (
                <g key={`norm_${i}`} transform={`translate(${i * 65}, 0)`}>
                  <line x1={0} y1={60} x2={45} y2={60} stroke="#334155" strokeWidth={1} />
                  <rect
                    x={5}
                    y={barY}
                    width={35}
                    height={barH}
                    fill={barFill}
                    rx={3}
                    fillOpacity={0.8}
                  />
                  <text x={22} y={135} textAnchor="middle" fill="#94a3b8" fontSize="10">
                    x̄_{i + 1}
                  </text>
                  <text
                    x={22}
                    y={val >= 0 ? barY - 5 : barY + barH + 12}
                    textAnchor="middle"
                    fill="#a7f3d0"
                    fontSize="10"
                  >
                    {val.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Right Side: Geometric Hypersphere Projection & Tangent Gradient Plane */}
          <g transform={`translate(${sphereCenterX}, ${sphereCenterY})`}>
            {/* Unit Hypersphere */}
            <circle
              r={sphereR}
              fill="rgba(15, 23, 42, 0.6)"
              stroke="#334155"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <ellipse rx={sphereR} ry={30} fill="none" stroke="#1e293b" strokeWidth={1} />

            {/* Coordinate Axes */}
            <line
              x1={-sphereR - 20}
              y1={0}
              x2={sphereR + 20}
              y2={0}
              stroke="#1e293b"
              strokeWidth={1}
            />
            <line
              x1={0}
              y1={-sphereR - 20}
              x2={0}
              y2={sphereR + 20}
              stroke="#1e293b"
              strokeWidth={1}
            />

            {/* Normalized Point on Sphere */}
            {(() => {
              const normX = Math.min(sphereR - 5, (xBar[0] / 2) * sphereR);
              const normY = Math.min(sphereR - 5, -(xBar[1] / 2) * sphereR);

              // Tangent Plane line slope
              const tanLen = 60;
              const tanDx = -normY;
              const tanDy = normX;
              const len = Math.sqrt(tanDx * tanDx + tanDy * tanDy) || 1;
              const unitTanX = (tanDx / len) * tanLen;
              const unitTanY = (tanDy / len) * tanLen;

              return (
                <>
                  {/* Origin to point vector */}
                  <line x1={0} y1={0} x2={normX} y2={normY} stroke="#38bdf8" strokeWidth={2.5} />
                  <circle cx={normX} cy={normY} r={5} fill="#38bdf8" />
                  <text x={normX + 8} y={normY - 8} fill="#38bdf8" fontSize="11" fontWeight="bold">
                    $\bar&#123;x&#125; \in \mathbb&#123;S&#125;^&#123;D-1&#125;$
                  </text>

                  {/* Orthogonal Tangent Gradient Plane */}
                  {showGradientProjection && (
                    <>
                      <line
                        x1={normX - unitTanX}
                        y1={normY - unitTanY}
                        x2={normX + unitTanX}
                        y2={normY + unitTanY}
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                      <line
                        x1={normX}
                        y1={normY}
                        x2={normX + unitTanX * 0.7}
                        y2={normY + unitTanY * 0.7}
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                      />
                      <text
                        x={normX + unitTanX * 0.7 + 5}
                        y={normY + unitTanY * 0.7}
                        fill="#f59e0b"
                        fontSize="10"
                      >
                        $\nabla_x \mathcal&#123;L&#125; \perp \bar&#123;x&#125;$
                      </text>
                    </>
                  )}
                </>
              );
            })()}

            <text x={0} y={sphereR + 35} textAnchor="middle" fill="#94a3b8" fontSize="11">
              Unit Hypersphere Projection $\bar&#123;x&#125; \in
              \mathcal&#123;S&#125;^&#123;D-1&#125;$
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
