import React from "react";
import { Button, Card, FieldLabel } from "..";
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
    <Card data-testid="solution-approach-card" data-topic-sections="2">
      <div className="flex items-center flex-wrap gap-4 px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border-default)]">
        <h2 className="m-0 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Solution approach
        </h2>

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
        <Card.Body className="flex flex-col gap-8 p-6 md:p-8">
          <div
            id="solution-approach-details"
            data-testid="solution-approach-details"
            style={{ borderTop: "1px solid var(--border-default)" }}
            className="flex flex-col gap-8"
          >
            <p
              data-testid="details-overview"
              className="m-0 text-lg leading-relaxed text-[var(--text-secondary)] pb-8 border-b border-[#1e1e24]"
            >
              {topicGuide.overview}
            </p>

            <div className="flex flex-col gap-5">
              {topicGuide.sections.map((section, idx) => (
                <section key={`guide-section-${idx}`}>
                  <h3 className="m-0 mb-3 text-base font-semibold text-[var(--text-primary)]">
                    {section.heading}
                  </h3>
                  <p className="m-0 text-base leading-relaxed text-[var(--text-secondary)]">
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
                          className="font-mono text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {entry.term}
                        </dt>
                        <dd className="m-0 text-base leading-relaxed text-[var(--text-secondary)] mt-1">
                          {entry.definition}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>
          </div>
        </Card.Body>
      )}
    </Card>
  );
};

export default SolutionApproachCard;
