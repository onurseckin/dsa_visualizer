import React from "react";
import { splitIndent } from "./codeBlockTypes";
import { highlightPythonLine } from "./pythonHighlighter";

export interface CodeLineProps {
  lineText: string;
  lineNumber: number;
  isActive: boolean;
  activeLineRef: React.RefObject<HTMLDivElement>;
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
      className={isActive ? "ui-code-line ui-code-line--active" : "ui-code-line"}
      data-testid={`code-row-${lineNumber}`}
      onMouseEnter={hoverHandlers?.onMouseEnter}
      onMouseLeave={hoverHandlers?.onMouseLeave}
    >
      <span className="inline-block w-[2.5em] text-right mr-3 text-[var(--text-muted)] select-none">
        {lineNumber}
      </span>
      <span data-testid={`indent-${lineNumber}`} className="whitespace-pre">
        {indent}
      </span>
      {highlightPythonLine(content)}
    </div>
  );
};
