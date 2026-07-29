import { cases, defineDsaExecution, namespaceInput, result } from "./helpers";

export const linkedListExecutions = [
  defineDsaExecution({
    id: "reverse-linked-list",
    entrypoint: "reverse_linked_list",
    invocation: {
      kind: "function",
      arguments: [namespaceInput("head")],
      result: result("return", [], "json"),
    },
    cases: cases(
      {
        label: "Three nodes",
        input: {
          head: { val: 1, next: { val: 2, next: { val: 3, next: null } } },
        },
        expected: { val: 3, next: { val: 2, next: { val: 1, next: null } } },
      },
      { label: "Empty list", input: { head: null }, expected: null },
      {
        label: "Signed values",
        input: {
          head: { val: -4, next: { val: 0, next: { val: 9, next: { val: 2, next: null } } } },
        },
        expected: {
          val: 2,
          next: { val: 9, next: { val: 0, next: { val: -4, next: null } } },
        },
      },
    ),
    audit: {
      signature: 'reverse_linked_list(head: "Optional[ListNode]") -> "Optional[ListNode]"',
      defaultInputShape: "{ nodes: number[] }",
      argumentMapping: ["head <- namespace($.head)"],
      mutation: "Reverses next pointers in the converted linked-node graph.",
      returnBehavior: "Returns the new head; the contract projects the safe node graph to JSON.",
    },
  }),
] as const;
