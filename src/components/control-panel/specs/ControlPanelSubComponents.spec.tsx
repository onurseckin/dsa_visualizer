import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ControlPanelDataSizeControls,
  ControlPanelPlayback,
  ControlPanelSpeedSlider,
  ControlPanelStepReadout,
} from "../ControlPanelSubComponents";

describe("ControlPanelSubComponents", () => {
  it("wires every enabled playback control to its corresponding action", () => {
    const actions = {
      onPlayPause: vi.fn(),
      onStepBack: vi.fn(),
      onStepForward: vi.fn(),
      onReset: vi.fn(),
    };

    render(<ControlPanelPlayback {...actions} isPlaying={false} currentStep={2} totalSteps={5} />);

    fireEvent.click(screen.getByRole("button", { name: "Reset to first step" }));
    fireEvent.click(screen.getByRole("button", { name: "Step backward" }));
    fireEvent.click(screen.getByRole("button", { name: "Play all steps" }));
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));

    expect(actions.onReset).toHaveBeenCalledTimes(1);
    expect(actions.onStepBack).toHaveBeenCalledTimes(1);
    expect(actions.onPlayPause).toHaveBeenCalledTimes(1);
    expect(actions.onStepForward).toHaveBeenCalledTimes(1);
  });

  it("disables navigation while playing and at the sequence boundaries", () => {
    const actions = {
      onPlayPause: vi.fn(),
      onStepBack: vi.fn(),
      onStepForward: vi.fn(),
      onReset: vi.fn(),
    };
    const { rerender } = render(
      <ControlPanelPlayback {...actions} isPlaying={false} currentStep={0} totalSteps={1} />,
    );

    expect(screen.getByRole("button", { name: "Step backward" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Step forward" })).toBeDisabled();

    rerender(<ControlPanelPlayback {...actions} isPlaying currentStep={0} totalSteps={3} />);

    expect(screen.getByRole("button", { name: "Reset to first step" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Step backward" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Step forward" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pause playback" })).toBeEnabled();
  });

  it("inverts the speed slider into playback delay milliseconds", () => {
    const onSpeedChange = vi.fn();
    render(<ControlPanelSpeedSlider speed={250} onSpeedChange={onSpeedChange} />);

    const slider = screen.getByRole("slider", { name: "Speed" });
    expect(slider).toHaveAttribute("aria-valuenow", "800");
    expect(screen.getByText("250 ms")).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "600" } });
    expect(onSpeedChange).toHaveBeenCalledWith(450);
  });

  it("reports zero total steps and controls the random-data actions while playing", () => {
    const onDataSizeChange = vi.fn();
    const onGenerateRandom = vi.fn();
    const { rerender } = render(
      <>
        <ControlPanelStepReadout currentStep={0} totalSteps={0} />
        <ControlPanelDataSizeControls
          dataSize={12}
          onDataSizeChange={onDataSizeChange}
          onGenerateRandom={onGenerateRandom}
          isPlaying={false}
        />
      </>,
    );

    expect(screen.getByLabelText("Step 0 of 0")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider", { name: "Elements" }), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate new random input" }));
    expect(onDataSizeChange).toHaveBeenCalledWith(20);
    expect(onGenerateRandom).toHaveBeenCalledTimes(1);

    rerender(
      <ControlPanelDataSizeControls
        dataSize={12}
        onDataSizeChange={onDataSizeChange}
        onGenerateRandom={onGenerateRandom}
        isPlaying
      />,
    );
    expect(screen.getByRole("slider", { name: "Elements" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Generate new random input" })).toBeDisabled();
  });
});
