import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Badge, Button, Card, difficultyBadgeVariant } from '../../ui';
import { CategoryType, DifficultyLevel, ProblemExample, TimeComplexity } from '../../types/dsa';

export interface ProblemHeaderProps {
  title: string;
  category: CategoryType;
  difficulty?: DifficultyLevel;
  description: string;
  constraints?: string[];
  examples?: ProblemExample[];
  timeComplexity?: TimeComplexity;
  spaceComplexity?: string;
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

export const ProblemHeader: React.FC<ProblemHeaderProps> = ({
  title,
  category,
  difficulty = 'Easy',
  description,
  constraints,
  examples,
  expanded,
  onToggleExpanded,
  onResetLayout,
}) => {
  return (
    <Card padding="sm">
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
          style={{
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
            }}
          >
            {description}
          </p>

          {constraints && constraints.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Constraints
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 'var(--space-4)',
                  fontFamily: 'var(--font-code)',
                  fontSize: 'var(--text-xs)',
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                }}
              >
                {constraints.map((constraint, idx) => (
                  <li key={`constraint-${idx}`}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}

          {examples && examples.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Examples
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {examples.map((example, idx) => (
                  <div
                    key={`example-${idx}`}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-subtle)',
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
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ProblemHeader;
