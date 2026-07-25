import React from 'react';
import { Network, ArrowRight, Sparkles } from 'lucide-react';

export interface NeetCodeNode {
  id: string;
  title: string;
  categoryFolder: string;
  description: string;
  prerequisites: string[];
  algorithmCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  x: number;
  y: number;
}

export const NEETCODE_NODES: NeetCodeNode[] = [
  {
    id: 'arrays-and-hashing',
    title: '1. Arrays & Hashing',
    categoryFolder: 'arrays_and_hashing',
    description: 'Hash Maps, Frequency Counters, Prefix Sums, Subarray Sums',
    prerequisites: [],
    algorithmCount: 4,
    difficulty: 'Easy',
    x: 400,
    y: 60,
  },
  {
    id: 'two-pointers',
    title: '2. Two Pointers',
    categoryFolder: 'two_pointers',
    description: 'Target Sum, Sorted Arrays, Container With Most Water, 3Sum',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 180,
    y: 160,
  },
  {
    id: 'stack',
    title: '3. Stack',
    categoryFolder: 'stack',
    description: 'LIFO, Valid Parentheses, Monotonic Stack Nearest Smaller',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 400,
    y: 160,
  },
  {
    id: 'binary-search',
    title: '4. Binary Search',
    categoryFolder: 'binary_search',
    description: 'Binary Search, Search 2D Matrix, Monotonic Feasibility',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 620,
    y: 160,
  },
  {
    id: 'sliding-window',
    title: '5. Sliding Window',
    categoryFolder: 'sliding_window',
    description: 'Contiguous Subarrays, Monotonic Queue Window Minimum',
    prerequisites: ['two-pointers'],
    algorithmCount: 3,
    difficulty: 'Medium',
    x: 100,
    y: 270,
  },
  {
    id: 'linked-list',
    title: '6. Linked List',
    categoryFolder: 'linked_list',
    description: 'Node Pointers, Reversal, Merge Sorted, Cycle Detection',
    prerequisites: ['two-pointers'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 260,
    y: 270,
  },
  {
    id: 'trees',
    title: '7. Trees',
    categoryFolder: 'trees',
    description: 'Binary Trees, BSTs, Traversals, Diameter, LCA Binary Lifting',
    prerequisites: ['binary-search', 'linked-list'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 520,
    y: 270,
  },
  {
    id: 'tries',
    title: '8. Tries',
    categoryFolder: 'tries',
    description: 'Prefix Trees, Word Search, Add & Search Words',
    prerequisites: ['trees'],
    algorithmCount: 2,
    difficulty: 'Medium',
    x: 100,
    y: 380,
  },
  {
    id: 'heap',
    title: '9. Heap / Priority Queue',
    categoryFolder: 'heap',
    description: 'Kth Largest Element, Median Finder, Task Scheduler',
    prerequisites: ['trees'],
    algorithmCount: 3,
    difficulty: 'Medium',
    x: 280,
    y: 380,
  },
  {
    id: 'backtracking',
    title: '10. Backtracking',
    categoryFolder: 'backtracking',
    description: 'Subsets, Permutations, Combination Sum, N-Queens',
    prerequisites: ['trees'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 520,
    y: 380,
  },
  {
    id: 'graphs',
    title: '11. Graphs',
    categoryFolder: 'graphs',
    description: 'DFS, BFS, Number of Islands, Bipartite 2-Coloring, Cycles',
    prerequisites: ['backtracking'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 400,
    y: 490,
  },
  {
    id: 'dp-1d',
    title: '12. 1-D Dynamic Programming',
    categoryFolder: 'dp_1d',
    description: 'Climbing Stairs, House Robber, Coin Change, LIS DP',
    prerequisites: ['backtracking'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 640,
    y: 490,
  },
  {
    id: 'intervals',
    title: '13. Intervals',
    categoryFolder: 'intervals',
    description: 'Insert Interval, Merge Intervals, Non-overlapping Intervals',
    prerequisites: ['dp-1d'],
    algorithmCount: 3,
    difficulty: 'Medium',
    x: 760,
    y: 600,
  },
  {
    id: 'greedy',
    title: '14. Greedy Algorithms',
    categoryFolder: 'greedy',
    description: 'Kadane Max Subarray, Jump Game, Gas Station, Huffman',
    prerequisites: ['intervals'],
    algorithmCount: 3,
    difficulty: 'Medium',
    x: 760,
    y: 710,
  },
  {
    id: 'advanced-graphs',
    title: '15. Advanced Graphs',
    categoryFolder: 'advanced_graphs',
    description: 'Dijkstra, Bellman-Ford, Topo Sort, Kruskal MST, Max Flow',
    prerequisites: ['graphs'],
    algorithmCount: 4,
    difficulty: 'Hard',
    x: 320,
    y: 600,
  },
  {
    id: 'math-and-geometry',
    title: '16. Math & Geometry',
    categoryFolder: 'math_and_geometry',
    description: 'Sieve of Eratosthenes, Euclid GCD, Shoelace, Convex Hull',
    prerequisites: ['trees'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 760,
    y: 380,
  },
  {
    id: 'dp-2d',
    title: '17. 2-D Dynamic Programming',
    categoryFolder: 'dp_2d',
    description: 'Grid Unique Paths, LCS, Edit Distance, 0/1 Knapsack',
    prerequisites: ['dp-1d'],
    algorithmCount: 4,
    difficulty: 'Hard',
    x: 540,
    y: 600,
  },
  {
    id: 'bit-manipulation',
    title: '18. Bit Manipulation',
    categoryFolder: 'bit_manipulation',
    description: 'Single Number, Counting Bits, Reverse Bits, Bitmask DP',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 760,
    y: 270,
  },
  {
    id: 'advanced-range-and-cp',
    title: '19. Advanced Range & CP',
    categoryFolder: 'advanced_range_and_cp',
    description: 'Fenwick Tree, Segment Tree, KMP Pattern Match, Nim Game',
    prerequisites: ['greedy'],
    algorithmCount: 4,
    difficulty: 'Hard',
    x: 540,
    y: 710,
  },
];

interface KnowledgeGraphProps {
  onSelectCategoryFolder: (folder: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onSelectCategoryFolder }) => {
  // Render SVG prerequisite connection lines
  const renderConnections = () => {
    const lines: React.ReactNode[] = [];

    NEETCODE_NODES.forEach((node) => {
      node.prerequisites.forEach((prereqId) => {
        const parent = NEETCODE_NODES.find((n) => n.id === prereqId);
        if (parent) {
          lines.push(
            <g key={`${parent.id}-${node.id}`}>
              <line
                x1={parent.x}
                y1={parent.y + 25}
                x2={node.x}
                y2={node.y - 25}
                stroke="var(--border-subtle)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </g>
          );
        }
      });
    });

    return lines;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(0, 255, 157, 0.15)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            padding: '0.3rem 1rem',
            marginBottom: '0.75rem',
          }}
        >
          <Sparkles style={{ width: '16px', height: '16px', color: 'var(--accent-emerald)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
            INTERVIEW & COMPETITIVE PROGRAMMING ROADMAP
          </span>
        </div>

        <h1
          style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.03em',
            marginBottom: '0.5rem',
          }}
        >
          NeetCode Aligned Knowledge Graph
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', maxWidth: '680px', margin: '0 auto' }}>
          Explore the prerequisite learning tree from foundational data structures to complex graph and DP algorithms.
          Click any topic node to open its interactive visualizers and code implementations.
        </p>
      </div>

      {/* Interactive SVG Knowledge Graph Container */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          overflowX: 'auto',
          position: 'relative',
          padding: '2rem 1rem',
          minHeight: '820px',
          background: 'var(--bg-darkest)',
        }}
      >
        <svg
          width="900"
          height="780"
          style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
        >
          {/* Prerequisite Edges */}
          {renderConnections()}

          {/* Category Nodes */}
          {NEETCODE_NODES.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x - 90}, ${node.y - 30})`}
              onClick={() => onSelectCategoryFolder(node.categoryFolder)}
              style={{ cursor: 'pointer' }}
            >
              {/* Node Card Container */}
              <rect
                width="180"
                height="60"
                rx="10"
                fill="var(--bg-surface)"
                stroke={node.difficulty === 'Hard' ? 'var(--state-swap)' : node.difficulty === 'Medium' ? 'var(--state-compare)' : 'var(--accent-emerald)'}
                strokeWidth="1.5"
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))',
                  transition: 'all 0.2s ease',
                }}
              />

              {/* Node Title */}
              <text
                x="90"
                y="24"
                textAnchor="middle"
                fill="var(--text-main)"
                fontSize="12"
                fontWeight="700"
                fontFamily="var(--font-ui)"
              >
                {node.title}
              </text>

              {/* Difficulty & Count Subtitle */}
              <text
                x="90"
                y="44"
                textAnchor="middle"
                fill="var(--text-dim)"
                fontSize="10"
                fontFamily="var(--font-code)"
              >
                {node.algorithmCount} Algs • {node.difficulty}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Grid List of Topics for Quick Access */}
      <div style={{ width: '100%', marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Network style={{ width: '18px', height: '18px', color: 'var(--accent-emerald)' }} />
          All NeetCode 18 Topic Categories
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {NEETCODE_NODES.map((node) => (
            <div
              key={node.id}
              className="glass-card"
              onClick={() => onSelectCategoryFolder(node.categoryFolder)}
              style={{
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {node.title}
                  </span>
                  <span
                    className={`badge ${
                      node.difficulty === 'Easy'
                        ? 'badge-easy'
                        : node.difficulty === 'Medium'
                        ? 'badge-medium'
                        : 'badge-hard'
                    }`}
                  >
                    {node.difficulty}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  {node.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-muted)', paddingTop: '0.5rem', marginTop: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-code)', color: 'var(--text-muted)' }}>
                  {node.algorithmCount} Interactive Algs
                </span>
                <ArrowRight style={{ width: '14px', height: '14px', color: 'var(--accent-mint)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
