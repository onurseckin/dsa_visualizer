import React from "react";
import { Shuffle } from "lucide-react";
import type { TriviaConfig, TriviaMode } from "../../types/trivia";
import { MAX_BLANKS_CEILING, MIN_BLANKS_FLOOR, describeMode } from "../../trivia/triviaEngine";
import { Button, FieldLabel, Segmented, Slider } from "..";

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

  return (
    <div className="border border-[var(--border-default)] rounded-2xl p-8 flex flex-col gap-6 bg-[var(--bg-surface)] shadow-lg hover:border-[var(--accent)] transition-all">
      <span className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">
        Drill settings
      </span>

      <div className="flex flex-col gap-4 p-6 md:p-8 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-sm">
        <FieldLabel label="Answer mode" id="trivia-mode-label" />
        <Segmented
          className="mb-4"
          options={MODE_OPTIONS}
          value={mode}
          onChange={handleMode}
          aria-labelledby="trivia-mode-label"
        />
        <span className="text-xs text-[var(--text-muted)] leading-normal">
          {describeMode(mode)}.
        </span>
      </div>

      <div className="flex flex-col gap-5 p-6 md:p-8 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-sm">
        <Slider
          label="Starting blanks"
          value={minBlanks}
          min={MIN_BLANKS_FLOOR}
          max={maxBlanks}
          onChange={(val) => onChange({ minBlanks: val })}
        />
        <span className="text-xs text-[var(--text-muted)] leading-normal">
          How many lines the first level hides at once. It can never exceed the hardest level.
        </span>
      </div>

      <div className="flex flex-col gap-5 p-6 md:p-8 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-sm">
        <Slider
          label="Hardest level"
          value={maxBlanks}
          min={minBlanks}
          max={MAX_BLANKS_CEILING}
          onChange={(val) => onChange({ maxBlanks: val })}
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

      <div className="flex flex-col gap-4 p-6 md:p-8 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-sm">
        <FieldLabel label="Distractor tiles" />
        <Button
          variant="secondary"
          selected={includeDistractors}
          onClick={() => onChange({ includeDistractors: !includeDistractors })}
          icon={<Shuffle />}
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
