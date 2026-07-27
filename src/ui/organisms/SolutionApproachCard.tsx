import React from "react";
import { Card, FieldLabel } from "..";
import { TopicGuide } from "../../types/dsa";

export interface SolutionApproachCardProps {
  topicGuide: TopicGuide;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const COLUMN_FLOOR = "minmax(min(100%, 22rem), 1fr)";

export const SolutionApproachCard: React.FC<SolutionApproachCardProps> = ({ topicGuide }) => {
  const keyTerms = topicGuide.keyTerms ?? [];

  return (
    <Card
      data-testid="solution-approach-card"
      data-topic-sections="2"
      variant="inset"
      style={{ background: "var(--bg-inset)" }}
      className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-2xl shadow-xl"
    >
      <Card.Body
        className="flex flex-col gap-6 p-4 md:p-5 bg-[var(--bg-inset)]"
        style={{ background: "var(--bg-inset)" }}
      >
        <div
          id="solution-approach-details"
          data-testid="solution-approach-details"
          className="flex flex-col gap-6"
        >
          <p
            data-testid="details-overview"
            className="m-0 text-lg leading-relaxed text-[var(--text-secondary)] pb-6 border-b border-[var(--border-default)]"
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
    </Card>
  );
};

export default SolutionApproachCard;
