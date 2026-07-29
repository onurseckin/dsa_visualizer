export const KRUSKAL_CODE = `class UnionFind:
    def __init__(self, size):
        self.root = [i for i in range(size)]
        self.rank = [1] * size

    def find(self, x):
        if self.root[x] == x:
            return x
        self.root[x] = self.find(self.root[x])
        return self.root[x]

    def union(self, x, y):
        rootX = self.find(x)
        rootY = self.find(y)
        if rootX != rootY:
            if self.rank[rootX] > self.rank[rootY]:
                self.root[rootY] = rootX
            elif self.rank[rootX] < self.rank[rootY]:
                self.root[rootX] = rootY
            else:
                self.root[rootY] = rootX
                self.rank[rootX] += 1

    def connected(self, x, y):
        return self.find(x) == self.find(y)

def kruskal_mst(nodes, edges):
    if len(nodes) <= 1:
        return []

    node_map = {n['id']: i for i, n in enumerate(nodes)}
    uf = UnionFind(len(nodes))
    sorted_edges = sorted(edges, key=lambda e: e.get('weight', 1))
    mst = []

    for edge in sorted_edges:
        if len(mst) == len(nodes) - 1:
            break
        u, v = node_map[edge['from']], node_map[edge['to']]
        if not uf.connected(u, v):
            uf.union(u, v)
            mst.append(edge)

    return mst`;
