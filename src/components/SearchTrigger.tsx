import React from 'react';
import { Search } from 'lucide-react';
import { Kbd } from '../ui';

export interface SearchTriggerProps {
  onOpenDrawer: () => void;
}

/* Looks like an input but is a button — the QuickAccessDrawer owns all searching. */
export const SearchTrigger: React.FC<SearchTriggerProps> = ({ onOpenDrawer }) => {
  return (
    <button
      type="button"
      onClick={onOpenDrawer}
      aria-label="Search algorithms"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        width: '240px',
        // Sits in the navbar toggle row, so it shares the sm control scale (R4.5).
        height: 'var(--control-h-sm)',
        padding: '0 var(--space-1) 0 var(--space-2)',
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'border-color var(--transition-fast), color var(--transition-fast)',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = 'var(--border-strong)';
        event.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = 'var(--border-default)';
        event.currentTarget.style.color = 'var(--text-muted)';
      }}
    >
      <Search
        aria-hidden="true"
        style={{ width: '14px', height: '14px', color: 'currentColor', flexShrink: 0 }}
      />
      <span
        style={{
          flex: 1,
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        Search algorithms…
      </span>
      <Kbd>/</Kbd>
    </button>
  );
};
