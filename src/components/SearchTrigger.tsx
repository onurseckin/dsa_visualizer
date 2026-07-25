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
        height: 'var(--control-h-md)',
        padding: '0 var(--space-2) 0 var(--space-3)',
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-faint)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'border-color var(--transition-fast), background var(--transition-fast)',
      }}
    >
      <Search
        aria-hidden="true"
        style={{ width: '14px', height: '14px', color: 'var(--text-muted)', flexShrink: 0 }}
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
