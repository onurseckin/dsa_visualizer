import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  Sliders,
} from 'lucide-react';

interface ControlPanelProps {
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
}) => {
  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 1.25rem',
        margin: '0.75rem 1.25rem 0 1.25rem',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Playback Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          className="btn"
          onClick={onReset}
          title="Reset to Step 0"
          disabled={isPlaying}
        >
          <RotateCcw style={{ width: '16px', height: '16px' }} />
        </button>

        <button
          className="btn"
          onClick={onStepBack}
          disabled={isPlaying || currentStep <= 0}
          title="Step Backward"
        >
          <SkipBack style={{ width: '16px', height: '16px' }} />
        </button>

        <button
          className="btn btn-primary"
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
          style={{ padding: '0.5rem 1.25rem' }}
        >
          {isPlaying ? (
            <>
              <Pause style={{ width: '16px', height: '16px' }} />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play style={{ width: '16px', height: '16px' }} />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          className="btn"
          onClick={onStepForward}
          disabled={isPlaying || currentStep >= totalSteps - 1}
          title="Step Forward"
        >
          <SkipForward style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Step Counter Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: 'var(--font-code)',
          fontSize: '0.85rem',
          color: 'var(--text-main)',
        }}
      >
        <span style={{ color: 'var(--text-dim)' }}>Step:</span>
        <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
          {totalSteps === 0 ? 0 : currentStep + 1}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span>{totalSteps}</span>
      </div>

      {/* Speed & Data Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Speed Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gauge style={{ width: '15px', height: '15px', color: 'var(--accent-mint)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Speed:</span>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={1050 - speed} // Inverse so slider right means faster
            onChange={(e) => onSpeedChange(1050 - Number(e.target.value))}
            style={{ width: '90px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
          />
        </div>

        {/* Data Size Slider */}
        {supportsCustomSize && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders style={{ width: '15px', height: '15px', color: 'var(--accent-mint)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Elements:</span>
            <input
              type="range"
              min="5"
              max="35"
              value={dataSize}
              onChange={(e) => onDataSizeChange(Number(e.target.value))}
              disabled={isPlaying}
              style={{ width: '80px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.8rem', minWidth: '20px' }}>
              {dataSize}
            </span>
          </div>
        )}

        <button
          className="btn"
          onClick={onGenerateRandom}
          disabled={isPlaying}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
        >
          New Random Input
        </button>
      </div>
    </div>
  );
};
