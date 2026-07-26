import React from 'react';
import { Brain, Play, Plus, RotateCcw } from 'lucide-react';
import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from '../../types/trivia';
import { Badge, Button, Card } from '../../ui';

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

export interface TriviaHeaderCardProps {
  activeSession: TriviaSessionRecord | null;
  level: number;
  config: TriviaConfig;
  progress: TriviaProgress;
  sourcesCount: number;
  coverage: number;
  showSetup: boolean;
  isDeckEmpty: boolean;
  onToggleSetup: () => void;
  onCreateNewSession: () => void;
  onOpenReset: () => void;
}

export function TriviaHeaderCard({
  activeSession,
  level,
  config,
  progress,
  sourcesCount,
  coverage,
  showSetup,
  isDeckEmpty,
  onToggleSetup,
  onCreateNewSession,
  onOpenReset,
}: TriviaHeaderCardProps) {
  return (
    <Card
      style={PANEL_BORDER}
      icon={<Brain aria-hidden="true" style={{ width: 22, height: 22, color: 'var(--accent)' }} />}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {activeSession ? activeSession.name : 'Trivia'}
          </span>
          {activeSession && (
            <Badge variant={activeSession.status === 'paused' ? 'warning' : 'success'} size="sm">
              {activeSession.status}
            </Badge>
          )}
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

          {/* Master Primary Action: Start / Resume / Edit Deck */}
          <Button
            variant="primary"
            size="md"
            icon={<Play aria-hidden="true" />}
            disabled={isDeckEmpty}
            onClick={onToggleSetup}
          >
            {showSetup ? 'Start drilling' : 'Edit deck'}
          </Button>

          <Button
            size="md"
            variant="secondary"
            icon={<Plus aria-hidden="true" />}
            onClick={onCreateNewSession}
          >
            New session
          </Button>

          <Button
            size="md"
            variant="danger"
            icon={<RotateCcw aria-hidden="true" />}
            onClick={onOpenReset}
          >
            Reset progress
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
