import React, { useState } from 'react';
import { Check as CheckIcon, Edit2, Trash2 } from 'lucide-react';
import type { TriviaSessionRecord } from '../../types/trivia';
import { Badge, Button, Card, Input } from '../../ui';

const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  lineHeight: 1.5,
};

export interface TriviaSessionsManagerProps {
  sessions: TriviaSessionRecord[];
  activeId: string | null;
  onSelectSession: (session: TriviaSessionRecord) => void;
  onRenameSession: (id: string, newName: string) => void;
  onDeleteSession: (id: string) => void;
}

export function TriviaSessionsManager({
  sessions,
  activeId,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
}: TriviaSessionsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  if (sessions.length === 0) return null;

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
    <Card style={PANEL_BORDER} title="Saved Trivia Sessions" padding="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={hintStyle}>
          Select a pending session to resume where you left off, or create new named trivia decks.
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {sessions.map((s) => {
            const isCurrent = s.id === activeId;
            const isEditing = editingId === s.id;
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
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
                    />
                  </div>
                ) : (
                  <>
                    <span
                      style={{
                        fontWeight: isCurrent ? 600 : 400,
                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {s.name}
                    </span>
                    <Badge size="sm" variant={s.status === 'paused' ? 'warning' : 'neutral'}>
                      {s.config.deck.length} algos
                    </Badge>
                    <Button
                      size="sm"
                      variant={isCurrent ? 'primary' : 'secondary'}
                      onClick={() => onSelectSession(s)}
                    >
                      {isCurrent ? 'Active' : 'Resume'}
                    </Button>
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
                      aria-label={`Delete ${s.name}`}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
