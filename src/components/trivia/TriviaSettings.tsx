import React from 'react';
import { Shuffle } from 'lucide-react';
import type { TriviaConfig, TriviaMode } from '../../types/trivia';
import {
  MAX_BLANKS_CEILING,
  MIN_BLANKS_FLOOR,
  describeMode,
} from '../../trivia/triviaEngine';
import { Button, Segmented, Slider } from '../../ui';

/* Drill settings (DESIGN.md R8.4).

   No Card of its own: this renders as the body of TriviaHeaderCard's single
   merged section (the user asked for the session card and drill settings to
   be united under one section, not stacked as two separate cards), so the
   deck-lines/blanks-count badges that used to live in this component's own
   header now live in TriviaHeaderCard's actions row instead — this file only
   owns the controls themselves.

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
  /**
   * Blankable-line count of every algorithm currently in the deck (one entry per
   * deck member, in no particular order). Drives the short-algorithm warning
   * below the Hardest level slider — purely informational, so an empty deck (no
   * entries) simply shows none.
   */
  deckLineCounts: readonly number[];
}

const MODE_OPTIONS: { value: TriviaMode; label: string }[] = [
  { value: 'choice', label: 'Drag tiles' },
  { value: 'type', label: 'Type from memory' },
];

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

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

/* Same shape as hintStyle, recoloured amber — a non-blocking heads-up, not an
   error: the slider stays fully usable at any level, short algorithms just show
   up fully blank. */
const warningHintStyle: React.CSSProperties = {
  ...hintStyle,
  color: 'var(--warning)',
};

export const TriviaSettings: React.FC<TriviaSettingsProps> = ({
  config,
  onChange,
  deckLineCounts,
}) => {
  const { mode, minBlanks, maxBlanks, includeDistractors } = config;

  // Purely informational: isLevelCovered/remainingAt already treat a short
  // algorithm as satisfied rather than blocking the deck, so this never gates
  // the slider — it only tells the user what "fully blank" means for them.
  // <= on purpose, not <: an algorithm with EXACTLY maxBlanks blankable lines
  // still gets every one of them hidden the moment the drill reaches that
  // level (pickRound has nothing left to leave showing) — that IS the
  // "entire question shown empty" edge case from the user's own example, not
  // just the strictly-shorter case.
  const shortAlgorithmCount = deckLineCounts.filter((count) => count <= maxBlanks).length;

  const handleMode = (value: string) => {
    if (value === 'choice' || value === 'type') onChange({ mode: value });
  };

  /* Bounded by the ceiling's current value, not the engine's outer limit —
     the same way the ceiling below is bounded by the floor. Neither slider
     ever moves the other; each simply cannot be dragged past the other's
     value, so "starting" can never surpass "hardest" in the first place. */
  const handleMin = (value: number) => {
    onChange({ minBlanks: Math.min(Math.max(value, MIN_BLANKS_FLOOR), maxBlanks) });
  };

  const handleMax = (value: number) => {
    onChange({ maxBlanks: Math.min(Math.max(value, minBlanks), MAX_BLANKS_CEILING) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <span style={sectionLabelStyle}>Drill settings</span>

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
          max={maxBlanks}
          onChange={handleMin}
        />
        <span style={hintStyle}>
          How many lines the first level hides at once. It can never exceed the hardest level.
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
        {shortAlgorithmCount > 0 && (
          <span style={warningHintStyle}>
            {`${shortAlgorithmCount} of ${deckLineCounts.length} questions in this deck have ${maxBlanks} line${maxBlanks === 1 ? '' : 's'} or fewer and will be shown fully blank at this level.`}
          </span>
        )}
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
  );
};
