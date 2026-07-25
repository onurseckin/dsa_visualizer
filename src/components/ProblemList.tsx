import React, { useState, useMemo } from 'react';
import { Search, Play, Filter, Sparkles, Code2, ArrowUpDown } from 'lucide-react';
import { CategoryType } from '../types/dsa';
import { getAllAlgorithms } from '../algorithms/registry';

interface ProblemListProps {
  onSelectAlgorithm: (algorithmId: string, categoryFolder?: CategoryType) => void;
}

const CATEGORY_LABELS: Partial<Record<CategoryType, string>> = {
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

export const ProblemList: React.FC<ProblemListProps> = ({ onSelectAlgorithm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'category'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const algorithms = useMemo(() => getAllAlgorithms(), []);

  // Compute stat counts
  const stats = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    algorithms.forEach((a) => {
      if (a.difficulty === 'Easy') easy++;
      else if (a.difficulty === 'Medium') medium++;
      else if (a.difficulty === 'Hard') hard++;
    });
    return { total: algorithms.length, easy, medium, hard };
  }, [algorithms]);

  // Filtered & sorted algorithm list
  const filteredAlgorithms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = algorithms.filter((alg) => {
      const titleMatch = alg.title.toLowerCase().includes(q);
      const catLabel = (CATEGORY_LABELS[alg.category] || alg.category).toLowerCase();
      const catMatch = catLabel.includes(q);
      const descMatch = alg.description.toLowerCase().includes(q);

      const diffMatch = selectedDifficulty === 'All' || alg.difficulty === selectedDifficulty;
      const categoryFilterMatch = selectedCategory === 'All' || alg.category === selectedCategory;

      return (titleMatch || catMatch || descMatch) && diffMatch && categoryFilterMatch;
    });

    return filtered.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'title') {
        comp = a.title.localeCompare(b.title);
      } else if (sortBy === 'category') {
        comp = (CATEGORY_LABELS[a.category] || a.category).localeCompare(
          CATEGORY_LABELS[b.category] || b.category
        );
      } else if (sortBy === 'difficulty') {
        const order = { Easy: 1, Medium: 2, Hard: 3 };
        comp = (order[a.difficulty || 'Easy'] || 0) - (order[b.difficulty || 'Easy'] || 0);
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [algorithms, searchTerm, selectedDifficulty, selectedCategory, sortBy, sortOrder]);

  const toggleSort = (field: 'title' | 'difficulty' | 'category') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'Easy':
        return { bg: 'rgba(0, 255, 157, 0.15)', color: '#00ff9d', border: 'rgba(0, 255, 157, 0.4)' };
      case 'Medium':
        return { bg: 'rgba(255, 183, 3, 0.15)', color: '#ffb703', border: 'rgba(255, 183, 3, 0.4)' };
      case 'Hard':
        return { bg: 'rgba(255, 0, 85, 0.15)', color: '#ff0055', border: 'rgba(255, 0, 85, 0.4)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-dim)', border: 'var(--border-subtle)' };
    }
  };

  return (
    <div
      style={{
        padding: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-surface)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glow)',
          boxShadow: 'var(--shadow-glow)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <Sparkles style={{ color: 'var(--accent-emerald)', width: '20px', height: '20px' }} />
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-code)',
                margin: 0,
              }}
            >
              All Categorized Problems & Algorithms
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
            Comprehensive directory of Data Structures, Visualized Algorithms, and LeetCode Problem Solutions.
          </p>
        </div>

        {/* Stats Summary Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-darkest)',
              border: '1px solid var(--border-muted)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-dim)' }}>Total: </span>
            <strong style={{ color: 'var(--accent-emerald)' }}>{stats.total}</strong>
          </div>
          <div
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 255, 157, 0.1)',
              border: '1px solid rgba(0, 255, 157, 0.3)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-dim)' }}>Easy: </span>
            <strong style={{ color: '#00ff9d' }}>{stats.easy}</strong>
          </div>
          <div
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 183, 3, 0.1)',
              border: '1px solid rgba(255, 183, 3, 0.3)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-dim)' }}>Medium: </span>
            <strong style={{ color: '#ffb703' }}>{stats.medium}</strong>
          </div>
          <div
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 0, 85, 0.1)',
              border: '1px solid rgba(255, 0, 85, 0.3)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-dim)' }}>Hard: </span>
            <strong style={{ color: '#ff0055' }}>{stats.hard}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-surface)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-darkest)',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 0.8rem',
              width: '100%',
            }}
          >
            <Search style={{ width: '16px', height: '16px', color: 'var(--accent-emerald)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter problems by title, category, description..."
              aria-label="Filter problems"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Difficulty Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter style={{ width: '15px', height: '15px', color: 'var(--text-dim)' }} />
          {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`btn ${selectedDifficulty === diff ? 'btn-active' : ''}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Category Dropdown Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by Topic Category"
          style={{
            background: 'var(--bg-darkest)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.8rem',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="All">All Categories ({Object.keys(CATEGORY_LABELS).length})</option>
          {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
            <option key={catKey} value={catKey}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Main Problems Table */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr
              style={{
                background: 'var(--bg-darkest)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '0.85rem 1rem', width: '50px' }}>#</th>
              <th
                onClick={() => toggleSort('title')}
                style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Problem Title <ArrowUpDown style={{ width: '13px', height: '13px' }} />
                </div>
              </th>
              <th
                onClick={() => toggleSort('category')}
                style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Topic / Category <ArrowUpDown style={{ width: '13px', height: '13px' }} />
                </div>
              </th>
              <th
                onClick={() => toggleSort('difficulty')}
                style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Difficulty <ArrowUpDown style={{ width: '13px', height: '13px' }} />
                </div>
              </th>
              <th style={{ padding: '0.85rem 1rem' }}>Time Complexity</th>
              <th style={{ padding: '0.85rem 1rem' }}>Space Complexity</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlgorithms.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No matching problems found. Try adjusting your search query or filters.
                </td>
              </tr>
            ) : (
              filteredAlgorithms.map((alg, index) => {
                const badge = getDifficultyBadge(alg.difficulty);
                const catLabel = CATEGORY_LABELS[alg.category] || alg.category;

                return (
                  <tr
                    key={alg.id}
                    onClick={() => onSelectAlgorithm(alg.id, alg.category)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(0, 255, 157, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-dim)', fontFamily: 'var(--font-code)' }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Code2 style={{ width: '15px', height: '15px', color: 'var(--accent-emerald)' }} />
                        <span>{alg.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          background: 'var(--bg-darkest)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-muted)',
                          color: 'var(--text-dim)',
                        }}
                      >
                        {catLabel}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {alg.difficulty && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '3px',
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {alg.difficulty}
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        fontFamily: 'var(--font-code)',
                        fontSize: '0.8rem',
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      {alg.timeComplexity?.average || 'O(N)'}
                    </td>
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        fontFamily: 'var(--font-code)',
                        fontSize: '0.8rem',
                        color: 'var(--text-dim)',
                      }}
                    >
                      {alg.spaceComplexity || 'O(1)'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <button
                        className="btn btn-active"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlgorithm(alg.id, alg.category);
                        }}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Play style={{ width: '12px', height: '12px' }} />
                        Visualize
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
