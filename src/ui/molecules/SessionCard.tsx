import React from "react";
import { Check as CheckIcon, Edit2, Trash2 } from "lucide-react";
import type { TriviaSessionRecord } from "../../types/trivia";
import { Badge, Button, ButtonGroup, Card, IconButton, Input, BadgeVariant } from "../index";

export interface SessionStats {
  level: number;
  maxBlanks: number;
  rounds: number;
  coveragePct: number;
}

export const badgeForSession = (
  session: TriviaSessionRecord,
): { label: string; variant: BadgeVariant } => {
  if (session.progress.completed) return { label: "Deck complete", variant: "success" };
  const hasProgress =
    session.progress.roundsPlayed > 0 || Object.keys(session.progress.drilled).length > 0;
  if (!hasProgress) return { label: "New", variant: "info" };
  return session.lastScreen === "setup"
    ? { label: "Paused · Setup", variant: "neutral" }
    : { label: "Paused · Drilling", variant: "neutral" };
};

export interface SessionCardProps {
  session: TriviaSessionRecord;
  stats?: SessionStats;
  isEditing: boolean;
  editingName: string;
  onStartRename: (session: TriviaSessionRecord) => void;
  onSaveRename: (id: string) => void;
  onCancelRename: () => void;
  onEditingNameChange: (name: string) => void;
  onResumeSession: (session: TriviaSessionRecord) => void;
  onPendingDelete: (id: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  stats,
  isEditing,
  editingName,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onEditingNameChange,
  onResumeSession,
  onPendingDelete,
}) => {
  const badge = badgeForSession(session);

  return (
    <Card className="p-6 md:p-8 border-[var(--border-default)] shadow-sm">
      <Card.Header
        title={
          isEditing ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                size="sm"
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveRename(session.id);
                  if (e.key === "Escape") onCancelRename();
                }}
                aria-label={`Rename ${session.name}`}
              />
              <IconButton
                size="sm"
                variant="secondary"
                icon={<CheckIcon size={14} />}
                onClick={() => onSaveRename(session.id)}
                aria-label="Save session name"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="font-semibold text-base text-[var(--text-primary)] truncate">
                {session.name}
              </span>
              <Badge variant={badge.variant} size="sm">
                {badge.label}
              </Badge>
            </div>
          )
        }
      />
      <Card.Body className="flex flex-col gap-3">
        {stats && (
          <div className="text-xs text-[var(--text-muted)] font-medium">
            {`Level ${stats.level} of ${stats.maxBlanks} · ${stats.rounds} ${stats.rounds === 1 ? "round" : "rounds"} · ${stats.coveragePct}% covered`}
          </div>
        )}

        <ButtonGroup gap="sm" className="flex-wrap pt-1">
          <Button
            size="sm"
            variant="primary"
            className="min-h-[44px]"
            onClick={() => onResumeSession(session)}
            title={stats ? `Resumes at Level ${stats.level} with a new round` : undefined}
          >
            Resume
          </Button>
          <IconButton
            size="sm"
            variant="secondary"
            className="min-h-[44px]"
            icon={<Edit2 size={14} />}
            onClick={() => onStartRename(session)}
            aria-label={`Rename ${session.name}`}
          />
          <IconButton
            size="sm"
            variant="secondary"
            className="min-h-[44px]"
            icon={<Trash2 size={14} />}
            onClick={() => onPendingDelete(session.id)}
            aria-label={`Delete ${session.name}`}
          />
        </ButtonGroup>
      </Card.Body>
    </Card>
  );
};
