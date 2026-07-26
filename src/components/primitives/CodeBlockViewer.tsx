import React, { useEffect, useRef } from 'react';
import { Card } from '../../ui';

export interface CodeBlockViewerProps {
  code: string;
  activeLine: number;
  variables?: Record<string, string | number | boolean>;
}

export const CodeBlockViewer: React.FC<CodeBlockViewerProps> = ({
  code,
  activeLine,
  variables,
}) => {
  const lines = code.trim().split('\n');
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Optional call: jsdom doesn't implement scrollIntoView.
    activeLineRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [activeLine]);

  const hasVariables = variables !== undefined && Object.keys(variables).length > 0;

  return (
    <Card
      padding="none"
      title={
        <span
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: 'var(--text-xs)',
            fontWeight: 400,
            color: 'var(--text-muted)',
          }}
        >
          solution.py
        </span>
      }
      actions={
        <span
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          line {activeLine}
        </span>
      }
      /* Hugs the listing: no grow, no floor, so the solution shows in full and the
         complexity card sits directly under the last line (DESIGN.md R5.4). */
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            /* Shrinkable but never greedy: nothing stretches the listing past the
               code, while a column that pins a height still gets an inner scroll
               instead of an overflow. */
            flex: '0 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            background: 'var(--bg-inset)',
            borderTop: '1px solid var(--border-default)',
            padding: 'var(--space-2) 0',
          }}
        >
          {lines.map((lineText, idx) => {
            const lineNumber = idx + 1;
            const isActive = lineNumber === activeLine;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : undefined}
                className={isActive ? 'ui-code-line ui-code-line--active' : 'ui-code-line'}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '2.5em',
                    textAlign: 'right',
                    marginRight: 'var(--space-3)',
                    color: 'var(--text-muted)',
                    userSelect: 'none',
                  }}
                >
                  {lineNumber}
                </span>
                {lineText}
              </div>
            );
          })}
        </div>

        {hasVariables && (
          /* Live-variable strip: an embedded control strip, so it sits on
             --bg-elevated with its chips dropped to --bg-inset to stay legible. */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--bg-elevated)',
              borderTop: '1px solid var(--border-default)',
              overflowX: 'auto',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                flexShrink: 0,
                marginRight: 'var(--space-1)',
              }}
            >
              Vars
            </span>
            {Object.entries(variables).map(([k, v]) => (
              <span
                key={k}
                className="ui-chip"
                style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-default)' }}
              >
                {k}
                <span style={{ color: 'var(--text-muted)' }}>=</span>
                <span style={{ color: 'var(--text-primary)' }}>{String(v)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
