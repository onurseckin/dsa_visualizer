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
    "The Shoelace formula (also known as Gauss's Area Formula) calculates the exact area of any simple non-self-intersecting 2D polygon P directly from its ordered vertices (x0, y0), (x1, y1), ..., (xn-1, yn-1). By computing signed trapezoidal cross-product contributions for each edge in a single O(N) pass, the total enclosed surface area is evaluated with exact arithmetic precision.",
  sections: [
    {
      heading: "Mathematical Formulation and Cross Product Derivation",
      body: "For a simple polygon with N vertices, the enclosed area A is given by the cross product summation formula A = 0.5 x |sum(x(i) y(i+1) - x(i+1) y(i))| where index arithmetic i+1 wraps modulo N. Each pair of vertices forms a signed triangle with origin (0, 0). Summing these signed areas causes regions outside the polygon to cancel out, leaving twice the true enclosed polygon area.",
    },
    {
      heading: "Single Pass Perimeter Traversal Architecture",
      body: "The implementation executes a single linear sweep over the ordered vertex array. At step i, vertex i pairs with vertex (i + 1) mod N, multiplying cross coordinates x(i) y(i+1) - x(i+1) y(i) and adding to a running scalar accumulator. Taking absolute value and dividing by 2 yields final area without sorting or recursion.",
    },
    {
      heading: "Winding Order and Geometric Properties",
      body: "The raw sum sign before absolute value reveals the boundary traversal winding order. Positive signed sum indicates counter-clockwise orientation in standard Cartesian coordinates. Negative sum indicates clockwise traversal, while zero sum indicates collinear vertices enclosing zero area. Winding order is crucial for backface culling in graphics rendering pipelines.",
    },
    {
      heading: "Numerical Precision and Algorithmic Considerations",
      body: "Integer coordinates yield exact area sums without floating-point rounding errors. For large coordinate values, 64-bit integers prevent intermediate multiplication overflow. Non-simple self-intersecting polygons violate Shoelace assumptions by subtracting overlapping regions rather than adding them.",
    },
  ],
  keyTerms: [
    {
      term: "Signed Area",
      definition:
        "An area value carrying a sign encoding boundary traversal direction (+ for CCW, - for CW).",
    },
    {
      term: "Shoelace Cross Product",
      definition:
        "The scalar term x(i) y(i+1) - x(i+1) y(i) representing twice the signed area of the origin triangle.",
    },
    {
      term: "Winding order",
      definition:
        "The directional orientation (clockwise or counter-clockwise) of ordered polygon boundary vertices.",
    },
  ],
};

const POLYGON_AREA_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines polygon_area function signature taking ordered 2D vertex list.",
    2: "Stores vertex count N.",
    3: "Checks if N < 3 (insufficient vertices to enclose 2D surface area).",
    4: "Returns 0.0 if fewer than 3 vertices.",
    5: "Empty line for formatting.",
    6: "Initializes area_sum scalar accumulator to 0.0.",
    7: "Loops through vertex index i from 0 to N - 1.",
    8: "Unpacks coordinates (x1, y1) of current vertex.",
    9: "Unpacks coordinates (x2, y2) of next vertex with modulo wrapping ((i + 1) % N).",
    10: "Computes 2D cross product scalar (x1 * y2) - (x2 * y1).",
    11: "Adds cross product term into running area_sum accumulator.",
    12: "Empty line separating loop from return.",
    13: "Returns final polygon area abs(area_sum) / 2.0.",
  },
};

export const polygonArea: AlgorithmDefinition<PolygonAreaInput> = {
  id: "polygon-area",
  title: "Polygon Area (Shoelace Formula)",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Medium",
  description:
    "Calculates the exact area of a simple 2D polygon $\\mathcal{P}$ from its ordered vertices using the Shoelace (Gauss) formula in $\\mathcal{O}(N)$ time:\n\n$$A = \\frac{1}{2} \\left| \\sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \\right|$$\n\n### Graph Snapshot Representation\nThe polygon vertices and perimeter edges are rendered on a 2D graph coordinate grid, with active cross-multiplied edges highlighted.\n\n### Input Parameters\n- `points` (`Point2D[]`): Array of ordered 2D polygon vertices.\n\n### Output\n- `float`: Total surface area of the enclosed polygon.\n\n### Edge Cases & Constraints\n- Base Case: $N < 3 \\implies \\text{area} = 0.0$.\n- Collinear Vertices: Yield zero enclosed area.",
  constraints: [
    "3 <= vertices.length <= 1000",
    "-1000 <= x, y <= 1000",
    "Polygon must be simple (non-self-intersecting) with vertices ordered sequentially",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "points = [(100,100), (400,100), (350,300), (150,300)]",
      outputDisplay: "45000",
      title: "Basic Example",
      input: {
        points: [
          { x: 100, y: 100, id: "P0", label: "P0 (100, 100)" },
          { x: 400, y: 100, id: "P1", label: "P1 (400, 100)" },
          { x: 350, y: 300, id: "P2", label: "P2 (350, 300)" },
          { x: 150, y: 300, id: "P3", label: "P3 (150, 300)" },
        ],
      },
      output: "45000",
      explanation: "Trapezoid area calculated via Shoelace cross-products 0.5 * |sum| = 45000.",
    },
    {
      kind: "complex",
      inputDisplay: "points = [(100,100), (300,100), (300,300), (200,200), (100,300)]",
      outputDisplay: "30000",
      title: "Complex Edge Case",
      input: {
        points: [
          { x: 100, y: 100, id: "P0", label: "P0" },
          { x: 300, y: 100, id: "P1", label: "P1" },
          { x: 300, y: 300, id: "P2", label: "P2" },
          { x: 200, y: 200, id: "P3", label: "P3" },
          { x: 100, y: 300, id: "P4", label: "P4" },
        ],
      },
      output: "30000",
      explanation:
        "Non-convex 5-vertex polygon (L-shaped with reflex vertex at P3) computed accurately.",
    },
    {
      kind: "negative",
      inputDisplay: "points = [(100,100), (200,200), (300,300)]",
      outputDisplay: "0",
      title: "Failing / Boundary Case",
      input: {
        points: [
          { x: 100, y: 100, id: "P0", label: "P0" },
          { x: 200, y: 200, id: "P1", label: "P1" },
          { x: 300, y: 300, id: "P2", label: "P2" },
        ],
      },
      output: "0",
      explanation:
        "Collinear points enclosing zero 2D surface area result in Shoelace area sum of 0.",
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
    time: "Single traversal around $N$ vertices performs $N$ cross-multiplications, running in $\\mathcal{O}(N)$ time.",
    space: "Requires $\\mathcal{O}(1)$ auxiliary space for loop scalar variables.",
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
