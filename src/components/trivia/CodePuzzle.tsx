import { useState } from 'react';
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

/* The drag payload is the tile id. `text/plain` is the only format every browser
   and jsdom agree on, and a drag that arrives empty falls back to the held tile,
   so the drop route ends up in exactly the same placement call a click makes. */
export const TILE_MIME = 'text/plain';

type SlotState = 'empty' | 'filled' | 'correct' | 'incorrect';

interface SlotSkin {
  border: string;
  borderStyle: 'solid' | 'dashed';
  background: string;
  color: string;
}

/* Colour is meaning only: the graded edges are --success/--danger, everything
   else is neutral chrome on the darkest fill (DESIGN.md R7.1, R8.4). */
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

/* The Input's field takes its family from --font-ui and ui.css belongs to the UI
   library, so the code font is scoped through the token on the wrapper instead of
   restyling the field. */
const MONO_INPUT = { '--font-ui': 'var(--font-code)' } as CSSProperties;

export interface CodePuzzleProps {
  round: TriviaRound;
  mode: TriviaMode;
  /** Line number -> the text currently occupying that blank (tile, typed text or revealed truth). */
  filled: Readonly<Record<number, string>>;
  /** Blanks the learner gave up on: shown complete, never credited. */
  revealed?: readonly number[];
  /** Null until the round has been checked. */
  grade?: TriviaGrade | null;
  /** True while a tile is held, so empty slots can advertise themselves as targets. */
  hasSelection?: boolean;
  /** Click/keyboard route: place the held tile, or take back the tile already there. */
  onSlotActivate: (line: number) => void;
  /** Native-DnD route into the same placement call. */
  onTileDrop: (line: number, tileId: string) => void;
  onTypeAnswer: (line: number, text: string) => void;
  onReveal: (line: number) => void;
  hints?: TriviaMeta['hints'];
}

/**
 * The solution as a puzzle board: visible lines read as code, hidden lines become
 * slots. Indentation is printed as a fixed prefix in front of every slot because
 * the engine grades content only — retyping leading spaces would test typing.
 */
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
  hints,
}: CodePuzzleProps) {
  const [openHints, setOpenHints] = useState<readonly number[]>([]);
  const blanks = new Set(round.blanks);
  const graded = grade !== null;

  const filledCount = round.blanks.filter((line) => (filled[line] ?? '').trim().length > 0).length;

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
    // A drop target that does not cancel dragover is refused by the browser.
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
      current.includes(line) ? current.filter((n) => n !== line) : [...current, line],
    );
  };

  const hintFor = (line: number): string | undefined =>
    hints?.find((entry) => entry.line === line)?.hint;

  const truthFor = (line: number): string =>
    round.lines.find((candidate) => candidate.number === line)?.content ?? '';

  const renderSlot = (line: number) => {
    const state = slotState(line);
    const text = filled[line] ?? '';
    const isRevealed = revealed.includes(line);
    const typing = mode === 'type' && !graded && !isRevealed;

    if (typing) {
      return (
        <Input
          size="sm"
          aria-label={`Line ${line} — type the missing line`}
          placeholder="type the line"
          value={text}
          onChange={(event) => onTypeAnswer(line, event.target.value)}
          style={{ ...MONO_INPUT, flex: '1 1 auto', minWidth: 0 }}
        />
      );
    }

    const skin = SLOT_SKIN[state];
    /* An empty slot brightens its edge while a tile is held: the board tells you
       where the piece can go before you commit to it. */
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
          {text.length > 0 ? text : mode === 'choice' ? 'drop a line here' : 'type the line'}
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
          {/* The indent is scenery, never an answer, so it is not announced. */}
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
              aria-label={`Hint for line ${number}`}
              onClick={() => toggleHint(number)}
            />
          ) : null}
          {/* Reveal sits on the row it uncovers: at level 3 a single global reveal
              cannot say which blank it means. */}
          <IconButton
            icon={<Eye />}
            variant="ghost"
            size="sm"
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
              color: 'var(--success)',
            }}
          >
            {truthFor(number)}
          </div>
        ) : null}
      </div>
    );
  };

  const renderCodeRow = (line: PuzzleLine) => (
    <div key={line.number} className="ui-code-line" data-testid={`code-row-${line.number}`}>
      <span style={GUTTER}>{line.number}</span>
      {line.text}
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
          blanks.has(line.number) ? renderBlankRow(line) : renderCodeRow(line),
        )}
      </div>
    </Card>
  );
}
