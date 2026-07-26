import React, { useState } from 'react';
import { Brain, Check as CheckIcon, Edit2, Home, Play, X as CancelIcon } from 'lucide-react';
import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from '../../types/trivia';
import { Badge, Button, Card, IconButton, Input } from '../../ui';
import { TriviaSettings } from './TriviaSettings';

const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

/* Only ever mounted while setup is showing (see routes/trivia.tsx) — drill mode
   has its own header on TriviaSession, so there is no "showSetup" branch left
   to carry here and exactly one action: entering the drill.

   The session identity (title/rename/status) and the drill settings used to be
   two separate stacked cards. The user asked for them to be united under one
   section, so this Card's body is now TriviaSettings — one boundary instead of
   two, and the deck-lines/blanks-count badges that used to live on
   TriviaSettings' own header now sit in this Card's single actions row. */
export interface TriviaHeaderCardProps {
  activeSession: TriviaSessionRecord;
  level: number;
  config: TriviaConfig;
  progress: TriviaProgress;
  sourcesCount: number;
  coverage: number;
  isDeckEmpty: boolean;
  onStartDrilling: () => void;
  /** Round-3 IA fix (TASKS.md 9.1): the exit this screen actually needs — a
      real, unambiguous return to Home, replacing the old top-bar "Sessions ·
      name" button that never made clear whether you were on a main page or
      still editing a session. */
  onBackToHome: () => void;
  onRenameSession?: (id: string, newName: string) => void;
  /** Blankable-line count of every algorithm in the deck — drives the "Deck
      lines" badge below and TriviaSettings' own short-algorithm warning. */
  deckLineCounts: readonly number[];
  /** Drill settings patch handler, threaded straight through to TriviaSettings. */
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
  const [titleInput, setTitleInput] = useState('');

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

  // This screen is only ever the deck/settings editor for one session (see
  // routes/trivia.tsx), so "Active" here would be a lie — the drill isn't
  // running while this is on screen. What actually matters to the person
  // looking at it is whether there is earned progress underneath: a session
  // with none is safe to treat as a blank slate, one with some is a resume,
  // not a fresh start, no matter what its stored `status` says.
  const hasProgress =
    activeSession.progress.roundsPlayed > 0 ||
    Object.keys(activeSession.progress.drilled).length > 0;

  const hasDeckLines = deckLineCounts.length > 0;
  const deckLinesLabel = hasDeckLines
    ? `Deck lines: ${Math.min(...deckLineCounts)}–${Math.max(...deckLineCounts)}`
    : 'Deck lines: —';
  const { minBlanks, maxBlanks } = config;
  const blanksLabel =
    minBlanks === maxBlanks
      ? `${minBlanks} blank${minBlanks === 1 ? '' : 's'}`
      : `${minBlanks}–${maxBlanks} blanks`;

  return (
    <Card
      style={PANEL_BORDER}
      icon={<Brain aria-hidden="true" style={{ width: 22, height: 22, color: 'var(--accent)' }} />}
      title={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {isEditingTitle ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <Input
                  size="sm"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setIsEditingTitle(false);
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
                <span
                  style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}
                >
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
                <Badge variant={hasProgress ? 'warning' : 'info'} size="sm">
                  {hasProgress ? 'Paused · progress saved' : 'New session'}
                </Badge>
              </>
            )}
          </div>
        </div>
      }
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Badge variant="info" size="md" style={PANEL_BORDER}>
            Level {level} of {config.maxBlanks}
          </Badge>
          <Badge variant="neutral" size="md" style={PANEL_BORDER}>
            {progress.roundsPlayed} {progress.roundsPlayed === 1 ? 'round' : 'rounds'}
          </Badge>
          <Badge variant="accent" size="md" style={PANEL_BORDER}>
            {sourcesCount} {sourcesCount === 1 ? 'algorithm' : 'algorithms'}
          </Badge>
          <Badge variant={coverage >= 100 ? 'success' : 'neutral'} size="md" style={PANEL_BORDER}>
            {coverage}% covered
          </Badge>
          <Badge variant="neutral" size="md" style={PANEL_BORDER}>
            {deckLinesLabel}
          </Badge>
          <Badge variant="neutral" size="md" style={PANEL_BORDER}>
            {blanksLabel}
          </Badge>

          {/* The unambiguous exit (TASKS.md 9.1): always visible, never
              buried behind a "Sessions" popover that left it unclear whether
              closing it meant leaving the session or just hiding a panel. */}
          <Button
            variant="secondary"
            size="md"
            icon={<Home aria-hidden="true" />}
            onClick={onBackToHome}
          >
            Back to Trivia Home
          </Button>

          {/* The one primary action this screen offers. */}
          <Button
            variant="primary"
            size="md"
            icon={<Play aria-hidden="true" />}
            disabled={isDeckEmpty}
            onClick={onStartDrilling}
          >
            Start drilling
          </Button>
        </div>
      }
    >
      <TriviaSettings config={config} onChange={onChangeSettings} deckLineCounts={deckLineCounts} />
    </Card>
  );
}
