import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ControlPanel } from "../ControlPanel";

describe("ControlPanelButtons spec", () => {
  it("renders compact docked layout with py-1 px-3 and controls sticking to borders", () => {
    const handlePlayPause = vi.fn();
    const handleStepBack = vi.fn();
    const handleStepForward = vi.fn();
    const handleReset = vi.fn();
    const handleSpeedChange = vi.fn();
    const handleDataSizeChange = vi.fn();
    const handleGenerateRandom = vi.fn();

    const { container } = render(
      <ControlPanel
        isPlaying={false}
        onPlayPause={handlePlayPause}
        onStepBack={handleStepBack}
        onStepForward={handleStepForward}
        onReset={handleReset}
        currentStep={3}
        totalSteps={12}
        speed={400}
        onSpeedChange={handleSpeedChange}
        dataSize={20}
        onDataSizeChange={handleDataSizeChange}
        onGenerateRandom={handleGenerateRandom}
        variant="embedded"
      />,
    );

    const rootEl = container.firstChild as HTMLElement;
    expect(rootEl).toBeInTheDocument();
    expect(rootEl).toHaveClass("py-1", "px-3");

    // Verify all control buttons with full accessibility labels and keyboard shortcuts
    const playBtn = screen.getByRole("button", { name: "Play all steps" });
    expect(playBtn).toHaveAttribute("aria-keyshortcuts", "Space");
    expect(playBtn).toHaveAttribute("title", "Play (Space)");
    fireEvent.click(playBtn);
    expect(handlePlayPause).toHaveBeenCalledTimes(1);

    const stepBackBtn = screen.getByRole("button", { name: "Step backward" });
    expect(stepBackBtn).toHaveAttribute("aria-keyshortcuts", "ArrowLeft");
    fireEvent.click(stepBackBtn);
    expect(handleStepBack).toHaveBeenCalledTimes(1);

    const stepForwardBtn = screen.getByRole("button", { name: "Step forward" });
    expect(stepForwardBtn).toHaveAttribute("aria-keyshortcuts", "ArrowRight");
    fireEvent.click(stepForwardBtn);
    expect(handleStepForward).toHaveBeenCalledTimes(1);

    const resetBtn = screen.getByRole("button", { name: "Reset visualization to step 0" });
    expect(resetBtn).toHaveAttribute("aria-keyshortcuts", "KeyR");
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);

    // Verify step readout
    expect(screen.getByLabelText("Step 4 of 12")).toBeInTheDocument();

    // Verify sliders and shuffle button
    expect(screen.getByTestId("cp-speed")).toBeInTheDocument();
    expect(screen.getByTestId("cp-datasize")).toBeInTheDocument();

    const shuffleBtn = screen.getByTestId("cp-random");
    fireEvent.click(shuffleBtn);
    expect(handleGenerateRandom).toHaveBeenCalledTimes(1);
  });

  it("handles playing state and disables state-mutating controls", () => {
    render(
      <ControlPanel
        isPlaying={true}
        onPlayPause={vi.fn()}
        onStepBack={vi.fn()}
        onStepForward={vi.fn()}
        onReset={vi.fn()}
        currentStep={1}
        totalSteps={5}
        speed={500}
        onSpeedChange={vi.fn()}
        dataSize={10}
        onDataSizeChange={vi.fn()}
        onGenerateRandom={vi.fn()}
        variant="embedded"
      />,
    );

    const pauseBtn = screen.getByRole("button", { name: "Pause playback" });
    expect(pauseBtn).toBeInTheDocument();
    expect(pauseBtn).toHaveAttribute("title", "Pause (Space)");

    const resetBtn = screen.getByRole("button", { name: "Reset visualization to step 0" });
    expect(resetBtn).toBeDisabled();

    const stepBackBtn = screen.getByRole("button", { name: "Step backward" });
    expect(stepBackBtn).toBeDisabled();

    const stepForwardBtn = screen.getByRole("button", { name: "Step forward" });
    expect(stepForwardBtn).toBeDisabled();
  });
});
