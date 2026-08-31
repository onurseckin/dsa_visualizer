import React from "react";
import { TOPIC_PRESETS } from "./numericalLabUtils";

export interface NumericalLabHeaderProps {
  readonly selectedTopic: string;
  readonly onSelectTopic: (topic: string) => void;
  readonly seedInput: string;
  readonly onSeedInputChange: (val: string) => void;
  readonly onApplyCustomSeed: () => void;
  readonly onRandomizeSeed: () => void;
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
  readonly activeExerciseIndex: number;
  readonly totalExercises: number;
  readonly activeSeed: number;
  readonly streak: number;
  readonly accuracyPct: number;
  readonly totalCorrect: number;
  readonly totalAttempted: number;
  readonly totalScore: number;
}

export const NumericalLabHeader: React.FC<NumericalLabHeaderProps> = ({
  selectedTopic,
  onSelectTopic,
  seedInput,
  onSeedInputChange,
  onApplyCustomSeed,
  onRandomizeSeed,
  isOpen,
  onClose,
  activeExerciseIndex,
  totalExercises,
  activeSeed,
  streak,
  accuracyPct,
  totalCorrect,
  totalAttempted,
  totalScore,
}) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🧮</span>
          <div>
            <h2
              data-testid="lab-title"
              style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#38bdf8" }}
            >
              Numerical Systems & Sizing Lab
            </h2>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              Parameterized Quantitative Derivations & Instant Tolerance Verifier
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            data-testid="topic-select"
            value={selectedTopic}
            onChange={(e) => onSelectTopic(e.target.value)}
            style={{
              padding: "6px 10px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {TOPIC_PRESETS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#1e293b",
              padding: "2px 6px",
              borderRadius: "6px",
              border: "1px solid #334155",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>Seed:</span>
            <input
              data-testid="seed-input"
              type="number"
              value={seedInput}
              onChange={(e) => onSeedInputChange(e.target.value)}
              onBlur={onApplyCustomSeed}
              onKeyDown={(e) => e.key === "Enter" && onApplyCustomSeed()}
              style={{
                width: "56px",
                padding: "2px 4px",
                background: "#090d16",
                border: "1px solid #334155",
                color: "#38bdf8",
                borderRadius: "4px",
                fontSize: "11px",
                textAlign: "center",
                fontWeight: 700,
              }}
            />
            <button
              data-testid="randomize-seed-btn"
              onClick={onRandomizeSeed}
              style={{
                padding: "3px 8px",
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid #38bdf8",
                color: "#38bdf8",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🎲 Randomize
            </button>
          </div>

          {isOpen && onClose && (
            <button
              data-testid="modal-close-btn"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div
        data-testid="stats-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 20px",
          background: "rgba(15, 23, 42, 0.7)",
          borderBottom: "1px solid #1e293b",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>
          Problem <strong>{totalExercises > 0 ? activeExerciseIndex + 1 : 0}</strong> of{" "}
          <strong>{totalExercises}</strong> (Seed #{activeSeed})
        </span>
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <span>
            🔥 Streak:{" "}
            <strong style={{ color: streak > 0 ? "#fbbf24" : "#94a3b8" }}>{streak}</strong>
          </span>
          <span>
            🎯 Accuracy:{" "}
            <strong style={{ color: accuracyPct >= 80 ? "#34d399" : "#f59e0b" }}>
              {accuracyPct}% ({totalCorrect}/{totalAttempted})
            </strong>
          </span>
          <span>
            ⭐ Score: <strong style={{ color: "#c084fc" }}>{totalScore} pts</strong>
          </span>
        </div>
      </div>
    </>
  );
};
