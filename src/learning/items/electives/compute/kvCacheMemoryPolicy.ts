import { calculator } from "./shared";

export const kvCacheMemoryPolicy = calculator({
  id: "kv-cache-memory-policy",
  title: "Set a KV-Cache Memory Policy",
  topicId: "ml_transformer_internals",
  entrypoint: "size_kv_cache",
  contract:
    "Return KV-cache bytes and capacity policy from explicit dimensions; this is a memory model, not serving execution.",
  code: `def size_kv_cache(record):
    bytes_used = 2 * record["layers"] * record["tokens"] * record["batch"] * record["kv_heads"] * record["head_dim"] * record["dtype_bytes"]
    return {"bytes": bytes_used, "mebibytes": round(bytes_used / (1024 * 1024), 6), "policy": "evict-or-reject" if bytes_used > record["capacity_bytes"] else "retain"}`,
  cases: [
    {
      id: "small",
      label: "Small cache",
      input: {
        layers: 2,
        tokens: 4,
        batch: 1,
        kv_heads: 2,
        head_dim: 4,
        dtype_bytes: 2,
        capacity_bytes: 1000,
      },
      expected: { bytes: 256, mebibytes: 0.000244, policy: "retain" },
      comparison: "deep-equal",
    },
    {
      id: "capacity",
      label: "Capacity overflow",
      input: {
        layers: 2,
        tokens: 8,
        batch: 2,
        kv_heads: 2,
        head_dim: 4,
        dtype_bytes: 2,
        capacity_bytes: 1000,
      },
      expected: { bytes: 1024, mebibytes: 0.000977, policy: "evict-or-reject" },
      comparison: "deep-equal",
    },
    {
      id: "mqa",
      label: "Single KV head",
      input: {
        layers: 1,
        tokens: 16,
        batch: 1,
        kv_heads: 1,
        head_dim: 8,
        dtype_bytes: 1,
        capacity_bytes: 1000,
      },
      expected: { bytes: 256, mebibytes: 0.000244, policy: "retain" },
      comparison: "deep-equal",
    },
  ],
  source: [
    "Transformer KV-cache documentation",
    "https://huggingface.co/docs/transformers/main/cache_explanation",
  ],
  values: (r) => {
    const bytes =
      2 *
      Number(r.layers) *
      Number(r.tokens) *
      Number(r.batch) *
      Number(r.kv_heads) *
      Number(r.head_dim) *
      Number(r.dtype_bytes);
    return [
      ["KV tensor bytes", bytes],
      ["capacity bytes", Number(r.capacity_bytes)],
      ["KV heads", Number(r.kv_heads)],
      ["policy", bytes > Number(r.capacity_bytes) ? "evict-or-reject" : "retain"],
    ];
  },
});
