import type { ReactElement } from "react";
import {
  ControlPanelDataSizeControls,
  ControlPanelDataSizeControlsProps,
  ControlPanelPlayback,
  ControlPanelPlaybackProps,
  ControlPanelSpeedSlider,
  ControlPanelSpeedSliderProps,
  ControlPanelStepReadout,
  ControlPanelStepReadoutProps,
} from "./control-panel/ControlPanelSubComponents";

export type {
  ControlPanelPlaybackProps,
  ControlPanelStepReadoutProps,
  ControlPanelSpeedSliderProps,
  ControlPanelDataSizeControlsProps,
};

export {
  ControlPanelPlayback,
  ControlPanelStepReadout,
  ControlPanelSpeedSlider,
  ControlPanelDataSizeControls,
};

export interface ControlPanelProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  currentStep: number;
  totalSteps: number;
  speed: number;
  onSpeedChange: (speed: number) => void;
  dataSize: number;
  onDataSizeChange: (size: number) => void;
  onGenerateRandom: () => void;
  supportsCustomSize?: boolean;
  variant?: "standalone" | "embedded";
}

export function ControlPanel({
  isPlaying,
  onPlayPause,
  onStepBack,
  onStepForward,
  onReset,
  currentStep,
  totalSteps,
  speed,
  onSpeedChange,
  dataSize,
  onDataSizeChange,
  onGenerateRandom,
  supportsCustomSize = true,
  variant = "embedded",
}: ControlPanelProps): ReactElement {
  const isEmbedded = variant === "embedded";

  return (
    <div
      className={`flex items-center flex-wrap gap-4 px-4 py-3 w-full box-border bg-[var(--bg-chrome)] ${
        isEmbedded
          ? "border-t border-[var(--border-default)]"
          : "border border-[var(--border-default)] rounded-[var(--radius-md)]"
      }`}
    >
      <ControlPanelPlayback
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onStepBack={onStepBack}
        onStepForward={onStepForward}
        onReset={onReset}
        currentStep={currentStep}
        totalSteps={totalSteps}
      />

      <ControlPanelStepReadout currentStep={currentStep} totalSteps={totalSteps} />

      <div className="flex items-center gap-3 ml-auto">
        <ControlPanelSpeedSlider speed={speed} onSpeedChange={onSpeedChange} />

        {supportsCustomSize && (
          <ControlPanelDataSizeControls
            dataSize={dataSize}
            onDataSizeChange={onDataSizeChange}
            onGenerateRandom={onGenerateRandom}
            isPlaying={isPlaying}
          />
        )}
      </div>
    </div>
  );
}

ControlPanel.Playback = ControlPanelPlayback;
ControlPanel.StepReadout = ControlPanelStepReadout;
ControlPanel.SpeedSlider = ControlPanelSpeedSlider;
ControlPanel.DataSizeControls = ControlPanelDataSizeControls;
