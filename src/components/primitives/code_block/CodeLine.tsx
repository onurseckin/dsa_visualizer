import React from "react";
import { splitIndent } from "./codeBlockTypes";
import { highlightPythonLine } from "./pythonHighlighter";

export interface CodeLineProps {
  lineText: string;
  lineNumber: number;
  isActive: boolean;
  activeLineRef: React.RefObject<HTMLDivElement | null>;
  hoverHandlers?: {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
  };
}

export const CodeLine: React.FC<CodeLineProps> = ({
  lineText,
  lineNumber,
  isActive,
  activeLineRef,
  hoverHandlers,
}) => {
  const { indent, content } = splitIndent(lineText);

  return (
    <div
      ref={isActive ? activeLineRef : undefined}
      className={
        isActive
          ? "ui-code-line ui-code-line--active px-4 py-2 font-mono text-sm leading-relaxed bg-[var(--accent-soft)] border-l-4 border-[var(--accent)] text-[var(--text-primary)] font-[500] shadow-[inset_4px_0_0_var(--accent)]"
          : "ui-code-line px-4 py-2 font-mono text-sm leading-relaxed border-l-4 border-transparent text-[var(--text-secondary)]"
      }
      data-testid={`code-row-${lineNumber}`}
      onMouseEnter={hoverHandlers?.onMouseEnter}
      onMouseLeave={hoverHandlers?.onMouseLeave}
    >
      <span className="inline-block w-[2.5em] text-right mr-4 font-mono text-[var(--text-muted)] opacity-60 select-none">
        {lineNumber}
      </span>
      <span data-testid={`indent-${lineNumber}`} className="whitespace-pre">
        {indent}
      </span>
      {highlightPythonLine(content)}
    </div>
  );
};
