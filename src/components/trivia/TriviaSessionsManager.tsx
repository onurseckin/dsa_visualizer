import { useMemo, useState } from "react";
import { Brain, Plus } from "lucide-react";
import type { PuzzleLine, TriviaSessionRecord } from "../../types/trivia";
import { Button, ConfirmDialog } from "../../ui";
import { coverageRatio, parsePuzzleLines } from "../../trivia/triviaEngine";
import { getAlgorithm } from "../../algorithms/registry";
import { SessionCard, SessionStats } from "./components/SessionCard";

export interface TriviaSessionsManagerProps {
  sessions: TriviaSessionRecord[];
  onCreateNewSession: () => void;
  onResumeSession: (session: TriviaSessionRecord) => void;
  onRenameSession: (id: string, newName: string) => void;
  onDeleteSession: (id: string) => void;
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

export function TriviaSessionsManager({
  sessions,
  onCreateNewSession,
  onResumeSession,
  onRenameSession,
  onDeleteSession,
}: TriviaSessionsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
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
    <div className="flex flex-col gap-5 min-h-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="m-0 text-xl font-bold text-[var(--text-primary)]">Trivia</h1>
        <Button variant="primary" icon={<Plus aria-hidden="true" />} onClick={onCreateNewSession}>
          New session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 px-4 text-center">
          <Brain aria-hidden="true" className="w-10 h-10 text-[var(--accent)]" />
          <p className="m-0 text-lg font-semibold text-[var(--text-primary)]">
            Build your first trivia deck
          </p>
          <Button variant="primary" icon={<Plus aria-hidden="true" />} onClick={onCreateNewSession}>
            New session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4 items-start overflow-y-auto min-h-0">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              stats={stats.get(session.id)}
              isEditing={editingId === session.id}
              editingName={editingName}
              onStartRename={handleStartRename}
              onSaveRename={handleSaveRename}
              onCancelRename={() => setEditingId(null)}
              onEditingNameChange={setEditingName}
              onResumeSession={onResumeSession}
              onPendingDelete={setPendingDeleteId}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDeleteSession !== null}
        title="Delete this session?"
        message={
          pendingDeleteSession
            ? `"${pendingDeleteSession.name}" and every line it has drilled will be deleted. This cannot be undone.`
            : ""
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
