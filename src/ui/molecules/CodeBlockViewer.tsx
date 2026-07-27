import React, { useEffect, useRef } from "react";
import { Card } from "..";
import {
  LineExplainPopover,
  useHoveredCodeLine,
} from "../../components/primitives/LineExplainPopover";
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
  const { hovered, rowHoverHandlers } = useHoveredCodeLine();

  useEffect(() => {
    activeLineRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [activeLine]);

  const hoveredExplanation = hovered !== null ? lineExplanations?.[hovered.line] : undefined;

  return (
    <Card
      data-testid="code-viewer"
      padding="none"
      variant="inset"
      style={{ background: "var(--bg-inset)" }}
      className="border border-[var(--border-default)] bg-[var(--bg-inset)] h-full flex flex-col p-0"
    >
      <div
        className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-inset)] p-0"
        style={{ background: "var(--bg-inset)" }}
      >
        {lines.map((lineText, idx) => {
          const lineNumber = idx + 1;
          const isActive = lineNumber === activeLine;
          const explanation = lineExplanations?.[lineNumber];
          const hoverHandlers =
            explanation !== undefined ? rowHoverHandlers(lineNumber) : undefined;

          return (
            <CodeLine
              key={idx}
              lineText={lineText}
              lineNumber={lineNumber}
              isActive={isActive}
              activeLineRef={activeLineRef}
              hoverHandlers={hoverHandlers}
            />
          );
        })}
      </div>
      {hovered !== null && hoveredExplanation !== undefined ? (
        <LineExplainPopover
          line={hovered.line}
          explanation={hoveredExplanation}
          anchorRect={hovered.rect}
          side="left"
        />
      ) : null}
    </Card>
  );
};

export default CodeBlockViewer;
