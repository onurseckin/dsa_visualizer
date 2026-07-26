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
}) => {
  const lines = code.trim().split('\n');
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Optional call: jsdom doesn't implement scrollIntoView.
    activeLineRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [activeLine]);

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
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--bg-inset)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
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
    </Card>
  );
};
