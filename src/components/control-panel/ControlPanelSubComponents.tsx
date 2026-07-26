import type { ReactElement } from "react";
import { SkipBack, SkipForward, RotateCcw, Shuffle } from "lucide-react";
import { Button, ButtonGroup, Chip, IconButton, Kbd, Slider } from "../../ui";

const SLIDER_WIDTH = "120px";

export interface ControlPanelPlaybackProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  currentStep: number;
  totalSteps: number;
}

export function ControlPanelPlayback({
  isPlaying,
  onPlayPause,
  onStepBack,
  onStepForward,
  onReset,
  currentStep,
  totalSteps,
}: ControlPanelPlaybackProps): ReactElement {
  return (
    <ButtonGroup gap="sm">
      <IconButton
        icon={<RotateCcw />}
        aria-label="Reset to first step"
        onClick={onReset}
        disabled={isPlaying}
      />
      <IconButton
        icon={<SkipBack />}
        aria-label="Step backward"
        aria-keyshortcuts="ArrowLeft"
        title="Step backward (Left arrow)"
        onClick={onStepBack}
        disabled={isPlaying || currentStep <= 0}
      >
        <Kbd>←</Kbd>
      </IconButton>
      <Button
        variant="primary"
        onClick={onPlayPause}
        aria-label={isPlaying ? "Pause playback" : "Play all steps"}
        aria-keyshortcuts="Space"
        title={isPlaying ? "Pause playback (Space)" : "Play all steps (Space)"}
      >
        {isPlaying ? "Pause" : "Play"} <Kbd>Space</Kbd>
      </Button>
      <IconButton
        icon={<SkipForward />}
        aria-label="Step forward"
        aria-keyshortcuts="ArrowRight"
        title="Step forward (Right arrow)"
        onClick={onStepForward}
        disabled={isPlaying || currentStep >= totalSteps - 1}
      >
        <Kbd>→</Kbd>
      </IconButton>
    </ButtonGroup>
  );
}

export interface ControlPanelStepReadoutProps {
  currentStep: number;
  totalSteps: number;
}

export function ControlPanelStepReadout({
  currentStep,
  totalSteps,
}: ControlPanelStepReadoutProps): ReactElement {
  const displayStep = totalSteps === 0 ? 0 : currentStep + 1;
  return (
    <Chip
      size="md"
      aria-label={`Step ${displayStep} of ${totalSteps}`}
      label={<span className="text-[var(--text-primary)]">{displayStep}</span>}
      value={<span className="text-[var(--text-secondary)]">{totalSteps}</span>}
    />
  );
}

export interface ControlPanelSpeedSliderProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export function ControlPanelSpeedSlider({
  speed,
  onSpeedChange,
}: ControlPanelSpeedSliderProps): ReactElement {
  return (
    <Slider
      label="Speed"
      min={50}
      max={1000}
      step={50}
      value={1050 - speed}
      onChange={(value: number) => onSpeedChange(1050 - value)}
      formatValue={(value: number) => `${1050 - value} ms`}
      style={{ width: SLIDER_WIDTH }}
    />
  );
}

export interface ControlPanelDataSizeControlsProps {
  dataSize: number;
  onDataSizeChange: (size: number) => void;
  onGenerateRandom: () => void;
  isPlaying: boolean;
}

export function ControlPanelDataSizeControls({
  dataSize,
  onDataSizeChange,
  onGenerateRandom,
  isPlaying,
}: ControlPanelDataSizeControlsProps): ReactElement {
  return (
    <>
      <Slider
        label="Elements"
        min={5}
        max={35}
        value={dataSize}
        onChange={onDataSizeChange}
        disabled={isPlaying}
        style={{ width: SLIDER_WIDTH }}
      />
      <IconButton
        icon={<Shuffle />}
        aria-label="Generate new random input"
        onClick={onGenerateRandom}
        disabled={isPlaying}
      />
    </>
  );
}
