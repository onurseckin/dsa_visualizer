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

Five cross-cutting systems deserve reading before you touch anything: the
**achromatic black/carbon/smoke token palette** (section 2.5), the **graph-focused
single-container workspace** (section 2.7), the **canvas geometry / anti-letterbox
system** (section 2.8), the **step-sound classifier** (section 2.10), and the
**independent panel-visibility toggles** (section 2.11). The full design rationale
lives in `docs/planning/ui-overhaul/DESIGN.md`; its **"Round 5"** section at the very
end is authoritative where it overlaps earlier rounds — notably it supersedes **all**
earlier color guidance and the Round 4 panel arrangement.

Six rules are the ones most likely to trip you up, so they are stated up front and
repeated in context below:

1. **THE RULE: the shell is achromatic and colour is reserved for data.** There is no
   green, teal, navy or mint anywhere in chrome, panels, cards, buttons, inputs,
   drawers or text. Hue is allowed in exactly three places: `--state-*` marks inside
   visualizers, the `--viz-1..8` categorical palette for groups, and semantic
   `--success/--warning/--danger/--info` on badges and status. Everything else is
   neutral (section 2.5).
2. **Surfaces sit only ~1.09× apart, so every card, panel, well, chip and button MUST
   carry a visible border token.** A borderless container dissolves into the page —
   that is a bug, not a style preference (section 2.5).
3. **The left column is ONE container.** Working data at the top, canvas in the
   middle, tutorial at the bottom, playback docked at the edge — all inside the single
   visualizer panel. Nothing is stacked outside it, and the right column hugs its
   content (section 2.7).
4. **A sizing change must never make a visualization smaller.** Canvas work trims dead
   space so the drawing grows into it; if nodes or bars come out smaller than before,
   the change is wrong (section 2.8).
5. **React component specs are named `*.render.spec.tsx`, never `*.spec.tsx` sharing a
   basename with a `*.spec.ts` sibling.** TypeScript silently drops the duplicate from
   `include`, which once excluded all 40 component specs from typecheck (section 4.10
   and the top of section 6 — read it before you name a new spec file).
6. **There is no `ViewMode` in the workspace.** Panel visibility is four independent
   booleans driven by five visually identical navbar toggles (section 2.11).

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
  TS 5.3 to keep the 500+-test vitest stack stable (future upgrade candidates; see
  section 10).
- **pnpm** — repo uses bun (`bun.lock`). Never introduce npm/pnpm/yarn lockfiles.
- **`@tanstack/devtools-vite`** — requires Vite >= 6.

**Environment variables:** none required (no secrets; fonts load from the Google
Fonts CDN via `index.html`). The only env usage is `import.meta.env.DEV` (plus
`MODE !== 'test'`) gating the router devtools in `src/routes/__root.tsx`.

**Deployment:** `bun run build` (runs `tsc && vite build`) → static `dist/`, deploy
to any static host.

**Scripts** (always via bun):

| Command | What it does |
|---|---|
| `bun run dev` | Vite dev server (agents: don't run this — the user verifies UI) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run generate-routes` | `tsr generate` — regenerates `src/routeTree.gen.ts` |
| `bun run lint` | ESLint, zero warnings allowed |
| `bun run test` | Full vitest run (~595 tests in 107 spec files — final gate only) |
| `bunx vitest run <paths>` | Scoped test run — **use this during iteration** |
| `bun run build` | `tsc && vite build` → `dist/` |
| `bun run check` | typecheck + lint + full tests + build — the master quality gate |

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
│   ├── workspace.index.tsx       # "/workspace" → redirects to /workspace/bubble-sort
│   └── workspace.$algorithmId.tsx# "/workspace/:id" → visualizer workspace + sound wiring
├── app/
│   ├── SettingsContext.tsx       # Persisted PanelVisibility + sound + lastAlgorithmId (localStorage)
│   ├── workspaceLayout.ts        # Versioned persisted panel geometry, v5 nullable pixel heights
│   ├── categories.ts             # CATEGORIES list (25 canonical) + isCategoryType() guard
│   └── specs/                    # routing, workspaceLayout, workspaceStepSound specs
├── engine/
│   ├── stepEngine.ts             # useStepEngine hook: playback state machine + dedupe contract
│   ├── stepSound.ts              # deriveStepCue — PURE step→SoundCue classifier (no audio imports)
│   └── soundEngine.ts            # Web Audio singleton: gesture unlock, master gain, playCue
├── types/dsa.ts                  # ALL core interfaces & union types
├── styles/
│   ├── theme.css                 # Achromatic design tokens — the ONLY place raw color/size values live
│   ├── ui.css                    # UI library classes (`ui-` prefix) + shared .ui-chip/.ui-code-line
│   └── index.css                 # Token/ui imports, Tailwind theme+utilities, @theme bridge, resets
├── ui/                           # Reusable UI component library (barrel: ui/index.ts)
├── components/
│   ├── KnowledgeGraph.tsx        # SVG prerequisite roadmap (TOPIC_ROADMAP_NODES, one --viz slot/family)
│   ├── MainLayout.tsx            # Workspace shell: header strip, sized stage, ONE visualizer container
│   ├── Navbar.tsx                # App-view Segmented + five uniform toggles, "/" shortcut, search
│   ├── SearchTrigger.tsx         # Input-lookalike button that opens the search drawer
│   ├── QuickAccessDrawer.tsx     # Drawer-based algorithm search & category browser
│   ├── ControlPanel.tsx          # Play/pause, step, reset, speed, data size (embedded|standalone)
│   ├── ComplexityCard.tsx        # Big-O chips + plain-English complexity prose (Collapsible)
│   ├── ResizableLayout.tsx       # ResizableLayout (columns) + ResizableRows (hug/greedy/pinned rows)
│   ├── ProblemList.tsx           # Flat problem listing with category filter
│   └── primitives/               # Visual render primitives
│       ├── ArrayVisualizer.tsx   # kind: 'array'
│       ├── GridVisualizer.tsx    # kind: 'grid'
│       ├── GraphVisualizer.tsx   # kind: 'graph' (SVG, auto circular layout, group tinting + legend)
│       ├── TreeVisualizer.tsx    # kind: 'tree'  (SVG binary tree, optional `groups` map)
│       ├── vizGeometry.ts        # Canvas measuring + tight viewBox + fit helpers (anti-letterbox)
│       ├── vizPalette.ts         # --viz-1..8 slot helpers + connected-component derivation
│       ├── AuxiliaryPanel.tsx    # "Working data" chip rows, rendered as a strip inside the stage
│       ├── TutorialCard.tsx      # Teacher explanation strip for the current step
│       ├── CodeBlockViewer.tsx   # Python code viewer (hugs the listing), active line, Vars strip
│       └── ProblemHeader.tsx     # Title + badges + expanded-by-default full-width details/lesson
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
- **`workspace.index.tsx`** statically redirects to `/workspace/bubble-sort`
  (hooks are unavailable in `beforeLoad`; navbar-driven navigation supplies the
  persisted `lastAlgorithmId` itself).
- **`workspace.$algorithmId.tsx`** guards in `beforeLoad`: an id missing from
  `ALGORITHM_REGISTRY` redirects to `bubble-sort`, so the component can look up the
  registry unconditionally. It wires `useStepEngine`, the sound cue pipeline
  (section 2.10), and the random-input controls, then renders `MainLayout`. **Adding an
  algorithm requires zero route changes** — `/workspace/$algorithmId` resolves any
  registry id.

### 2.2 Persistence: settings and workspace geometry

Two independent localStorage layers, both defensive — reads validate and fall back,
writes are best-effort, nothing throws into render.

**`src/app/SettingsContext.tsx`** holds `panels: PanelVisibility` (the four independent
panel booleans — section 2.11), `soundEnabled`, and `lastAlgorithmId`, and exposes
`setPanel(key, visible)` / `togglePanel(key)` / `setSoundEnabled` /
`setLastAlgorithmId`. Every value is initialized from `localStorage` (keys prefixed
`dsa_visualizer_`) through a validating `readStored(key, fallback, guard)` helper —
reads that throw or contain garbage fall back to defaults; `writeStored` is
best-effort so in-memory state stays authoritative. `useSettings()` throws outside the
provider.

Panel keys are stored one boolean each: `panel_visualizer`, `panel_code`,
`panel_tutorial`, `panel_auxiliary` (plus `sound_enabled`, `last_algorithm_id`).
**Legacy settings migrate on read, in `readPanelVisibility()`:** the pre-R4.4
mutually exclusive `view_mode` value is mapped through `LEGACY_STAGE_PANELS`
(`split` → visualizer+code both on, `visual` → visualizer only, `code` → code only)
and used as the *fallback* for the two stage panels, while the old independent
`show_tutorial` / `show_auxiliary` flags fall through 1:1. A stored new-style key
always wins over the legacy fallback. `ViewMode` still exists in `src/types/dsa.ts`
**only** so this migration can type its input — no component takes it as a prop.

**`src/app/workspaceLayout.ts`** owns panel geometry under **one versioned key**, and
**v5** stores nullable pixel heights for the three panels that are still *rows of a
column*. The `tutorial` and `auxiliary` slots are gone: R5.2 moved those strips inside
the visualizer panel, so they have no handle and no height of their own to remember:

```ts
export const WORKSPACE_LAYOUT_KEY = 'dsa_visualizer_workspace_layout_v5';
export const WORKSPACE_LAYOUT_VERSION = 5;

export interface WorkspacePanelHeights {
  visualizer: number | null;
  code: number | null;
  complexity: number | null;
}

export interface WorkspaceLayout {
  version: typeof WORKSPACE_LAYOUT_VERSION;
  splitPercent: number;              // left column width %
  panelHeights: WorkspacePanelHeights; // null = automatic (hug / absorb leftover)
}
```

- **`null` means "size itself" (hug its content, or absorb the column's leftover
  space); a number means "the user dragged this panel to this pixel height".**
  Defaults are `splitPercent: 70` — the visualizer is the stage the learner watches, so
  it gets the bulk of the width (R5.2) — and every panel `null`.
  `DEFAULT_WORKSPACE_LAYOUT` is exported **frozen** — call `cloneWorkspaceLayout()`
  for a writable copy. `WORKSPACE_PANEL_KEYS` is the canonical iteration order.
- Bounds: `MIN_SPLIT_PERCENT` 25 / `MAX_SPLIT_PERCENT` 80,
  `MIN_PANEL_HEIGHT_PX` 64 / `MAX_PANEL_HEIGHT_PX` 2000 — the same bounds the reader
  validates against, so every drag stays storable. `clampPanelHeight` keeps `null`
  as `null` and degrades a non-finite number to `null` (automatic) rather than to a
  number.
- In a `WorkspaceLayoutPatch`, an **absent/`undefined`** panel key means "leave it
  alone" while an explicit **`null`** means "put this panel back on automatic". Reset
  writes `null` everywhere.
- `readWorkspaceLayout()` **never throws**: unreadable storage, malformed JSON, a
  stale `version` (every v3 weight payload and every v4 five-panel payload included),
  NaN, or out-of-range numbers all yield defaults, and the result is rebuilt field by
  field so unknown keys in storage never reach app state. Old payloads are **ignored,
  not migrated** — a shape change invalidates them wholesale.
- `writeWorkspaceLayout(patch)` merges the patch onto what is stored, clamps, writes
  best-effort, and returns the merged layout (callers set state from the return value).
- `clearWorkspaceLayout()` is the **only** thing that removes the key, and it is called
  from exactly one place: the confirmed "Reset layout" action (section 2.7). Because
  the key is otherwise never cleared, custom sizes survive reloads **and** dev-server
  restarts. Never add another code path that removes it.

One versioned key (rather than a key per handle) is deliberate: a shape change
invalidates the old data wholesale instead of half-applying it. Version bumps mean
bumping the key suffix too.

### 2.3 stepEngine — the playback state machine and its dedupe contract

`useStepEngine({ steps, soundEnabled, onStepChange, defaultSpeed })` in
`src/engine/stepEngine.ts` returns `{ currentStepIndex, currentStep, totalSteps,
isPlaying, speed, play, pause, togglePlay, stepForward, stepBackward, goToStep, reset,
setSpeed }`.

Design points that must not be broken:

- **Refs, not deps**: `steps` and `onStepChange` live in refs so the interval effect
  never churns on new callback identities.
- **Dedupe contract**: `onStepChange` fires from one dedicated effect, and only when
  `currentStepIndex` differs from `lastNotifiedIndexRef`. The ref initializes to `0`,
  so the initial index-0 render **never** notifies (no sound on page load), and
  StrictMode's double-invoked effects cannot double-fire. When the `steps` array
  identity changes (new algorithm / new input), the engine resets to index 0, stops
  playback, and pre-marks index 0 as notified so the switch is silent.
- Playback is a plain `setInterval(speed)` that auto-pauses at the last step;
  `play()` from the last step restarts at 0. The speed slider bottoms out at 50ms,
  which is what the sound throttle budget in section 2.10 is sized against.

The workspace route layers a second dedupe (`lastHandledStepRef`) inside its
`handleStepChange`, plus `prevHandledStepRef` holding the step the listener last
heard — cue classification is a delta against that step, not against the render's
previous props. Both refs reset when the `steps` identity changes so a baseline never
leaks across runs, and `prevHandledStepRef` is updated **even while muted** so
re-enabling sound resumes from a valid baseline. **Never call sound functions from
render or from ad-hoc effects** — always go through `onStepChange` so both dedupe
layers apply.

### 2.4 soundEngine — gesture unlock, master gain, cue playback

`src/engine/soundEngine.ts` exports a singleton `SoundEngine` (plus function
wrappers). Design decisions, all load-bearing:

- **Lazy AudioContext** created on first use; `webkitAudioContext` fallback; all
  failures are swallowed (sound is never allowed to crash the app).
- **Gesture unlock**: browsers create AudioContexts suspended until a user gesture.
  Scheduling into a suspended context makes every queued tone burst at once on
  resume, so the engine *skips* tones while suspended and installs capture-phase
  `pointerdown`/`keydown` listeners that call `ctx.resume()` on the first gesture,
  removing themselves once running. **Never schedule while suspended.**
- **Master gain mute**: muting sets a single master `GainNode` to 0 instantly instead
  of suspending the context (suspend freezes `currentTime` and corrupts scheduling).
- **Throttle budget sized for 50ms stepping**: `MIN_TONE_INTERVAL_MS` is **30ms** and
  `MAX_ACTIVE_VOICES` is **14**. The step interval bottoms out at 50ms, so an 80ms
  throttle (the old value) swallowed legitimate consecutive steps; the voice ceiling
  then has to hold every short cue that can overlap at that rate. Do not raise the
  throttle back up "to be safe" — that silently drops steps.
- **Cue timbres** live in `CUE_TIMBRES`, one entry per non-`complete` cue kind, each
  with `type`/`durationMs`/`peakGain`/`degreeOffset`. Durations stay **≤120ms** so
  fast playback reads crisp instead of muddy, and `advance` is deliberately the
  quietest and shortest (28ms) because it fires on every otherwise-uneventful step.
  `cueFrequency(kind, pitch)` quantizes the 0..1 pitch onto a major-pentatonic
  220–880Hz ladder plus the kind's register offset, so a run sounds intentional rather
  than like a random sweep.
- **Completion arpeggio** (`playComplete`) has a 400ms cooldown and is scheduled in
  one pass on the AudioContext clock (setTimeout chains drift and overlap).

Public API: `playCue(cue: SoundCue)` (the one the app uses — `'complete'` delegates to
the arpeggio), plus the pre-existing `playCompare(val?, maxVal?)`, `playSwap`,
`playPush`, `playPop`, `playComplete`, `setMuted/isMuted/toggleMute`.

### 2.5 The achromatic design law: black, carbon, smoke — colour is reserved for data

`src/styles/theme.css` is **finished and read-only**, and it is the only place raw
color/size values live. Every value in it was verified numerically, not by eye: the
WCAG contrast ladder (text primary ≥12:1 on every surface, secondary/muted ≥4.5:1,
faint ≥3:1), the surface luminance steps, border contrast against page and surface,
and the categorical gates for `--viz-1..8` (OKLCH lightness band, chroma floor,
protan/deutan/tritan separation, 3:1 vs surface). **Because the values are a validated
system, they must never be hand-tweaked** — not in theme.css, not as one-off hexes in
a component. A "small nudge to make it pop" invalidates the gates. If a colour seems
missing, the answer is an existing token, not a new value.

**THE RULE (R5.1): the shell is achromatic; colour is reserved for data.** The app is
black / carbon / smoke. There is **no green, teal, navy or mint anywhere** in chrome,
panels, cards, buttons, inputs, drawers, the navbar, sidebars or text. Hue appears in
exactly three places, and nowhere else:

1. **Algorithm-state marks** — `--state-*` on elements *inside* a visualizer.
2. **The categorical `--viz-1..8` palette** — identity/groups in graphs and
   data-structure views (section 2.9).
3. **Semantic badges and status** — `--success` / `--warning` / `--danger` / `--info`
   (plus their `-soft` backgrounds) in lists and badges.

Anything that is not one of those three is neutral. A tinted panel, a coloured toolbar,
an accent-hued heading — all bugs. The point is that the learner's eye is drawn to the
data because nothing else in the frame competes with it.

**The surface ladder** — the seven surface tokens with their measured relative
luminance:

| Token | Value | Relative luminance | Use |
|---|---|---|---|
| `--bg-inset` | `#030304` | 0.0009 | wells: code listings, SVG canvases, inputs |
| `--bg-page` | `#08080a` | 0.0025 | the page itself (black) |
| `--bg-chrome` | `#0e0e11` | 0.0045 | navbar, toolbars, the in-panel strips |
| `--bg-surface` | `#141417` | 0.0071 | containers: cards and panels (carbon) |
| `--bg-elevated` | `#1c1c21` | 0.0119 | buttons, chips, nested panels (smoke) |
| `--bg-hover` | `#26262c` | 0.0198 | hover |
| `--bg-pressed` | `#303037` | 0.0302 | pressed |

Nesting order is inset < page < chrome < surface < elevated < hover < pressed;
`--bg-backdrop` dims behind drawers and dialogs. There is one hue tier now, not two —
the old navy-chrome / emerald-content split is gone.

**CRITICAL — adjacent surfaces sit only ~1.09× apart, so borders carry essentially all
of the edge definition: every container, card, panel, well, chip and button MUST carry
a visible border token.** A borderless panel does not look minimal, it disappears; that
is a bug. The verified border tones are `--border-subtle` `#303037`, `--border-default`
`#50505a` (2.31:1 vs surface), `--border-strong` `#6b6b76` (3.49:1 vs surface — the
WCAG bar for UI component boundaries), `--border-accent` `#e9e9ef`. Use
`--border-default` for ordinary containers and controls, `--border-subtle` for internal
dividers inside an already-bordered card, and `--border-strong` for hovered or
emphasized boundaries. Note that some `ui.css` defaults land on `--border-subtle`, which
is nearly invisible against `--bg-surface`; the app components that nest chips inside a
panel (`ComplexityCard`, `AuxiliaryPanel`) deliberately promote every inner edge to
`--border-default` — follow that when you add one.

**Accent is bright smoke `#e9e9ef`** (`--accent`, with `--accent-hover` `#ffffff`,
`--accent-soft`, `--accent-softer`, `--text-on-accent`, and `--accent-secondary`). It is
not mint and it is not a decoration colour: it marks interaction and selection only.
Selected = `--accent-soft` background + `--border-accent` border + `--accent` text.

**Text pairing rules (AA, non-negotiable):** `--text-primary` `#f5f5f7` for headings and
values, `--text-secondary` `#c6c6cd` for body, `--text-muted` `#9e9ea7` for labels,
`--text-faint` `#7d7d86` for placeholders and disabled only. **Never put `--text-muted`
or `--text-faint` on `--bg-hover` or `--bg-pressed`** — they lose contrast on the
lighter smokes. Hover and pressed states use `--text-secondary` or `--text-primary`.

Other groups: semantic feedback (`--success/warning/danger/info` + `-soft`
backgrounds), one `--state-<name>` / `--state-<name>-bg` pair per `ElementState`
(section 3), the categorical `--viz-1..8` set (section 2.9), type scale
(`--text-xs..2xl`, `--font-ui`, `--font-code`), spacing `--space-1..8` on a 4px grid,
control heights `--control-h-sm/md/lg`, layout metrics `--navbar-h` (56px) /
`--stage-min-h` (420px) / `--panel-min-h` (200px), radii, neutral shadows (no coloured
glows), `--focus-ring`, transitions, and z-indices
`--z-dropdown/drawer/modal/tooltip`.

`ElementState` tokens stay **semantic** (what the algorithm is doing, not what a thing
is), and untouched elements sit on carbon-neutral `--state-default` / `--state-default-bg`
so **any** colour at all means "the algorithm acted here". Instead of glows, touched
elements take a heavier stroke (1px → 2px) — that is how the visualizers keep an
untouched element visibly inactive next to an active one. The `--viz-1..8` categorical
set was **re-validated against the carbon surface** and still passes every gate, so its
values are unchanged and must not be substituted.

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
anywhere outside an input/textarea/select/contenteditable, opens
`QuickAccessDrawer` (built on `ui/Drawer`; ESC or backdrop click closes). The drawer
holds an autofocused `Input` at the top, then one `Collapsible` per category with a
count `Badge`; the active algorithm's category starts open. While searching, only
matching categories render, auto-expanded. The selected row uses the standard
selected treatment plus a check icon; every row shows a difficulty `Badge`. There is
no dropdown-results search anywhere — the drawer owns all searching.

### 2.7 The graph-focused workspace: one stage container, a hugging code column

There is **no layout mode switch**. One system handles every viewport.

**The left column is ONE container (R5.2).** `MainLayout` renders a single
`Card data-panel="visualizer"` and everything about the current step lives *inside* it,
top to bottom:

1. `data-region="working-data"` — the auxiliary/working-data strip, pinned at the top.
2. `data-region="canvas"` — the visualization, taking all remaining height.
3. `data-region="tutorial"` — the teacher explanation strip.
4. `data-region="controls"` — `ControlPanel variant="embedded"`, docked at the very
   bottom edge.

**Why this shape**, and why not to undo it: the panel's *outer* size is stable, so a
step that adds an aux row or a longer sentence never resizes or reflows the surrounding
layout (no width/height twitching between steps), and the learner sees the graph, its
working data and the tutorial together without scrolling between them. **The canvas is
the only flexible region** — it absorbs the content deltas; every strip keeps its
natural height.

Mechanics worth knowing before you touch them:

- The strips are rendered through the local `PanelStrip` helper, which owns the *whole*
  separation from the canvas: one `--border-subtle` divider on the edge facing the
  canvas plus a `--bg-chrome` band fill. `AuxiliaryPanel` and `TutorialCard` therefore
  render **border-free, radius-free, shadow-free** inside it (they set
  `borderWidth: 0`, `borderRadius: 0`) so the canvas edge is exactly one line. The band
  is on the chrome tier, matching the playback strip below it, because the working-data
  chips are `--bg-elevated` and would dissolve into an equally elevated band.
- A strip is capped at `STRIP_MAX_HEIGHT` (38%) with `overflow-y: auto`, so a very long
  explanation or a wide working set can never starve the canvas — past the cap the strip
  scrolls inside itself and the panel's outer size still does not move.
- `panels.tutorial` / `panels.auxiliary` toggle the strips. A strip also requires the
  current step to actually have content for it (`currentStep?.explanation`,
  `currentStep?.auxiliaryState`) — an empty strip would be dead space. Hiding one gives
  its space to the canvas and renders **no wrapper, divider or gap** at all.
- The visualizer row is visible while *any* of the canvas or the two strips is on, and
  it is `greedy` only while the canvas is there to absorb leftovers; with the canvas
  toggled off the panel is just its strips and hugs them.

**The right column hugs its content (R5.4).** `code` and `complexity` are both
non-greedy rows: `CodeBlockViewer` shows the solution **in full** with no trailing empty
space and no internal scroll while it fits (its listing is `flex: 0 1 auto` —
shrinkable, never greedy), and `ComplexityCard` sits **immediately below** the last code
line, so a short solution pulls it up instead of leaving a gap. When the two together
exceed the column height, the **column** scrolls (`ResizableRows` is `overflow-y: auto`)
— the panels themselves do not.

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
the stage**, which is why the subtraction always uses the *collapsed* strip height.

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
  space. There is exactly **one** greedy row in the whole workspace now: the visualizer
  panel in the left column. Nothing in the right column is greedy (R5.4).
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
each adjacent visible pair — but the left column is a **single row** since R5.2, so it
renders no row handle at all; the only row handle left in the app is the one between
`code` and `complexity`. A stored `visualizer` pin is still honoured on read, and only
the column split changes the left column's geometry interactively. Both components are
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

**Reset requires confirmation.** The header's "Reset layout" button opens
`ConfirmDialog` from `src/ui` (destructive variant, Escape/backdrop/cancel all back
out). Only `onConfirm` calls `clearWorkspaceLayout()` and restores
`DEFAULT_WORKSPACE_LAYOUT` in memory — which puts **every** panel back on automatic.
Never wire a one-click reset.

**Details are expanded by default, at full container width.** `ProblemHeader` is
controlled (`expanded` / `onToggleExpanded`) and `MainLayout` initializes that state to
`true`, so the problem statement, the whole `topicGuide` lesson, key terms, constraints
and examples are visible on first paint. Specs must not click "Details" first
(section 4.10). Per R4.3 there is **no readable-measure cap** anywhere in the details
panel: the old `max-width: 72ch` is gone, prose spans the full width of its container
and stays legible through line-height instead, and nothing is squeezed into a left
column. The two multi-column blocks — **key terms** (`<dl data-testid="details-key-terms">`)
and **examples** (`data-testid="details-examples"`) — use one shared responsive grid,
`repeat(auto-fit, minmax(min(100%, 22rem), 1fr))`: as many columns as fit, collapsing to
one on narrow containers, with `min(100%, …)` keeping a single column from overflowing a
container narrower than the floor. That `22rem` column floor is the one intentional
non-token measure in the file (the token scale covers spacing and control heights, not
column measures) and it is commented as such — do not copy it as licence for ad-hoc
sizes elsewhere.

### 2.8 Canvas sizing: tight viewBox, fill the box, never letterbox

`src/components/primitives/vizGeometry.ts` is the shared geometry layer all four
visualizers use, and it exists to kill the letterboxing described in R5.3.

**The bug it fixes.** Each canvas used to build its viewBox from fixed constants (a
220-unit bar band, an 84-unit tree level, a 900×560 default box) and render it into an
`<svg width="100%" height="100%">`. Whenever that fixed ratio disagreed with the
container's ratio — which it almost always did — `preserveAspectRatio="xMidYMid meet"`
centred the drawing and painted the leftover as inset well: the empty bands above and
below every visualization.

**The three-part cure, and the rules that come out of it:**

1. **Lay out against the measured box, not a guessed ratio.** `useCanvasBox(fallback)`
   returns a `ref` plus the element's live `clientWidth/clientHeight` via
   `ResizeObserver`, so the drawing stretches into the space it actually has. jsdom has
   no `ResizeObserver` and reports zero-sized elements, so **the `fallback` is what
   tests and the first paint render** — keep it equal to the old fixed box so specs stay
   deterministic.
2. **Build the viewBox tightly around real content bounds** plus **one small uniform
   padding**. `tightViewBox(points, pad, minSpan)` does this for graph/tree; array and
   grid compute `contentWidth/contentHeight` from `fitSlots(...)`. No fixed ratio, so
   the viewBox never contains a band the drawing does not use.
3. **Size the `<svg>` element to the content's own aspect ratio** with
   `fitBox(content, box)` — the largest box with the content's ratio that fits the
   measured box. That leaves `preserveAspectRatio` nothing to centre, so the inset well
   hugs the drawing instead of framing dead space.

Supporting helpers: `fitSlots(count, available, gap, min, max)` splits a run into equal
slots as large as the box allows and reports the `span` actually occupied (the span may
exceed `available` once `min` binds, and `fitBox` then scales the whole drawing down
rather than clipping it); `tidyTreeSlots(roots, childrenOf)` returns a leaf-slot tidy
layout in **abstract units** (column index, depth) so the caller can stretch it across
whatever pixel box it measured — that stretch is what makes a tree fill its canvas
height instead of ending at a fixed per-level band, and it is cycle-safe and
forest-safe; `viewBoxAttr` rounds to two decimals so re-measuring does not churn the
attribute; `clamp` is the shared bound.

**Standing rules for any sizing change:**

- **A sizing change must never make a visualization smaller.** Steps 1 and 2 both
  *enlarge* the drawing and step 3 only removes dead space, so content always renders at
  the same scale or larger. If a change leaves nodes, bars or cells smaller than before,
  it is wrong — verify per snapshot kind (array, grid, graph, tree) that the content
  scales **up** into reclaimed space rather than staying pinned at its old scale.
- **No large imposed `minHeight`s on canvas wrappers.** The only `minHeight` allowed
  around a canvas is `0` (the flexbox shrink enabler). A visualizer root takes exactly
  the space the stage hands it: `width/height: 100%`, `minWidth/minHeight: 0`, and no
  height of its own.
- **Do not reintroduce a fixed-ratio viewBox** next to `preserveAspectRatio`. That
  combination *is* the letterbox.
- Only an auto-laid-out graph may resize its nodes: authored `x`/`y` coordinates carry
  real geometry (hulls, polygons) that a recomputed radius would misrepresent, so
  `GraphVisualizer` keeps `MIN_NODE_R` for those.
- Font sizes, node radii and stroke widths inside a canvas are **derived** from the
  measured slot/radius via `clamp(...)` — this is the one place scalar geometry is
  computed rather than tokenised, and it is why a big graph stays legible while a small
  one grows. Colours in a canvas are still tokens only.
- `vizGeometry` is pure except for `useCanvasBox`, and it is unit-tested in
  `src/components/primitives/specs/vizGeometry.spec.ts` (letterbox fix, tight bounds,
  slot fitting, tidy layout, attribute rounding). Keep new geometry in there rather than
  inlining maths in a visualizer.

### 2.9 Categorical group coloring (`--viz-1..8` + `vizPalette`)

`--viz-1..8` is a **separate axis from `--state-*`**: state says *what the algorithm is
doing right now*, a viz slot says *which group something belongs to* — connected
component, SCC id, MST tree, island index, trie branch, partition, roadmap topic
family. The set was validated for colorblind separation **as an ordered set**, so:

- assign slots in **fixed order** starting at slot 0;
- **never cycle past 8** — extras fold into `--state-default`;
- **never substitute or re-order values** (substitutions break the validated gates);
- never invent additional chart colors.

`src/components/primitives/vizPalette.ts` is the only sanctioned way to touch them:

| Export | Purpose |
|---|---|
| `VIZ_SLOT_COUNT` (8) | Number of validated slots |
| `isVizSlot(slot)` | True for integers in `[0, 8)` |
| `vizSlotColor(slot)` | `var(--viz-N)` (1-based token from a 0-based slot); out of range → `VIZ_OVERFLOW_COLOR` (`var(--state-default)`) |
| `vizSlotBg(slot, percent = 22, base = 'transparent')` | Translucent companion via `color-mix` from the same token; pass a surface token as `base` when the fill sits on an opaque panel. Out of range → `VIZ_OVERFLOW_BG` |
| `deriveConnectedComponents(nodeIds, edges)` | Weakly-connected components via union-find (direction ignored, unknown edge endpoints skipped, isolated nodes form their own component) → `{ componentOf, componentCount, largestComponentSize }` |
| `componentTintingAddsInformation(components)` | Whether derived tinting is worth showing: >1 component, ≤8 components, largest component >1 node (an edgeless point cloud would just become confetti) |

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
`TOPIC_FAMILIES`.

### 2.10 Smart step sound: a pure classifier plus a dumb player

The split is the whole point. **`src/engine/stepSound.ts` decides *what* a step
sounds like and imports no audio at all**; `soundEngine` decides *how* to make that
noise. Keep it that way — no `AudioContext`, no clocks, no module state in stepSound.

```ts
export type SoundCueKind =
  | 'advance' | 'compare' | 'swap' | 'push' | 'pop' | 'visit'
  | 'enqueue' | 'dequeue' | 'relax' | 'match' | 'complete';

export interface SoundCue { kind: SoundCueKind; pitch: number } // pitch 0..1

export function deriveStepCue(
  step: AlgorithmStep,
  prevStep: AlgorithmStep | null,
  totalSteps: number,
): SoundCue;
```

**Every step is audible; `'advance'` is the floor.** `deriveStepCue` always returns a
cue, so no step is silent — `advance` is the soft tick for steps that did nothing
classifiable.

Classification order (first match wins):

1. **Final step** → `complete` at pitch 1.
2. **Snapshot state deltas** — which `ElementState`s *appeared* since `prevStep`
   (works for all four snapshot kinds; grid cells fall back to `isPath`/`isVisited`
   when `state` is unset, and keys are positional so rebuilt cells keep identity).
   Priority: `swap`→swap, `sorted`→match, `path`→match, `compare`→compare,
   `visited`→visit, `in-stack`→push, `queued`→enqueue, `pivot`→visit. A step that both
   compares and swaps is heard as the swap, because that is the consequential part.
   `active` and `default` are deliberately absent so pointer walks stay soft ticks.
3. **Auxiliary deltas** — stack grew/shrank → `push`/`pop`, queue grew/shrank →
   `enqueue`/`dequeue`, a numeric change in `distanceTable` → `relax`, visited grew →
   `visit`, a numeric change in `customState` → `relax`. Only numeric movement counts;
   label churn like `phase: 'scanning'` is bookkeeping, not an event.
4. **Keyword tiebreaker** on `explanation.what` (swap, compar, dequeue, enqueue, push,
   pop, relax, "shorter path", visit, explor, match, found) — consulted only when
   nothing measurable changed.
5. **`advance`.**

`pitch` is `0.65 × progress + 0.35 × normalized touched value` (progress alone when no
usable value changed), so a sort audibly rises as it converges while the touched value
colors the melody within that rise.

Playback is one line in `workspace.$algorithmId.tsx`:
`soundEngine.playCue(deriveStepCue(step, prevStep, steps.length))`, guarded by
`soundEnabled` and reached only through `onStepChange`.

Standing rules: sound needs a **user gesture** to unlock; **never schedule while the
context is suspended**; rely on the **stepEngine dedupe** (plus the route's
`lastHandledStepRef`) instead of guessing at duplicates; and **never call sound from
render** or from an effect that is not the `onStepChange` path.

### 2.11 Panel visibility: four independent toggles, five identical buttons

**`ViewMode` is dead in the workspace.** The old Split/Visual/Code `Segmented` control
was removed in R4.4 and replaced by four independent booleans:

```ts
// src/types/dsa.ts
export interface PanelVisibility {
  visualizer: boolean; code: boolean; tutorial: boolean; auxiliary: boolean;
}
export type PanelKey = keyof PanelVisibility;
```

`MainLayout` takes `panels: PanelVisibility` (not `viewMode`, not `showTutorial` /
`showAuxiliary` booleans). `SettingsContext` owns the state and persists one key per
panel, migrating any legacy `view_mode` payload on read (section 2.2). `ViewMode`
remains exported from `types/dsa.ts` purely to type that migration.

**The navbar renders five visually identical toggle buttons**: Visualizer, Code,
Tutorial, Aux data, Sound. They come from one `PANEL_TOGGLES` table plus the sound
button, all in a single `role="group"` row with the same `--space-2` gap, and every one
of them is the **same `Button` with `size="sm"`**, the same icon treatment (14px, set by
`ui.css` — never inline), the same `selected` styling (accent-soft background, accent
border, accent text) and **`aria-pressed` reflecting its state**. Each is an independent
on/off that shows or hides exactly one thing — none of them is a mode switch, so never
reintroduce mutual exclusion between them, and never give one of them a different size,
variant or icon size. The panel toggles render only in the workspace app view; the sound
toggle is always present.

**The app-view navigation stays a `Segmented`** (Knowledge Tree / Problem List /
Workspace, `size="sm"`): that one *is* mutually exclusive routing, not a toggle set.

**All-off empty state.** The complexity card follows the **code** toggle (it is the code
column's companion and has no navbar switch of its own), and the tutorial/auxiliary
*strips inside the visualizer panel* (section 2.7) additionally require the current step
to actually have content for them. When every
workspace panel resolves to hidden, `MainLayout` renders a calm centered `Card` reading
"Every panel is hidden" plus instructions to turn one back on in the navbar — **never a
blank stage and never a trap**. Playback also stays reachable: `ControlPanel` is docked
inside the visualizer card (`variant="embedded"`) when the visualizer is on, and moves
below the stage (`variant="standalone"`) when it is off.

The workspace route wires the close buttons on the tutorial and working-data strips to
`setPanel('tutorial' | 'auxiliary', false)`, so dismissing a strip is the same state as
toggling it off in the navbar (`MainLayout` receives them as `onToggleTutorial` /
`onToggleAuxiliary`).

---

## 3. Core Data Contracts (`src/types/dsa.ts`)

All interfaces live in `src/types/dsa.ts` (finished — read, don't edit). The master
shape:

```typescript
export interface AlgorithmDefinition<TInput = unknown> {
  id: string;                     // URL slug AND registry key (e.g. 'two-sum')
  title: string;                  // Display title (e.g. 'Two Sum')
  category: CategoryType;         // Canonical folder id (e.g. 'arrays_and_hashing')
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  description: string;            // 1–3 sentences: problem + core idea
  constraints?: string[];         // LeetCode-style bounds, shown in Details
  examples?: ProblemExample[];    // { input, output, explanation? }
  code: string;                   // Python source string (the ONLY display language)
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  complexityAnalysis: ComplexityAnalysis; // REQUIRED plain-English prose (section 4.4)
  topicGuide: TopicGuide;                 // REQUIRED topic lesson (section 4.5)
  generateSteps: (input: TInput) => AlgorithmStep[]; // Pure, synchronous
  defaultInput: TInput;
}

export interface ComplexityAnalysis { time: string; space: string }

export interface TopicGuide {
  overview: string;                                  // what this topic IS
  sections: { heading: string; body: string }[];     // the teaching body
  keyTerms?: { term: string; definition: string }[]; // vocabulary
}
```

Each step is an immutable snapshot:

```typescript
export interface AlgorithmStep {
  stepIndex: number;              // 0-based, strictly increasing
  codeLine: number;               // 1-based line of `code` to highlight (section 4.6)
  explanation: { what: string; why: string };  // Teacher voice (section 4.3)
  primarySnapshot: PrimaryVisualSnapshot;      // array | grid | graph | tree
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
panel toggles, section 2.11), `AppView` (`'tree' | 'list' | 'workspace'`),
`DifficultyLevel`, `CategoryType`, and the legacy `ViewMode` retained only for the
settings migration.

`CategoryType` contains the 25 canonical ids plus legacy compatibility aliases
(`stack`, `trees`, `graphs`, `sorting`, …). **New algorithms must use a canonical
id** — `isCategoryType()` only accepts the canonical 25, so aliases are not routeable
category filters.

---

## 4. Playbook: Adding a New Problem End-to-End

### 4.1 Pick the category (decision guide — all 25)

| Folder | What belongs there |
|---|---|
| `arrays_and_hashing` | Hash maps, frequency counting, prefix sums, single-pass array scans, elementary sorts (Two Sum, Kadane, Bubble Sort live here) |
| `two_pointers` | Converging/parallel index pairs over arrays, partition schemes (sorted Two Sum, Quick Sort's partition) |
| `sliding_window` | Contiguous-window optimizations, monotonic deques over a moving range |
| `stack_and_queue` | Problems whose core structure is LIFO/FIFO discipline (Valid Parentheses, monotonic stacks) |
| `binary_search` | Halving a search space — sorted arrays, matrices, or the answer space itself |
| `linked_list` | Pointer surgery on node chains: reversal, cycle detection, merging |
| `tree_fundamentals` | Binary tree recursion/traversal basics: DFS orders, LCA, depth |
| `tree_queries_and_diameter` | Path and aggregate computations over trees: diameter, subtree sums, rerooting |
| `tries_and_strings` | Prefix trees and string matching automata (Trie, KMP, Z-algorithm) |
| `heap_and_priority_queue` | Top-k, streaming order statistics, heapify mechanics |
| `backtracking` | Exhaustive recursive search with undo (N-Queens, permutations, subsets) |
| `graph_traversal` | BFS/DFS reachability, flood fill, connected components on grids/graphs |
| `graph_shortest_paths` | Distance computation: Dijkstra, Bellman-Ford, Floyd-Warshall, 0-1 BFS |
| `graph_spanning_trees` | Minimum spanning trees and union-find machinery (Kruskal, Prim) |
| `graph_directed_and_scc` | DAG ordering and strongly connected components (topological sort, Kosaraju, Tarjan) |
| `graph_flows_and_cuts` | Max-flow / min-cut / bipartite matching (Ford-Fulkerson, Edmonds-Karp) |
| `dp_1d` | Dynamic programming over a single index/state dimension (coin change, house robber, LIS) |
| `dp_2d` | DP over grids or two sequences (edit distance, LCS, unique paths) |
| `intervals` | Sort-then-sweep over ranges: merging, scheduling, overlap counting |
| `greedy_algorithms` | Local-choice-optimal constructions (Huffman coding, activity selection) |
| `bit_manipulation` | Bitwise identities and tricks (counting bits, XOR pairing, masks) |
| `math_and_number_theory` | Primes, GCD, modular arithmetic, combinatorics (Sieve, Euclid) |
| `game_theory` | Win/lose state analysis and Sprague-Grundy style reasoning (Nim) |
| `advanced_range_queries` | Fenwick trees, segment trees, lazy propagation over ranges |
| `geometry_and_sweep_line` | Computational geometry and sweeps (convex hull, polygon area, closest pair) |

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

Strict typing throughout: no `any` in any form, no `unknown` casts, no suppression
comments. Narrow snapshot unions with `if (snapshot.kind === 'graph') { ... }`.

### 4.3 Write explanations in the teacher voice

Every `explanation` is `{ what, why }` (contract from
`docs/planning/ui-overhaul/DESIGN.md` §6):

- **`what`** — short present-tense action label, ≤ ~8 words, with actual values when
  they help: `Compute the complement 7`, `Visit nums[2] = 11`.
- **`why`** — 1–2 conversational sentences explaining why this step happens and what
  it means, with the **actual runtime values interpolated** into the string. Address
  the learner as "we". No headers, no bullet lists, no exclamation spam, no robotic
  `Equation:`-style prefixes, and no Big-O lectures mid-step (a brief complexity note
  at the final step is fine).

**Good** (Two Sum, checking the map — from DESIGN.md):

> what: `Look up 7 in the map`
> why: `We need a partner for 2 that reaches 9, so we check whether 7 has already
> been seen. It hasn't yet — so we remember 2 and keep walking.`

**Bad** — each violates the contract:

> why: `Checking hashmap for key=7. Found=false.` *(log line, no "we", no meaning)*
> why: `Equation: complement = target - nums[i] = 9 - 2 = 7` *(robotic prefix, restates code)*
> why: `Hash map lookups are O(1) amortized, giving O(n) overall!` *(Big-O lecture mid-step + exclamation)*
> why: `We look up the complement.` *(no runtime values interpolated — every step must use the real numbers)*

Branchy steps should interpolate the branch taken (see the `hasComplement` ternary in
`twoSum.ts` — the same step number produces different prose per outcome).

Keyword note: the sound classifier reads `explanation.what` only as a last-resort
tiebreaker (section 2.10). Write it for the learner; don't contort it for audio.

### 4.4 Write the complexity prose

`complexityAnalysis` is **required** (contract from DESIGN.md §7):

- `time` — 2–4 plain-English sentences explaining **why** the time complexity is what
  it is, not restating the bound.
- `space` — 1–3 sentences: what memory grows and why.

**Good** (Two Sum — from DESIGN.md):

> time: `We walk the array once, and each hash-map lookup and insert costs O(1) on
> average, so the total work grows linearly with the number of elements — O(n). Even
> in the worst case, where no pair exists, we still make just a single pass.`
> space: `The hash map stores up to one entry per element before a pair is found, so
> extra memory grows linearly with the input — O(n).`

**Bad**:

> time: `O(n) because it is linear.` *(restates the chip; the chips already show O(n) — the prose must carry the reasoning)*
> space: `Uses a hash map.` *(names the structure without saying what grows or why)*

`ComplexityCard` renders the `timeComplexity` best/average/worst chips and
`spaceComplexity` chip, then these paragraphs beneath them.

### 4.5 Write the `topicGuide` (required topic lesson)

`topicGuide` is a **required** field and it is the biggest writing task in a new
algorithm. It is a *topic lesson*, not step narration: something a learner could study
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
  structure *is* and what class of problem it solves.
- `sections` — **4–6** sections, each `body` being **3–6 full sentences**. Cover, in
  this spirit (adapt the headings to the topic): the core idea and the insight that
  makes it work; how the mechanism operates concretely; why it is correct (the
  invariant it maintains); when to reach for it versus the alternatives; pitfalls and
  edge cases; how it generalizes to sibling problems.
- `keyTerms` — 3–6 terms a newcomer would stumble on, each defined in one or two
  sentences. Optional in the type, expected in practice; `ProblemHeader` renders them
  as a real `<dl>` definition list.

**Voice.** A good teacher writing prose: **second person ("you")**, concrete, full
sentences. No bullet fragments inside `body`, no markdown syntax (it renders as plain
text), no Big-O dumps, no restating the step list.

**How it differs from its neighbours** — three fields, three jobs, no overlap:

| Field | Job | Voice |
|---|---|---|
| `explanation.why` (per step) | Play-by-play of *this* step with real runtime values | "we", 1–2 sentences |
| `complexityAnalysis` | Why the time/space bounds are what they are | plain-English reasoning about cost |
| `topicGuide` | The whole subject behind the problem: idea, mechanism, invariant, trade-offs, pitfalls, generalization | teacher prose, "you", 4–6 sections |

**Good** (Two Sum — abridged from `twoSum.ts`, the canonical reference):

> heading: `Why checking before inserting is what makes it correct`
> body: `The invariant is that when you begin processing index i, seen contains exactly
> the values at indices 0 through i minus 1, each mapped to a valid earlier index.
> Because of that, a hit on the complement is guaranteed to be a genuinely different
> element rather than the current one reused twice. … If you inserted before checking,
> a target of exactly twice the current value would match the element against itself
> and return a bogus duplicate index.`

**Bad**:

> body: `- Use a hash map\n- Check complement\n- Return indices` *(bullet fragments, markdown, no prose)*
> body: `We look up the complement in the map, then we insert.` *(step narration — that is `explanation.why`'s job)*
> body: `Runs in O(n) time and O(n) space because each lookup is O(1).` *(that is `complexityAnalysis`)*
> body: `This is a very common interview question and you should know it.` *(no teaching content)*

**Details render expanded by default**, so the whole guide is on screen at first paint
(section 2.7) — which changes the spec convention in 4.10.

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
- `variables` feeds the "Vars" chip strip docked under the code viewer — keep it to
  the handful of live values a reader would trace (`i`, `complement`, `target`), not
  a dump of all state.
- Snapshot fidelity also drives sound: the classifier diffs `ElementState`s and
  auxiliary structures between consecutive steps (section 2.10). A generator that
  faithfully marks `compare`/`swap`/`visited` and copies its stack/queue gets
  meaningful audio for free; one that leaves everything `default` gets soft ticks.

Skeleton:

```typescript
export const generateExampleSteps = (input: ExampleInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.nums.map((val, idx) => ({
    id: `el-${idx}`, value: val, state: 'default',
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements: elements.map((el) => ({ ...el, pointers: el.pointers ? [...el.pointers] : undefined })),
      },
      auxiliaryState: { /* copy whatever aux structures apply */ },
      variables,
    });
  };

  addStep(1, 'Start the search',
    `We want two numbers in [${input.nums.join(', ')}] that add up to ${input.target}. ...`,
    { target: input.target });
  // ... mutate elements/aux state, addStep after each meaningful action ...
  return steps;
};
```

### 4.7 Choose the `PrimaryVisualSnapshot` kind

- **`array`** — anything linear: number arrays, strings (one element per char),
  pointer walks, sliding windows, DP over one row. Use `pointers: ['i', 'j']` for
  index labels and `state` for per-element coloring. Default choice when unsure.
- **`grid`** — inherently 2D state: matrices, pathfinding boards, island maps,
  N-Queens boards, 2D DP tables. Cells carry `isStart/isEnd/isWall/isVisited/isPath`
  for pathfinding semantics or `state` for generic coloring.
- **`graph`** — node/edge structures: traversals, shortest paths, MSTs, SCCs, flows.
  `x`/`y` are optional — `GraphVisualizer` auto-places nodes on a circle sized to the
  *measured* canvas when they are omitted, and only an auto-laid-out graph is allowed to
  scale its node radius up, so **leaving coordinates off usually yields the larger,
  better-filling drawing**. Provide coordinates only when layout carries real meaning
  (flow networks left-to-right, geometry). Mark progress with `isTraversed`/`isPath` on
  edges and `state` on nodes. **Optionally** set `group?: number` on nodes (and edges) when the algorithm
  has a real identity partition to show — SCC ids, MST trees, island indices, bipartite
  sides. Follow the slot rules in section 2.9: zero-based, discovery order, no cycling
  past 8, `undefined` while a group is still undecided. With no explicit groups, the
  visualizer tints multi-component graphs from derived connected components and
  otherwise leaves the purely semantic look alone.
- **`tree`** — binary trees with parent→child identity: traversals, LCA, heaps
  drawn as trees, tries. Nodes link via `leftId`/`rightId` with an optional `rootId`;
  `x`/`y` optional. Prefer omitting them: `TreeVisualizer` then runs `tidyTreeSlots` and
  stretches columns and levels across the measured box, which is what makes a shallow
  tree fill the canvas instead of stopping at a fixed per-level band. **Authored
  coordinates are honoured only when EVERY node has them** (mixing authored and computed
  positions would collide), so a partially-positioned tree silently falls back to the
  tidy layout — either position all of it (Huffman does) or none of it. Identity tinting
  comes from `TreeVisualizer`'s `groups` prop (node id → slot), not from the snapshot.

One algorithm uses one kind for all its steps — the visualizer swaps per-step but
mixing kinds mid-run is confusing and untested.

### 4.8 Choose `auxiliaryState` fields

Each populated field renders as a labeled chip row in the `AuxiliaryPanel` — the
"Working data" strip pinned at the top of the visualizer panel (section 2.7);
empty/absent fields render nothing:

| Field | UI row | Notes |
|---|---|---|
| `stack: (string\|number)[]` | "Stack" | Last item gets a `top` marker |
| `queue: (string\|number)[]` | "Queue" | First item gets a `front` marker |
| `visited: (string\|number)[]` | "Visited (n)" | Count in the label |
| `hashMap: Record<string, string\|number>` | "Hash map" | Rendered `key → value` |
| `distanceTable: Record<string, number>` | "Distances" | `Infinity` renders as `∞` |
| `customState: Record<string, string\|number>` | "State" | Rendered `key = value`; the catch-all for anything else (dp rows, flow totals, counters) |

Copy the structures on every `addStep` (`{ ...hashMap }`, `[...queue]`). Use the
field that matches the algorithm's actual working structure — a BFS should populate
`queue` + `visited`, Dijkstra `distanceTable` + `visited`, DFS `stack`, DP
`customState`. These fields are also what the sound classifier listens to for
push/pop/enqueue/dequeue/relax cues, so put real values in the right field rather than
stuffing everything into `customState`.

### 4.9 Register the algorithm

In `src/algorithms/registry.ts`, import and add one entry:

```typescript
import { myAlgo } from './my_category/myAlgo';

export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition> = {
  // ...
  'my-algo': myAlgo as AlgorithmDefinition,
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
- Final state: the algorithm's *answer* is correct for the default input **and** for
  at least 2–3 custom inputs including an edge case (no solution, negative numbers,
  cycle present, empty-ish input).

**Render spec — `<name>.render.spec.tsx`** (component integration through `MainLayout`;
note the `.render.` segment — see the hard rule above). `MainLayout` takes
**`panels: PanelVisibility`** — there is no `viewMode`, `showTutorial` or
`showAuxiliary` prop any more:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { myAlgo, generateMyAlgoSteps, DEFAULT_MY_ALGO_INPUT } from '../myAlgo';

it('renders title, description and topic guide', () => {
  const steps = generateMyAlgoSteps(DEFAULT_MY_ALGO_INPUT);
  const noop = vi.fn();
  render(
    <MainLayout
      algorithm={myAlgo}
      currentStep={steps[0]}
      panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
      onToggleTutorial={noop}
      onToggleAuxiliary={noop}
    />
  );
  expect(screen.getByText('My Algo Title')).toBeInTheDocument();
  // Problem details render EXPANDED by default — never click "Details" first.
  expect(screen.getByText(/first words of the description/i)).toBeInTheDocument();
  expect(screen.getByText(myAlgo.topicGuide.overview)).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: myAlgo.topicGuide.sections[0].heading })
  ).toBeInTheDocument();
});
```

**Four spec conventions to get right:**

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
  way to test the *toggle* itself — see `src/components/specs/MainLayout.spec.tsx`.)
- **The whole step context is inside one panel** (section 2.7), so working data, canvas
  and tutorial are all in the tree together; query by text rather than by panel
  structure, and remember jsdom measures every element as zero-sized, so the canvas
  renders from its `fallback` box (section 2.8).

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
suffix. If what you are adding is really *step context*, prefer a new strip **inside**
the visualizer panel over a new row outside it — that is the R5.2 shape.

Run only your specs while iterating:

```bash
bunx vitest run src/algorithms/<category>/specs/<name>.spec.ts src/algorithms/<category>/specs/<name>.render.spec.tsx
```

### 4.11 Final gate

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

| Component | API essentials |
|---|---|
| `Button` | `variant?: 'primary' \| 'secondary' \| 'ghost' \| 'danger'` (default `secondary`), `size?: 'sm' \| 'md' \| 'lg'`, `selected?`, `icon?`, `fullWidth?` + native props; labels never wrap |
| `IconButton` | Square icon-only button: `icon`, `size?`, `variant?`, `selected?`; **`aria-label` required** |
| `Badge` | `variant?: 'neutral' \| 'accent' \| 'success' \| 'warning' \| 'danger' \| 'info'`, `size?: 'sm' \| 'md'`; helper `difficultyBadgeVariant(difficulty)` → Easy=success, Medium=warning, Hard=danger; sentence case text |
| `Card` | Surface panel: `title?`, `icon?`, `actions?`, `padding?: 'none' \| 'sm' \| 'md'`, `inset?` |
| `Input` | Text input with `leadingIcon?` and `onClear?` (clear button when non-empty), sizes |
| `Slider` | Labeled range: `label?`, `value`, `min`, `max`, `step?`, `onChange(value)`, `formatValue?` |
| `Segmented` | Single-select toggle group: `options: { value, label, icon? }[]`, `value`, `onChange`, `size?` |
| `Collapsible` | `title`, `meta?` (right side of header), `defaultOpen?`, optional controlled `open`/`onOpenChange`; header is a real `<button>` |
| `Drawer` | `isOpen`, `onClose`, `title`, `side?: 'right'`, `width?`, `footer?`; backdrop, ESC + backdrop close, `role="dialog"` `aria-modal`, `--z-drawer` |
| `ConfirmDialog` | `isOpen`, `title`, `message: ReactNode`, `confirmLabel?`, `cancelLabel?`, `destructive?`, `onConfirm`, `onCancel`; portalled `role="dialog"` `aria-modal` with `aria-labelledby`/`aria-describedby`, Escape and backdrop click both cancel, confirm button receives focus, `destructive` renders it as `danger`. **Every destructive or irreversible action goes through this** — no `window.confirm`, no one-click data loss (the workspace layout reset is the reference use, section 2.7) |
| `Kbd` | Small keycap chip for shortcut hints (e.g. `/`) |

Shared classes in `ui.css` for app components not worth a dedicated component:

- `.ui-code-line` / `.ui-code-line--active` — code viewer rows. Active row =
  `--accent-soft` background + 2px `--accent` left border + `--text-primary`, normal
  weight (a transparent left border on inactive rows prevents text shift).
- `.ui-chip` — small mono key/value chip (`--bg-elevated`, `--border-subtle`,
  `--font-code`) used for live variables and all AuxiliaryPanel data. `--border-subtle`
  all but vanishes against a carbon panel, so components that nest chips inside a panel
  override the chip border to `--border-default` (see `CHIP_BORDER` in `ComplexityCard`
  and `AuxiliaryPanel`) — do the same rather than leaving a borderless-looking chip.
- `.ui-dialog`, `.ui-dialog-backdrop`, `.ui-dialog__title/__body/__actions` —
  `ConfirmDialog`'s surface.

**One interaction system everywhere** (do not invent alternatives):

- Selected/active: background `--accent-soft`, 1px `--border-accent`, text
  `--accent`. Nothing else — no glow, no bold-only signaling, no scale.
- Hover (non-selected): background `--bg-hover`, text `--text-primary` (never
  `--text-muted`/`--text-faint` on hover or pressed surfaces — section 2.5).
- Primary buttons: solid `--accent` bg, `--text-on-accent` text; hover `--accent-hover`.
- **Every card, panel, well, chip and button carries a real border token** — mandatory
  when adjacent surfaces are only ~1.09× apart (section 2.5).
- **Nothing in the shell is coloured.** Buttons, badges-that-are-not-semantic, panels,
  toolbars and text are neutral; hue is only `--state-*`, `--viz-1..8`, and semantic
  badge/status tokens (section 2.5).
- Focus: `:focus-visible` → `--focus-ring` (global, already wired).
- Disabled: opacity 0.45, `cursor: not-allowed`.
- Icon sizes: 14px in `sm`, 16px in `md`, 18px in `lg` controls (set by ui.css — no
  inline icon sizes).

**Size standardization (R4.5) — one scale, applied everywhere:**

- **Navbar and toolbar strip controls are `size="sm"`** (`--control-h-sm`, 28px, 14px
  icons). That covers the app-view `Segmented`, all five toggle buttons, the search
  trigger, and the `Details` / `Reset layout` buttons in the problem header strip.
- **In-panel actions are `size="md"`** (`--control-h-md`, 34px) — the playback controls
  and anything living inside a content card.
- **Badges are `size="sm"`**, with one exception: the problem title's difficulty badge
  (and the category badge beside it) stay default `md` so the header reads as the page
  title.
- **Never mix sizes inside a row.** If one control in a row is `sm`, all of them are.
- **Icon-only buttons use `IconButton`**, stay square (`--control-h-*` on both axes),
  and **always** carry an `aria-label` (`"Hide tutorial"`, `"Hide auxiliary panel"`).
- Control height, spacing and text size come from the token scales — never an ad-hoc
  `0.35rem`/`31px`.

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
  `data-region` and inline styles rather than on computed pixel sizes.
- **jsdom lacks `scrollIntoView`** — always optional-call it:
  `ref.current?.scrollIntoView?.({ block: 'nearest' })` (see `CodeBlockViewer`). A
  bare call crashes every render spec that mounts the code viewer.
- **Problem details are EXPANDED by default** — render specs must assert on
  `description`/`topicGuide`/constraints/examples *without* clicking "Details".
  Clicking now collapses them. (This reverses the old convention; any spec still
  clicking first is stale.)
- **`MainLayout` takes `panels`, not `viewMode`** — there is no `viewMode`,
  `showTutorial` or `showAuxiliary` prop. A spec or caller passing them is stale
  (section 2.11).
- **Colour in the shell is a bug** — no green, teal, navy or mint in chrome, panels,
  cards, buttons, inputs, drawers or text. Hue only in `--state-*` inside visualizers,
  `--viz-1..8` for groups, and semantic badge/status tokens (section 2.5).
- **A borderless card is a bug** — adjacent surfaces are ~1.09× apart, so anything
  without a visible border token disappears into the page (section 2.5). Watch for
  `ui.css` defaults that land on `--border-subtle` inside a panel.
- **Never impose a height on a hugging panel** — code and complexity must stay
  `data-height-mode="hug"` so they reflow with content, and the visualizer is the one
  greedy row. Adding a height, a `min-height` or a flex weight recreates the dead space
  this design deleted; only a user drag may pin a height, and double-click restores
  automatic.
- **Don't stack step context outside the visualizer panel** — working data, canvas,
  tutorial and playback live inside the single container (section 2.7). Pulling a strip
  back out as its own row reintroduces the step-to-step reflow the shape exists to
  prevent.
- **Never make a visualization smaller** — canvas sizing work must reclaim dead space
  *into* the drawing. No fixed-ratio viewBox beside `preserveAspectRatio`, no imposed
  `minHeight` on a canvas wrapper other than `0` (section 2.8).
- **Duplicated text in the DOM** — a step's `what` text can appear in the tutorial strip
  and elsewhere; prefer `screen.getAllByText(...)[0]` when asserting step prose through
  `MainLayout`.
- **Sound requires a user gesture** — browsers start AudioContexts suspended; the
  soundEngine skips tones until its pointerdown/keydown unlock listeners resume the
  context. Don't "fix" silence-before-first-click; it is the autoplay policy. And
  never schedule into a suspended context: `currentTime` is frozen, so every queued
  tone would burst at once on resume.
- **Don't loosen the sound throttle** — 30ms / 14 voices is sized for the 50ms
  minimum step interval. Raising the interval back toward 80ms silently drops
  legitimate consecutive steps.
- **`stepSound.ts` must stay audio-free** — it is a pure classifier so it can be unit
  tested without Web Audio. Importing `soundEngine` there (or adding clocks/module
  state) breaks that contract.
- **StrictMode double-render is handled by stepEngine dedupe** —
  `lastNotifiedIndexRef` guarantees `onStepChange` fires once per index move and
  never for the initial index. **Never add sound calls in render or effects
  directly**; route all side effects through `onStepChange`.
- **`--viz-*` slots are an ordered validated set** — assign in order, cap at 8, fold
  overflow into `--state-default`, never substitute values or cycle. Go through
  `vizPalette.ts` rather than writing `var(--viz-3)` by hand.
- **Never edit `theme.css` to get a colour you want, and never hand-tweak a value** —
  the black/carbon/smoke surface ladder, the border tones and the categorical palette
  were all validated numerically (WCAG contrast ladder plus the OKLCH/colourblind
  categorical gates); a "small nudge to make it pop" invalidates them. Compose from
  existing tokens.
- **Don't add a max-width to the details panel** — R4.3 removed the 72ch readable
  measure deliberately; details span the full container width, and the responsive
  key-terms/examples grid handles narrow viewports.
- **The stage never shrinks to fit details** — page scroll is the escape valve.
  `<main>` must keep `overflow-y: auto`; do not add `overflow: hidden` to the page,
  `<main>`, or `#root` to "stop the scrollbar".
- **The workspace layout key is only cleared by a confirmed reset** — that is what
  makes sizes survive reloads and dev-server restarts. Don't clear it on mount, on
  algorithm change, or "to be safe" during development. The key is
  `…_workspace_layout_v5`; older payloads (v3 weights, v4's five-panel shape) are
  ignored on read, not migrated.
- **`null` panel height means automatic, and that is the default** — don't "normalize"
  it to a number on read or write. In a layout patch, absent means "leave alone" and
  explicit `null` means "back to automatic".
- **The route tree is generated** — never hand-edit `src/routeTree.gen.ts` (it is
  overwritten) or the path string inside `createFileRoute('...')` (the plugin derives
  and maintains it from the filename). New routes = new files in `src/routes/`; the
  plugin regenerates during dev/build, or run `bun run generate-routes`.
- **Router plugin order in `vite.config.ts`** — `tanstackRouter(...)` must precede
  `react()`; the wrong order fails silently. This file is finished — read, don't
  edit.
- **Run scoped vitest during iteration** (`bunx vitest run <paths>`); the full
  `bun run check` runs exactly once as the final gate. The full suite is ~595 tests
  and is not an iteration loop.
- **Category aliases are not routeable** — `?category=` only accepts the 25 canonical
  ids via `isCategoryType`; legacy `CategoryType` aliases silently collapse to "no
  filter".
- **Steps must be deep-copied snapshots** — sharing element/aux references between
  `addStep` calls is the classic bug: stepping backward then shows mutated "past"
  state. Copy in the closure, always.
- **localStorage can throw** — every read/write goes through the validated
  `readStored`/`writeStored` helpers (SettingsContext) or the defensive
  `readWorkspaceLayout`/`writeWorkspaceLayout`/`clearWorkspaceLayout` functions.
  Follow that pattern for any new persistence: validate on read, best-effort on write,
  never throw into render.

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
6. **Comments explain the non-obvious *why*** — no restating code, no JSDoc
   boilerplate, no decorative banners.
7. **Conventional Commits** — every commit subject starts with an approved tag
   (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, …), imperative, < 70 chars.

**Finished, read-only for everyone:** `src/styles/theme.css`, `src/styles/index.css`,
`src/styles/ui.css`, `src/ui/**`, `src/types/dsa.ts`, `index.html`, `package.json`,
`vite.config.ts`, `src/routeTree.gen.ts`.

---

## 8. Test Landscape

Vitest + jsdom (`vite.config.ts` `test` block; setup file `src/test/setup.ts` loads
`@testing-library/jest-dom`). ~595 tests across 107 spec files. Locations:

- `src/algorithms/<category>/specs/` — per algorithm, one logic spec `<name>.spec.ts`
  and one render spec **`<name>.render.spec.tsx`** (section 4.10; the `.render.` segment
  is what keeps the file under typecheck).
- `src/ui/specs/*.spec.tsx` — one spec per UI-library component (unique basenames, so
  plain `.spec.tsx` is fine here).
- `src/components/specs/*` — app component specs (`Navbar`, `QuickAccessDrawer`,
  `SearchTrigger`, `MainLayout`, `ResizableLayout`, `ProblemList`, `KnowledgeGraph`,
  `TutorialCard`). `MainLayout.spec.tsx` is the reference for the whole layout
  contract: page scroll never blocked, stage floor sizing, expanded-by-default details,
  the single graph-focused stage container (working data / canvas / tutorial / playback
  nested in one panel, subtle divider on the edge facing the canvas, canvas gets every
  leftover pixel, a hidden strip renders no wrapper, left column stays a single row),
  per-panel visibility (code off drops the complexity card and the column handle,
  visualizer off keeps the strips and docks playback under the stage, all-off empty
  state), the hugging code column (neither code nor complexity greedy, overflow on the
  column, visualizer the one greedy panel, both columns automatic as step content grows
  and shrinks), persisted geometry (restore on mount, **v4 payload ignored**, keyboard
  nudge persisted, only the dragged panel pinned, double-click back to automatic), and
  reset-only-on-confirm. `Navbar.spec.tsx` pins the five uniform toggles and their
  `aria-pressed` state.
- `src/components/primitives/specs/*` — `ProblemHeader` (collapsed vs expanded lesson
  rendering), `vizGeometry` (the letterbox fix: content-ratio fitting, scaling small
  drawings **up**, tight bounds with no extra band, slot fitting, tidy-tree layout,
  attribute rounding) and `vizPalette` (slot ordering, overflow folding, no cycling).
- `src/engine/specs/*` — `stepEngine` dedupe, `soundEngine` scheduling/throttle,
  `stepSound` cue classification.
- `src/app/specs/*` — `routing.spec.tsx` (redirects, search-param validation,
  navigation), `workspaceLayout.spec.ts` (the whole persistence contract),
  `workspaceStepSound.spec.tsx` (route-level cue wiring).

---

## 9. Roadmap: what is planned next

**Spaced-repetition memorization + trivia is the next planned feature.** The intent is
to turn the existing algorithm metadata into study material: flashcard-style recall over
`topicGuide.keyTerms`, quiz questions generated from `topicGuide.sections`,
`complexityAnalysis`, `timeComplexity`/`spaceComplexity`, and per-step
`explanation.what`/`why`, with review scheduling persisted like the other settings.

What that means for anything you write now:

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
  `workspaceLayout.ts` pattern (versioned key, validate on read, best-effort write).
- **The study UI will be achromatic too** — cards, decks, progress chrome and buttons
  come from `src/ui` on neutral tokens; the only colour available is a semantic badge
  for a review outcome (section 2.5). And its component specs are `*.render.spec.tsx`
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
