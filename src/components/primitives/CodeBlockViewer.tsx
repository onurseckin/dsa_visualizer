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
      style={{ height: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            background: 'var(--bg-inset)',
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
                    color: 'var(--text-faint)',
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: 'var(--space-2) var(--space-3)',
              borderTop: '1px solid var(--border-subtle)',
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
              <span key={k} className="ui-chip">
                {k}
                <span style={{ color: 'var(--text-faint)' }}>=</span>
                <span style={{ color: 'var(--text-primary)' }}>{String(v)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
