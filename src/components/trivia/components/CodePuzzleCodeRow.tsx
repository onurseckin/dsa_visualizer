import React from "react";
import { PuzzleLine } from "../../../types/trivia";
import { highlightPythonLine } from "../../primitives/CodeBlockViewer";
import { CODE_GROUP, GUTTER, INDENT } from "../codePuzzleTypes";

interface CodePuzzleCodeRowProps {
  line: PuzzleLine;
  explanation?: string;
  rowHoverHandlers?: (line: number) => {
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
  };
}

export const CodePuzzleCodeRow: React.FC<CodePuzzleCodeRowProps> = ({
  line,
  explanation,
  rowHoverHandlers,
}) => {
  const hoverHandlers =
    explanation !== undefined && rowHoverHandlers ? rowHoverHandlers(line.number) : undefined;

  return (
    <div
      className="ui-code-line"
      data-testid={`code-row-${line.number}`}
      onMouseEnter={hoverHandlers?.onMouseEnter}
      onMouseLeave={hoverHandlers?.onMouseLeave}
    >
      <div style={CODE_GROUP}>
        <span style={GUTTER}>{line.number}</span>
        <span aria-hidden="true" data-testid={`indent-${line.number}`} style={INDENT}>
          {line.indent}
        </span>
        <span style={{ minWidth: 0, whiteSpace: "pre" }}>{highlightPythonLine(line.content)}</span>
      </div>
    </div>
  );
};
