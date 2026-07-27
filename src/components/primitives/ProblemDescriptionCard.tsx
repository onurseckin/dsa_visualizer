import React from "react";
import { Badge, Button, Card, FieldLabel, Well, difficultyBadgeVariant } from "../../ui";
import { CategoryType, DifficultyLevel, ProblemExample } from "../../types/dsa";

export interface ProblemDescriptionCardProps {
  title: string;
  category: CategoryType;
  difficulty?: DifficultyLevel;
  description: string;
  constraints?: string[];
  examples?: ProblemExample[];
  expanded: boolean;
  onToggleExpanded: () => void;
}

const humanizeCategory = (category: string): string => {
  const spaced = category.replace(/[-_]/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const ProblemDescriptionCard: React.FC<ProblemDescriptionCardProps> = ({
  title,
  category,
  difficulty = "Easy",
  description,
  constraints,
  examples,
  expanded,
  onToggleExpanded,
}) => {
  return (
    <Card padding="md" className="p-6 md:p-8 border-[var(--border-default)]">
      <div className="flex items-center flex-wrap gap-3 py-4 px-6 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
        <h1 className="m-0 text-xl font-bold text-[var(--text-primary)] nowrap overflow-hidden text-ellipsis">
          {title}
        </h1>

        <Badge variant={difficultyBadgeVariant(difficulty)}>{difficulty}</Badge>
        <Badge variant="neutral">{humanizeCategory(category)}</Badge>

        <div className="flex-1" />

        <Button
          size="sm"
          selected={expanded}
          aria-expanded={expanded}
          aria-controls="problem-description-details"
          onClick={onToggleExpanded}
        >
          Details
        </Button>
      </div>

      {expanded && (
        <div
          id="problem-description-details"
          data-testid="problem-description-details"
          className="mt-6 pt-6 border-t border-[var(--border-default)] px-2 flex flex-col gap-6"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <section>
            <FieldLabel label="Problem" />
            <Well padding="md" className="mt-2">
              <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">
                {description}
              </p>
            </Well>
          </section>

          {constraints && constraints.length > 0 && (
            <section>
              <FieldLabel label="Constraints" />
              <Well padding="md" className="mt-2">
                <ul className="m-0 pl-4 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
                  {constraints.map((constraint, idx) => (
                    <li key={`constraint-${idx}`}>{constraint}</li>
                  ))}
                </ul>
              </Well>
            </section>
          )}

          {examples && examples.length > 0 && (
            <section>
              <FieldLabel label="Examples" />
              <div
                data-testid="problem-description-examples"
                className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-x-5 gap-y-3 items-start"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
                }}
              >
                {examples.map((example, idx) => (
                  <Well
                    key={`example-${idx}`}
                    padding="sm"
                    className="font-mono text-xs leading-relaxed"
                  >
                    <div>
                      <span className="text-[var(--text-muted)]">Input: </span>
                      <span className="text-[var(--text-primary)]">{example.input}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Output: </span>
                      <span className="text-[var(--text-primary)]">{example.output}</span>
                    </div>
                    {example.explanation && (
                      <div className="mt-1 font-sans text-[var(--text-secondary)]">
                        {example.explanation}
                      </div>
                    )}
                  </Well>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Card>
  );
};

export default ProblemDescriptionCard;
