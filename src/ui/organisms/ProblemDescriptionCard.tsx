import React from "react";
import { Badge, Card, FieldLabel, Well, difficultyBadgeVariant } from "..";
import { cx } from "../cx";
import { CategoryType, DifficultyLevel, ProblemExample } from "../../types/dsa";

export interface ProblemDescriptionCardProps {
  title: string;
  category: CategoryType;
  difficulty?: DifficultyLevel;
  description: string;
  constraints?: string[];
  examples?: ProblemExample[];
  expanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
  style?: React.CSSProperties;
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
  className,
  style,
}) => {
  return (
    <Card
      data-testid="problem-description-card"
      className={cx(
        "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-xl",
        className,
      )}
      style={style}
    >
      <Card.Body className="p-4 md:p-5">
        <div
          id="problem-description-details"
          data-testid="problem-description-details"
          className="flex flex-col gap-6"
        >
          <div className="flex items-center flex-wrap gap-3">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--text-primary)] m-0">
              {title}
            </h1>
            <Badge variant={difficultyBadgeVariant(difficulty)}>{difficulty}</Badge>
            <Badge variant="neutral">{humanizeCategory(category)}</Badge>
          </div>

          <section>
            <FieldLabel label="Problem" />
            <Well className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-xl p-5 shadow-inner text-[var(--text-secondary)]">
              <p className="m-0 text-base leading-relaxed text-[var(--text-secondary)]">
                {description}
              </p>
            </Well>
          </section>

          {constraints && constraints.length > 0 && (
            <section>
              <FieldLabel label="Constraints" />
              <Well className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-xl p-5 shadow-inner text-[var(--text-secondary)]">
                <ul className="m-0 pl-4 font-mono text-sm leading-relaxed text-[var(--text-secondary)]">
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
                    className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-xl p-5 shadow-inner text-[var(--text-secondary)] font-mono text-sm leading-relaxed"
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
      </Card.Body>
    </Card>
  );
};

export default ProblemDescriptionCard;
