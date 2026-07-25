import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronRight, ListFilter } from 'lucide-react';
import { AlgorithmDefinition, CategoryType } from '../types/dsa';
import { getAllAlgorithms } from '../algorithms/registry';

interface GlobalSearchBarProps {
  onSelectAlgorithm: (algorithmId: string, categoryFolder?: CategoryType) => void;
  onOpenDrawer?: () => void;
}

// Phonetic and common alias normalization dictionary
const ALIAS_MAP: Record<string, string[]> = {
  kruskal: ['crew skull', 'cruz', 'crewskull', 'kruskal', 'mst', 'minimum spanning tree', 'dsu', 'disjoint set'],
  dijkstra: ['die stra', 'diekstra', 'dijkstra', 'shortest path', 'graph shortest'],
  bellman: ['bellman', 'bellman ford', 'ford bellman', 'negative cycles'],
  floyd: ['floyd', 'floyd warshall', 'all pairs shortest'],
  bfs: ['bfs', 'breadth first', 'level order'],
  dfs: ['dfs', 'depth first'],
  sieve: ['sieve', 'sieve of eratosthenes', 'primes', 'prime numbers'],
  gcd: ['gcd', 'euclid', 'euclidean', 'greatest common divisor'],
  kmp: ['kmp', 'knuth morris pratt', 'pattern matching', 'string search'],
  z: ['z algo', 'z algorithm', 'z string'],
  trie: ['trie', 'prefix tree', 'autocomplete'],
  fenwick: ['fenwick', 'binary indexed tree', 'bit tree'],
  segment: ['segment tree', 'range query', 'lazy propagation'],
  queens: ['n queens', 'backtracking queens', 'eight queens'],
  huffman: ['huffman', 'huffman coding', 'compression'],
  nim: ['nim', 'nim game', 'sprague grundy', 'game theory'],
  hull: ['convex hull', 'andrew monotone', 'sweep line', 'geometry'],
  shoelace: ['shoelace', 'polygon area', 'gauss area'],
  lca: ['lca', 'lowest common ancestor', 'tree lca'],
  scc: ['kosaraju', 'scc', 'strongly connected'],
  flow: ['ford fulkerson', 'max flow', 'residual graph', 'edmonds karp'],
};

// Category title helper mapping
const CATEGORY_NAMES: Partial<Record<CategoryType, string>> = {
  arrays_and_hashing: 'Arrays & Hashing',
  two_pointers: 'Two Pointers',
  sliding_window: 'Sliding Window',
  stack_and_queue: 'Stack & Queue',
  binary_search: 'Binary Search',
  linked_list: 'Linked List',
  tree_fundamentals: 'Tree Fundamentals',
  tree_queries_and_diameter: 'Tree Queries & Diameter',
  tries_and_strings: 'Tries & Strings',
  heap_and_priority_queue: 'Heap / Priority Queue',
  backtracking: 'Backtracking',
  graph_traversal: 'Graph Traversal',
  graph_shortest_paths: 'Graph Shortest Paths',
  graph_spanning_trees: 'Graph Spanning Trees',
  graph_directed_and_scc: 'Graph Directed & SCC',
  graph_flows_and_cuts: 'Graph Flows & Cuts',
  dp_1d: '1D Dynamic Programming',
  dp_2d: '2D Dynamic Programming',
  intervals: 'Intervals',
  greedy_algorithms: 'Greedy Algorithms',
  bit_manipulation: 'Bit Manipulation',
  math_and_number_theory: 'Math & Number Theory',
  game_theory: 'Game Theory',
  advanced_range_queries: 'Advanced Range Queries',
  geometry_and_sweep_line: 'Geometry & Sweep Line',
};

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ onSelectAlgorithm, onOpenDrawer }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const algorithms = useMemo(() => getAllAlgorithms(), []);

  // Filter algorithms by search query with alias and fuzzy keyword matching
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return algorithms.filter((alg) => {
      const titleMatch = alg.title.toLowerCase().includes(q);
      const categoryMatch = (CATEGORY_NAMES[alg.category] || alg.category).toLowerCase().includes(q);
      const descMatch = alg.description.toLowerCase().includes(q);
      const idMatch = alg.id.toLowerCase().includes(q);

      // Check alias mapping
      let aliasMatch = false;
      for (const [key, aliases] of Object.entries(ALIAS_MAP)) {
        if (alg.title.toLowerCase().includes(key) || alg.id.toLowerCase().includes(key)) {
          if (aliases.some((alias) => alias.includes(q) || q.includes(alias))) {
            aliasMatch = true;
            break;
          }
        }
      }

      return titleMatch || categoryMatch || descMatch || idMatch || aliasMatch;
    });
  }, [query, algorithms]);

  // Global hotkey listener ('/' or 'Cmd+K' to focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' && document.activeElement !== inputRef.current) ||
        ((e.metaKey || e.ctrlKey) && e.key === 'k')
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation within search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (alg: AlgorithmDefinition) => {
    onSelectAlgorithm(alg.id, alg.category);
    setQuery('');
    setIsOpen(false);
  };

  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'Easy':
        return '#00ff9d';
      case 'Medium':
        return '#ffb703';
      case 'Hard':
        return '#ff0055';
      default:
        return 'var(--text-dim)';
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-darkest)',
          border: isOpen ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.4rem 0.75rem',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 12px rgba(0, 255, 157, 0.15)' : 'none',
        }}
      >
        <Search style={{ width: '16px', height: '16px', color: 'var(--accent-emerald)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search problems... (Press '/' or ⌘K)"
          aria-label="Search problems, topics, and algorithms"
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
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0',
            }}
            title="Clear search"
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        )}
        {onOpenDrawer && (
          <button
            type="button"
            onClick={onOpenDrawer}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-emerald)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '4px',
            }}
            title="Open full problem directory sidebar"
            aria-label="Open full problem directory sidebar"
          >
            <ListFilter style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>

      {/* Instant Autocomplete Search Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div
          role="listbox"
          aria-label="Algorithm Search Results"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            maxHeight: '360px',
            overflowY: 'auto',
            zIndex: 1000,
            padding: '0.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: '0.8rem', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              No matching problems found for "{query}"
            </div>
          ) : (
            results.map((alg, index) => {
              const isSelected = index === selectedIndex;
              const diffColor = getDifficultyColor(alg.difficulty);

              return (
                <div
                  key={alg.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(alg)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(0, 255, 157, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid var(--accent-emerald)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isSelected ? 'var(--accent-emerald)' : 'var(--text-main)',
                        }}
                      >
                        {alg.title}
                      </span>
                      {alg.difficulty && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: `${diffColor}20`,
                            color: diffColor,
                            border: `1px solid ${diffColor}40`,
                          }}
                        >
                          {alg.difficulty}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {CATEGORY_NAMES[alg.category] || alg.category}
                    </span>
                  </div>
                  <ChevronRight
                    style={{
                      width: '16px',
                      height: '16px',
                      color: isSelected ? 'var(--accent-emerald)' : 'var(--text-dim)',
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
