import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface SentencepieceByteFallbackEncoderInput {
  text: string;
  subwordVocab: Record<string, number>;
}

export const DEFAULT_SENTENCEPIECE_BYTE_FALLBACK_INPUT: SentencepieceByteFallbackEncoderInput = {
  text: "hi 🚀",
  subwordVocab: {
    hi: 101,
    " ": 102,
  },
};

export const SENTENCEPIECE_BYTE_FALLBACK_CODE = `def sentencepiece_byte_fallback_encode(text: str, subword_vocab: dict[str, int]) -> list[str]:
    """
    SentencePiece Byte-Fallback Subword Encoder.
    Attempts to match subword tokens from vocabulary.
    When an Out-of-Vocabulary (OOV) character or emoji (e.g. '🚀') is encountered,
    falls back to raw UTF-8 byte tokens '<0xXX>'.
    """
    tokens = []
    idx = 0

    while idx < len(text):
        matched = False
        # Try greedy subword match
        for l in range(min(10, len(text) - idx), 0, -1):
            sub = text[idx : idx + l]
            if sub in subword_vocab:
                tokens.append(sub)
                idx += l
                matched = True
                break

        if not matched:
            # Fall back to raw UTF-8 byte representation for OOV char
            oov_char = text[idx]
            utf8_bytes = oov_char.encode("utf-8")
            for b in utf8_bytes:
                tokens.append(f"<0x{b:02X}>")
            idx += 1

    return tokens`;

export const generateByteFallbackSteps = (
  input: SentencepieceByteFallbackEncoderInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, subwordVocab } = input;
  let stepIndex = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize SentencePiece Byte-Fallback Subword Encoder",
      why: `Encoding text "${text}" using subword vocabulary with ${Object.keys(subwordVocab).length} tokens and UTF-8 byte fallback.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: text.split("").map((ch, idx) => ({
        id: `c-${idx}`,
        value: idx,
        label: `'${ch}'`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        subwordVocabSize: String(Object.keys(subwordVocab).length),
        status: "Initialized",
      },
    },
    variables: { textLen: text.length },
  });

  const tokens: string[] = [];
  let idx = 0;

  while (idx < text.length) {
    let matched = false;

    for (let l = Math.min(10, text.length - idx); l > 0; l--) {
      const sub = text.substring(idx, idx + l);
      if (sub in subwordVocab) {
        tokens.push(sub);
        matched = true;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 16,
          explanation: {
            what: `Subword Match: "${sub}" (Token ID ${subwordVocab[sub]})`,
            why: `Matched vocabulary subword token "${sub}" at position ${idx}.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: text.split("").map((ch, i) => ({
              id: `c-${i}`,
              value: i,
              label: `'${ch}'`,
              state:
                i >= idx && i < idx + l
                  ? ("active" as ElementState)
                  : i < idx
                    ? ("visited" as ElementState)
                    : ("default" as ElementState),
              pointers: i === idx ? [`Token "${sub}"`] : [],
            })),
          },
          auxiliaryState: {
            customState: {
              type: "Subword Match",
              matchedToken: `"${sub}"`,
              tokenId: String(subwordVocab[sub]),
            },
          },
          variables: { idx, matchedToken: sub },
        });

        idx += l;
        break;
      }
    }

    if (!matched) {
      const oovChar = text[idx];
      const utf8Bytes = Array.from(Buffer.from(oovChar, "utf-8"));
      const byteTokens: string[] = [];

      for (const b of utf8Bytes) {
        const bTok = `<0x${b.toString(16).toUpperCase().padStart(2, "0")}>`;
        tokens.push(bTok);
        byteTokens.push(bTok);
      }

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 24,
        explanation: {
          what: `OOV Character '${oovChar}': Byte Fallback Triggered`,
          why: `Character '${oovChar}' not in subword vocabulary. Converted to ${utf8Bytes.length} raw UTF-8 byte tokens: [${byteTokens.join(
            ", ",
          )}].`,
        },
        primarySnapshot: {
          kind: "array",
          elements: text.split("").map((ch, i) => ({
            id: `c-${i}`,
            value: i,
            label: `'${ch}'`,
            state:
              i === idx
                ? ("highlighted" as ElementState)
                : i < idx
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
            pointers: i === idx ? [`Byte Fallback [${byteTokens.join(",")}]`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            type: "Byte Fallback (OOV)",
            oovCharacter: `'${oovChar}'`,
            generatedByteTokens: byteTokens.join(", "),
          },
        },
        variables: { idx, oovChar, byteCount: utf8Bytes.length },
      });

      idx += 1;
    }
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 27,
    explanation: {
      what: `SentencePiece Encoding Complete: Produced ${tokens.length} Tokens`,
      why: `Final token sequence: [${tokens.map((t) => `"${t}"`).join(", ")}]. 100% loss-free encoding achieved.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: tokens.map((tok, rank) => ({
        id: `res-${rank}`,
        value: rank,
        label: `"${tok}"`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        finalTokens: tokens.map((t) => `"${t}"`).join(" + "),
        totalTokens: String(tokens.length),
        status: "Completed",
      },
    },
    variables: { totalTokens: tokens.length, complete: true },
  });

  return steps;
};

export const sentencepieceByteFallbackEncoder: AlgorithmDefinition<SentencepieceByteFallbackEncoderInput> =
  {
    id: "sentencepieceByteFallbackEncoder",
    title: "SentencePiece Byte-Fallback Subword Encoder",
    category: "ml_tokenization",
    categories: ["ml_tokenization"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tokenization",
    description:
      "Executes SentencePiece byte-fallback subword encoding (Kudo & Richardson, 2018). Greedily matches subword tokens from vocabulary. When an Out-of-Vocabulary (OOV) character or rare emoji is encountered, the algorithm decomposes the character into its underlying UTF-8 byte representation, emitting byte tokens `<0xXX>` to ensure zero UNK token losses.\n\nInput Format:\n- text: Input text string.\n- subwordVocab: Subword token vocabulary dictionary.\n\nOutput Format:\n- Returns list of token strings `[t_1, t_2, ..., t_K]`.\n\nEdge Cases & Constraints:\n- OOV Emoji / CJK characters: Gracefully decomposes into 3-4 byte tokens `<0xXX>`.",
    constraints: ["subwordVocab keys are valid UTF-8 subword strings."],
    examples: [
      {
        kind: "basic",
        title: "Subword Match with Emoji Byte-Fallback",
        inputDisplay: "text = 'hi 🚀', subwordVocab = {'hi': 101, ' ': 102}",
        outputDisplay: "Tokens: ['hi', ' ', '<0xF0>', '<0x9F>', '<0x9A>', '<0x80>']",
        input: DEFAULT_SENTENCEPIECE_BYTE_FALLBACK_INPUT,
        output: "6 tokens (2 subwords + 4 byte tokens)",
        explanation:
          "Matches subwords 'hi' and ' ', then decomposes rocket emoji 🚀 into 4 UTF-8 byte tokens.",
      },
      {
        kind: "complex",
        title: "All Subwords Matched",
        inputDisplay: "text = 'hi '",
        outputDisplay: "Tokens: ['hi', ' ']",
        input: { text: "hi ", subwordVocab: { hi: 101, " ": 102 } },
        output: "['hi', ' ']",
        explanation: "No OOV fallback required.",
      },
      {
        kind: "negative",
        title: "Complete OOV Text",
        inputDisplay: "text = 'abc', empty subwordVocab",
        outputDisplay: "Byte tokens for 'a', 'b', 'c'",
        input: { text: "abc", subwordVocab: {} },
        output: "['<0x61>', '<0x62>', '<0x63>']",
        explanation: "All characters fall back to raw ASCII byte tokens.",
      },
    ],
    defaultInput: DEFAULT_SENTENCEPIECE_BYTE_FALLBACK_INPUT,
    code: SENTENCEPIECE_BYTE_FALLBACK_CODE,
    timeComplexity: {
      best: "O(N * L_max)",
      average: "O(N * L_max)",
      worst: "O(N * L_max)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N * L_max) greedy prefix match scan time where N is text length and L_max is max token length.",
      space: "O(N) auxiliary space for final token array.",
    },
    topicGuide: {
      overview:
        "SentencePiece (Kudo & Richardson 2018, Google) revolutionized multilingual NLP by introducing Byte-Fallback. Before SentencePiece, unknown words were replaced with `<unk>` lossy tokens, destroying information. Byte-Fallback retains 100% loss-free reversible tokenization.",
      sections: [
        {
          heading: "Core Concept & Reversible UTF-8 Fallback",
          body: "If a Unicode code point is not present in the vocabulary, it is encoded as a sequence of `<0xXX>` byte tokens representing its UTF-8 payload (1 to 4 bytes).",
        },
        {
          heading: "Language-Independent Subword Tokenization",
          body: "SentencePiece treats input as a raw byte stream without requiring language-specific word segmentation scripts (like MeCab for Japanese or Jieba for Chinese).",
        },
        {
          heading: "Reversibility & Decoding",
          body: "Decoding replaces byte tokens `<0xXX>` with raw bytes, reconstructs UTF-8 character strings, and removes whitespace marker `_`.",
        },
      ],
      keyTerms: [
        {
          term: "Byte-Fallback",
          definition:
            "Decomposing OOV characters into UTF-8 byte tokens to prevent `<unk>` token loss.",
        },
        {
          term: "SentencePiece",
          definition: "Google's language-independent subword tokenizer library.",
        },
        {
          term: "Lossless Reversibility",
          definition:
            "Property ensuring tokenized output can be decoded back to exact original input byte-for-byte.",
        },
      ],
    },
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "SentencePiece Byte-Fallback (Kudo & Richardson EMNLP 2018)",
      },
    ],
    generateSteps: generateByteFallbackSteps,
  };
