import React from "react";
import { Button, Card, FieldLabel } from "../../ui";
import { TopicGuide } from "../../types/dsa";

export interface SolutionApproachCardProps {
  topicGuide: TopicGuide;
  expanded: boolean;
  onToggleExpanded: () => void;
}

const COLUMN_FLOOR = "minmax(min(100%, 22rem), 1fr)";

export const SolutionApproachCard: React.FC<SolutionApproachCardProps> = ({
  topicGuide,
  expanded,
  onToggleExpanded,
}) => {
  const keyTerms = topicGuide.keyTerms ?? [];

  return (
    <Card padding="md" className="p-6 md:p-8 border-[var(--border-default)]">
      <div className="flex items-center flex-wrap gap-4 py-4 px-6 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
        <h2 className="m-0 text-xl font-bold text-[var(--text-primary)]">Solution approach</h2>

        <div className="flex-1" />

        <Button
          size="sm"
          selected={expanded}
          aria-expanded={expanded}
          aria-controls="solution-approach-details"
          onClick={onToggleExpanded}
        >
          Details
        </Button>
      </div>

      {expanded && (
        <div
          id="solution-approach-details"
          data-testid="solution-approach-details"
          className="mt-6 pt-6 border-t border-[var(--border-default)] px-2 flex flex-col gap-6 pb-6 border-b"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <p
            data-testid="details-overview"
            className="m-0 text-base leading-relaxed text-[var(--text-secondary)] pb-6 border-b border-[var(--border-default)]"
          >
            {topicGuide.overview}
          </p>

          <div className="flex flex-col gap-5">
            {topicGuide.sections.map((section, idx) => (
              <section key={`guide-section-${idx}`}>
                <h3 className="m-0 mb-2 text-sm font-semibold text-[var(--text-primary)]">
                  {section.heading}
                </h3>
                <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {section.body}
                </p>
              </section>
            ))}

            {keyTerms.length > 0 && (
              <section>
                <FieldLabel label="Key terms" />
                <dl
                  data-testid="details-key-terms"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fit, ${COLUMN_FLOOR})`,
                    gap: "var(--space-3) var(--space-5)",
                    alignItems: "start",
                  }}
                >
                  {keyTerms.map((entry, idx) => (
                    <div key={`key-term-${idx}`}>
                      <dt
                        className="font-mono text-xs font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {entry.term}
                      </dt>
                      <dd className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {entry.definition}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SolutionApproachCard;
