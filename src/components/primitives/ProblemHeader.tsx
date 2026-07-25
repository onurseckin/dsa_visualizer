import React, { useState } from 'react';
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
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="glass-card" style={{ width: '100%', padding: '16px 20px' }}>
      {/* Top Title Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* Complexity Badges */}
      {(timeComplexity || spaceComplexity) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '14px',
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-muted)',
          }}
        >
          {timeComplexity && (
            <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-code)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Time: </span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                O({timeComplexity.average})
              </span>
              <span style={{ color: 'var(--text-dark)', fontSize: '0.7rem', marginLeft: '6px' }}>
                (Worst: O({timeComplexity.worst}))
              </span>
            </div>
          )}
          {spaceComplexity && (
            <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-code)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Space: </span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                O({spaceComplexity})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem', lineHeight: '1.6' }}>
        {description}
      </p>

      {/* Expandable Details Section */}
      {isExpanded && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Examples */}
          {examples && examples.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--accent-mint)',
                  marginBottom: '8px',
                }}
              >
                Examples
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {examples.map((ex, idx) => (
                  <div
                    key={`example-${idx}`}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg-darkest)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.84rem',
                      fontFamily: 'var(--font-code)',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Input: </span>
                      <span style={{ color: 'var(--text-main)' }}>{ex.input}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Output: </span>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                        {ex.output}
                      </span>
                    </div>
                    {ex.explanation && (
                      <div
                        style={{
                          marginTop: '4px',
                          color: 'var(--text-dim)',
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.8rem',
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
                  fontSize: '0.8rem',
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
                  paddingLeft: '20px',
                  color: 'var(--text-dim)',
                  fontSize: '0.84rem',
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
