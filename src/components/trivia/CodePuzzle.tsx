import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { Check, Eye, Info, Lightbulb, X } from 'lucide-react';
import { Button, Card, IconButton, Input, Kbd } from '../../ui';
import type {
  PuzzleLine,
  TriviaGrade,
  TriviaMeta,
  TriviaMode,
  TriviaRound,
} from '../../types/trivia';
import { highlightPythonLine } from '../primitives/CodeBlockViewer';
import { CodeExplainToggle, LineExplainPopover, useHoveredCodeLine } from '../primitives/LineExplainPopover';
import type { HoveredLine } from '../primitives/LineExplainPopover';

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

/* Fix for TASKS.md 9.3 (blank-row alignment): the row used to be one flat
   `display:flex; flexWrap:wrap` parent with 6+ sibling items (gutter, indent,
   slot, shortcut Kbd, hint icon, info icon, eye icon), and the slot's
   `flex:'1 1 auto'` gives it a *hypothetical* (pre-shrink) width equal to its
   content — flex-wrap's line-breaking decision is made against that
   hypothetical size, not the post-minWidth:0-shrunk one, so a wide slot could
   force a break that landed anywhere among those 6+ siblings, including
   detaching gutter+indent from the input. Restructuring into exactly two
   flex children means only these two can ever separate, and each is
   `flexWrap:'nowrap'` internally so neither can break apart on its own. */
const CODE_GROUP: CSSProperties = {
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: 'var(--space-1)',
  flex: '1 1 auto',
  minWidth: 0,
};

const ICON_GROUP: CSSProperties = {
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: 'var(--space-1)',
  flexShrink: 0,
};

/* Pairs an IconButton with its own shortcut Kbd as one visual unit (TASKS.md
   9.4): the shortcut used to be a single badge floating elsewhere on the row,
   which is exactly what read as "something separate" from the Eye/Hint
   buttons it actually belongs to. Shown only on the current shortcut-target
   row (see activeShortcutLine) — not repeated on every row, which would be
   the same per-line-icon-repetition anti-pattern section 1 already removed. */
const SHORTCUT_PAIR: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
};

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
  /** Bare Enter, from a focused blank input, submits the round. ⌘R/⌘E/⌘H are
      deliberately NOT accepted here — they are handled once, globally, by
      TriviaSession, so they work with nothing focused too (see its
      window-level keydown listener). */
  onSubmit?: () => void;
  hints?: TriviaMeta['hints'];
  lineExplanations?: TriviaMeta['lineExplanations'];
  /** Hint-open state lifted to TriviaSession so the global ⌘H shortcut can
      toggle a hint with nothing focused. Both are optional and paired: when
      neither is supplied (e.g. this component rendered standalone), the
      puzzle falls back to fully local hint-open state so it still works
      on its own. */
  openHints?: readonly number[];
  onToggleHint?: (line: number) => void;
  /** The blank line a global ⌘E/⌘H keypress would act on right now. Shown as
      a single small Kbd hint on that one row — the discoverability anchor
      for a shortcut that targets "the current line" rather than a fixed
      one. */
  activeShortcutLine?: number | null;
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
  hints,
  lineExplanations,
  openHints: openHintsProp,
  onToggleHint,
  activeShortcutLine = null,
}: CodePuzzleProps) {
  const [internalOpenHints, setInternalOpenHints] = useState<readonly number[]>([]);
  const openHints = openHintsProp ?? internalOpenHints;
  const [explainEnabled, setExplainEnabled] = useState(false);
  const [clickedExplain, setClickedExplain] = useState<HoveredLine | null>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const blankRowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { hovered, rowHoverHandlers } = useHoveredCodeLine(explainEnabled);
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

  /* Drag/drop is bound to the whole blank row (see renderBlankRow), not the
     tiny slot button, so a drop landing anywhere on the row's much larger
     hit area still resolves to this exact line. */
  const allowRowDrop = (event: DragEvent<HTMLDivElement>): void => {
    if (graded) return;
    event.preventDefault();
  };

  const handleRowDrop = (line: number) => (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    // Claim the drop so the code well's own nearest-row fallback (below)
    // never double-handles a drop that already landed on a real row.
    event.stopPropagation();
    if (graded) return;
    const transfer = event.dataTransfer;
    const tileId = transfer ? transfer.getData(TILE_MIME) : '';
    if (tileId.length > 0) {
      onTileDrop(line, tileId);
      return;
    }
    onSlotActivate(line);
  };

  /* Fallback for a drop that misses every row's own hit area (e.g. it lands
     on a plain code row, or in the well's own padding) — resolves to the
     closest blank by vertical distance instead of silently doing nothing. */
  const nearestBlankLine = (clientY: number): number | null => {
    let bestLine: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    blankRowRefs.current.forEach((element, line) => {
      const rect = element.getBoundingClientRect();
      const distance =
        clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestLine = line;
      }
    });
    return bestLine;
  };

  const handleWellDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (graded) return;
    const nearestLine = nearestBlankLine(event.clientY);
    if (nearestLine === null) return;
    const transfer = event.dataTransfer;
    const tileId = transfer ? transfer.getData(TILE_MIME) : '';
    if (tileId.length > 0) {
      onTileDrop(nearestLine, tileId);
      return;
    }
    onSlotActivate(nearestLine);
  };

  const toggleHint = (line: number): void => {
    if (onToggleHint) {
      onToggleHint(line);
      return;
    }
    setInternalOpenHints((current) =>
      current.includes(line) ? current.filter((n) => n !== line) : [...current, line]
    );
  };

  const hintFor = (line: number): string | undefined =>
    hints?.find((entry) => entry.line === line)?.hint;

  const explanationFor = (line: number): string | undefined => lineExplanations?.[line];

  const truthFor = (line: number): string =>
    round.lines.find((candidate) => candidate.number === line)?.content ?? '';

  const handleExplainClick = (line: number) => (event: React.MouseEvent<HTMLButtonElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    setClickedExplain((current) => (current !== null && current.line === line ? null : { line, rect }));
  };

  /* ⌘R/⌘E/⌘H are handled once, globally, in TriviaSession — wiring them here
     too (on a per-blank input) would double-fire whenever an input has
     focus, since a preventDefault()'d keydown still bubbles to window. Tab
     is the one shortcut that is inherently per-input (it needs the input
     that has focus right now), so it stays here. */
  const handleInputKeyDown = (line: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const ordered = [...inputRefs.current.keys()].sort((a, b) => a - b);
      if (ordered.length === 0) return;
      const currentIndex = ordered.indexOf(line);
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex = (currentIndex + direction + ordered.length) % ordered.length;
      inputRefs.current.get(ordered[nextIndex])?.focus();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit?.();
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
          /* code-slot-input zeroes the field's own left padding (see ui.css)
             so the typed text starts exactly one CODE_GROUP gap after the
             indent span — the same distance a plain code row's own text sits
             at — instead of the input's default inset stacking on top of it
             (TASKS.md 9.3: "that exact place should start on the first
             letter ... so that it can align with other lines"). */
          className="code-slot-input"
          ref={(el) => {
            if (el) inputRefs.current.set(line, el);
            else inputRefs.current.delete(line);
          }}
          aria-label={`Line ${line} — type the missing line`}
          placeholder="type the line"
          value={text}
          onChange={(event) => onTypeAnswer(line, event.target.value)}
          onKeyDown={(event) => handleInputKeyDown(line, event)}
          style={{ ...MONO_INPUT, flex: '1 1 0%', minWidth: 0 }}
        />
      );
    }

    const skin = SLOT_SKIN[state];
    const edge = state === 'empty' && hasSelection ? 'var(--border-accent)' : skin.border;

    return (
      <Button
        size="sm"
        // Same alignment fix as code-slot-input, above, for the filled/
        // graded/empty-choice-mode rendering of this same slot.
        className="code-slot-btn"
        data-state={state}
        aria-label={slotLabel(line)}
        aria-pressed={text.length > 0}
        disabled={graded}
        onClick={() => onSlotActivate(line)}
        style={{
          flex: '1 1 0%',
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
    const explanation = explanationFor(number);
    const showHint = openHints.includes(number);
    const wrong = grade !== null && !grade.perBlank[number];
    const isShortcutTarget = activeShortcutLine === number;
    const hoverHandlers = explanation !== undefined ? rowHoverHandlers(number) : undefined;

    return (
      <div
        key={number}
        className="ui-code-line"
        data-testid={`blank-row-${number}`}
        ref={(el) => {
          if (el) blankRowRefs.current.set(number, el);
          else blankRowRefs.current.delete(number);
        }}
        onMouseEnter={hoverHandlers?.onMouseEnter}
        onMouseLeave={hoverHandlers?.onMouseLeave}
        onDragOver={allowRowDrop}
        onDragEnter={allowRowDrop}
        onDrop={handleRowDrop(number)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div style={CODE_GROUP}>
            <span style={GUTTER}>{number}</span>
            <span aria-hidden="true" data-testid={`indent-${number}`} style={INDENT}>
              {line.indent}
            </span>
            {renderSlot(number)}
          </div>
          <div style={ICON_GROUP}>
            {hint !== undefined ? (
              /* The ⌘I shortcut hint is attached directly to the Hint button
                 itself (TASKS.md 9.4) — visible only on the current shortcut-
                 target row, so it reads as "this button's shortcut", not as a
                 floating badge disconnected from any control. */
              <span style={SHORTCUT_PAIR}>
                <IconButton
                  icon={<Lightbulb />}
                  variant="secondary"
                  size="sm"
                  selected={showHint}
                  title="Toggle hint (⌘I)"
                  aria-label={`Hint for line ${number}`}
                  onClick={() => toggleHint(number)}
                />
                {isShortcutTarget ? (
                  <Kbd
                    aria-hidden="true"
                    data-testid={`shortcut-target-${number}`}
                    title={`Line ${number} is the current target for the ⌘I shortcut`}
                  >
                    ⌘I
                  </Kbd>
                ) : null}
              </span>
            ) : null}
            {explanation !== undefined ? (
              <IconButton
                icon={<Info />}
                variant="secondary"
                size="sm"
                title="Explain this line"
                aria-label={`Explain line ${number}`}
                onClick={handleExplainClick(number)}
              />
            ) : null}
            {/* Same pairing for Reveal/⌘E. When neither Hint nor this row
                render a Kbd (isShortcutTarget false, or hint is undefined so
                the ⌘I badge above never mounted), the shortcut-target-N test
                hook still needs exactly one anchor per target row — Eye
                always renders, so it is the fallback anchor. */}
            <span style={SHORTCUT_PAIR}>
              <IconButton
                icon={<Eye />}
                variant="secondary"
                size="sm"
                title="Reveal answer (⌘E)"
                aria-label={`Reveal line ${number}`}
                disabled={graded || revealed.includes(number)}
                onClick={() => onReveal(number)}
              />
              {isShortcutTarget ? (
                <Kbd
                  aria-hidden="true"
                  data-testid={hint === undefined ? `shortcut-target-${number}` : undefined}
                  title={`Line ${number} is the current target for the ⌘E shortcut`}
                >
                  ⌘E
                </Kbd>
              ) : null}
            </span>
          </div>
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

  const renderCodeRow = (line: PuzzleLine) => {
    const explanation = explanationFor(line.number);
    const hoverHandlers = explanation !== undefined ? rowHoverHandlers(line.number) : undefined;

    return (
      <div
        key={line.number}
        className="ui-code-line"
        data-testid={`code-row-${line.number}`}
        onMouseEnter={hoverHandlers?.onMouseEnter}
        onMouseLeave={hoverHandlers?.onMouseLeave}
      >
        <div style={CODE_GROUP}>
          <span style={GUTTER}>{line.number}</span>
          {/* Indentation is rendered through its own fixed white-space:pre span,
              never as a bare leading-whitespace text node inside this flex row —
              per the CSS Flexbox spec a whitespace-only anonymous flex item is
              not rendered at all, which is exactly why every line used to read
              flush-left regardless of its real Python indentation depth. */}
          <span aria-hidden="true" data-testid={`indent-${line.number}`} style={INDENT}>
            {line.indent}
          </span>
          {/* highlightPythonLine returns an array of sibling spans, not one
              node — wrapped in its own element so it counts as exactly one
              flex item here too, the same defense-in-depth CODE_GROUP gives
              the blank row's slot (TASKS.md 9.3). */}
          <span style={{ minWidth: 0, whiteSpace: 'pre' }}>{highlightPythonLine(line.content)}</span>
        </div>
      </div>
    );
  };

  const hoveredExplanation = hovered !== null ? explanationFor(hovered.line) : undefined;
  const clickedExplanation = clickedExplain !== null ? explanationFor(clickedExplain.line) : undefined;

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
        <>
          <CodeExplainToggle enabled={explainEnabled} onToggle={() => setExplainEnabled((current) => !current)} />
          <span
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            {filledCount}/{round.blanks.length} filled
          </span>
        </>
      }
      style={{ borderColor: 'var(--border-default)', minWidth: 0 }}
    >
      <div
        data-testid="code-puzzle-well"
        onDragOver={allowRowDrop}
        onDragEnter={allowRowDrop}
        onDrop={handleWellDrop}
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
      {explainEnabled && hovered !== null && hoveredExplanation !== undefined ? (
        <LineExplainPopover
          line={hovered.line}
          explanation={hoveredExplanation}
          anchorRect={hovered.rect}
          side="left"
        />
      ) : null}
      {clickedExplain !== null && clickedExplanation !== undefined ? (
        <LineExplainPopover
          line={clickedExplain.line}
          explanation={clickedExplanation}
          anchorRect={clickedExplain.rect}
          side="right"
        />
      ) : null}
    </Card>
  );
}
