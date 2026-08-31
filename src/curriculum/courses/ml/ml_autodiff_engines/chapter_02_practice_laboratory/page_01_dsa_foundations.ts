import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_autodiff_engines_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Tensor Autograd Engine & Checkpointing",
  subtitle: "Interactive Implementation of Mini-Autograd and Activation Rematerialization",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_micro_autograd_topological_engine",
      title: "Micro-Autograd Reverse Topological Engine",
      difficulty: "Hard",
      rationale:
        "Validates implementation of DAG topological ordering, gradient accumulation with branching paths, and backward function execution.",
      starterCode: `class Node:
    def __init__(self, val: float, parents: tuple["Node", ...] = ()):
        self.val = val
        self.grad = 0.0
        self.parents = parents
        self.backward_fn = lambda: None

def topological_backward(loss_node: Node) -> None:
    """
    Executes reverse-mode backpropagation on arbitrary DAG rooted at loss_node.
    
    Steps:
    1. Run DFS to compute topological order.
    2. Seed loss_node.grad = 1.0.
    3. Iterate through nodes in reverse topological order, calling node.backward_fn().
    """
    topo: list[Node] = []
    visited: set[Node] = set()
    
    def dfs(n: Node):
        if n not in visited:
            visited.add(n)
            for p in n.parents:
                dfs(p)
            topo.append(n)
            
    dfs(loss_node)
    
    loss_node.grad = 1.0
    for node in reversed(topo):
        node.backward_fn()

if __name__ == "__main__":
    # Test on f(x, y) = (x * y) + (x + y)
    # df/dx = y + 1, df/dy = x + 1
    x = Node(2.0)
    y = Node(3.0)
    
    # Node 1: p = x * y
    p = Node(x.val * y.val, (x, y))
    def _back_p():
        x.grad += y.val * p.grad
        y.grad += x.val * p.grad
    p.backward_fn = _back_p
    
    # Node 2: s = x + y
    s = Node(x.val + y.val, (x, y))
    def _back_s():
        x.grad += 1.0 * s.grad
        y.grad += 1.0 * s.grad
    s.backward_fn = _back_s
    
    # Node 3: out = p + s
    out = Node(p.val + s.val, (p, s))
    def _back_out():
        p.grad += 1.0 * out.grad
        s.grad += 1.0 * out.grad
    out.backward_fn = _back_out
    
    topological_backward(out)
    
    print(f"x.grad = {x.grad} (Expected: 3.0 + 1.0 = 4.0)")
    print(f"y.grad = {y.grad} (Expected: 2.0 + 1.0 = 3.0)")
    assert x.grad == 4.0 and y.grad == 3.0, "Autograd gradient error!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_activation_checkpointing_rematerialize",
      title: "Activation Checkpointing Rematerialization Logic",
      difficulty: "Hard",
      rationale:
        "Implements gradient checkpointing logic that drops intermediate activations during the forward pass and recomputes them on-the-fly during the backward pass.",
      starterCode: `from typing import Callable, Any

def checkpointed_layer_forward_backward(
    layer_fn: Callable[[Any], Any],
    layer_backward_fn: Callable[[Any, Any], Any],
    input_x: Any,
    grad_output: Any
) -> Any:
    """
    Demonstrates activation checkpointing:
    1. During forward pass, only input_x is stored.
    2. During backward pass, layer_fn(input_x) is re-evaluated to reconstruct intermediate activations.
    3. layer_backward_fn is called with reconstructed activations to compute grad_input.
    """
    # TODO: Implement recompute-and-backward execution
    pass
`,
    },
  ],
};
