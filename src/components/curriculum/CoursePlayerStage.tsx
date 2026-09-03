import React, { useMemo, useState } from "react";
import {
  type CourseChapter,
  type CoursePage,
  getCourseJourney,
  getCourseStepperAdapter,
  TimeTravelController,
} from "../../curriculum";
import { TimeTravelStepControls } from "./TimeTravelStepControls";

// Signature in-canvas visualizers via primitives facade
import {
  ConvexHullSweepVisualizer,
  DinicFlowVisualizer,
  FenwickTreeVisualizer,
  FlashAttentionTileVisualizer,
  Im2ColGEMMVisualizer,
  MLPBackpropVisualizer,
  PagedAttentionBlockVisualizer,
  RingAllReduceVisualizer,
  RMSNormVisualizer,
} from "../primitives";

export interface CoursePlayerStageProps {
  readonly topicId: string;
  readonly initialChapterNumber?: number;
  readonly initialPageNumber?: number;
  readonly className?: string;
}

export const CoursePlayerStage: React.FC<CoursePlayerStageProps> = ({
  topicId,
  initialChapterNumber = 1,
  initialPageNumber = 1,
  className = "",
}) => {
  const journey = getCourseJourney(topicId);
  const [activeChapter, setActiveChapter] = useState(initialChapterNumber);
  const [activePage, setActivePage] = useState(initialPageNumber);
  const [activeStage, setActiveStage] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [showStateDrawer, setShowStateDrawer] = useState(true);

  // Stepper Adapter & Time-Travel Controller
  const adapter = useMemo(() => getCourseStepperAdapter(topicId), [topicId]);
  const steps = useMemo(() => {
    if (!adapter) return [];
    return adapter.generateSteps(activeStage);
  }, [adapter, activeStage]);

  const controller = useMemo(() => new TimeTravelController(steps), [steps]);
  const [currentStep, setCurrentStep] = useState(controller.currentStep);
  const [currentDiff, setCurrentDiff] = useState(controller.currentCheckpoint?.forwardDiff);

  // Changing topic or progression stage rebuilds the controller. Re-seed the displayed
  // step during render (React's documented derive-on-prop-change pattern) so the stepper
  // bar and state inspector do not keep showing the previous course's trace.
  const [seededController, setSeededController] = useState(controller);
  if (seededController !== controller) {
    setSeededController(controller);
    setCurrentStep(controller.currentStep);
    setCurrentDiff(controller.currentCheckpoint?.forwardDiff);
  }

  const handleStepChange = () => {
    setCurrentStep(controller.currentStep);
    setCurrentDiff(controller.currentCheckpoint?.forwardDiff);
  };

  const chapters: readonly CourseChapter[] = journey?.chapters ?? [];
  const currentChapterObj: CourseChapter | undefined = chapters[activeChapter - 1];
  const pages: readonly CoursePage[] = currentChapterObj?.pages ?? [];

  // Render Canvas Primitives dynamically with concrete default topologies
  const renderVisualizerCanvas = () => {
    const width = 800;
    const height = 440;

    switch (topicId) {
      case "dsa_graph_flows_and_cuts": {
        const defaultNodes = [
          { id: 0, label: "s", level: 0, isSource: true, inCutS: true },
          { id: 1, label: "u1", level: 1, inCutS: true },
          { id: 2, label: "u2", level: 1 },
          { id: 3, label: "v1", level: 2 },
          { id: 4, label: "v2", level: 2 },
          { id: 5, label: "t", level: 3, isSink: true },
        ];
        const defaultEdges = [
          { source: 0, target: 1, capacity: 10, flow: 10 },
          { source: 0, target: 2, capacity: 10, flow: 4 },
          { source: 1, target: 3, capacity: 4, flow: 4 },
          { source: 1, target: 4, capacity: 8, flow: 6 },
          { source: 2, target: 4, capacity: 9, flow: 4 },
          { source: 3, target: 5, capacity: 10, flow: 4 },
          { source: 4, target: 5, capacity: 10, flow: 10 },
        ];
        return (
          <DinicFlowVisualizer
            nodes={defaultNodes}
            edges={defaultEdges}
            width={width}
            height={height}
            maxFlow={14}
            minCutCapacity={14}
          />
        );
      }
      case "dsa_advanced_range_queries": {
        const defaultArray = [3, 2, -1, 6, 5, 4, -3, 3, 7, 2, 3];
        const defaultTree = [0, 3, 5, -1, 10, 5, 9, -3, 19, 7, 9, 3];
        return (
          <FenwickTreeVisualizer
            array={defaultArray}
            tree={defaultTree}
            width={width}
            height={height}
            activeUpdateIndex={3}
            activeQueryIndex={7}
            prefixSumResult={19}
          />
        );
      }
      case "dsa_geometry_and_sweep_line": {
        const defaultPoints = [
          { x: 0, y: 0, label: "P1" },
          { x: 1, y: 2, label: "P2" },
          { x: 2, y: 1, label: "P3" },
          { x: 3, y: 3, label: "P4" },
          { x: 4, y: 0, label: "P5" },
        ];
        return (
          <ConvexHullSweepVisualizer
            points={defaultPoints}
            width={width}
            height={height}
            lastCrossProduct={5}
          />
        );
      }
      case "ml_flashattention_sram_tiling":
        return <FlashAttentionTileVisualizer />;
      case "ml_ring_allreduce_collective":
        return <RingAllReduceVisualizer />;
      case "ml_pagedattention_cow_vllm":
        return <PagedAttentionBlockVisualizer />;
      case "ml_rmsnorm_kernel":
        return <RMSNormVisualizer width={width} height={height} />;
      case "ml_im2col_conv_gemm":
        return <Im2ColGEMMVisualizer width={width} height={height} />;
      case "ml_mlp_backpropagation":
        return <MLPBackpropVisualizer width={width} height={height} />;
      default:
        // Default Generic Interactive Stage Canvas
        return (
          <div
            style={{
              width: "100%",
              height: "440px",
              background: "linear-gradient(180deg, #0b1120 0%, #020617 100%)",
              borderRadius: "8px",
              border: "1px solid #1e293b",
              display: "flex",
              flexDirection: "column",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8" }}>
                {currentStep?.title ?? journey?.title ?? topicId}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: "rgba(56, 189, 248, 0.1)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                {currentStep?.stageLabel ?? `Stage ${activeStage}`}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "10px", lineHeight: "1.6" }}>
              {currentStep?.description ??
                "Interactive visualizer timeline active. Step forward or play animation to inspect algorithm state."}
            </p>

            {currentStep?.codeSnippet && (
              <div
                style={{
                  marginTop: "auto",
                  padding: "12px",
                  background: "#020617",
                  borderRadius: "6px",
                  border: "1px solid #1e293b",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#a5f3fc",
                  whiteSpace: "pre-wrap",
                }}
              >
                {currentStep.codeSnippet}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className={`course-player-stage ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        color: "#f8fafc",
      }}
    >
      {/* Header: Title, Track, Breadcrumb */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          background: "rgba(15, 23, 42, 0.8)",
          padding: "16px 20px",
          borderRadius: "8px",
          border: "1px solid #334155",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: "4px",
                background: topicId.startsWith("dsa_") ? "#0369a1" : "#7c3aed",
                color: "#ffffff",
              }}
            >
              {topicId.startsWith("dsa_") ? "DSA Core Track" : "ML Systems Track"}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>/</span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{topicId}</span>
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
            {journey?.title ?? topicId}
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0 0" }}>
            {journey?.subtitle ?? "MIT 6.006 / 6.046 & Stanford CS161 / CS261 Rigor"}
          </p>
        </div>

        {/* Chapter Switcher Tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {chapters.map((ch: CourseChapter) => {
            const isActive = activeChapter === ch.chapterNumber;
            return (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChapter(ch.chapterNumber);
                  setActivePage(1);
                }}
                title={ch.title}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: isActive ? "1px solid #38bdf8" : "1px solid #334155",
                  background: isActive ? "#0284c7" : "#1e293b",
                  color: "#ffffff",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Ch {ch.chapterNumber}: {ch.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Bar: Page Selector & Code Progression Stage Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 14px",
          background: "#0f172a",
          borderRadius: "6px",
          border: "1px solid #1e293b",
        }}
      >
        {/* Page Switcher */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#64748b", marginRight: "4px" }}>Page:</span>
          {pages.map((p: CoursePage, idx: number) => (
            <button
              key={p.id}
              onClick={() => setActivePage(idx + 1)}
              style={{
                padding: "3px 10px",
                fontSize: "11px",
                borderRadius: "4px",
                border: activePage === idx + 1 ? "1px solid #38bdf8" : "1px solid transparent",
                background: activePage === idx + 1 ? "#1e293b" : "transparent",
                color: activePage === idx + 1 ? "#38bdf8" : "#94a3b8",
                cursor: "pointer",
              }}
            >
              {idx + 1}. {p.title.length > 24 ? `${p.title.slice(0, 24)}...` : p.title}
            </button>
          ))}
        </div>

        {/* 3-Stage Progression Switcher */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#64748b", marginRight: "4px" }}>
            Progression:
          </span>
          {[
            { stage: 1, label: "1: Naive" },
            { stage: 2, label: "2: Optimal" },
            { stage: 3, label: "3: Hardware-Aware" },
          ].map((st) => (
            <button
              key={st.stage}
              onClick={() => setActiveStage(st.stage)}
              style={{
                padding: "3px 8px",
                fontSize: "11px",
                borderRadius: "4px",
                border: activeStage === st.stage ? "1px solid #10b981" : "1px solid #334155",
                background: activeStage === st.stage ? "rgba(16, 185, 129, 0.15)" : "#1e293b",
                color: activeStage === st.stage ? "#34d399" : "#94a3b8",
                cursor: "pointer",
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage Canvas */}
      <div style={{ position: "relative", width: "100%" }}>{renderVisualizerCanvas()}</div>

      {/* Time-Travel Stepper Controls Bar */}
      <TimeTravelStepControls
        controller={controller}
        currentStep={currentStep}
        diff={currentDiff}
        onStepChange={handleStepChange}
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
      />

      {/* Collapsible State & Memory Inspector Drawer */}
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setShowStateDrawer(!showStateDrawer)}
        >
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>
            📊 Live Runtime State & Memory Hierarchy Inspector
          </span>
          <span style={{ fontSize: "11px", color: "#38bdf8" }}>
            {showStateDrawer ? "▲ Collapse" : "▼ Expand"}
          </span>
        </div>

        {showStateDrawer && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {/* Variables Inspector */}
            <div
              style={{
                background: "#020617",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: "6px",
                }}
              >
                Runtime Variables:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {Object.entries(currentStep?.variables ?? {}).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      fontFamily: "monospace",
                    }}
                  >
                    <span style={{ color: "#94a3b8" }}>{k}:</span>
                    <span style={{ color: "#38bdf8" }}>{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory Trace Inspector */}
            <div
              style={{
                background: "#020617",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: "6px",
                }}
              >
                L1/L2 Memory Cache Lines:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {(currentStep?.memoryTrace ?? []).length > 0 ? (
                  currentStep?.memoryTrace?.map((mem) => (
                    <div
                      key={mem.address}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "11px",
                        fontFamily: "monospace",
                      }}
                    >
                      <span style={{ color: "#64748b" }}>
                        {mem.address} ({mem.label}):
                      </span>
                      <span style={{ color: "#f8fafc" }}>{String(mem.value)}</span>
                      <span
                        style={{
                          fontSize: "9px",
                          padding: "1px 4px",
                          borderRadius: "3px",
                          background: mem.isCacheHit
                            ? "rgba(16, 185, 129, 0.2)"
                            : "rgba(239, 68, 68, 0.2)",
                          color: mem.isCacheHit ? "#10b981" : "#ef4444",
                        }}
                      >
                        {mem.isCacheHit ? "HIT" : "MISS"}
                      </span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: "11px", color: "#475569" }}>
                    Registers / Contiguous stack allocations active
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
