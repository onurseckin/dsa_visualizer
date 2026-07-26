import React from 'react';
import { Button, Card } from '../../ui';
import { TopicGuide } from '../../types/dsa';

/* Split off ProblemHeader.tsx (DESIGN.md R6.5, TASKS.md 9.6): the deep,
   step-by-step teaching content — topic overview, the linear walkthrough
   sections and key terms — is its own panel, separate from the short problem
   statement in ProblemDescriptionCard. It sits at the very bottom of the
   workspace page, below every other section, and is never shown in trivia
   (9.7) — trivia only ever surfaces the problem statement above the puzzle. */
export interface SolutionApproachCardProps {
  topicGuide: TopicGuide;
  /* Expansion is controlled by the parent so it can persist the choice
     independently of ProblemDescriptionCard's own expansion (DESIGN.md R6.5). */
  expanded: boolean;
  onToggleExpanded: () => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 'var(--space-1)',
};

/* Full container width per R4.3 — no readable-measure cap. Long lines stay legible
   through the generous line-height instead. */
const bodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-sm)',
  lineHeight: 1.6,
  color: 'var(--text-secondary)',
};

/* ui.css defaults the card and its wells to --border-subtle, which dissolves into
   the near-black surfaces; every edge in this strip is promoted one step so the
   panel actually reads as a container (DESIGN.md R5.1). */
const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

/* Grid track floor for the key-terms block. The token scale covers spacing and
   control heights, not column measures, so this lives here. `min(100%, …)` keeps
   a single column from overflowing a container narrower than the floor. */
const COLUMN_FLOOR = 'minmax(min(100%, 22rem), 1fr)';

const responsiveGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, ${COLUMN_FLOOR})`,
  gap: 'var(--space-3) var(--space-5)',
  alignItems: 'start',
};

export const SolutionApproachCard: React.FC<SolutionApproachCardProps> = ({
  topicGuide,
  expanded,
  onToggleExpanded,
}) => {
  const keyTerms = topicGuide.keyTerms ?? [];

  return (
    <Card padding="sm" style={PANEL_BORDER}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Solution approach
        </h2>

        <div style={{ flex: 1 }} />

        <Button
          size="sm"
          selected={expanded}
          aria-expanded={expanded}
          onClick={onToggleExpanded}
        >
          Details
        </Button>
      </div>

      {expanded && (
        <div
          data-testid="solution-approach-details"
          style={{
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          <p
            data-testid="details-overview"
            style={{
              margin: 0,
              fontSize: 'var(--text-md)',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
            }}
          >
            {topicGuide.overview}
          </p>

          {/* The lesson body grows with its content — no internal max-height, because
              R3.2 requires the page to scroll rather than clipping details. */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)',
            }}
          >
            {topicGuide.sections.map((section, idx) => (
              <section key={`guide-section-${idx}`}>
                <h3
                  style={{
                    margin: '0 0 var(--space-2) 0',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {section.heading}
                </h3>
                <p style={bodyStyle}>{section.body}</p>
              </section>
            ))}

            {keyTerms.length > 0 && (
              <section>
                <div style={labelStyle}>Key terms</div>
                <dl data-testid="details-key-terms" style={responsiveGridStyle}>
                  {keyTerms.map((entry, idx) => (
                    <div key={`key-term-${idx}`}>
                      {/* Mono + weight already separates the term from its
                          definition; the accent stays reserved for selection. */}
                      <dt
                        style={{
                          fontFamily: 'var(--font-code)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {entry.term}
                      </dt>
                      <dd
                        style={{
                          margin: 0,
                          fontSize: 'var(--text-sm)',
                          lineHeight: 1.6,
                          color: 'var(--text-secondary)',
                        }}
                      >
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
