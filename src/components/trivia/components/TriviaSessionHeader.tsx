import React from "react";
import { Badge, Button, FieldLabel, Well, MarkdownRenderer } from "../../../ui";
import { getAlgorithm } from "../../../algorithms/registry";
import { getTopicLabel } from "../../../app/topics";
import type { TriviaLayout, TriviaPanelVisibility } from "../../../trivia/triviaLayout";
import type { TriviaMode } from "../../../types/trivia";

export interface TriviaSessionHeaderProps {
  algorithmTitle: string;
  hiddenLabel: string;
  modeDescription?: string;
  level?: number;
  coverage?: number;
  algorithmId: string;
  onStudyInWorkspace?: (algorithmId?: string) => void;
  onEditSettings?: () => void;
  onBackToHome?: () => void;
  layout: TriviaLayout;
  onTogglePanel: (panel: keyof TriviaPanelVisibility) => void;
  mode: TriviaMode;
}

export const TriviaSessionHeader: React.FC<TriviaSessionHeaderProps> = ({
  algorithmTitle,
  hiddenLabel,
  algorithmId,
  onStudyInWorkspace,
  onEditSettings,
  onBackToHome,
  layout,
  onTogglePanel,
  mode,
}) => {
  const algorithm = getAlgorithm(algorithmId);
  const isExpanded = layout.panelVisibility.problem;

  return (
    <header className="flex flex-col gap-4 p-6 md:p-8 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{algorithmTitle}</h2>
        <Badge size="md">{hiddenLabel}</Badge>
        {algorithm?.topicIds.map((topicId) => (
          <Badge key={topicId} variant="neutral" size="sm">
            {getTopicLabel(topicId)}
          </Badge>
        ))}
        {algorithm?.difficulty && (
          <Badge variant="info" size="sm">
            {algorithm.difficulty}
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={layout.panelVisibility.problem ? "primary" : "secondary"}
            onClick={() => onTogglePanel("problem")}
          >
            Problem
          </Button>
          {mode === "choice" && (
            <Button
              size="sm"
              variant={layout.panelVisibility.tiles ? "primary" : "secondary"}
              onClick={() => onTogglePanel("tiles")}
            >
              Tiles
            </Button>
          )}
          <Button
            size="sm"
            variant={layout.panelVisibility.lineInfo ? "primary" : "secondary"}
            onClick={() => onTogglePanel("lineInfo")}
          >
            Line Info
          </Button>

          {onStudyInWorkspace && (
            <Button size="sm" variant="secondary" onClick={() => onStudyInWorkspace(algorithmId)}>
              Study in workspace
            </Button>
          )}
          {onEditSettings && (
            <Button size="sm" variant="secondary" onClick={onEditSettings}>
              Edit deck & settings
            </Button>
          )}
          {onBackToHome && (
            <Button size="sm" variant="secondary" onClick={onBackToHome}>
              Back to Trivia Home
            </Button>
          )}
        </div>
      </div>

      {isExpanded && algorithm && (
        <div
          id="problem-description-details"
          data-testid="problem-description-details"
          className="flex flex-col gap-4 pt-4 border-t border-[var(--border-default)]"
        >
          <section>
            <FieldLabel label="Problem" />
            <Well className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-xl p-5 shadow-inner text-[var(--text-secondary)]">
              <MarkdownRenderer content={algorithm.description} />
            </Well>
          </section>

          {algorithm.constraints && algorithm.constraints.length > 0 && (
            <section>
              <FieldLabel label="Constraints" />
              <Well className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-xl p-5 shadow-inner text-[var(--text-secondary)]">
                <ul className="m-0 pl-4 font-mono text-sm leading-relaxed text-[var(--text-secondary)]">
                  {algorithm.constraints.map((constraint, idx) => (
                    <li key={`constraint-${idx}`}>{constraint}</li>
                  ))}
                </ul>
              </Well>
            </section>
          )}
        </div>
      )}
    </header>
  );
};
