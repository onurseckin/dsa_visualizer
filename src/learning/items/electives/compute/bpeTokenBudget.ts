import { trace } from "./shared";

function applyVisualMerges(symbols: string[], merges: readonly (readonly [string, string])[]) {
  const tokens = [...symbols];
  const applied: string[] = [];
  for (const [left, right] of merges) {
    let index = 0;
    while (index < tokens.length - 1) {
      if (tokens[index] === left && tokens[index + 1] === right) {
        const merged = left + right;
        tokens.splice(index, 2, merged);
        applied.push(`${left}+${right}->${merged}`);
      } else {
        index += 1;
      }
    }
  }
  return { tokens, applied };
}

export const bpeTokenBudget = trace({
  id: "bpe-token-budget",
  title: "Trace BPE Token Budget",
  topicId: "ml_transformer_internals",
  entrypoint: "estimate_token_budget",
  contract:
    "Apply an explicitly versioned ordered BPE merge table to input text, using UTF-8 byte fallback when requested, then return merge history and context-budget accounting; this is an illustrative vocabulary.",
  code: `def estimate_token_budget(record):
    symbols = []
    for character in record["text"]:
        if record["byte_fallback"] and ord(character) > 127:
            symbols.extend(f"<0x{byte:02x}>" for byte in character.encode("utf-8"))
        else:
            symbols.append(character)
    initial = list(symbols)
    applied = []
    for left, right in record["merges"]:
        index = 0
        while index < len(symbols) - 1:
            if symbols[index] == left and symbols[index + 1] == right:
                merged = left + right
                symbols[index:index + 2] = [merged]
                applied.append(f"{left}+{right}->{merged}")
            else:
                index += 1
    return {"initial_symbols": initial, "tokens": symbols, "applied_merges": applied, "token_count": len(symbols), "byte_count": len(record["text"].encode("utf-8")), "remaining_context": record["context_limit"] - len(symbols), "vocab_version": record["vocab_version"]}`,
  cases: [
    {
      id: "ordered-merges",
      label: "Ordered merge table",
      input: {
        text: "abab",
        merges: [
          ["a", "b"],
          ["ab", "ab"],
        ],
        vocab_version: "demo-v1",
        byte_fallback: false,
        context_limit: 4,
      },
      expected: {
        initial_symbols: ["a", "b", "a", "b"],
        tokens: ["abab"],
        applied_merges: ["a+b->ab", "a+b->ab", "ab+ab->abab"],
        token_count: 1,
        byte_count: 4,
        remaining_context: 3,
        vocab_version: "demo-v1",
      },
      comparison: "deep-equal",
    },
    {
      id: "utf8-byte-fallback",
      label: "UTF-8 byte fallback",
      input: {
        text: "café",
        merges: [
          ["c", "a"],
          ["ca", "f"],
        ],
        vocab_version: "demo-v2",
        byte_fallback: true,
        context_limit: 4,
      },
      expected: {
        initial_symbols: ["c", "a", "f", "<0xc3>", "<0xa9>"],
        tokens: ["caf", "<0xc3>", "<0xa9>"],
        applied_merges: ["c+a->ca", "ca+f->caf"],
        token_count: 3,
        byte_count: 5,
        remaining_context: 1,
        vocab_version: "demo-v2",
      },
      comparison: "deep-equal",
    },
    {
      id: "no-merge-budget",
      label: "No matching merges",
      input: {
        text: "abc",
        merges: [["x", "y"]],
        vocab_version: "demo-v3",
        byte_fallback: false,
        context_limit: 3,
      },
      expected: {
        initial_symbols: ["a", "b", "c"],
        tokens: ["a", "b", "c"],
        applied_merges: [],
        token_count: 3,
        byte_count: 3,
        remaining_context: 0,
        vocab_version: "demo-v3",
      },
      comparison: "deep-equal",
    },
  ],
  source: ["SentencePiece tokenizer paper", "https://aclanthology.org/D18-2012/"],
  values: (record) => {
    const byteFallback = Boolean(record.byte_fallback);
    const initial = Array.from(String(record.text)).flatMap((character) =>
      byteFallback && character.codePointAt(0)! > 127
        ? Array.from(new TextEncoder().encode(character), (byte) => `<0x${byte.toString(16)}>`)
        : [character],
    );
    const { tokens, applied } = applyVisualMerges(
      initial,
      record.merges as readonly (readonly [string, string])[],
    );
    return [
      ["vocabulary version", String(record.vocab_version)],
      ["initial symbols", initial.join("|")],
      ["applied merges", applied.join(",") || "none"],
      ["tokens", tokens.join("|")],
      ["UTF-8 bytes", new TextEncoder().encode(String(record.text)).length],
      ["remaining context", Number(record.context_limit) - tokens.length],
    ];
  },
});
