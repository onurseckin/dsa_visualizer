import React from "react";
import { Badge, Button } from "../../../ui";

interface TriviaSessionHeaderProps {
  algorithmTitle: string;
  hiddenLabel: string;
  modeDescription: string;
  level: number;
  coverage: number;
  algorithmId: string;
  onStudyInWorkspace?: (algorithmId?: string) => void;
  onEditSettings?: () => void;
  onBackToHome?: () => void;
}

export const TriviaSessionHeader: React.FC<TriviaSessionHeaderProps> = ({
  algorithmTitle,
  hiddenLabel,
  modeDescription,
  level,
  coverage,
  algorithmId,
  onStudyInWorkspace,
  onEditSettings,
  onBackToHome,
}) => {
  return (
    <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
          {algorithmTitle}
        </h2>
        <Badge size="md">{hiddenLabel}</Badge>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          {modeDescription}
        </span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          {onStudyInWorkspace ? (
            <Button size="sm" variant="secondary" onClick={() => onStudyInWorkspace(algorithmId)}>
              Study in workspace
            </Button>
          ) : null}
          {onEditSettings ? (
            <Button size="sm" variant="secondary" onClick={onEditSettings}>
              Edit deck & settings
            </Button>
          ) : null}
          {onBackToHome ? (
            <Button size="sm" variant="secondary" onClick={onBackToHome}>
              Back to Trivia Home
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 p-4 md:p-5 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs text-[var(--text-muted)] flex-wrap shadow-sm">
        {`Level ${level} · ${coverage}% covered`}
      </div>
    </header>
  );
};
