import type { CoursePage } from "../../../../courseTypes";

export const page_01_systems_scenarios: CoursePage = {
  id: "ml_subword_bpe_tiktoken_c2_p1_systems",
  pageNumber: 2,
  title: "Silicon Scenarios: Streaming Multi-Threaded Ingestion & Tokenizer Fuzzing",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Production System Scenario: Multi-Threaded Terabyte Pretraining Ingestion",
      content:
        "When preparing 15 Terabytes of diverse web crawl data (Common Crawl / FineWeb), Python-based tokenizers (like standard HuggingFace `PreTrainedTokenizer`) require weeks of processing time due to the Python GIL. By deploying Tiktoken in Rust with zero-allocation memory slices and chunked thread parallelism across 128 CPU cores, tokenization throughput reaches **850 MB/sec**, converting 15TB of raw text into binary integer memmapped tensors in under 5 hours.",
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_subword_bpe_utf8_split",
      title: "Multi-Byte UTF-8 Streaming Chunk Boundary Validator",
      difficulty: "Hard",
      rationale:
        "Implement a streaming chunk boundary split detector that guarantees no 4-byte UTF-8 character (e.g. Emoji 0xF0 0x9F 0x94 0xA5) is sliced across chunk boundaries.",
      starterCode: `def find_safe_utf8_split_boundary(byte_buffer: bytes, target_chunk_size: int) -> int:
    """
    Finds the largest byte offset <= target_chunk_size that does not sever a multi-byte UTF-8 character.
    UTF-8 continuation bytes have top bits 10xxxxxx (0x80 to 0xBF).
    """
    if target_chunk_size >= len(byte_buffer):
        return len(byte_buffer)
    # Search backwards from target_chunk_size
    offset = target_chunk_size
    while offset > 0 and (byte_buffer[offset] & 0xC0) == 0x80:
        offset -= 1
    return offset`,
    },
  ],
};

export const page2 = page_01_systems_scenarios;
