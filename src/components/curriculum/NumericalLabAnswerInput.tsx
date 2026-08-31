import React from "react";

export interface NumericalLabAnswerInputProps {
  readonly unit: string;
  readonly studentInput: string;
  readonly onInputChange: (val: string) => void;
  readonly onVerify: () => void;
  readonly onClear: () => void;
  readonly inputError: string | null;
  readonly verificationResult: {
    readonly isCorrect: boolean;
    readonly errorPct: number;
    readonly feedback: string;
  } | null;
  readonly showSolution: boolean;
  readonly onToggleSolution: () => void;
}

export const NumericalLabAnswerInput: React.FC<NumericalLabAnswerInputProps> = ({
  unit,
  studentInput,
  onInputChange,
  onVerify,
  onClear,
  inputError,
  verificationResult,
  showSolution,
  onToggleSolution,
}) => {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.9)",
        border: "1px solid #1e293b",
        borderRadius: "10px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            flex: "1",
            minWidth: "200px",
          }}
        >
          <input
            data-testid="student-answer-input"
            type="number"
            step="any"
            placeholder={`Enter value in ${unit}...`}
            value={studentInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onVerify()}
            style={{
              width: "100%",
              padding: "10px 60px 10px 14px",
              background: "#090d16",
              border: inputError
                ? "1px solid #ef4444"
                : verificationResult?.isCorrect
                  ? "1px solid #10b981"
                  : "1px solid #334155",
              color: "#ffffff",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          />
          <span
            data-testid="unit-adornment"
            style={{
              position: "absolute",
              right: "12px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              background: "#1e293b",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {unit}
          </span>
        </div>

        <button
          data-testid="verify-submit-btn"
          onClick={onVerify}
          style={{
            padding: "10px 18px",
            background: "#0284c7",
            border: "none",
            color: "#ffffff",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Submit & Verify ↵
        </button>

        {studentInput && (
          <button
            data-testid="clear-input-btn"
            onClick={onClear}
            style={{
              padding: "10px 14px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#cbd5e1",
              borderRadius: "8px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}

        <button
          data-testid="toggle-solution-btn"
          onClick={onToggleSolution}
          style={{
            padding: "10px 14px",
            background: showSolution ? "rgba(192, 132, 252, 0.2)" : "#1e293b",
            border: showSolution ? "1px solid #c084fc" : "1px solid #334155",
            color: showSolution ? "#c084fc" : "#94a3b8",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showSolution ? "Hide Derivation ▲" : "View Derivation 💡"}
        </button>
      </div>

      {inputError && (
        <div
          data-testid="input-error-msg"
          style={{ fontSize: "12px", color: "#f87171", fontWeight: 600 }}
        >
          ⚠️ {inputError}
        </div>
      )}

      {verificationResult && (
        <div
          data-testid="verification-feedback-card"
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: verificationResult.isCorrect
              ? "rgba(16, 185, 129, 0.12)"
              : "rgba(239, 68, 68, 0.12)",
            border: verificationResult.isCorrect ? "1px solid #10b981" : "1px solid #ef4444",
            fontSize: "13px",
            color: "#e2e8f0",
          }}
        >
          <strong style={{ color: verificationResult.isCorrect ? "#34d399" : "#f87171" }}>
            {verificationResult.isCorrect ? "✓ PASSED: " : "✕ INCORRECT: "}
          </strong>
          {verificationResult.feedback}
        </div>
      )}
    </div>
  );
};
