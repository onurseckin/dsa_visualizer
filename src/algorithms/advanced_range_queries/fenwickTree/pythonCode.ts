export const FENWICK_TREE_CODE = `class FenwickTree:
    def __init__(self, size: int):
        self.tree = [0] * (size + 1)

    def update(self, index: int, delta: int):
        i = index
        while i < len(self.tree):
            self.tree[i] += delta
            i += i & -i

    def query(self, index: int) -> int:
        sum_val = 0
        i = index
        while i > 0:
            sum_val += self.tree[i]
            i -= i & -i
        return sum_val

    def range_query(self, left: int, right: int) -> int:
        return self.query(right) - self.query(left - 1)`;
