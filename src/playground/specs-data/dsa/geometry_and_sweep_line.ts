import { cases, defineDsaExecution, input } from "./helpers";

export const geometryAndSweepLineExecutions = [
  defineDsaExecution({
    id: "convex-hull",
    entrypoint: "convex_hull",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Triangle remains unchanged",
        input: [
          [0, 0],
          [2, 0],
          [1, 2],
        ],
        expected: [
          [0, 0],
          [2, 0],
          [1, 2],
        ],
      },
      { label: "No points", input: [], expected: [] },
      {
        label: "Interior and collinear points removed",
        input: [
          [0, 0],
          [1, 1],
          [2, 0],
          [2, 2],
          [0, 2],
          [1, 0],
        ],
        expected: [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
        ],
      },
    ),
    audit: {
      signature: "convex_hull(points: list[tuple[float, float]]) -> list[tuple[float, float]]",
      defaultInputShape: "Array<{ id: string; x: number; y: number }>",
      argumentMapping: ["points <- $"],
      mutation: "Does not mutate points; sorts a copy.",
      returnBehavior:
        "Returns strict hull vertices counter-clockwise from the lexicographically smallest point, as fixed by monotone-chain order.",
    },
  }),
  defineDsaExecution({
    id: "polygon-area",
    entrypoint: "polygon_area",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Right triangle",
        input: [
          [0, 0],
          [4, 0],
          [0, 3],
        ],
        expected: 6,
      },
      {
        label: "Too few vertices",
        input: [
          [0, 0],
          [1, 1],
        ],
        expected: 0,
      },
      {
        label: "Concave polygon",
        input: [
          [0, 0],
          [4, 0],
          [4, 4],
          [2, 2],
          [0, 4],
        ],
        expected: 12,
      },
    ),
    audit: {
      signature: "polygon_area(vertices: list[tuple[float, float]]) -> float",
      defaultInputShape: "Array<{ id: string; x: number; y: number }>",
      argumentMapping: ["vertices <- $"],
      mutation: "Does not mutate vertices.",
      returnBehavior: "Returns absolute shoelace area.",
    },
  }),
  defineDsaExecution({
    id: "line-segment-intersection",
    entrypoint: "line_segment_intersection",
    invocation: { kind: "function", arguments: [input("segment1"), input("segment2")] },
    cases: cases(
      {
        label: "Proper crossing",
        input: {
          segment1: [
            [0, 0],
            [4, 4],
          ],
          segment2: [
            [0, 4],
            [4, 0],
          ],
        },
        expected: true,
      },
      {
        label: "Separated collinear segments",
        input: {
          segment1: [
            [0, 0],
            [1, 0],
          ],
          segment2: [
            [2, 0],
            [3, 0],
          ],
        },
        expected: false,
      },
      {
        label: "Shared endpoint",
        input: {
          segment1: [
            [-2, 1],
            [2, 1],
          ],
          segment2: [
            [2, 1],
            [4, 3],
          ],
        },
        expected: true,
      },
    ),
    audit: {
      signature: "line_segment_intersection(seg1, seg2) -> bool",
      defaultInputShape: "{ segment1: Segment; segment2: Segment }",
      argumentMapping: ["seg1 <- $.segment1", "seg2 <- $.segment2"],
      mutation: "Does not mutate segments.",
      returnBehavior: "Returns whether closed segments properly cross, overlap, or touch.",
    },
  }),
  defineDsaExecution({
    id: "sweep-line-intersections",
    entrypoint: "sweep_line_intersections",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "One crossing pair",
        input: [
          { id: "a", p1: { x: 0, y: 0 }, p2: { x: 4, y: 4 } },
          { id: "b", p1: { x: 0, y: 4 }, p2: { x: 4, y: 0 } },
        ],
        expected: [["b", "a"]],
        comparison: "unordered",
      },
      {
        label: "Single segment",
        input: [{ id: "only", p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } }],
        expected: [],
        comparison: "unordered",
      },
      {
        label: "Three pairwise intersections",
        input: [
          { id: "A", p1: { x: 0, y: 1 }, p2: { x: 4, y: 1 } },
          { id: "B", p1: { x: 0, y: 0 }, p2: { x: 4, y: 2 } },
          { id: "C", p1: { x: 0, y: 2 }, p2: { x: 4, y: 0 } },
        ],
        expected: [
          ["B", "A"],
          ["C", "A"],
          ["C", "B"],
        ],
        comparison: "unordered",
      },
    ),
    audit: {
      signature: "sweep_line_intersections(segments: list[dict]) -> list[tuple[str, str]]",
      defaultInputShape: "Array<{ id: string; p1: Point; p2: Point }>",
      argumentMapping: ["segments <- $"],
      mutation: "Does not mutate segments; maintains internal event and active lists.",
      returnBehavior: "Returns intersecting ID pairs in deterministic event-entry order.",
    },
  }),
  defineDsaExecution({
    id: "closest-pair-of-points",
    entrypoint: "closest_pair_of_points",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Three-four-five pair",
        input: [
          [0, 0],
          [3, 4],
        ],
        expected: 5,
      },
      {
        label: "Duplicate points",
        input: [
          [2, 2],
          [2, 2],
        ],
        expected: 0,
      },
      {
        label: "Dense candidate window",
        input: [
          [0, 0],
          [5, 5],
          [2, 2],
          [2, 3],
          [9, -1],
        ],
        expected: 1,
      },
    ),
    audit: {
      signature: "closest_pair_of_points(points: list[tuple[float, float]]) -> float",
      defaultInputShape: "Array<{ id: string; x: number; y: number }>",
      argumentMapping: ["points <- $"],
      mutation: "Does not mutate points; sorts a copy.",
      returnBehavior: "Returns the minimum Euclidean distance.",
    },
  }),
  defineDsaExecution({
    id: "pick-theorem",
    entrypoint: "pick_theorem",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Square (0,0)-(2,2)",
        input: {
          points: [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ],
        },
        expected: { area: 4, boundary: 8, interior: 1 },
      },
      {
        label: "Triangle (0,0)-(2,0)-(0,2)",
        input: {
          points: [
            [0, 0],
            [2, 0],
            [0, 2],
          ],
        },
        expected: { area: 2, boundary: 4, interior: 1 },
      },
      {
        label: "Unit square",
        input: {
          points: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        },
        expected: { area: 1, boundary: 4, interior: 0 },
      },
    ),
    audit: {
      signature: "solve(input: dict) -> dict",
      defaultInputShape: "{ points: number[][] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns area, boundary, and interior point count via Pick's theorem.",
    },
  }),
  defineDsaExecution({
    id: "manhattan-distance-rotation",
    entrypoint: "manhattan_distance_rotation",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Points [[1,1],[3,4],[-1,0]]",
        input: {
          points: [
            [1, 1],
            [3, 4],
            [-1, 0],
          ],
        },
        expected: 7,
      },
      {
        label: "Two points [[0,0],[1,1]]",
        input: {
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        expected: 2,
      },
      {
        label: "Three points [[0,0],[1,0],[0,1]]",
        input: {
          points: [
            [0, 0],
            [1, 0],
            [0, 1],
          ],
        },
        expected: 2,
      },
    ),
    audit: {
      signature: "solve(input: dict) -> int",
      defaultInputShape: "{ points: number[][] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns max Manhattan distance after rotation.",
    },
  }),
  defineDsaExecution({
    id: "point-in-polygon",
    entrypoint: "point_in_polygon",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Inside square",
        input: {
          point: [1, 1],
          polygon: [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ],
        },
        expected: true,
      },
      {
        label: "Outside square",
        input: {
          point: [3, 3],
          polygon: [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ],
        },
        expected: false,
      },
      {
        label: "Inside triangle",
        input: {
          point: [0.5, 0.5],
          polygon: [
            [0, 0],
            [2, 0],
            [0, 2],
          ],
        },
        expected: true,
      },
    ),
    audit: {
      signature: "solve(input: dict) -> bool",
      defaultInputShape: "{ point: number[]; polygon: number[][] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Checks if point is inside polygon via ray casting.",
    },
  }),
  defineDsaExecution({
    id: "skyline-problem",
    entrypoint: "skyline_problem",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Buildings",
        input: {
          buildings: [
            [2, 9, 10],
            [3, 7, 15],
            [5, 12, 12],
            [15, 20, 10],
            [19, 24, 8],
          ],
        },
        expected: [
          [2, 10],
          [3, 15],
          [7, 12],
          [12, 0],
          [15, 10],
          [20, 8],
          [24, 0],
        ],
      },
      {
        label: "Single building",
        input: { buildings: [[0, 2, 3]] },
        expected: [
          [0, 3],
          [2, 0],
        ],
      },
      {
        label: "Two adjacent buildings",
        input: {
          buildings: [
            [0, 2, 3],
            [2, 4, 3],
          ],
        },
        expected: [
          [0, 3],
          [4, 0],
        ],
      },
    ),
    audit: {
      signature: "solve(input: dict) -> list[list[int]]",
      defaultInputShape: "{ buildings: number[][] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns skyline key points.",
    },
  }),
  defineDsaExecution({
    id: "rectangle-area-union",
    entrypoint: "rectangle_area_union",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Overlapping rectangles",
        input: {
          rectangles: [
            [0, 0, 2, 2],
            [1, 0, 2, 3],
            [1, 0, 3, 1],
          ],
        },
        expected: 6,
      },
      { label: "Single rectangle", input: { rectangles: [[0, 0, 1, 1]] }, expected: 1 },
      {
        label: "Disjoint rectangles",
        input: {
          rectangles: [
            [0, 0, 1, 1],
            [2, 2, 3, 3],
          ],
        },
        expected: 2,
      },
    ),
    audit: {
      signature: "solve(input: dict) -> int",
      defaultInputShape: "{ rectangles: number[][] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns total union area of rectangles.",
    },
  }),
];
