import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ControlPanel } from "../ControlPanel";

describe("ControlPanel render spec", () => {
  it("renders playback controls and step readout with embedded variant", () => {
    const handlePlayPause = vi.fn();
    const handleStepBack = vi.fn();
    const handleStepForward = vi.fn();
    const handleReset = vi.fn();

    render(
      <ControlPanel
        isPlaying={false}
        onPlayPause={handlePlayPause}
        onStepBack={handleStepBack}
        onStepForward={handleStepForward}
        onReset={handleReset}
        currentStep={2}
        totalSteps={10}
        speed={500}
        onSpeedChange={vi.fn()}
        dataSize={15}
        onDataSizeChange={vi.fn()}
        onGenerateRandom={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Play all steps" })).toBeInTheDocument();
    expect(screen.getByLabelText("Step 3 of 10")).toBeInTheDocument();
  });

  it("renders standalone variant and handles custom size false", () => {
    const { container } = render(
      <ControlPanel
        isPlaying={true}
        onPlayPause={vi.fn()}
        onStepBack={vi.fn()}
        onStepForward={vi.fn()}
        onReset={vi.fn()}
        currentStep={5}
        totalSteps={10}
        speed={500}
        onSpeedChange={vi.fn()}
        dataSize={15}
        onDataSizeChange={vi.fn()}
        onGenerateRandom={vi.fn()}
        supportsCustomSize={false}
        variant="standalone"
      />,
    );

    const rootEl = container.firstChild as HTMLElement;
    expect(rootEl).toHaveClass(
      "border",
      "border-[var(--border-default)]",
      "rounded-[var(--radius-md)]",
    );
    expect(screen.queryByLabelText("Element count")).not.toBeInTheDocument();
  });

  it("renders Step 0 of 0 when totalSteps is 0", () => {
    render(
      <ControlPanel
        isPlaying={false}
        onPlayPause={vi.fn()}
        onStepBack={vi.fn()}
        onStepForward={vi.fn()}
        onReset={vi.fn()}
        currentStep={0}
        totalSteps={0}
        speed={500}
        onSpeedChange={vi.fn()}
        dataSize={10}
        onDataSizeChange={vi.fn()}
        onGenerateRandom={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Step 0 of 0")).toBeInTheDocument();
  });
});
