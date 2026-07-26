import type { CSSProperties } from "react";

export const TILE_MIME = "text/plain";

export type SlotState = "empty" | "filled" | "correct" | "incorrect";

export interface SlotSkin {
  border: string;
  borderStyle: "solid" | "dashed";
  background: string;
  color: string;
}

export const SLOT_SKIN: Record<SlotState, SlotSkin> = {
  empty: {
    border: "var(--border-strong)",
    borderStyle: "dashed",
    background: "var(--bg-inset)",
    color: "var(--text-faint)",
  },
  filled: {
    border: "var(--border-default)",
    borderStyle: "solid",
    background: "var(--bg-inset)",
    color: "var(--text-primary)",
  },
  correct: {
    border: "var(--success)",
    borderStyle: "solid",
    background: "var(--success-soft)",
    color: "var(--text-primary)",
  },
  incorrect: {
    border: "var(--danger)",
    borderStyle: "solid",
    background: "var(--danger-soft)",
    color: "var(--text-primary)",
  },
};

export const GUTTER: CSSProperties = {
  display: "inline-block",
  width: "2.5em",
  flexShrink: 0,
  textAlign: "right",
  marginRight: "var(--space-2)",
  color: "var(--text-muted)",
  userSelect: "none",
};

export const INDENT: CSSProperties = {
  flexShrink: 0,
  fontFamily: "var(--font-code)",
  fontSize: "var(--text-sm)",
  whiteSpace: "pre",
  color: "var(--text-faint)",
};

export const MONO_INPUT: CSSProperties = { "--font-ui": "var(--font-code)" } as CSSProperties;

export const CODE_GROUP: CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  alignItems: "center",
  gap: "var(--space-1)",
  flex: "1 1 auto",
  minWidth: 0,
};

export const ICON_GROUP: CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  alignItems: "center",
  gap: "var(--space-1)",
  flexShrink: 0,
};

export const SHORTCUT_PAIR: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "2px",
};
