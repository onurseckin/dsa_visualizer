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
