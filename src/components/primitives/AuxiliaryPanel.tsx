import React from 'react';
import { AuxiliaryState } from '../../types/dsa';

export interface AuxiliaryPanelProps {
  state?: AuxiliaryState;
  auxiliaryState?: AuxiliaryState;
  onClose?: () => void;
}

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

  if (!hasStack && !hasQueue && !hasVisited && !hasHashMap && !hasDistance && !hasCustom) {
    return (
      <div className="glass-card" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>No active auxiliary data structures at this step.</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Hide auxiliary panel"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0.1rem 0.3rem',
            }}
            title="Hide auxiliary panel"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.4rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-mint)' }}>
          Auxiliary Helper Data Structures
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Hide auxiliary panel"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
            }}
            title="Hide auxiliary panel"
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Call Stack Panel */}
        {hasStack && (
          <div style={{ background: 'var(--bg-darkest)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              Call Stack (LIFO)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '0.3rem' }}>
              {stackItems.map((item, idx) => (
                <div
                  key={`stack-${idx}`}
                  style={{
                    background: idx === stackItems.length - 1 ? 'rgba(0, 255, 157, 0.2)' : 'var(--bg-surface)',
                    border: idx === stackItems.length - 1 ? '1px solid var(--accent-emerald)' : '1px solid var(--border-muted)',
                    borderRadius: '4px',
                    padding: '0.3rem 0.6rem',
                    fontFamily: 'var(--font-code)',
                    fontSize: '0.8rem',
                    color: idx === stackItems.length - 1 ? 'var(--accent-emerald)' : 'var(--text-main)',
                  }}
                >
                  [{idx}] {String(item)} {idx === stackItems.length - 1 ? '← TOP' : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queue Panel */}
        {hasQueue && (
          <div style={{ background: 'var(--bg-darkest)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-mint)', marginBottom: '0.5rem' }}>
              Queue (FIFO)
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {queueItems.map((item, idx) => (
                <div
                  key={`queue-${idx}`}
                  style={{
                    background: idx === 0 ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-surface)',
                    border: idx === 0 ? '1px solid var(--state-active)' : '1px solid var(--border-muted)',
                    borderRadius: '4px',
                    padding: '0.3rem 0.6rem',
                    fontFamily: 'var(--font-code)',
                    fontSize: '0.8rem',
                    color: idx === 0 ? 'var(--state-active)' : 'var(--text-main)',
                  }}
                >
                  {idx === 0 ? 'FRONT: ' : ''}{String(item)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visited Set Panel */}
        {hasVisited && (
          <div style={{ background: 'var(--bg-darkest)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
              Visited Nodes Set ({visitedItems.length})
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {visitedItems.map((item, idx) => (
                <span
                  key={`vis-${idx}`}
                  style={{
                    background: 'rgba(0, 255, 157, 0.15)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '9999px',
                    padding: '0.2rem 0.6rem',
                    fontFamily: 'var(--font-code)',
                    fontSize: '0.75rem',
                    color: 'var(--accent-emerald)',
                  }}
                >
                  {String(item)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hash Map Panel */}
        {hasHashMap && (
          <div style={{ background: 'var(--bg-darkest)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--state-pivot)', marginBottom: '0.5rem' }}>
              Hash Map State (Key → Value)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {hashMapEntries.map(([key, val]) => (
                <div
                  key={`hash-${key}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-code)',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{key}</span>
                  <span style={{ color: 'var(--accent-emerald)' }}>→ {String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distance Table */}
        {hasDistance && (
          <div style={{ background: 'var(--bg-darkest)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--state-compare)', marginBottom: '0.5rem' }}>
              Distance Table
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {distanceEntries.map(([node, dist]) => (
                <div
                  key={`dist-${node}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-code)',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Node {node}</span>
                  <span style={{ color: 'var(--state-compare)', fontWeight: 600 }}>{dist === Infinity ? '∞' : dist}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom State */}
        {hasCustom && (
          <div style={{ background: 'var(--bg-darkest)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-mint)', marginBottom: '0.5rem' }}>
              Custom State
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {customEntries.map(([k, val]) => (
                <div
                  key={`cust-${k}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-code)',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: 'var(--accent-emerald)' }}>{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuxiliaryPanel;
