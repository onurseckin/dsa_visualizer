import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
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
  initialExpanded?: boolean;
  onResetLayout?: () => void;
}

const getDifficultyBadgeClass = (difficulty?: DifficultyLevel): string => {
  switch (difficulty) {
    case 'Easy':
      return 'badge badge-easy';
    case 'Medium':
      return 'badge badge-medium';
    case 'Hard':
      return 'badge badge-hard';
    default:
      return 'badge badge-easy';
  }
};

export const ProblemHeader: React.FC<ProblemHeaderProps> = ({
  title,
  category,
  difficulty = 'Easy',
  description,
  constraints,
  examples,
  timeComplexity,
  spaceComplexity,
  initialExpanded = true,
  onResetLayout,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  return (
    <div className="glass-card" style={{ width: '100%', padding: '12px 18px' }}>
      {/* Compact Main Title & Metadata Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Left Side: Title, Category, Difficulty & Complexity Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {title}
          </h1>

          <span
            style={{
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(0, 255, 157, 0.1)',
              border: '1px solid var(--border-muted)',
              color: 'var(--accent-mint)',
            }}
          >
            {category}
          </span>

          <span className={getDifficultyBadgeClass(difficulty)}>{difficulty}</span>

          {/* Inline Complexity Pills */}
          {timeComplexity && (
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-code)',
                background: 'var(--bg-darkest)',
                border: '1px solid var(--border-subtle)',
                padding: '2px 8px',
                borderRadius: '4px',
                color: 'var(--text-muted)',
              }}
            >
              Time: <strong style={{ color: 'var(--accent-emerald)' }}>O({timeComplexity.average})</strong>
            </span>
          )}

          {spaceComplexity && (
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-code)',
                background: 'var(--bg-darkest)',
                border: '1px solid var(--border-subtle)',
                padding: '2px 8px',
                borderRadius: '4px',
                color: 'var(--text-muted)',
              }}
            >
              Space: <strong style={{ color: 'var(--accent-cyan)' }}>O({spaceComplexity})</strong>
            </span>
          )}
        </div>

        {/* Right Side: Reset Layout & Expand/Collapse Toggle Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setIsExpanded(true);
              onResetLayout?.();
            }}
            title="Reset panel split ratio to default and expand details"
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw style={{ width: '12px', height: '12px' }} />
            Reset Layout
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            {isExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
          </button>
        </div>
      </div>

      {/* Expandable Details Container: Description, Examples, Constraints */}
      {isExpanded && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Description */}
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
            {description}
          </p>

          {/* Examples */}
          {examples && examples.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--accent-mint)',
                  marginBottom: '6px',
                }}
              >
                Examples
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {examples.map((ex, idx) => (
                  <div
                    key={`example-${idx}`}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-darkest)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-code)',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Input: </span>
                      <span style={{ color: 'var(--text-main)' }}>
                        {typeof ex.input === 'object' ? JSON.stringify(ex.input) : String(ex.input)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Output: </span>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                        {typeof ex.output === 'object' ? JSON.stringify(ex.output) : String(ex.output)}
                      </span>
                    </div>
                    {ex.explanation && (
                      <div
                        style={{
                          marginTop: '4px',
                          color: 'var(--text-dim)',
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.78rem',
                        }}
                      >
                        <em>{ex.explanation}</em>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Constraints */}
          {constraints && constraints.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                }}
              >
                Constraints
              </div>
              <ul
                style={{
                  paddingLeft: '18px',
                  margin: 0,
                  color: 'var(--text-dim)',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-code)',
                }}
              >
                {constraints.map((c, idx) => (
                  <li key={`constraint-${idx}`} style={{ marginBottom: '2px' }}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemHeader;
