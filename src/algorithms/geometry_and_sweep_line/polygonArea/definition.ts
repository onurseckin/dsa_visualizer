import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { PYTHON_POLYGON_AREA_CODE } from "./pythonCode";
import { generatePolygonAreaSteps, type PolygonAreaInput } from "./stepGenerator";

export const DEFAULT_POLYGON_AREA_INPUT: PolygonAreaInput = {
  points: [
    { x: 100, y: 100, id: "P0", label: "P0 (100, 100)" },
    { x: 400, y: 100, id: "P1", label: "P1 (400, 100)" },
    { x: 350, y: 300, id: "P2", label: "P2 (350, 300)" },
    { x: 150, y: 300, id: "P3", label: "P3 (150, 300)" },
  ],
};

const POLYGON_AREA_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The shoelace formula computes the exact area of a simple polygon from nothing more than its ordered list of vertices. You walk the boundary once, cross-multiply each vertex with the next, add the results, then halve the absolute value of the total. The name comes from the picture you get writing the coordinates in two columns and multiplying diagonally, which looks like lacing a shoe; it is also known as the Gauss area formula. Beyond area it hands you the polygon's orientation for free, which makes it a small but constant workhorse in graphics, mapping and computational geometry.",
  sections: [
    {
      heading: "Signed areas that cancel",
      body: "The cleanest way to see why this works is to treat every edge as one triangle fanning out from the origin. The term x1 times y2 minus x2 times y1 is twice the signed area of the triangle spanned by the origin and that edge, positive when the edge sweeps one way around the origin and negative when it sweeps back. As you traverse the whole boundary, the parts of those triangles that stick out beyond the polygon are cancelled by the negative sweeps of later edges, leaving exactly the enclosed region behind. Sum everything and halve, and the origin, which may sit far outside the polygon, has vanished from the answer entirely.",
    },
    {
      heading: "Walking the boundary once",
      body: "The implementation is one loop over the vertices in which step i pairs vertex i with vertex i plus 1 modulo n, and that modulo is what closes the polygon by joining the last vertex back to the first. Each iteration contributes a single cross-multiplication to a running sum, and nothing else is stored, so there is no auxiliary array, no sorting and no recursion anywhere. When the loop finishes you take the absolute value, because the raw sign only reflects which way you walked, and divide by two to undo the doubling built into the parallelogram cross product. Skipping either of those two final operations is the classic way to end up off by a minus sign or a factor of two.",
    },
    {
      heading: "The two things it assumes",
      body: "The formula is exactly right for any simple polygon, convex or wildly concave, but it leans on two properties of the input. First, the vertices must arrive in boundary order, consistently clockwise or consistently counter-clockwise; a shuffled list describes a different, self-crossing shape and produces a meaningless number. Second, the outline must not intersect itself, because a self-crossing boundary sweeps some regions in opposite directions and the formula then reports their difference rather than their total. If your data might violate either assumption you have to reorder the vertices or decompose the shape before the result can be trusted.",
    },
    {
      heading: "The sign is information, not noise",
      body: "Before you take the absolute value, the sign of the sum tells you the winding order: one sign means counter-clockwise and the other clockwise, under whichever axis convention you are using. That is genuinely useful information. Mesh renderers use it for backface culling, polygon-clipping libraries use it to distinguish an outer boundary from a hole, and geometry code uses it to normalize incoming shapes to a single orientation. It also detects degeneracy: a sum of exactly zero means the vertices are collinear or the traversal folds back on itself and encloses nothing. Because screen coordinates put y increasing downward, the convention inverts there, so never hardcode which sign means counter-clockwise without checking your axes.",
    },
    {
      heading: "Numerical and practical pitfalls",
      body: "With integer coordinates the sum is exact, so a common trick is to keep twice the area as an integer and divide only at the very end, or never divide at all when you are merely comparing areas. With floating-point coordinates, subtracting two similar products loses precision on long thin polygons, and coordinates far from the origin make that worse, so translating every vertex so the first one sits at the origin measurably improves accuracy. Watch for overflow as well, since products of large coordinates can exceed a 32-bit integer even when the resulting area is modest. And a polygon needs at least three vertices, so anything smaller should return zero rather than run the loop.",
    },
    {
      heading: "The same cross product elsewhere",
      body: "The per-edge term used here is precisely the orientation primitive that tests whether three points turn left or right, which is the engine behind convex-hull sweeps and segment-intersection tests. Weight each edge's contribution by its endpoint coordinates instead of summing plainly and the same single pass yields the polygon's centroid. The same signed accumulation, taken around a query point rather than the origin, becomes a winding-number test for whether that point lies inside the polygon. And for polygons whose vertices land on integer grid points, pairing this area with Pick's theorem relates it to the count of interior and boundary lattice points, tying the formula back to combinatorics.",
    },
  ],
  keyTerms: [
    {
      term: "Signed area",
      definition:
        "An area that carries a sign encoding the direction of traversal. Summing signed pieces is exactly what allows contributions outside the polygon to cancel out.",
    },
    {
      term: "Cross-product term",
      definition:
        "The quantity x1 times y2 minus x2 times y1 for one edge. It equals twice the signed area of the triangle spanned by the origin and that edge.",
    },
    {
      term: "Simple polygon",
      definition:
        "A polygon whose edges meet only at shared endpoints and never cross. The shoelace formula is only guaranteed correct for simple polygons.",
    },
    {
      term: "Winding order",
      definition:
        "Whether the vertex list traverses the boundary clockwise or counter-clockwise. It is revealed by the sign of the shoelace sum before the absolute value is taken.",
    },
    {
      term: "Centroid",
      definition:
        "The area-weighted average position of a polygon, its balance point. It falls out of the same single boundary pass by weighting each cross-product term with the edge endpoints.",
    },
  ],
};

const POLYGON_AREA_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the function signature: takes ordered polygon vertices and returns a float area.",
    3: "Documents that this implements the Shoelace formula for a simple, non-self-intersecting polygon.",
    4: "Documents the expected input shape: an ordered list of (x, y) vertex tuples walking the boundary.",
    6: "Caches the vertex count, needed both for the validity check and for wrapping the index in the main loop.",
    7: "A polygon needs at least three vertices to enclose any region.",
    8: "With fewer than three vertices there is no enclosed area, so we return zero immediately.",
    10: "Initializes the running total that will accumulate each edge's signed cross-product term.",
    11: "Walks every edge of the polygon exactly once.",
    12: "Unpacks the current vertex's coordinates.",
    13: "Unpacks the next vertex's coordinates, wrapping around to vertex 0 after the last one so the polygon closes.",
    14: "Computes this edge's signed contribution — twice the signed area of the triangle it forms with the origin — so terms outside the polygon cancel and terms inside it add up.",
    15: "Folds this edge's term into the running total.",
    17: "The sign only reflected which way we walked the boundary, so taking the absolute value and halving (undoing the doubled cross product) yields the true enclosed area.",
  },
};

export const polygonArea: AlgorithmDefinition<PolygonAreaInput> = {
  id: "polygon-area",
  title: "Polygon Area (Shoelace Formula)",
  category: "geometry_and_sweep_line",
  difficulty: "Medium",
  description:
    "Calculates the area of a simple (non-self-intersecting) polygon from its ordered vertices using the Shoelace formula, also known as the Gauss area formula. Walking the perimeter once, it cross-multiplies each pair of adjacent vertices and sums the signed trapezoid areas, so the whole computation is a single O(N) pass.",
  constraints: [
    "3 <= vertices.length <= 1000",
    "-1000 <= x, y <= 1000",
    "Polygon must be simple (non-self-intersecting) with vertices ordered sequentially",
  ],
  examples: [
    {
      input: "points = [(100,100), (400,100), (350,300), (150,300)]",
      output: "45000",
      explanation:
        "Trapezoid area calculated via 0.5 * |(100*100 - 400*100) + (400*300 - 350*100) + (350*300 - 150*300) + (150*100 - 100*300)| = 45000.",
    },
  ],
  code: PYTHON_POLYGON_AREA_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "We make exactly one pass around the polygon: each of the n edges contributes one cross-multiplication and one addition to the running sum. There is no branching, sorting, or backtracking, so best and worst case are the same single loop — O(n).",
    space:
      "Beyond the input vertices we only keep a running sum and a couple of loop variables, so extra memory stays constant — O(1).",
  },
  topicGuide: POLYGON_AREA_TOPIC_GUIDE,
  trivia: POLYGON_AREA_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 29",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 29,
      section: "29.3 Polygon area",
    },
  ],
  defaultInput: DEFAULT_POLYGON_AREA_INPUT,
  generateSteps: generatePolygonAreaSteps,
};

export default polygonArea;
