import React from "react";

export interface NumericalAttemptRecord {
  readonly id: string;
  readonly exerciseId: string;
  readonly title: string;
  readonly studentAnswer: number;
  readonly correctAnswer: number;
  readonly unit: string;
  readonly isCorrect: boolean;
  readonly errorPct: number;
  readonly timestamp: number;
}

export const TOPIC_PRESETS = [
  { id: "all", label: "All Topics (Full Catalog)" },
  { id: "ml_attention_causal_sdpa", label: "KV Cache Sizing (LLM Serving)" },
  { id: "ml_distributed_data_parallel_ddp", label: "Ring-AllReduce (Distributed DDP)" },
  { id: "ml_zero_stage_123_optimizer", label: "ZeRO-3 Sharding (DeepSpeed)" },
  { id: "dsa_advanced_range_queries", label: "Fenwick Tree Jump (Range Queries)" },
  { id: "ml_convolutions_im2col_gemm", label: "Im2Col Memory Expansion (Conv/GEMM)" },
] as const;

/**
 * Parses and formats LaTeX-like math strings into styled React elements.
 */
export function renderFormattedMath(mathStr: string): React.ReactNode {
  let cleaned = mathStr
    .replace(/\\times/g, " × ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\theta/g, "θ")
    .replace(/\\sigma/g, "σ")
    .replace(/\\leftarrow/g, " ← ")
    .replace(/\\rightarrow/g, " → ")
    .replace(/\\,\\&\\,/g, " & ")
    .replace(/\\&/g, "&")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");

  const parts: React.ReactNode[] = [];
  const tokenRegex =
    /([a-zA-Z0-9]+)_\{([^}]+)\}|([a-zA-Z0-9]+)_([a-zA-Z0-9]+)|([a-zA-Z0-9]+)\^\{([^}]+)\}|([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)|([^_^+]+)/g;

  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(cleaned)) !== null) {
    if (match[1] && match[2]) {
      parts.push(
        <span key={`sub_${keyIdx++}`} style={{ fontStyle: "italic" }}>
          {match[1]}
          <sub style={{ fontSize: "0.75em", marginLeft: "1px", fontStyle: "normal" }}>
            {match[2]}
          </sub>
        </span>,
      );
    } else if (match[3] && match[4]) {
      parts.push(
        <span key={`sub2_${keyIdx++}`} style={{ fontStyle: "italic" }}>
          {match[3]}
          <sub style={{ fontSize: "0.75em", marginLeft: "1px", fontStyle: "normal" }}>
            {match[4]}
          </sub>
        </span>,
      );
    } else if (match[5] && match[6]) {
      parts.push(
        <span key={`sup_${keyIdx++}`} style={{ fontStyle: "italic" }}>
          {match[5]}
          <sup style={{ fontSize: "0.75em", marginLeft: "1px", fontStyle: "normal" }}>
            {match[6]}
          </sup>
        </span>,
      );
    } else if (match[7] && match[8]) {
      parts.push(
        <span key={`sup2_${keyIdx++}`} style={{ fontStyle: "italic" }}>
          {match[7]}
          <sup style={{ fontSize: "0.75em", marginLeft: "1px", fontStyle: "normal" }}>
            {match[8]}
          </sup>
        </span>,
      );
    } else if (match[9]) {
      parts.push(<span key={`txt_${keyIdx++}`}>{match[9]}</span>);
    }
  }

  return (
    <span
      data-testid="math-formatted-badge"
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        background: "rgba(56, 189, 248, 0.12)",
        color: "#38bdf8",
        border: "1px solid rgba(56, 189, 248, 0.28)",
        borderRadius: "4px",
        padding: "1px 5px",
        margin: "0 2px",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "0.92em",
        fontWeight: 600,
      }}
    >
      {parts.length > 0 ? parts : cleaned}
    </span>
  );
}

/**
 * Renders problem prompt text with embedded LaTeX inline math expressions.
 */
export function renderRichProblemText(text: string): React.ReactNode {
  const chunks = text.split("$");
  return (
    <span>
      {chunks.map((chunk, idx) => {
        if (idx % 2 === 1) {
          return <React.Fragment key={idx}>{renderFormattedMath(chunk)}</React.Fragment>;
        }
        const lines = chunk.split("\n");
        return (
          <React.Fragment key={idx}>
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {line.startsWith("- ") ? (
                  <span
                    style={{
                      display: "block",
                      paddingLeft: "12px",
                      marginTop: "4px",
                      color: "#cbd5e1",
                    }}
                  >
                    • {line.slice(2)}
                  </span>
                ) : (
                  line
                )}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}
    </span>
  );
}
