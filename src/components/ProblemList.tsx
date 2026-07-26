import React, { useState, useMemo } from 'react';
import { Search, Play, Sparkles, Code2, ArrowUpDown } from 'lucide-react';
import { CategoryType } from '../types/dsa';
import { getAllAlgorithms } from '../algorithms/registry';
import { Badge, Button, Card, Input, difficultyBadgeVariant } from '../ui';

interface ProblemListProps {
  onSelectAlgorithm: (algorithmId: string, categoryFolder?: CategoryType) => void;
  /** Controlled category filter — when provided, the parent (e.g. the URL) owns
      the selection and chip clicks are reported through onCategoryChange. */
  category?: CategoryType | 'All';
  onCategoryChange?: (category: CategoryType | 'All') => void;
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

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--text-muted)',
};

const cellPadding = 'var(--space-3) var(--space-4)';

/* ui.css defaults cards and neutral badges to --border-subtle, which disappears
   against the near-black page; every panel and chip edge here is promoted one
   step so the container is visible at all (DESIGN.md R5.1). */
const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

// Object.entries erases the CategoryType key union; restore it once here.
const CATEGORY_ENTRIES = Object.entries(CATEGORY_LABELS) as [CategoryType, string][];

export const ProblemList: React.FC<ProblemListProps> = ({
  onSelectAlgorithm,
  category,
  onCategoryChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [internalCategory, setInternalCategory] = useState<CategoryType | 'All'>('All');

  // Controlled when the prop is present; uncontrolled falls back to local state.
  const selectedCategory = category ?? internalCategory;

  const handleCategorySelect = (next: CategoryType | 'All') => {
    if (onCategoryChange) {
      onCategoryChange(next);
    } else {
      setInternalCategory(next);
    }
  };
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

  /* Real buttons (keyboard-accessible) inside the th; the selected treatment marks
     the active sort column. The bordered default variant keeps the sort affordance
     visible against the inset header strip. */
  const sortableHeader = (label: string, field: 'title' | 'difficulty' | 'category') => (
    <th style={{ padding: 'var(--space-2)' }}>
      <Button
        size="sm"
        selected={sortBy === field}
        icon={<ArrowUpDown />}
        onClick={() => toggleSort(field)}
        aria-label={`Sort by ${label.toLowerCase()}`}
        style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}
      >
        {label}
      </Button>
    </th>
  );

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* Header */}
      <Card
        style={PANEL_BORDER}
        icon={<Sparkles />}
        title={
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
            All Categorized Problems &amp; Algorithms
          </span>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Badge variant="neutral" style={PANEL_BORDER}>
              Total: {stats.total}
            </Badge>
            <Badge variant="success">Easy: {stats.easy}</Badge>
            <Badge variant="warning">Medium: {stats.medium}</Badge>
            <Badge variant="danger">Hard: {stats.hard}</Badge>
          </div>
        }
      >
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
          Comprehensive directory of Data Structures, Visualized Algorithms, and LeetCode Problem Solutions.
        </p>
      </Card>

      {/* Search + filters */}
      <Card padding="sm" style={PANEL_BORDER}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            leadingIcon={<Search />}
            placeholder="Filter problems by title, category, description..."
            aria-label="Filter problems"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={sectionLabelStyle}>Difficulty</span>
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <Button
                key={diff}
                size="sm"
                selected={selectedDifficulty === diff}
                onClick={() => setSelectedDifficulty(diff)}
              >
                {diff}
              </Button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ ...sectionLabelStyle, lineHeight: 'var(--control-h-sm)' }}>Category</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
              <Button size="sm" selected={selectedCategory === 'All'} onClick={() => handleCategorySelect('All')}>
                All categories
              </Button>
              {CATEGORY_ENTRIES.map(([catKey, label]) => (
                <Button
                  key={catKey}
                  size="sm"
                  selected={selectedCategory === catKey}
                  onClick={() => handleCategorySelect(catKey)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Problems table */}
      <Card padding="none" style={PANEL_BORDER}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-md)' }}>
            <thead>
              {/* The header row carries the sort controls, so it is a toolbar: the
                  chrome tier, which the elevated sort buttons read against. */}
              <tr
                style={{
                  background: 'var(--bg-chrome)',
                  borderBottom: '1px solid var(--border-default)',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                }}
              >
                <th style={{ padding: cellPadding, width: '50px', fontWeight: 600 }}>#</th>
                {sortableHeader('Problem title', 'title')}
                {sortableHeader('Topic / category', 'category')}
                {sortableHeader('Difficulty', 'difficulty')}
                <th style={{ padding: cellPadding, fontWeight: 600 }}>Time complexity</th>
                <th style={{ padding: cellPadding, fontWeight: 600 }}>Space complexity</th>
                <th style={{ padding: cellPadding, textAlign: 'center', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlgorithms.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}
                  >
                    No matching problems found. Try adjusting your search query or filters.
                  </td>
                </tr>
              ) : (
                filteredAlgorithms.map((alg, index) => {
                  const catLabel = CATEGORY_LABELS[alg.category] || alg.category;

                  return (
                    <tr
                      key={alg.id}
                      onClick={() => onSelectAlgorithm(alg.id, alg.category)}
                      style={{
                        borderBottom: '1px solid var(--border-default)',
                        transition: 'background var(--transition-fast)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Rows highlight to --bg-hover, where muted/faint tones drop
                          below AA — every cell therefore stays at secondary or above. */}
                      <td
                        style={{
                          padding: cellPadding,
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-code)',
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        {index + 1}
                      </td>
                      <td style={{ padding: cellPadding, fontWeight: 600, color: 'var(--text-primary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Code2
                            aria-hidden="true"
                            size={16}
                            style={{ color: 'var(--text-secondary)', flexShrink: 0 }}
                          />
                          <span>{alg.title}</span>
                        </span>
                      </td>
                      <td style={{ padding: cellPadding }}>
                        <Badge variant="neutral" style={PANEL_BORDER}>
                          {catLabel}
                        </Badge>
                      </td>
                      <td style={{ padding: cellPadding }}>
                        {alg.difficulty && (
                          <Badge variant={difficultyBadgeVariant(alg.difficulty)}>{alg.difficulty}</Badge>
                        )}
                      </td>
                      <td
                        style={{
                          padding: cellPadding,
                          fontFamily: 'var(--font-code)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {alg.timeComplexity?.average || 'O(N)'}
                      </td>
                      <td
                        style={{
                          padding: cellPadding,
                          fontFamily: 'var(--font-code)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {alg.spaceComplexity || 'O(1)'}
                      </td>
                      <td style={{ padding: cellPadding, textAlign: 'center' }}>
                        <Button
                          size="sm"
                          icon={<Play />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAlgorithm(alg.id, alg.category);
                          }}
                        >
                          Visualize
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
