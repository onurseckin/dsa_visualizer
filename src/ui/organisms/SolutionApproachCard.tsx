import React from "react";
import { Card, FieldLabel, MarkdownRenderer } from "..";
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
      className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-2xl shadow-xl w-full max-w-none"
    >
      <Card.Body
        className="flex flex-col gap-6 p-4 md:p-5 bg-[var(--bg-inset)] w-full max-w-none"
        style={{ background: "var(--bg-inset)" }}
      >
        <div
          id="solution-approach-details"
          data-testid="solution-approach-details"
          className="flex flex-col gap-6 w-full max-w-none"
        >
          <div className="m-0 text-sm leading-relaxed text-[var(--text-secondary)] w-full max-w-none">
            <MarkdownRenderer content={topicGuide.overview} className="text-sm w-full max-w-none" />
          </div>

          <div className="flex flex-col gap-5 w-full max-w-none">
            {topicGuide.sections.map((section, idx) => (
              <section key={`guide-section-${idx}`} className="w-full max-w-none">
                <h3 className="m-0 mb-2 text-sm font-semibold text-[var(--text-primary)]">
                  {section.heading}
                </h3>
                <MarkdownRenderer content={section.body} className="text-sm w-full max-w-none" />
              </section>
            ))}

            {keyTerms.length > 0 && (
              <section className="w-full max-w-none">
                <FieldLabel label="Key terms" />
                <dl
                  data-testid="details-key-terms"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fit, ${COLUMN_FLOOR})`,
                    gap: "var(--space-3) var(--space-5)",
                    alignItems: "start",
                  }}
                  className="w-full max-w-none"
                >
                  {keyTerms.map((entry, idx) => (
                    <div key={`key-term-${idx}`} className="w-full">
                      <dt
                        className="font-mono text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {entry.term}
                      </dt>
                      <dd className="m-0 text-sm leading-relaxed text-[var(--text-secondary)] mt-1 w-full">
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
