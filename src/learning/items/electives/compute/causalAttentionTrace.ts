import { trace } from "./shared";

function softmax(values: readonly number[]) {
  const largest = Math.max(...values);
  const exponentials = values.map((value) => Math.exp(value - largest));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

export const causalAttentionTrace = trace({
  id: "causal-attention-trace",
  title: "Trace Causal Attention",
  topicId: "ml_transformer_internals",
  entrypoint: "trace_causal_attention",
  contract:
    "Return head and tensor shapes, dot-product scores scaled by the square root of head dimension, zero future weights from a causal mask, per-head value composition, and concatenated output.",
  code: `import math
def trace_causal_attention(record):
    queries = record["queries"]
    keys = record["keys"]
    values = record["values"]
    position = record["position"]
    head_dim = len(queries[0])
    scale = math.sqrt(head_dim)
    all_weights = []
    head_outputs = []
    for query, head_keys, head_values in zip(queries, keys, values):
        allowed_scores = [sum(q * k for q, k in zip(query, key)) / scale for key in head_keys[:position + 1]]
        largest = max(allowed_scores)
        exponentials = [math.exp(score - largest) for score in allowed_scores]
        total = sum(exponentials)
        normalized = [value / total for value in exponentials]
        weights = normalized + [0] * (len(head_keys) - len(normalized))
        value_dim = len(head_values[0])
        output = [sum(weights[token] * head_values[token][dimension] for token in range(len(head_values))) for dimension in range(value_dim)]
        all_weights.append([round(weight, 6) for weight in weights])
        head_outputs.append([round(value, 6) for value in output])
    return {"head_count": len(queries), "query_shape": [len(queries), head_dim], "key_shape": [len(keys), len(keys[0]), len(keys[0][0])], "scale": round(scale, 6), "weights": all_weights, "head_outputs": head_outputs, "output": [value for head in head_outputs for value in head]}`,
  cases: [
    {
      id: "first-position",
      label: "First position is causal",
      input: {
        queries: [[1, 0]],
        keys: [
          [
            [1, 0],
            [2, 0],
          ],
        ],
        values: [[[10], [20]]],
        position: 0,
      },
      expected: {
        head_count: 1,
        query_shape: [1, 2],
        key_shape: [1, 2, 2],
        scale: Number(Math.SQRT2.toFixed(6)),
        weights: [[1, 0]],
        head_outputs: [[10]],
        output: [10],
      },
      comparison: "deep-equal",
    },
    {
      id: "two-head-composition",
      label: "Two-head output composition",
      input: {
        queries: [[0], [0]],
        keys: [
          [[0], [0]],
          [[0], [0]],
        ],
        values: [
          [[2], [6]],
          [
            [10, 20],
            [30, 40],
          ],
        ],
        position: 1,
      },
      expected: {
        head_count: 2,
        query_shape: [2, 1],
        key_shape: [2, 2, 1],
        scale: 1,
        weights: [
          [0.5, 0.5],
          [0.5, 0.5],
        ],
        head_outputs: [[4], [20, 30]],
        output: [4, 20, 30],
      },
      comparison: "deep-equal",
    },
    {
      id: "scaled-and-masked",
      label: "Scaled score with future mask",
      input: {
        queries: [[1, 1, 1, 1]],
        keys: [
          [
            [2, 2, 2, 2],
            [0, 0, 0, 0],
            [10, 10, 10, 10],
          ],
        ],
        values: [[[10], [20], [100]]],
        position: 1,
      },
      expected: {
        head_count: 1,
        query_shape: [1, 4],
        key_shape: [1, 3, 4],
        scale: 2,
        weights: [[0.982014, 0.017986, 0]],
        head_outputs: [[10.179862]],
        output: [10.179862],
      },
      comparison: "deep-equal",
    },
  ],
  source: ["Attention Is All You Need", "https://arxiv.org/abs/1706.03762"],
  values: (record) => {
    const queries = record.queries as number[][];
    const keys = record.keys as number[][][];
    const values = record.values as number[][][];
    const position = Number(record.position);
    const scale = Math.sqrt(queries[0].length);
    const weights = queries.map((query, head) => {
      const scores = keys[head]
        .slice(0, position + 1)
        .map(
          (key) => query.reduce((sum, component, index) => sum + component * key[index], 0) / scale,
        );
      return [...softmax(scores), ...keys[head].slice(position + 1).map(() => 0)];
    });
    const headOutputs = weights.map((headWeights, head) =>
      values[head][0].map((_, dimension) =>
        headWeights.reduce(
          (sum, weight, token) => sum + weight * values[head][token][dimension],
          0,
        ),
      ),
    );
    return [
      ["query shape", `${queries.length}x${queries[0].length}`],
      ["key shape", `${keys.length}x${keys[0].length}x${keys[0][0].length}`],
      ["score scale sqrt(d_head)", Number(scale.toFixed(6))],
      ["causal mask", keys[0].map((_, index) => (index <= position ? "allow" : "mask")).join(",")],
      ["attention weights", JSON.stringify(weights)],
      ["concatenated output", JSON.stringify(headOutputs.flat())],
    ];
  },
});
