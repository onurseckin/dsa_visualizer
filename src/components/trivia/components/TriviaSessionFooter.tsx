import React from "react";
import { Button, Kbd } from "../../../ui";
import type { TriviaConfidence, TriviaGrade, TriviaRetrievalPrompt } from "../../../types/trivia";

interface TriviaSessionFooterProps {
  grade: TriviaGrade | null;
  totalBlanks: number;
  correctCount: number;
  allFilled: boolean;
  onRetry: () => void;
  onCheck: () => void;
  onNext: () => void;
  retrievalPrompt?: TriviaRetrievalPrompt;
  misconceptionCodes?: string[];
  reviewResponse?: string;
  confidence?: TriviaConfidence | null;
  reviewComplete?: boolean;
  onReviewResponseChange?: (response: string) => void;
  onConfidenceChange?: (confidence: TriviaConfidence) => void;
}

export const TriviaSessionFooter: React.FC<TriviaSessionFooterProps> = ({
  grade,
  totalBlanks,
  correctCount,
  allFilled,
  onRetry,
  onCheck,
  onNext,
  retrievalPrompt,
  misconceptionCodes,
  reviewResponse = "",
  confidence = null,
  reviewComplete = true,
  onReviewResponseChange,
  onConfidenceChange,
}) => {
  return (
    <footer
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
        {grade !== null ? (
          <>
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
            {misconceptionCodes && misconceptionCodes.length > 0 ? (
              <span style={{ display: "block", marginTop: "var(--space-1)" }}>
                Review focus: {misconceptionCodes.map(formatMisconceptionCode).join(", ")}
              </span>
            ) : null}
          </>
        ) : null}
      </div>

      {grade !== null && retrievalPrompt ? (
        <section
          aria-label="Delayed retrieval reflection"
          style={{
            display: "grid",
            gap: "var(--space-3)",
            padding: "var(--space-4)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-inset)",
          }}
        >
          <label
            htmlFor="trivia-retrieval-reflection"
            style={{ color: "var(--text-primary)", fontWeight: 600 }}
          >
            {retrievalPrompt.prompt}
          </label>
          <textarea
            id="trivia-retrieval-reflection"
            aria-label="Retrieval reflection"
            value={reviewResponse}
            onChange={(event) => onReviewResponseChange?.(event.target.value)}
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              padding: "var(--space-3)",
            }}
          />
          <fieldset style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", border: 0 }}>
            <legend style={{ marginBottom: "var(--space-2)", color: "var(--text-secondary)" }}>
              Recall confidence
            </legend>
            {CONFIDENCE_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                  minHeight: 44,
                }}
              >
                <input
                  type="radio"
                  name="trivia-confidence"
                  value={value}
                  checked={confidence === value}
                  onChange={() => onConfidenceChange?.(value)}
                  aria-label={`${value} — ${label}`}
                />
                {value}
              </label>
            ))}
          </fieldset>
        </section>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "var(--space-2)",
        }}
      >
        <Button variant="secondary" size="md" onClick={onRetry}>
          Retry <Kbd>⌘R</Kbd>
        </Button>
        {grade === null ? (
          <Button variant="primary" size="md" disabled={!allFilled} onClick={onCheck}>
            Check answers <Kbd>⌘Enter</Kbd>
          </Button>
        ) : (
          <Button variant="primary" size="md" disabled={!reviewComplete} onClick={onNext}>
            {grade.allCorrect ? "Next round" : "Try again"} <Kbd>⌘Enter</Kbd>
          </Button>
        )}
      </div>
    </footer>
  );
};

const CONFIDENCE_OPTIONS = [
  { value: 1, label: "guessing" },
  { value: 2, label: "uncertain" },
  { value: 3, label: "developing" },
  { value: 4, label: "confident" },
  { value: 5, label: "certain" },
] as const satisfies readonly { value: TriviaConfidence; label: string }[];

function formatMisconceptionCode(code: string): string {
  return code.replaceAll("-", " ");
}
