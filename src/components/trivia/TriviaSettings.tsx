import React from 'react';
import { Shuffle, SlidersHorizontal } from 'lucide-react';
import type { TriviaConfig, TriviaMode } from '../../types/trivia';
import {
  MAX_BLANKS_CEILING,
  MIN_BLANKS_FLOOR,
  describeMode,
} from '../../trivia/triviaEngine';
import { Badge, Button, Card, Segmented, Slider } from '../../ui';

/* Drill settings (DESIGN.md R8.4).

   Every control carries a one-line explanation because none of these settings is
   self-evident: "3 blanks" means nothing until you know the level only advances
   once every line has been met at the current one.

   min <= max is enforced here as well as in the engine. The engine clamp is the
   safety net for stored or programmatic values; a slider that visibly refuses to
   cross its partner is what stops the user from producing the invalid state in
   the first place. */

export interface TriviaSettingsProps {
  config: TriviaConfig;
  onChange: (patch: Partial<TriviaConfig>) => void;
}

const MODE_OPTIONS: { value: TriviaMode; label: string }[] = [
  { value: 'choice', label: 'Drag tiles' },
  { value: 'type', label: 'Type from memory' },
];

const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  lineHeight: 1.5,
};

export const TriviaSettings: React.FC<TriviaSettingsProps> = ({ config, onChange }) => {
  const { mode, minBlanks, maxBlanks, includeDistractors } = config;

  const handleMode = (value: string) => {
    if (value === 'choice' || value === 'type') onChange({ mode: value });
  };

  /* Raising the floor above the ceiling pushes the ceiling up with it, rather
     than rejecting the drag — the user's intent is "start harder". */
  const handleMin = (value: number) => {
    const next = Math.min(Math.max(value, MIN_BLANKS_FLOOR), MAX_BLANKS_CEILING);
    onChange(next > maxBlanks ? { minBlanks: next, maxBlanks: next } : { minBlanks: next });
  };

  const handleMax = (value: number) => {
    onChange({ maxBlanks: Math.min(Math.max(value, minBlanks), MAX_BLANKS_CEILING) });
  };

  return (
    <Card
      title="Drill settings"
      icon={<SlidersHorizontal aria-hidden="true" />}
      style={PANEL_BORDER}
      actions={
        <Badge variant="neutral" style={PANEL_BORDER}>
          {minBlanks === maxBlanks
            ? `${minBlanks} blank${minBlanks === 1 ? '' : 's'}`
            : `${minBlanks}–${maxBlanks} blanks`}
        </Badge>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={fieldStyle}>
          <span style={labelStyle} id="trivia-mode-label">
            Answer mode
          </span>
          <Segmented
            options={MODE_OPTIONS}
            value={mode}
            onChange={handleMode}
            aria-labelledby="trivia-mode-label"
          />
          <span style={hintStyle}>{describeMode(mode)}.</span>
        </div>

        <div style={fieldStyle}>
          <Slider
            label="Starting blanks"
            value={minBlanks}
            min={MIN_BLANKS_FLOOR}
            max={MAX_BLANKS_CEILING}
            onChange={handleMin}
          />
          <span style={hintStyle}>
            How many lines the first level hides at once. Raising it past the ceiling raises the
            ceiling too.
          </span>
        </div>

        <div style={fieldStyle}>
          <Slider
            label="Hardest level"
            value={maxBlanks}
            min={minBlanks}
            max={MAX_BLANKS_CEILING}
            onChange={handleMax}
          />
          <span style={hintStyle}>
            The drill finishes once every line has been drilled at this many blanks. It can never
            drop below the starting blanks.
          </span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Distractor tiles</span>
          <Button
            icon={<Shuffle aria-hidden="true" />}
            selected={includeDistractors}
            onClick={() => onChange({ includeDistractors: !includeDistractors })}
          >
            {includeDistractors ? 'Distractors on' : 'Distractors off'}
          </Button>
          <span style={hintStyle}>
            Adds plausible wrong lines to the tray, so the answer has to be recognised instead of
            being the only tile left. Drag-tile mode only.
          </span>
        </div>
      </div>
    </Card>
  );
};
