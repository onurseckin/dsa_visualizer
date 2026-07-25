import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, ChevronRight, Folder, Sparkles, Check } from 'lucide-react';
import { CategoryType } from '../types/dsa';
import { getAllAlgorithms } from '../algorithms/registry';

export const ALL_CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'arrays_and_hashing', label: '1. Arrays & Hashing' },
  { id: 'two_pointers', label: '2. Two Pointers' },
  { id: 'stack_and_queue', label: '3. Stack & Queue' },
  { id: 'binary_search', label: '4. Binary Search' },
  { id: 'sliding_window', label: '5. Sliding Window' },
  { id: 'linked_list', label: '6. Linked List' },
  { id: 'tree_fundamentals', label: '7. Tree Fundamentals' },
  { id: 'tree_queries_and_diameter', label: '8. Tree Queries & Diameter' },
  { id: 'tries_and_strings', label: '9. Tries & Strings' },
  { id: 'heap_and_priority_queue', label: '10. Heap / Priority Queue' },
  { id: 'backtracking', label: '11. Backtracking' },
  { id: 'graph_traversal', label: '12. Graph Traversal' },
  { id: 'graph_shortest_paths', label: '13. Graph Shortest Paths' },
  { id: 'graph_spanning_trees', label: '14. Graph Spanning Trees' },
  { id: 'graph_directed_and_scc', label: '15. Graph Directed & SCC' },
  { id: 'graph_flows_and_cuts', label: '16. Graph Flows & Cuts' },
  { id: 'dp_1d', label: '17. 1-D Dynamic Programming' },
  { id: 'dp_2d', label: '18. 2-D Dynamic Programming' },
  { id: 'intervals', label: '19. Intervals' },
  { id: 'greedy_algorithms', label: '20. Greedy Algorithms' },
  { id: 'bit_manipulation', label: '21. Bit Manipulation' },
  { id: 'math_and_number_theory', label: '22. Math & Number Theory' },
  { id: 'game_theory', label: '23. Game Theory' },
  { id: 'advanced_range_queries', label: '24. Advanced Range Queries' },
  { id: 'geometry_and_sweep_line', label: '25. Geometry & Sweep Line' },
];

export interface QuickAccessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlgorithm: (algorithmId: string, categoryFolder?: CategoryType) => void;
  activeAlgorithmId?: string;
  categories?: { id: CategoryType; label: string }[];
}

export const QuickAccessDrawer: React.FC<QuickAccessDrawerProps> = ({
  isOpen,
  onClose,
  onSelectAlgorithm,
  activeAlgorithmId,
  categories = ALL_CATEGORIES,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input and handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allAlgorithms = useMemo(() => getAllAlgorithms(), []);

  // Filter categories and algorithms based on live search
  const categoryGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return categories
      .map((cat) => {
        const catAlgs = allAlgorithms.filter((alg) => alg.category === cat.id);
        const filteredAlgs = catAlgs.filter((alg) => {
          if (!q) return true;
          const titleMatch = alg.title.toLowerCase().includes(q);
          const descMatch = alg.description.toLowerCase().includes(q);
          const catMatch = cat.label.toLowerCase().includes(q);
          const diffMatch = alg.difficulty?.toLowerCase().includes(q);
          return titleMatch || descMatch || catMatch || diffMatch;
        });

        return {
          category: cat,
          algorithms: filteredAlgs,
          totalCount: catAlgs.length,
        };
      })
      .filter((group) => {
        if (!q) return true;
        return group.algorithms.length > 0 || group.category.label.toLowerCase().includes(q);
      });
  }, [searchQuery, categories, allAlgorithms]);

  const totalAlgorithmCount = useMemo(() => {
    return allAlgorithms.length;
  }, [allAlgorithms]);

  if (!isOpen) return null;

  const getDifficultyStyle = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy':
        return {
          color: '#00ff9d',
          bg: 'rgba(0, 255, 157, 0.12)',
          border: 'rgba(0, 255, 157, 0.3)',
        };
      case 'Medium':
        return {
          color: '#ffb703',
          bg: 'rgba(255, 183, 3, 0.12)',
          border: 'rgba(255, 183, 3, 0.3)',
        };
      case 'Hard':
        return {
          color: '#ff0055',
          bg: 'rgba(255, 0, 85, 0.12)',
          border: 'rgba(255, 0, 85, 0.3)',
        };
      default:
        return {
          color: 'var(--text-dim)',
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
        };
    }
  };

  return (
    <>
      {/* Dimmed Glass Backdrop */}
      <div
        data-testid="drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 13, 10, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Sliding Glass Side Drawer */}
      <aside
        role="dialog"
        aria-label="Quick Access Problems Drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          maxWidth: '90vw',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid var(--border-glow)',
          boxShadow: 'var(--shadow-card), -8px 0 32px rgba(0, 0, 0, 0.5)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-ui)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.25rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            background: 'var(--bg-darkest)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles style={{ width: '20px', height: '20px', color: 'var(--accent-emerald)' }} />
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  letterSpacing: '-0.01em',
                }}
              >
                Quick Problems
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              title="Close drawer"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Browse <strong style={{ color: 'var(--accent-emerald)' }}>{totalAlgorithmCount}</strong> algorithms across{' '}
            <strong style={{ color: 'var(--accent-emerald)' }}>{categories.length}</strong> categories.
          </div>

          {/* Live Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 0.75rem',
            }}
          >
            <Search style={{ width: '16px', height: '16px', color: 'var(--accent-emerald)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems or categories..."
              aria-label="Search problems in drawer"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                width: '100%',
                fontFamily: 'var(--font-ui)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Categories & Problems List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {categoryGroups.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: 'var(--text-dim)',
                fontSize: '0.9rem',
              }}
            >
              No algorithms match "<strong style={{ color: 'var(--text-main)' }}>{searchQuery}</strong>"
            </div>
          ) : (
            categoryGroups.map((group) => {
              return (
                <div key={group.category.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Category Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 255, 157, 0.05)',
                      border: '1px solid var(--border-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Folder style={{ width: '15px', height: '15px', color: 'var(--accent-emerald)' }} />
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          fontFamily: 'var(--font-code)',
                        }}
                      >
                        {group.category.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--text-dim)',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: 'var(--bg-surface)',
                      }}
                    >
                      {group.algorithms.length}
                    </span>
                  </div>

                  {/* Algorithm Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.5rem' }}>
                    {group.algorithms.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '0.25rem 0.5rem' }}>
                        No algorithms in this category match search.
                      </div>
                    ) : (
                      group.algorithms.map((alg) => {
                        const isActive = alg.id === activeAlgorithmId;
                        const diffStyle = getDifficultyStyle(alg.difficulty);

                        return (
                          <div
                            key={alg.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              onSelectAlgorithm(alg.id, alg.category);
                              onClose();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onSelectAlgorithm(alg.id, alg.category);
                                onClose();
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              background: isActive ? 'rgba(0, 255, 157, 0.15)' : 'var(--bg-surface)',
                              border: isActive
                                ? '1px solid var(--accent-emerald)'
                                : '1px solid var(--border-subtle)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {isActive ? (
                                <Check style={{ width: '14px', height: '14px', color: 'var(--accent-emerald)' }} />
                              ) : (
                                <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--text-dim)' }} />
                              )}
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: isActive ? 700 : 500,
                                  color: isActive ? 'var(--accent-emerald)' : 'var(--text-main)',
                                }}
                              >
                                {alg.title}
                              </span>
                            </div>

                            {alg.difficulty && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  background: diffStyle.bg,
                                  color: diffStyle.color,
                                  border: `1px solid ${diffStyle.border}`,
                                  flexShrink: 0,
                                }}
                              >
                                {alg.difficulty}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

export default QuickAccessDrawer;
