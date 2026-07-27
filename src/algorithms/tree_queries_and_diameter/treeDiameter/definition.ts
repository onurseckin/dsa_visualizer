import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { TREE_DIAMETER_CODE } from "./pythonCode";
import { generateTreeDiameterSteps, type TreeDiameterInput } from "./stepGenerator";

export const DEFAULT_TREE_DIAMETER_INPUT: TreeDiameterInput = {
  rootId: "1",
  nodes: [
    { id: "1", val: 1, leftId: "2", rightId: "3", state: "default" },
    { id: "2", val: 2, leftId: "4", rightId: "5", state: "default" },
    { id: "3", val: 3, rightId: "6", state: "default" },
    { id: "4", val: 4, leftId: "7", state: "default" },
    { id: "5", val: 5, state: "default" },
    { id: "6", val: 6, rightId: "8", state: "default" },
    { id: "7", val: 7, state: "default" },
    { id: "8", val: 8, state: "default" },
  ],
};

const TREE_DIAMETER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: takes the node count, an adjacency list of the tree, and an arbitrary node to start the first search from — any start works thanks to the endpoint theorem.",
    2: "A recursive depth-first walk that tracks the node it came from (to avoid backtracking) and how many edges it has travelled so far.",
    3: 'Seed the running "farthest so far" with the current node itself, since with no children explored yet it is trivially the farthest one found.',
    4: "Visit every node connected to this one — in a tree that means every child and the parent, since the adjacency list is undirected.",
    5: "Skip stepping back into the node we just came from; without this guard the walk would bounce between two adjacent nodes forever.",
    6: "Recurse one edge further into this neighbor's subtree, asking it the same question and getting back its own farthest node and distance.",
    7: "Only update our record if that neighbor's branch reached farther than anything we've seen from this node so far.",
    8: "Adopt the deeper branch's farthest node and distance as our own new record.",
    9: "Hand the best (farthest node, distance) pair found in this entire subtree back up to the caller.",
    11: "Run the first DFS from any starting node; the node it reports as farthest is guaranteed to be one true endpoint of the diameter, regardless of where we started.",
    12: "Run the second DFS from confirmed endpoint A; the farthest node from A is the diameter's other endpoint, and its distance is the diameter itself.",
    13: "Report both endpoints of the longest path in the tree along with its length — two linear passes were all it took.",
  },
};

export const treeDiameter: AlgorithmDefinition<TreeDiameterInput> = {
  id: "tree-diameter",
  title: "Tree Diameter (2-DFS Algorithm)",
  category: "tree_queries_and_diameter",
  difficulty: "Medium",
  description:
    "Computes the diameter (the length of the longest simple path between any two nodes) of an unweighted tree using the double Depth-First Search (2-DFS) algorithm. The algorithm relies on the fundamental structural invariant: starting a DFS from any arbitrary root node finds a node A that is guaranteed to be one of the diameter's endpoints. A second DFS starting from node A discovers the opposite endpoint B and the exact diameter distance.",
  constraints: [
    "1 <= Number of nodes N <= 10^5",
    "The graph is guaranteed to be a valid connected tree with N - 1 undirected edges",
    "Node values are unique identifiers or integers within [1, 10^9]",
    "Edge weights are uniform (unweighted tree)",
  ],
  examples: [
    {
      input: 'rootId = "1", nodes = 8-node binary tree',
      output: "6",
      explanation:
        "DFS 1 from root node 1 finds leaf node 7 (distance 3). DFS 2 from node 7 finds leaf node 8 (distance 6). The path 7 -> 4 -> 2 -> 1 -> 3 -> 6 -> 8 contains 6 edges.",
    },
    {
      input: 'rootId = "1", nodes = [1 -> 2 -> 3]',
      output: "2",
      explanation:
        "In a 3-node linear chain tree, the path between endpoint leaf 3 and endpoint leaf 1 spans 2 edges.",
    },
  ],
  code: TREE_DIAMETER_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "We run depth-first search twice, and each pass walks every node and edge exactly once — in a tree that's V nodes and V − 1 edges, so one pass costs O(V + E). Two linear passes are still linear, which is why the whole algorithm stays O(V + E) no matter what shape the tree has.",
    space:
      "We keep an adjacency list with an entry per node, plus the DFS recursion stack, which in a chain-shaped tree can stack up every node at once — so extra memory grows with the number of nodes, O(V).",
  },
  topicGuide: {
    overview:
      'The diameter of a tree is the number of edges on the longest simple path anywhere in it — the distance between the two most remote nodes. Because a tree is connected and has no cycles, there is exactly one path between any pair of nodes, so "the longest path" is a well-defined single quantity rather than an optimisation over many routes. The double-DFS method finds it with only two traversals, and it is a beautiful example of a structural theorem about trees doing work that an algorithm would otherwise have to brute-force. What you should take away is not just the recipe but the habit of looking for a property of the input that lets you skip most of the search.',
    sections: [
      {
        heading: "What makes trees special enough for this to work",
        body: "A tree on V nodes is connected and acyclic, which forces it to have exactly V minus one edges and, more importantly, exactly one simple path between any two nodes. That uniqueness means distance is unambiguous and the diameter is simply the largest of all pairwise distances, with no shortest-path relaxation needed. The naive consequence is that you could run a traversal from every node, record how far the farthest node is, and take the maximum of those numbers. The whole point of this algorithm is that you do not need all V of those searches — one from an arbitrary node, plus one more, is provably enough.",
      },
      {
        heading: "The two passes, concretely",
        body: "The first depth-first search starts from any node you like, carries a running distance, and reports back the node that ended up farthest away; call it A. The second search starts from A and does the same thing, and the node it finds farthest away is B, with the distance between A and B being the diameter itself. During the second pass you also record each node's parent, or push the current path onto a list as you descend, so that when you land on B you can reconstruct the actual sequence of nodes rather than just its length. In the eight-node example the first pass from the root reaches leaf 7 at distance three, and the second pass from 7 reaches leaf 8 at distance six, tracing the path 7, 4, 2, 1, 3, 6, 8.",
      },
      {
        heading: "Why the first pass must land on an endpoint",
        body: "The claim to prove is that for any starting node s, the node farthest from s is an endpoint of some diameter — that is the invariant the whole method rests on. Suppose the diameter path runs from u to v, and let m be the node where the path from s first touches that path. Any node the search could call farthest either is u or v, or it hangs off the tree somewhere else; in the latter case you could take its branch from m and glue it onto whichever half of the diameter through m is longer, producing a path strictly longer than u to v, which contradicts u to v being longest. So the farthest node from s is genuinely a diameter endpoint, and once one endpoint is pinned down the farthest node from it is by definition the other end. Without this argument the algorithm looks like a lucky guess, which is exactly why it is worth reconstructing yourself.",
      },
      {
        heading: "Pitfalls that silently break it",
        body: "The traversal must never step back into the node it just came from: pass the parent down and skip it, or maintain a visited set, because otherwise two adjacent nodes will bounce the search back and forth forever. The endpoint theorem depends on edge lengths being non-negative, so with a single negative weight the splicing argument collapses and double-DFS quietly returns a wrong answer — that case needs a different approach. Connectivity matters too: on a forest you have to run the pair of passes once per component, since a search cannot cross between components. Finally, be deliberate about units, because the diameter counts edges and not nodes, so a single isolated node has diameter zero while the path through it lists one node, and mixing the two conventions is the most common off-by-one here.",
      },
      {
        heading: "The single-pass alternative",
        body: "There is a second standard solution that never needs the theorem at all: run one post-order depth-first search, and at each node compute the heights of its children, keep the two largest, and treat their sum as a candidate for the longest path bending at that node while returning the largest plus one upward. Take the maximum candidate over all nodes and you have the diameter in a single traversal. That version extends cleanly to weighted trees, including negative weights, and it gives you a per-node value — the longest path passing through each node — which is useful in its own right. Prefer the double search when you want the two endpoints and the path spelled out with almost no code; prefer the height-combining pass when weights are involved or when you need those per-node quantities.",
      },
      {
        heading: "Where the idea generalises",
        body: 'The centre of a tree is the middle node or edge of any diameter path, which is the direct route to problems asking for the root that minimises tree height. Tree radius, eccentricity of individual nodes, and rerooting dynamic programming that computes each node\'s farthest distance in linear time all grow out of the same distance machinery. On unweighted trees you can swap depth-first search for breadth-first search in both passes with no change to the argument, which is handy when the tree is deep enough to threaten recursion limits. Even outside trees, the "walk to the farthest thing, then walk again" heuristic is the standard cheap estimate for the diameter of a general graph, where computing it exactly is far more expensive.',
      },
    ],
    keyTerms: [
      {
        term: "Tree",
        definition:
          "A connected graph with no cycles, which on V nodes means exactly V minus one edges. Its defining convenience is that every pair of nodes is joined by exactly one simple path.",
      },
      {
        term: "Simple path",
        definition:
          "A route through the graph that never repeats a node. Path length here counts edges traversed, so a path visiting k nodes has length k minus one.",
      },
      {
        term: "Diameter",
        definition:
          "The greatest distance between any two nodes in the tree. There may be several different paths achieving it, but they all share the same length and the same centre.",
      },
      {
        term: "Eccentricity",
        definition:
          "For one node, the distance to the node farthest from it. The diameter is the maximum eccentricity in the tree, and the first pass of this algorithm is computing the eccentricity of the arbitrary start node.",
      },
      {
        term: "Parent guard",
        definition:
          "The check that stops a traversal from revisiting the neighbour it arrived from, since tree edges are undirected. Omitting it turns any tree walk into an infinite ping-pong between two nodes.",
      },
    ],
  },
  trivia: TREE_DIAMETER_TRIVIA,
  defaultInput: DEFAULT_TREE_DIAMETER_INPUT,
  generateSteps: generateTreeDiameterSteps,
};

export default treeDiameter;
