import React from "react";
import type { NumericalExercise } from "../../curriculum";

export interface NumericalLabTabsProps {
  readonly exercises: readonly NumericalExercise[];
  readonly activeIndex: number;
  readonly onSelectIndex: (index: number) => void;
}

export const NumericalLabTabs: React.FC<NumericalLabTabsProps> = ({
  exercises,
  activeIndex,
  onSelectIndex,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        padding: "10px 20px",
        background: "#090d16",
        borderBottom: "1px solid #1e293b",
        overflowX: "auto",
      }}
    >
      {exercises.map((ex, idx) => (
        <button
          key={ex.id}
          data-testid={`exercise-tab-${idx}`}
          onClick={() => onSelectIndex(idx)}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: idx === activeIndex ? "1px solid #38bdf8" : "1px solid #1e293b",
            background: idx === activeIndex ? "rgba(56, 189, 248, 0.15)" : "#0f172a",
            color: idx === activeIndex ? "#38bdf8" : "#94a3b8",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {idx + 1}. {ex.title.split(":")[0] || ex.title}
        </button>
      ))}
    </div>
  );
};
