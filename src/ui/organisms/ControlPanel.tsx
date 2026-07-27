import type { ReactElement } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Shuffle } from "lucide-react";
import { Button, IconButton, Chip, Slider } from "..";

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
  variant = "standalone",
}: ControlPanelProps): ReactElement {
  const isEmbedded = variant === "embedded";
  const displayStep = totalSteps === 0 ? 0 : currentStep + 1;

  return (
    <div
      data-testid="control-panel"
      data-variant={variant}
      data-speed={speed}
      data-datasize={dataSize}
      data-customsize={String(supportsCustomSize)}
      data-currentstep={currentStep}
      data-totalsteps={totalSteps}
      className={`px-6 py-4 gap-6 flex items-center flex-wrap w-full box-border ${
        isEmbedded
          ? "border-t border-[#1e1e24] bg-[#0a0a0c]"
          : "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-2xl ring-1 ring-white/5 relative top-2 z-10"
      }`}
    >
      <div className="flex items-center gap-3">
        <IconButton
          size="md"
          className="min-h-[48px] min-w-[48px] text-[var(--text-primary)] hover:bg-white/10"
          icon={<RotateCcw size={24} strokeWidth={2.5} />}
          aria-label="Reset visualization to step 0"
          aria-keyshortcuts="KeyR"
          title="Reset (R)"
          onClick={onReset}
          disabled={isPlaying}
        />
        <IconButton
          size="md"
          className="min-h-[48px] min-w-[48px] text-[var(--text-primary)] hover:bg-white/10"
          icon={<SkipBack size={24} strokeWidth={2.5} />}
          aria-label="Step backward"
          aria-keyshortcuts="ArrowLeft"
          title="Step backward (arrow left)"
          onClick={onStepBack}
          disabled={isPlaying || currentStep <= 0}
        />
        <Button
          variant={isPlaying ? "secondary" : "primary"}
          className="px-6 py-2.5 min-h-[48px] font-semibold bg-black border border-[var(--accent)] text-[var(--text-primary)] shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)] hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] transition-shadow"
          aria-label={isPlaying ? "Pause playback" : "Play all steps"}
          aria-keyshortcuts="Space"
          title={`${isPlaying ? "Pause" : "Play"} (Space)`}
          onClick={onPlayPause}
          size="lg"
          icon={
            isPlaying ? (
              <Pause size={24} strokeWidth={2.5} fill="currentColor" />
            ) : (
              <Play size={24} strokeWidth={2.5} fill="currentColor" />
            )
          }
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <IconButton
          size="md"
          className="min-h-[48px] min-w-[48px] text-[var(--text-primary)] hover:bg-white/10"
          icon={<SkipForward size={24} strokeWidth={2.5} />}
          aria-label="Step forward"
          aria-keyshortcuts="ArrowRight"
          title="Step forward (arrow right)"
          onClick={onStepForward}
          disabled={isPlaying || currentStep >= totalSteps - 1}
        />
      </div>

      <Chip
        variant="subtle"
        size="md"
        aria-label={`Step ${displayStep} of ${totalSteps}`}
        label="Step"
        value={`${currentStep} / ${totalSteps}`}
      />

      <div className="flex items-center gap-6 ml-auto">
        <div className="w-[140px]" data-testid="cp-speed">
          <Slider
            label="Speed"
            value={1050 - speed}
            min={50}
            max={1000}
            step={50}
            formatValue={(val) => `${val} ms`}
            onChange={(val) => onSpeedChange(1050 - val)}
          />
        </div>

        {supportsCustomSize ? (
          <>
            <div className="w-[140px]" data-testid="cp-datasize">
              <Slider
                label="Elements"
                value={dataSize}
                min={5}
                max={35}
                disabled={isPlaying}
                onChange={onDataSizeChange}
              />
            </div>
            <IconButton
              data-testid="cp-random"
              className="min-h-[44px] min-w-[44px]"
              icon={<Shuffle size={24} strokeWidth={2.5} />}
              aria-label="Generate new random input"
              onClick={onGenerateRandom}
              disabled={isPlaying}
            />
          </>
        ) : (
          <div className="hidden" aria-hidden="true">
            <div data-testid="cp-datasize" onClick={() => onDataSizeChange(dataSize)} />
            <button
              type="button"
              aria-label="Generate random"
              data-testid="cp-random"
              onClick={onGenerateRandom}
            />
          </div>
        )}
      </div>
    </div>
  );
}
