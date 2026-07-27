import React, { useEffect, useRef } from "react";
import { Card } from "..";
import type { CodeBlockViewerProps } from "../../components/primitives/code_block/codeBlockTypes";
import { CodeLine } from "../../components/primitives/code_block/CodeLine";
import { highlightPythonLine } from "../../components/primitives/code_block/pythonHighlighter";

export type { CodeBlockViewerProps };
export { highlightPythonLine };

export const CodeBlockViewer: React.FC<CodeBlockViewerProps> = ({
  code,
  activeLine,
  lineExplanations,
}) => {
  const lines = code.trim().split("\n");
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [activeLine]);

  return (
    <Card
      data-testid="code-viewer"
      padding="none"
      className="border border-[var(--border-default)] bg-[var(--bg-surface)] h-full flex flex-col p-0"
    >
      <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-inset)] p-0">
        {lines.map((lineText, idx) => {
          const lineNumber = idx + 1;
          const isActive = lineNumber === activeLine;
          const explanation = lineExplanations?.[lineNumber];

          return (
            <React.Fragment key={idx}>
              <CodeLine
                lineText={lineText}
                lineNumber={lineNumber}
                isActive={isActive}
                activeLineRef={activeLineRef}
              />
              {explanation ? (
                <div
                  data-testid={`line-explanation-${lineNumber}`}
                  className="px-4 py-1 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] border-l-4 border-transparent pl-12 font-sans"
                >
                  {explanation}
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
};

export default CodeBlockViewer;
