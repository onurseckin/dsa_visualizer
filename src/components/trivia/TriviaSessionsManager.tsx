import React, { useMemo, useState } from 'react';
import { Brain, Check as CheckIcon, Edit2, Play, Plus, Trash2 } from 'lucide-react';
import type { PuzzleLine, TriviaSessionRecord } from '../../types/trivia';
import { Badge, Button, Card, ConfirmDialog, IconButton, Input } from '../../ui';
import type { BadgeVariant } from '../../ui';
import { coverageRatio, parsePuzzleLines } from '../../trivia/triviaEngine';
import { getAlgorithm } from '../../algorithms/registry';

/* Round-3 IA fix (TASKS.md 9.1): this is no longer a Drawer popover — it IS
   the trivia Home screen, rendered on-page whenever `activeSessionId` is
   null. That is the actual fix for "am I at the main page of trivia, or
   editing the latest session?" — a real third screen with its own
   permanent space, not a panel that can be closed to leave you wondering
   what is now showing behind it. */
export interface TriviaSessionsManagerProps {
  sessions: TriviaSessionRecord[];
  onCreateNewSession: () => void;
  /** Sets the session active and lands on whichever screen its own
      `lastScreen` says — Home never second-guesses that pointer. */
  onResumeSession: (session: TriviaSessionRecord) => void;
  onRenameSession: (id: string, newName: string) => void;
  /** Delete lives only here (TASKS.md 9.1) — never reachable from inside
      Setup or Drill, so there is no "delete the session I'm standing in"
      case to design around. */
  onDeleteSession: (id: string) => void;
}

/** What every card's status badge says: distinguishes a session that has
    never been drilled from one genuinely paused on each of the two screens
    from one that has covered its whole configured range — exactly the
    states the Round-3 spec calls out (`New` / `Paused · Setup` /
    `Paused · Drilling` / `Deck complete`), never a raw "Active"/"Paused"
    that does not say which screen. */
const badgeFor = (session: TriviaSessionRecord): { label: string; variant: BadgeVariant } => {
  if (session.progress.completed) return { label: 'Deck complete', variant: 'success' };
  const hasProgress =
    session.progress.roundsPlayed > 0 || Object.keys(session.progress.drilled).length > 0;
  if (!hasProgress) return { label: 'New', variant: 'info' };
  return session.lastScreen === 'setup'
    ? { label: 'Paused · Setup', variant: 'neutral' }
    : { label: 'Paused · Drilling', variant: 'neutral' };
};

interface SessionStats {
  level: number;
  maxBlanks: number;
  rounds: number;
  coveragePct: number;
}

const statsFor = (session: TriviaSessionRecord): SessionStats => {
  const sources = new Map<string, PuzzleLine[]>();
  session.config.deck.forEach((id) => {
    const algorithm = getAlgorithm(id);
    if (algorithm === undefined) return;
    sources.set(id, parsePuzzleLines(algorithm.code, algorithm.trivia));
  });
  const coveragePct = Math.round(coverageRatio(session.progress, sources, session.config) * 100);
  return {
    level: session.progress.level,
    maxBlanks: session.config.maxBlanks,
    rounds: session.progress.roundsPlayed,
    coveragePct,
  };
};

const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const pageHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  flexWrap: 'wrap',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

/* Anti-clutter (TASKS.md 9.1): a small, user-created set, not an auto-growing
   feed — the grid collapses to one column on a narrow viewport via minmax,
   and the list itself scrolls rather than paginating. */
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 'var(--space-4)',
  alignItems: 'start',
  overflowY: 'auto',
  minHeight: 0,
};

const cardNameRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
};

const cardStatsRowStyle: React.CSSProperties = {
  marginTop: 'var(--space-2)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
};

const cardActionsRowStyle: React.CSSProperties = {
  marginTop: 'var(--space-3)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
};

const emptyStateStyle: React.CSSProperties = {
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-4)',
  padding: 'var(--space-8) var(--space-4)',
  textAlign: 'center',
};

export function TriviaSessionsManager({
  sessions,
  onCreateNewSession,
  onResumeSession,
  onRenameSession,
  onDeleteSession,
}: TriviaSessionsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, SessionStats>();
    sessions.forEach((session) => map.set(session.id, statsFor(session)));
    return map;
  }, [sessions]);

  const pendingDeleteSession = sessions.find((s) => s.id === pendingDeleteId) ?? null;

  const handleStartRename = (session: TriviaSessionRecord) => {
    setEditingId(session.id);
    setEditingName(session.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim().length > 0) onRenameSession(id, editingName.trim());
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId !== null) onDeleteSession(pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minHeight: 0 }}>
      <div style={pageHeaderStyle}>
        <h1 style={titleStyle}>Trivia</h1>
        <Button
          variant="primary"
          icon={<Plus aria-hidden="true" />}
          onClick={onCreateNewSession}
        >
          New session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div style={emptyStateStyle}>
          <Brain aria-hidden="true" style={{ width: 40, height: 40, color: 'var(--accent)' }} />
          <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Build your first trivia deck
          </p>
          <Button
            variant="primary"
            icon={<Plus aria-hidden="true" />}
            onClick={onCreateNewSession}
          >
            New session
          </Button>
        </div>
      ) : (
        <div style={gridStyle}>
          {sessions.map((session) => {
            const isEditing = editingId === session.id;
            const badge = badgeFor(session);
            const s = stats.get(session.id);

            return (
              <Card key={session.id} style={PANEL_BORDER}>
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <Input
                      size="sm"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(session.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      aria-label={`Rename ${session.name}`}
                    />
                    <IconButton
                      size="sm"
                      variant="secondary"
                      icon={<CheckIcon size={14} />}
                      onClick={() => handleSaveRename(session.id)}
                      aria-label="Save session name"
                    />
                  </div>
                ) : (
                  <div style={cardNameRowStyle}>
                    <span
                      style={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                        fontSize: 'var(--text-md)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {session.name}
                    </span>
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                  </div>
                )}

                {s && (
                  <div style={cardStatsRowStyle}>
                    {`Level ${s.level} of ${s.maxBlanks} · ${s.rounds} ${s.rounds === 1 ? 'round' : 'rounds'} · ${s.coveragePct}% covered`}
                  </div>
                )}

                <div style={cardActionsRowStyle}>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Play aria-hidden="true" />}
                    onClick={() => onResumeSession(session)}
                    /* Resume never claims to restore the exact in-progress
                       blanks (round state is never persisted) — it always
                       regenerates a fresh round at the session's saved
                       level, so the copy never overpromises. */
                    title={s ? `Resumes at Level ${s.level} with a new round` : undefined}
                  >
                    Resume
                  </Button>
                  <IconButton
                    size="sm"
                    variant="secondary"
                    icon={<Edit2 size={14} />}
                    onClick={() => handleStartRename(session)}
                    aria-label={`Rename ${session.name}`}
                  />
                  {/* Unlike the old drawer, deleting the last remaining
                      session is allowed: zero sessions is now a legitimate,
                      permanent state (Home's own empty state), not something
                      to guard against (TASKS.md 9.1). */}
                  <IconButton
                    size="sm"
                    variant="secondary"
                    icon={<Trash2 size={14} />}
                    onClick={() => setPendingDeleteId(session.id)}
                    aria-label={`Delete ${session.name}`}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDeleteSession !== null}
        title="Delete this session?"
        message={
          pendingDeleteSession
            ? `"${pendingDeleteSession.name}" and every line it has drilled will be deleted. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete session"
        cancelLabel="Keep it"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
