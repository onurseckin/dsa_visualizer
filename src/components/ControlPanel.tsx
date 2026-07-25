import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Shuffle } from 'lucide-react';
import { Button, IconButton, Slider } from '../ui';

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
  variant?: 'standalone' | 'embedded';
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
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
  variant = 'embedded',
}) => {
  const isEmbedded = variant === 'embedded';
  const displayStep = totalSteps === 0 ? 0 : currentStep + 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
        width: '100%',
        boxSizing: 'border-box',
        // Embedded: a toolbar strip attached under the stage, one tier above the
        // card it sits in. Standalone: a bordered panel of its own.
        background: isEmbedded ? 'var(--bg-elevated)' : 'var(--bg-chrome)',
        borderTop: isEmbedded ? '1px solid var(--border-subtle)' : undefined,
        border: isEmbedded ? undefined : '1px solid var(--border-default)',
        borderRadius: isEmbedded ? undefined : 'var(--radius-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <IconButton
          icon={<RotateCcw />}
          aria-label="Reset to first step"
          onClick={onReset}
          disabled={isPlaying}
        />
        <IconButton
          icon={<SkipBack />}
          aria-label="Step backward"
          onClick={onStepBack}
          disabled={isPlaying || currentStep <= 0}
        />
        <Button
          variant="primary"
          icon={isPlaying ? <Pause /> : <Play />}
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause playback' : 'Play all steps'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <IconButton
          icon={<SkipForward />}
          aria-label="Step forward"
          onClick={onStepForward}
          disabled={isPlaying || currentStep >= totalSteps - 1}
        />
      </div>

      {/* Inset well so the readout still reads against the elevated strip it sits on. */}
      <span
        aria-label={`Step ${displayStep} of ${totalSteps}`}
        className="ui-chip"
        style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-default)' }}
      >
        <span style={{ color: 'var(--text-primary)' }}>{displayStep}</span>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{totalSteps}</span>
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginLeft: 'auto',
        }}
      >
        <Slider
          label="Speed"
          min={50}
          max={1000}
          step={50}
          // The stored value is delay-per-step (ms); the track is inverted so
          // dragging right reads as "faster".
          value={1050 - speed}
          onChange={(value) => onSpeedChange(1050 - value)}
          formatValue={(value) => `${1050 - value} ms`}
          style={{ width: '120px' }}
        />

        {supportsCustomSize && (
          <>
            <Slider
              label="Elements"
              min={5}
              max={35}
              value={dataSize}
              onChange={onDataSizeChange}
              disabled={isPlaying}
              style={{ width: '104px' }}
            />
            <IconButton
              icon={<Shuffle />}
              aria-label="Generate new random input"
              onClick={onGenerateRandom}
              disabled={isPlaying}
            />
          </>
        )}
      </div>
    </div>
  );
};
