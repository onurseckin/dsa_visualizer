import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { TREE_DIAMETER_CODE } from "./pythonCode";
import {
  DEFAULT_TREE_DIAMETER_INPUT,
  generateTreeDiameterSteps,
  type TreeDiameterInput,
} from "./stepGenerator";

export { DEFAULT_TREE_DIAMETER_INPUT };

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
  topicIds: ["tree_fundamentals", "tree_queries_and_diameter"],
  difficulty: "Medium",
  description: `<p>Find the diameter (length of the longest simple path between any two nodes) of an unweighted tree using two passes of Depth-First Search (2-DFS).</p>
<h3>Problem Statement</h3>
<p>Given an undirected tree on <em>N</em> vertices, find its diameter <em>D</em>—the maximum number of edges in any simple path connecting two vertices in the tree.</p>
<p>The algorithm leverages the double-DFS property: starting a DFS from an arbitrary node <em>S</em> discovers a vertex <em>A</em> that is guaranteed to be one endpoint of a longest path. Running a second DFS starting from vertex <em>A</em> finds the opposite endpoint <em>B</em> and measures the exact diameter distance <em>D = dist(A, B)</em>.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>rootId</code>: Identifier of the root node to start Pass 1.</li>
  <li><code>nodes</code>: List of tree node objects defining the tree structure.</li>
</ul>
<h3>Output</h3>
<p>Returns an integer representing the diameter <em>D</em> (number of edges on the longest simple path).</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>1 &le; N &le; 10<sup>5</sup></code>.</li>
  <li>Valid connected tree with <em>N - 1</em> undirected edges.</li>
  <li>Single node tree (<em>N = 1</em>): Diameter distance is 0.</li>
  <li>Uniform edge weights (unweighted tree).</li>
</ul>`,
  constraints: [
    "1 <= Number of nodes N <= 10^5",
    "The graph is guaranteed to be a valid connected tree with N - 1 undirected edges",
    "Node values are unique identifiers or integers within [1, 10^9]",
    "Edge weights are uniform (unweighted tree)",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "root = [1, 2, 3, 4, 5]",
      outputDisplay: "6",
      title: "Standard 8-Node Unweighted Tree",
      input: DEFAULT_TREE_DIAMETER_INPUT,
      output: "6",
      explanation:
        "Pass 1 from node 1 finds leaf 7 (dist 3). Pass 2 from node 7 finds leaf 8 (dist 6). The longest simple path 7->4->2->1->3->6->8 has 6 edges.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "root = [1, 2, 3, 4, null, null, 5, 6, null, null, 7]",
      outputDisplay: "5",
      title: "Adversarial Asymmetric Tree",
      input: {
        rootId: "1",
        nodes: [
          { id: "1", val: 1, leftId: "2", rightId: "3", state: "default" },
          { id: "2", val: 2, leftId: "4", state: "default" },
          { id: "3", val: 3, leftId: "5", rightId: "6", state: "default" },
          { id: "4", val: 4, state: "default" },
          { id: "5", val: 5, leftId: "7", state: "default" },
          { id: "6", val: 6, rightId: "8", state: "default" },
          { id: "7", val: 7, state: "default" },
          { id: "8", val: 8, state: "default" },
        ],
      },
      output: "5",
      explanation:
        "The diameter path goes from leaf 7 through 5 -> 3 -> 6 to leaf 8, yielding a longest simple path of 5 edges.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "root = [1]",
      outputDisplay: "0",
      title: "Boundary Single Node Case",
      input: {
        rootId: "1",
        nodes: [{ id: "1", val: 1, state: "default" }],
      },
      output: "0",
      explanation: "Single node tree has zero edges; diameter is 0.",
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
      "<p>The diameter of a tree is the number of edges on the longest simple path anywhere in it — the distance between the two most remote nodes. Because a tree is connected and has no cycles, there is exactly one path between any pair of nodes, so the longest path is a well-defined single quantity. The double-DFS method finds it with only two traversals, leveraging a key structural property of trees.</p>",
    sections: [
      {
        heading: "What makes trees special enough for this to work",
        body: "<p>A tree on <em>V</em> nodes is connected and acyclic, forcing it to have exactly <em>V - 1</em> edges and a unique simple path between any two nodes. Uniqueness means distance is unambiguous. The double-DFS algorithm proves that a DFS from <em>any</em> initial node is guaranteed to land on one of the diameter's true endpoints, eliminating the need to run <em>O(V)</em> searches.</p>",
      },
      {
        heading: "The two passes, concretely",
        body: "<p>Pass 1 starts from an arbitrary node, tracks path distances, and returns the farthest node <em>A</em>. Pass 2 starts from node <em>A</em> and conducts a second DFS. The farthest node reached from <em>A</em> is node <em>B</em>, and the distance between <em>A</em> and <em>B</em> is the exact tree diameter.</p>",
      },
      {
        heading: "Why the first pass must land on an endpoint",
        body: "<p>For any starting node <em>S</em>, the node farthest from <em>S</em> must be a diameter endpoint. If it were not, an even longer path could be constructed by splicing its branch onto the diameter, contradicting the definition of diameter.</p>",
      },
      {
        heading: "Pitfalls that silently break it",
        body: "<p>The traversal must guard against stepping backward to the parent node. The endpoint theorem assumes non-negative edge weights (for negative weights, dynamic programming is required). Furthermore, diameter counts edges, so a single-node tree has diameter 0.</p>",
      },
      {
        heading: "The single-pass alternative",
        body: "<p>An alternative single-pass post-order DFS computes subtree heights at each node, combining the two largest child heights to evaluate candidate paths. That approach extends cleanly to weighted trees.</p>",
      },
      {
        heading: "Where the idea generalises",
        body: "<p>The midpoint of any diameter path is the tree center (the node minimizing maximum distance). Tree radius, node eccentricity, and tree re-rooting DP all build on these distance properties.</p>",
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
  leetcode: {
    id: 543,
    url: "https://leetcode.com/problems/diameter-of-binary-tree/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #543",
      leetcodeId: 543,
      url: "https://leetcode.com/problems/diameter-of-binary-tree/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 14",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 14,
      section: "14.2 Diameter",
    },
  ],
  defaultInput: DEFAULT_TREE_DIAMETER_INPUT,
  generateSteps: generateTreeDiameterSteps,
};

export default treeDiameter;
