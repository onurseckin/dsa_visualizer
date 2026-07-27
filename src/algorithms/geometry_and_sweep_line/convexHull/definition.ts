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
    "The convex hull of a set of points is the smallest convex polygon containing all of them, the shape you would get by stretching a rubber band around a scatter of nails and letting it snap tight. Andrew's monotone chain finds it by sorting the points once by x coordinate and then sweeping across them twice, holding a stack of candidate corners and discarding any point that would bend the boundary inward. It is the standard opening move for a wide range of geometric work, because the hull captures the extremal shape of a point set and throws away everything hidden inside it.",
  sections: [
    {
      heading: "Turning geometry into a stack problem",
      body: "Convexity has a purely local characterization: a polygon traversed in one consistent direction is convex exactly when every consecutive triple of vertices turns the same way. That means you never have to reason about the whole shape at once, only about the last two points you kept and the new one in front of you. Sorting by x makes that local check trustworthy, because processing points in a fixed direction guarantees a kept point can only be invalidated by points still ahead, never by ones already behind. So the algorithm collapses into a simple loop: walk the sorted points, and while the last two survivors plus the new point fail the turn test, throw the middle one away.",
    },
    {
      heading: "The cross product is the turn test",
      body: "For three points o, a and b, the expression (a.x - o.x)(b.y - o.y) - (a.y - o.y)(b.x - o.x) is the signed area of the parallelogram they span. Its sign is all you need: one sign means the path from o through a to b turns one way, the other sign means it turns the other, and zero means the three points are collinear. There are no angles, no square roots and no trigonometry anywhere, and on integer coordinates the value is computed exactly. That exactness is why the implementation contains no floating-point comparisons at all, and why it stays robust where an angle-sorting approach would wobble on near-degenerate input.",
    },
    {
      heading: "Two chains make a hull",
      body: "A single left-to-right sweep cannot produce the whole boundary, because the boundary doubles back on itself: the hull consists of a lower chain running from the leftmost point to the rightmost and an upper chain returning along the top. So you sweep the sorted points forward to build the lower chain, then sweep them in reverse with identical logic to build the upper chain. Both chains start and end at the same two extreme points, so each drops its final point before the two are concatenated, otherwise the leftmost and rightmost vertices would appear twice. The concatenation already comes out in boundary order, which is why the result can be handed straight to an area, perimeter or rendering routine.",
    },
    {
      heading: "Why it is correct and why it is fast",
      body: "The stack invariant is that the points currently held always form a chain whose every consecutive triple turns the correct way, that is, a convex chain. Appending a new point can only violate the invariant at the top of the stack, and popping repairs it, so the invariant survives every single iteration. A discarded point is genuinely not a hull vertex, because it lies on or inside the triangle formed by its two neighbours and the new point, and a point inside such a triangle can never be a corner of the enclosing polygon. The cost argument is amortized rather than per-step: each point is pushed exactly once and popped at most once ever, so both sweeps are linear and the initial sort is the only expensive part.",
    },
    {
      heading: "Degenerate inputs to think about",
      body: "With fewer than three points there is no polygon to build, and implementations usually just return the input unchanged. Duplicate points and runs of collinear points are where implementations quietly disagree: a strict comparison keeps collinear points sitting on hull edges, while treating a zero cross product as a failure removes them and returns only true corners. Decide deliberately which behaviour you want, because downstream code often cares; an area computation is indifferent, but a vertex count or a rotating-calipers pass may not be. Watch out for screen coordinates too, where y grows downward and therefore inverts the meaning of a left turn, so the algorithm still works but the labels lower and upper trade places.",
    },
    {
      heading: "What the hull unlocks",
      body: "Convex hulls are rarely the final answer; they are the reduction step that makes the real question easy. The diameter of a point set, its minimum-width strip, and the smallest enclosing rectangle all have their answers on the hull, and rotating calipers extracts them in linear time once the hull exists. Hulls also decide whether two point sets can be separated by a straight line, drive collision detection between shapes, and give the geometric picture of a linear program feasible region. The very same orientation primitive that powers this sweep also underlies segment-intersection tests, polygon area and point-in-polygon queries, so the effort you spend understanding it here pays off across the whole geometry toolkit.",
    },
  ],
  keyTerms: [
    {
      term: "Convex",
      definition:
        "A shape is convex when the straight segment between any two of its points stays entirely inside it. Equivalently, walking its boundary you always turn in the same direction.",
    },
    {
      term: "Cross product (orientation test)",
      definition:
        "A single arithmetic expression whose sign tells you whether three points turn left, turn right, or lie on one line. It is the only geometric primitive this algorithm needs.",
    },
    {
      term: "Lower and upper chain",
      definition:
        "The two halves of the hull boundary, split at the leftmost and rightmost points. Monotone chain builds them with the same code run forwards and then backwards.",
    },
    {
      term: "Collinear degeneracy",
      definition:
        "Three or more points lying on a single line, which makes the cross product exactly zero. Whether those points stay on the hull is a deliberate choice encoded in the comparison operator.",
    },
    {
      term: "Amortized cost",
      definition:
        "Reasoning about total work across a whole run rather than the worst single step. Here a point can be popped only once ever, so the inner loop is cheap overall even when one iteration pops many points.",
    },
  ],
};

const CONVEX_HULL_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the function signature: it takes a list of 2D points and returns the hull's vertices in boundary order.",
    3: "Documents that this implements Andrew's Monotone Chain algorithm for finding the convex hull.",
    5: "Caches the point count to decide whether any hull-building is even needed.",
    6: "With three or fewer points every point is trivially already on (or defines) the hull, so there is nothing to eliminate.",
    7: "Short-circuits with the input unchanged when a hull computation would do no useful work.",
    9: "Sorts points left to right, breaking ties by y, so the lower and upper boundaries can each be built with one directional sweep.",
    11: "Defines the orientation test used to decide whether three points turn clockwise, counter-clockwise, or lie on one line.",
    12: "Computes the signed cross product of vectors o→a and o→b; its sign alone reveals the turn direction, with no trigonometry or floating-point angles needed.",
    14: "Starts an empty stack that will hold the lower boundary of the hull.",
    15: "Sweeps left to right through the sorted points to build the lower chain.",
    16: "Keeps popping while the last two kept points plus the new one fail to turn left — a non-left turn would dent the boundary inward.",
    17: "Discards the middle point of that triple, since a point that dents the boundary inward can't be a true hull vertex.",
    18: "Accepts the current point as a (provisional) corner of the lower chain.",
    20: "Starts a second empty stack, this time for the upper boundary.",
    21: "Sweeps back right to left so the identical turn logic traces the top of the hull.",
    22: "Applies the same non-left-turn check, now on the reverse sweep.",
    23: "Removes points that would dent the upper boundary inward.",
    24: "Keeps the current point as a candidate corner of the upper chain.",
    26: "Drops the lower chain's last point, which duplicates the upper chain's starting point (the rightmost point).",
    27: "Drops the upper chain's last point for the same reason, avoiding a duplicated leftmost point.",
    28: "Concatenates the two chains — already in boundary order — into the final hull polygon.",
  },
};

export const convexHull: AlgorithmDefinition<ConvexHullInput> = {
  id: "convex-hull",
  title: "Convex Hull (Monotone Chain)",
  category: "geometry_and_sweep_line",
  difficulty: "Hard",
  description:
    "Finds the smallest convex polygon enclosing a set of 2D points using Andrew's Monotone Chain algorithm. After sorting the points by x (then y), it sweeps once left-to-right to build the lower boundary and once right-to-left for the upper, using cross-product turn tests to discard any point that would bend the boundary inward.",
  constraints: ["1 <= points.length <= 1000", "-1000 <= x, y <= 1000"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "points = [(100,300), (150,150), (250,100), (300,250), (400,350), (200,400), (350,180)]",
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
    time: "The dominant cost is sorting the points by x (then y), which takes O(N log N) comparisons. The two hull-building sweeps afterward are linear: each point is pushed onto a stack exactly once and can be popped at most once, so both passes together cost O(N). That leaves the sort as the bottleneck, making the whole algorithm O(N log N) in every case.",
    space:
      "The sorted copy of the points and the two hull stacks each hold at most all N points, so extra memory grows linearly — O(N).",
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
