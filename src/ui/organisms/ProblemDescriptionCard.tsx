import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, FieldLabel, Well } from "..";
import { cx } from "../cx";
import {
  CategoryType,
  DifficultyLevel,
  LeetCodeMeta,
  ProblemExample,
  ProblemSource,
} from "../../types/dsa";
import { ProblemHeader } from "../../components/primitives/ProblemHeader";

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
  showHeader?: boolean;
  selectedExampleId?: string;
  selectedExampleIndex?: number;
  onSelectExample?: (example: ProblemExample, index: number) => void;
  leetcode?: LeetCodeMeta | { id: number; url: string };
  sources?: ProblemSource[];
}

export const ProblemDescriptionCard: React.FC<ProblemDescriptionCardProps> = ({
  title,
  category,
  difficulty = "Easy",
  description,
  constraints,
  expanded = true,
  onToggleExpanded,
  className,
  style,
  showHeader = true,
  leetcode,
  sources,
}) => {
  if (!showHeader && !expanded) {
    return null;
  }

  return (
    <Card
      data-testid="problem-description-card"
      className={cx(
        "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-xl",
        className,
      )}
      style={style}
    >
      <Card.Body className="p-4 md:p-5 flex flex-col gap-4">
        {showHeader && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <ProblemHeader
              title={title}
              category={category}
              difficulty={difficulty}
              leetcode={leetcode}
              sources={sources}
            />
            {onToggleExpanded && (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls="problem-description-details"
                onClick={onToggleExpanded}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-[var(--text-secondary)] bg-[var(--bg-inset)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer"
              >
                <span>{expanded ? "Hide Details" : "Show Details"}</span>
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        )}

        {expanded && (
          <div
            id="problem-description-details"
            data-testid="problem-description-details"
            className={cx(
              "flex flex-col gap-6",
              showHeader && "pt-2 border-t border-[var(--border-default)]",
            )}
          >
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
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProblemDescriptionCard;
