import React from 'react';
import { Network, ArrowRight, MousePointerClick } from 'lucide-react';
import { Badge, Card, difficultyBadgeVariant } from '../ui';

export interface TopicRoadmapNode {
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

export const TOPIC_ROADMAP_NODES: TopicRoadmapNode[] = [
  {
    id: 'arrays-and-hashing',
    title: '1. Arrays & Hashing',
    categoryFolder: 'arrays_and_hashing',
    description: 'Hash Maps, Frequency Counters, Prefix Sums, Subarray Sums',
    prerequisites: [],
    algorithmCount: 4,
    difficulty: 'Easy',
    x: 660,
    y: 60,
  },
  {
    id: 'two-pointers',
    title: '2. Two Pointers',
    categoryFolder: 'two_pointers',
    description: 'Target Sum, Sorted Arrays, Container With Most Water',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 140,
    y: 190,
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
    y: 190,
  },
  {
    id: 'binary-search',
    title: '4. Binary Search',
    categoryFolder: 'binary_search',
    description: 'Binary Search, Search 2D Matrix, Monotonic Feasibility',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 660,
    y: 190,
  },
  {
    id: 'sliding-window',
    title: '5. Sliding Window',
    categoryFolder: 'sliding_window',
    description: 'Contiguous Subarrays, Monotonic Queue Window Minimum',
    prerequisites: ['two-pointers'],
    algorithmCount: 3,
    difficulty: 'Medium',
    x: 140,
    y: 320,
  },
  {
    id: 'linked-list',
    title: '6. Linked List',
    categoryFolder: 'linked_list',
    description: 'Node Pointers, Reversal, Merge Sorted, Cycle Detection',
    prerequisites: ['two-pointers'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 400,
    y: 320,
  },
  {
    id: 'tree-fundamentals',
    title: '7. Tree Fundamentals',
    categoryFolder: 'tree_fundamentals',
    description: 'Binary Trees, BSTs, Traversals, Lowest Common Ancestor',
    prerequisites: ['linked-list', 'binary-search'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 660,
    y: 320,
  },
  {
    id: 'tries-and-strings',
    title: '8. Tries & String Algs',
    categoryFolder: 'tries_and_strings',
    description: 'Prefix Trees, KMP String Match, Z-Algorithm, Hashing',
    prerequisites: ['tree-fundamentals'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 140,
    y: 450,
  },
  {
    id: 'heap-and-priority-queue',
    title: '9. Heap / Priority Queue',
    categoryFolder: 'heap_and_priority_queue',
    description: 'Kth Largest Element, Min/Max Heap, Task Scheduler',
    prerequisites: ['tree-fundamentals'],
    algorithmCount: 3,
    difficulty: 'Medium',
    x: 400,
    y: 450,
  },
  {
    id: 'backtracking',
    title: '10. Backtracking',
    categoryFolder: 'backtracking',
    description: 'Subsets, Permutations, Combination Sum, N-Queens',
    prerequisites: ['tree-fundamentals'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 660,
    y: 450,
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
    y: 580,
  },
  {
    id: 'graph-shortest-paths',
    title: '12. Graph Shortest Paths',
    categoryFolder: 'graph_shortest_paths',
    description: 'Dijkstra, Bellman-Ford, Floyd-Warshall All-Pairs',
    prerequisites: ['graph-traversal'],
    algorithmCount: 3,
    difficulty: 'Hard',
    x: 140,
    y: 710,
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
    y: 710,
  },
  {
    id: 'graph-directed-and-scc',
    title: '14. Directed & SCC Graphs',
    categoryFolder: 'graph_directed_and_scc',
    description: 'Topological Sort (Kahn), Kosaraju SCC, Tarjan SCC',
    prerequisites: ['graph-traversal'],
    algorithmCount: 3,
    difficulty: 'Hard',
    x: 660,
    y: 710,
  },
  {
    id: 'graph-flows-and-cuts',
    title: '15. Network Flows & Cuts',
    categoryFolder: 'graph_flows_and_cuts',
    description: 'Ford-Fulkerson Max Flow, Edmonds-Karp, Bipartite Matching',
    prerequisites: ['graph-shortest-paths'],
    algorithmCount: 3,
    difficulty: 'Hard',
    x: 140,
    y: 840,
  },
  {
    id: 'dp-1d',
    title: '16. 1-D Dynamic Programming',
    categoryFolder: 'dp_1d',
    description: 'Climbing Stairs, House Robber, Coin Change, LIS DP',
    prerequisites: ['backtracking'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 920,
    y: 580,
  },
  {
    id: 'dp-2d',
    title: '17. 2-D Dynamic Programming',
    categoryFolder: 'dp_2d',
    description: 'Grid Unique Paths, LCS, Edit Distance, 0/1 Knapsack',
    prerequisites: ['dp-1d'],
    algorithmCount: 4,
    difficulty: 'Hard',
    x: 920,
    y: 710,
  },
  {
    id: 'advanced-range-queries',
    title: '18. Advanced Range Queries',
    categoryFolder: 'advanced_range_queries',
    description: 'Fenwick Tree (BIT), Segment Tree, Lazy Propagation',
    prerequisites: ['dp-2d'],
    algorithmCount: 4,
    difficulty: 'Hard',
    x: 920,
    y: 840,
  },
  {
    id: 'bit-manipulation',
    title: '19. Bit Manipulation',
    categoryFolder: 'bit_manipulation',
    description: 'Single Number, Counting Bits, Reverse Bits, Bitmask DP',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 3,
    difficulty: 'Easy',
    x: 920,
    y: 190,
  },
  {
    id: 'math-and-number-theory',
    title: '20. Math & Number Theory',
    categoryFolder: 'math_and_number_theory',
    description: 'Sieve of Eratosthenes, Euclid GCD, Modular Inverse',
    prerequisites: ['arrays-and-hashing'],
    algorithmCount: 4,
    difficulty: 'Medium',
    x: 1180,
    y: 190,
  },
  {
    id: 'geometry-and-sweep-line',
    title: '21. Geometry & Sweep Line',
    categoryFolder: 'geometry_and_sweep_line',
    description: 'Shoelace Polygon Area, Convex Hull (Monotone Chain)',
    prerequisites: ['math-and-number-theory'],
    algorithmCount: 2,
    difficulty: 'Hard',
    x: 1180,
    y: 320,
  },
];

interface KnowledgeGraphProps {
  onSelectCategoryFolder: (folder: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onSelectCategoryFolder }) => {
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);

  const renderConnections = () => {
    const lines: React.ReactNode[] = [];

    TOPIC_ROADMAP_NODES.forEach((node) => {
      node.prerequisites.forEach((prereqId) => {
        const parent = TOPIC_ROADMAP_NODES.find((n) => n.id === prereqId);
        if (parent) {
          const isHighlighted = hoveredNodeId === node.id || hoveredNodeId === parent.id;
          const strokeColor = isHighlighted ? 'var(--accent)' : 'var(--border-strong)';
          const strokeWidth = isHighlighted ? 2 : 1.5;
          const strokeOpacity = hoveredNodeId ? (isHighlighted ? 1 : 0.3) : 0.85;

          let startX = parent.x;
          let startY = parent.y + 30;
          let endX = node.x;
          let endY = node.y - 30;

          if (parent.y === node.y) {
            if (parent.x < node.x) {
              startX = parent.x + 90;
              startY = parent.y;
              endX = node.x - 90;
              endY = node.y;
            } else {
              startX = parent.x - 90;
              startY = parent.y;
              endX = node.x + 90;
              endY = node.y;
            }
          }

          const midY = (startY + endY) / 2;
          const pathData = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

          lines.push(
            <g key={`${parent.id}-${node.id}`}>
              <path
                d={pathData}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={isHighlighted ? 'none' : '4 4'}
                markerEnd={isHighlighted ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                style={{
                  opacity: strokeOpacity,
                  transition: 'all var(--transition-normal)',
                }}
              />
            </g>
          );
        }
      });
    });

    return lines;
  };

  const handleKeyDown = (e: React.KeyboardEvent, categoryFolder: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectCategoryFolder(categoryFolder);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-6)',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        gap: 'var(--space-6)',
      }}
    >
      {/* Interactive SVG roadmap */}
      <Card
        icon={<Network aria-hidden="true" style={{ color: 'var(--accent)' }} />}
        title={
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Topic prerequisite roadmap
          </span>
        }
        actions={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            <MousePointerClick aria-hidden="true" style={{ width: '14px', height: '14px' }} />
            Hover to trace prerequisites, click to open a topic
          </span>
        }
        padding="none"
        style={{ width: '100%' }}
      >
        <div
          role="region"
          aria-label="Interactive Data Structures and Algorithms Prerequisite Roadmap"
          style={{
            width: '100%',
            overflowX: 'auto',
            position: 'relative',
            padding: 'var(--space-6) var(--space-4)',
            minHeight: '950px',
            background: 'var(--bg-inset)',
          }}
        >
          <svg
            width="1350"
            height="920"
            viewBox="0 0 1350 920"
            style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
          >
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--border-strong)" opacity="0.8" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent)" />
              </marker>
            </defs>

            {renderConnections()}

            {TOPIC_ROADMAP_NODES.map((node) => {
              const isHovered = hoveredNodeId === node.id;
              const isRelated =
                hoveredNodeId !== null &&
                (node.prerequisites.includes(hoveredNodeId) ||
                  TOPIC_ROADMAP_NODES.find((n) => n.id === hoveredNodeId)?.prerequisites.includes(node.id));

              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.title}. ${node.description}. Difficulty: ${node.difficulty}. Click or press Enter to view topics.`}
                  transform={`translate(${node.x - 90}, ${node.y - 30})`}
                  onClick={() => onSelectCategoryFolder(node.categoryFolder)}
                  onKeyDown={(e) => handleKeyDown(e, node.categoryFolder)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onFocus={() => setHoveredNodeId(node.id)}
                  onBlur={() => setHoveredNodeId(null)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  <rect
                    width="180"
                    height="60"
                    rx="10"
                    fill={isHovered ? 'var(--accent-soft)' : 'var(--bg-elevated)'}
                    stroke={
                      isHovered
                        ? 'var(--border-accent)'
                        : isRelated
                        ? 'var(--border-strong)'
                        : 'var(--border-default)'
                    }
                    strokeWidth={isHovered ? 1.5 : 1}
                    style={{ transition: 'all var(--transition-normal)' }}
                  />

                  <text
                    x="90"
                    y="24"
                    textAnchor="middle"
                    fill={isHovered ? 'var(--accent)' : 'var(--text-primary)'}
                    fontSize="11.5"
                    fontWeight="600"
                    fontFamily="var(--font-ui)"
                  >
                    {node.title}
                  </text>

                  <text
                    x="90"
                    y="44"
                    textAnchor="middle"
                    fill="var(--text-secondary)"
                    fontSize="10"
                    fontFamily="var(--font-code)"
                  >
                    {node.algorithmCount} Algs • {node.difficulty}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      {/* Grid list of topics for quick access */}
      <div style={{ width: '100%' }}>
        <h3
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Network aria-hidden="true" style={{ width: '16px', height: '16px' }} />
          All Categorized Topic Modules
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 'var(--space-3)' }}>
          {TOPIC_ROADMAP_NODES.map((node) => (
            <Card
              key={node.id}
              padding="sm"
              role="button"
              tabIndex={0}
              aria-label={`${node.title}: ${node.description}. Difficulty: ${node.difficulty}. Click or press Enter to view topics.`}
              onClick={() => onSelectCategoryFolder(node.categoryFolder)}
              onKeyDown={(e) => handleKeyDown(e, node.categoryFolder)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onFocus={() => setHoveredNodeId(node.id)}
              onBlur={() => setHoveredNodeId(null)}
              style={{
                cursor: 'pointer',
                transition: 'background var(--transition-fast), border-color var(--transition-fast)',
                background: hoveredNodeId === node.id ? 'var(--bg-hover)' : undefined,
                borderColor: hoveredNodeId === node.id ? 'var(--border-strong)' : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                  height: '100%',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-2)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {node.title}
                    </span>
                    <Badge variant={difficultyBadgeVariant(node.difficulty)}>{node.difficulty}</Badge>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    {node.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 'var(--space-2)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  <Badge variant="neutral">{node.algorithmCount} Topics</Badge>
                  <ArrowRight aria-hidden="true" style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
