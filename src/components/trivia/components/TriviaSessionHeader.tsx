import React from "react";
import { ExternalLink, Home, SlidersHorizontal } from "lucide-react";
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
            <Button
              size="sm"
              variant="secondary"
              icon={<ExternalLink aria-hidden="true" />}
              onClick={() => onStudyInWorkspace(algorithmId)}
            >
              Study in workspace
            </Button>
          ) : null}
          {onEditSettings ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<SlidersHorizontal aria-hidden="true" />}
              onClick={onEditSettings}
            >
              Edit deck & settings
            </Button>
          ) : null}
          {onBackToHome ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<Home aria-hidden="true" />}
              onClick={onBackToHome}
            >
              Back to Trivia Home
            </Button>
          ) : null}
        </div>
      </div>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
        {`Level ${level} · ${coverage}% covered`}
      </span>
    </header>
  );
};
