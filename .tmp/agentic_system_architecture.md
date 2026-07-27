# Agentic Graph System Architecture — Self-Validating & Recursive UI Optimization Engine

## 1. Executive Summary & Architectural Philosophy
The **Agentic Graph System Architecture** is a hierarchical, recursive multi-agent system designed for zero-defect UI design system enforcement, spatial balance, and component refactoring. 

Rather than executing linear edits, this architecture operates as a **directed acyclic graph (DAG) of domain leads, recursive inspector/refactor subagents, and automated audit loops**.

---

## 2. Agentic Graph Topology & Flow Diagram

```
                                  +-----------------------+
                                  | Main Orchestrator     |
                                  +-----------+-----------+
                                              |
                +-----------------------------+-----------------------------+
                |                             |                             |
                v                             v                             v
   +-------------------------+   +-------------------------+   +-------------------------+
   | domain_lead_tree_layout |   | domain_lead_prob_trivia |   | domain_lead_workspace  |
   +------------+------------+   +------------+------------+   +------------+------------+
                |                             |                             |
     +----------+----------+       +----------+----------+       +----------+----------+
     |                     |       |                     |       |                     |
     v                     v       v                     v       v                     v
+----------+          +----------+ |                +----------+ |                +----------+
|Inspector |          |Refactor  | |                |Inspector | |                |Inspector |
+----+-----+          +----+-----+ |                +----+-----+ |                +----+-----+
     |                     |       |                     |       |                     |
     v                     v       v                     v       v                     v
+----+---------------------+-----+ |                +----+-----+ |                +----+-----+
| self_validation_auditor        | |                |Refactor  | |                |Refactor  |
+--------------------------------+ +----------------+----+-----+ +----------------+----+-----+
                                                         |                             |
                                                         v                             v
                                            +------------+-------------+  +------------+-------------+
                                            | self_validation_auditor  |  | self_validation_auditor  |
                                            +--------------------------+  +--------------------------+
```

---

## 3. Specialized Subagent Registry & Skills Matrix

### Injected Skill Sets Overview

| Subagent Role | Primary Skill Sets Injected | Core Engineering Disciplines |
|---|---|---|
| **`frontend_system_architect`** | `modern-web-guidance`, `vercel-composition-patterns` | 8pt spatial grid, CSS box model, container queries, surface elevation hierarchy, React compound components |
| **`domain_lead_tree_layout`** | `web-design-guidelines`, SVG Coordinate Geometry Math | Dynamic viewBox math, 60px canvas margin clearance, node collision prevention, flexible navbar scaling |
| **`domain_lead_problem_trivia`** | `web-design-guidelines`, `a11y-debugging` | Table padding standards, subtle tokenized borders (`--border-subtle`), pill badges (`radius-full`), card elevation |
| **`domain_lead_workspace_primitives`**| `vercel-react-best-practices`, `modern-web-guidance` | 32px visualizer canvas padding floors, text well wrapping (`p-4 md:p-5`), border dividers, 44px control touch targets |
| **`layout_visual_auditor`** | `web-interface-guidelines`, `verification-before-completion` | Automated AST/DOM inspection, token audit rules, zero-clipping invariants, 100% compliance verification |

---

## 4. Detailed Skill Descriptions Injected into Agents

### 1. Modern Web & CSS Layout Guidance (`modern-web-guidance`)
- **Box Model & Spacing:** Strict 8pt spatial scale (`var(--space-1)` through `var(--space-8)`), flex/grid gaps over legacy margins.
- **Container Hierarchy:** Inverted dark mode surface hierarchy (Cards: `#0a0a0c`, Wells: `#050506`, Page: `#17171b`).
- **Responsive Layout:** Dynamic CSS grid columns (`repeat(auto-fit, minmax(...))`), container queries over rigid media queries.

### 2. React Composition Patterns (`vercel-composition-patterns` & `vercel-react-best-practices`)
- **Boolean Prop Elimination:** Refactor boolean modes into explicit variants or children composition.
- **Compound Components:** Shared context providers for complex controls (`ButtonGroup`, `ControlPanel`, `ProblemDescriptionCard`).
- **Clean Component APIs:** Decoupled implementation details from state interfaces.

### 3. Web Interface Guidelines & UX (`web-design-guidelines` & `a11y-debugging`)
- **Touch Target Floor:** Minimum 44px height and touch area for all interactive controls and sliders.
- **Visual Contrast & Badges:** Pill-shaped badges (`radius-full`) with `--border-subtle` and semantic badges (`difficultyBadgeVariant`).
- **Accessibility:** Proper `aria-expanded`, `aria-controls`, `aria-label`, and focus outline rings on interactive buttons/inputs.

### 4. Vector Geometry & Canvas Math
- **SVG ViewBox Laws:** Dynamic viewBox computation (`viewBox = boxViewBox(measuredBox)`), `preserveAspectRatio="xMidYMid meet"`, zero vertical dead space.

---

## 5. Recursive Self-Validation Cycle (The Feedback Loop)

Every Domain Lead executes the following 4-step recursive loop:

```
[Phase 1: Deep Inspection] ──► [Phase 2: System Refactor] ──► [Phase 3: Automated Audit] ──► [Phase 4: Gatekeeping]
    (AST & Box-Model Audit)         (Frontend Token Edits)       (Visual & Token Checks)       (Orchestrator Approval)
```

---

## 6. Feedback Loop Mechanics, Callback Injection, and Exit Conditions

### A. The Callback Point (Where Rejection Triggers)
The callback interceptor sits directly between **Phase 3 (Automated Audit)** and **Phase 2 (System Refactor)**.

When `layout_visual_auditor` evaluates the unstaged component changes, it runs an automated validation matrix against the 4 Visual Invariant Contracts:
1. **Zero Text/SVG Clipping:** `viewBox` clearance >= 60px, canvas floor >= 32px.
2. **Container Padding Integrity:** Cards must have `p-6 md:p-8`, Wells must have `p-4 md:p-5`, Headers must have `py-4 px-6`.
3. **Tokenized Borders & Badges:** Badges must be pill-shaped (`radius-full`), borders must use `--border-subtle` or `--border-default` (zero raw hex or aggressive double borders).
4. **Touch & Spatial Target:** Buttons/Inputs min height `var(--control-h-md)` with `px-4`/`px-5`.

If ANY invariant fails, `layout_visual_auditor` immediately interrupts execution and constructs a **Structured Diagnostic Payload**:

```json
{
  "status": "REJECTED",
  "iteration": 2,
  "failedInvariants": [
    "Invariant 2: Description text in ProblemDescriptionCard.tsx is not wrapped in a <Well>",
    "Invariant 3: SearchTrigger.tsx retains a hardcoded height style property"
  ],
  "targetFiles": [
    "src/components/primitives/ProblemDescriptionCard.tsx",
    "src/components/SearchTrigger.tsx"
  ],
  "prescriptiveGuidance": "Wrap paragraph in <Well className=\"p-4 md:p-5 border border-[var(--border-subtle)] shadow-sm\"> and remove inline style height."
}
```

### B. Iteration & Feedback Execution (Next Iterations Flow)
1. **Payload Callback Delivery:** The `layout_visual_auditor` sends the `Structured Diagnostic Payload` directly back to the `Refactor Subagent`.
2. **Contextual Delta Fix:** The `Refactor Subagent` reads the exact `failedInvariants` and `prescriptiveGuidance`. It executes targeted edits *only* on the failing lines/components.
3. **Re-Audit Trigger:** The updated files are immediately re-submitted to `layout_visual_auditor` for a new audit pass (`iteration++`).

### C. System Exit Conditions (Termination & Graduation)

There are 3 explicit exit pathways from the recursive loop:

1. **Pathway 1: Clean Exit (100% Pass / Success)**
   - `layout_visual_auditor` evaluates the diff and reports `status: "APPROVED"`, `auditScore: 100%`.
   - `bun run check` (typecheck, oxlint, oxfmt, vitest, build) executes and returns exit code 0.
   - The Domain Lead exits the loop and reports `SUCCESS` to the Main Orchestrator.

2. **Pathway 2: Bounded Circuit Breaker (Max Iterations Exceeded)**
   - To prevent infinite loops in ambiguous edge cases, every Domain Lead enforces a `MAX_ITERATION_LIMIT = 4`.
   - If `iteration > 4` and invariants still fail, the Auditor halts the loop and triggers an **Escalation Callback** to the `frontend_system_architect` to re-analyze structural constraints (e.g. conflicting parent flex properties or unit test contract bounds).

3. **Pathway 3: Orchestrator Gatekeeper Final Handshake**
   - Once all 3 Domain Leads (`tree_layout`, `problem_trivia`, `workspace_primitives`) return `status: "APPROVED"`, the Main Orchestrator runs the master quality check and presents the final verified diff to the user.
