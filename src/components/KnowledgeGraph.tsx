import React from 'react';
import { Network, ArrowRight, MousePointerClick } from 'lucide-react';
import { Badge, Card, difficultyBadgeVariant } from '../ui';
import { vizSlotBg, vizSlotColor } from './primitives/vizPalette';

/* The roadmap reads as a map, so every topic belongs to one of exactly eight
   families — one per validated --viz-* slot, assigned in fixed order. */
export type TopicFamilyId =
  | 'foundations'
  | 'linear-structures'
  | 'searching'
  | 'trees-and-heaps'
  | 'recursion'
  | 'graphs'
  | 'dynamic-programming'
  | 'math-and-geometry';

export interface TopicFamily {
  id: TopicFamilyId;
  label: string;
  /** Zero-based --viz-* slot; index in TOPIC_FAMILIES is the fixed slot order. */
  slot: number;
}

export const TOPIC_FAMILIES: TopicFamily[] = [
  { id: 'foundations', label: 'Arrays & windows', slot: 0 },
  { id: 'linear-structures', label: 'Linear structures', slot: 1 },
  { id: 'searching', label: 'Searching', slot: 2 },
  { id: 'trees-and-heaps', label: 'Trees & heaps', slot: 3 },
  { id: 'recursion', label: 'Recursion', slot: 4 },
  { id: 'graphs', label: 'Graphs', slot: 5 },
  { id: 'dynamic-programming', label: 'Dynamic programming', slot: 6 },
  { id: 'math-and-geometry', label: 'Math, bits & geometry', slot: 7 },
];

const FAMILY_BY_ID: Record<TopicFamilyId, TopicFamily> = TOPIC_FAMILIES.reduce(
  (acc, family) => {
    acc[family.id] = family;
    return acc;
  },
  {} as Record<TopicFamilyId, TopicFamily>
);

export const topicFamilyColor = (family: TopicFamilyId): string =>
  vizSlotColor(FAMILY_BY_ID[family].slot);
export const topicFamilyLabel = (family: TopicFamilyId): string => FAMILY_BY_ID[family].label;
const topicFamilyFill = (family: TopicFamilyId): string =>
  vizSlotBg(FAMILY_BY_ID[family].slot, 18, 'var(--bg-elevated)');

export interface TopicRoadmapNode {
  id: string;
  title: string;
  categoryFolder: string;
  description: string;
  prerequisites: string[];
  algorithmCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  family: TopicFamilyId;
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
    family: 'foundations',
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
    family: 'foundations',
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
    family: 'linear-structures',
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
    family: 'searching',
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
    family: 'foundations',
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
    family: 'linear-structures',
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
    family: 'trees-and-heaps',
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
    family: 'trees-and-heaps',
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
    family: 'trees-and-heaps',
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
    family: 'recursion',
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
    family: 'graphs',
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
    family: 'graphs',
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
    family: 'graphs',
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
    family: 'graphs',
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
    family: 'graphs',
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
    family: 'dynamic-programming',
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
    family: 'dynamic-programming',
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
    family: 'dynamic-programming',
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
    family: 'math-and-geometry',
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
    family: 'math-and-geometry',
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
    family: 'math-and-geometry',
    x: 1180,
    y: 320,
  },
];

interface KnowledgeGraphProps {
  onSelectCategoryFolder: (folder: string) => void;
}

/* ui.css defaults cards and neutral badges to --border-subtle, which disappears
   against the near-black page; panels here carry a --border-default edge and
   promote to --border-strong on hover (DESIGN.md R5.1). */
const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };
/* Legend/identity dots share one size so every family swatch reads the same.
   The swatch fill is the roadmap's data key — the one place hue survives in this
   view, since the shell around it (headers, hints, cards, badges) is neutral. */
const SWATCH_SIZE = '10px';

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onSelectCategoryFolder }) => {
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);

  const renderConnections = () => {
    const lines: React.ReactNode[] = [];

    TOPIC_ROADMAP_NODES.forEach((node) => {
      node.prerequisites.forEach((prereqId) => {
        const parent = TOPIC_ROADMAP_NODES.find((n) => n.id === prereqId);
        if (parent) {
          const isHighlighted = hoveredNodeId === node.id || hoveredNodeId === parent.id;
          /* An edge belongs to the topic it unlocks, so it carries the child's
             family color — that is what makes the map read as coloured tracks. */
          const strokeColor = isHighlighted ? 'var(--accent)' : topicFamilyColor(node.family);
          const strokeWidth = isHighlighted ? 2.5 : 1.75;
          const strokeOpacity = hoveredNodeId ? (isHighlighted ? 1 : 0.25) : 0.8;

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
                strokeDasharray={isHighlighted ? 'none' : '5 5'}
                markerEnd={isHighlighted ? 'url(#arrow-active)' : `url(#arrow-${node.family})`}
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
        icon={<Network />}
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
            <MousePointerClick aria-hidden="true" size={14} />
            Hover to trace prerequisites, click to open a topic
          </span>
        }
        padding="none"
        style={{ width: '100%', ...PANEL_BORDER }}
      >
        <div
          role="region"
          aria-label="Interactive Data Structures and Algorithms Prerequisite Roadmap"
          /* An inset well sized by the roadmap it holds — the old 950px floor only
             added blank space under short viewports. */
          style={{
            width: '100%',
            overflowX: 'auto',
            position: 'relative',
            padding: 'var(--space-6) var(--space-4)',
            background: 'var(--bg-inset)',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <ul
            aria-label="Topic family colors"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 'var(--space-2) var(--space-4)',
              listStyle: 'none',
              margin: '0 auto var(--space-4)',
              padding: 0,
              maxWidth: '1100px',
            }}
          >
            {TOPIC_FAMILIES.map((family) => (
              <li
                key={family.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: SWATCH_SIZE,
                    height: SWATCH_SIZE,
                    borderRadius: 'var(--radius-full)',
                    background: topicFamilyColor(family.id),
                  }}
                />
                {family.label}
              </li>
            ))}
          </ul>

          <svg
            width="1350"
            height="920"
            viewBox="0 0 1350 920"
            style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
          >
            <defs>
              {/* One arrowhead per family: SVG markers cannot inherit the path stroke. */}
              {TOPIC_FAMILIES.map((family) => (
                <marker
                  key={family.id}
                  id={`arrow-${family.id}`}
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={topicFamilyColor(family.id)} opacity="0.85" />
                </marker>
              ))}
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
                    fill={isHovered ? 'var(--accent-soft)' : topicFamilyFill(node.family)}
                    stroke={
                      isHovered
                        ? 'var(--border-accent)'
                        : isRelated
                        ? topicFamilyColor(node.family)
                        : 'var(--border-default)'
                    }
                    strokeWidth={isHovered ? 1.5 : 1}
                    style={{ transition: 'all var(--transition-normal)' }}
                  />

                  {/* Family bar survives the hover/selected treatment, so identity
                      stays readable while the accent marks interaction. */}
                  <rect
                    x="7"
                    y="14"
                    width="4"
                    height="32"
                    rx="2"
                    fill={topicFamilyColor(node.family)}
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
          <Network aria-hidden="true" size={16} />
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
                borderColor:
                  hoveredNodeId === node.id ? 'var(--border-strong)' : 'var(--border-default)',
                /* Inset bar rather than a border-left longhand: mixing it with the
                   hover borderColor shorthand makes React fight over the property. */
                boxShadow: `inset 3px 0 0 ${topicFamilyColor(node.family)}`,
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
                    borderTop: '1px solid var(--border-default)',
                    paddingTop: 'var(--space-2)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Badge variant="neutral" style={PANEL_BORDER}>
                      {node.algorithmCount} Topics
                    </Badge>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: SWATCH_SIZE,
                          height: SWATCH_SIZE,
                          borderRadius: 'var(--radius-full)',
                          background: topicFamilyColor(node.family),
                        }}
                      />
                      {topicFamilyLabel(node.family)}
                    </span>
                  </span>
                  {/* The card hovers to --bg-hover, where muted drops below AA. */}
                  <ArrowRight aria-hidden="true" size={14} style={{ color: 'var(--text-secondary)' }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
