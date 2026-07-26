import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../../ui';
import { CodeExplainToggle, LineExplainPopover, useHoveredCodeLine } from './LineExplainPopover';

export interface CodeBlockViewerProps {
  code: string;
  activeLine: number;
  variables?: Record<string, string | number | boolean>;
  lineExplanations?: Record<number, string>;
}

const GUTTER_STYLE: React.CSSProperties = {
  display: 'inline-block',
  width: '2.5em',
  textAlign: 'right',
  marginRight: 'var(--space-3)',
  color: 'var(--text-muted)',
  userSelect: 'none',
};

/* Indentation is split from code content and rendered through its own
   explicit `white-space: pre` element (mirrors triviaEngine's
   parsePuzzleLines indent/content split) rather than ever letting a raw,
   leading-whitespace-included line string reach highlightPythonLine as a
   single node. Defense-in-depth: this row is plain block-flow today so
   nothing currently collapses the whitespace, but splitting it explicitly
   means this markup stays correct even if the row's layout mode changes
   later (a bare whitespace-only text run between flex items is dropped
   entirely per the CSS Flexbox spec — the bug this sidesteps). */
const INDENT_STYLE: React.CSSProperties = {
  whiteSpace: 'pre',
};

function splitIndent(line: string): { indent: string; content: string } {
  const match = /^(\s*)(.*)$/.exec(line);
  return match ? { indent: match[1], content: match[2] } : { indent: '', content: line };
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
  lineExplanations,
}) => {
  const lines = code.trim().split('\n');
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [explainEnabled, setExplainEnabled] = useState(true);
  const { hovered, rowHoverHandlers } = useHoveredCodeLine(explainEnabled);

  useEffect(() => {
    // Optional call: jsdom doesn't implement scrollIntoView.
    activeLineRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [activeLine]);

  const hoveredExplanation = hovered !== null ? lineExplanations?.[hovered.line] : undefined;

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
        <>
          <CodeExplainToggle enabled={explainEnabled} onToggle={() => setExplainEnabled((current) => !current)} />
          <span
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            line {activeLine}
          </span>
        </>
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
          const explanation = lineExplanations?.[lineNumber];
          const { indent, content } = splitIndent(lineText);
          const hoverHandlers = explanation !== undefined ? rowHoverHandlers(lineNumber) : undefined;

          return (
            <div
              key={idx}
              ref={isActive ? activeLineRef : undefined}
              className={isActive ? 'ui-code-line ui-code-line--active' : 'ui-code-line'}
              data-testid={`code-row-${lineNumber}`}
              onMouseEnter={hoverHandlers?.onMouseEnter}
              onMouseLeave={hoverHandlers?.onMouseLeave}
            >
              <span style={GUTTER_STYLE}>{lineNumber}</span>
              <span data-testid={`indent-${lineNumber}`} style={INDENT_STYLE}>
                {indent}
              </span>
              {highlightPythonLine(content)}
            </div>
          );
        })}
      </div>
      {explainEnabled && hovered !== null && hoveredExplanation !== undefined ? (
        <LineExplainPopover line={hovered.line} explanation={hoveredExplanation} anchorRect={hovered.rect} side="left" />
      ) : null}
    </Card>
  );
};
