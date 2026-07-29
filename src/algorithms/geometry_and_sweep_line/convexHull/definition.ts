import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { PYTHON_CONVEX_HULL_CODE } from "./pythonCode";
import { generateConvexHullSteps, type ConvexHullInput } from "./stepGenerator";

export const DEFAULT_CONVEX_HULL_INPUT: ConvexHullInput = {
  points: [
    { x: 100, y: 300, id: "P0", label: "P0" },
    { x: 150, y: 150, id: "P1", label: "P1" },
    { x: 250, y: 100, id: "P2", label: "P2" },
    { x: 300, y: 250, id: "P3", label: "P3" },
    { x: 400, y: 350, id: "P4", label: "P4" },
    { x: 200, y: 400, id: "P5", label: "P5" },
    { x: 350, y: 180, id: "P6", label: "P6" },
  ],
};

const CONVEX_HULL_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The convex hull of a set of 2D points <code>S &subset; &mathbb;R&sup2;</code> is the minimal convex polygon containing all points in <code>S</code> &mdash; visually corresponding to the shape formed by stretching a rubber band around pins set at each point. Andrew's Monotone Chain algorithm computes the convex hull in <code>O(N log N)</code> time by sorting points lexicographically and executing two directional stack-based sweeps.</p>",
  sections: [
    {
      heading: "1. Cross Product Orientation Test (Turn Primitive)",
      body: "<p>Convexity depends entirely on local turn directions. For three ordered 2D points <code>o, a, b</code>, the 2D cross product scalar represents the signed area of the parallelogram spanned by vectors <code>a - o</code> and <code>b - o</code>. Positive cross product value indicates a counter-clockwise left turn. Negative cross product value indicates a clockwise right turn, while zero means collinear points.</p>",
    },
    {
      heading: "2. Monotone Chain Sweeping Architecture",
      body: "<p>The hull is split into two monotonic chains at the extreme leftmost P<sub>min</sub> and rightmost P<sub>max</sub> points. Lower Chain is formed by a left-to-right sweep across points sorted lexicographically by x and y coordinates. Upper Chain is formed by a right-to-left sweep across the same sorted sequence. Both passes maintain a stack of active hull vertices while popping middle points that fail left turn tests.</p>",
    },
    {
      heading: "3. Amortized Complexity and Correctness Proof",
      body: "<p>Every point is pushed onto a stack exactly once per sweep and popped at most once ever. The total work performed across both sweeps is <code>O(N)</code> amortized. Sorting <code>N</code> points initially dominates the total time, yielding <code>O(N log N)</code> overall runtime. Auxiliary memory required for the sorted array and lower and upper hull stacks is <code>O(N)</code>.</p>",
    },
    {
      heading: "4. Downstream Geometric Applications",
      body: "<p>Computing the convex hull is a standard pre-processing step for major computational geometry algorithms. Rotating Calipers computes polygon diameter, minimum bounding boxes, and maximum distance pairs in <code>O(N)</code> time. Collision detection algorithms rely on convex hulls for rapid GJK polygon intersection queries.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Convex Polygon",
      definition:
        "A polygon where the line segment connecting any two internal points lies entirely within the polygon boundary.",
    },
    {
      term: "Cross Product Orientation Test",
      definition:
        "The scalar formula cross(o, a, b) = (a.x - o.x)(b.y - o.y) - (a.y - o.y)(b.x - o.x) determining turn direction.",
    },
    {
      term: "Lower and upper chain",
      definition:
        "The two halves of the convex hull boundary split by the extreme x-coordinate endpoints.",
    },
  ],
};

const CONVEX_HULL_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines convex_hull function signature taking list of 2D coordinate tuples.",
    2: "Stores total point count N.",
    3: "Checks base case N <= 3.",
    4: "Returns input points directly if N <= 3 (trivially convex).",
    5: "Empty line for formatting.",
    6: "Sorts points lexicographically by x-coordinate, breaking ties by y-coordinate.",
    7: "Empty line separating sort from helper function.",
    8: "Defines 2D cross product helper function cross(o, a, b).",
    9: "Returns signed cross product scalar: (a.x - o.x)*(b.y - o.y) - (a.y - o.y)*(b.x - o.x).",
    10: "Empty line for formatting.",
    11: "Initializes lower hull stack.",
    12: "Iterates left-to-right through sorted points.",
    13: "Pops points while last two kept points and new point fail to make a strict left turn (cross <= 0).",
    14: "Discards middle point from lower hull stack.",
    15: "Pushes current point onto lower hull stack.",
    16: "Empty line separating lower and upper sweeps.",
    17: "Initializes upper hull stack.",
    18: "Iterates right-to-left through reversed sorted points.",
    19: "Pops points while last two kept points and new point fail to make a strict left turn (cross <= 0).",
    20: "Discards middle point from upper hull stack.",
    21: "Pushes current point onto upper hull stack.",
    22: "Empty line before concatenation.",
    23: "Drops duplicate endpoint from lower hull stack.",
    24: "Drops duplicate endpoint from upper hull stack.",
    25: "Returns concatenated lower + upper hull vertices in counter-clockwise boundary order.",
  },
};

export const convexHull: AlgorithmDefinition<ConvexHullInput> = {
  id: "convex-hull",
  title: "Convex Hull (Monotone Chain)",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "<p>Finds the minimal convex polygon enclosing a set of 2D points <code>S &subset; &mathbb;R&sup2;</code> using Andrew's Monotone Chain algorithm in <code>O(N log N)</code> time.</p><p><code>cross(o, a, b) = (a.x - o.x)(b.y - o.y) - (a.y - o.y)(b.x - o.x)</code></p><h3>Graph Snapshot Representation</h3><p>The point set and active hull boundary are rendered on a 2D graph coordinate plane, with active hull edges highlighted.</p><h3>Input Parameters</h3><ul><li><code>points</code> (<code>Point2D[]</code>): Array of 2D points with <code>x, y</code> coordinates.</li></ul><h3>Output</h3><ul><li><code>Point2D[]</code>: Vertices of the convex hull in counter-clockwise boundary order.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li>Base Case: <code>N &le; 3 &rArr;</code> return points directly.</li><li>Collinear Points: Non-extremal points on edges are discarded by <code>cross &le; 0</code>.</li></ul>",
  constraints: ["1 <= points.length <= 1000", "-1000 <= x, y <= 1000"],
  examples: [
    {
      kind: "basic",
      inputDisplay:
        "points = [(100,300), (150,150), (250,100), (300,250), (400,350), (200,400), (350,180)]",
      outputDisplay: "6 hull vertices",
      title: "Basic Example",
      input: {
        points: [
          { x: 100, y: 300, id: "P0", label: "P0" },
          { x: 150, y: 150, id: "P1", label: "P1" },
          { x: 250, y: 100, id: "P2", label: "P2" },
          { x: 300, y: 250, id: "P3", label: "P3" },
          { x: 400, y: 350, id: "P4", label: "P4" },
          { x: 200, y: 400, id: "P5", label: "P5" },
          { x: 350, y: 180, id: "P6", label: "P6" },
        ],
      },
      output: "6 hull vertices",
      explanation:
        "Andrew's monotone chain sweeps upper and lower chains, enclosing interior point P3 (300, 250).",
    },
    {
      kind: "complex",
      inputDisplay: "points = [(50,50), (150,50), (250,50), (350,50), (200,250), (200,150)]",
      outputDisplay: "3 hull vertices",
      title: "Complex Edge Case",
      input: {
        points: [
          { x: 50, y: 50, id: "P0", label: "P0" },
          { x: 150, y: 50, id: "P1", label: "P1" },
          { x: 250, y: 50, id: "P2", label: "P2" },
          { x: 350, y: 50, id: "P3", label: "P3" },
          { x: 200, y: 250, id: "P4", label: "P4" },
          { x: 200, y: 150, id: "P5", label: "P5" },
        ],
      },
      output: "3 hull vertices",
      explanation:
        "Pops non-extremal collinear points along the bottom edge, maintaining a strictly convex triangle boundary.",
    },
    {
      kind: "negative",
      inputDisplay: "points = [(100,100), (200,200)]",
      outputDisplay: "2 points (line segment)",
      title: "Failing / Boundary Case",
      input: {
        points: [
          { x: 100, y: 100, id: "P0", label: "P0" },
          { x: 200, y: 200, id: "P1", label: "P1" },
        ],
      },
      output: "2 points (line segment)",
      explanation:
        "Boundary input with fewer than 3 points cannot form a 2D enclosed polygon; returns the 2 points directly.",
    },
  ],
  code: PYTHON_CONVEX_HULL_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting points lexicographically takes $\\mathcal{O}(N \\log N)$ comparisons. Both sweeps take $\\mathcal{O}(N)$ amortized time, making total time $\\mathcal{O}(N \\log N)$.",
    space:
      "Requires $\\mathcal{O}(N)$ auxiliary memory for the sorted array and lower/upper hull stacks.",
  },
  topicGuide: CONVEX_HULL_TOPIC_GUIDE,
  trivia: CONVEX_HULL_TRIVIA,
  leetcode: {
    id: 587,
    url: "https://leetcode.com/problems/erect-the-fence/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #587",
      leetcodeId: 587,
      url: "https://leetcode.com/problems/erect-the-fence/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 30",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 30,
      section: "30.3 Convex hull problem",
    },
  ],
  defaultInput: DEFAULT_CONVEX_HULL_INPUT,
  generateSteps: generateConvexHullSteps,
};

export default convexHull;
