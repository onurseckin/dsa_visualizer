import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { Check, Eye, Lightbulb, X } from 'lucide-react';
import { Button, Card, IconButton, Input } from '../../ui';
import type {
  PuzzleLine,
  TriviaGrade,
  TriviaMeta,
  TriviaMode,
  TriviaRound,
} from '../../types/trivia';
import { highlightPythonLine } from '../primitives/CodeBlockViewer';

export const TILE_MIME = 'text/plain';

type SlotState = 'empty' | 'filled' | 'correct' | 'incorrect';

interface SlotSkin {
  border: string;
  borderStyle: 'solid' | 'dashed';
  background: string;
  color: string;
}

const SLOT_SKIN: Record<SlotState, SlotSkin> = {
  empty: {
    border: 'var(--border-strong)',
    borderStyle: 'dashed',
    background: 'var(--bg-inset)',
    color: 'var(--text-faint)',
  },
  filled: {
    border: 'var(--border-default)',
    borderStyle: 'solid',
    background: 'var(--bg-inset)',
    color: 'var(--text-primary)',
  },
  correct: {
    border: 'var(--success)',
    borderStyle: 'solid',
    background: 'var(--success-soft)',
    color: 'var(--text-primary)',
  },
  incorrect: {
    border: 'var(--danger)',
    borderStyle: 'solid',
    background: 'var(--danger-soft)',
    color: 'var(--text-primary)',
  },
};

const GUTTER: CSSProperties = {
  display: 'inline-block',
  width: '2.5em',
  flexShrink: 0,
  textAlign: 'right',
  marginRight: 'var(--space-2)',
  color: 'var(--text-muted)',
  userSelect: 'none',
};

const INDENT: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-code)',
  fontSize: 'var(--text-sm)',
  whiteSpace: 'pre',
  color: 'var(--text-faint)',
};

const MONO_INPUT = { '--font-ui': 'var(--font-code)' } as CSSProperties;

export interface CodePuzzleProps {
  round: TriviaRound;
  mode: TriviaMode;
  filled: Readonly<Record<number, string>>;
  revealed?: readonly number[];
  grade?: TriviaGrade | null;
  hasSelection?: boolean;
  onSlotActivate: (line: number) => void;
  onTileDrop: (line: number, tileId: string) => void;
  onTypeAnswer: (line: number, text: string) => void;
  onReveal: (line: number) => void;
  onSubmit?: () => void;
  onRetry?: () => void;
  hints?: TriviaMeta['hints'];
}

export function CodePuzzle({
  round,
  mode,
  filled,
  revealed = [],
  grade = null,
  hasSelection = false,
  onSlotActivate,
  onTileDrop,
  onTypeAnswer,
  onReveal,
  onSubmit,
  onRetry,
  hints,
}: CodePuzzleProps) {
  const [openHints, setOpenHints] = useState<readonly number[]>([]);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const blanks = new Set(round.blanks);
  const graded = grade !== null;

  const filledCount = round.blanks.filter((line) => (filled[line] ?? '').trim().length > 0).length;

  // Auto-focus the first blank input when in type-from-memory mode
  useEffect(() => {
    if (mode !== 'type' || graded || round.blanks.length === 0) return;
    const firstLine = round.blanks[0];
    const timer = setTimeout(() => {
      inputRefs.current.get(firstLine)?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [round, mode, graded]);

  const slotState = (line: number): SlotState => {
    if (grade !== null) return grade.perBlank[line] ? 'correct' : 'incorrect';
    return (filled[line] ?? '').length > 0 ? 'filled' : 'empty';
  };

  const slotLabel = (line: number): string => {
    const text = filled[line] ?? '';
    const content = text.length > 0 ? `"${text}"` : 'empty';
    const isRevealed = revealed.includes(line);
    const state = slotState(line);
    if (state === 'correct') return `Line ${line} ${content} — correct`;
    if (state === 'incorrect') {
      return `Line ${line} ${content} — ${isRevealed ? 'revealed, not credited' : 'incorrect'}`;
    }
    if (isRevealed) return `Line ${line} ${content} — revealed, not credited`;
    if (state === 'filled') return `Line ${line} ${content} — filled, activate to take the line back`;
    return mode === 'choice'
      ? `Line ${line} empty — activate to drop a line here`
      : `Line ${line} empty — type the line`;
  };

  const allowDrop = (event: DragEvent<HTMLButtonElement>): void => {
    if (graded) return;
    event.preventDefault();
  };

  const handleDrop = (line: number) => (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    if (graded) return;
    const transfer = event.dataTransfer;
    const tileId = transfer ? transfer.getData(TILE_MIME) : '';
    if (tileId.length > 0) {
      onTileDrop(line, tileId);
      return;
    }
    onSlotActivate(line);
  };

  const toggleHint = (line: number): void => {
    setOpenHints((current) =>
      current.includes(line) ? current.filter((n) => n !== line) : [...current, line]
    );
  };

  const hintFor = (line: number): string | undefined =>
    hints?.find((entry) => entry.line === line)?.hint;

  const truthFor = (line: number): string =>
    round.lines.find((candidate) => candidate.number === line)?.content ?? '';

  const handleInputKeyDown = (line: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit?.();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      onRetry?.();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === 'h' || event.key.toLowerCase() === 'i')) {
      event.preventDefault();
      toggleHint(line);
      return;
    }
  };

  const renderSlot = (line: number) => {
    const state = slotState(line);
    const text = filled[line] ?? '';
    const isRevealed = revealed.includes(line);
    const typing = mode === 'type' && !graded && !isRevealed;

    if (typing) {
      return (
        <Input
          size="sm"
          ref={(el) => {
            if (el) inputRefs.current.set(line, el);
            else inputRefs.current.delete(line);
          }}
          aria-label={`Line ${line} — type the missing line`}
          placeholder="type the line"
          value={text}
          onChange={(event) => onTypeAnswer(line, event.target.value)}
          onKeyDown={(event) => handleInputKeyDown(line, event)}
          style={{ ...MONO_INPUT, flex: '1 1 auto', minWidth: 0 }}
        />
      );
    }

    const skin = SLOT_SKIN[state];
    const edge = state === 'empty' && hasSelection ? 'var(--border-accent)' : skin.border;

    return (
      <Button
        size="sm"
        data-state={state}
        aria-label={slotLabel(line)}
        aria-pressed={text.length > 0}
        disabled={graded}
        onClick={() => onSlotActivate(line)}
        onDragOver={allowDrop}
        onDragEnter={allowDrop}
        onDrop={handleDrop(line)}
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          justifyContent: 'flex-start',
          fontFamily: 'var(--font-code)',
          fontSize: 'var(--text-sm)',
          fontWeight: 400,
          borderStyle: skin.borderStyle,
          borderColor: edge,
          background: skin.background,
          color: skin.color,
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'pre',
          }}
        >
          {text.length > 0 ? (
            highlightPythonLine(text)
          ) : (
            <span style={{ color: skin.color }}>
              {mode === 'choice' ? 'drop a line here' : 'type the line'}
            </span>
          )}
        </span>
        {state === 'correct' || state === 'incorrect' ? (
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              marginLeft: 'auto',
              color: state === 'correct' ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {state === 'correct' ? <Check size={14} /> : <X size={14} />}
          </span>
        ) : null}
      </Button>
    );
  };

  const renderBlankRow = (line: PuzzleLine) => {
    const number = line.number;
    const hint = hintFor(number);
    const showHint = openHints.includes(number);
    const wrong = grade !== null && !grade.perBlank[number];

    return (
      <div key={number} className="ui-code-line" data-testid={`blank-row-${number}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <span style={GUTTER}>{number}</span>
          <span aria-hidden="true" data-testid={`indent-${number}`} style={INDENT}>
            {line.indent}
          </span>
          {renderSlot(number)}
          {hint !== undefined ? (
            <IconButton
              icon={<Lightbulb />}
              variant="ghost"
              size="sm"
              selected={showHint}
              title="Toggle hint (⌘H)"
              aria-label={`Hint for line ${number}`}
              onClick={() => toggleHint(number)}
            />
          ) : null}
          <IconButton
            icon={<Eye />}
            variant="ghost"
            size="sm"
            title="Reveal answer"
            aria-label={`Reveal line ${number}`}
            disabled={graded || revealed.includes(number)}
            onClick={() => onReveal(number)}
          />
        </div>
        {showHint && hint !== undefined ? (
          <div
            data-testid={`hint-${number}`}
            style={{
              padding: 'var(--space-1) 0 0 3.5em',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              whiteSpace: 'normal',
              color: 'var(--text-muted)',
            }}
          >
            {hint}
          </div>
        ) : null}
        {wrong ? (
          <div
            data-testid={`expected-${number}`}
            style={{
              padding: 'var(--space-1) 0 0 3.5em',
              fontFamily: 'var(--font-code)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Expected:</span>
            {highlightPythonLine(truthFor(number))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderCodeRow = (line: PuzzleLine) => (
    <div key={line.number} className="ui-code-line" data-testid={`code-row-${line.number}`}>
      <span style={GUTTER}>{line.number}</span>
      {highlightPythonLine(line.text)}
    </div>
  );

  return (
    <Card
      padding="none"
      title={
        <span
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: 'var(--text-xs)',
            fontWeight: 400,
            color: 'var(--text-muted)',
          }}
        >
          solution.py
        </span>
      }
      actions={
        <span
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {filledCount}/{round.blanks.length} filled
        </span>
      }
      style={{ borderColor: 'var(--border-default)', minWidth: 0 }}
    >
      <div
        data-testid="code-puzzle-well"
        style={{
          minHeight: 0,
          overflow: 'auto',
          background: 'var(--bg-inset)',
          borderTop: '1px solid var(--border-default)',
          padding: 'var(--space-2) 0',
        }}
      >
        {round.lines.map((line) =>
          blanks.has(line.number) ? renderBlankRow(line) : renderCodeRow(line)
        )}
      </div>
    </Card>
  );
}
