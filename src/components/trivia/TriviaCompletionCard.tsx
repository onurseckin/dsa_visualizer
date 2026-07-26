import React from 'react';
import { Trophy } from 'lucide-react';
import { Badge, Card } from '../../ui';

const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  lineHeight: 1.5,
};

export interface TriviaCompletionCardProps {
  sourcesCount: number;
  maxBlanks: number;
}

export function TriviaCompletionCard({ sourcesCount, maxBlanks }: TriviaCompletionCardProps) {
  return (
    <Card
      style={PANEL_BORDER}
      icon={<Trophy aria-hidden="true" />}
      title="Deck complete"
      actions={<Badge variant="success" size="md">Curriculum covered</Badge>}
    >
      <span style={hintStyle}>
        {`Every line of all ${sourcesCount} algorithm${sourcesCount === 1 ? '' : 's'} has been drilled at up to ${maxBlanks} blank${maxBlanks === 1 ? '' : 's'}. Raise the hardest level to keep going, add more algorithms, or reset progress to start the deck over.`}
      </span>
    </Card>
  );
}
