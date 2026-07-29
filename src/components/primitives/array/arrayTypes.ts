import {
  ArrayElement,
  ElementState,
  elementStateToken,
  AuxiliaryState,
  DisplayValue,
} from "../../../types/dsa";

export interface ArrayVisualizerProps {
  elements: ArrayElement[];
  mode?: "bar" | "box";
  maxHeight?: number;
  name?: string;
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const stateColor = (state: ElementState): string =>
  `var(--state-${elementStateToken(state)})`;
export const stateBg = (state: ElementState): string =>
  `var(--state-${elementStateToken(state)}-bg)`;

export const GAP = 12;
export const MAX_GAP_RATIO = 0.25;
export const PAD_X = 40;
export const MIN_BAR_W = 14;
export const MAX_BAR_W = 64;
export const FALLBACK_BAR_W = 48;

export interface BarRun {
  size: number;
  gap: number;
  span: number;
}
