import type { AlgorithmStep, ElementState, TreeNodeItem } from "../../../types/dsa";

export interface BinaryTreeLcaInput {
  nodes: TreeNodeItem[];
  rootId: string;
  pVal: number;
  qVal: number;
}

export const generateBinaryTreeLcaSteps = (input: BinaryTreeLcaInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const { nodes, rootId, pVal, qVal } = input;

  const nodeMap = new Map<string, TreeNodeItem>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const callStack: string[] = [];
  const visitedSet = new Set<string>();

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeId?: string,
    lcaId?: string,
    extraVars: Record<string, string | number | boolean> = {},
  ) => {
    const updatedNodes: TreeNodeItem[] = nodes.map((node) => {
      let state: ElementState = node.state || "default";
      if (lcaId && node.id === lcaId) {
        state = "sorted";
      } else if (activeId && node.id === activeId) {
        state = "active";
      } else if (node.val === pVal || node.val === qVal) {
        state = "compare";
      } else if (visitedSet.has(node.id)) {
        state = "visited";
      }
      return { ...node, state };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: { kind: "tree", nodes: updatedNodes, rootId },
      auxiliaryState: {
        stack: [...callStack],
        visited: Array.from(visitedSet),
      },
      variables: { p: pVal, q: qVal, ...extraVars },
    });
  };

  addStep(
    1,
    "Begin the LCA search",
    `We're hunting for the lowest node that has both ${pVal} and ${qVal} beneath it. We'll walk the tree bottom-up, so every parent can ask its two subtrees "did you find one of them?" and combine the answers.`,
    undefined,
    undefined,
    { p: pVal, q: qVal },
  );

  const recurse = (currentId?: string): string | null => {
    if (!currentId || !nodeMap.has(currentId)) {
      return null;
    }

    const currentNode = nodeMap.get(currentId)!;
    callStack.push(`Node(${currentNode.val})`);
    visitedSet.add(currentId);

    addStep(
      2,
      `Evaluate node ${currentNode.val}`,
      `We first check whether node ${currentNode.val} is itself one of our targets, ${pVal} or ${qVal}. If it is, we can report it upward right away without searching any deeper.`,
      currentId,
      undefined,
      { current: currentNode.val },
    );

    if (currentNode.val === pVal || currentNode.val === qVal) {
      addStep(
        3,
        `Found target ${currentNode.val === pVal ? "p" : "q"} at node ${currentNode.val}`,
        `Node ${currentNode.val} is ${currentNode.val === pVal ? "p" : "q"} itself, so we return it straight up. Its parent now knows this subtree contains one of the two targets — and if the other target sits below here, this node is already their ancestor.`,
        currentId,
        undefined,
        { current: currentNode.val, match: true },
      );
      callStack.pop();
      return currentId;
    }

    let leftResult: string | null = null;
    if (currentNode.leftId) {
      addStep(
        5,
        `Search the left subtree of node ${currentNode.val}`,
        `We ask node ${currentNode.val}'s left branch whether it contains ${pVal} or ${qVal}. Whatever it finds — a target or nothing — comes back to us as a return value.`,
        currentId,
        undefined,
        { current: currentNode.val, leftChild: nodeMap.get(currentNode.leftId)?.val ?? "N/A" },
      );
      leftResult = recurse(currentNode.leftId);
    }

    let rightResult: string | null = null;
    if (currentNode.rightId) {
      addStep(
        6,
        `Search the right subtree of node ${currentNode.val}`,
        `Now the same question goes to the right branch. Once both sides have answered, node ${currentNode.val} has everything it needs to decide what to report.`,
        currentId,
        undefined,
        { current: currentNode.val, rightChild: nodeMap.get(currentNode.rightId)?.val ?? "N/A" },
      );
      rightResult = recurse(currentNode.rightId);
    }

    if (leftResult && rightResult) {
      addStep(
        8,
        `Node ${currentNode.val} is the answer`,
        `The left subtree returned one target and the right subtree returned the other, so their paths split exactly here. That makes node ${currentNode.val} the lowest common ancestor — no deeper node can see both ${pVal} and ${qVal}.`,
        currentId,
        currentId,
        { current: currentNode.val, lcaFound: true },
      );
      callStack.pop();
      return currentId;
    }

    const result = leftResult !== null ? leftResult : rightResult;
    addStep(
      10,
      `Node ${currentNode.val} passes ${result ? `node ${nodeMap.get(result)?.val}` : "nothing"} upward`,
      result
        ? `Only one side found a target, so node ${currentNode.val} simply forwards that answer to its parent. The parent will check whether the other target turns up in its opposite branch.`
        : `Neither subtree found a target below node ${currentNode.val}, so we report nothing and let the search continue elsewhere.`,
      currentId,
      undefined,
      { current: currentNode.val, returned: result ? nodeMap.get(result)!.val : "None" },
    );

    callStack.pop();
    return result;
  };

  const finalLcaId = recurse(rootId);

  if (finalLcaId) {
    const lcaNode = nodeMap.get(finalLcaId);
    addStep(
      10,
      `The LCA is node ${lcaNode?.val}`,
      `The recursion has unwound all the way back to the root, and node ${lcaNode?.val} is the lowest point where the paths to ${pVal} and ${qVal} converge. Each node was visited just once along the way.`,
      undefined,
      finalLcaId,
      { lcaVal: lcaNode!.val },
    );
  } else {
    addStep(
      10,
      "No common ancestor exists",
      "Neither target turned up anywhere in the tree, so there is no ancestor to report.",
      undefined,
      undefined,
      { lcaVal: "None" },
    );
  }

  return steps;
};
