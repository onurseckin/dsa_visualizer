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
    y: 50,
  },
  {
    id: 'two-pointers',
    title: '2. Two Pointers',
    categoryFolder: 'two_pointers',
    description: 'Target Sum, Sorted Arrays, Container With Most Water',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 180,
    y: 150,
  },
  {
    id: 'stack-and-queue',
    title: '3. Stack & Queue',
    categoryFolder: 'stack_and_queue',
    description: 'LIFO Stack, Queue, Valid Parentheses, Monotonic Stack',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 400,
    y: 150,
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
    y: 150,
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
    y: 250,
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
    y: 250,
  },
  {
    id: 'tree-fundamentals',
    title: '7. Tree Fundamentals',
    categoryFolder: 'tree_fundamentals',
    description: 'Binary Trees, BSTs, Traversals, Lowest Common Ancestor',
    prerequisites: ['linked-list', 'binary-search'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 520,
    y: 250,
  },
  {
    id: 'tries-and-strings',
    title: '8. Tries & String Algs',
    categoryFolder: 'tries_and_strings',
    description: 'Prefix Trees, KMP String Match, Z-Algorithm, Hashing',
    prerequisites: ['tree-fundamentals'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 100,
    y: 350,
  },
  {
    id: 'heap-and-priority-queue',
    title: '9. Heap / Priority Queue',
    categoryFolder: 'heap_and_priority_queue',
    description: 'Kth Largest Element, Min/Max Heap, Task Scheduler',
    prerequisites: ['tree-fundamentals'],
    algorithmCount: 3,
    difficulty: 'Medium',
    x: 280,
    y: 350,
  },
  {
    id: 'backtracking',
    title: '10. Backtracking',
    categoryFolder: 'backtracking',
    description: 'Subsets, Permutations, Combination Sum, N-Queens',
    prerequisites: ['tree-fundamentals'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 520,
    y: 350,
  },
  {
    id: 'graph-traversal',
    title: '11. Graph Traversal',
    categoryFolder: 'graph_traversal',
    description: 'BFS, DFS, Number of Islands, Bipartite Check, Cycles',
    prerequisites: ['backtracking', 'tree-fundamentals'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 400,
    y: 450,
  },
  {
    id: 'graph-shortest-paths',
    title: '12. Graph Shortest Paths',
    categoryFolder: 'graph_shortest_paths',
    description: 'Dijkstra, Bellman-Ford, Floyd-Warshall All-Pairs',
    prerequisites: ['graph-traversal'],
    algorithmCount: 3,
    difficulty: 'Hard',
    x: 180,
    y: 550,
  },
  {
    id: 'graph-spanning-trees',
    title: '13. Spanning Trees & DSU',
    categoryFolder: 'graph_spanning_trees',
    description: 'Kruskal MST, Union-Find / DSU, Prim MST',
    prerequisites: ['graph-traversal'],
    algorithmCount: 3,
    difficulty: 'Medium',
    x: 400,
    y: 550,
  },
  {
    id: 'graph-directed-and-scc',
    title: '14. Directed & SCC Graphs',
    categoryFolder: 'graph_directed_and_scc',
    description: 'Topological Sort (Kahn), Kosaraju SCC, Tarjan SCC',
    prerequisites: ['graph-traversal'],
    algorithmCount: 3,
    difficulty: 'Hard',
    x: 620,
    y: 550,
  },
  {
    id: 'graph-flows-and-cuts',
    title: '15. Network Flows & Cuts',
    categoryFolder: 'graph_flows_and_cuts',
    description: 'Ford-Fulkerson Max Flow, Edmonds-Karp, Bipartite Matching',
    prerequisites: ['graph-shortest-paths'],
    algorithmCount: 3,
    difficulty: 'Hard',
    x: 180,
    y: 650,
  },
  {
    id: 'dp-1d',
    title: '16. 1-D Dynamic Programming',
    categoryFolder: 'dp_1d',
    description: 'Climbing Stairs, House Robber, Coin Change, LIS DP',
    prerequisites: ['backtracking'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 740,
    y: 450,
  },
  {
    id: 'dp-2d',
    title: '17. 2-D Dynamic Programming',
    categoryFolder: 'dp_2d',
    description: 'Grid Unique Paths, LCS, Edit Distance, 0/1 Knapsack',
    prerequisites: ['dp-1d'],
    algorithmCount: 4,
    difficulty: 'Hard',
    x: 740,
    y: 550,
  },
  {
    id: 'advanced-range-queries',
    title: '18. Advanced Range Queries',
    categoryFolder: 'advanced_range_queries',
    description: 'Fenwick Tree (BIT), Segment Tree, Lazy Propagation',
    prerequisites: ['dp-2d'],
    algorithmCount: 4,
    difficulty: 'Hard',
    x: 740,
    y: 650,
  },
  {
    id: 'bit-manipulation',
    title: '19. Bit Manipulation',
    categoryFolder: 'bit_manipulation',
    description: 'Single Number, Counting Bits, Reverse Bits, Bitmask DP',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 760,
    y: 250,
  },
  {
    id: 'math-and-number-theory',
    title: '20. Math & Number Theory',
    categoryFolder: 'math_and_number_theory',
    description: 'Sieve of Eratosthenes, Euclid GCD, Modular Inverse',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 760,
    y: 350,
  },
  {
    id: 'geometry-and-sweep-line',
    title: '21. Geometry & Sweep Line',
    categoryFolder: 'geometry_and_sweep_line',
    description: 'Shoelace Polygon Area, Convex Hull (Monotone Chain)',
    prerequisites: ['math-and-number-theory'],
    algorithmCount: 3,
    difficulty: 'Hard',
    x: 400,
    y: 650,
  },
];

interface KnowledgeGraphProps {
  onSelectCategoryFolder: (folder: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onSelectCategoryFolder }) => {
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
        maxWidth: '1280px',
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
            INTERVIEW & COMPETITIVE PROGRAMMING TOPOLOGY
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
          Topologically Ordered Prerequisite Knowledge Graph
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', maxWidth: '720px', margin: '0 auto' }}>
          Follow the prerequisite arrows from foundational data structures to specialized graph, flow, and range query algorithms.
          Click any topic node to jump directly to its visualizers and Python code implementations.
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
          minHeight: '760px',
          background: 'var(--bg-darkest)',
        }}
      >
        <svg
          width="920"
          height="720"
          style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
        >
          {renderConnections()}

          {NEETCODE_NODES.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x - 90}, ${node.y - 30})`}
              onClick={() => onSelectCategoryFolder(node.categoryFolder)}
              style={{ cursor: 'pointer' }}
            >
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

              <text
                x="90"
                y="24"
                textAnchor="middle"
                fill="var(--text-main)"
                fontSize="11.5"
                fontWeight="700"
                fontFamily="var(--font-ui)"
              >
                {node.title}
              </text>

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
          All Categorized Topic Modules
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
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
