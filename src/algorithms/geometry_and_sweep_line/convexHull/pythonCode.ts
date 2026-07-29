export const PYTHON_CONVEX_HULL_CODE = `class Solution:
    def __init__(self):
        pass

    def outerTrees(self, trees: list[list[int]]) -> list[list[int]]:
        def cross(p1, p2, p3):
            return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])

        points = sorted(trees, key=lambda p: (p[0], p[1]))
        if len(points) <= 1:
            return points

        lower = []
        for p in points:
            while len(lower) >= 2 and cross(lower[-2], lower[-1], p) < 0:
                lower.pop()
            lower.append(p)

        upper = []
        for p in reversed(points):
            while len(upper) >= 2 and cross(upper[-2], upper[-1], p) < 0:
                upper.pop()
            upper.append(p)

        res = []
        seen = set()
        for p in lower + upper:
            tp = tuple(p)
            if tp not in seen:
                seen.add(tp)
                res.append(p)
        return res`;

export const CONVEX_HULL_CODE = PYTHON_CONVEX_HULL_CODE;
