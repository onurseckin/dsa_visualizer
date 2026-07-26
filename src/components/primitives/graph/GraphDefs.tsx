import React from "react";

export interface GraphDefsProps {
  markerScope: string;
  arrowW: number;
  arrowH: number;
  arrowRefX: number;
}

export const GraphDefs: React.FC<GraphDefsProps> = ({ markerScope, arrowW, arrowH, arrowRefX }) => {
  return (
    <defs>
      <marker
        id={`arrowhead-${markerScope}`}
        markerUnits="userSpaceOnUse"
        markerWidth={arrowW}
        markerHeight={arrowH}
        refX={arrowRefX}
        refY={arrowH / 2}
        orient="auto"
      >
        <polygon
          points={`0 0, ${arrowW} ${arrowH / 2}, 0 ${arrowH}`}
          fill="var(--border-default)"
        />
      </marker>
      <marker
        id={`arrowhead-traversed-${markerScope}`}
        markerUnits="userSpaceOnUse"
        markerWidth={arrowW}
        markerHeight={arrowH}
        refX={arrowRefX}
        refY={arrowH / 2}
        orient="auto"
      >
        <polygon points={`0 0, ${arrowW} ${arrowH / 2}, 0 ${arrowH}`} fill="var(--state-active)" />
      </marker>
      <marker
        id={`arrowhead-path-${markerScope}`}
        markerUnits="userSpaceOnUse"
        markerWidth={arrowW}
        markerHeight={arrowH}
        refX={arrowRefX}
        refY={arrowH / 2}
        orient="auto"
      >
        <polygon points={`0 0, ${arrowW} ${arrowH / 2}, 0 ${arrowH}`} fill="var(--state-path)" />
      </marker>
    </defs>
  );
};
