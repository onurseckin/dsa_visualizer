import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from '../../types/dsa';

export interface Point2D {
  x: number;
  y: number;
  id?: string;
  label?: string;
}

export interface PolygonAreaInput {
  points: Point2D[];
}

export const PYTHON_POLYGON_AREA_CODE = `def polygon_area(vertices: list[tuple[float, float]]) -> float:
    """
    Calculate the area of a non-self-intersecting polygon using the Shoelace formula.
    vertices: list of (x, y) coordinate tuples in ordered traversal.
    """
    n = len(vertices)
    if n < 3:
        return 0.0

    area_sum = 0.0
    for i in range(n):
        x1, y1 = vertices[i]
        x2, y2 = vertices[(i + 1) % n]
        cross_product = (x1 * y2) - (x2 * y1)
        area_sum += cross_product

    return abs(area_sum) / 2.0`;

export const DEFAULT_POLYGON_AREA_INPUT: PolygonAreaInput = {
  points: [
    { x: 100, y: 100, id: 'P0', label: 'P0 (100, 100)' },
    { x: 400, y: 100, id: 'P1', label: 'P1 (400, 100)' },
    { x: 350, y: 300, id: 'P2', label: 'P2 (350, 300)' },
    { x: 150, y: 300, id: 'P3', label: 'P3 (150, 300)' },
  ],
};

export const generatePolygonAreaSteps = (input: PolygonAreaInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const points = input.points;
  const n = points.length;

  const getBaseNodes = (activeIdx?: number, compareIdx?: number): GraphNodeItem[] => {
    return points.map((pt, index) => {
      const id = pt.id ?? `P${index}`;
      const label = pt.label ?? `P${index} (${pt.x}, ${pt.y})`;
      let state: ElementState = 'default';
      if (index === activeIdx) {
        state = 'active';
      } else if (index === compareIdx) {
        state = 'compare';
      }
      return {
        id,
        label,
        x: pt.x,
        y: pt.y,
        state,
        val: index,
      };
    });
  };

  const getBaseEdges = (activeEdgeIdx?: number): GraphEdgeItem[] => {
    if (n < 2) return [];
    const edges: GraphEdgeItem[] = [];
    for (let i = 0; i < n; i++) {
      const fromId = points[i].id ?? `P${i}`;
      const toId = points[(i + 1) % n].id ?? `P${(i + 1) % n}`;
      edges.push({
        from: fromId,
        to: toId,
        isTraversed: activeEdgeIdx === i,
        isPath: activeEdgeIdx !== undefined && i < activeEdgeIdx,
      });
    }
    return edges;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    nodes: GraphNodeItem[],
    edges: GraphEdgeItem[],
    auxMap: Record<string, string>,
    terms: string[],
    vars: Record<string, string | number | boolean>
  ) => {
    const primarySnapshot: GraphVisualSnapshot = {
      kind: 'graph',
      nodes,
      edges,
    };

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot,
      auxiliaryState: {
        visited: [...terms],
        hashMap: auxMap,
        customState: {
          vertexCount: n,
          ...vars,
        },
      },
      variables: vars,
    });
  };

  // Line 1: Start algorithm
  addStep(
    1,
    'Initialize Shoelace Algorithm',
    `Calculate area of polygon with ${n} vertices using the Shoelace (Gauss Area) formula.`,
    getBaseNodes(),
    getBaseEdges(),
    { Formula: 'Area = 0.5 * |sum(x_i * y_{i+1} - x_{i+1} * y_i)|' },
    [],
    { n }
  );

  // Line 3: Check vertex count
  if (n < 3) {
    addStep(
      4,
      'Insufficient vertices',
      `A polygon requires at least 3 vertices to enclose an area. Return area = 0.0.`,
      getBaseNodes(),
      getBaseEdges(),
      { Status: 'Invalid polygon (n < 3)' },
      [],
      { n, area: 0.0 }
    );
    return steps;
  }

  let areaSum = 0;
  const terms: string[] = [];

  // Line 5: Initialize area_sum
  addStep(
    5,
    'Initialize accumulators',
    'Set area_sum = 0.0 before iterating over polygon edges.',
    getBaseNodes(),
    getBaseEdges(),
    { area_sum: '0.0' },
    [],
    { area_sum: 0.0 }
  );

  for (let i = 0; i < n; i++) {
    const nextIdx = (i + 1) % n;
    const p1 = points[i];
    const p2 = points[nextIdx];

    const crossProduct = p1.x * p2.y - p2.x * p1.y;
    areaSum += crossProduct;

    const termStr = `(${p1.x} * ${p2.y}) - (${p2.x} * ${p1.y}) = ${crossProduct}`;
    terms.push(`Edge ${i}->${nextIdx}: ${termStr}`);

    const nodes = getBaseNodes(i, nextIdx);
    const edges = getBaseEdges(i);

    // Line 9: Cross product computation
    addStep(
      9,
      `Compute cross product for edge P${i} -> P${nextIdx}`,
      `x1*y2 - x2*y1 = (${p1.x} * ${p2.y}) - (${p2.x} * ${p1.y}) = ${crossProduct}.`,
      nodes,
      edges,
      {
        'Edge Processed': `P${i} (${p1.x},${p1.y}) -> P${nextIdx} (${p2.x},${p2.y})`,
        'Cross Product': `${crossProduct}`,
        'Current area_sum': `${areaSum}`,
      },
      terms,
      {
        i,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        cross_product: crossProduct,
        area_sum: areaSum,
      }
    );
  }

  const finalArea = Math.abs(areaSum) / 2.0;

  // Final all nodes and edges highlighted
  const finalNodes = points.map((pt, idx) => ({
    id: pt.id ?? `P${idx}`,
    label: pt.label ?? `P${idx}`,
    x: pt.x,
    y: pt.y,
    state: 'sorted' as ElementState,
    val: idx,
  }));

  const finalEdges = points.map((pt, idx) => ({
    from: pt.id ?? `P${idx}`,
    to: points[(idx + 1) % n].id ?? `P${(idx + 1) % n}`,
    isPath: true,
  }));

  // Line 11: Return final area
  addStep(
    11,
    'Shoelace Formula Complete',
    `Final polygon area = abs(${areaSum}) / 2.0 = ${finalArea}.`,
    finalNodes,
    finalEdges,
    {
      'Total Sum': `${areaSum}`,
      'Abs Sum': `${Math.abs(areaSum)}`,
      'Final Area': `${finalArea}`,
    },
    terms,
    {
      area_sum: areaSum,
      final_area: finalArea,
    }
  );

  return steps;
};

export const polygonArea: AlgorithmDefinition<PolygonAreaInput> = {
  id: 'polygon-area',
  title: 'Polygon Area (Shoelace Formula)',
  category: 'math_and_geometry',
  difficulty: 'Medium',
  description:
    'Calculates the area of a simple polygon given its ordered vertices in a 2D plane using the Shoelace algorithm (Gauss area formula).',
  code: PYTHON_POLYGON_AREA_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(1)',
  defaultInput: DEFAULT_POLYGON_AREA_INPUT,
  generateSteps: generatePolygonAreaSteps,
};
