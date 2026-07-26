export const KRUSKAL_CODE = `class DSU:
    def __init__(self, nodes):
        self.parent = {n['id']: n['id'] for n in nodes}

    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            self.parent[root_i] = root_j
            return True
        return False

def kruskal_mst(nodes, edges):
    dsu = DSU(nodes)
    sorted_edges = sorted(edges, key=lambda e: e.get('weight', 1))
    mst = []

    for edge in sorted_edges:
        if dsu.union(edge['from'], edge['to']):
            mst.append(edge)

    return mst`;
