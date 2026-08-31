import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_subword_bpe_tiktoken_c2_p2",
  pageNumber: 3,
  title: "Mathematical Proofs: BPE Compression Bounds & Inversion Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Byte-Level BPE Reversibility and Bijective Decoding Invariant",
      theorem:
        "For any valid Byte-Level BPE tokenizer with base vocabulary $\\Sigma_0 = \\{0x00, 0x01, \\dots, 0xFF\\}$, the decoding function $\\text{Decode}: \\mathbb{N}^* \\to \\text{Bytes}$ is an exact left-inverse of the encoding function $\\text{Encode}: \\text{Bytes} \\to \\mathbb{N}^*$: $\\text{Decode}(\\text{Encode}(B)) = B$ for every byte sequence $B \\in \\{0, \\dots, 255\\}^*$.",
      proof:
        "1. Token Decomposition:\\nBy definition, every token ID $t \\in \\mathcal{V}$ corresponds to a uniquely defined contiguous byte sequence $S(t) \\in \\Sigma_0^+$.\\n\\n2. Encoding Partitioning:\\nLet $B = (b_1, b_2, \\dots, b_N)$ be an arbitrary byte sequence.\\nThe encoding process $\\text{Encode}(B)$ produces a sequence of token IDs $(t_1, t_2, \\dots, t_M)$ by repeatedly merging adjacent pairs. At every merge step, the concatenation of the strings represented by the active tokens is strictly invariant:\\n$$S(t_1) \\circ S(t_2) \\circ \\dots \\circ S(t_M) = (b_1, b_2, \\dots, b_N) = B$$\\n\\n3. Decoding Reconstruction:\\nThe decoding function simply performs string concatenation: $\\text{Decode}(t_1, \\dots, t_M) = S(t_1) \\circ S(t_2) \\circ \\dots \\circ S(t_M)$.\\n\\n4. Conclusion:\\n$\\text{Decode}(\\text{Encode}(B)) = B$ identically, proving that Byte-Level BPE is strictly lossless with zero information distortion or out-of-vocabulary fallback errors.",
    },
    {
      type: "math_proof",
      title: "Asymptotic Bound on Token Compression Ratio",
      theorem:
        "Let a natural language corpus have character entropy rate $H$ bits/byte. For a BPE vocabulary of size $V = 2^{b}$ with average token length $\\bar{L}$ bytes, the theoretical compression ratio $R = \\frac{\\text{Total Bytes}}{\\text{Total Tokens}}$ satisfies $R \\le \\frac{b}{H}$, reaching the fundamental Shannon entropy limit as vocabulary size $V \\to \\infty$.",
      proof:
        "1. Shannon Source Coding Theorem:\\nThe minimum average bits required to encode a byte of text without loss is bounded by the empirical entropy $H$ bits/byte.\\n\\n2. Bits per Token:\\nA vocabulary of size $V$ requires $\\log_2 V = b$ bits to represent each token ID.\\n\\n3. Compression Ratio:\\nLet $\\bar{L}$ be the average number of bytes compressed into a single token ID. The total bits required per token is $b$, representing $\\bar{L} \\cdot H$ bits of underlying entropy.\\nTo avoid violating Shannon's Source Coding Theorem:\\n$$b \\ge \\bar{L} \\cdot H \\implies \\bar{L} = R \\le \\frac{b}{H}$$\\nFor English text with $H \\approx 1.3$ bits/byte and $V = 100{,}000$ ($b \\approx 16.6$ bits), the theoretical maximum compression ratio is $R_{\\max} = \\frac{16.6}{1.3} \\approx 12.7$ bytes/token. In practice, due to subword frequency tails and regex isolation boundaries, Byte-Level BPE achieves $R \\approx 4.0\\text{-}4.5$ bytes/token.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
