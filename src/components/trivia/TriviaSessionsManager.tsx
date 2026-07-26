import { useState } from 'react';
import { Check as CheckIcon, Edit2, Plus, Trash2 } from 'lucide-react';
import type { TriviaSessionRecord } from '../../types/trivia';
import { Badge, Button, Drawer, IconButton, Input } from '../../ui';
import type { BadgeVariant } from '../../ui';

/** What every row's second badge says: distinguishes a session that has
    never been drilled from one that is genuinely paused mid-progress from
    one that has covered its whole configured range — the three states a
    user switching between sessions actually needs to tell apart at a
    glance, none of which "N algos" communicates on its own. */
const summaryFor = (s: TriviaSessionRecord): { label: string; variant: BadgeVariant } => {
  if (s.progress.completed) return { label: 'Deck complete', variant: 'success' };
  const hasProgress = s.progress.roundsPlayed > 0 || Object.keys(s.progress.drilled).length > 0;
  if (!hasProgress) return { label: 'New', variant: 'info' };
  const rounds = s.progress.roundsPlayed;
  return { label: `Level ${s.progress.level} · ${rounds} ${rounds === 1 ? 'round' : 'rounds'}`, variant: 'neutral' };
};

/* A popover, not a permanent card: it needs zero vertical space in either
   setup or drill mode, so the whole session switcher — resume, rename,
   delete, create, and the destructive reset — lives behind one "Sessions"
   trigger in the page's slim top bar (see routes/trivia.tsx). Drawer is the
   one overlay primitive the design system already has for exactly this
   shape (see QuickAccessDrawer), so it is reused rather than a bespoke
   anchored dropdown. */
export interface TriviaSessionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: TriviaSessionRecord[];
  activeId: string;
  onSelectSession: (session: TriviaSessionRecord) => void;
  onRenameSession: (id: string, newName: string) => void;
  onDeleteSession: (id: string) => void;
  onCreateNewSession: () => void;
  onOpenReset: () => void;
  /** The active session has something worth wiping — gates the footer action. */
  canReset: boolean;
}

export function TriviaSessionsManager({
  isOpen,
  onClose,
  sessions,
  activeId,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onCreateNewSession,
  onOpenReset,
  canReset,
}: TriviaSessionsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // The page never has a "no session selected" state, so the last session
  // standing cannot be deleted out from under it.
  const canDelete = sessions.length > 1;

  const handleStartRename = (s: TriviaSessionRecord) => {
    setEditingId(s.id);
    setEditingName(s.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim().length > 0) {
      onRenameSession(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Sessions"
      width={380}
      footer={
        canReset ? (
          <Button size="sm" variant="danger" fullWidth onClick={onOpenReset}>
            Reset progress
          </Button>
        ) : undefined
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {sessions.map((s) => {
          const isCurrent = s.id === activeId;
          const isEditing = editingId === s.id;
          const summary = summaryFor(s);
          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: isCurrent ? 'var(--bg-inset)' : 'transparent',
                border: `1px solid ${isCurrent ? 'var(--border-accent)' : 'var(--border-default)'}`,
              }}
            >
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Input
                    size="sm"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(s.id);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<CheckIcon size={14} />}
                    onClick={() => handleSaveRename(s.id)}
                    aria-label="Save session name"
                  />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span
                      style={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: isCurrent ? 600 : 400,
                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {s.name}
                    </span>
                    {/* Unambiguous even without comparing borders/backgrounds
                        against the other rows: this is the one you would
                        land back on if you closed the drawer right now. */}
                    {isCurrent && (
                      <Badge variant="accent" size="sm">
                        Editing now
                      </Badge>
                    )}
                    {!isCurrent && (
                      <Button size="sm" variant="secondary" onClick={() => onSelectSession(s)}>
                        Resume
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Edit2 size={14} />}
                      onClick={() => handleStartRename(s)}
                      aria-label={`Rename ${s.name}`}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 size={14} />}
                      onClick={() => onDeleteSession(s.id)}
                      disabled={!canDelete}
                      aria-label={`Delete ${s.name}`}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <Badge variant="neutral" size="sm">
                      {s.config.deck.length} {s.config.deck.length === 1 ? 'algo' : 'algos'}
                    </Badge>
                    {/* Exactly what "switch back and confirm nothing was
                        lost" needs to see without opening the session:
                        its own level and round count, not the deck's. */}
                    <Badge variant={summary.variant} size="sm">
                      {summary.label}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <div
          style={{
            display: 'flex',
            paddingTop: 'var(--space-2)',
            marginTop: 'var(--space-1)',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <IconButton
            icon={<Plus aria-hidden="true" />}
            variant="secondary"
            aria-label="New session"
            onClick={onCreateNewSession}
          />
        </div>
      </div>
    </Drawer>
  );
}
