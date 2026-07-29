import { trace } from "./shared";

export const bpeTokenBudget = trace({
  id: "bpe-token-budget",
  title: "Trace BPE Token Budget",
  topicId: "ml_transformer_internals",
  entrypoint: "estimate_token_budget",
  contract:
    "Return token count, UTF-8 byte count, and remaining context from illustrative pieces; these do not claim a production vocabulary.",
  code: `def estimate_token_budget(record):
    tokens = record["pieces"]
    byte_count = sum(len(piece.encode("utf-8")) for piece in tokens)
    return {"token_count": len(tokens), "byte_count": byte_count, "remaining_context": record["context_limit"] - len(tokens)}`,
  cases: [
    {
      id: "ascii",
      label: "ASCII pieces",
      input: { pieces: ["learn", "ing"], context_limit: 8 },
      expected: { token_count: 2, byte_count: 8, remaining_context: 6 },
      comparison: "deep-equal",
    },
    {
      id: "utf8",
      label: "UTF-8 piece",
      input: { pieces: ["caf", "é"], context_limit: 4 },
      expected: { token_count: 2, byte_count: 5, remaining_context: 2 },
      comparison: "deep-equal",
    },
    {
      id: "budget",
      label: "Full budget",
      input: { pieces: ["a", "b", "c"], context_limit: 3 },
      expected: { token_count: 3, byte_count: 3, remaining_context: 0 },
      comparison: "deep-equal",
    },
  ],
  source: ["SentencePiece tokenizer paper", "https://aclanthology.org/D18-2012/"],
  values: (r) => {
    const pieces = r.pieces as string[];
    const bytes = new TextEncoder().encode(pieces.join(""));
    return [
      ["pieces", pieces.join("|")],
      ["token count", pieces.length],
      ["UTF-8 bytes", bytes.length],
      ["remaining context", Number(r.context_limit) - pieces.length],
    ];
  },
});
