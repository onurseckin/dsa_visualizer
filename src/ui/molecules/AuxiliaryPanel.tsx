import React from "react";
import { X } from "lucide-react";
import { Card, Chip, IconButton } from "../index";
import { AuxiliaryState } from "../../types/dsa";

export interface AuxiliaryPanelProps {
  state?: AuxiliaryState;
  variables?: Record<string, string | number | boolean>;
  onClose?: () => void;
}

interface DataGroup {
  key: string;
  label: string;
  chips: React.ReactNode;
}

export function hasAuxiliaryContent(
  state?: AuxiliaryState,
  variables?: Record<string, string | number | boolean>,
): boolean {
  const hasVars = variables !== undefined && Object.keys(variables).length > 0;
  if (hasVars) return true;
  if (!state) return false;
  const { stack, queue, visited, hashMap, distanceTable, customState } = state;
  return (
    (stack?.length ?? 0) > 0 ||
    (queue?.length ?? 0) > 0 ||
    (visited?.length ?? 0) > 0 ||
    Object.keys(hashMap ?? {}).length > 0 ||
    Object.keys(distanceTable ?? {}).length > 0 ||
    Object.keys(customState ?? {}).length > 0
  );
}

export const AuxiliaryPanel: React.FC<AuxiliaryPanelProps> = ({ state, variables, onClose }) => {
  const { stack, queue, visited, hashMap, distanceTable, customState } = state || {};

  const stackItems = stack || [];
  const queueItems = queue || [];
  const visitedItems = visited || [];
  const hashMapEntries = Object.entries(hashMap || {});
  const distanceEntries = Object.entries(distanceTable || {});
  const customEntries = Object.entries(customState || {});
  const varEntries = Object.entries(variables || {});

  const groups: DataGroup[] = [];

  if (stackItems.length > 0) {
    groups.push({
      key: "stack",
      label: "Stack",
      chips: stackItems.map((item, idx) => (
        <Chip
          key={`stack-${idx}`}
          size="md"
          label={String(item)}
          value={
            idx === stackItems.length - 1 ? (
              <span className="text-[var(--accent)]">top</span>
            ) : undefined
          }
        />
      )),
    });
  }

  if (queueItems.length > 0) {
    groups.push({
      key: "queue",
      label: "Queue",
      chips: queueItems.map((item, idx) => (
        <Chip
          key={`queue-${idx}`}
          size="md"
          label={String(item)}
          value={
            idx === 0 ? (
              <span className="text-[var(--accent)]">front</span>
            ) : idx === queueItems.length - 1 ? (
              <span className="text-[var(--accent)]">back</span>
            ) : undefined
          }
        />
      )),
    });
  }

  if (visitedItems.length > 0) {
    groups.push({
      key: "visited",
      label: `Visited (${visitedItems.length})`,
      chips: visitedItems.map((item, idx) => (
        <Chip key={`visited-${idx}`} size="md" value={String(item)} />
      )),
    });
  }

  if (hashMapEntries.length > 0) {
    groups.push({
      key: "hashmap",
      label: "Hash map",
      chips: hashMapEntries.map(([k, v]) => (
        <Chip key={`hash-${k}`} size="md" label={k} value={String(v)} />
      )),
    });
  }

  if (distanceEntries.length > 0) {
    groups.push({
      key: "distance",
      label: "Distances",
      chips: distanceEntries.map(([k, d]) => (
        <Chip key={`dist-${k}`} size="md" label={k} value={d === Infinity ? "∞" : String(d)} />
      )),
    });
  }

  if (customEntries.length > 0) {
    groups.push({
      key: "custom",
      label: "State",
      chips: customEntries.map(([k, v]) => (
        <Chip key={`custom-${k}`} size="md" label={k} value={String(v)} />
      )),
    });
  }

  if (varEntries.length > 0) {
    groups.push({
      key: "variables",
      label: "Variables",
      chips: varEntries.map(([k, val]) => (
        <Chip key={`var-${k}`} size="md" label={k} value={String(val)} />
      )),
    });
  }

  if (groups.length === 0) return null;

  return (
    <Card
      data-testid="auxiliary-panel"
      className="min-w-0 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-xl overflow-hidden"
    >
      <Card.Header
        title="Working Data & Variables"
        actions={
          onClose ? (
            <IconButton
              icon={<X />}
              size="sm"
              aria-label="Hide auxiliary panel"
              title="Hide auxiliary panel"
              onClick={onClose}
            />
          ) : undefined
        }
        className="px-4 py-3 border-b border-[var(--border-default)]"
      />
      <Card.Body className="flex flex-col gap-4 p-4 md:p-5">
        {groups.map((group) => (
          <div
            key={group.key}
            className="grid grid-cols-[minmax(6rem,max-content)_1fr] items-center gap-x-4 gap-y-2 min-w-0 py-1"
          >
            <span className="text-sm text-[var(--text-muted)] whitespace-nowrap font-medium">
              {group.label}
            </span>
            <div className="flex flex-wrap items-center gap-2 min-w-0">{group.chips}</div>
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};

export default AuxiliaryPanel;
