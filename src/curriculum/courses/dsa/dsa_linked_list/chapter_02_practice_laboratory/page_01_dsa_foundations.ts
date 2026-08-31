import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "dsa_linked_list_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Linked List Algorithms & Reversal Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "reverse-nodes-in-k-group",
      title: "Reverse Nodes in k-Group via In-Place Topological Splicing",
      difficulty: "Hard",
      rationale:
        "Implement Reverse Nodes in k-Group in strictly $O(N)$ linear time and $O(1)$ auxiliary space. The algorithm must count $K$ nodes, reverse each sub-segment in-place, and re-splice the boundary pointers without allocating new heap nodes or recursive call-stack frames.",
      starterCode: `/**
 * Reverse Nodes in k-Group Solver
 */

export interface ListNode {
  val: number;
  next: ListNode | null;
}

export function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
  if (head === null || k <= 1) return head;

  const dummy: ListNode = { val: 0, next: head };
  let groupPrev: ListNode = dummy;

  while (true) {
    // 1. Verify that at least k nodes remain
    let kth: ListNode | null = groupPrev;
    for (let i = 0; i < k && kth !== null; i++) {
      kth = kth.next;
    }
    if (kth === null) break; // Fewer than k nodes remaining; preserve order

    const groupNext = kth.next;
    let prev = groupNext;
    let curr = groupPrev.next;

    // 2. Reverse k nodes in-place
    while (curr !== groupNext) {
      const nextTemp = curr!.next;
      curr!.next = prev;
      prev = curr;
      curr = nextTemp;
    }

    // 3. Re-splice group boundaries
    const newGroupEnd = groupPrev.next;
    groupPrev.next = kth;
    groupPrev = newGroupEnd!;
  }

  return dummy.next;
}`,
    },
  ],
};

export const page1 = page_01_dsa_foundations;
