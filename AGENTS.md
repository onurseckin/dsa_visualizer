<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `bunx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

# AGENTS.md — Contributor Playbook for the DSA Visualizer

Welcome, AI agent or developer. This file is the **single onboarding source** for this
repository: it documents the stack's provenance, the architecture as it exists today,
and — most importantly — a complete end-to-end playbook for adding a new algorithm
("problem") so that a future contributor can ship one from this file alone.

The app is a fully client-side SPA: React 18 + TypeScript 5.3 + Vite 5, TanStack
Router (file-based routes), vitest + jsdom for tests, **bun** for all scripts, plain
CSS design tokens for styling. There is no server, no database, no environment
variables, and no secrets.

Eight cross-cutting systems deserve reading before you touch anything: the **canvas
geometry law** (section 2.8), the **inverted surface hierarchy** (section 2.5), the
**colour policy** (section 2.5), the **workspace anatomy** — tutorial header, working
data, canvas, docked controls inside one panel (section 2.7), **persistence and the
navbar reset** (section 2.2), the **global keyboard shortcuts** (section 2.12), the
**step engine** (section 2.10), and the **trivia drill** — the `/trivia` code-occlusion
study view and the optional per-algorithm metadata that sharpens it (section 2.13, and
section 4.11 when you are adding a problem). The full design rationale lives in
`docs/planning/ui-overhaul/DESIGN.md`; **later rounds win wherever they overlap earlier
ones.** Its **"Round 6"** section is authoritative for surfaces and colour — it supersedes
the Round 5 surface values (surfaces are now inverted), the Round 5 achromatic sweep
(colour came back on badges and the knowledge map), and the Round 5 panel order (the
tutorial is the panel header now, not a bottom strip). **"Round 8"**, the last section in
the file, is the spec for the trivia drill (section 2.13).

Eight rules are the ones most likely to trip you up, so they are stated up front and
repeated in context below:

1. **THE CANVAS LAW: `viewBox = boxViewBox(measuredBox)` and the `<svg>` is
   `width="100%" height="100%"`.** User units are CSS pixels, so the viewBox and the
   element can never disagree and `preserveAspectRatio` has nothing to letterbox. Every
   visualizer lays out in real pixels and must spread across **both** axes. **Vertical
   dead space must be zero**; slack a shape constraint cannot spend goes horizontal and
   centred (section 2.8).
2. **Two failure modes are forbidden by name, because both shipped and both were wrong:**
   a viewBox from fixed constants inside a 100%-sized svg (dead bands _inside_ the svg),
   and sizing the svg to the content's aspect ratio (`fitBox` — deleted; it moved the
   identical bands _outside_ the svg into the panel). Never reintroduce either
   (section 2.8).
3. **Surfaces are INVERTED: cards are darker than the page.** The page is carbon
   `#17171b`, cards and panels are near-black `#0a0a0c`, wells are `#050506`, and
   controls raised on a card step _lighter_. Reading happens on the cards, so the cards
   are where the eye rests (section 2.5).
4. **Every card, panel, well, chip and button MUST carry a visible border token.** The
   ladder steps are small and the interactive tier sits _above_ the reading tier, so
   borders carry the edge definition. A borderless container is a bug, not minimalism
   (section 2.5).
5. **Primary buttons are black-filled** (`--bg-inset` fill, `--accent` border,
   `--text-primary` ink) — never a light slab (section 2.5).
6. **Colour is neutral-by-default with exactly three exceptions**: difficulty/status
   badges (semantic tokens), `--viz-1..8` identity in graphs, trees and the knowledge
   map, and `--state-*` algorithm marks inside visualizers. Chrome, panels, inputs,
   toolbars and body text stay neutral (section 2.5).
7. **React component specs are named `*.spec.tsx` (do NOT use `.render.spec.tsx`).** If a
   `.spec.ts` (pure TS logic) exists in the same directory, use a distinct descriptive
   basename for the component spec (e.g. `quickSortRender.spec.tsx`) to avoid duplicate
   basename collisions in TypeScript (section 4.10 and section 6).
8. **There is no `ViewMode` in the workspace**, and **"Reset layout" lives in the
   NAVBAR**, behind `ConfirmDialog`. Panel visibility is four independent booleans driven
   by five identical navbar toggles (section 2.11); the layout reset clears one versioned
   key and announces it on a window event (sections 2.2 and 2.11).

---

## 1. Scaffolding & Stack Provenance

This repo predates its TanStack scaffolding; the scaffold output was merged in, not
used as the starting point. Knowing what came from where prevents accidental
"upgrades" that break deliberate decisions.

**Scaffold command:**

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --package-manager pnpm --tailwind
```

(run in a scratch directory; output merged into this pre-existing repo).

**Intent commands:** `npx @tanstack/intent@latest install` (wired the skill block into
AGENTS.md — the block at the top of this file; preserve it verbatim) and
`npx @tanstack/intent@latest list`; skills are loaded per-task via
`bunx @tanstack/intent@latest load <pkg>#<skill>` (12 router skills ship with the
installed packages — 10 under `@tanstack/router-core#router-core` and its sub-skills,
1 in `@tanstack/router-plugin`, 1 in `@tanstack/virtual-file-routes`).

**Merged from the scaffold:**

- `@tanstack/react-router` + file-based routes in `src/routes` with generated
  `src/routeTree.gen.ts`.
- `@tanstack/router-plugin` in `vite.config.ts` (**MUST stay before the react
  plugin** — wrong order fails silently).
- `@tanstack/router-cli` via `bun run generate-routes`, plus `tsr.config.json`
  (`{ "target": "react" }`).
- `.cta.json` (scaffold provenance record — do not delete).
- `@tanstack/react-router-devtools` (dev only; lazily imported in
  `src/routes/__root.tsx`, gated on `import.meta.env.DEV && MODE !== 'test'`).
- Tailwind v4 via `@tailwindcss/vite` + `@tailwindcss/typography` — **theme +
  utilities only, NO preflight** (preflight would reset the token-styled `ui.css`
  components), with tokens bridged into Tailwind via `@theme inline` in
  `src/styles/index.css`.

**Deliberately NOT adopted (do not "fix" these):**

- **TanStack Start SSR (`@tanstack/react-start`)** — this is a fully client-side SPA
  (visualizations, no server data; static `dist` deploy). SSR adds machinery with no
  payoff here.
- **React 19 / Vite 8 / TS 6 from the scaffold** — repo stays React 18 / Vite 5 /
  TS 5.3 to keep the 600+-test vitest stack stable (future upgrade candidates; see
  section 9).
- **pnpm** — repo uses bun (`bun.lock`). Never introduce npm/pnpm/yarn lockfiles.
- **`@tanstack/devtools-vite`** — requires Vite >= 6.

**Environment variables:** none required (no secrets; fonts load from the Google
Fonts CDN via `index.html`). The only env usage is `import.meta.env.DEV` (plus
`MODE !== 'test'`) gating the router devtools in `src/routes/__root.tsx`.

**Deployment:** `bun run build` (runs `tsc && vite build`) → static `dist/`, deploy
to any static host.

**Scripts** (always via bun):

| Command                   | What it does                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| `bun run dev`             | Vite dev server (agents: don't run this — the user verifies UI)  |
| `bun run typecheck`       | `tsc --noEmit`                                                   |
| `bun run generate-routes` | `tsr generate` — regenerates `src/routeTree.gen.ts`              |
| `bun run lint`            | ESLint, zero warnings allowed                                    |
| `bun run test`            | Full vitest run (~760 tests in 114 spec files — final gate only) |
| `bunx vitest run <paths>` | Scoped test run — **use this during iteration**                  |
| `bun run build`           | `tsc && vite build` → `dist/`                                    |
| `bun run check`           | typecheck + lint + full tests + build — the master quality gate  |

---

## 2. Architecture Map

```
src/
├── main.tsx                      # StrictMode + RouterProvider entry
├── router.tsx                    # createRouter({ routeTree, scrollRestoration, defaultPreload: 'intent' })
├── routeTree.gen.ts              # GENERATED by TanStack Router — never hand-edit
├── routes/                       # File-based routes (filenames define paths)
│   ├── __root.tsx                # SettingsProvider + Navbar shell + <Outlet /> + dev-only devtools
│   ├── index.tsx                 # "/"          → KnowledgeGraph roadmap page
│   ├── problems.tsx              # "/problems"  → ProblemList, ?category= search param
│   ├── trivia.tsx                # "/trivia"    → code-occlusion drill (section 2.13); the
│   │                             #                ONLY stateful piece of that feature
│   ├── workspace.index.tsx       # "/workspace" → redirects to /workspace/bubble-sort
│   ├── workspace.$algorithmId.tsx# "/workspace/:id" → workspace + playback keyboard shortcuts
│   └── specs/
│       └── trivia.render.spec.tsx# Route spec: deck → session → grade → reset
├── app/
│   ├── SettingsContext.tsx       # Persisted PanelVisibility + lastAlgorithmId (localStorage)
│   ├── workspaceLayout.ts        # Versioned persisted workspace state, v6 (+ detailsExpanded)
│   ├── keyboardGuards.ts         # isTypingTarget / isDialogOpen — shared by every global shortcut
│   ├── categories.ts             # CATEGORIES list (25 canonical) + isCategoryType() guard
├── engine/
│   ├── stepEngine.ts             # useStepEngine hook: playback state machine + dedupe contract
├── trivia/                       # The code-occlusion drill's brain (section 2.13) — FINISHED
│   ├── triviaEngine.ts           # Pure, React-free, RNG-injectable drill logic + grading
│   ├── triviaStorage.ts          # Two versioned localStorage keys, validate-on-read
│   └── specs/                    # triviaEngine / triviaStorage / triviaFlow (end-to-end)
├── types/
│   ├── dsa.ts                    # ALL core interfaces & union types (incl. `trivia?: TriviaMeta`)
│   └── trivia.ts                 # Trivia contracts: config, round, progress, grade, TriviaMeta
├── styles/
│   ├── theme.css                 # Design tokens — the ONLY place raw color/size values live
│   ├── ui.css                    # UI library classes (`ui-` prefix) + shared .ui-chip/.ui-code-line
│   └── index.css                 # Token/ui imports, Tailwind theme+utilities, @theme bridge, resets
├── ui/                           # Reusable UI component library (barrel: ui/index.ts)
├── components/
│   ├── KnowledgeGraph.tsx        # SVG prerequisite roadmap (TOPIC_ROADMAP_NODES, one --viz slot/family)
│   ├── MainLayout.tsx            # Workspace shell: header strip, sized stage, ONE visualizer container
│   ├── Navbar.tsx                # App-view Segmented, five uniform toggles, Reset layout, "/" search
│   ├── SearchTrigger.tsx         # Input-lookalike button that opens the search drawer
│   ├── QuickAccessDrawer.tsx     # Drawer-based algorithm search & category browser
│   ├── ControlPanel.tsx          # Play/pause, step, reset, speed, size (embedded|standalone) + key hints
│   ├── ComplexityCard.tsx        # Big-O chips + plain-English complexity prose (Collapsible)
│   ├── ResizableLayout.tsx       # ResizableLayout (columns) + ResizableRows (hug/greedy/pinned rows)
│   ├── ProblemList.tsx           # Flat problem listing with category filter + coloured status badges
│   ├── trivia/                   # Presentational drill UI (section 2.13) — no engine state
│   │   ├── TriviaDeckBuilder.tsx # Registry multi-select with quick multi-add + per-category counts
│   │   ├── TriviaSettings.tsx    # Mode, minBlanks/maxBlanks sliders, distractors on/off
│   │   ├── TriviaSession.tsx     # One round: fill → check → next; owns the board, not the grading
│   │   ├── CodePuzzle.tsx        # The solution as a board: visible lines read, blanks become slots
│   │   ├── TileTray.tsx          # Shuffled candidate tiles; click-then-click, drag optional
│   │   └── specs/*.spec.tsx      # One spec per component (unique basenames — section 4.10)
│   └── primitives/               # Visual render primitives
│       ├── ArrayVisualizer.tsx   # kind: 'array' — bars span the width, tallest bar spans the band
│       ├── GridVisualizer.tsx    # kind: 'grid'  — square cells sized from the HEIGHT
│       ├── GraphVisualizer.tsx   # kind: 'graph' — spreadToBox for authored x/y, ellipse otherwise
│       ├── TreeVisualizer.tsx    # kind: 'tree'  — tidy slots stretched across the measured box
│       ├── vizGeometry.ts        # THE canvas geometry law: boxViewBox, spreadToBox, ellipsePoints…
│       ├── vizPalette.ts         # --viz-1..8 slot helpers + connected-component derivation
│       ├── AuxiliaryPanel.tsx    # "Working data" chip rows — a strip under the tutorial header
│       ├── TutorialCard.tsx      # The visualizer panel's HEADER: readable step prose
│       ├── CodeBlockViewer.tsx   # Python code viewer (hugs the listing), active line, Vars strip
│       └── ProblemHeader.tsx     # Title + badges + full-width details/lesson (controlled, persisted)
└── algorithms/                   # 25 category folders, 40 algorithm definitions
    ├── registry.ts               # ALGORITHM_REGISTRY: Record<id, AlgorithmDefinition>
    └── <category>/
        ├── <algorithmName>.ts    # Definition + Python code string + step generator
        └── specs/
            ├── <algorithmName>.spec.ts          # Pure step-generator invariants
            └── <algorithmName>.render.spec.tsx  # MainLayout render spec — NOTE the
                                                 # `.render.` segment; a bare
                                                 # `<algorithmName>.spec.tsx` next to a
                                                 # `.spec.ts` is silently dropped from
                                                 # typecheck (sections 4.10 and 6)
```

### 2.1 Routing & navigation flow

Routes are **file-based**: the filename defines the path (`workspace.$algorithmId.tsx`
→ `/workspace/:algorithmId`). The `@tanstack/router-plugin` in `vite.config.ts`
regenerates `src/routeTree.gen.ts` during dev/build; `bun run generate-routes` does it
on demand. Never hand-edit `routeTree.gen.ts` or the path string inside
`createFileRoute('...')` — the plugin owns both.

- **`__root.tsx`** wraps everything in `SettingsProvider`, renders the `Navbar`, and
  derives the active app view purely from the pathname (`/` → tree, `/problems*` →
  list, otherwise workspace). Navbar view switches call `navigate()`; selecting an
  algorithm anywhere calls `setLastAlgorithmId(id)` then navigates to
  `/workspace/$algorithmId`.
- **`index.tsx`** renders the `KnowledgeGraph`; clicking a roadmap node navigates to
  `/problems?category=<folder>`.
- **`problems.tsx`** owns the only search param in the app: `?category=`. Its
  `validateSearch` narrows through `isCategoryType()` from `src/app/categories.ts`;
  unknown or alias values collapse to "no filter" instead of erroring, so mistyped
  shared URLs still load the full list. Filter changes push (not replace) history
  entries.
- **`trivia.tsx`** renders the code-occlusion drill (section 2.13). No params, no search
  params: the deck, the settings and the progress all come from `localStorage` through
  `src/trivia/triviaStorage.ts`, read during the _first_ render (not in an effect, which
  would paint an empty deck for a frame and read as "my progress is gone"). `AppView`
  includes `'trivia'` and `Navbar`'s app-view `Segmented` carries the fourth option, so
  the pathname ↔ view mapping in `__root.tsx` and the `navigate()` for it live there like
  the other three views.
- **`workspace.index.tsx`** statically redirects to `/workspace/bubble-sort`
  (hooks are unavailable in `beforeLoad`; navbar-driven navigation supplies the
  persisted `lastAlgorithmId` itself).
- **`workspace.$algorithmId.tsx`** guards in `beforeLoad`: an id missing from
  `ALGORITHM_REGISTRY` redirects to `bubble-sort`, so the component can look up the
  registry unconditionally. It wires `useStepEngine`
  (section 2.10), the global playback keys (section 2.12), and the random-input
  controls, then renders `MainLayout`. **Adding an algorithm requires zero route
  changes** — `/workspace/$algorithmId` resolves any registry id.

### 2.2 Persistence: settings and workspace state

Three independent localStorage layers, all defensive — reads validate and fall back,
writes are best-effort, nothing throws into render. Settings and workspace geometry are
below; the trivia keys are the third layer and follow the same discipline (section 2.13).

**`src/app/SettingsContext.tsx`** holds `panels: PanelVisibility` (the four independent
panel booleans — section 2.11) and `lastAlgorithmId`, and exposes
`setPanel(key, visible)` / `togglePanel(key)` /
`setLastAlgorithmId`. Every value is initialized from `localStorage` (keys prefixed
`dsa_visualizer_`) through a validating `readStored(key, fallback, guard)` helper —
reads that throw or contain garbage fall back to defaults; `writeStored` is
best-effort so in-memory state stays authoritative. `useSettings()` throws outside the
provider.

Panel keys are stored one boolean each: `panel_visualizer`, `panel_code`,
`panel_tutorial`, `panel_auxiliary` (plus `last_algorithm_id`).
**Legacy settings migrate on read, in `readPanelVisibility()`:** the pre-R4.4
mutually exclusive `view_mode` value is mapped through `LEGACY_STAGE_PANELS`
(`split` → visualizer+code both on, `visual` → visualizer only, `code` → code only)
and used as the _fallback_ for the two stage panels, while the old independent
`show_tutorial` / `show_auxiliary` flags fall through 1:1. A stored new-style key
always wins over the legacy fallback. `ViewMode` still exists in `src/types/dsa.ts`
**only** so this migration can type its input — no component takes it as a prop.

**`src/app/workspaceLayout.ts`** owns every _manual adjustment to the workspace_ under
**one versioned key**, and **v6** adds `detailsExpanded` to the geometry, because
whether the lesson panel is open is a manual adjustment like any drag (R6.5) rather
than something that should snap back to open on every reload:

```ts
export const WORKSPACE_LAYOUT_KEY = "dsa_visualizer_workspace_layout_v6";
export const WORKSPACE_LAYOUT_VERSION = 6;
export const WORKSPACE_LAYOUT_RESET_EVENT = "dsa:workspace-layout-reset";

export interface WorkspacePanelHeights {
  visualizer: number | null;
  code: number | null;
  complexity: number | null;
}

export interface WorkspaceLayout {
  version: typeof WORKSPACE_LAYOUT_VERSION;
  splitPercent: number; // left column width %
  panelHeights: WorkspacePanelHeights; // null = automatic (hug / absorb leftover)
  detailsExpanded: boolean; // is the problem/lesson panel open
}
```

- **`null` means "size itself" (hug its content, or absorb the column's leftover
  space); a number means "the user dragged this panel to this pixel height".**
  Defaults are `splitPercent: 70` — the visualizer is the stage the learner watches, so
  it gets the bulk of the width — every panel `null`, and `detailsExpanded: true` (a
  first visit should not have to hunt for the lesson).
  `DEFAULT_WORKSPACE_LAYOUT` is exported **frozen** — call `cloneWorkspaceLayout()`
  for a writable copy. `WORKSPACE_PANEL_KEYS` is the canonical iteration order, and the
  `tutorial`/`auxiliary` slots are deliberately absent: those strips live _inside_ the
  visualizer panel, so they have no handle and no height of their own to remember.
- Bounds: `MIN_SPLIT_PERCENT` 25 / `MAX_SPLIT_PERCENT` 80,
  `MIN_PANEL_HEIGHT_PX` 64 / `MAX_PANEL_HEIGHT_PX` 2000 — the same bounds the reader
  validates against, so every drag stays storable. `clampPanelHeight` keeps `null`
  as `null` and degrades a non-finite number to `null` (automatic) rather than to a
  number.
- In a `WorkspaceLayoutPatch`, an **absent/`undefined`** panel key means "leave it
  alone" while an explicit **`null`** means "put this panel back on automatic".
  `detailsExpanded` is merged with `??`, never `||` — collapsing the panel patches an
  explicit `false`, which `||` would silently discard.
- `readWorkspaceLayout()` **never throws**: unreadable storage, malformed JSON, a
  stale `version` (v3 weights, v4's five panels, v5's missing `detailsExpanded` — all
  of them), a non-boolean `detailsExpanded`, NaN, or out-of-range numbers all yield
  defaults, and the result is rebuilt field by field so unknown keys in storage never
  reach app state. Old payloads are **ignored, not migrated** — a shape change
  invalidates them wholesale.
- `writeWorkspaceLayout(patch)` merges the patch onto what is stored, clamps, writes
  best-effort, and returns the merged layout (callers set state from the return value).
- `clearWorkspaceLayout()` is the **only** thing that removes the key. Because the key
  is otherwise never cleared, custom sizes and the details state survive reloads **and**
  dev-server restarts. Never add another code path that removes it.
- `resetWorkspaceLayout()` is the whole confirmed reset in one call: it clears the key,
  dispatches `WORKSPACE_LAYOUT_RESET_EVENT` on `window`, and returns the defaults. It
  exists because **the reset button lives in the navbar while the layout state lives in
  `MainLayout`** (R6.5) — the two are joined by that window event rather than a shared
  React parent, and keeping the clear and the announcement in one function is what stops
  them drifting apart. `MainLayout` listens for the event and re-reads storage, so a
  reset takes effect live instead of only after a reload.

`MainLayout` restores everything on mount with `useState(() => readWorkspaceLayout())`
and drives `ProblemHeader`'s `expanded` prop plus the `data-details-expanded` attribute
on `<main>` from `layout.detailsExpanded`. Toggling Details writes the patch
immediately; drags report live changes and persist once on commit.

One versioned key (rather than a key per handle) is deliberate: a shape change
invalidates the old data wholesale instead of half-applying it. Version bumps mean
bumping the key suffix too.

### 2.3 stepEngine — the playback state machine and its dedupe contract

`useStepEngine({ steps, onStepChange, defaultSpeed })` in
`src/engine/stepEngine.ts` returns `{ currentStepIndex, currentStep, totalSteps,
isPlaying, speed, play, pause, togglePlay, stepForward, stepBackward, goToStep, reset,
setSpeed }`.

Design points that must not be broken:

- **Refs, not deps**: `steps` and `onStepChange` live in refs so the interval effect
  never churns on new callback identities.
- **Dedupe contract**: `onStepChange` fires from one dedicated effect, and only when
  `currentStepIndex` differs from `lastNotifiedIndexRef`. The ref initializes to `0`,
  so the initial index-0 render **never** notifies (nothing fires on page load), and
  StrictMode's double-invoked effects cannot double-fire. When the `steps` array
  identity changes (new algorithm / new input), the engine resets to index 0, stops
  playback, and pre-marks index 0 as notified so the switch is silent.
- Playback is a plain `setInterval(speed)` that auto-pauses at the last step;
  `play()` from the last step restarts at 0. The speed slider bottoms out at 50ms,
  which is what the playback interval floor is sized against.

The workspace route layers a second dedupe (`lastHandledStepRef`) inside its
`handleStepChange`, plus `prevHandledStepRef` holding the step the listener last
heard — cue classification is a delta against that step, not against the render's
previous props. Both refs reset when the `steps` identity changes so a baseline never
leaks across runs, and `prevHandledStepRef` is updated **even while muted** so
a re-render resumes from a valid baseline. **Never trigger side effects from
render or from ad-hoc effects** — always go through `onStepChange` so both dedupe
layers apply.

### 2.5 The surface law: cards are DARKER than the page, and colour is earned

`src/styles/theme.css` is **finished and read-only**, and it is the only place raw
color/size values live. Every value in it was verified numerically, not by eye: the
WCAG contrast ladder (text primary ≥11.6:1 on every surface it is used on), the surface
luminance steps, border contrast against both the card and the page, and the categorical
gates for `--viz-1..8` (OKLCH lightness band, chroma floor, protan/deutan/tritan
separation, 3:1 vs surface). **Because the values are a validated system, they must never
be hand-tweaked** — not in theme.css, not as one-off hexes in a component. A "small
nudge to make it pop" invalidates the gates. If a colour seems missing, the answer is an
existing token, not a new value.

**THE SURFACE LAW (R6.2): the hierarchy is inverted — the reading surfaces are the
darkest, and the page is the interactive backdrop they sit on.**

| Token           | Value     | Role                                                    |
| --------------- | --------- | ------------------------------------------------------- |
| `--bg-inset`    | `#050506` | deepest: code wells, SVG canvases, inputs               |
| `--bg-surface`  | `#0a0a0c` | cards and panels — **near-black, darker than the page** |
| `--bg-page`     | `#17171b` | the page itself — **carbon**, the backdrop              |
| `--bg-chrome`   | `#1c1c21` | navbar, toolbars, the in-panel strips                   |
| `--bg-elevated` | `#1e1e24` | controls raised on a card: buttons, chips               |
| `--bg-hover`    | `#282830` | hover                                                   |
| `--bg-pressed`  | `#32323b` | pressed                                                 |

**Why inverted, and why not to "fix" it:** the learner reads code, tutorial prose and
the topic guide for long stretches, and those all live on cards — so the cards are the
calm, dark places the eye rests, while the page around them is carbon and the _controls_
step lighter as they rise off the card. That is the opposite of the conventional
"elevation = lighter" ladder, and it is deliberate. `--bg-backdrop` dims behind drawers
and dialogs.

**CRITICAL — borders carry the edge definition.** Adjacent tiers in the interactive
range sit close together (`--bg-chrome` → `--bg-elevated` is only ~1.13× in relative
luminance, `--bg-elevated` → `--bg-hover` ~1.6×), and every reading surface is
near-black, so a container's shape has to come from an **edge**, not from fill contrast:
**every container, card, panel, well, chip and button MUST carry a visible border
token.** A borderless panel does not look minimal, it disappears. The verified border tones are
`--border-subtle` `#2a2a31` (internal dividers inside an already-bordered card),
`--border-default` `#50505b` (2.49:1 vs card, 2.25:1 vs page — ordinary containers and
controls), `--border-strong` `#75757f` (4.34:1 vs card — hovered or emphasized
boundaries), `--border-accent` `#d8d8e0`. Several `ui.css` defaults land on
`--border-subtle`, which nearly vanishes against a near-black card, so the app components
that nest chips or wells inside a panel deliberately promote the inner edge to
`--border-default` (`CHIP_BORDER` in `ComplexityCard`, `PANEL_BORDER` in `ProblemHeader`
and `ProblemList`, the same promotion in `AuxiliaryPanel` and `ControlPanel`'s step
readout). Follow that when you add one.

**Accent is light smoke `#d8d8e0`** (`--accent`, with `--accent-hover` `#f2f2f6`,
`--accent-soft`, `--accent-softer`, `--text-on-accent`, `--accent-secondary`). It marks
interaction and selection only. Selected = `--accent-soft` background +
`--border-accent` border + `--accent` text.

**Primary buttons are BLACK-FILLED, not a light slab.** `.ui-btn--primary` is
`--bg-inset` fill + `--accent` border + `--text-primary` ink at weight 600; hover fills
`--bg-surface` and brightens the border to `--accent-hover`. The accent token is the
_edge and ink_ on a primary button, never its fill — a bright fill on this palette reads
as a hole punched in the page.

**Text pairing rules (AA, non-negotiable):** `--text-primary` `#f5f5f7` for headings and
values, `--text-secondary` `#c6c6cd` for body, `--text-muted` `#9e9ea7` for labels,
`--text-faint` `#7d7d86` for placeholders and disabled only. **Never put `--text-muted`
or `--text-faint` on `--bg-hover` or `--bg-pressed`** — they lose contrast on the
lighter smokes. Hover and pressed states use `--text-secondary` or `--text-primary`.

#### The colour policy (R6.3) — neutral chrome, colour where it carries meaning

The Round 5 achromatic sweep went too far and stripped colour that was doing real work.
The policy now is: **chrome, panels, inputs, toolbars, drawers and body text are
neutral**, and hue appears in exactly three places — all three of them _data_:

1. **Difficulty and status badges.** `difficultyBadgeVariant(difficulty)` →
   Easy=`success`, Medium=`warning`, Hard=`danger`, and count/status badges use the
   semantic variants too (`ProblemList`'s header renders `info` for the total beside
   the three difficulty counts). `ProblemList`, `ProblemHeader` and `QuickAccessDrawer`
   all show coloured difficulty badges. Do not neutralize these.
2. **The categorical `--viz-1..8` palette** — identity/groups in `GraphVisualizer`,
   `TreeVisualizer`'s `groups` prop, and the **knowledge map**, where
   `KnowledgeGraph.TOPIC_FAMILIES` assigns one fixed slot per topic family and tints
   every node, edge and legend entry from it (section 2.9). The knowledge map's full
   cluster colouring stays exactly as it is; only the shell around it (headers, hints,
   buttons) is neutral.
3. **Algorithm-state marks** — `--state-*` on elements _inside_ a visualizer
   (`GridVisualizer` also reuses `--state-sorted`/`--state-swap` for start/end cells).

Anything else coloured is a bug: a tinted panel, a hued heading, an accent-coloured
toolbar. `ElementState` tokens stay **semantic** (what the algorithm is doing, not what a
thing is), and untouched elements sit on neutral `--state-default` / `--state-default-bg`
so **any** colour at all means "the algorithm acted here". Instead of glows, touched
elements take a heavier stroke — that is how the visualizers keep an untouched element
visibly inactive next to an active one.

Other token groups: semantic feedback (`--success/warning/danger/info` + `-soft`
backgrounds), one `--state-<name>` / `--state-<name>-bg` pair per `ElementState`
(section 3), the categorical `--viz-1..8` set (section 2.9), type scale
(`--text-xs` `0.72rem` … `--text-2xl` `1.4rem`, `--font-ui`, `--font-code`), spacing
`--space-1..8` on a 4px grid, control heights `--control-h-sm/md/lg` (28/34/40px),
layout metrics `--navbar-h` (56px) / `--stage-min-h` (420px) / `--panel-min-h` (200px),
radii, neutral shadows (no coloured glows), `--focus-ring`, transitions, and z-indices
`--z-dropdown/drawer/modal/tooltip`.

`src/styles/ui.css` styles the UI library (`ui-` prefix, BEM-ish: `.ui-btn--primary`,
`.ui-btn--selected`, `.ui-dialog`) plus the shared classes `.ui-code-line`,
`.ui-code-line--active`, `.ui-chip`. `src/styles/index.css` imports theme + ui, then
Tailwind **theme and utilities layers only** (no preflight), bridges tokens into
Tailwind via `@theme inline` (`--color-page: var(--bg-page)` etc.), and defines global
resets, focus-visible, selection, and scrollbar styling. Both files are finished —
read, don't edit.

Rule: **never hardcode hex/rgba colors or ad-hoc pixel/rem sizes in components** —
always `var(--token)`.

### 2.6 Search flow

The navbar renders `SearchTrigger` — a button styled like an input
(`🔍 Search algorithms… ⟨/⟩` with a `Kbd` chip). Clicking it, or pressing `/`
anywhere outside an input/textarea/select/contenteditable with no dialog open
(section 2.12), opens `QuickAccessDrawer` (built on `ui/Drawer`; ESC or backdrop click
closes). The drawer holds an autofocused `Input` at the top, then one `Collapsible` per
category with a count `Badge`; the active algorithm's category starts open. While
searching, only matching categories render, auto-expanded. The selected row uses the
standard selected treatment plus a check icon; every row shows a coloured difficulty
`Badge`. There is no dropdown-results search anywhere — the drawer owns all searching,
and `GlobalSearchBar` is gone.

### 2.7 Workspace anatomy: one stage container, tutorial first, a hugging code column

There is **no layout mode switch**. One system handles every viewport.

**The left column is ONE container.** `MainLayout` renders a single
`Card data-panel="visualizer"` and everything about the current step lives _inside_ it.
Top to bottom (R6.4 — the tutorial moved from the bottom to the top):

1. `data-region="tutorial"` — the teacher explanation, **as the panel's header**.
2. `data-region="working-data"` — the auxiliary/working-data strip beneath it.
3. `data-region="canvas"` — the visualization, taking all remaining height.
4. `data-region="controls"` — `ControlPanel variant="embedded"`, docked at the very
   bottom edge.

**Why this shape**, and why not to undo it: the panel's _outer_ size is stable, so a
step that adds an aux row or a longer sentence never resizes or reflows the surrounding
layout (no width/height twitching between steps), and the learner reads the explanation
first, then sees the working data and the graph together without scrolling. **The canvas
is the only flexible region** — it absorbs the content deltas.

Mechanics worth knowing before you touch them:

- Both strips live inside one `data-band="step-context"` wrapper capped at
  `STEP_BAND_MAX_HEIGHT` (**45%** of the panel) with `overflow: hidden`; each strip is
  `overflow-y: auto`. They are capped **together** on purpose: two strips each free to
  take 38% would leave the canvas a quarter of the panel. Because the cap is a share of
  the panel, no step can move the panel's outer size — only the canvas boundary inside
  it. Inside the band the tutorial is the greedy strip (`flex: 1 1 auto`, it absorbs the
  squeeze) and the single-row working-data strip keeps its size (`flex: 0 0 auto`).
- The local `PanelStrip` helper owns the _whole_ separation from what follows it: a
  `--bg-chrome` band fill plus one `--border-subtle` divider on the bottom edge. Every
  strip is above the canvas now, so every divider faces down; the last strip drops its
  divider when there is no canvas beneath it to divide from. `TutorialCard` and
  `AuxiliaryPanel` therefore render **border-free, radius-free, shadow-free** inside it
  (`borderWidth: 0`, `borderRadius: 0`, transparent background) so each seam is exactly
  one line. The band is the chrome tier because the working-data chips are
  `--bg-elevated` and would dissolve into an equally elevated band.
- **The tutorial is sized as prose, not as a caption (R6.4).** `TutorialCard` sets the
  body at `--text-md` with `line-height: 1.6`, `--space-3` padding, the `what` as a bold
  `--text-primary` lead-in sentence followed by the `why` in `--text-secondary`, a
  `--text-md` step counter, and a reserved `min-height` of two lines so the canvas
  boundary stops jumping when one step's sentence wraps differently from the last. It
  uses `--text-xs` **nowhere**, never truncates (no ellipsis, no line clamp, no
  `nowrap` on the prose), and its dismiss control is a bordered `IconButton` (a ghost
  button is invisible on this palette).
- `panels.tutorial` / `panels.auxiliary` toggle the strips. A strip also requires the
  current step to actually have content for it — `MainLayout` asks the components' own
  predicates, `hasTutorialContent(...)` and `hasAuxiliaryContent(...)`, because an empty
  strip would be dead space with a divider. Hiding one gives its space to the canvas and
  renders **no wrapper, divider or gap** at all.
- The visualizer row is visible while _any_ of the canvas or the two strips is on, and
  it is `greedy` only while the canvas is there to absorb leftovers; with the canvas
  toggled off the panel is just its strips and hugs them.

**The right column hugs its content.** `code` and `complexity` are both non-greedy
rows: `CodeBlockViewer` shows the solution **in full** with no trailing empty space and
no internal scroll while it fits (its listing is `flex: 0 1 auto` — shrinkable, never
greedy), and `ComplexityCard` sits **immediately below** the last code line, so a short
solution pulls it up instead of leaving a gap. When the two together exceed the column
height, the **column** scrolls (`ResizableRows` is `overflow-y: auto`) — the panels
themselves do not.

**Smart responsive rule (never block page scroll).** `MainLayout`'s `<main>` always
keeps `overflow-y: auto`; the page is allowed to scroll in every state. The stage sizes
itself from the viewport with a floor:

```
stage height = max(var(--stage-min-h), calc(100dvh - (navbar + collapsed header strip + main padding + gap)))
```

In code that is `STAGE_HEIGHT` in `MainLayout.tsx`, built from `--navbar-h`, the
collapsed header strip (`--control-h-sm` + `--space-2`×2 + the Card's 2px of borders —
the borders must be counted, undercounting by 2px puts a scrollbar on a viewport that
would otherwise fit exactly) and `--space-3`×3. On a tall monitor the subtraction wins
and everything fits with no scrolling; on a short one the floor wins and the page
scrolls. Inner panels keep `min-height: 0` and scroll internally. **Expanding the
details panel adds content above the stage and lets the page scroll — it never shrinks
the stage**, which is why the subtraction always uses the _collapsed_ strip height.

**Row sizing: no panel is given a height it does not need.** Each row in
`ResizableRows` resolves to exactly one of three modes, exposed on the DOM as
`data-height-mode="hug" | "greedy" | "pinned"`:

- **`hug`** (`flex: 0 0 auto`, no `height`) — the row is exactly as tall as its content
  and **reflows automatically as step content changes**. This is the default, and it is
  what both rows of the right column use. Never give a hugging panel a `height`, a
  `min-height` or a flex weight — a short panel with an imposed height is precisely the
  blank filler this design deleted. `CodeBlockViewer`, `ComplexityCard`,
  `AuxiliaryPanel` and `TutorialCard` therefore carry no height of their own, and
  `AuxiliaryPanel` renders only the aux rows that actually have items.
- **`greedy`** (`flex: 1`, `min-height: var(--panel-min-h)`) — absorbs the leftover
  space. There is exactly **one** greedy row in the whole workspace: the visualizer
  panel in the left column.
- **`pinned`** (explicit `flexBasis`/`height` in px, `overflow-y: auto`) — **a user drag
  overrides the automatic sizing for that one panel only.** Everything the user never
  dragged stays automatic. **Double-clicking the handle restores that panel to
  automatic** (`null`), and a keyboard nudge on an automatic row starts from what the
  row currently measures and pins it from there.

A row handle always resizes the row **above** it, whose top edge is anchored — dragging
the row below would chase an edge that moves as the row grows. A pinned row is clamped
so it can never eat the whole column: the ceiling is `available − MIN_PANEL_HEIGHT_PX`,
which keeps its neighbours grabbable. Hidden rows keep their stored height, so toggling
a panel off and back on does not silently discard the size the user dragged it to. The
row container is `overflow-y: auto`: hugging rows never shrink, so a column that
outgrows the stage scrolls instead of squeezing.

**What is resizable.** `ResizableLayout` splits the stage into left (visualizer) and
right (code) columns. `ResizableRows` stacks the rows of a column with a handle between
each adjacent visible pair — but the left column is a **single row**, so it renders no
row handle at all; the only row handle left in the app is the one between `code` and
`complexity`. A stored `visualizer` pin is still honoured on read, and only the column
split changes the left column's geometry interactively. Both components are
**controlled**: `MainLayout` owns the sizes so they can be persisted, and both report a
live `…Change` during a drag plus a single `…Commit` when the drag ends (persisting on
every mousemove would hammer localStorage). Hidden rows render nothing at all — no
wrapper, no gap, no dead handle.

Handles are `role="separator"` with correct `aria-orientation` (`vertical` for the
column split, `horizontal` for row splits), `aria-valuenow/valuemin/valuemax`,
`tabIndex 0`, arrow-key nudges (2% for the column split, 16px for rows), and
**double-click to restore the default** — the default split percent for the column
handle, automatic (`null`) height for a row handle. An automatic row announces
`aria-valuetext="Automatic, sized to content"` instead of a misleading number.
Pointer tracking lives on `window` so a fast drag that leaves the 8px handle keeps
resizing.

**Reset lives in the NAVBAR and requires confirmation (R6.5).** `ProblemHeader` renders
no reset control at all any more — `Details` is its only button. The navbar's
"Reset layout" opens `ConfirmDialog` from `src/ui` (destructive variant;
Escape/backdrop/cancel all back out), and only `onConfirm` calls
`resetWorkspaceLayout()`, which clears the key and announces the reset so the mounted
workspace re-reads defaults live — every panel back on automatic and details back to
expanded. Never wire a one-click reset, and never clear the key from anywhere else.

**Details are controlled, persisted, and expanded by default, at full container
width.** `ProblemHeader` takes `expanded` / `onToggleExpanded`; `MainLayout` sources
that from `layout.detailsExpanded` (default `true`, persisted on every toggle), so the
problem statement, the whole `topicGuide` lesson, key terms, constraints and examples
are visible on first paint — and stay collapsed across reloads and algorithm changes
once the user collapses them. Specs must not click "Details" first (section 4.10). There
is **no readable-measure cap** anywhere in the details panel: prose spans the full width
of its container and stays legible through line-height instead. The two multi-column
blocks — **key terms** (`<dl data-testid="details-key-terms">`) and **examples**
(`data-testid="details-examples"`) — use one shared responsive grid,
`repeat(auto-fit, minmax(min(100%, 22rem), 1fr))`: as many columns as fit, collapsing to
one on narrow containers, with `min(100%, …)` keeping a single column from overflowing a
container narrower than the floor. That `22rem` column floor is the one intentional
non-token measure in the file (the token scale covers spacing and control heights, not
column measures) and it is commented as such — do not copy it as licence for ad-hoc
sizes elsewhere.

### 2.8 The canvas geometry LAW: the viewBox IS the measured box

`src/components/primitives/vizGeometry.ts` is the shared geometry layer all four
visualizers use. **Read the module header before changing anything in a visualizer.**

**THE LAW (R6.1):**

```tsx
const { ref, box } = useCanvasBox(fallbackBox);   // measured client box, in CSS px
…
<div ref={ref} style={{ /* the well: border + --bg-inset, NO padding */ }}>
  <svg width="100%" height="100%" viewBox={viewBoxAttr(boxViewBox(box))} style={{ display: 'block' }} />
</div>
```

`boxViewBox(box)` is literally `0 0 box.width box.height` (each axis floored at 1 user
unit so a not-yet-measured canvas does not collapse). Because the svg is 100%/100% of the
very element that was measured, **user units are CSS pixels**, the viewBox and the element
can never disagree on aspect ratio, and `preserveAspectRatio` has nothing to letterbox.
Empty bands become structurally impossible rather than something to tune away. The
measured element must be the svg's own parent **with no padding** — it carries the
border, `--bg-inset` fill, `border-radius` and `overflow: hidden`, and its client box _is_
the svg viewport.

**The two forbidden failure modes.** Both of these shipped, both were sold as fixes, and
both are banned:

1. **A viewBox built from fixed constants** (a 220-unit bar band, an 84-unit tree level,
   a 900×560 default box) rendered into a 100%-sized `<svg>`. Whenever the fixed ratio
   disagreed with the container's — which it almost always did —
   `preserveAspectRatio="xMidYMid meet"` centred the drawing and painted the leftover as
   inset well: **dead bands inside the svg**.
2. **Sizing the `<svg>` element to the content's aspect ratio** (the deleted `fitBox`
   helper). This did not remove the bands, it _moved_ them: the same empty space
   reappeared **outside the svg, inside the panel**. Whitespace was relocated, not
   deleted — which is exactly the complaint that produced Round 6.

Consequences that follow, and that you must preserve:

- `vizGeometry` exposes **no helper that returns tight content bounds** (`tightViewBox`
  and `fitBox` are gone). Failure mode 1 needed such a helper, so the only viewBox this
  module can produce is the box itself. Do not add one back.
- **Nothing downstream rescales the drawing any more.** Each visualizer must therefore
  fit its content into the measured box itself, and detect the case where its own floor
  binds (a dense array, a grid bigger than the panel) instead of letting content run off
  the canvas edge.
- **Vertical dead space must be zero.** Where a shape constraint genuinely cannot spend
  an axis (square grid cells, a single row of squares, round nodes), the leftover goes
  **horizontal and centred** — never vertical.
- The canvas region must not centre a shrunken child: `data-region="canvas"` in
  `MainLayout` is `flex: 1` with `--space-2` padding, `overflow-x: auto`,
  `overflow-y: hidden`, and **no `alignItems: center`** around the 100%-sized svg. Only
  the "no visual snapshot" empty state centres itself, and it has nothing to squash.
- Every visualizer root is `width/height: 100%`, `minWidth/minHeight: 0`, `flex: 1 1
auto`, with **no height of its own**. The only `minHeight` allowed around a canvas is
  `0` (the flexbox shrink enabler).

**How each kind spreads across both axes** (this is the per-visualizer half of the law):

- **Array** (`ArrayVisualizer`): `barRun()` spends the full width — leftover width goes
  into the bars first (`fitSlots` between `MIN_BAR_W` 10 and `MAX_BAR_W` 160) and then
  into the gaps (up to `MAX_GAP_RATIO` 0.25 of a bar) before any of it is left as margin;
  a dense run gives up its gap before it goes under the bar floor, because clipping bars
  loses data. Vertically, the label insets are capped as a _share_ of the height (pointer
  chips ≤32%, index labels ≤18%) and **the band is every remaining pixel**, with the
  tallest bar spanning it and its baseline at the band's bottom. Type sizes, radii and
  strokes derive from the bar width via `clamp`, so a wide panel gets bigger numbers
  rather than the same small ones with more air. `mode="box"` is the single place vertical
  slack is unavoidable (one row of squares), and it is centred in the band.
- **Tree** (`TreeVisualizer`): with no authored coordinates, `tidyTreeSlots(roots,
childrenOf)` produces an **abstract** layout (fractional leaf column, depth) which
  `spreadToBox` then stretches, so **depths own the full height and leaf slots the full
  width** — a shallow tree fills the canvas instead of stopping at a fixed per-level
  band. The helper is cycle-safe and forest-safe: ids already placed are skipped, so a
  forest keeps all its trees and no node is dropped. Authored coordinates are honoured
  **only when every node has them** (mixing authored and computed positions would
  collide) and get the same `spreadToBox` treatment.
- **Graph with authored `x`/`y`** (`GraphVisualizer`): the points go through
  `spreadToBox(points, box, pad)`, which scales the two axes **independently** so a
  300×100 authored drawing reaches the edges of a 950×520 panel. It is the _positions_
  that stretch — the node radius stays uniform, so no node is squashed. A degenerate axis
  (all points sharing an x, a single node) centres on that axis instead of dividing by
  zero, and float-noise spans below `SPAN_EPSILON` count as degenerate.
- **Graph without coordinates**: `ellipsePoints(count, box, pad)` lays nodes on the
  **ellipse inscribed in the box**, not a circle — a circle takes the smaller axis as its
  diameter and leaves the sides of a wide panel empty, which is the whitespace R6.1
  exists to remove. The ellipse fixes the angular order and `spreadToBox` then pushes the
  extremes onto all four insets (an affine stretch of an ellipse is still an ellipse). A
  pair lies along the box's long axis; a lone node centres. **One node missing its
  coordinates sends the whole graph to the ellipse** — the old per-node fallback dropped
  a ring on top of the authored points.
- **Grid** (`GridVisualizer`): square cells cannot match an arbitrary canvas ratio, so
  the cell is sized from the **HEIGHT** (`fitSlots(rows, box.height − PAD*2, GAP,
MIN_CELL 8, MAX_CELL 180)`) and only min'd with the column fit where a grid wider than
  the panel's ratio would otherwise push cells off the canvas. `MAX_CELL` is a sanity cap
  so a 1–2 row grid does not mint half-panel squares; from three rows up in a normal panel
  it never binds and the height is fully spent. When the floor binds the gap goes first,
  then the cell, so a cramped grid still shows every row. The remainder is centred
  (`originX`/`originY`), which is what makes `PAD` reappear as the inset on a fully spent
  axis; horizontal remainder may also scroll (the canvas region is `overflow-x: auto`).

Node radii are solved against the layout rather than guessed: because the radius _is_ the
layout's inset, `GraphVisualizer` and `TreeVisualizer` walk **down** from their cap
(`MAX_NODE_R` 72 / 46) using `minPointSpacing(points, fallback) * SPACING_SHARE`
(0.38 / 0.45) — a bigger radius always means a tighter layout, so each pass is a safe
upper bound and the loop settles in two or three. The floors (`MIN_NODE_R` 28 / 26) equal
the old fixed radii, which is what guarantees a laid-out graph or tree can only ever grow.

Supporting helpers: `fitSlots(count, available, gap, min, max)` (equal slots as large as
the run allows; `span` overshoots `available` once `min` binds and the caller must detect
that); `minPointSpacing(points, fallback)` (closest pair — never `Infinity`);
`viewBoxAttr` (rounds to two decimals so re-measuring does not churn the attribute);
`clamp`. `useCanvasBox(fallback)` measures via `ResizeObserver` in a **layout** effect —
not a plain effect, because measuring after paint would show one frame of the fallback box
letterboxed inside the real one, a flash of exactly the defect being fixed. jsdom
implements no `ResizeObserver` and reports zero-sized elements, so **the `fallback` is
what tests and the first paint render**; keep it a sensible box (each visualizer builds
it from its own ideal bar width / cell size / `width`+`height` props) so specs stay
deterministic.

**Standing rules for any sizing change:**

- **A sizing change must never make a visualization smaller.** Every mechanism above
  _enlarges_ the drawing into space it previously wasted. If nodes, bars or cells come
  out smaller than before, the change is wrong — verify per snapshot kind (array, grid,
  graph, tree).
- **Never reintroduce a fixed-ratio viewBox, and never size the svg to the content.**
  Those are the two forbidden modes above.
- Colours inside a canvas are tokens only. Font sizes, radii and stroke widths are the
  one place scalar geometry is _computed_ (via `clamp`) rather than tokenised — that is
  what keeps a big graph legible while a small one grows.
- `vizGeometry` is pure except for `useCanvasBox`, and it is unit-tested in
  `src/components/primitives/specs/vizGeometry.spec.ts` (the viewBox law, both-axis
  spreading, degenerate axes, the inscribed ellipse, slot fitting, tidy layout, attribute
  rounding). Keep new geometry in there rather than inlining maths in a visualizer.

### 2.9 Categorical group coloring (`--viz-1..8` + `vizPalette`)

`--viz-1..8` is a **separate axis from `--state-*`**: state says _what the algorithm is
doing right now_, a viz slot says _which group something belongs to_ — connected
component, SCC id, MST tree, island index, trie branch, partition, roadmap topic
family. The set was validated for colorblind separation **as an ordered set**, so:

- assign slots in **fixed order** starting at slot 0;
- **never cycle past 8** — extras fold into `--state-default`;
- **never substitute or re-order values** (substitutions break the validated gates);
- never invent additional chart colors.

`src/components/primitives/vizPalette.ts` is the only sanctioned way to touch them:

| Export                                                | Purpose                                                                                                                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VIZ_SLOT_COUNT` (8)                                  | Number of validated slots                                                                                                                                                                         |
| `isVizSlot(slot)`                                     | True for integers in `[0, 8)`                                                                                                                                                                     |
| `vizSlotColor(slot)`                                  | `var(--viz-N)` (1-based token from a 0-based slot); out of range → `VIZ_OVERFLOW_COLOR` (`var(--state-default)`)                                                                                  |
| `vizSlotBg(slot, percent = 22, base = 'transparent')` | Translucent companion via `color-mix` from the same token; pass a surface token as `base` when the fill sits on an opaque panel. Out of range → `VIZ_OVERFLOW_BG`                                 |
| `deriveConnectedComponents(nodeIds, edges)`           | Weakly-connected components via union-find (direction ignored, unknown edge endpoints skipped, isolated nodes form their own component) → `{ componentOf, componentCount, largestComponentSize }` |
| `componentTintingAddsInformation(components)`         | Whether derived tinting is worth showing: >1 component, ≤8 components, largest component >1 node (an edgeless point cloud would just become confetti)                                             |

**Rendering precedence** in `GraphVisualizer` and `TreeVisualizer`: algorithm state
outranks identity. A node in a non-`default` state keeps its `--state-*` skin and its
group is demoted to an outer ring; only untouched nodes are filled with their group
color. An edge takes `edge.group` if set, otherwise inherits the group its two
endpoints agree on. `GraphVisualizer` renders a legend automatically: `Group N` for
explicit groups, `Component N` for derived ones, plus edge entries once a run has
produced more than one kind of edge.

**How a NEW graph algorithm opts into component coloring.** `GraphNodeItem` and
`GraphEdgeItem` both carry an optional `group?: number` (zero-based slot). Set it in
your snapshots and you get identity coloring for free:

```ts
// Kosaraju/Tarjan: color by SCC id as components are finalized
nodes: graph.map((n) => ({ id: n.id, label: n.id, state: stateOf(n), group: sccOf.get(n.id) })),
// Kruskal/Prim: color by union-find root index so growing trees are distinguishable
edges: chosen.map((e) => ({ from: e.u, to: e.v, weight: e.w, isPath: true, group: treeIndex(e) })),
// Islands / flood fill: group = island index assigned in discovery order
```

Rules for authors: slots are **assigned in discovery order** (first component found
gets 0) so the coloring is stable across steps; a group that has not been decided yet
should be `undefined`, not a placeholder slot; and if an algorithm can produce more
than 8 groups, let the extras fold into `--state-default` rather than reusing a slot.
`GraphVisualizer` only falls back to `deriveConnectedComponents` when **no** node sets
`group` — an explicit group always wins, which is why the 40 existing algorithms
(none of which set `group`) keep their purely semantic look.

`TreeVisualizer` takes identity as an optional `groups?: Record<string, number>` prop
(node id → slot) rather than a field on `TreeNodeItem`; `MainLayout` does not pass it
today, so wiring subtree/heap-partition tinting means threading it through there.
`KnowledgeGraph` uses the same helpers: one fixed slot per topic family in
`TOPIC_FAMILIES`, tinting nodes, edges and the legend — that colouring is explicitly
kept (R6.3) and must not be neutralized.

### 2.11 Panel visibility: four independent toggles, five identical buttons

**`ViewMode` is dead in the workspace.** The old Split/Visual/Code `Segmented` control
was removed and replaced by four independent booleans:

```ts
// src/types/dsa.ts
export interface PanelVisibility {
  visualizer: boolean;
  code: boolean;
  tutorial: boolean;
  auxiliary: boolean;
}
export type PanelKey = keyof PanelVisibility;
```

`MainLayout` takes `panels: PanelVisibility` (not `viewMode`, not `showTutorial` /
`showAuxiliary` booleans). `SettingsContext` owns the state and persists one key per
panel, migrating any legacy `view_mode` payload on read (section 2.2). `ViewMode`
remains exported from `types/dsa.ts` purely to type that migration.

**The navbar renders five visually identical toggle buttons**: Visualizer, Code,
Tutorial, Aux data. They come from one `PANEL_TOGGLES` table
button, all in a single `role="group"` row with the same `--space-2` gap, and every one
of them is the **same `Button` with `size="sm"`**, the same icon treatment (14px, set by
`ui.css` — never inline), the same `selected` styling (accent-soft background, accent
border, accent text) and **`aria-pressed` reflecting its state**. Each is an independent
on/off that shows or hides exactly one thing — none of them is a mode switch, so never
reintroduce mutual exclusion between them, and never give one of them a different size,
variant or icon size. The panel toggles render only in the workspace app view; the reset action
toggle is always present.

**"Reset layout" sits next to them, outside the group.** It is workspace-only and the
same `sm` scale, separated by a hairline `--border-subtle` divider, and it carries **no
`aria-pressed`** because it is an action, not a toggle. It opens `ConfirmDialog` and only
a confirm calls `resetWorkspaceLayout()` (sections 2.2 and 2.7). While that dialog is
open the `/` shortcut stands down (section 2.12).

**The app-view navigation stays a `Segmented`** (Knowledge Tree / Problem List /
Workspace, `size="sm"`): that one _is_ mutually exclusive routing, not a toggle set.

**All-off empty state.** The complexity card follows the **code** toggle (it is the code
column's companion and has no navbar switch of its own), and the tutorial/auxiliary
_strips inside the visualizer panel_ (section 2.7) additionally require the current step
to actually have content for them. When every workspace panel resolves to hidden,
`MainLayout` renders a calm centered `Card` reading "Every panel is hidden" plus
instructions to turn one back on in the navbar — **never a blank stage and never a
trap**. Playback also stays reachable: `ControlPanel` is docked inside the visualizer
card (`variant="embedded"`) when the visualizer is on, and moves below the stage
(`variant="standalone"`) when it is off.

The workspace route wires the close buttons on the tutorial and working-data strips to
`setPanel('tutorial' | 'auxiliary', false)`, so dismissing a strip is the same state as
toggling it off in the navbar (`MainLayout` receives them as `onToggleTutorial` /
`onToggleAuxiliary`).

### 2.12 Global keyboard shortcuts and their guards

Two owners bind window-level keys, and they share their guards through
**`src/app/keyboardGuards.ts`** so they can never disagree about when to stand down:

| Key                                   | Owner                        | Effect                                  |
| ------------------------------------- | ---------------------------- | --------------------------------------- |
| `ArrowRight`                          | `workspace.$algorithmId.tsx` | `pause()` then `stepForward()`          |
| `ArrowLeft`                           | `workspace.$algorithmId.tsx` | `pause()` then `stepBackward()`         |
| `Space` (`' '` / legacy `'Spacebar'`) | `workspace.$algorithmId.tsx` | `togglePlay()`, with `preventDefault()` |
| `/`                                   | `Navbar.tsx`                 | opens `QuickAccessDrawer`               |

**The guard rules — all of them apply to every shortcut:**

- **`isTypingTarget(target)`** → bail. It claims `INPUT`, `TEXTAREA`, `SELECT` and
  anything inside a contenteditable region. `input[type=range]` and `select` count on
  purpose: arrow keys already adjust a focused slider or option list, which is exactly
  what the playback keys would steal. (The predicate checks
  `element.isContentEditable === true` _and_ a `[contenteditable]` ancestor lookup,
  because jsdom leaves `isContentEditable` undefined.)
- **`isDialogOpen()`** → bail. Any mounted `[role="dialog"]` counts, which covers both
  the search drawer and every `ConfirmDialog`; a shortcut firing underneath an open
  dialog would act on a workspace the user cannot see.
- **Modifiers → bail.** The playback effect returns on `ctrl`/`meta`/`alt`/`shift`
  (`Cmd+Left` is "back"); the `/` handler returns on `ctrl`/`meta`/`alt`.
- **Space defers to the focused control.** `activatesOnSpace(target)` returns true inside
  a `button`, `[role="button"]`, `a[href]` or `summary`, and the handler yields — otherwise
  tabbing to any toggle and pressing Space would scrub playback instead of flipping it.
  When it does handle Space it **must `preventDefault()`** or the page (or the nearest
  scroller) pages down on every play.
- **Arrow stepping takes the wheel** by pausing first. Without the `pause()`, the
  interval kept advancing on its own schedule, so `ArrowLeft` during playback looked
  like a no-op (the next tick undid it) and `ArrowRight` double-stepped.

Implementation notes: the workspace effect is installed **once** and reads the engine's
callbacks through `playbackRef`, so the window binding is not torn down and re-added on
every tick of playback. Discoverability is on the controls themselves — `ControlPanel`'s
step-back / play / step-forward controls carry `aria-keyshortcuts` (`ArrowLeft`,
`Space`, `ArrowRight`) and matching `title` text.

**Any new global shortcut reuses `keyboardGuards`** — never copy the predicates, and
never bind a key that arrows/space already own inside a field.

### 2.13 Trivia: the progressive code-occlusion drill (`/trivia`)

The fourth app view is a study tool for memorising solutions before an interview
(DESIGN.md **Round 8**). It reads the registry you already write — nothing about a new
algorithm has to opt in — so understanding it is part of understanding what your `code`
string is _for_. Section 4.11 is the authoring side of this section.

**The technique.** Cloze deletion applied to source lines, escalated by **coverage, not
time**:

- At **level N** the drill hides N lines of one solution at once. Levels run from
  `minBlanks` to `maxBlanks` (both user-set, floor 1, ceiling 8).
- The level advances to N+1 **only once every blankable line of every deck entry has been
  drilled at level N**. You therefore meet every line at every difficulty before the work
  gets harder, instead of re-drilling whatever the shuffle happens to favour. When the
  ceiling is covered, progress is `completed`.
- Within a level, blank selection prefers **undrilled** lines, then weights by
  `misses + 1`, so a line you fumbled resurfaces sooner without starving the ones you
  know. (Leitner, reduced to its useful core.)
- **Revealing a line counts as drilled _and_ as a miss** — giving up schedules the line
  again rather than quietly skipping it. A revealed blank is submitted as an empty answer,
  so the on-screen feedback and the recorded stats agree.
- An algorithm with fewer blankable lines than the current level cannot supply that many
  blanks, so it is treated as **satisfied** instead of blocking the whole deck forever.
- **Blank / whitespace-only lines are never blankable**, and neither are the lines an
  author lists in `skipLines`.

**Two answer modes**, one round shape (`TriviaRound`):

- **`choice`** — the blanks are drop slots and the tray offers shuffled tiles. Decoys are
  **other real lines from the same solution** (far harder to reject than random text),
  plus any author-supplied `distractors`, one decoy per blank so the tray stays
  proportional to the difficulty. Placement is **click-a-tile-then-click-a-blank**; native
  HTML5 drag-and-drop is a flourish layered on the same call, which is why the drill works
  by keyboard and is testable in jsdom.
- **`type`** — write the line from memory, no tiles.

**Indentation is displayed as a fixed prefix and never graded.** Python needs it, but
making the learner retype leading spaces tests typing, not recall, so `PuzzleLine` splits
`text` into `indent` + `content` and only `content` is answered. Grading trims both ends
and requires an exact match inside (`isAnswerCorrect`).

**The files.**

| File                          | Role                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/types/trivia.ts`         | The contracts — **finished, read-only**: `TriviaMode`, `TriviaConfig`, `PuzzleLine`, `TriviaTile`, `TriviaRound`, `TriviaLineStat`, `TriviaProgress`, `TriviaGrade`, `TriviaMeta`. Its header comment is the rationale for the coverage rule.                                        |
| `src/trivia/triviaEngine.ts`  | All the drill logic, **pure** — no React, no storage, RNG injected. **Finished, read-only.**                                                                                                                                                                                         |
| `src/trivia/triviaStorage.ts` | Persistence: `TRIVIA_CONFIG_KEY` / `TRIVIA_PROGRESS_KEY` (`dsa_visualizer_trivia_{config,progress}_v1`), `TRIVIA_STORAGE_VERSION`, `readTriviaConfig` / `writeTriviaConfig(patch)` / `readTriviaProgress` / `writeTriviaProgress(progress)` / `clearTrivia` / the two clone helpers. |
| `src/components/trivia/*`     | `TriviaDeckBuilder`, `TriviaSettings`, `TriviaSession`, `CodePuzzle`, `TileTray` — presentational; they own board state (what is placed, typed, revealed, selected) and nothing else.                                                                                                |
| `src/routes/trivia.tsx`       | The page: the **only** owner of deck, settings, progress and the current round.                                                                                                                                                                                                      |

**Engine surface** (`src/trivia/triviaEngine.ts`):

```ts
DEFAULT_TRIVIA_CONFIG, MIN_BLANKS_FLOOR (1), MAX_BLANKS_CEILING (8)
normalizeConfig(config)                 // keeps min <= max inside the supported range
parsePuzzleLines(code, meta?)           // -> PuzzleLine[]  (indent/content split, blankable)
blankableLines(lines)                   // -> line numbers that can be hidden
createProgress(config)                  // -> TriviaProgress starting at the configured floor
remainingAt(progress, id, lines, level) // lines of one algorithm not yet drilled at `level`
isLevelCovered(progress, sources, level)
pickRound({ config, progress, sources, meta?, rng? })  // -> TriviaRound | null
buildTiles(lines, blanks, meta, rng)    // answers + decoys, shuffled
isAnswerCorrect(submitted, expected)    // trim-compared
gradeRound(round, answers)              // -> TriviaGrade { perBlank, allCorrect }
recordRound(progress, round, grade, config, sources)  // -> next TriviaProgress (escalates)
coverageRatio(progress, sources, config)             // 0..1, for the progress bar
describeMode(mode)                      // the one-line instruction shown to the learner
export type Rng = () => number
```

`sources` is always `Map<algorithmId, PuzzleLine[]>` and `meta` is
`Map<algorithmId, TriviaMeta | undefined>`; the route builds both from the registry with
`parsePuzzleLines(algorithm.code, algorithm.trivia)`. `pickRound` returns `null` for an
empty deck, a completed drill, or a deck where nothing is long enough for the current
level — the route renders an explanatory card for that last case instead of a broken
board.

**The page has two states**, both under one header card that always shows the level badge,
the rounds-played badge, a `Deck coverage` progressbar and the "Reset progress" action:

- **Setup** — `TriviaDeckBuilder` (the whole registry grouped by category in roadmap order,
  with one-click add for a single row, a whole category or all 40, plus per-category counts,
  search and difficulty badges) beside `TriviaSettings` (mode, `minBlanks`/`maxBlanks`
  sliders that keep `min <= max` — raising the floor past the ceiling pushes the ceiling up
  rather than rejecting the drag — and distractors on/off). Both write through immediately
  (there is no save button), and "Start drilling" only leaves setup once the deck is
  non-empty.
  Setup is **latched**, not derived from an empty deck, so picking the first algorithm does
  not throw the user into a session.
- **Session** — `TriviaSession` wraps `CodePuzzle` (the solution, blanks as slots) and, in
  `choice` mode, `TileTray`. Controls are check answers, reveal a blank, and next round; a
  completed deck gets a "Deck complete" card and a deck with nothing long enough for the
  current level gets an explanatory card rather than an empty board.

**Three laws for anything you add to this feature:**

1. **No component calls `Math.random`.** Randomness enters only through the engine's
   injectable `rng` (default `Math.random` inside `pickRound`), so specs seed a generator
   and a failure replays exactly (`triviaFlow.spec.ts` uses mulberry32).
2. **No component re-implements grading or escalation.** `gradeRound` is the only judge and
   `recordRound` the only bookkeeper; `TriviaSession` calls the former for its own feedback
   and hands the answers up for the latter. A second comparison would drift from the
   trim-compare rule the moment either side changed.
3. **All drill state lives in `routes/trivia.tsx`,** written through `triviaStorage` on
   every change (there is no save button — an abandoned drill must come back where it was
   left). A stored deck id that is no longer in the registry is **skipped, not pruned**:
   silently rewriting the user's deck would lose the entry for good.

**Storage details worth knowing before you touch them:** config and progress are
_deliberately separate_ keys — changing a deck must not erase earned coverage, and a
progress-shape change must not reset the deck. Reads validate field by field and a value
with the wrong version, wrong shape, a NaN, an out-of-range level or `misses > attempts`
is discarded **wholesale** (a half-restored progress record would silently corrupt the
coverage rules). `clearTrivia()` runs only from the confirmed "Reset progress"
`ConfirmDialog`, after which the route re-reads storage rather than assuming the defaults.

**Styling** follows the same law as everything else (section 2.5): cards darker than the
page, every panel promoted to `--border-default`, slots and tiles on the darkest
`--bg-inset` fill, and colour **only** for correctness — `--success`/`--success-soft` and
`--danger`/`--danger-soft` on graded slots, plus difficulty badges in the deck builder.

---

## 3. Core Data Contracts (`src/types/`)

All algorithm and UI interfaces live in `src/types/dsa.ts`, and the trivia contracts in its
sibling `src/types/trivia.ts` (both finished — read, don't edit). The master shape:

```typescript
export interface AlgorithmDefinition<TInput = unknown> {
  id: string; // URL slug AND registry key (e.g. 'two-sum')
  title: string; // Display title (e.g. 'Two Sum')
  category: CategoryType; // Canonical folder id (e.g. 'arrays_and_hashing')
  difficulty?: "Easy" | "Medium" | "Hard";
  description: string; // 1–3 sentences: problem + core idea
  constraints?: string[]; // LeetCode-style bounds, shown in Details
  examples?: ProblemExample[]; // { input, output, explanation? }
  code: string; // Python source string (the ONLY display language)
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  complexityAnalysis: ComplexityAnalysis; // REQUIRED plain-English prose (section 4.4)
  topicGuide: TopicGuide; // REQUIRED topic lesson (section 4.5)
  trivia?: TriviaMeta; // OPTIONAL drill sharpening (sections 2.13, 4.11)
  generateSteps: (input: TInput) => AlgorithmStep[]; // Pure, synchronous
  defaultInput: TInput;
}

export interface ComplexityAnalysis {
  time: string;
  space: string;
}

export interface TopicGuide {
  overview: string; // what this topic IS
  sections: { heading: string; body: string }[]; // the teaching body
  keyTerms?: { term: string; definition: string }[]; // vocabulary
}

// src/types/trivia.ts — every field optional; no metadata still drills fine
export interface TriviaMeta {
  skipLines?: number[]; // 1-based lines to never hide
  distractors?: string[]; // plausible-but-wrong tile lines
  hints?: { line: number; hint: string }[]; // shown on request, per line
}
```

Each step is an immutable snapshot:

```typescript
export interface AlgorithmStep {
  stepIndex: number; // 0-based, strictly increasing
  codeLine: number; // 1-based line of `code` to highlight (section 4.6)
  explanation: { what: string; why: string }; // Teacher voice (section 4.3)
  primarySnapshot: PrimaryVisualSnapshot; // array | grid | graph | tree
  auxiliaryState: AuxiliaryState; // stack/queue/visited/hashMap/distanceTable/customState
  variables: Record<string, string | number | boolean>; // Live "Vars" strip
}
```

Snapshot variants (discriminated on `kind`):

1. `ArrayVisualSnapshot` — `{ kind: 'array', elements: ArrayElement[] }`;
   each element: `id`, `value`, `state: ElementState`, optional `pointers: string[]`
   (labels like `i`, `j`, `match` rendered above the bar).
2. `GridVisualSnapshot` — `{ kind: 'grid', grid: GridCellNode[][] }`;
   cells: `row`, `col`, optional `isStart/isEnd/isWall/isVisited/isPath`, `state`,
   `distance`.
3. `GraphVisualSnapshot` — `{ kind: 'graph', nodes: GraphNodeItem[], edges: GraphEdgeItem[] }`;
   nodes: `id`, `label`, `state`, optional `x`/`y`/`val`/**`group`**; edges: `from`,
   `to`, optional `weight`/`isTraversed`/`isPath`/**`group`**. `group` is the
   zero-based `--viz-*` identity slot (section 2.9) and is independent of `state`.
4. `TreeVisualSnapshot` — `{ kind: 'tree', nodes: TreeNodeItem[], rootId? }`;
   nodes: `id`, `val`, optional `leftId`/`rightId`, `state`, optional `x`/`y`
   (tree identity tinting rides on `TreeVisualizer`'s `groups` prop, not the node).

`ElementState` is the visual vocabulary: `default | compare | swap | sorted | active
| pivot | visited | queued | in-stack | path` — each has a `--state-*` token pair.

The UI-facing types in the same file: `PanelVisibility` / `PanelKey` (the workspace
panel toggles, section 2.11), `AppView` (`'tree' | 'list' | 'workspace' | 'trivia'`),
`DifficultyLevel`, `CategoryType`, and the legacy `ViewMode` retained only for the
settings migration.

`CategoryType` contains the 25 canonical ids plus legacy compatibility aliases
(`stack`, `trees`, `graphs`, `sorting`, …). **New algorithms must use a canonical
id** — `isCategoryType()` only accepts the canonical 25, so aliases are not routeable
category filters.

---

## 4. Playbook: Adding a New Problem End-to-End

### 4.1 Pick the category (decision guide — all 25)

| Folder                      | What belongs there                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `arrays_and_hashing`        | Hash maps, frequency counting, prefix sums, single-pass array scans, elementary sorts (Two Sum, Kadane, Bubble Sort live here) |
| `two_pointers`              | Converging/parallel index pairs over arrays, partition schemes (sorted Two Sum, Quick Sort's partition)                        |
| `sliding_window`            | Contiguous-window optimizations, monotonic deques over a moving range                                                          |
| `stack_and_queue`           | Problems whose core structure is LIFO/FIFO discipline (Valid Parentheses, monotonic stacks)                                    |
| `binary_search`             | Halving a search space — sorted arrays, matrices, or the answer space itself                                                   |
| `linked_list`               | Pointer surgery on node chains: reversal, cycle detection, merging                                                             |
| `tree_fundamentals`         | Binary tree recursion/traversal basics: DFS orders, LCA, depth                                                                 |
| `tree_queries_and_diameter` | Path and aggregate computations over trees: diameter, subtree sums, rerooting                                                  |
| `tries_and_strings`         | Prefix trees and string matching automata (Trie, KMP, Z-algorithm)                                                             |
| `heap_and_priority_queue`   | Top-k, streaming order statistics, heapify mechanics                                                                           |
| `backtracking`              | Exhaustive recursive search with undo (N-Queens, permutations, subsets)                                                        |
| `graph_traversal`           | BFS/DFS reachability, flood fill, connected components on grids/graphs                                                         |
| `graph_shortest_paths`      | Distance computation: Dijkstra, Bellman-Ford, Floyd-Warshall, 0-1 BFS                                                          |
| `graph_spanning_trees`      | Minimum spanning trees and union-find machinery (Kruskal, Prim)                                                                |
| `graph_directed_and_scc`    | DAG ordering and strongly connected components (topological sort, Kosaraju, Tarjan)                                            |
| `graph_flows_and_cuts`      | Max-flow / min-cut / bipartite matching (Ford-Fulkerson, Edmonds-Karp)                                                         |
| `dp_1d`                     | Dynamic programming over a single index/state dimension (coin change, house robber, LIS)                                       |
| `dp_2d`                     | DP over grids or two sequences (edit distance, LCS, unique paths)                                                              |
| `intervals`                 | Sort-then-sweep over ranges: merging, scheduling, overlap counting                                                             |
| `greedy_algorithms`         | Local-choice-optimal constructions (Huffman coding, activity selection)                                                        |
| `bit_manipulation`          | Bitwise identities and tricks (counting bits, XOR pairing, masks)                                                              |
| `math_and_number_theory`    | Primes, GCD, modular arithmetic, combinatorics (Sieve, Euclid)                                                                 |
| `game_theory`               | Win/lose state analysis and Sprague-Grundy style reasoning (Nim)                                                               |
| `advanced_range_queries`    | Fenwick trees, segment trees, lazy propagation over ranges                                                                     |
| `geometry_and_sweep_line`   | Computational geometry and sweeps (convex hull, polygon area, closest pair)                                                    |

If a problem could fit two folders, choose by **what technique the visualization
teaches**, not the data type (Quick Sort teaches partitioning by two pointers, so it
lives in `two_pointers`, not a "sorting" folder — there is no sorting folder).

### 4.2 Create the algorithm file

Path: `src/algorithms/<category>/<algorithmName>.ts` (camelCase filename; the exported
const uses the same camelCase name; the `id` is the kebab-case slug).

Export, following the house pattern (see `src/algorithms/arrays_and_hashing/twoSum.ts`
as the canonical reference):

1. A typed input interface (e.g. `export interface TwoSumInput { nums: number[]; target: number }`).
2. The Python source as a named const template literal (e.g. `export const TWO_SUM_CODE = \`def two_sum(...)\``). Python only — the code viewer shows `solution.py`.
3. A curated `DEFAULT_<NAME>_INPUT` const.
4. The pure generator `generate<Name>Steps(input): AlgorithmStep[]`.
5. The `AlgorithmDefinition<YourInput>` object wiring it all together — including the
   two **required** prose fields, `complexityAnalysis` (4.4) and `topicGuide` (4.5).
   A definition missing either will not compile.
6. Optionally a module-level `const <NAME>_TRIVIA: TriviaMeta` wired in as `trivia:`, to
   sharpen the code-occlusion drill for this solution (4.11). The drill works without it;
   the four algorithms that have it are the reference (`twoSum`, `bubbleSort`,
   `binarySearchMatrix`, `bfsGraph`).

Strict typing throughout: no `any` in any form, no `unknown` casts, no suppression
comments. Narrow snapshot unions with `if (snapshot.kind === 'graph') { ... }`.

### 4.3 Write explanations in the teacher voice

Every `explanation` is `{ what, why }` (contract from
`docs/planning/ui-overhaul/DESIGN.md` §6). Remember where it lands: the tutorial is the
**header of the visualizer panel**, rendered as real prose at `--text-md`/1.6 with two
lines reserved (section 2.7), so this is the most-read text in the app.

- **`what`** — short present-tense action label, ≤ ~8 words, with actual values when
  they help: `Compute the complement 7`, `Visit nums[2] = 11`. It is rendered as the
  bold lead-in sentence of the paragraph (a trailing period is added if you omit one).
- **`why`** — 1–2 conversational sentences explaining why this step happens and what
  it means, with the **actual runtime values interpolated** into the string. Address
  the learner as "we". No headers, no bullet lists, no exclamation spam, no robotic
  `Equation:`-style prefixes, and no Big-O lectures mid-step (a brief complexity note
  at the final step is fine). Keep it to two or three lines' worth: past three lines the
  strip scrolls inside itself rather than growing the panel.

**Good** (Two Sum, checking the map — from DESIGN.md):

> what: `Look up 7 in the map`
> why: `We need a partner for 2 that reaches 9, so we check whether 7 has already
been seen. It hasn't yet — so we remember 2 and keep walking.`

**Bad** — each violates the contract:

> why: `Checking hashmap for key=7. Found=false.` _(log line, no "we", no meaning)_
> why: `Equation: complement = target - nums[i] = 9 - 2 = 7` _(robotic prefix, restates code)_
> why: `Hash map lookups are O(1) amortized, giving O(n) overall!` _(Big-O lecture mid-step + exclamation)_
> why: `We look up the complement.` _(no runtime values interpolated — every step must use the real numbers)_

Branchy steps should interpolate the branch taken (see the `hasComplement` ternary in
`twoSum.ts` — the same step number produces different prose per outcome).

Write `explanation.what` for the learner: a short present-tense action label.

### 4.4 Write the complexity prose

`complexityAnalysis` is **required** (contract from DESIGN.md §7):

- `time` — 2–4 plain-English sentences explaining **why** the time complexity is what
  it is, not restating the bound.
- `space` — 1–3 sentences: what memory grows and why.

**Good** (Two Sum — from DESIGN.md):

> time: `We walk the array once, and each hash-map lookup and insert costs O(1) on
average, so the total work grows linearly with the number of elements — O(n). Even
in the worst case, where no pair exists, we still make just a single pass.`
> space: `The hash map stores up to one entry per element before a pair is found, so
extra memory grows linearly with the input — O(n).`

**Bad**:

> time: `O(n) because it is linear.` _(restates the chip; the chips already show O(n) — the prose must carry the reasoning)_
> space: `Uses a hash map.` _(names the structure without saying what grows or why)_

`ComplexityCard` renders the `timeComplexity` best/average/worst chips and
`spaceComplexity` chip, then these paragraphs beneath them, in a `Collapsible` that sits
immediately under the code listing.

### 4.5 Write the `topicGuide` (required topic lesson)

`topicGuide` is a **required** field and it is the biggest writing task in a new
algorithm. It is a _topic lesson_, not step narration: something a learner could study
from with the animation paused.

```ts
topicGuide: {
  overview: string;                                  // 2–4 sentences
  sections: { heading: string; body: string }[];     // 4–6 sections, 3–6 sentences each
  keyTerms?: { term: string; definition: string }[]; // 3–6 terms, 1–2 sentences each
}
```

**Required depth.**

- `overview` — 2–4 sentences orienting the learner: what the technique or data
  structure _is_ and what class of problem it solves.
- `sections` — **4–6** sections, each `body` being **3–6 full sentences**. Cover, in
  this spirit (adapt the headings to the topic): the core idea and the insight that
  makes it work; how the mechanism operates concretely; why it is correct (the
  invariant it maintains); when to reach for it versus the alternatives; pitfalls and
  edge cases; how it generalizes to sibling problems.
- `keyTerms` — 3–6 terms a newcomer would stumble on, each defined in one or two
  sentences. Optional in the type, expected in practice; `ProblemHeader` renders them
  as a real `<dl>` definition list in a responsive multi-column grid.

**Voice.** A good teacher writing prose: **second person ("you")**, concrete, full
sentences. No bullet fragments inside `body`, no markdown syntax (it renders as plain
text), no Big-O dumps, no restating the step list.

**How it differs from its neighbours** — three fields, three jobs, no overlap:

| Field                        | Job                                                                                                    | Voice                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `explanation.why` (per step) | Play-by-play of _this_ step with real runtime values                                                   | "we", 1–2 sentences                |
| `complexityAnalysis`         | Why the time/space bounds are what they are                                                            | plain-English reasoning about cost |
| `topicGuide`                 | The whole subject behind the problem: idea, mechanism, invariant, trade-offs, pitfalls, generalization | teacher prose, "you", 4–6 sections |

**Good** (Two Sum — abridged from `twoSum.ts`, the canonical reference):

> heading: `Why checking before inserting is what makes it correct`
> body: `The invariant is that when you begin processing index i, seen contains exactly
the values at indices 0 through i minus 1, each mapped to a valid earlier index.
Because of that, a hit on the complement is guaranteed to be a genuinely different
element rather than the current one reused twice. … If you inserted before checking,
a target of exactly twice the current value would match the element against itself
and return a bogus duplicate index.`

**Bad**:

> body: `- Use a hash map\n- Check complement\n- Return indices` _(bullet fragments, markdown, no prose)_
> body: `We look up the complement in the map, then we insert.` _(step narration — that is `explanation.why`'s job)_
> body: `Runs in O(n) time and O(n) space because each lookup is O(1).` _(that is `complexityAnalysis`)_
> body: `This is a very common interview question and you should know it.` _(no teaching content)_

**Details render expanded by default** (from the persisted layout's `detailsExpanded:
true`), so the whole guide is on screen at first paint — which sets the spec convention
in 4.10.

### 4.6 The `addStep` closure pattern & `codeLine` mapping

Generators build steps through a local `addStep` closure that snapshots the working
state. Key rules:

- **Deep-copy mutable visual state on every push.** The closure must map/spread the
  working arrays (`elements.map((el) => ({ ...el, ... }))`, `{ ...hashMap }`) —
  steps are immutable snapshots; sharing references makes later mutations bleed into
  earlier steps.
- `stepIndex` increments monotonically from 0 inside the closure.
- **`codeLine` numbers map 1-based onto the lines of the `code` Python string.**
  `CodeBlockViewer` renders `code.trim().split('\n')` with 1-based numbering, so line
  1 is the `def` line of the template literal. If you edit the Python string, re-audit
  every `codeLine` in the generator — the spec should pin at least the first and last
  step's `codeLine` to catch drift.
- **Start the template literal immediately after the backtick — no leading newline.** The
  house style is `` `def two_sum(...)`` on the same line as the opening backtick, and it is
  load-bearing beyond aesthetics: the code viewer trims _both_ ends while the trivia parser
  trims only the trailing end (`parsePuzzleLines`), so a leading blank line would shift the
  drill's numbering one past `codeLine`, `skipLines` and `hints` (sections 2.13 and 4.11).
  The same 1-based numbering serves all three.
- `variables` feeds the "Vars" chip strip docked under the code viewer — keep it to
  the handful of live values a reader would trace (`i`, `complement`, `target`), not
  a dump of all state.
  auxiliary structures between consecutive steps (section 2.10). A generator that
  faithfully marks `compare`/`swap`/`visited` and copies its stack/queue gets
  a legible animation for free; one that leaves everything `default` reads as static.

Skeleton:

```typescript
export const generateExampleSteps = (input: ExampleInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {/* copy whatever aux structures apply */},
      variables,
    });
  };

  addStep(
    1,
    "Start the search",
    `We want two numbers in [${input.nums.join(", ")}] that add up to ${input.target}. ...`,
    { target: input.target },
  );
  // ... mutate elements/aux state, addStep after each meaningful action ...
  return steps;
};
```

### 4.7 Choose the `PrimaryVisualSnapshot` kind

All four kinds now lay themselves out against the **measured canvas box** and spread
across both axes (section 2.8), so the choice is about semantics, not about how much
room a kind will take.

- **`array`** — anything linear: number arrays, strings (one element per char),
  pointer walks, sliding windows, DP over one row. Use `pointers: ['i', 'j']` for
  index labels and `state` for per-element coloring. Bars fill the width and the tallest
  bar fills the band, so long arrays stay readable and short ones grow. Default choice
  when unsure.
- **`grid`** — inherently 2D state: matrices, pathfinding boards, island maps,
  N-Queens boards, 2D DP tables. Cells carry `isStart/isEnd/isWall/isVisited/isPath`
  for pathfinding semantics or `state` for generic coloring. Cells are squares sized from
  the panel **height**, so a grid with very many columns spends its slack horizontally
  (centred, scrollable) — prefer roughly square grids where the algorithm allows.
- **`graph`** — node/edge structures: traversals, shortest paths, MSTs, SCCs, flows.
  `x`/`y` are optional, and **leaving them off usually yields the better drawing**:
  `GraphVisualizer` then lays nodes on the ellipse inscribed in the measured box and
  sizes the radius from the resulting spacing, so the graph fills a wide panel. Provide
  coordinates only when layout carries real meaning (flow networks left-to-right,
  geometry) — authored points are spread per-axis to the box edges at one uniform
  radius. If you author coordinates, author them for **every** node; one missing pair
  sends the whole graph to the ellipse. Mark progress with `isTraversed`/`isPath` on
  edges and `state` on nodes. **Optionally** set `group?: number` on nodes (and edges)
  when the algorithm has a real identity partition to show — SCC ids, MST trees, island
  indices, bipartite sides. Follow the slot rules in section 2.9: zero-based, discovery
  order, no cycling past 8, `undefined` while a group is still undecided. With no
  explicit groups, the visualizer tints multi-component graphs from derived connected
  components and otherwise leaves the purely semantic look alone.
- **`tree`** — binary trees with parent→child identity: traversals, LCA, heaps
  drawn as trees, tries. Nodes link via `leftId`/`rightId` with an optional `rootId`;
  `x`/`y` optional. Prefer omitting them: `TreeVisualizer` then runs `tidyTreeSlots` and
  stretches columns and levels across the measured box, which is what makes a shallow
  tree fill the canvas height. **Authored coordinates are honoured only when EVERY node
  has them** (mixing authored and computed positions would collide), so a partially
  positioned tree silently falls back to the tidy layout — either position all of it
  (Huffman does) or none of it. Identity tinting comes from `TreeVisualizer`'s `groups`
  prop (node id → slot), not from the snapshot.

One algorithm uses one kind for all its steps — the visualizer swaps per-step but
mixing kinds mid-run is confusing and untested.

### 4.8 Choose `auxiliaryState` fields

Each populated field renders as a labeled chip row in the `AuxiliaryPanel` — the
"Working data" strip directly beneath the tutorial header inside the visualizer panel
(section 2.7); empty/absent fields render nothing, and a step with no aux content at all
renders no strip:

| Field                                         | UI row        | Notes                                                                                    |
| --------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `stack: (string\|number)[]`                   | "Stack"       | Last item gets a `top` marker                                                            |
| `queue: (string\|number)[]`                   | "Queue"       | First item gets a `front` marker                                                         |
| `visited: (string\|number)[]`                 | "Visited (n)" | Count in the label                                                                       |
| `hashMap: Record<string, string\|number>`     | "Hash map"    | Rendered `key → value`                                                                   |
| `distanceTable: Record<string, number>`       | "Distances"   | `Infinity` renders as `∞`                                                                |
| `customState: Record<string, string\|number>` | "State"       | Rendered `key = value`; the catch-all for anything else (dp rows, flow totals, counters) |

Copy the structures on every `addStep` (`{ ...hashMap }`, `[...queue]`). Use the
field that matches the algorithm's actual working structure — a BFS should populate
`queue` + `visited`, Dijkstra `distanceTable` + `visited`, DFS `stack`, DP
`customState`. These fields are also what the working-data strip renders for
push/pop/enqueue/dequeue/relax cues, so put real values in the right field rather than
stuffing everything into `customState`. Keep the working set tight: the strip shares a
45% band with the tutorial and scrolls internally past it.

### 4.9 Register the algorithm

In `src/algorithms/registry.ts`, import and add one entry:

```typescript
import { myAlgo } from "./my_category/myAlgo";

export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition> = {
  // ...
  "my-algo": myAlgo as AlgorithmDefinition,
};
```

- The key **must equal** the definition's `id` — it is the URL slug.
- The `as AlgorithmDefinition` cast is the sanctioned widening from
  `AlgorithmDefinition<SpecificInput>` to the registry's `AlgorithmDefinition`
  (`TInput = unknown`); it is not an `any` escape.
- **Routes need NO changes** — `/workspace/$algorithmId` resolves any registry id,
  and the `QuickAccessDrawer`/`ProblemList` enumerate the registry automatically.

Then bump the category's `algorithmCount` in `TOPIC_ROADMAP_NODES`
(`src/components/KnowledgeGraph.tsx`) so the roadmap node count stays truthful.

Note: the workspace's data-size/randomize controls only activate for
`arrays_and_hashing` algorithms whose `defaultInput` is a plain `number[]`
(`supportsRandomArray` in `workspace.$algorithmId.tsx`); object-shaped inputs keep
their curated default — design your `defaultInput` to be a great teaching example.

### 4.10 Write the specs

Both files live in `src/algorithms/<category>/specs/`. Study
`src/algorithms/arrays_and_hashing/specs/twoSum.spec.ts` and
`twoSum.render.spec.tsx`, plus `graph_shortest_paths/specs/bellmanFord.spec.ts`, as
templates.

> #### ⚠️ HARD RULE — name React component specs `*.render.spec.tsx`
>
> A new problem gets **`<name>.spec.ts`** (logic) and **`<name>.render.spec.tsx`**
> (render). Never create a `<name>.spec.tsx` that shares its basename with a
> `<name>.spec.ts` sibling.
>
> **Why:** TypeScript **deduplicates same-basename files resolved from an `include`
> glob** and prefers the `.ts`. `tsconfig.json` is just `"include": ["src"]`, so every
> `foo.spec.tsx` sitting next to a `foo.spec.ts` was silently dropped from the program.
> All **40** algorithm component specs were invisible to `tsc --noEmit` for months,
> which hid real prop-shape bugs (stale `viewMode`/`showTutorial` props that still type-
> checked green because the file was never checked). Vitest ran them; the compiler never
> saw them. Renaming them to `*.render.spec.tsx` made the basenames unique and put all
> 40 back under typecheck.
>
> Consequences to respect: `bun run test` passing is **not** evidence that a spec
> type-checks — only `bun run typecheck` is. Specs whose basename is already unique
> (`src/components/specs/MainLayout.spec.tsx`, `src/ui/specs/Button.spec.tsx`, …) are
> fine as `.spec.tsx` because they have no `.spec.ts` twin, but `.render.spec.tsx` is
> the safe default for anything new that renders components.

**Logic spec — `<name>.spec.ts`** (pure step-generator invariants, no DOM):

- Metadata: `id`, `title`, `category`, `defaultInput` equality, `code` contains the
  Python `def`.
- Step count: `steps.length > 0`; first step has `stepIndex === 0` and the expected
  `codeLine`.
- `codeLine` bounds: every step's `codeLine` is ≥1 and ≤ the number of lines in the
  code string (pin the final step's exact line).
- Snapshot integrity: narrow with `if (snapshot.kind === '...')` and assert element
  counts/states; assert the auxiliary structures appear when expected. If the
  algorithm sets `group`, assert the slots are zero-based, stable across steps, and
  never exceed 7.
- Final state: the algorithm's _answer_ is correct for the default input **and** for
  at least 2–3 custom inputs including an edge case (no solution, negative numbers,
  cycle present, empty-ish input).
- **Trivia metadata coherence, if you wrote any `trivia` metadata** — one `describe` block
  asserting the line numbers are in range and point at non-empty lines, that no
  `distractor` equals a real line after trimming, and that hints sit on lines the drill can
  actually hide. Section 4.11 explains what each assertion is protecting and gives the
  block to copy.

**Render spec — `<name>.render.spec.tsx`** (component integration through `MainLayout`;
note the `.render.` segment — see the hard rule above). `MainLayout` takes
**`panels: PanelVisibility`** — there is no `viewMode`, `showTutorial` or
`showAuxiliary` prop:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../components/MainLayout";
import { myAlgo, generateMyAlgoSteps, DEFAULT_MY_ALGO_INPUT } from "../myAlgo";

it("renders title, description and topic guide", () => {
  const steps = generateMyAlgoSteps(DEFAULT_MY_ALGO_INPUT);
  const noop = vi.fn();
  render(
    <MainLayout
      algorithm={myAlgo}
      currentStep={steps[0]}
      panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
      onToggleTutorial={noop}
      onToggleAuxiliary={noop}
    />,
  );
  expect(screen.getByText("My Algo Title")).toBeInTheDocument();
  // Problem details render EXPANDED by default — never click "Details" first.
  expect(screen.getByText(/first words of the description/i)).toBeInTheDocument();
  expect(screen.getByText(myAlgo.topicGuide.overview)).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: myAlgo.topicGuide.sections[0].heading }),
  ).toBeInTheDocument();
});
```

**Five spec conventions to get right:**

- **Name the file `<name>.render.spec.tsx`** — the hard rule above. A bare
  `<name>.spec.tsx` compiles-green-by-not-compiling.
- **Pass `panels`, all four keys.** Flip a key to `false` when you specifically want a
  panel out of the tree; the canonical all-on object is the default for an algorithm
  render spec. A spec still passing `viewMode`/`showTutorial`/`showAuxiliary` is stale
  and will not type-check.
- **Details are expanded by default**, so a
  `fireEvent.click(screen.getByRole('button', { name: /details/i }))` before asserting on
  `description`/`topicGuide`/constraints/examples now **collapses** them and breaks the
  assertion. **Do not click "Details".** Assert directly. (Clicking is still the right
  way to test the _toggle_ itself — see `src/components/specs/MainLayout.spec.tsx`.)
- **That default comes from `localStorage`, so leave storage clean.** `MainLayout` reads
  `readWorkspaceLayout()` on mount; a spec that toggles Details or seeds
  `WORKSPACE_LAYOUT_KEY` must clear storage afterwards (`afterEach(() =>
localStorage.clear())`, as `MainLayout.spec.tsx` does) or the next spec in the file
  renders collapsed and its assertions fail for the wrong reason.
- **The whole step context is inside one panel** (section 2.7) in the order tutorial →
  working data → canvas → controls, so query by text rather than by panel structure, and
  remember jsdom measures every element as zero-sized, so the canvas renders from its
  `fallback` box (section 2.8).

Cover: title renders; description and topic-guide content visible without a click; a
mid/last step renders its tutorial `what` text (use `screen.getAllByText(...)[0]` —
step text can appear in more than one place); "Working data" rows appear for a step
whose auxiliary state is populated. If the algorithm sets `group` on nodes or edges
(optional — section 2.9), assert the legend appears. jsdom gotchas are in section 6.

**If you add a new workspace panel**, it must size itself: give the row
`height: layout.panelHeights.<key>` with a `null` default, leave `greedy` unset (the
visualizer is the workspace's one greedy row), add no `height`/`min-height` to the card
itself, and assert in a spec that the row renders `data-height-mode="hug"` and carries
no inline height — that is how `MainLayout.spec.tsx` pins the contract for the code
column. A new panel also needs its own `PanelKey`, storage key and navbar toggle
following section 2.11 exactly (same `size="sm"` `Button`, `aria-pressed`), plus a new
`panelHeights` field, which means bumping `WORKSPACE_LAYOUT_VERSION` **and** the key
suffix. If what you are adding is really _step context_, prefer a new strip **inside**
the visualizer panel (above the canvas, inside the capped band) over a new row outside
it.

Run only your specs while iterating:

```bash
bunx vitest run src/algorithms/<category>/specs/<name>.spec.ts src/algorithms/<category>/specs/<name>.render.spec.tsx
```

### 4.11 Make it work well in the trivia drill (`trivia?: TriviaMeta`)

Your solution lands in the `/trivia` code-occlusion drill **automatically** — the drill
parses the `code` string straight out of the registry, so a new problem needs **no** work
to be drillable and `trivia` is entirely optional. Read section 2.13 first for how the
drill behaves; this section is only about the authoring decisions.

Two things are therefore true and both matter:

1. **Nothing is required.** Ship without `trivia` and the drill still hides your lines,
   builds tiles from your other real lines, grades, and escalates correctly.
2. **Three small optional fields make the drill on your solution much sharper**, and each
   one is easy to write badly. Everything below is about writing them well.

```ts
const MY_ALGO_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [/* 3–5 plausible-but-wrong lines */],
  hints: [{ line: 4, hint: "…" }],
};

export const myAlgo: AlgorithmDefinition<MyAlgoInput> = {
  // …
  trivia: MY_ALGO_TRIVIA,
};
```

#### `skipLines` — keep it small, and only for lines that teach nothing

1-based line numbers that the drill must **never** hide. They count against the **actual
`code` string** you wrote, the same numbering `codeLine` uses (section 4.6), so re-audit
them whenever you edit the Python.

Skip a line only when recalling it teaches nothing about the algorithm: the `def`
signature (which the drill would otherwise blank out, leaving the learner no idea which
function they are writing), an `import` line, or a bare `return arr` whose content is
scenery. The four references show the whole range of sensible use: `bubbleSort` and
`twoSum` skip `[1]`, their `def` line; `bfsGraph` skips `[3]`, its `def` line, because
lines 1–2 are the `deque` import and a blank; `binarySearchMatrix` skips `[1, 17]` — the
`def` line and a bare `else:`, which is pure syntax with nothing to recall.

Do **not** skip a line because it is hard — hard lines are the point — and do not skip
whitespace-only lines: they are already non-blankable, so listing them is noise. A long
`skipLines` shrinks the pool the level can draw from, and an algorithm with fewer blankable
lines than the current level drops out of the rotation altogether (section 2.13).

#### `distractors` — 3–5 wrong lines that are wrong _about this solution_

These become extra tiles in `choice` mode, on top of the decoys the engine already takes
from your other real lines. A good distractor is a **specific, plausible mistake a learner
would actually make in this exact function**: an off-by-one bound, a flipped comparison, a
wrong dictionary access, the LIFO/FIFO version of a queue call, a no-op swap.

Hard constraints:

- **Never equal a real line after trimming.** Grading is trim-compared, so a "wrong" tile
  whose text matches a real line would grade as **correct** — the drill would be teaching
  the learner that their wrong answer was right. Indentation does not save you; compare
  trimmed.
- **No duplicates**, and no empty strings.
- **3–5 is the useful range.** One decoy per blank reaches the tray, so a huge list mostly
  sits unused while a list of one barely changes the round.

**Good** (from `bubbleSort`, whose real lines are `for j in range(0, n - i - 1):` and
`if arr[j] > arr[j + 1]:`):

```ts
distractors: [
  "for j in range(0, n - i):", // the off-by-one that breaks the last swap
  "for j in range(0, n - 1):", // forgets the sorted tail shrinks each pass
  "if arr[j] >= arr[j + 1]:", // a comparison that swaps equal elements
  "if arr[j] < arr[j + 1]:", // sorts the wrong way round
  "arr[j], arr[j + 1] = arr[j], arr[j + 1]", // a swap that swaps nothing
];
```

Each one is a mistake with a diagnosis attached: rejecting it requires knowing _why_ the
bound is `n - i - 1` or why the comparison is strict. `bfsGraph` does the same trick with
`current = queue.pop()` (DFS instead of BFS) and `visited.add(current)` (marking the wrong
node, the classic double-enqueue bug).

**Bad:**

```ts
distractors: [
  "return None", // generic filler: rejectable without reading the algorithm
  "x = 0", // not plausible in this function at all
  "pass", // teaches nothing
  "if arr[j] > arr[j + 1]:", // FATAL: identical to a real line — grades as correct
  "    n = len(arr)", // same, only differently indented — trim makes it identical
];
```

Generic filler is worse than no distractors: it inflates the tray, makes the round _look_
harder, and can be eliminated by shape alone, which trains nothing.

#### `hints` — say what the line must accomplish, never what it says

`{ line, hint }` pairs, revealed on request behind a lightbulb control in `CodePuzzle`. A
hint is a nudge toward the _purpose_ of the line, phrased so that the learner still has to
produce the code:

> **Good** (`twoSum`, line 4): `Name the one value that would finish the pair with the
current number — pure arithmetic, no lookup yet.`
> **Good** (`bfsGraph`, line 11): `Claim the neighbour the moment it is discovered, not
when it is later processed, or it can enter the frontier twice.`
> **Bad**: `Write complement = target - num` _(that is the answer, not a hint)_
> **Bad**: `This line is important` _(no content)_
> **Bad**: a hint on a line listed in `skipLines` — the drill never hides it, so the hint
> can never be shown.

Aim for the handful of lines where a learner genuinely stalls (the four hinted algorithms
each carry 4), one entry per line, non-empty text.

#### Why your `<name>.spec.ts` must assert metadata coherence

Add a `describe` block to the **logic** spec (section 4.10) whenever you write `trivia`:

```ts
describe("myAlgo trivia metadata", () => {
  const meta = myAlgo.trivia;
  const lines = myAlgo.code.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at real, non-empty lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
      expect(lines[line - 1].trim()).not.toBe("");
    });
    // A hint on a line the drill never hides would never be shown.
    hinted.forEach((line) => expect(skipped).not.toContain(line));
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    expect(new Set(distractors).size).toBe(distractors.length);
    distractors.forEach((distractor) => expect(real.has(distractor.trim())).toBe(false));
  });
});
```

**The check exists because every one of these mistakes is invisible in the UI.** A
`skipLines` or `hints` entry that is off by one, or points past the end of the file, simply
never fires — nothing throws, nothing looks wrong, the hint just never appears and you
conclude the feature works. A distractor equal to a real line is worse than invisible: it
looks like a working decoy and silently grades a wrong answer as right. And because the
line numbers are coupled to a string you will edit later, the assertions are a **drift
alarm** as much as a correctness check: rewording your Python renumbers everything, and
this block is what fails instead of the drill quietly degrading.
`src/trivia/specs/triviaFlow.spec.ts` runs the same checks, but only over its fixed
four-algorithm deck — it will **not** cover your new algorithm, which is exactly why the
per-algorithm spec owns it.

#### Write the `code` string with the drill in mind

The drill's quality is mostly decided by the shape of your Python, before any metadata:

- **One statement per line drills well.** Each line becomes an independently recallable
  unit, and the tiles stay comparable in length.
- **Very long lines drill badly.** A 100-character comprehension is a blank nobody can
  reconstruct from memory and a tile that dominates the tray; split it, or accept that the
  line is a wall. Prefer an intermediate variable over a dense one-liner — it reads better
  in the code viewer too.
- **Blank lines are automatically non-blankable**, so use them to group phases without
  worrying that the drill will ask for an empty line. (Whitespace-only lines count as
  blank: `bfsGraph` has a line of spaces at line 6 and the drill skips it for free.)
- **Avoid two lines that are identical after trimming** where you can. They are legal, but
  either one grades as correct for the other's blank, which makes the feedback confusing.
- The same string feeds the code viewer, `codeLine` highlighting and the drill, so
  optimising it for one usually helps all three: short, honest, one-idea lines.

### 4.12 Final gate

Exactly once, when the work is done:

```bash
bun run check   # tsc --noEmit && eslint (0 warnings) && vitest run (all green) && vite build
```

---

## 5. Common-Components Mandate (`src/ui/`)

**Every button, badge, card, input, slider, toggle group, collapsible, drawer, confirm
dialog, and keycap in the app comes from `src/ui/` (barrel `src/ui/index.ts`) — never
hand-roll one-off equivalents in feature components.** If a feature needs something the
library does not have, the library grows; the feature does not fork. `src/ui/**` and
`src/styles/ui.css` are finished — read them, and route change requests through the UI
library owner rather than patching styles locally.

| Component       | API essentials                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`        | `variant?: 'primary' \| 'secondary' \| 'ghost' \| 'danger'` (default `secondary`), `size?: 'sm' \| 'md' \| 'lg'`, `selected?`, `icon?`, `fullWidth?` + native props; labels never wrap                                                                                                                                                                                                                                                                                                                          |
| `IconButton`    | Square icon-only button: `icon`, `size?`, `variant?`, `selected?`; **`aria-label` required**                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `Badge`         | `variant?: 'neutral' \| 'accent' \| 'success' \| 'warning' \| 'danger' \| 'info'`, `size?: 'sm' \| 'md'`; helper `difficultyBadgeVariant(difficulty)` → Easy=success, Medium=warning, Hard=danger; sentence case text. **These are the app's sanctioned colour** (section 2.5)                                                                                                                                                                                                                                  |
| `Card`          | Surface panel: `title?`, `icon?`, `actions?`, `padding?: 'none' \| 'sm' \| 'md'`, `inset?`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Input`         | Text input with `leadingIcon?` and `onClear?` (clear button when non-empty), sizes                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `Slider`        | Labeled range: `label?`, `value`, `min`, `max`, `step?`, `onChange(value)`, `formatValue?`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Segmented`     | Single-select toggle group: `options: { value, label, icon? }[]`, `value`, `onChange`, `size?`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `Collapsible`   | `title`, `meta?` (right side of header), `defaultOpen?`, optional controlled `open`/`onOpenChange`; header is a real `<button>`                                                                                                                                                                                                                                                                                                                                                                                 |
| `Drawer`        | `isOpen`, `onClose`, `title`, `side?: 'right'`, `width?`, `footer?`; backdrop, ESC + backdrop close, `role="dialog"` `aria-modal`, `--z-drawer`                                                                                                                                                                                                                                                                                                                                                                 |
| `ConfirmDialog` | `isOpen`, `title`, `message: ReactNode`, `confirmLabel?`, `cancelLabel?`, `destructive?`, `onConfirm`, `onCancel`; portalled `role="dialog"` `aria-modal` with `aria-labelledby`/`aria-describedby`, Escape and backdrop click both cancel, confirm button receives focus, `destructive` renders it as `danger`. **Every destructive or irreversible action goes through this** — no `window.confirm`, no one-click data loss (the navbar's workspace-layout reset is the reference use, sections 2.2 and 2.11) |
| `Kbd`           | Small keycap chip for shortcut hints (e.g. `/`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

Note that `role="dialog"` on `Drawer` and `ConfirmDialog` is load-bearing beyond
accessibility: `isDialogOpen()` in `keyboardGuards` queries it to stand the global
shortcuts down (section 2.12).

Shared classes in `ui.css` for app components not worth a dedicated component:

- `.ui-code-line` / `.ui-code-line--active` — code viewer rows. Active row =
  `--accent-soft` background + 2px `--accent` left border + `--text-primary`, normal
  weight (a transparent left border on inactive rows prevents text shift).
- `.ui-chip` — small mono key/value chip (`--bg-elevated`, `--border-subtle`,
  `--font-code`) used for live variables, the step readout and all AuxiliaryPanel data.
  `--border-subtle` all but vanishes against a near-black panel, so components that nest
  chips inside a panel override the chip border to `--border-default` (see `CHIP_BORDER`
  in `ComplexityCard`, the same pattern in `AuxiliaryPanel` and `ControlPanel`) — do the
  same rather than leaving a borderless-looking chip.
- `.ui-dialog`, `.ui-dialog-backdrop`, `.ui-dialog__title/__body/__actions` —
  `ConfirmDialog`'s surface.

**One interaction system everywhere** (do not invent alternatives):

- Selected/active: background `--accent-soft`, 1px `--border-accent`, text
  `--accent`. Nothing else — no glow, no bold-only signaling, no scale.
- Hover (non-selected): background `--bg-hover`, text `--text-primary` (never
  `--text-muted`/`--text-faint` on hover or pressed surfaces — section 2.5).
- **Primary buttons are black-filled**: `--bg-inset` background, `--accent` border,
  `--text-primary` ink at weight 600; hover fills `--bg-surface` and brightens the
  border. Never an accent-filled slab.
- **Every card, panel, well, chip and button carries a real border token** — mandatory
  on this palette, where the reading surfaces are near-black and only ~0.6× the page
  (section 2.5).
- **The shell is neutral; colour is data.** Difficulty/status badges, `--viz-1..8`
  identity (graphs, trees, knowledge map) and `--state-*` marks are the only hue
  (section 2.5).
- Focus: `:focus-visible` → `--focus-ring` (global, already wired).
- Disabled: opacity 0.45, `cursor: not-allowed`.
- Icon sizes: 14px in `sm`, 16px in `md`, 18px in `lg` controls (set by ui.css — no
  inline icon sizes).

**Size standardization — one scale, applied everywhere:**

- **Navbar and toolbar strip controls are `size="sm"`** (`--control-h-sm`, 28px, 14px
  icons). That covers the app-view `Segmented`, all five toggle buttons, the navbar's
  `Reset layout`, the search trigger, and the `Details` button in the problem header.
- **In-panel actions are `size="md"`** (`--control-h-md`, 34px) — the playback controls
  and anything living inside a content card.
- **Badges are `size="sm"`**, with one exception: the problem title's difficulty badge
  (and the category badge beside it) stay default `md` so the header reads as the page
  title.
- **Never mix sizes inside a row.** If one control in a row is `sm`, all of them are.
- **Icon-only buttons use `IconButton`**, stay square (`--control-h-*` on both axes),
  and **always** carry an `aria-label` (`"Hide tutorial"`, `"Hide auxiliary panel"`).
- Control height, spacing and text size come from the token scales — never an ad-hoc
  `0.35rem`/`31px`. The one documented exception in the whole app is `ProblemHeader`'s
  `22rem` grid-column floor, which is commented as such.

Styling is tokens-only (section 2.5). Icons come from `lucide-react`.

---

## 6. Gotchas

- **⚠️ TOOLING — a `*.spec.tsx` sharing a basename with a `*.spec.ts` is invisible to
  TypeScript.** `tsconfig.json` is `"include": ["src"]`, and TypeScript deduplicates
  same-basename files resolved from an include glob, preferring the `.ts`. That silently
  excluded all 40 algorithm component specs from `tsc --noEmit` and hid real prop-shape
  bugs. React component specs are therefore named **`*.render.spec.tsx`**; never add a
  `foo.spec.tsx` next to a `foo.spec.ts`. Corollary: a green `bun run test` says nothing
  about whether a spec type-checks — only `bun run typecheck` does (section 4.10).
- **jsdom measures everything as zero and has no `ResizeObserver`** — `useCanvasBox`
  therefore keeps its `fallback` box in tests, and `ResizableRows`/`ResizableLayout`
  bail out of a drag when they measure a 0-height row. Assert on `data-height-mode`,
  `data-region`, `data-band`, `data-panel` and inline styles rather than on computed
  pixel sizes.
- **jsdom lacks `scrollIntoView`** — always optional-call it:
  `ref.current?.scrollIntoView?.({ block: 'nearest' })` (see `CodeBlockViewer`). A
  bare call crashes every render spec that mounts the code viewer.
- **jsdom leaves `isContentEditable` undefined** — that is why `keyboardGuards` also
  does a `[contenteditable]` ancestor lookup. Don't "simplify" it away.
- **Problem details are EXPANDED by default and the state is PERSISTED** — render specs
  must assert on `description`/`topicGuide`/constraints/examples _without_ clicking
  "Details", and any spec that toggles it (or seeds `WORKSPACE_LAYOUT_KEY`) must clear
  `localStorage` afterwards or it leaks a collapsed panel into the next test.
- **`MainLayout` takes `panels`, not `viewMode`** — there is no `viewMode`,
  `showTutorial` or `showAuxiliary` prop. A spec or caller passing them is stale
  (section 2.11).
- **Cards are darker than the page, and a borderless card is a bug** — the reading tier
  is near-black beneath a carbon page and controls step lighter, so borders carry the
  edge definition (section 2.5). Watch for `ui.css` defaults that land on
  `--border-subtle` inside a panel; promote them to `--border-default`.
- **An accent-filled primary button is a bug** — primary is `--bg-inset` fill with an
  `--accent` edge (section 2.5).
- **Do not neutralize difficulty badges, status badges or the knowledge map** — the
  Round 5 achromatic sweep went too far and R6.3 restored them. Colour in _chrome_ is
  still a bug; colour on _data_ is required (section 2.5).
- **THE CANVAS LAW: `viewBox = boxViewBox(measuredBox)`, `<svg>` at 100%/100%** — never
  a fixed-constant viewBox (dead bands inside the svg) and never an svg sized to the
  content's aspect ratio (`fitBox`, deleted — it moved the same bands into the panel).
  Vertical dead space must be zero; shape-constraint slack goes horizontal and centred
  (section 2.8).
- **Never make a visualization smaller** — every canvas mechanism reclaims dead space
  _into_ the drawing, and the node-radius floors equal the old fixed radii precisely so a
  laid-out graph or tree can only grow (section 2.8).
- **No imposed `minHeight` on a canvas wrapper other than `0`, and no centring around a
  100% svg** — `alignItems: center` or generous padding around the canvas re-creates the
  band as panel padding (section 2.8).
- **Never impose a height on a hugging panel** — code and complexity must stay
  `data-height-mode="hug"` so they reflow with content, and the visualizer is the one
  greedy row. Adding a height, a `min-height` or a flex weight recreates the dead space
  this design deleted; only a user drag may pin a height, and double-click restores
  automatic.
- **Don't stack step context outside the visualizer panel, and don't move the tutorial
  back to the bottom** — tutorial (header) → working data → canvas → playback all live
  inside the single container, and both strips share one 45%-capped band that scrolls
  internally so the panel's outer size never changes between steps (section 2.7).
- **The tutorial is prose, not a caption** — `--text-md` minimum at 1.6 line-height with
  two lines reserved, real `--space-3` padding, no `--text-xs`, no truncation. Shrinking
  it is a regression (section 2.7).
- **Duplicated text in the DOM** — a step's `what` text can appear in the tutorial strip
  and elsewhere; prefer `screen.getAllByText(...)[0]` when asserting step prose through
  `MainLayout`.
- **Global shortcuts must use `keyboardGuards`** — `isTypingTarget` and `isDialogOpen`,
  plus a modifier bail-out. Space additionally yields to a focused button/link/summary
  and must `preventDefault()` when it does act; arrow stepping pauses playback first
  (section 2.12).
  context. Don't "fix" silence-before-first-click; it is the autoplay policy. And
  never schedule into a suspended context: `currentTime` is frozen, so every queued
  tone would burst at once on resume.
  minimum step interval. Raising the interval back toward 80ms silently drops
  legitimate consecutive steps.
- **StrictMode double-render is handled by stepEngine dedupe** —
  `lastNotifiedIndexRef` guarantees `onStepChange` fires once per index move and
  never for the initial index. **Never trigger per-step side effects from render
  or an effect directly**; route them through `onStepChange`.
- **`--viz-*` slots are an ordered validated set** — assign in order, cap at 8, fold
  overflow into `--state-default`, never substitute values or cycle. Go through
  `vizPalette.ts` rather than writing `var(--viz-3)` by hand.
- **Never edit `theme.css` to get a colour you want, and never hand-tweak a value** —
  the inverted surface ladder, the border tones and the categorical palette were all
  validated numerically (WCAG contrast ladder plus the OKLCH/colourblind categorical
  gates); a "small nudge to make it pop" invalidates them. Compose from existing tokens.
- **Don't add a max-width to the details panel** — the 72ch readable measure was removed
  deliberately; details span the full container width, and the responsive
  key-terms/examples grid handles narrow viewports.
- **The stage never shrinks to fit details** — page scroll is the escape valve.
  `<main>` must keep `overflow-y: auto`; do not add `overflow: hidden` to the page,
  `<main>`, or `#root` to "stop the scrollbar".
- **The workspace layout key is only cleared by a confirmed reset, and the reset lives in
  the navbar** — that is what makes sizes and the details state survive reloads and
  dev-server restarts. Don't clear it on mount, on algorithm change, or "to be safe"
  during development, and don't add a second reset entry point. The key is
  `…_workspace_layout_v6`; older payloads (v3 weights, v4's five panels, v5 without
  `detailsExpanded`) are ignored on read, not migrated.
- **`null` panel height means automatic, and that is the default** — don't "normalize"
  it to a number on read or write. In a layout patch, absent means "leave alone" and
  explicit `null` means "back to automatic". `detailsExpanded` merges with `??`, never
  `||`.
- **The route tree is generated** — never hand-edit `src/routeTree.gen.ts` (it is
  overwritten) or the path string inside `createFileRoute('...')` (the plugin derives
  and maintains it from the filename). New routes = new files in `src/routes/`; the
  plugin regenerates during dev/build, or run `bun run generate-routes`.
- **Router plugin order in `vite.config.ts`** — `tanstackRouter(...)` must precede
  `react()`; the wrong order fails silently. This file is finished — read, don't
  edit.
- **Run scoped vitest during iteration** (`bunx vitest run <paths>`); the full
  `bun run check` runs exactly once as the final gate. The full suite is ~760 tests
  and is not an iteration loop.
- **Category aliases are not routeable** — `?category=` only accepts the 25 canonical
  ids via `isCategoryType`; legacy `CategoryType` aliases silently collapse to "no
  filter".
- **Steps must be deep-copied snapshots** — sharing element/aux references between
  `addStep` calls is the classic bug: stepping backward then shows mutated "past"
  state. Copy in the closure, always.
- **localStorage can throw** — every read/write goes through the validated
  `readStored`/`writeStored` helpers (SettingsContext), the defensive
  `readWorkspaceLayout`/`writeWorkspaceLayout`/`clearWorkspaceLayout` functions, or
  `src/trivia/triviaStorage.ts` (section 2.13). Follow that pattern for any new
  persistence: validate on read, best-effort on write, never throw into render.
- **A trivia `distractor` equal to a real line grades as _correct_** — grading is
  trim-compared, so the decoy silently becomes a right answer and nothing looks broken.
  Same class of trap: a `hints`/`skipLines` line number that is off by one just never
  fires. Both are why the metadata assertions in section 4.11 exist.
- **Never call `Math.random` in a trivia component** — take randomness from the engine's
  injectable `rng`, or the round stops being reproducible in specs (section 2.13).

---

## 7. Strict Code Quality Rules

1. **No `any` in any form** — annotations, casts, generic defaults, or implicit.
   ESLint enforces `@typescript-eslint/no-explicit-any: error`. Narrow unions with
   type guards (`if (snapshot.kind === 'graph')`), use `unknown` + guards at true
   boundaries (see `readStored` and `readWorkspaceLayout`).
2. **No suppression comments** — never `@ts-ignore`, `@ts-expect-error`, or
   `eslint-disable` (the generated `routeTree.gen.ts` header is the tool's own output
   and is exempt because you never edit it).
3. **Python only** in `code` strings — the viewer presents `solution.py`.
4. **UI from the library, colors and sizes from tokens** (sections 2.5 and 5). Zero
   hex/rgba values and zero ad-hoc rem/px in components; no ad-hoc edits to
   `theme.css`.
5. **Specs live in `specs/` subdirectories** of the folder they cover.
6. **Comments explain the non-obvious _why_** — no restating code, no JSDoc
   boilerplate, no decorative banners.
7. **Conventional Commits** — every commit subject starts with an approved tag
   (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, …), imperative, < 70 chars.

**Finished, read-only for everyone:** `src/styles/**` (`theme.css`, `index.css`,
`ui.css`), `src/ui/**`, `src/types/**` (`dsa.ts`, `trivia.ts`),
`src/trivia/triviaEngine.ts`, `index.html`, `package.json`, `vite.config.ts`,
`src/routeTree.gen.ts`.

---

## 8. Test Landscape

Vitest + jsdom (`vite.config.ts` `test` block; setup file `src/test/setup.ts` loads
`@testing-library/jest-dom`). ~760 tests across 114 spec files. Locations:

- `src/algorithms/<category>/specs/` — per algorithm, one logic spec `<name>.spec.ts`
  and one render spec **`<name>.render.spec.tsx`** (section 4.10; the `.render.` segment
  is what keeps the file under typecheck). 40 of each.
- `src/ui/specs/*.spec.tsx` — one spec per UI-library component (unique basenames, so
  plain `.spec.tsx` is fine here).
- `src/components/specs/*` — app component specs (`Navbar`, `QuickAccessDrawer`,
  `SearchTrigger`, `MainLayout`, `ResizableLayout`, `ProblemList`, `KnowledgeGraph`,
  `TutorialCard`). `MainLayout.spec.tsx` is the reference for the whole layout
  contract: page scroll never blocked, stage floor sizing, the single graph-focused stage
  container (**tutorial → working data → canvas → playback** in one panel, tutorial first
  even with the aux strip hidden, one subtle divider per seam with the last one dropped,
  both strips capped as ONE band, canvas gets every leftover pixel and never centres a
  child, hidden strip renders no wrapper, left column stays a single row), per-panel
  visibility (code off drops the complexity card and the column handle, visualizer off
  keeps the strips and docks playback under the stage, all-off empty state), the hugging
  code column (neither code nor complexity greedy, overflow on the column, visualizer the
  one greedy panel), persisted geometry (restore on mount, **v5 payload ignored**,
  keyboard nudge persisted, only the dragged panel pinned, double-click back to
  automatic), **persisted details state** (collapse written to the v6 key without
  disturbing geometry, restored on mount, survives a later drag, older payloads open it),
  and **reset announced from the navbar** (no reset control of its own, reloads defaults
  live on `WORKSPACE_LAYOUT_RESET_EVENT`, ignores the event once unmounted).
  `Navbar.spec.tsx` pins the five uniform toggles with their `aria-pressed` state plus
  the workspace-only reset button, its destructive dialog, cancel/Escape paths, and the
  fact that `/` does not fire while that dialog is open. `TutorialCard.spec.tsx` pins the
  readable-prose contract (`--text-md`/1.6, two lines reserved, no `--text-xs`, no
  truncation, real padding, flush band with no chrome of its own).
- `src/components/primitives/specs/*` — `ProblemHeader` (collapsed vs expanded lesson,
  no width/height caps, responsive key-terms/examples grids, `Details` as its only
  button), `vizGeometry` (**the viewBox law**: the viewBox is literally the measured box
  and always shares its ratio; `spreadToBox` stretching both axes and handling degenerate
  ones; the inscribed **ellipse**; `minPointSpacing`; slot fitting including the
  min-binds overshoot; tidy-tree layout with cycles and forests; attribute rounding) and
  `vizPalette` (slot ordering, overflow folding, no cycling).
- `src/trivia/specs/*` — the drill's logic, no DOM: `triviaEngine.spec.ts` (every
  escalation rule — parsing and blankability, coverage-driven level advance, weighted
  reselection, tile building, trim-compared grading, revealed-counts-as-a-miss,
  `coverageRatio`), `triviaStorage.spec.ts` (both versioned keys, validate-on-read,
  wholesale rejection of stale/malformed payloads, best-effort writes, `clearTrivia`), and
  `triviaFlow.spec.ts` — an **end-to-end drill over four real registry algorithms** with a
  seeded mulberry32 rng, proving the level climbs `minBlanks → maxBlanks` without skipping a
  rung, every deck entry gets its turn, the loop terminates, and the authored `trivia`
  metadata of those four stays in range (section 4.11: it covers _only_ those four).
- `src/components/trivia/specs/*.spec.tsx` — one per drill component; unique basenames, so
  plain `.spec.tsx` is correct here. `CodePuzzle.spec.tsx` pins the board contract (blanks
  become labelled slots, the indent is printed _outside_ the graded slot, `--success` /
  `--danger` edges only after grading, a reveal labelled "not credited" and locked once
  graded, hints behind a per-line toggle, the drop path falling back to the click path when
  a drag carries no payload). `TileTray.spec.tsx` pins click-then-click selection with drag
  as an alias, spent tiles staying visible, and the tray locking after grading.
  `TriviaSession.spec.tsx` pins taking a tile back, displacing one, Escape dropping the
  held tile, refusing to check a partially filled round, whitespace-insensitive typed
  grading, a revealed blank never being credited, and the board resetting on the next round.
  `TriviaDeckBuilder.spec.tsx` pins the quick multi-add ladder and its counts, filtering,
  difficulty badges and no raw hex; `TriviaSettings.spec.tsx` the `min <= max` slider
  coupling and a one-line explanation on every control.
- `src/routes/specs/trivia.render.spec.tsx` — the page end to end: opening on deck setup
  with an empty deck, starting a session once an algorithm is picked, restoring a stored
  deck and reporting the configured floor as the level, serving a real deck solution each
  round, grading → persisting → next round, reopening deck setup without losing the deck,
  and clearing storage **only** after the reset is confirmed.
- `src/app/specs/*` — `routing.spec.tsx` (redirects, search-param validation,
  navigation, **the whole keyboard-playback contract** — ArrowRight/ArrowLeft/Space,
  taking the wheel from playback, typing/modifier/dialog guards, Space yielding to a
  focused button, `/` still working, `aria-keyshortcuts` on the controls — plus the
  navbar reset and the panel-visibility settings migrations),
  `workspaceLayout.spec.ts` (the whole v6 persistence contract),
  `keyboardGuards.spec.ts` (`isTypingTarget` across fields and contenteditable,
  wiring).

---

## 9. Roadmap: what is planned next

**The first half of the study feature has shipped:** `/trivia` drills the `code` string
itself as progressive code occlusion, with coverage-driven escalation and per-line accuracy
persisted (sections 2.13 and 4.11). **What is still planned is the rest of the study
material:** flashcard-style recall over `topicGuide.keyTerms`, quiz questions generated from
`topicGuide.sections`, `complexityAnalysis` and `timeComplexity`/`spaceComplexity`, recall
prompts from per-step `explanation.what`/`why`, and true spaced-repetition _scheduling_
across sessions (the drill schedules by coverage and miss weight, not by clock time).

What that means for anything you write now — and it is the same discipline the drill already
proved, since the drill needed **zero** per-algorithm work to cover all 40 solutions:

- **Keep algorithm metadata declarative and reusable.** Teaching content belongs on the
  `AlgorithmDefinition` as data — never hardcoded into JSX, never assembled inside a
  component, never split across component state. If the scheduler can't read it from
  the registry, it can't quiz on it.
- **Write `keyTerms` as if they were flashcards** (they will be): a term a newcomer
  would stumble on, plus a self-contained one-or-two-sentence definition that stands on
  its own without the surrounding section.
- **Keep each `topicGuide` section self-contained** — one idea per heading, prose that
  makes sense quoted on its own.
- **Prefer new fields on the definition over new component props** when you need to
  express something about an algorithm; new persisted state follows the
  `workspaceLayout.ts` pattern (versioned key, validate on read, best-effort write, and
  a window event if a distant component has to react to a reset).
- **The study UI follows the same surface and colour law** — cards darker than the page,
  every container bordered, black-filled primary buttons, and the only colour available
  is a semantic badge for a review outcome (section 2.5). Its keyboard shortcuts reuse
  `keyboardGuards` (section 2.12), and its component specs are `*.render.spec.tsx`
  (section 4.10).

Other good contributions:

- **URL-driven workspace settings** — lift the four `PanelVisibility` booleans (and
  perhaps the step index) into `/workspace/$algorithmId` search params via
  `validateSearch`, so workspace views become shareable links; SettingsContext
  becomes the fallback rather than the source of truth. The
  `router-core/search-params` intent skill covers the patterns.
- **More algorithms per category** — most categories have 1–2 of a planned 3–4
  (registry has 40 today). Each addition is exactly the section 4 playbook; remember
  the `TOPIC_ROADMAP_NODES` count bump.
- **Group tinting for the algorithms that deserve it** — SCC, MST, islands and
  bipartite matching can all set `group` (section 2.9); `TreeVisualizer`'s `groups`
  prop still needs threading through `MainLayout` for subtree/heap tinting.
- **React 19 / Vite 8 / TS 6 upgrade path** — deliberately deferred (section 1). When
  attempted: upgrade in a branch, land Vite + vitest together, verify the whole suite
  and the router plugin ordering, then consider `@tanstack/devtools-vite`
  (needs Vite ≥ 6).
- **Custom input editors** — `supportsRandomArray` only covers plain number arrays;
  a per-kind input editor (graph/grid/tree) would make the workspace interactive for
  the other 24 categories.
