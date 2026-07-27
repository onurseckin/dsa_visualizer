import React from "react";
import { X } from "lucide-react";
import { Chip, IconButton, Card } from "../../ui";
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
          label={idx === 0 ? <span className="text-[var(--accent)]">front</span> : undefined}
          value={String(item)}
        />
      )),
    });
  }

  if (visitedItems.length > 0) {
    groups.push({
      key: "visited",
      label: `Visited (${visitedItems.length})`,
      chips: visitedItems.map((item, idx) => (
        <Chip key={`vis-${idx}`} size="md" value={String(item)} />
      )),
    });
  }

  if (hashMapEntries.length > 0) {
    groups.push({
      key: "hash",
      label: "Hash map",
      chips: hashMapEntries.map(([key, val]) => (
        <Chip key={`hash-${key}`} size="md" label={key} value={String(val)} />
      )),
    });
  }

  if (distanceEntries.length > 0) {
    groups.push({
      key: "distance",
      label: "Distances",
      chips: distanceEntries.map(([node, dist]) => (
        <Chip
          key={`dist-${node}`}
          size="md"
          label={node}
          value={dist === Infinity ? "∞" : String(dist)}
        />
      )),
    });
  }

  if (customEntries.length > 0) {
    groups.push({
      key: "custom",
      label: "State",
      chips: customEntries.map(([k, val]) => (
        <Chip key={`cust-${k}`} size="md" label={k} value={String(val)} />
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
    <Card data-testid="auxiliary-panel" className="min-w-0 border-[#1e1e24] bg-[#0a0a0c]">
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
        className="px-4 py-3 border-b border-[#1e1e24]"
      />
      <Card.Body className="flex flex-col gap-4 px-2 py-4">
        {groups.map((group) => (
          <div
            key={group.key}
            className="grid grid-cols-[minmax(6rem,max-content)_1fr] items-center gap-x-4 gap-y-2 min-w-0 px-4 py-2"
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
