import React from "react";
import { AlgorithmStep } from "../../../types/dsa";
import { ArrayVisualizer } from "../../primitives/ArrayVisualizer";
import { GridVisualizer } from "../../primitives/GridVisualizer";
import { GraphVisualizer } from "../../primitives/GraphVisualizer";
import { TreeVisualizer } from "../../primitives/TreeVisualizer";
import { ControlPanel, ControlPanelProps } from "../../../ui";
import { Card } from "../../../ui";

interface PrimaryVisualizerCanvasProps {
  currentStep?: AlgorithmStep | null;
  resolvedControlProps: ControlPanelProps | null;
}

export const PrimaryVisualizerCanvas: React.FC<PrimaryVisualizerCanvasProps> = ({
  currentStep,
  resolvedControlProps,
}) => {
  const primarySnapshot = currentStep?.primarySnapshot;

  const renderPrimaryVisualizer = () => {
    if (!primarySnapshot) return null;

    switch (primarySnapshot.kind) {
      case "array":
        return <ArrayVisualizer elements={primarySnapshot.elements} />;
      case "grid":
        return <GridVisualizer grid={primarySnapshot.grid} />;
      case "graph":
        return <GraphVisualizer nodes={primarySnapshot.nodes} edges={primarySnapshot.edges} />;
      case "tree":
        return <TreeVisualizer nodes={primarySnapshot.nodes} rootId={primarySnapshot.rootId} />;
      default:
        return null;
    }
  };

  return (
    <Card
      data-panel="visualizer"
      padding="none"
      style={{
        height: "100%",
        width: "100%",
        minHeight: 0,
        borderColor: "var(--border-default)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          minHeight: 0,
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          data-region="canvas"
          data-testid="canvas-container"
          className="min-h-0 w-full overflow-hidden"
          style={{
            flex: "1 1 0%",
            width: "100%",
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            overflowX: "hidden",
            overflowY: "hidden",
            padding: 0,
            background: "var(--bg-inset)",
          }}
        >
          {renderPrimaryVisualizer() || (
            <div
              style={{
                margin: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--space-2)",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: 0,
              }}
            >
              <p
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                No visual snapshot available
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                Select an algorithm step or click Play to begin visualization.
              </p>
            </div>
          )}
        </div>

        {resolvedControlProps && (
          <div data-region="controls" className="shrink-0 w-full" style={{ flexShrink: 0, width: "100%" }}>
            <ControlPanel {...resolvedControlProps} variant="embedded" />
          </div>
        )}
      </div>
    </Card>
  );
};
