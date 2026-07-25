import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
  TopicGuide,
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

  // Line 6: Check vertex count
  addStep(
    6,
    'Start the shoelace formula',
    `We'll walk the ${n} vertices in order, cross-multiplying each edge's coordinates; the criss-cross pattern of those products is where the "shoelace" name comes from.`,
    getBaseNodes(),
    getBaseEdges(),
    { Formula: 'Area = 0.5 * |sum(x_i * y_{i+1} - x_{i+1} * y_i)|' },
    [],
    { n }
  );

  // Line 7: Check if n < 3
  if (n < 3) {
    addStep(
      8,
      'Stop — too few vertices',
      `A polygon needs at least 3 vertices to enclose any region, and we only have ${n}, so the area is simply 0.`,
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

  // Line 10: Initialize area_sum
  addStep(
    10,
    'Set the running sum to zero',
    'Each edge will add its signed cross product here; positive and negative terms partly cancel, and what survives is exactly twice the enclosed area.',
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

    // Line 14: Cross product computation
    addStep(
      14,
      `Cross-multiply edge P${i} -> P${nextIdx}`,
      `This edge sweeps out a signed trapezoid against the axis worth (${p1.x} * ${p2.y}) - (${p2.x} * ${p1.y}) = ${crossProduct}, bringing our running sum to ${areaSum}.`,
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

  // Line 17: Return final area
  addStep(
    17,
    `Halve the sum: area = ${finalArea}`,
    `Every edge has been folded in, so the total ${areaSum} is twice the signed area; taking the absolute value and dividing by 2 gives ${finalArea}. One trip around the boundary was all it took — O(n).`,
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

const POLYGON_AREA_TOPIC_GUIDE: TopicGuide = {
  overview:
    'The shoelace formula computes the exact area of a simple polygon from nothing more than its ordered list of vertices. You walk the boundary once, cross-multiply each vertex with the next, add the results, then halve the absolute value of the total. The name comes from the picture you get writing the coordinates in two columns and multiplying diagonally, which looks like lacing a shoe; it is also known as the Gauss area formula. Beyond area it hands you the polygon\'s orientation for free, which makes it a small but constant workhorse in graphics, mapping and computational geometry.',
  sections: [
    {
      heading: 'Signed areas that cancel',
      body: 'The cleanest way to see why this works is to treat every edge as one triangle fanning out from the origin. The term x1 times y2 minus x2 times y1 is twice the signed area of the triangle spanned by the origin and that edge, positive when the edge sweeps one way around the origin and negative when it sweeps back. As you traverse the whole boundary, the parts of those triangles that stick out beyond the polygon are cancelled by the negative sweeps of later edges, leaving exactly the enclosed region behind. Sum everything and halve, and the origin, which may sit far outside the polygon, has vanished from the answer entirely.',
    },
    {
      heading: 'Walking the boundary once',
      body: 'The implementation is one loop over the vertices in which step i pairs vertex i with vertex i plus 1 modulo n, and that modulo is what closes the polygon by joining the last vertex back to the first. Each iteration contributes a single cross-multiplication to a running sum, and nothing else is stored, so there is no auxiliary array, no sorting and no recursion anywhere. When the loop finishes you take the absolute value, because the raw sign only reflects which way you walked, and divide by two to undo the doubling built into the parallelogram cross product. Skipping either of those two final operations is the classic way to end up off by a minus sign or a factor of two.',
    },
    {
      heading: 'The two things it assumes',
      body: 'The formula is exactly right for any simple polygon, convex or wildly concave, but it leans on two properties of the input. First, the vertices must arrive in boundary order, consistently clockwise or consistently counter-clockwise; a shuffled list describes a different, self-crossing shape and produces a meaningless number. Second, the outline must not intersect itself, because a self-crossing boundary sweeps some regions in opposite directions and the formula then reports their difference rather than their total. If your data might violate either assumption you have to reorder the vertices or decompose the shape before the result can be trusted.',
    },
    {
      heading: 'The sign is information, not noise',
      body: 'Before you take the absolute value, the sign of the sum tells you the winding order: one sign means counter-clockwise and the other clockwise, under whichever axis convention you are using. That is genuinely useful information. Mesh renderers use it for backface culling, polygon-clipping libraries use it to distinguish an outer boundary from a hole, and geometry code uses it to normalize incoming shapes to a single orientation. It also detects degeneracy: a sum of exactly zero means the vertices are collinear or the traversal folds back on itself and encloses nothing. Because screen coordinates put y increasing downward, the convention inverts there, so never hardcode which sign means counter-clockwise without checking your axes.',
    },
    {
      heading: 'Numerical and practical pitfalls',
      body: 'With integer coordinates the sum is exact, so a common trick is to keep twice the area as an integer and divide only at the very end, or never divide at all when you are merely comparing areas. With floating-point coordinates, subtracting two similar products loses precision on long thin polygons, and coordinates far from the origin make that worse, so translating every vertex so the first one sits at the origin measurably improves accuracy. Watch for overflow as well, since products of large coordinates can exceed a 32-bit integer even when the resulting area is modest. And a polygon needs at least three vertices, so anything smaller should return zero rather than run the loop.',
    },
    {
      heading: 'The same cross product elsewhere',
      body: 'The per-edge term used here is precisely the orientation primitive that tests whether three points turn left or right, which is the engine behind convex-hull sweeps and segment-intersection tests. Weight each edge\'s contribution by its endpoint coordinates instead of summing plainly and the same single pass yields the polygon\'s centroid. The same signed accumulation, taken around a query point rather than the origin, becomes a winding-number test for whether that point lies inside the polygon. And for polygons whose vertices land on integer grid points, pairing this area with Pick\'s theorem relates it to the count of interior and boundary lattice points, tying the formula back to combinatorics.',
    },
  ],
  keyTerms: [
    {
      term: 'Signed area',
      definition:
        'An area that carries a sign encoding the direction of traversal. Summing signed pieces is exactly what allows contributions outside the polygon to cancel out.',
    },
    {
      term: 'Cross-product term',
      definition:
        'The quantity x1 times y2 minus x2 times y1 for one edge. It equals twice the signed area of the triangle spanned by the origin and that edge.',
    },
    {
      term: 'Simple polygon',
      definition:
        'A polygon whose edges meet only at shared endpoints and never cross. The shoelace formula is only guaranteed correct for simple polygons.',
    },
    {
      term: 'Winding order',
      definition:
        'Whether the vertex list traverses the boundary clockwise or counter-clockwise. It is revealed by the sign of the shoelace sum before the absolute value is taken.',
    },
    {
      term: 'Centroid',
      definition:
        'The area-weighted average position of a polygon, its balance point. It falls out of the same single boundary pass by weighting each cross-product term with the edge endpoints.',
    },
  ],
};

export const polygonArea: AlgorithmDefinition<PolygonAreaInput> = {
  id: 'polygon-area',
  title: 'Polygon Area (Shoelace Formula)',
  category: 'geometry_and_sweep_line',
  difficulty: 'Medium',
  description:
    'Calculates the area of a simple (non-self-intersecting) polygon from its ordered vertices using the Shoelace formula, also known as the Gauss area formula. Walking the perimeter once, it cross-multiplies each pair of adjacent vertices and sums the signed trapezoid areas, so the whole computation is a single O(N) pass.',
  constraints: [
    '3 <= vertices.length <= 1000',
    '-1000 <= x, y <= 1000',
    'Polygon must be simple (non-self-intersecting) with vertices ordered sequentially',
  ],
  examples: [
    {
      input: 'points = [(100,100), (400,100), (350,300), (150,300)]',
      output: '45000',
      explanation: 'Trapezoid area calculated via 0.5 * |(100*100 - 400*100) + (400*300 - 350*100) + (350*300 - 150*300) + (150*100 - 100*300)| = 45000.',
    },
  ],
  code: PYTHON_POLYGON_AREA_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(1)',
  complexityAnalysis: {
    time: 'We make exactly one pass around the polygon: each of the n edges contributes one cross-multiplication and one addition to the running sum. There is no branching, sorting, or backtracking, so best and worst case are the same single loop — O(n).',
    space: 'Beyond the input vertices we only keep a running sum and a couple of loop variables, so extra memory stays constant — O(1).',
  },
  topicGuide: POLYGON_AREA_TOPIC_GUIDE,
  defaultInput: DEFAULT_POLYGON_AREA_INPUT,
  generateSteps: generatePolygonAreaSteps,
};
