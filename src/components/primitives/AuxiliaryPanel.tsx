import React from 'react';
import { X } from 'lucide-react';
import { Card, IconButton } from '../../ui';
import { AuxiliaryState } from '../../types/dsa';

export interface AuxiliaryPanelProps {
  state?: AuxiliaryState;
  onClose?: () => void;
}

/* This lives inside the visualizer panel now (DESIGN.md R5.2), so it is a flush
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

/* ui.css chips ship with --border-subtle, which vanishes on the near-black
   palette; every chip in this panel is promoted to --border-default. */
const CHIP_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const GROUP_LABEL: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 'var(--text-xs)',
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
export const hasAuxiliaryContent = (state?: AuxiliaryState): boolean => {
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

export const AuxiliaryPanel: React.FC<AuxiliaryPanelProps> = ({ state, onClose }) => {
  const { stack, queue, visited, hashMap, distanceTable, customState } = state || {};

  const stackItems = stack || [];
  const queueItems = queue || [];
  const visitedItems = visited || [];
  const hashMapEntries = Object.entries(hashMap || {});
  const distanceEntries = Object.entries(distanceTable || {});
  const customEntries = Object.entries(customState || {});

  /* Built as a list so an empty group contributes nothing at all — no label, no
     row, no height. */
  const groups: DataGroup[] = [];

  if (stackItems.length > 0) {
    groups.push({
      key: 'stack',
      label: 'Stack',
      chips: stackItems.map((item, idx) => (
        <span key={`stack-${idx}`} className="ui-chip" style={CHIP_BORDER}>
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
        <span key={`queue-${idx}`} className="ui-chip" style={CHIP_BORDER}>
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
        <span key={`vis-${idx}`} className="ui-chip" style={CHIP_BORDER}>
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
        <span key={`hash-${key}`} className="ui-chip" style={CHIP_BORDER}>
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
        <span key={`dist-${node}`} className="ui-chip" style={CHIP_BORDER}>
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
        <span key={`cust-${k}`} className="ui-chip" style={CHIP_BORDER}>
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
      {/* One row for every group: the chip track scrolls sideways on overflow
          instead of wrapping into a block that would push the canvas down. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-1) var(--space-2)',
          minWidth: 0,
        }}
      >
        <span
          style={{
            flexShrink: 0,
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          Working data
        </span>

        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            gap: 'var(--space-3)',
            minWidth: 0,
            overflowX: 'auto',
          }}
        >
          {groups.map((group) => (
            <div
              key={group.key}
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 'var(--space-1)',
              }}
            >
              <span style={GROUP_LABEL}>{group.label}</span>
              {group.chips}
            </div>
          ))}
        </div>

        {onClose && (
          /* Bordered rather than ghost: a transparent-edged button is invisible on
             the near-black surface (DESIGN.md R5.1). */
          <IconButton icon={<X />} size="sm" aria-label="Hide auxiliary panel" onClick={onClose} />
        )}
      </div>
    </Card>
  );
};

export default AuxiliaryPanel;
