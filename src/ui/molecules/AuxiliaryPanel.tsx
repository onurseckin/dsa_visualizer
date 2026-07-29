import React from "react";
import type { AuxiliaryState, DisplayValue } from "../../types/dsa";

export interface AuxiliaryPanelProps {
  state?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export function hasAuxiliaryContent(
  _state?: AuxiliaryState,
  _variables?: Record<string, DisplayValue>,
): boolean {
  return false;
}

export function formatDisplayValue(value: DisplayValue): string {
  if (Array.isArray(value)) {
    return `[${value.map(formatDisplayValue).join(", ")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .map(([key, nested]) => `${JSON.stringify(key)}: ${formatDisplayValue(nested)}`)
      .join(", ")}}`;
  }
  return String(value);
}

export const AuxiliaryPanel: React.FC<AuxiliaryPanelProps> = () => {
  return null;
};

export default AuxiliaryPanel;
