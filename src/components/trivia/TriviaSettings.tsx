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
  /**
   * Blankable-line count of every algorithm currently in the deck (one entry per
   * deck member, in no particular order). Drives the "Deck lines" range badge and
   * the short-algorithm warning below the Hardest level slider — both purely
   * informational, so an empty deck (no entries) simply shows neither.
   */
  deckLineCounts: readonly number[];
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

  const hasDeckLines = deckLineCounts.length > 0;
  const deckLinesLabel = hasDeckLines
    ? `Deck lines: ${Math.min(...deckLineCounts)}–${Math.max(...deckLineCounts)}`
    : 'Deck lines: —';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Badge variant="neutral" style={PANEL_BORDER}>
            {deckLinesLabel}
          </Badge>
          <Badge variant="neutral" style={PANEL_BORDER}>
            {minBlanks === maxBlanks
              ? `${minBlanks} blank${minBlanks === 1 ? '' : 's'}`
              : `${minBlanks}–${maxBlanks} blanks`}
          </Badge>
        </div>
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
    </Card>
  );
};
