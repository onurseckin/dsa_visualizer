import { trace } from "./shared";

export const causalAttentionTrace = trace({
  id: "causal-attention-trace",
  title: "Trace Causal Attention",
  topicId: "ml_transformer_internals",
  entrypoint: "trace_causal_attention",
  contract:
    "Return scalar causal attention weights and output; every future position is exactly zero after the causal mask.",
  code: `import math
def trace_causal_attention(record):
    q = record["query"]
    keys = record["keys"][:record["position"] + 1]
    values = record["values"][:record["position"] + 1]
    scores = [q * key for key in keys]
    largest = max(scores)
    weights = [math.exp(score - largest) for score in scores]
    total = sum(weights)
    normalized = [weight / total for weight in weights]
    output = sum(weight * value for weight, value in zip(normalized, values))
    return {"weights": [round(weight, 6) for weight in normalized] + [0] * (len(record["keys"]) - len(normalized)), "output": round(output, 6)}`,
  cases: [
    {
      id: "first",
      label: "First token",
      input: { query: 1, keys: [1, 2], values: [10, 20], position: 0 },
      expected: { weights: [1, 0], output: 10 },
      comparison: "deep-equal",
    },
    {
      id: "two",
      label: "Second token",
      input: { query: 1, keys: [0, 0], values: [2, 6], position: 1 },
      expected: { weights: [0.5, 0.5], output: 4 },
      comparison: "deep-equal",
    },
    {
      id: "masked",
      label: "Masked future",
      input: { query: 1, keys: [1, 1, 10], values: [2, 4, 100], position: 1 },
      expected: { weights: [0.5, 0.5, 0], output: 3 },
      comparison: "deep-equal",
    },
  ],
  source: ["Attention Is All You Need", "https://arxiv.org/abs/1706.03762"],
  values: (r) => {
    const keys = r.keys as number[];
    const position = Number(r.position);
    const scores = keys.map((key, index) => (index <= position ? Number(r.query) * key : 0));
    return [
      ["causal mask", scores.map((_, index) => (index <= position ? "allow" : "mask")).join(",")],
      ["scores", scores.join(",")],
      ["future weight", 0],
      ["allowed keys", position + 1],
    ];
  },
});
