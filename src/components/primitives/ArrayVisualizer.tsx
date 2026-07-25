import React from 'react';
import { ArrayElement, ElementState } from '../../types/dsa';

export interface ArrayVisualizerProps {
  elements: ArrayElement[];
  mode?: 'bar' | 'box';
  maxHeight?: number;
  title?: string;
}

const getStateStyles = (state: ElementState) => {
  switch (state) {
    case 'compare':
      return {
        bg: 'var(--state-compare-bg)',
        border: 'var(--state-compare)',
        color: 'var(--state-compare)',
        shadow: '0 0 12px rgba(245, 158, 11, 0.5)',
      };
    case 'swap':
      return {
        bg: 'var(--state-swap-bg)',
        border: 'var(--state-swap)',
        color: 'var(--state-swap)',
        shadow: '0 0 14px rgba(239, 68, 68, 0.6)',
      };
    case 'sorted':
      return {
        bg: 'var(--state-sorted-bg)',
        border: 'var(--state-sorted)',
        color: 'var(--state-sorted)',
        shadow: '0 0 12px rgba(0, 255, 157, 0.5)',
      };
    case 'active':
      return {
        bg: 'var(--state-active-bg)',
        border: 'var(--state-active)',
        color: 'var(--state-active)',
        shadow: '0 0 12px rgba(59, 130, 246, 0.5)',
      };
    case 'pivot':
      return {
        bg: 'var(--state-pivot-bg)',
        border: 'var(--state-pivot)',
        color: 'var(--state-pivot)',
        shadow: '0 0 12px rgba(168, 85, 247, 0.5)',
      };
    case 'visited':
      return {
        bg: 'rgba(6, 182, 212, 0.2)',
        border: '#06b6d4',
        color: '#06b6d4',
        shadow: '0 0 10px rgba(6, 182, 212, 0.4)',
      };
    case 'queued':
      return {
        bg: 'rgba(234, 179, 8, 0.2)',
        border: '#eab308',
        color: '#eab308',
        shadow: '0 0 10px rgba(234, 179, 8, 0.4)',
      };
    case 'in-stack':
      return {
        bg: 'rgba(236, 72, 153, 0.2)',
        border: '#ec4899',
        color: '#ec4899',
        shadow: '0 0 10px rgba(236, 72, 153, 0.4)',
      };
    case 'path':
      return {
        bg: 'rgba(16, 185, 129, 0.25)',
        border: '#10b981',
        color: '#10b981',
        shadow: '0 0 12px rgba(16, 185, 129, 0.5)',
      };
    case 'default':
    default:
      return {
        bg: 'var(--state-default)',
        border: 'var(--border-subtle)',
        color: 'var(--state-default-text)',
        shadow: 'none',
      };
  }
};

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  elements,
  mode = 'bar',
  maxHeight = 240,
  title,
}) => {
  const maxVal = Math.max(...elements.map((el) => el.value), 1);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--accent-mint)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: mode === 'bar' ? 'flex-end' : 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '24px 16px',
          width: '100%',
          minHeight: `${maxHeight + 80}px`,
          overflowX: 'auto',
        }}
      >
        {elements.map((item, index) => {
          const style = getStateStyles(item.state);
          const heightPct = Math.max((item.value / maxVal) * 100, 15);
          const barHeight = Math.round((heightPct * maxHeight) / 100);

          return (
            <div
              key={item.id || `arr-node-${index}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Pointer labels above */}
              {item.pointers && item.pointers.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    position: 'absolute',
                    top: mode === 'bar' ? '-32px' : '-28px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  {item.pointers.map((ptr, pIdx) => (
                    <span
                      key={`${ptr}-${pIdx}`}
                      style={{
                        background: 'rgba(0, 255, 157, 0.2)',
                        border: '1px solid var(--accent-emerald)',
                        color: 'var(--accent-emerald)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        boxShadow: 'var(--shadow-glow)',
                      }}
                    >
                      {ptr}
                    </span>
                  ))}
                </div>
              )}

              {/* Element visual body */}
              {mode === 'bar' ? (
                <div
                  style={{
                    width: Math.min(Math.max(600 / Math.max(elements.length, 1), 24), 54),
                    height: `${barHeight}px`,
                    backgroundColor: style.bg,
                    border: `2px solid ${style.border}`,
                    borderRadius: '6px 6px 4px 4px',
                    boxShadow: style.shadow,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    paddingBottom: '6px',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span
                    style={{
                      color: style.color,
                      fontFamily: 'var(--font-code)',
                      fontWeight: 700,
                      fontSize: elements.length > 20 ? '0.7rem' : '0.85rem',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: style.bg,
                    border: `2px solid ${style.border}`,
                    borderRadius: '8px',
                    boxShadow: style.shadow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span
                    style={{
                      color: style.color,
                      fontFamily: 'var(--font-code)',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              )}

              {/* Index label below */}
              <span
                style={{
                  marginTop: '6px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-code)',
                  color: 'var(--text-muted)',
                }}
              >
                [{index}]
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArrayVisualizer;
