import React, { useEffect, useRef } from 'react';
import { Card } from '../../ui';

export interface CodeBlockViewerProps {
  code: string;
  activeLine: number;
  variables?: Record<string, string | number | boolean>;
}

const PYTHON_KEYWORDS = new Set([
  'def', 'return', 'if', 'else', 'elif', 'for', 'while', 'in', 'and', 'or', 'not',
  'is', 'True', 'False', 'None', 'import', 'from', 'as', 'class', 'raise', 'try',
  'except', 'yield', 'pass', 'with', 'lambda', 'global', 'nonlocal', 'break', 'continue',
]);

const PYTHON_BUILTINS = new Set([
  'int', 'str', 'list', 'dict', 'set', 'bool', 'float', 'tuple', 'len', 'range',
  'print', 'enumerate', 'zip', 'max', 'min', 'sum', 'abs', 'sorted', 'map',
  'filter', 'any', 'all', 'super', 'self', 'append', 'pop', 'add', 'remove',
]);

export function highlightPythonLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    // 1. Comments
    if (line[i] === '#') {
      nodes.push(
        <span key={i} style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {line.slice(i)}
        </span>
      );
      break;
    }

    // 2. Strings ('...' or "...")
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let end = i + 1;
      while (end < len && (line[end] !== quote || line[end - 1] === '\\')) {
        end++;
      }
      if (end < len) end++;
      nodes.push(
        <span key={i} style={{ color: '#86efac' }}>
          {line.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // 3. Numbers
    if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z_]/.test(line[i - 1]))) {
      let end = i;
      while (end < len && /[\d.xXa-fA-F]/.test(line[end])) {
        end++;
      }
      nodes.push(
        <span key={i} style={{ color: '#fb923c' }}>
          {line.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // 4. Identifiers / Keywords / Builtins / Functions
    if (/[a-zA-Z_]/.test(line[i])) {
      let end = i;
      while (end < len && /[a-zA-Z0-9_]/.test(line[end])) {
        end++;
      }
      const token = line.slice(i, end);

      let prevDef = false;
      let p = i - 1;
      while (p >= 0 && /\s/.test(line[p])) p--;
      if (p >= 2 && line.slice(p - 2, p + 1) === 'def' && (p - 3 < 0 || !/[a-zA-Z0-9_]/.test(line[p - 3]))) {
        prevDef = true;
      }

      if (PYTHON_KEYWORDS.has(token)) {
        nodes.push(
          <span key={i} style={{ color: '#c084fc', fontWeight: 600 }}>
            {token}
          </span>
        );
      } else if (prevDef) {
        nodes.push(
          <span key={i} style={{ color: '#facc15', fontWeight: 600 }}>
            {token}
          </span>
        );
      } else if (PYTHON_BUILTINS.has(token)) {
        nodes.push(
          <span key={i} style={{ color: '#38bdf8' }}>
            {token}
          </span>
        );
      } else {
        nodes.push(
          <span key={i} style={{ color: '#e4e4e7' }}>
            {token}
          </span>
        );
      }
      i = end;
      continue;
    }

    // 5. Operators & Punctuation
    if (/[=+\-*/%<>&|^~:;,!.]/.test(line[i])) {
      nodes.push(
        <span key={i} style={{ color: '#94a3b8' }}>
          {line[i]}
        </span>
      );
      i++;
      continue;
    }

    // 6. Whitespace / Other
    nodes.push(line[i]);
    i++;
  }

  return nodes;
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
              {highlightPythonLine(lineText)}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
