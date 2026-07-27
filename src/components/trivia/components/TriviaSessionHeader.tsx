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
    <header className="flex flex-col gap-4 p-6 md:p-8 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{algorithmTitle}</h2>
        <Badge size="md">{hiddenLabel}</Badge>
        <span className="text-sm text-[var(--text-muted)]">{modeDescription}</span>
        <div className="ml-auto flex items-center gap-2">
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
      <div className="flex items-center gap-3 p-4 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs text-[var(--text-muted)] flex-wrap shadow-sm">
        {`Level ${level} · ${coverage}% covered`}
      </div>
    </header>
  );
};
