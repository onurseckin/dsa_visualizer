import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Badge, Button, Card, difficultyBadgeVariant } from '../../ui';
import {
  CategoryType,
  DifficultyLevel,
  ProblemExample,
  TimeComplexity,
  TopicGuide,
} from '../../types/dsa';

export interface ProblemHeaderProps {
  title: string;
  category: CategoryType;
  difficulty?: DifficultyLevel;
  description: string;
  constraints?: string[];
  examples?: ProblemExample[];
  timeComplexity?: TimeComplexity;
  spaceComplexity?: string;
  topicGuide: TopicGuide;
  /* Expansion is controlled by the parent so the surrounding layout can switch
     between viewport-fit and page-scroll modes in sync with the details panel. */
  expanded: boolean;
  onToggleExpanded: () => void;
  onResetLayout?: () => void;
}

const humanizeCategory = (category: string): string => {
  const spaced = category.replace(/[-_]/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/* Grid track floor for the multi-column blocks. The token scale covers spacing and
   control heights, not column measures, so this lives here. `min(100%, …)` keeps a
   single column from overflowing a container narrower than the floor. */
const COLUMN_FLOOR = 'minmax(min(100%, 22rem), 1fr)';

const responsiveGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, ${COLUMN_FLOOR})`,
  gap: 'var(--space-3) var(--space-5)',
  alignItems: 'start',
};

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
   panel and its example wells actually read as containers (DESIGN.md R5.1). */
const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const monoListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 'var(--space-4)',
  fontFamily: 'var(--font-code)',
  fontSize: 'var(--text-xs)',
  lineHeight: 1.6,
  color: 'var(--text-secondary)',
};

export const ProblemHeader: React.FC<ProblemHeaderProps> = ({
  title,
  category,
  difficulty = 'Easy',
  description,
  constraints,
  examples,
  topicGuide,
  expanded,
  onToggleExpanded,
  onResetLayout,
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
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>

        <Badge variant={difficultyBadgeVariant(difficulty)}>{difficulty}</Badge>
        <Badge variant="neutral">{humanizeCategory(category)}</Badge>

        <div style={{ flex: 1 }} />

        <Button
          size="sm"
          selected={expanded}
          aria-expanded={expanded}
          onClick={onToggleExpanded}
        >
          Details
        </Button>

        {onResetLayout && (
          <Button size="sm" variant="ghost" icon={<RotateCcw />} onClick={onResetLayout}>
            Reset layout
          </Button>
        )}
      </div>

      {expanded && (
        <div
          data-testid="problem-details"
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

          <section>
            <div style={labelStyle}>Problem</div>
            <p style={bodyStyle}>{description}</p>
          </section>

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
                <h2
                  style={{
                    margin: '0 0 var(--space-2) 0',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {section.heading}
                </h2>
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

            {constraints && constraints.length > 0 && (
              <section>
                <div style={labelStyle}>Constraints</div>
                <ul style={monoListStyle}>
                  {constraints.map((constraint, idx) => (
                    <li key={`constraint-${idx}`}>{constraint}</li>
                  ))}
                </ul>
              </section>
            )}

            {examples && examples.length > 0 && (
              <section>
                <div style={labelStyle}>Examples</div>
                <div data-testid="details-examples" style={responsiveGridStyle}>
                  {examples.map((example, idx) => (
                    <div
                      key={`example-${idx}`}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--bg-inset)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-code)',
                        fontSize: 'var(--text-xs)',
                        lineHeight: 1.6,
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Input: </span>
                        <span style={{ color: 'var(--text-primary)' }}>{example.input}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Output: </span>
                        <span style={{ color: 'var(--text-primary)' }}>{example.output}</span>
                      </div>
                      {example.explanation && (
                        <div
                          style={{
                            marginTop: 'var(--space-1)',
                            fontFamily: 'var(--font-ui)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {example.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProblemHeader;
