import { useState } from "react";
import { Brain, Check as CheckIcon, Edit2, Home, Play, X as CancelIcon } from "lucide-react";
import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from "../../types/trivia";
import { Badge, Button, ButtonGroup, Card, IconButton, Input } from "../../ui";
import { TriviaSettings } from "./TriviaSettings";

export interface TriviaHeaderCardProps {
  activeSession: TriviaSessionRecord;
  level: number;
  config: TriviaConfig;
  progress: TriviaProgress;
  sourcesCount: number;
  coverage: number;
  isDeckEmpty: boolean;
  onStartDrilling: () => void;
  onBackToHome: () => void;
  onRenameSession?: (id: string, newName: string) => void;
  deckLineCounts: readonly number[];
  onChangeSettings: (patch: Partial<TriviaConfig>) => void;
}

export function TriviaHeaderCard({
  activeSession,
  level,
  config,
  progress,
  sourcesCount,
  coverage,
  isDeckEmpty,
  onStartDrilling,
  onBackToHome,
  onRenameSession,
  deckLineCounts,
  onChangeSettings,
}: TriviaHeaderCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const handleStartRename = () => {
    setTitleInput(activeSession.name);
    setIsEditingTitle(true);
  };

  const handleSaveRename = () => {
    if (onRenameSession && titleInput.trim().length > 0) {
      onRenameSession(activeSession.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const hasProgress =
    activeSession.progress.roundsPlayed > 0 ||
    Object.keys(activeSession.progress.drilled).length > 0;

  const hasDeckLines = deckLineCounts.length > 0;
  const deckLinesLabel = hasDeckLines
    ? `Deck lines: ${Math.min(...deckLineCounts)}–${Math.max(...deckLineCounts)}`
    : "Deck lines: —";
  const { minBlanks, maxBlanks } = config;
  const blanksLabel =
    minBlanks === maxBlanks
      ? `${minBlanks} blank${minBlanks === 1 ? "" : "s"}`
      : `${minBlanks}–${maxBlanks} blanks`;

  return (
    <Card
      className="border-[var(--border-default)]"
      icon={<Brain aria-hidden="true" className="w-[22px] h-[22px] text-[var(--accent)]" />}
      title={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <Input
                  size="sm"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  aria-label="Rename active session"
                />
                <IconButton
                  size="sm"
                  variant="secondary"
                  icon={<CheckIcon size={14} />}
                  onClick={handleSaveRename}
                  aria-label="Save session name"
                />
                <IconButton
                  size="sm"
                  variant="secondary"
                  icon={<CancelIcon size={14} />}
                  onClick={() => setIsEditingTitle(false)}
                  aria-label="Cancel rename"
                />
              </div>
            ) : (
              <>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {activeSession.name}
                </span>
                {onRenameSession && (
                  <IconButton
                    size="sm"
                    variant="secondary"
                    icon={<Edit2 size={14} />}
                    onClick={handleStartRename}
                    aria-label={`Rename ${activeSession.name}`}
                  />
                )}
                <Badge variant={hasProgress ? "warning" : "info"} size="sm">
                  {hasProgress ? "Paused · progress saved" : "New session"}
                </Badge>
              </>
            )}
          </div>
        </div>
      }
      actions={
        <ButtonGroup gap="sm" className="flex-wrap">
          <Badge variant="info" size="md" className="border-[var(--border-default)]">
            Level {level} of {config.maxBlanks}
          </Badge>
          <Badge variant="neutral" size="md" className="border-[var(--border-default)]">
            {progress.roundsPlayed} {progress.roundsPlayed === 1 ? "round" : "rounds"}
          </Badge>
          <Badge variant="accent" size="md" className="border-[var(--border-default)]">
            {sourcesCount} {sourcesCount === 1 ? "algorithm" : "algorithms"}
          </Badge>
          <Badge
            variant={coverage >= 100 ? "success" : "neutral"}
            size="md"
            className="border-[var(--border-default)]"
          >
            {coverage}% covered
          </Badge>
          <Badge variant="neutral" size="md" className="border-[var(--border-default)]">
            {deckLinesLabel}
          </Badge>
          <Badge variant="neutral" size="md" className="border-[var(--border-default)]">
            {blanksLabel}
          </Badge>

          <Button
            variant="secondary"
            size="md"
            icon={<Home aria-hidden="true" />}
            onClick={onBackToHome}
          >
            Back to Trivia Home
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<Play aria-hidden="true" />}
            disabled={isDeckEmpty}
            onClick={onStartDrilling}
          >
            Start drilling
          </Button>
        </ButtonGroup>
      }
    >
      <TriviaSettings config={config} onChange={onChangeSettings} deckLineCounts={deckLineCounts} />
    </Card>
  );
}
