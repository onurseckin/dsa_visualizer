import React, { useState } from "react";
import {
  CLUSTER_TOPOLOGIES,
  ClusterTopology,
  MODEL_ARCHITECTURES,
  ModelArchitectureConfig,
  ZeROStage,
  simulate3DParallelism,
} from "../../curriculum/distributedSimulator";

export interface DistributedClusterSimulatorViewProps {
  initialModelId?: string;
  initialClusterId?: string;
  title?: string;
}

export const DistributedClusterSimulatorView: React.FC<DistributedClusterSimulatorViewProps> = ({
  initialModelId = "llama3_70b",
  initialClusterId = "h100_cluster_64",
  title = "3D Parallelism & Distributed Cluster Memory Simulator",
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
  const [selectedClusterId, setSelectedClusterId] = useState<string>(initialClusterId);
  const [tpDegree, setTpDegree] = useState<number>(8);
  const [ppDegree, setPpDegree] = useState<number>(4);
  const [dpDegree, setDpDegree] = useState<number>(2);
  const [zeroStage, setZeroStage] = useState<ZeROStage>(3);
  const [activationCheckpointing, setActivationCheckpointing] = useState<boolean>(true);
  const [numMicrobatches] = useState<number>(16);
  const [seqLen] = useState<number>(4096);

  const model: ModelArchitectureConfig =
    MODEL_ARCHITECTURES[selectedModelId] || MODEL_ARCHITECTURES.llama3_70b;
  const cluster: ClusterTopology =
    CLUSTER_TOPOLOGIES[selectedClusterId] || CLUSTER_TOPOLOGIES.h100_cluster_64;

  const simResult = simulate3DParallelism(model, cluster, {
    tpDegree,
    ppDegree,
    dpDegree,
    numMicrobatches,
    microbatchSize: 1,
    seqLen,
    zeroStage,
    activationCheckpointing,
  });

  const totalGpus = tpDegree * ppDegree * dpDegree;
  const mem = simResult.memoryPerGpuGB;
  const maxMem = cluster.gpuMemoryGB;

  // Percentage widths for stacked memory bar
  const weightsPct = Math.min(100, (mem.weights / maxMem) * 100);
  const gradientsPct = Math.min(100, (mem.gradients / maxMem) * 100);
  const optimizerPct = Math.min(100, (mem.optimizerStates / maxMem) * 100);
  const activationsPct = Math.min(100, (mem.activations / maxMem) * 100);

  return (
    <div
      data-testid="distributed-cluster-simulator-view"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "#090d16",
        borderRadius: "14px",
        border: "1px solid rgba(168, 85, 247, 0.25)",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.95)",
          borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#c084fc" }}>
            {title}
          </h2>
          <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Model Sharding (TP × PP × DP), ZeRO-1/2/3 Optimizer Partitioning, and 1F1B Bubble
            Schedulers
          </p>
        </div>

        {/* Cluster & Model Selectors */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Model Selector */}
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
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
            {Object.values(MODEL_ARCHITECTURES).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({(m.numParameters / 1e9).toFixed(1)}B Params)
              </option>
            ))}
          </select>

          {/* Cluster Selector */}
          <select
            value={selectedClusterId}
            onChange={(e) => setSelectedClusterId(e.target.value)}
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
            {Object.values(CLUSTER_TOPOLOGIES).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3D Parallelism Grid Controls */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          padding: "16px 24px",
          background: "rgba(30, 41, 59, 0.3)",
          borderBottom: "1px solid #1e293b",
        }}
      >
        {/* TP Degree */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
            TENSOR PARALLELISM (TP = {tpDegree})
          </label>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            {[1, 2, 4, 8].map((val) => (
              <button
                key={`tp-${val}`}
                onClick={() => setTpDegree(val)}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  background: tpDegree === val ? "#0284c7" : "#1e293b",
                  border: tpDegree === val ? "1px solid #38bdf8" : "1px solid #334155",
                  color: tpDegree === val ? "#ffffff" : "#cbd5e1",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* PP Degree */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
            PIPELINE PARALLELISM (PP = {ppDegree})
          </label>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            {[1, 2, 4, 8, 16].map((val) => (
              <button
                key={`pp-${val}`}
                onClick={() => setPpDegree(val)}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  background: ppDegree === val ? "#7e22ce" : "#1e293b",
                  border: ppDegree === val ? "1px solid #c084fc" : "1px solid #334155",
                  color: ppDegree === val ? "#ffffff" : "#cbd5e1",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* DP Degree */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
            DATA PARALLELISM (DP = {dpDegree})
          </label>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            {[1, 2, 4, 8, 16, 32].map((val) => (
              <button
                key={`dp-${val}`}
                onClick={() => setDpDegree(val)}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  background: dpDegree === val ? "#059669" : "#1e293b",
                  border: dpDegree === val ? "1px solid #34d399" : "1px solid #334155",
                  color: dpDegree === val ? "#ffffff" : "#cbd5e1",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* ZeRO Stage */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
            ZERO MEMORY SHARDING
          </label>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            {([0, 1, 2, 3] as ZeROStage[]).map((stage) => (
              <button
                key={`zero-${stage}`}
                onClick={() => setZeroStage(stage)}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  background: zeroStage === stage ? "#d97706" : "#1e293b",
                  border: zeroStage === stage ? "1px solid #fbbf24" : "1px solid #334155",
                  color: zeroStage === stage ? "#ffffff" : "#cbd5e1",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Z{stage}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GPU Resources Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 24px",
          background:
            totalGpus <= cluster.totalGpus ? "rgba(6, 78, 59, 0.25)" : "rgba(153, 27, 27, 0.3)",
          borderBottom: "1px solid #1e293b",
          fontSize: "12px",
        }}
      >
        <span style={{ color: "#e2e8f0" }}>
          <strong>Total GPUs Requested:</strong> {tpDegree} × {ppDegree} × {dpDegree} ={" "}
          <span
            style={{
              color: totalGpus <= cluster.totalGpus ? "#34d399" : "#f87171",
              fontWeight: 800,
            }}
          >
            {totalGpus} GPUs
          </span>{" "}
          (Cluster capacity: {cluster.totalGpus} GPUs)
        </span>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#cbd5e1",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={activationCheckpointing}
              onChange={(e) => setActivationCheckpointing(e.target.checked)}
              style={{ accentColor: "#059669" }}
            />
            Activation Checkpointing (Recompute)
          </label>
        </div>
      </div>

      {/* GPU Memory Allocation Section */}
      <div style={{ padding: "20px 24px", background: "rgba(15, 23, 42, 0.8)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>
            Per-GPU HBM Memory Allocation:{" "}
            <span style={{ color: mem.fitsInGpuMemory ? "#34d399" : "#f87171" }}>
              {mem.totalPeak.toFixed(1)} GB / {maxMem} GB ({mem.hbmUtilizationPercent}%)
            </span>
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              background: mem.fitsInGpuMemory
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(239, 68, 68, 0.2)",
              color: mem.fitsInGpuMemory ? "#34d399" : "#f87171",
              border: mem.fitsInGpuMemory ? "1px solid #10b981" : "1px solid #ef4444",
            }}
          >
            {mem.fitsInGpuMemory ? "FITS IN HBM" : "OUT OF MEMORY (OOM)"}
          </span>
        </div>

        {/* Stacked Memory Progress Bar */}
        <div
          style={{
            height: "28px",
            width: "100%",
            background: "#0f172a",
            borderRadius: "6px",
            border: "1px solid #334155",
            overflow: "hidden",
            display: "flex",
            position: "relative",
          }}
        >
          {/* Weights */}
          <div
            title={`Weights: ${mem.weights} GB`}
            style={{
              width: `${weightsPct}%`,
              background: "#38bdf8",
              height: "100%",
            }}
          />
          {/* Gradients */}
          <div
            title={`Gradients: ${mem.gradients} GB`}
            style={{
              width: `${gradientsPct}%`,
              background: "#a855f7",
              height: "100%",
            }}
          />
          {/* Optimizer States */}
          <div
            title={`Optimizer: ${mem.optimizerStates} GB`}
            style={{
              width: `${optimizerPct}%`,
              background: "#f59e0b",
              height: "100%",
            }}
          />
          {/* Activations */}
          <div
            title={`Activations: ${mem.activations} GB`}
            style={{
              width: `${activationsPct}%`,
              background: "#10b981",
              height: "100%",
            }}
          />
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "10px",
            flexWrap: "wrap",
            fontSize: "11px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#cbd5e1" }}>
            <span
              style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#38bdf8" }}
            />
            Weights ({mem.weights} GB)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#cbd5e1" }}>
            <span
              style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#a855f7" }}
            />
            Gradients ({mem.gradients} GB)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#cbd5e1" }}>
            <span
              style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#f59e0b" }}
            />
            Optimizer ({mem.optimizerStates} GB)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#cbd5e1" }}>
            <span
              style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#10b981" }}
            />
            Activations ({mem.activations} GB)
          </div>
        </div>
      </div>

      {/* Communication Latency & Bubble Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.95)",
          borderTop: "1px solid #1e293b",
        }}
      >
        {/* TP NVLink All-Reduce */}
        <div
          style={{
            background: "#0f172a",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>
            TP ALL-REDUCE (NVLINK)
          </div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#38bdf8", marginTop: "2px" }}>
            {simResult.communication.tpVolumePerStepMB} MB{" "}
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              ({simResult.communication.tpTimePerStepMs} ms)
            </span>
          </div>
        </div>

        {/* PP 1F1B Bubble */}
        <div
          style={{
            background: "#0f172a",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>
            1F1B PIPELINE BUBBLE
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: simResult.communication.ppBubbleFraction > 20 ? "#f87171" : "#34d399",
              marginTop: "2px",
            }}
          >
            {simResult.communication.ppBubbleFraction}%
          </div>
        </div>

        {/* DP InfiniBand All-Reduce */}
        <div
          style={{
            background: "#0f172a",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>
            DP ALL-REDUCE (INFINIBAND)
          </div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#c084fc", marginTop: "2px" }}>
            {simResult.communication.dpVolumePerStepMB} MB{" "}
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              ({simResult.communication.dpTimePerStepMs} ms)
            </span>
          </div>
        </div>

        {/* Total Communication Time */}
        <div
          style={{
            background: "#0f172a",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>
            TOTAL COMM LATENCY
          </div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#fbbf24", marginTop: "2px" }}>
            {simResult.communication.totalCommTimePerStepMs} ms
          </div>
        </div>
      </div>

      {/* Systems Insights Footer */}
      <div style={{ padding: "12px 24px", background: "#060911", borderTop: "1px solid #1e293b" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
          SYSTEMS INSIGHTS & BOTTLENECK DIAGNOSTICS:
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: "16px",
            fontSize: "11px",
            color: "#cbd5e1",
            lineHeight: 1.5,
          }}
        >
          {simResult.insights.map((insight, idx) => (
            <li key={`insight-${idx}`}>{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
