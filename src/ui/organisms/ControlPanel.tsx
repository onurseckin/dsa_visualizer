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
      className={`bg-[var(--bg-surface)] border border-[var(--border-default)] flex flex-wrap items-center justify-between gap-2 md:gap-3 w-full box-border py-1 px-3 ${
        isEmbedded ? "border-t border-x-0 border-b-0 rounded-none shadow-none" : "rounded-2xl shadow-xl relative top-2 z-10"
      }`}
    >
      <div className="flex items-center gap-1.5 md:gap-2">
        <IconButton
          size="sm"
          className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] p-1.5 rounded-lg !min-h-[36px] !min-w-[36px]"
          icon={<RotateCcw size={18} strokeWidth={2.5} />}
          aria-label="Reset visualization to step 0"
          aria-keyshortcuts="KeyR"
          title="Reset (R)"
          onClick={onReset}
          disabled={isPlaying}
        />
        <IconButton
          size="sm"
          className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] p-1.5 rounded-lg !min-h-[36px] !min-w-[36px]"
          icon={<SkipBack size={18} strokeWidth={2.5} />}
          aria-label="Step backward"
          aria-keyshortcuts="ArrowLeft"
          title="Step backward (arrow left)"
          onClick={onStepBack}
          disabled={isPlaying || currentStep <= 0}
        />
        <Button
          size="sm"
          variant={isPlaying ? "secondary" : "primary"}
          className="bg-[var(--bg-inset)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-strong)] px-3.5 py-1.5 rounded-lg font-semibold text-xs !min-h-[36px] shadow-sm flex items-center gap-1.5 transition-all"
          aria-label={isPlaying ? "Pause playback" : "Play all steps"}
          aria-keyshortcuts="Space"
          title={`${isPlaying ? "Pause" : "Play"} (Space)`}
          onClick={onPlayPause}
          icon={
            isPlaying ? (
              <Pause size={18} strokeWidth={2.5} fill="currentColor" />
            ) : (
              <Play size={18} strokeWidth={2.5} fill="currentColor" />
            )
          }
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <IconButton
          size="sm"
          className="bg-[#1e1e28] hover:bg-[#282834] text-white border border-white/10 p-1.5 rounded-lg !min-h-[36px] !min-w-[36px]"
          icon={<SkipForward size={18} strokeWidth={2.5} />}
          aria-label="Step forward"
          aria-keyshortcuts="ArrowRight"
          title="Step forward (arrow right)"
          onClick={onStepForward}
          disabled={isPlaying || currentStep >= totalSteps - 1}
        />
      </div>

      <Chip
        variant="subtle"
        size="sm"
        aria-label={`Step ${displayStep} of ${totalSteps}`}
        label="Step"
        value={`${currentStep} / ${totalSteps}`}
      />

      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        <div className="w-[110px] md:w-[130px]" data-testid="cp-speed">
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
            <div className="w-[110px] md:w-[130px]" data-testid="cp-datasize">
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
              size="sm"
              data-testid="cp-random"
              className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] p-1.5 rounded-lg !min-h-[36px] !min-w-[36px]"
              icon={<Shuffle size={18} strokeWidth={2.5} />}
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
