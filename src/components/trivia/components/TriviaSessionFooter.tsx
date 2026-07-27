import React from "react";
import { Button, Kbd } from "../../../ui";
import { TriviaGrade } from "../../../types/trivia";

interface TriviaSessionFooterProps {
  grade: TriviaGrade | null;
  totalBlanks: number;
  correctCount: number;
  allFilled: boolean;
  onRetry: () => void;
  onCheck: () => void;
  onNext: () => void;
}

export const TriviaSessionFooter: React.FC<TriviaSessionFooterProps> = ({
  grade,
  totalBlanks,
  correctCount,
  allFilled,
  onRetry,
  onCheck,
  onNext,
}) => {
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
        {grade !== null ? (
          <span
            role="status"
            aria-live="polite"
            style={{
              color: grade.allCorrect ? "var(--color-success-text)" : "var(--color-danger-text)",
              fontWeight: 600,
            }}
          >
            {`${correctCount} of ${totalBlanks} correct. `}
            {grade.allCorrect ? "All correct! Great recall." : "Review red lines and try next."}
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <Button variant="secondary" size="md" onClick={onRetry}>
          Retry <Kbd>⌘R</Kbd>
        </Button>
        {grade === null ? (
          <Button variant="primary" size="md" disabled={!allFilled} onClick={onCheck}>
            Check answers <Kbd>⌘Enter</Kbd>
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={onNext}>
            {grade.allCorrect ? "Next round" : "Try again"} <Kbd>⌘Enter</Kbd>
          </Button>
        )}
      </div>
    </footer>
  );
};
