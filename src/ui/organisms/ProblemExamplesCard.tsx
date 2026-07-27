import React from "react";
import { Card, FieldLabel } from "..";
import { cx } from "../cx";
import { ProblemExample } from "../../types/dsa";
import { formatExampleInput, formatExampleOutput } from "./problemExampleUtils";

export interface ProblemExamplesCardProps {
  examples?: ProblemExample[];
  selectedExampleId?: string;
  onSelectExample?: (example: ProblemExample, index: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ProblemExamplesCard: React.FC<ProblemExamplesCardProps> = ({
  examples,
  selectedExampleId,
  onSelectExample,
  className,
  style,
}) => {
  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <Card
      data-testid="problem-examples-card"
      className={cx(
        "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-xl p-4 md:p-5 mt-3",
        className,
      )}
      style={style}
    >
      <Card.Body className="p-0 flex flex-col gap-3">
        <FieldLabel label="Example Scenarios" />
        <div
          data-testid="problem-examples-grid"
          className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-3 items-start"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
          }}
        >
          {examples.map((example, idx) => {
            const exId = example.id ?? `example-${idx}`;
            const isSelected = selectedExampleId === exId || selectedExampleId === String(idx);

            const displayInput = formatExampleInput(example);
            const displayOutput = formatExampleOutput(example);

            return (
              <button
                type="button"
                key={`example-scenario-${idx}`}
                data-testid="problem-example-card"
                data-selected={isSelected ? "true" : "false"}
                onClick={() => onSelectExample?.(example, idx)}
                className={cx(
                  "w-full text-left transition-all cursor-pointer rounded-xl p-4 border font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]",
                  isSelected
                    ? "bg-[var(--bg-surface-hover)] border-[var(--accent)] ring-1 ring-[var(--accent)] shadow-md"
                    : "bg-[var(--bg-inset)] border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-sans">
                    {example.title ?? `Example ${idx + 1}`}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--bg-inset)] font-sans">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Input: </span>
                  <span className="text-[var(--text-primary)]">{displayInput}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Output: </span>
                  <span className="text-[var(--text-primary)]">{displayOutput}</span>
                </div>
                {example.explanation && (
                  <div className="mt-1 font-sans text-xs text-[var(--text-secondary)] line-clamp-2">
                    {example.explanation}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProblemExamplesCard;
