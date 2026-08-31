import React, { useState } from "react";
import {
  HARDWARE_TARGETS,
  HardwareTarget,
  PrecisionFormat,
  computeRooflineProfile,
  profileTopicWorkload,
} from "../../curriculum/performanceProfiler";

export interface RooflineDashboardProps {
  initialTargetId?: string;
  initialPrecision?: PrecisionFormat;
  title?: string;
}

export const RooflineDashboard: React.FC<RooflineDashboardProps> = ({
  initialTargetId = "nvidia_h100_sxm5",
  initialPrecision = "fp16",
  title = "Interactive Hardware Roofline & Silicon Profiler",
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(initialTargetId);
  const [precision, setPrecision] = useState<PrecisionFormat>(initialPrecision);
  const [intensity, setIntensity] = useState<number>(50.0); // FLOP / Byte
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");

  const target: HardwareTarget =
    HARDWARE_TARGETS[selectedTargetId] || HARDWARE_TARGETS.nvidia_h100_sxm5;

  // Base simulation workload: 1 GFLOP normalized against intensity
  const baseFlops = 1e11;
  const bytesTransferred = baseFlops / intensity;
  const profile = computeRooflineProfile(baseFlops, bytesTransferred, target, precision);

  // Apply algorithm preset
  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey === "flash_attention") {
      const comp = profileTopicWorkload("flash_attention_vs_standard", target);
      setIntensity(Math.round(comp.optimizedProfile.arithmeticIntensity * 10) / 10);
    } else if (presetKey === "standard_attention") {
      const comp = profileTopicWorkload("flash_attention_vs_standard", target);
      setIntensity(Math.round(comp.naiveProfile.arithmeticIntensity * 100) / 100);
    } else if (presetKey === "tiled_gemm") {
      const comp = profileTopicWorkload("dense_gemm_tiling", target);
      setIntensity(Math.round(comp.optimizedProfile.arithmeticIntensity * 10) / 10);
    } else if (presetKey === "prefill") {
      const comp = profileTopicWorkload("prefill_vs_decode", target);
      setIntensity(Math.round(comp.optimizedProfile.arithmeticIntensity * 10) / 10);
    } else if (presetKey === "decode") {
      const comp = profileTopicWorkload("prefill_vs_decode", target);
      setIntensity(Math.round(comp.naiveProfile.arithmeticIntensity * 100) / 100);
    }
  };

  // SVG Chart Geometry (Log-Log Scale from 0.01 to 1000 FLOP/byte, 0.1 to 4000 TFLOP/s)
  const chartW = 760;
  const chartH = 340;
  const padLeft = 70;
  const padBottom = 50;
  const padTop = 30;
  const padRight = 30;

  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  const minLogI = -2; // 10^-2 = 0.01
  const maxLogI = 3; // 10^3 = 1000
  const minLogP = -1; // 10^-1 = 0.1 TFLOP/s
  const maxLogP = 4; // 10^4 = 10,000 TFLOP/s

  const logToX = (val: number) => {
    const logVal = Math.log10(Math.max(0.01, Math.min(1000, val)));
    const frac = (logVal - minLogI) / (maxLogI - minLogI);
    return padLeft + frac * plotW;
  };

  const logToY = (val: number) => {
    const logVal = Math.log10(Math.max(0.1, Math.min(10000, val)));
    const frac = (logVal - minLogP) / (maxLogP - minLogP);
    return padTop + (1 - frac) * plotH;
  };

  // Ridge Point coordinates
  const ridgeX = logToX(profile.ridgePoint);
  const peakY = logToY(profile.peakComputeTflops);

  // Bandwidth line start at min intensity (0.01 FLOP/byte)
  const startPerfAt001 = (0.01 * target.peakMemoryBandwidthGBs) / 1000;
  const startY = logToY(startPerfAt001);

  // Current Operating Point
  const currentX = logToX(profile.arithmeticIntensity);
  const currentY = logToY(profile.attainablePerformanceTflops);

  return (
    <div
      data-testid="roofline-dashboard"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "#090d16",
        borderRadius: "14px",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Control Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.95)",
          borderBottom: "1px solid rgba(56, 189, 248, 0.2)",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#38bdf8" }}>
            {title}
          </h2>
          <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Williams et al. Analytical Roofline: Arithmetic Intensity vs Attainable Compute Bounds
          </p>
        </div>

        {/* Selectors */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Target Selector */}
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            style={{
              padding: "6px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {Object.values(HARDWARE_TARGETS).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.peakMemoryBandwidthGBs} GB/s)
              </option>
            ))}
          </select>

          {/* Precision Selector */}
          <select
            value={precision}
            onChange={(e) => setPrecision(e.target.value as PrecisionFormat)}
            style={{
              padding: "6px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <option value="fp8">FP8 Tensor</option>
            <option value="fp16">FP16 / BF16 Tensor</option>
            <option value="fp32">FP32 Standard</option>
          </select>
        </div>
      </div>

      {/* Preset Algorithm Workloads */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px 24px",
          background: "rgba(30, 41, 59, 0.4)",
          borderBottom: "1px solid #1e293b",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
          Algorithm Presets:
        </span>
        {[
          { id: "flash_attention", label: "⚡ FlashAttention-2 (I ≈ 64)" },
          { id: "standard_attention", label: "🐢 Standard Attention (I ≈ 1.2)" },
          { id: "tiled_gemm", label: "🧱 Block-Tiled GEMM (I ≈ 85)" },
          { id: "prefill", label: "🚀 LLM Prefill GEMM (I ≈ 68)" },
          { id: "decode", label: "🛑 LLM Decode GEMV (I ≈ 0.9)" },
        ].map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetSelect(preset.id)}
            style={{
              padding: "4px 10px",
              background: selectedPreset === preset.id ? "#0284c7" : "#1e293b",
              border: selectedPreset === preset.id ? "1px solid #38bdf8" : "1px solid #334155",
              color: selectedPreset === preset.id ? "#ffffff" : "#cbd5e1",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: selectedPreset === preset.id ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* KPI Cards Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.7)",
        }}
      >
        {/* Attainable TFLOP/s */}
        <div
          style={{
            background: "#0f172a",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            ATTAINABLE PERFORMANCE
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8", marginTop: "2px" }}>
            {profile.attainablePerformanceTflops.toFixed(1)}{" "}
            <span style={{ fontSize: "12px", color: "#64748b" }}>TFLOP/s</span>
          </div>
        </div>

        {/* Operational Regime */}
        <div
          style={{
            background: "#0f172a",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            OPERATIONAL REGIME
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: profile.operationalRegime === "COMPUTE_BOUND" ? "#34d399" : "#f59e0b",
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: profile.operationalRegime === "COMPUTE_BOUND" ? "#10b981" : "#f59e0b",
              }}
            />
            {profile.operationalRegime === "COMPUTE_BOUND" ? "COMPUTE BOUND" : "MEMORY BOUND"}
          </div>
        </div>

        {/* Arithmetic Intensity */}
        <div
          style={{
            background: "#0f172a",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            ARITHMETIC INTENSITY
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#e2e8f0", marginTop: "2px" }}>
            {intensity.toFixed(2)}{" "}
            <span style={{ fontSize: "12px", color: "#64748b" }}>FLOP/B</span>
          </div>
        </div>

        {/* Ridge Point */}
        <div
          style={{
            background: "#0f172a",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            SILICON RIDGE POINT (I*)
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#c084fc", marginTop: "2px" }}>
            {profile.ridgePoint.toFixed(1)}{" "}
            <span style={{ fontSize: "12px", color: "#64748b" }}>FLOP/B</span>
          </div>
        </div>
      </div>

      {/* SVG Roofline Chart */}
      <div style={{ padding: "0 24px", width: "100%", boxSizing: "border-box" }}>
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            background: "#060911",
            borderRadius: "10px",
            border: "1px solid #1e293b",
          }}
        >
          {/* Defs */}
          <defs>
            <linearGradient id="rooflineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Log Axes */}
          {[-2, -1, 0, 1, 2, 3].map((exp) => {
            const val = Math.pow(10, exp);
            const x = logToX(val);
            return (
              <g key={`x-grid-${exp}`}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={chartH - padBottom}
                  stroke="#1e293b"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={chartH - padBottom + 18}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize={10}
                >
                  {val >= 1 ? val : val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {[-1, 0, 1, 2, 3, 4].map((exp) => {
            const val = Math.pow(10, exp);
            const y = logToY(val);
            return (
              <g key={`y-grid-${exp}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartW - padRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize={10}>
                  {val >= 1 ? val : val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={chartW / 2}
            y={chartH - 12}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={11}
            fontWeight={600}
          >
            Arithmetic Intensity (FLOPs / Byte transferred from DRAM)
          </text>
          <text
            x={-chartH / 2}
            y={20}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={11}
            fontWeight={600}
            transform="rotate(-90)"
          >
            Attainable Performance (TFLOP/s)
          </text>

          {/* Ridge Point Vertical Guide */}
          <line
            x1={ridgeX}
            y1={padTop}
            x2={ridgeX}
            y2={chartH - padBottom}
            stroke="#a855f7"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.7}
          />
          <text x={ridgeX + 6} y={padTop + 20} fill="#c084fc" fontSize={10} fontWeight={700}>
            Ridge Point I* = {profile.ridgePoint.toFixed(1)}
          </text>

          {/* Roofline Ceiling Polygon (Slanted Bandwidth Roof + Flat Compute Roof) */}
          <path
            d={`M ${logToX(0.01)} ${startY} L ${ridgeX} ${peakY} L ${logToX(1000)} ${peakY} L ${logToX(1000)} ${chartH - padBottom} L ${logToX(0.01)} ${chartH - padBottom} Z`}
            fill="url(#rooflineGrad)"
          />
          <path
            d={`M ${logToX(0.01)} ${startY} L ${ridgeX} ${peakY} L ${logToX(1000)} ${peakY}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={3}
          />

          {/* Bandwidth Slope Label */}
          <text
            x={logToX(0.05)}
            y={startY - 18}
            fill="#38bdf8"
            fontSize={10}
            fontWeight={700}
            transform={`rotate(-28, ${logToX(0.05)}, ${startY - 18})`}
          >
            Memory Bandwidth: {target.peakMemoryBandwidthGBs} GB/s
          </text>

          {/* Peak Compute Label */}
          <text x={logToX(300)} y={peakY - 10} fill="#38bdf8" fontSize={11} fontWeight={700}>
            Peak Compute: {profile.peakComputeTflops} TFLOP/s
          </text>

          {/* Active Workload Operating Dot */}
          <circle
            cx={currentX}
            cy={currentY}
            r={8}
            fill={profile.operationalRegime === "COMPUTE_BOUND" ? "#34d399" : "#f59e0b"}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <circle
            cx={currentX}
            cy={currentY}
            r={14}
            fill="none"
            stroke={profile.operationalRegime === "COMPUTE_BOUND" ? "#34d399" : "#f59e0b"}
            strokeWidth={1.5}
            opacity={0.6}
          />

          <text
            x={currentX}
            y={currentY - 18}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={11}
            fontWeight={800}
          >
            {profile.attainablePerformanceTflops.toFixed(1)} TFLOP/s
          </text>
        </svg>
      </div>

      {/* Interactive Intensity Slider */}
      <div style={{ padding: "18px 24px 24px 24px", background: "rgba(15, 23, 42, 0.9)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>
            Adjust Arithmetic Intensity:{" "}
            <span style={{ color: "#38bdf8" }}>{intensity.toFixed(2)} FLOP/byte</span>
          </label>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            {intensity < profile.ridgePoint
              ? `Bandwidth Bottleneck (${Math.round((intensity / profile.ridgePoint) * 100)}% of compute roof)`
              : "Saturating Tensor Cores (100% Compute Roof)"}
          </span>
        </div>
        <input
          type="range"
          min="-2"
          max="3"
          step="0.05"
          value={Math.log10(Math.max(0.01, intensity))}
          onChange={(e) => {
            setSelectedPreset("custom");
            setIntensity(Math.round(Math.pow(10, parseFloat(e.target.value)) * 100) / 100);
          }}
          style={{ width: "100%", accentColor: "#0284c7", cursor: "pointer" }}
        />
      </div>
    </div>
  );
};
