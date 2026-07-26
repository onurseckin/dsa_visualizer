import React from 'react';
import { X } from 'lucide-react';
import { Card, IconButton } from '../../ui';
import { AuxiliaryState } from '../../types/dsa';

export interface AuxiliaryPanelProps {
  state?: AuxiliaryState;
  variables?: Record<string, string | number | boolean>;
  onClose?: () => void;
}

/* This lives inside the visualizer panel now (DESIGN.md R6.4), so it is a flush
   band rather than a card: the panel strip that wraps it owns the band fill and
   the single divider facing the canvas, so drawing a border, radius, shadow or
   background here would double the edge and hide that fill. No height of its own. */
const STRIP: React.CSSProperties = {
  background: 'transparent',
  // Zeroing the width (rather than the colour) drops ui.css's card edge without
  // leaving a 1px transparent ring that would shift the band's height.
  borderWidth: 0,
  borderRadius: 0,
  boxShadow: 'none',
};

/* ui.css sizes chips for dense variable lists: --text-xs on --bg-elevated behind a
   --border-subtle edge. Inside this band all three fail — the strip's chrome fill
   is within a percent of --bg-elevated so the chip body dissolves into it, the
   subtle edge vanishes on the near-black palette (R6.2), and a value the learner
   has to read at a glance cannot be 0.72rem. Wells + a real edge + --text-sm. */
const CHIP: React.CSSProperties = {
  background: 'var(--bg-inset)',
  borderColor: 'var(--border-default)',
  fontSize: 'var(--text-sm)',
};

const GROUP_LABEL: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
};

interface DataGroup {
  key: string;
  label: string;
  chips: React.ReactNode;
}

/* Single source of truth for "is there anything to show". The panel returns null
   when empty, so a parent that wraps it in a bordered strip must ask this first
   or it renders an empty band with a divider (DESIGN.md R5.2 forbids dead space). */
export const hasAuxiliaryContent = (
  state?: AuxiliaryState,
  variables?: Record<string, string | number | boolean>
): boolean => {
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
};

export const AuxiliaryPanel: React.FC<AuxiliaryPanelProps> = ({ state, variables, onClose }) => {
  const { stack, queue, visited, hashMap, distanceTable, customState } = state || {};

  const stackItems = stack || [];
  const queueItems = queue || [];
  const visitedItems = visited || [];
  const hashMapEntries = Object.entries(hashMap || {});
  const distanceEntries = Object.entries(distanceTable || {});
  const customEntries = Object.entries(customState || {});
  const varEntries = Object.entries(variables || {});

  /* Built as a list so an empty group contributes nothing at all — no label, no
     row, no height. */
  const groups: DataGroup[] = [];

  if (stackItems.length > 0) {
    groups.push({
      key: 'stack',
      label: 'Stack',
      chips: stackItems.map((item, idx) => (
        <span key={`stack-${idx}`} className="ui-chip" style={CHIP}>
          {String(item)}
          {idx === stackItems.length - 1 && <span style={{ color: 'var(--accent)' }}>top</span>}
        </span>
      )),
    });
  }

  if (queueItems.length > 0) {
    groups.push({
      key: 'queue',
      label: 'Queue',
      chips: queueItems.map((item, idx) => (
        <span key={`queue-${idx}`} className="ui-chip" style={CHIP}>
          {idx === 0 && <span style={{ color: 'var(--accent)' }}>front</span>}
          {String(item)}
        </span>
      )),
    });
  }

  if (visitedItems.length > 0) {
    groups.push({
      key: 'visited',
      label: `Visited (${visitedItems.length})`,
      chips: visitedItems.map((item, idx) => (
        <span key={`vis-${idx}`} className="ui-chip" style={CHIP}>
          {String(item)}
        </span>
      )),
    });
  }

  if (hashMapEntries.length > 0) {
    groups.push({
      key: 'hash',
      label: 'Hash map',
      chips: hashMapEntries.map(([key, val]) => (
        <span key={`hash-${key}`} className="ui-chip" style={CHIP}>
          {key}
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ color: 'var(--text-primary)' }}>{String(val)}</span>
        </span>
      )),
    });
  }

  if (distanceEntries.length > 0) {
    groups.push({
      key: 'distance',
      label: 'Distances',
      chips: distanceEntries.map(([node, dist]) => (
        <span key={`dist-${node}`} className="ui-chip" style={CHIP}>
          {node}
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {dist === Infinity ? '∞' : String(dist)}
          </span>
        </span>
      )),
    });
  }

  if (customEntries.length > 0) {
    groups.push({
      key: 'custom',
      label: 'State',
      chips: customEntries.map(([k, val]) => (
        <span key={`cust-${k}`} className="ui-chip" style={CHIP}>
          {k}
          <span style={{ color: 'var(--text-muted)' }}>=</span>
          <span style={{ color: 'var(--text-primary)' }}>{String(val)}</span>
        </span>
      )),
    });
  }

  if (varEntries.length > 0) {
    groups.push({
      key: 'variables',
      label: 'Variables',
      chips: varEntries.map(([k, val]) => (
        <span key={`var-${k}`} className="ui-chip" style={CHIP}>
          {k}
          <span style={{ color: 'var(--text-muted)' }}>=</span>
          <span style={{ color: 'var(--text-primary)' }}>{String(val)}</span>
        </span>
      )),
    });
  }

  // A step with nothing in flight renders no strip rather than a labelled blank.
  if (groups.length === 0) return null;

  return (
    <Card padding="none" style={STRIP}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            Working Data & Variables
          </span>
          <div style={{ flex: 1, minWidth: 0 }} />
          {onClose && (
            /* Bordered rather than ghost: a transparent-edged button is invisible on
               the near-black surface (DESIGN.md R6.2). */
            <IconButton icon={<X />} size="sm" aria-label="Hide auxiliary panel" onClick={onClose} />
          )}
        </div>

        {/* One labelled row per structure, and each row WRAPS (DESIGN.md R7.3).
            Horizontal scrolling hid values off-screen and made the learner drag a
            track mid-step; wrapping keeps every value readable at once. The label
            sits in a fixed column so the rows align into a readable table. */}
        {groups.map((group) => (
          <div
            key={group.key}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(5.5rem, max-content) 1fr',
              alignItems: 'baseline',
              gap: 'var(--space-1) var(--space-2)',
              minWidth: 0,
            }}
          >
            <span style={GROUP_LABEL}>{group.label}</span>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 'var(--space-1)',
                minWidth: 0,
              }}
            >
              {group.chips}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AuxiliaryPanel;
