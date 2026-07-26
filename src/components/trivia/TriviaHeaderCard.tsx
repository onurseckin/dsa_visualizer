import React, { useState } from 'react';
import { Brain, Check as CheckIcon, Edit2, Play, X as CancelIcon } from 'lucide-react';
import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from '../../types/trivia';
import { Badge, Button, Card, Input } from '../../ui';

const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  lineHeight: 1.5,
};

const barTrackStyle: React.CSSProperties = {
  height: 'var(--space-2-5)',
  borderRadius: 'var(--radius-full)',
  background: 'var(--bg-inset)',
  border: '1px solid var(--border-default)',
  overflow: 'hidden',
};

/* Only ever mounted while setup is showing (see routes/trivia.tsx) — drill mode
   has its own header on TriviaSession, so there is no "showSetup" branch left
   to carry here and exactly one action: entering the drill. */
export interface TriviaHeaderCardProps {
  activeSession: TriviaSessionRecord;
  level: number;
  config: TriviaConfig;
  progress: TriviaProgress;
  sourcesCount: number;
  coverage: number;
  isDeckEmpty: boolean;
  onStartDrilling: () => void;
  onRenameSession?: (id: string, newName: string) => void;
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
  onRenameSession,
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

  return (
    <Card
      style={PANEL_BORDER}
      icon={<Brain aria-hidden="true" style={{ width: 22, height: 22, color: 'var(--accent)' }} />}
      title={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {/* The one-word answer to "am I editing an existing session or
              building a new one?" — always visible, never just implied by
              the name/badge next to it. */}
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Now editing session
          </span>
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
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<CheckIcon size={14} />}
                  onClick={handleSaveRename}
                  aria-label="Save session name"
                />
                <Button
                  size="sm"
                  variant="ghost"
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
                  <Button
                    size="sm"
                    variant="ghost"
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div
          role="progressbar"
          aria-label="Deck coverage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={coverage}
          aria-valuetext={`${coverage}% of the deck drilled`}
          style={barTrackStyle}
        >
          <div
            style={{
              width: `${coverage}%`,
              height: '100%',
              background: 'var(--accent)',
              transition: 'width var(--transition-normal)',
            }}
          />
        </div>
        <span style={hintStyle}>
          {`${coverage}% of the deck drilled at levels ${config.minBlanks}–${config.maxBlanks} · `}
          {isDeckEmpty
            ? 'the deck is empty'
            : `${sourcesCount} algorithm${sourcesCount === 1 ? '' : 's'} in the deck`}
          {`. Level ${level} hides ${level} line${level === 1 ? '' : 's'} at a time and only advances once every line has been met at it.`}
        </span>
      </div>
    </Card>
  );
}
