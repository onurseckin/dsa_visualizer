import { ArrayElement, ElementState } from "../../../types/dsa";

export interface ArrayVisualizerProps {
  elements: ArrayElement[];
  mode?: "bar" | "box";
  maxHeight?: number;
  title?: string;
}

export const stateColor = (state: ElementState): string => `var(--state-${state})`;
export const stateBg = (state: ElementState): string => `var(--state-${state}-bg)`;

export const GAP = 8;
export const MAX_GAP_RATIO = 0.25;
export const PAD_X = 6;
export const MIN_BAR_W = 10;
export const MAX_BAR_W = 160;
export const FALLBACK_BAR_W = 60;

export interface BarRun {
  size: number;
  gap: number;
  span: number;
}
