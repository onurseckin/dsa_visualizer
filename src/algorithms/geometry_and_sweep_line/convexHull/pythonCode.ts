export const PYTHON_CONVEX_HULL_CODE = `def convex_hull(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """
    Find the convex hull of a set of 2D points using Andrew's Monotone Chain algorithm.
    """
    n = len(points)
    if n <= 3:
        return points

    sorted_pts = sorted(points, key=lambda p: (p[0], p[1]))

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in sorted_pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    upper = []
    for p in reversed(sorted_pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    lower.pop()
    upper.pop()
    return lower + upper`;

export const CONVEX_HULL_CODE = PYTHON_CONVEX_HULL_CODE;
