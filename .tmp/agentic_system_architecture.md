# Agentic Graph System Architecture v3 — Visual Headless Capture & Adversarial Pushback Engine

## 1. Executive Summary & Core Paradigm Shift
A code change is **not** a successful completion. In **Architecture v3**, the `layout_visual_auditor_v3` operates as an **Adversarial Visual Inspector**. 

It does not rely on static code analysis alone. Instead, after every post-implementation edit, the Auditor **spins up a headless Chrome browser, renders the live page, captures a visual screenshot artifact, and audits the actual pixel layout**. If visual defects, clipping, or unappealing spatial balance are detected, the Auditor **pushes back** on the Refactor Agent with a detailed visual rejection payload.

---

## 2. Adversarial Pushback Flow Architecture

```
[ Refactor Subagent ]
        │
        │ 1. Applies Unstaged Edits
        ▼
[ Headless Chrome Engine ] ──► Captures Live Page Screenshot (.png)
        │
        ▼
[ layout_visual_auditor_v3 (Adversarial Inspector) ]
        │
        ├───────────────────────────────────────────┐
        │                                           │
  Visual Defects Found?                     Visual Layout Clean?
        │                                           │
        ▼ (YES: PUSHBACK TRIGGER)                   ▼ (YES: GRADUATION)
┌──────────────────────────────────────┐    ┌──────────────────────────────────┐
│   Structured Visual Pushback Payload │    │     100% Visual Pass Signal      │
│ - Screenshot Evidence (.png)         │    │     - Verified pixel layout      │
│ - Bounding Box Defect Coordinates    │    │     - Master Quality Gatekeeper  │
│ - Prescriptive Design Remediation    │    └──────────────────────────────────┘
└──────────────────┬───────────────────┘
                   │
                   │ 2. Inter-Agent Rejection Message
                   ▼
         (Refactor Subagent Retries)
```

---

## 3. The Inter-Agent Pushback Protocol

### A. The Pushback Trigger
The `layout_visual_auditor_v3` MUST evaluate rendered page screenshots against 5 Visual Layout Laws:

1. **Pixel Clipping & Clearance Law:** SVG canvas margins must be >= 60px; graph nodes must never collide with container boundaries.
2. **Visual Dead Space Law:** Canvas and layout containers must balance vertical and horizontal padding without giant empty voids or cramped boundaries.
3. **Card & Well Hierarchy:** Sub-sections (description text, constraints, options) MUST be contained within distinct, elevated `Well` surfaces (`#050506`) with subtle borders (`--border-subtle`).
4. **Interactive Touch & Padding Floor:** Buttons, inputs, and search fields must maintain comfortable internal padding (`px-5 py-2.5`) and min 44px touch targets.
5. **Aesthetic Balance & Badge Shapes:** Category badges must be pill-shaped (`radius-full`) with subtle borders; zero aggressive double borders.

### B. The Adversarial Pushback Payload (Rejection Message)
When any rule fails, the Auditor sends the following rejection payload back to the Refactor Agent:

```json
{
  "status": "REJECTED_VISUAL_AUDIT",
  "round": 2,
  "screenshotArtifact": ".tempmediaStorage/knowledge_tree_round2.png",
  "visualDefects": [
    {
      "element": "KnowledgeGraphLegend",
      "issue": "Legend is placed directly against top container border with only 8px gap",
      "requiredFix": "Increase container top margin to mt-8 mb-8 and add max-w-[1100px] w-full centering"
    },
    {
      "element": "Node 1 SVG Circle",
      "issue": "Top circle label touches upper boundary of viewBox",
      "requiredFix": "Adjust viewBox Y min from 0 to -60 for 60px canvas margin clearance"
    }
  ],
  "actionRequired": "Re-run refactor targeting these exact bounding boxes and reply with updated code."
}
```

---

## 4. Multi-Round Iteration Mechanics & Exit Thresholds

1. **Multi-Round Self-Talk:** The Refactor Agent and Auditor engage in up to **4 rounds of adversarial feedback**.
2. **Screenshot History Tracking:** Each round produces a numbered screenshot artifact (`round1.png`, `round2.png`, `round3.png`) allowing visual progress tracking.
3. **Exit Gate:** The loop exits ONLY when:
   - `layout_visual_auditor_v3` verifies screenshot artifact contains ZERO visual defects.
   - `bun run check` (typecheck, oxfmt, oxlint, 1342 unit tests, build) returns code 0.

---

## 5. Summary of System Improvements
- **No Automatic Approvals:** Edits are never approved simply because code changed.
- **Empirical Visual Proof:** Headless Chrome screenshots provide objective ground truth.
- **Adversarial Agent Pushback:** Auditors actively reject suboptimal layouts and demand targeted re-iterations.
