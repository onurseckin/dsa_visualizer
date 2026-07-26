# Trivia + Workspace Line-Explanation UX — Living Task List

Authoritative, persistent tracker for this feature line. Supersedes
`MASTER_PLAN.md` / `MASTER_PLAN_V2.md` in this same folder for anything they
overlap on (those are left in place as historical record, not deleted).

**Rule for every future agent or session touching this file:** when an item is
done and verified, check it off (`[x]`) and add a one-line note of how/where it
was verified. **Never delete a line item, even when complete.** If a fix later
regresses, uncheck it and add a note — the history of "this was fixed once"
stays valuable.

---

## 0. Verbatim user feedback (source of truth — do not paraphrase away from this)

> I have a criticism about the on-demand line explanation system. I'm actually
> disappointed with the way that you implemented them. I'm very happy with the
> line-by-line data you introduced for all of the 40 different products. It's
> not an easy job, and I appreciate that. But how a user sees this
> information, that interaction system is terrible. Because we injected some
> kind of a button for each line with an information icon, that first of all
> messed with Python's line indentation system, specifically on the trivia and
> also on some examples on the workspace page as well. That system is
> terrible. Because when you design this way, for each line we see the same
> information button for every line, which is a stupid code visual
> repetition. Looks very ugly and messes up with the code system. Instead, on
> the header part of the code section in workspace, there should be some kind
> of information icon button. By default, it should be enabled. If I click
> again, it should toggle between enabling and disabling. When this icon is
> toggled by default as on, when I hover on any line with my mouse, I should
> see that specific line information related to the line. But currently, the
> way information appears is also wrong. I mentioned before that this should
> be a popover. This shouldn't replace any existing line inside of a code
> part. It shouldn't touch the code part. Instead, on the left side of the
> code section, indicating which lines of information it is talking about,
> without overlapping any place on the code part, there should be information
> showing that the popover should appear. For the trivia one, also, the system
> should be like that, but by default, on the trivia line information helper
> should be toggled off, but on workspace it should be toggled on by default.
> In trivia, for the empty line that the user needs to fill, either by drag
> and drop or by using their keyboard to input the actual top line to be
> entered we currently have an eye icon, which shows the actual answer for
> that line. Left next to the eye icon, we should have an information icon as
> well. When the user clicks on that, we should see a popover appearing on the
> right side out of the code container. Flow powers indicator and alignment
> should give the user visual information about which line of information is
> shown properly. Current information showing systems are wrong. Also, your
> current code causes Python code alignment issues. All entire files are
> currently left-aligned, which is terrible because Python has a proper format
> indentation language. This looks wrong and anti-Python. Another thing is,
> during the Travia, all of these button interactions should have their
> dedicated keyboard shortcuts. For example, when I want to reveal the actual
> answer for the line or information, or retry a specific example or go to the
> next step, all of these steps should have a dedicated button and dedicated
> keyboard shortcut. That way, the user will be able to interact with the
> Travia and all the previous and next questions just using the keyboard. Of
> course, mouse systems will also work, but just relying on the keyboard would
> make it very fast. I'd like to also improve the drag and drop system. I
> should have both drag and drop and a click-based system. Let's say from the
> top, high, like higher top line to the most of them lower line, and from the
> top two buttons I'm trying to feel the trivia, right? Then, if I just click
> and release the mouse on any of the tiles, any of the options, instead of
> dragging and dropping them, it should fill the next available space. Let's
> say I'm using trivia with four lines missing. If I already filled the first
> line, if I just click on any option on the right side, it should directly
> fill the second line, which is the next line. Currently, drag and drop
> sections are also very sensitive. When I drag something and I'm closer to
> the line, even if some part of the thing that I want to drop is inside a
> missing line container, it's not dropping. I need to properly center a thing
> to drop. I'm not happy with this experience. It should be more relaxed.
> Dragging and dropping should be very easy. Even a little bit of overlap is
> achieved when I release, and my mouse drop should happen. If I'm a little
> bit out of the drop place, it should drop closer to the closest line
> possible so that users' custom drag and drop user interactivity should be
> very easy. Also, when I'm submitting keyboard responses, spacing shouldn't
> be considered wrong. It should be formatted before checking the answer.
> Maybe let's say I use some space before or after the operator, or I left
> extra space on the line, etc. It shouldn't fail on any spacing issues. This
> is a miscatch. They are not errors because the user prefers to put maybe
> some more space inside of some array blocks or something like that, or
> tuples or any definitions. We shouldn't make things fail as wrong, but even
> if the user's code is right, we need to do some correct formatting and
> trimming when the user submits their information to a specific line. Current
> issues that I observed are that the system is not working. None of the
> keyboard shortcuts are working. I don't see next question or retry help
> buttons with their keyboard shortcuts. Also, previously I built a system
> where, inside of keyboard-based puzzle sections, when I press Tab, it should
> jump to the next line to enter. It shouldn't be like a regular browser HTML
> jump. Tab and Shift+Tab should only jump between available lines that the
> user needs to enter for speed, so that the user can enter their answers
> without using the mouse for their convenience. The session system is still
> messed up. When I exit, I still see editing the current session, like
> building their deck again or adjusting the settings, kind of thing. I
> created the previous session system to make sure that I can have different
> sessions, and when I have some progress, I want to keep them and continue
> on the sessions that I left before in the future. They should all be there.
> There should be more than one session, like multiple sessions that I can
> interact with. I think you messed up the current session system. I am not
> happy with what we have as of today. During the trivia, if I am not happy or
> if I'm satisfied with the current levels, without losing my progress on
> trivia, I should be able to change the session settings and increase the
> level further. If I'm happy with the current progress that I have, exiting
> from any session should automatically save that session, and I should be
> able to resume that session. Trivia session management should be clearly
> designed. It's currently still messy. I've given you a very large prompt and
> feedback. I am worried that you might forget some of my feedback, and I
> don't want you to forget that.

---

## 1. Line explanation interaction — full redesign (replaces per-line icon)

Root problem confirmed by reading the code: `src/components/primitives/LineExplainer.tsx`
renders a clickable Info `IconButton` inline on **every** line that has an
authored explanation (nearly all of them, after the content-authoring pass) —
in both `CodeBlockViewer.tsx` (workspace) and `CodePuzzle.tsx` (trivia). That
is the "same information button for every line" the user is rejecting.

- [x] **1.1** Remove the per-line inline Info-icon-per-row pattern entirely from both
      `CodeBlockViewer.tsx` and `CodePuzzle.tsx`. No icon repeated down the gutter.
      Done: `CodeBlockViewer.tsx` half done by the sibling agent (replaced with
      `CodeExplainToggle`/`LineExplainPopover`); `CodePuzzle.tsx` half done here —
      `LineExplainer` import and its per-row usage in both `renderBlankRow` and
      `renderCodeRow` removed entirely. Verified via `CodePuzzle.spec.tsx`.
- [x] **1.2** Workspace (`CodeBlockViewer.tsx`): add **one** toggle icon button in the
      code Card's header/actions row. Default **ON**. Clicking toggles on/off.
      While ON, hovering any code line shows that line's explanation in a
      **popover positioned to the left of the code section**, never overlapping
      or shifting the code text, with a visible connector/indicator tying it to
      the specific hovered line. While OFF, no hover popovers at all.
      Independently re-verified by a review agent (2026-07-25) by re-reading
      `CodeBlockViewer.tsx`/`LineExplainPopover.tsx` line-by-line (not the
      implementer's summary): `CodeExplainToggle` sits in `Card`'s `actions`
      (rendered inside `.ui-card__header` per `Card.tsx`), defaults
      `useState(true)`, click flips it (`CodeBlockViewer.tsx` ~L169/196).
      `LineExplainPopover` is portalled to `document.body` with
      `position:fixed`/`pointer-events:none` derived from the hovered row's own
      `getBoundingClientRect()`, so it can never shift or sit inside the code
      well's scroll box regardless of DOM depth; for `side="left"` the panel's
      right edge is placed `anchorRect.left - 12px`, i.e. strictly left of the
      code panel (which sits in `MainLayout.tsx`'s right column, with the
      visualizer column to its left, so there is real room there), never
      overlapping the gutter/text. Connector triangle
      (`line-explain-connector-N`) + "Line N" header identify which row it's
      for. Confirmed `tsc --noEmit` and `eslint` clean on both files + specs,
      zero `any`/`@ts-ignore`/`eslint-disable`, and reran
      `bunx vitest run src/components/primitives/specs` myself — 11 files, 103
      tests, all passing, matching the implementer's report exactly. No bug
      found; no changes needed in this file.
- [x] **1.3** Trivia (`CodePuzzle.tsx`): the same header-toggle + hover-popover
      mechanism as 1.2, applied to every row (blank or plain code), default
      **OFF**. Done: `CodeExplainToggle` in the Card's `actions`, defaults to
      `useState(false)`; `useHoveredCodeLine(explainEnabled)` wired to both
      `renderBlankRow` and `renderCodeRow` (only on rows that actually have an
      explanation), popover rendered with `side="left"`. Verified in
      `CodePuzzle.spec.tsx` (default-off, hover-on-toggle, code row + blank row
      hover, unexplained-row no-op).
      Workspace half (`CodeBlockViewer.tsx`) independently re-verified by a
      review agent, see 1.2's note.
- [x] **1.4** Trivia blank/fill rows specifically: keep the existing eye
      (reveal-answer) icon. Add a new info icon **immediately to its left**.
      Clicking it (discrete click, not hover — blank rows have no literal code
      text to hover) opens a popover **on the right side, outside the code
      container**, with a visual indicator of which line it belongs to. This is
      in addition to the row being reachable via the header hover-toggle in 1.3.
      Done: new `Info` `IconButton` (`aria-label="Explain line N"`) sits between
      the hint Lightbulb (if present) and the Eye icon; click drives a
      `clickedExplain` rect state independent of the header toggle, rendering
      `LineExplainPopover side="right"`. Verified in `CodePuzzle.spec.tsx`
      ("opens a right-side click popover ... even when the header toggle is off").
- [x] **1.5** Verify popovers never overlap/cover/shift any code text or gutter in
      either surface, at both a wide and a narrow (TileTray-present) layout.
      Trivia half verified: `LineExplainPopover` is portalled to `document.body`
      with `position:fixed`, `pointer-events:none`, so it can never shift the
      code well's own layout regardless of TileTray's presence/width; covered by
      `CodePuzzle.spec.tsx`'s popover tests. Workspace half
      (`CodeBlockViewer.spec.tsx`, 11 tests) independently re-verified by a
      review agent by reading the actual component and rerunning the suite —
      see 1.2's note.
- [x] **1.6** Fix the Python indentation bug. Root cause found: `CodePuzzle.tsx`'s
      `renderCodeRow` (and originally `renderBlankRow`'s reveal/"Expected" line)
      pass a whole raw, leading-whitespace-included line through
      `highlightPythonLine(...)` as a **direct child of a `display:flex` row
      div** — per the CSS Flexbox spec, a whitespace-only anonymous text run
      between flex items is not rendered at all, so every line's indentation
      collapses and the file reads as flush-left. `renderBlankRow`'s *slot*
      already avoids this correctly by rendering `line.indent` through its own
      dedicated `white-space: pre` `<span>` (the `INDENT` constant) — apply
      that same pattern to `renderCodeRow` (render `line.indent` via `INDENT`,
      then `highlightPythonLine(line.content)`, never `highlightPythonLine(line.text)`
      as a bare flex child again). Apply the equivalent defensive fix in
      `CodeBlockViewer.tsx` once its row markup changes for the hover/toggle
      redesign (split each line into leading whitespace + content the same way,
      each rendered through its own explicit `white-space: pre` element).
      Trivia half (`CodePuzzle.tsx`'s `renderCodeRow`) done here: now renders
      `line.indent` through the existing `INDENT` `white-space:pre` span, then
      `highlightPythonLine(line.content)` — never `highlightPythonLine(line.text)`
      as a bare flex child. Verified against a real deeply-nested fixture
      (`N_QUEENS_CODE`, lines 2/7/8/13 at 4/8/12/16-space indent, confirmed
      against the source directly) in `CodePuzzle.spec.tsx`, asserting both
      exact indent strings and strictly-increasing length across nesting depth.
      `CodeBlockViewer.tsx`'s half already done by the sibling agent per their
      report (`splitIndent`, verified against the same fixture).
      Independently re-verified by a review agent: `CodeBlockViewer.tsx`'s row
      is `.ui-code-line` (`display:block; white-space:pre`, not flex — checked
      `src/styles/ui.css` and the pre-existing committed version of this file),
      so the flex-collapse indentation bug never actually existed in this file
      specifically (matches what the implementer's own note said); the
      `splitIndent`/`indent`+`content` split is correct defense-in-depth
      regardless, and the `indent-N` assertions (including the nQueens
      4/8/12/16-space fixture) pass in a fresh test run.

## 2. Keyboard shortcuts — make them actually work, one binding per action

Root cause found: `handleInputKeyDown` in `CodePuzzle.tsx` (⌘R retry, ⌘E
reveal, ⌘H hint) is wired **only** on the per-blank `<Input>`'s `onKeyDown` —
which only exists in `type` mode. In `choice` (drag/click tile) mode there is
no focused text input, so none of those shortcuts can ever fire — this is
"none of the keyboard shortcuts are working" for anyone on the default mode.
⌘R also has a separate, working, window-level listener in `TriviaSession.tsx`,
so retry already works globally; ⌘E and ⌘H do not.

- [x] **2.1** Move Reveal / Hint-toggle (and confirm Check / Next / Retry) shortcut
      handling to one section-level or window-level keydown listener in
      `TriviaSession.tsx` (alongside the existing ⌘R/Escape handler) so they work
      regardless of mode or focus. Define an explicit, sane rule for "which
      line" a global Reveal/Hint shortcut targets (e.g. the currently
      keyboard-focused blank, falling back to the first unfilled blank).
      Done: ⌘E/⌘H (and ⌘Enter for Check/Next) moved into the one window-level
      listener in `TriviaSession.tsx`; ⌘E/⌘H removed from `CodePuzzle.tsx`'s
      per-input handler entirely (kept there would double-fire, since a
      preventDefault()'d keydown still bubbles to window). Target-line rule:
      `currentTargetLine` = the first blank that is neither filled nor
      revealed, falling back to `round.blanks[0]` once everything is
      filled/revealed. Made discoverable via a one-time (not per-row) `<Kbd>⌘E
      ⌘H</Kbd>` badge rendered only on that row (`activeShortcutLine` prop,
      `data-testid="shortcut-target-N"`). Verified in
      `TriviaSession.spec.tsx`/`.render.spec.tsx` (⌘E/⌘H/⌘R/⌘Enter all fire with
      nothing focused; target moves to the next blank once the first fills).
- [x] **2.2** Every actionable control (Check answers, Next round/Try again, Retry,
      Reveal, Hint) has a visible `<Kbd>` shortcut hint next to it, and the
      shortcut demonstrably fires from a fresh render with nothing focused, not
      just when a specific input has focus.
      Done: Check/Next already had `<Kbd>⌘Enter</Kbd>` but had **no actual
      binding** behind it (grepped — only the native button; now backed by the
      window-level ⌘Enter case, contextual on `graded`). Added a real, always-
      visible **Retry** button (`<RefreshCw>` icon + `<Kbd>⌘R</Kbd>`) in the
      footer next to Check/Next — there was no visible Retry control at all
      before, only the hidden shortcut. Reveal/Hint intentionally do NOT get a
      `<Kbd>` repeated on every row (that is exactly the visual-repetition
      anti-pattern section 1 removes) — instead a single `<Kbd>` badge marks
      whichever one row is the current shortcut target (see 2.1). Verified:
      `TriviaSession.spec.tsx`'s ⌘E/⌘H/⌘R/⌘Enter-with-nothing-focused tests, and
      a dedicated Retry-button test.
- [x] **2.3** "Previous/next question" — the engine only ever advances forward via
      `pickRound` (no round history exists). Scope "next" to the existing
      Next-round action; do not silently invent a fabricated "previous
      question" if there's no history to go back to — flag this limitation
      explicitly in the round summary rather than papering over it.
      Confirmed and left as-is: no "previous question" action was added.
      **Flagging explicitly per this item's own instruction**: the engine
      (`pickRound`/`TriviaProgress`) has no round history at all today, so a
      real "go back to the previous question" is not implemented anywhere —
      if that's what the user's "previous and next questions" phrasing meant,
      it does not exist yet and would need round-history storage added to
      `triviaEngine.ts`/`TriviaProgress` (out of this agent's file ownership)
      before a previous-question control could be built honestly.

## 3. Tab / Shift+Tab restricted to blank fields only (type mode)

- [x] **3.1** In `type` mode, Tab and Shift+Tab must cycle **only** through the
      blank input fields, in ascending line-number order, wrapping at both
      ends — not the full browser tab order (which today also stops on Reveal/
      Hint icon buttons and other chrome in between).
      Done: `handleInputKeyDown` in `CodePuzzle.tsx` now intercepts `Tab`,
      reads the live `inputRefs` map (so only currently-rendered, i.e.
      not-yet-revealed/graded, blank inputs are ever candidates), sorts
      ascending, and calls `.focus()` on the next/previous one with wraparound,
      calling `preventDefault()` so the native browser tab order never runs.
      Verified in `CodePuzzle.spec.tsx` with a 3-blank round (forward, wrap at
      the end, Shift+Tab wrap at the start).

## 4. Whitespace-tolerant answer grading

- [x] **4.1** `src/trivia/triviaEngine.ts`'s `isAnswerCorrect` currently only trims
      leading/trailing whitespace (`submitted.trim() === expected.trim()`), so
      internal spacing differences (extra space around an operator, inside a
      tuple/array literal) are marked wrong even though the code is correct.
      Fix by normalizing both sides identically before comparing — trim, then
      collapse every internal run of whitespace to a single space — so
      harmless spacing choices never fail a correct answer. Pure function
      change in `triviaEngine.ts` only; must stay unit-testable without any UI
      involvement.
      Done: `isAnswerCorrect` now runs both sides through a `normalizeWhitespace`
      helper (`value.trim().replace(/\s+/g, ' ')`) before comparing — trims the
      ends and collapses every internal run of whitespace to one space, so
      `'x  =  1+1'`/`'total   =   0'`/`'[1,  2,   3]'`/`'(1,   2)'` all grade
      equal to their single-spaced originals. A fully-absent separator
      (`'total=0'` vs `'total = 0'`, `'[1,2,3]'` vs `'[1, 2,3]'`) is a
      deliberate non-match — collapsing a run is not the same as inventing or
      deleting one — since erasing that distinction would risk grading
      structurally different code (e.g. merged identifiers) as correct.
      `gradeRound` is the single call site (verified: no other component
      re-implements the comparison), so this fixes grading everywhere the UI
      submits an answer, keyboard or otherwise. Independently re-verified by a
      review agent by re-reading `triviaEngine.ts`/`triviaEngine.spec.ts` and
      the call graph, and running
      `bunx vitest run src/trivia/specs/triviaEngine.spec.ts` (87/87 passed),
      plus `triviaFlow.spec.ts` + both `CodePuzzle` specs (59/59 passed) as a
      regression check. No bug found; no changes needed.

## 5. Drag-and-drop tolerance + click-to-fill-next-empty-slot

- [x] **5.1** Native HTML5 drop targets in `CodePuzzle.tsx` are bound to the exact
      small slot `<Button>`, so a drop that's only slightly outside its bounds
      does nothing. Make the whole blank row (or a generously padded hit area)
      the effective drop target, and fall back to "nearest blank row by
      distance" if the literal drop point isn't exactly on a slot, so any
      overlap — even partial — successfully drops onto the closest blank.
      Done: dragover/dragenter/drop moved off the tiny slot `<Button>` onto the
      whole blank row `<div>` (already full-width block-level, so this alone
      is a large forgiveness win), which `stopPropagation()`s on drop so the
      well-level fallback doesn't double-handle it. Added a well-level
      (`code-puzzle-well`) fallback `onDrop` that computes the nearest blank
      row by `getBoundingClientRect().top/bottom` vs `event.clientY` for any
      drop that misses every row (lands on a plain code row or the well's own
      padding). Verified in `CodePuzzle.spec.tsx` (exact-row drop, row-wide
      drop away from the button, and the nearest-row fallback with mocked
      rects — note: jsdom has no native `DragEvent`, so `fireEvent.drop(el,
      {clientY})` silently drops `clientY`; the fallback test builds the event
      via `createEvent.drop` + `Object.defineProperty` to work around that
      test-environment gap, not a production issue).
- [x] **5.2** Change click behavior on an available tile in `TileTray`: a plain
      click should immediately fill the **next empty blank** (ascending line
      order), not just select the tile and wait for a second click on a
      specific slot. Dragging a tile to a specific (possibly non-next) blank
      must continue to work exactly as before, as the deliberate alternative
      to click-fills-next.
      Done: `TileTray` now takes two separate callbacks — `onSelect` (drag-
      start only, unchanged, still drives the drop's held-tile fallback) and a
      new `onActivate` (plain click only). `TriviaSession.handleActivateTile`
      fills the lowest-numbered still-empty, not-revealed blank; once every
      blank already has an answer it falls back to the old select-then-click-
      a-slot path so a full board isn't a dead end for swapping. Verified in
      `TriviaSession.spec.tsx`/`.render.spec.tsx` (click-fills-next, click-
      fills-forward after the first is taken, drag still targets a specific
      later blank independently, and the full-board fallback).

## 6. Trivia session management — audit real bugs + fix UI clarity

Current architecture (already rewritten once this round): a session is the
single source of truth (`activeSession.config`/`.progress`, no parallel bare
config/progress state), one `handleToggleDrillMode` governs enter/exit, and
`TriviaSessionsManager` is a `Drawer` popover listing every saved session. The
user says it is still messy in practice — treat the following as things to
verify end-to-end (not just structurally read), and fix whatever is actually
broken:

- [x] **6.1** Multiple sessions genuinely coexist and are all visible/switchable:
      create session A, build a deck, drill a few rounds, exit; create session
      B with a different deck, drill differently; switch back to A — confirm A's
      exact deck/settings/level/progress come back untouched, not B's and not a
      blank state.
      Independently re-verified by a reviewing agent (not just trusting the
      implementer's summary): traced `activeSession = sessions.find(s => s.id
      === activeId) ?? sessions[0]` and `applySessionPatch` in
      `routes/trivia.tsx` line-by-line, ran the full 5-file test command
      myself (66/66 green), and confirmed `createSession()`'s no-arg default
      reads the bare legacy `triviaConfig`/`triviaProgress` keys — which are
      only ever cleared (by `ensureActiveSession`'s one-time bootstrap) and
      never written again anywhere in the current UI (`writeTriviaConfig`/
      `writeTriviaProgress` have zero non-spec callers) — so a fresh session
      can never inherit a previous session's state. Covered end-to-end by
      `trivia.render.spec.tsx`'s "keeps two sessions fully independent" test.
- [x] **6.2** Exiting a session (via "Exit to setup") auto-saves it (already true
      structurally via `updateSession` on every mutation) and later re-selecting
      that same session resumes it in the correct mode (setup vs. mid-drill) —
      confirm `handleSelectSession`'s `s.status !== 'active'` check actually
      produces the right screen after a real reload, not just in memory.
      Independently re-verified: `handleToggleDrillMode` (the one enter/exit
      path) always calls `applySessionPatch({ status })` synchronously, and
      the mount-time `isSetupOpen` initializer mirrors `handleSelectSession`'s
      exact formula. `trivia.render.spec.tsx`'s "reopens on setup after a
      remount" test does a real `cleanup()` + re-render (not just in-memory
      state) and still lands on setup. Confirmed green in my own test run.
- [x] **6.3** Changing settings (e.g. raising `maxBlanks`) on a session with
      existing progress must never reset that progress — confirm
      `progress.drilled`/`.stats` are untouched after a config-only patch.
      Independently re-verified, and one real bug found and fixed in the
      process: `progress.completed` never reverted once true, and
      `TriviaCompletionCard` had no controls at all, so a session that
      finished its configured deck was a permanent dead end — there was no
      way back to settings to raise `maxBlanks`, even though the card's own
      copy invited exactly that ("Raise the hardest level to keep going").
      Fixed (already present in the reviewed diff, confirmed correct by
      tracing `reviveProgressForConfig` against `isLevelCovered`'s real
      signature in `triviaEngine.ts`): an "Adjust settings to keep going"
      button now returns a completed session to setup, and
      `reviveProgressForConfig` un-completes + advances to the next
      genuinely-uncovered level only when the new config leaves material to
      drill, leaving `drilled`/`stats` byte-identical otherwise. The ordinary
      (non-completed) config-only patch path was confirmed to send `{ config
      }` alone via reference-identity (`nextProgress === progress`), never
      naming `progress` in the patch at all. Both paths covered by
      `trivia.render.spec.tsx`'s "raises maxBlanks on session A without
      resetting" and "resumes a session that finished its deck" tests; both
      green in my own run.
- [x] **6.4** Make which session is currently being edited/drilled unambiguous on
      the setup screen itself, not only in the small "Sessions · <name>" button
      in the slim top bar — a user glancing at the deck builder should not have
      to hunt for which session they're editing.
      Independently re-verified: `TriviaHeaderCard.tsx` now renders an always-
      visible "Now editing session" eyebrow above the name, plus a progress-
      derived badge ("New session" vs. "Paused · progress saved") instead of
      the old status-derived one that could say "Active" while sitting on the
      setup screen. `TriviaSessionsManager.tsx`'s row list also carries a
      per-row progress summary and an "Editing now" badge on the active row.
      Confirmed by reading both files directly (not just the summary) and by
      the passing "shows an unambiguous 'New session' identity" test.
- [x] **6.5** Deleting, renaming, and creating sessions in quick succession must
      never drop a session from the list or desync the active session pointer
      (race between `updateSession`/`deleteSession` writes and the follow-up
      `setSessions(readTriviaSessions())` read).
      Independently re-verified by tracing every mutating handler in
      `routes/trivia.tsx` (`handleRenameSession`, `handleDeleteSession`,
      `handleCreateNewSession`) — each reads fresh from storage before
      updating React state, no stale closures across separate events.
      `trivia.render.spec.tsx`'s rename-then-delete-then-create test passed
      in my own run with the exact final set asserted (`{A, C-renamed, D}`,
      no drop/duplicate/stale-active).

## 7. Process (user's explicit request)

- [x] **7.1** Copy the user's feedback verbatim into a durable file before starting
      work — this file, section 0.
- [x] **7.2** Divide the work above across multiple agents by file ownership to
      avoid conflicting edits to the same files.
      Independently confirmed via `git diff --stat` against the four lanes'
      final working-tree changes: eight files, no two lanes touching the
      same one — `LineExplainPopover.tsx` (new) + `CodeBlockViewer.tsx`
      (Lane 1); `CodePuzzle.tsx` + `TriviaSession.tsx` + `TileTray.tsx`
      (Lane 2); `triviaEngine.ts` (Lane 3); `routes/trivia.tsx` +
      `TriviaHeaderCard.tsx` + `TriviaSessionsManager.tsx` (Lane 4). The only
      cross-lane relationship is Lane 2/4 importing Lane 1's new
      `LineExplainPopover.tsx` exports, which is composition through a
      published interface, not a conflicting edit to a shared file.
- [x] **7.3** Independent reviewing agents verify — by tracing the actual code, not
      by trusting an implementer's summary — that each user demand above is
      genuinely satisfied, and fix anything that is not.
      Done for Lane 4 (session management, section 6): a reviewing agent
      re-read `routes/trivia.tsx`, `TriviaHeaderCard.tsx`,
      `TriviaSessionsManager.tsx`, `triviaSessions.ts`, `triviaStorage.ts` and
      every one of their specs from scratch (not the implementer's summary),
      ran `bunx vitest run` on the exact 5-file list directly (66/66 green,
      not a description of green), and cross-checked every claim in the
      implementer's summary against the real code — including the
      `reviveProgressForConfig`/`isLevelCovered` call signature, the
      reference-identity `applyConfig` short-circuit, and that
      `writeTriviaConfig`/`writeTriviaProgress` have no callers that could
      leak legacy state into a new session. All five demands verified
      satisfied; see 6.1–6.5 for per-item evidence. `tsc --noEmit` and
      `eslint` clean on every file in scope.
      Also done, independently, for every other lane, each by a separate
      reviewing agent that re-read the actual code rather than trusting the
      implementer: Lane 1 (section 1, 1.2/1.5/1.6's workspace half), Lane 2
      (sections 1's trivia half, 2, 3, 5), Lane 3 (4.1). A final cross-lane
      gate pass (section 8, 2026-07-25) then independently re-verified
      every item above end-to-end a second time, specifically checking the
      seams between lanes (e.g. does the trivia Info icon actually reuse
      Lane 1's popover, not a second implementation) — see section 8.
- [ ] **7.4** Keep this checklist updated as items complete; never delete a line,
      only check it off with a note.
      Standing rule for every future session, not a one-time deliverable —
      left unchecked deliberately since it never "completes." Every pass so
      far (four implementers, four reviewers, this final gate) has complied:
      no line was deleted, items were only ever checked off with an
      evidence note.

## 8. Final gate — full re-verification against section 0's verbatim feedback (2026-07-25)

This pass did not trust any of the four lanes' implementer/reviewer summaries.
Every file below was read directly, cross-referenced line by line against
section 0's verbatim text, and the specific seams between lanes (the places a
four-way split is most likely to drop something) were checked explicitly.

**Files read in full for this pass:** `LineExplainPopover.tsx`,
`CodeBlockViewer.tsx`, `CodePuzzle.tsx`, `TriviaSession.tsx`, `TileTray.tsx`,
`triviaEngine.ts` (isAnswerCorrect/gradeRound/isLevelCovered), `routes/trivia.tsx`,
`TriviaHeaderCard.tsx`, `TriviaSessionsManager.tsx`, `triviaSessions.ts`,
`TriviaSettings.tsx`, `MainLayout.tsx` (workspace column order), `ui.css`'s
`.ui-code-line` rule, plus a repo-wide grep for `LineExplainer`/`EXPLAIN_SLOT`
and for any other component rendering per-line code.

**Seam-risk questions, answered directly from code:**

- *Does the trivia Info icon reuse Lane 1's popover, or is it a second
  implementation?* Reuses it exactly: `CodePuzzle.tsx:13` imports
  `CodeExplainToggle, LineExplainPopover, useHoveredCodeLine` from
  `../primitives/LineExplainPopover` (Lane 1's file) and renders
  `<LineExplainPopover side="right" .../>` (`CodePuzzle.tsx:558-565`) with the
  same component Lane 1 built for the hover case — no parallel popover markup
  exists anywhere in `CodePuzzle.tsx`.
- *Any remaining per-line repeated icon anywhere?* Grepped the whole repo for
  `LineExplainer` and `EXPLAIN_SLOT` — zero hits. Also checked every other
  component that renders algorithm code or line data
  (`AuxiliaryPanel.tsx`, `TutorialCard.tsx`, `ProblemHeader.tsx`) — none
  render an Info icon at all. The one remaining per-row icon
  (`CodePuzzle.tsx`'s blank-row Info button, `:417-426`) is deliberately
  scoped to blank/fill rows only (a handful of lines per round, not every
  line) and is the icon the user explicitly asked for "left next to the eye
  icon" — not the anti-pattern being removed.
- *Does the indentation fix hold in both files?* Yes, independently
  confirmed in both. `CodeBlockViewer.tsx` splits via `splitIndent()`
  (`:34-37`) and renders `indent`/`content` through separate elements
  (`:243-246`); its row (`.ui-code-line`, `ui.css:684-693`) is `display:block`
  so this is defense-in-depth. `CodePuzzle.tsx`'s `renderBlankRow` (`:383-385`)
  and `renderCodeRow` (`:490-493`) both render `line.indent` through the
  `INDENT` (`white-space:pre`) span as an actual child *element*, never a bare
  text node, inside their `display:flex` row — since only anonymous
  whitespace-only text runs (not wrapped elements) collapse under the
  flexbox spec, this correctly sidesteps the bug in the one file where the
  row genuinely is flex.
- *Are Check/Next/Retry/Reveal/Hint shortcuts wired independent of focus?*
  Yes. `TriviaSession.tsx:204-245` is one `window.addEventListener('keydown', ...)`
  with no element-focus dependency at all — confirmed it is attached to
  `window`, not any input or row, so ⌘R/⌘E/⌘I(⌘H)/⌘Enter all fire with
  nothing focused. Retry is now a real always-visible button (`:380-387`),
  not shortcut-only. Note the Hint shortcut's *displayed* badge is `⌘I`, not
  `⌘H` (`CodePuzzle.tsx:394-403`) — a documented, deliberate deviation from
  the user's own "⌘H" example, because Cmd+H is unconditionally "Hide
  `<App>`" at the OS/browser-chrome level on macOS and can never reach page
  JS; `'h'` is still silently accepted as a harmless fallback
  (`TriviaSession.tsx:225`).
- *Does whitespace-tolerant grading actually run end-to-end from the real
  submit path, not a stale copy?* Confirmed by tracing the call graph, not
  assuming it: `TriviaSession.handleCheck` (`:170-175`) builds `submission`
  from live `filled`/`typed`/`revealed` state and calls the real
  `gradeRound` (imported from `triviaEngine.ts`) both for its own local
  grade-coloring state and via `onSubmit(submission)`, which
  `routes/trivia.tsx:handleSubmit` (`:210-218`) also feeds straight into the
  same `gradeRound`/`isAnswerCorrect` for progress recording. Both call
  sites resolve to the one exported function in `triviaEngine.ts:280-281` —
  grepped for any second `.trim()`/regex comparison anywhere in
  `CodePuzzle.tsx`/`TriviaSession.tsx`/`routes/trivia.tsx`; none exists.
- *Does "raise the level without losing progress" work through the real UI
  path, not just a unit test?* Traced the full chain:
  `TriviaSettings.tsx`'s "Hardest level" `Slider` → `handleMax` (`:66-68`) →
  `onChange({ maxBlanks })` → `routes/trivia.tsx`'s `applyConfig` (`:196-208`,
  wired at `:335`) → `reviveProgressForConfig` (reference-identity check) →
  `applySessionPatch` → `updateSession`. For the ordinary (non-completed)
  case this sends `{ config }` alone, never naming `progress`, so
  `drilled`/`stats` cannot be touched even in principle. For a
  previously-completed session, `reviveProgressForConfig` (`:103-125`) calls
  the real `isLevelCovered(progress, sources, level)` (verified against its
  actual exported signature in `triviaEngine.ts:101-112`) to decide whether
  raising the ceiling reopens drilling, and only overwrites
  `completed`/`level`, never `drilled`/`stats`.

**Verification commands run directly by this gate (not reproduced from a
transcript):**
- `bun run typecheck` → clean, zero errors, whole repo.
- `bun run lint` (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`) → clean, zero warnings/errors, whole repo.
- `bunx vitest run src/components/primitives/specs src/components/trivia/specs src/routes/specs/trivia.render.spec.tsx src/trivia/specs/triviaEngine.spec.ts src/trivia/specs/triviaSessions.spec.ts src/trivia/specs/triviaStorage.spec.ts src/trivia/specs/triviaFlow.spec.ts` → **28 test files, 426 tests, all passing.**

**Outcome:** every distinct demand in section 0 was matched to working,
tested, currently-live code. No gap was found that required a code fix at
this gate. Sections 1–6 above already reflect per-item file:line evidence
from the lane reviewers; this pass independently reproduced that evidence
rather than re-deriving new checkboxes, and additionally closed the two
process items (7.2, 7.3's cross-lane note) that were open or incomplete.
