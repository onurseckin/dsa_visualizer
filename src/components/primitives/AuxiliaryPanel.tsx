import React from 'react';
import { X } from 'lucide-react';
import { Card, IconButton } from '../../ui';
import { AuxiliaryState } from '../../types/dsa';

export interface AuxiliaryPanelProps {
  state?: AuxiliaryState;
  auxiliaryState?: AuxiliaryState;
  onClose?: () => void;
}

interface DataRowProps {
  label: string;
  children: React.ReactNode;
}

/* One labeled horizontal row of chips; the chip strip scrolls on overflow. */
const DataRow: React.FC<DataRowProps> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
    <span
      style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        flexShrink: 0,
        minWidth: '64px',
      }}
    >
      {label}
    </span>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        overflowX: 'auto',
        minWidth: 0,
        paddingBottom: '2px',
      }}
    >
      {children}
    </div>
  </div>
);

export const AuxiliaryPanel: React.FC<AuxiliaryPanelProps> = ({ state, auxiliaryState, onClose }) => {
  const currentAuxState = auxiliaryState || state || {};
  const { stack, queue, visited, hashMap, distanceTable, customState } = currentAuxState;

  const stackItems = stack || [];
  const queueItems = queue || [];
  const visitedItems = visited || [];
  const hashMapEntries = Object.entries(hashMap || {});
  const distanceEntries = Object.entries(distanceTable || {});
  const customEntries = Object.entries(customState || {});

  const hasStack = stackItems.length > 0;
  const hasQueue = queueItems.length > 0;
  const hasVisited = visitedItems.length > 0;
  const hasHashMap = hashMapEntries.length > 0;
  const hasDistance = distanceEntries.length > 0;
  const hasCustom = customEntries.length > 0;

  const hasAny = hasStack || hasQueue || hasVisited || hasHashMap || hasDistance || hasCustom;

  const closeAction = onClose ? (
    <IconButton
      icon={<X />}
      variant="ghost"
      size="sm"
      aria-label="Hide auxiliary panel"
      onClick={onClose}
    />
  ) : undefined;

  return (
    <Card title="Working data" actions={closeAction} padding="sm">
      {hasAny ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {hasStack && (
            <DataRow label="Stack">
              {stackItems.map((item, idx) => (
                <span key={`stack-${idx}`} className="ui-chip">
                  {String(item)}
                  {idx === stackItems.length - 1 && (
                    <span style={{ color: 'var(--accent)' }}>top</span>
                  )}
                </span>
              ))}
            </DataRow>
          )}

          {hasQueue && (
            <DataRow label="Queue">
              {queueItems.map((item, idx) => (
                <span key={`queue-${idx}`} className="ui-chip">
                  {idx === 0 && <span style={{ color: 'var(--accent)' }}>front</span>}
                  {String(item)}
                </span>
              ))}
            </DataRow>
          )}

          {hasVisited && (
            <DataRow label={`Visited (${visitedItems.length})`}>
              {visitedItems.map((item, idx) => (
                <span key={`vis-${idx}`} className="ui-chip">
                  {String(item)}
                </span>
              ))}
            </DataRow>
          )}

          {hasHashMap && (
            <DataRow label="Hash map">
              {hashMapEntries.map(([key, val]) => (
                <span key={`hash-${key}`} className="ui-chip">
                  {key}
                  <span style={{ color: 'var(--text-faint)' }}>→</span>
                  <span style={{ color: 'var(--text-primary)' }}>{String(val)}</span>
                </span>
              ))}
            </DataRow>
          )}

          {hasDistance && (
            <DataRow label="Distances">
              {distanceEntries.map(([node, dist]) => (
                <span key={`dist-${node}`} className="ui-chip">
                  {node}
                  <span style={{ color: 'var(--text-faint)' }}>→</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {dist === Infinity ? '∞' : String(dist)}
                  </span>
                </span>
              ))}
            </DataRow>
          )}

          {hasCustom && (
            <DataRow label="State">
              {customEntries.map(([k, val]) => (
                <span key={`cust-${k}`} className="ui-chip">
                  {k}
                  <span style={{ color: 'var(--text-faint)' }}>=</span>
                  <span style={{ color: 'var(--text-primary)' }}>{String(val)}</span>
                </span>
              ))}
            </DataRow>
          )}
        </div>
      ) : (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          No working data at this step.
        </span>
      )}
    </Card>
  );
};

export default AuxiliaryPanel;
