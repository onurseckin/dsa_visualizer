import React from "react";
import { Shuffle } from "lucide-react";
import type { TriviaConfig, TriviaMode } from "../../types/trivia";
import { MAX_BLANKS_CEILING, MIN_BLANKS_FLOOR, describeMode } from "../../trivia/triviaEngine";
import { Button, FieldLabel, Segmented, Slider } from "../../ui";

export interface TriviaSettingsProps {
  config: TriviaConfig;
  onChange: (patch: Partial<TriviaConfig>) => void;
  deckLineCounts: readonly number[];
}

const MODE_OPTIONS: { value: TriviaMode; label: string }[] = [
  { value: "choice", label: "Drag tiles" },
  { value: "type", label: "Type from memory" },
];

export const TriviaSettings: React.FC<TriviaSettingsProps> = ({
  config,
  onChange,
  deckLineCounts,
}) => {
  const { mode, minBlanks, maxBlanks, includeDistractors } = config;

  const shortAlgorithmCount = deckLineCounts.filter((count) => count <= maxBlanks).length;

  const handleMode = (value: string) => {
    if (value === "choice" || value === "type") onChange({ mode: value });
  };

  const handleMin = (value: number) => {
    onChange({ minBlanks: Math.min(Math.max(value, MIN_BLANKS_FLOOR), maxBlanks) });
  };

  const handleMax = (value: number) => {
    onChange({ maxBlanks: Math.min(Math.max(value, minBlanks), MAX_BLANKS_CEILING) });
  };

  return (
    <div className="flex flex-col gap-6 pt-4 border-t border-[var(--border-subtle)]">
      <span className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)]">
        Drill settings
      </span>

      <div className="flex flex-col gap-4 p-5 md:p-6 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-sm">
        <FieldLabel label="Answer mode" id="trivia-mode-label" />
        <Segmented
          options={MODE_OPTIONS}
          value={mode}
          onChange={handleMode}
          aria-labelledby="trivia-mode-label"
        />
        <span className="text-xs text-[var(--text-muted)] leading-normal">
          {describeMode(mode)}.
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5 md:p-6 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-sm">
        <Slider
          label="Starting blanks"
          value={minBlanks}
          min={MIN_BLANKS_FLOOR}
          max={maxBlanks}
          onChange={handleMin}
        />
        <span className="text-xs text-[var(--text-muted)] leading-normal">
          How many lines the first level hides at once. It can never exceed the hardest level.
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5 md:p-6 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-sm">
        <Slider
          label="Hardest level"
          value={maxBlanks}
          min={minBlanks}
          max={MAX_BLANKS_CEILING}
          onChange={handleMax}
        />
        <span className="text-xs text-[var(--text-muted)] leading-normal">
          The drill finishes once every line has been drilled at this many blanks. It can never drop
          below the starting blanks.
        </span>
        {shortAlgorithmCount > 0 && (
          <span className="text-xs text-[var(--warning)] leading-normal">
            {`${shortAlgorithmCount} of ${deckLineCounts.length} questions in this deck have ${maxBlanks} line${maxBlanks === 1 ? "" : "s"} or fewer and will be shown fully blank at this level.`}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-5 md:p-6 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-sm">
        <FieldLabel label="Distractor tiles" />
        <Button
          icon={<Shuffle aria-hidden="true" />}
          selected={includeDistractors}
          onClick={() => onChange({ includeDistractors: !includeDistractors })}
        >
          {includeDistractors ? "Distractors on" : "Distractors off"}
        </Button>
        <span className="text-xs text-[var(--text-muted)] leading-normal">
          Adds plausible wrong lines to the tray, so the answer has to be recognised instead of
          being the only tile left. Drag-tile mode only.
        </span>
      </div>
    </div>
  );
};
