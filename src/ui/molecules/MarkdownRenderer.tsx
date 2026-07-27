import React from "react";

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Format inline LaTeX/math string into clean HTML/JSX
 */
function renderInlineMath(text: string): React.ReactNode[] {
  // Regex to split by inline math $...$ or \(...\)
  const mathRegex = /(\$[^$]+\$|\\\([^)]+\\\))/g;
  const parts = text.split(mathRegex);

  return parts.map((part, index) => {
    if (
      (part.startsWith("$") && part.endsWith("$") && part.length > 1) ||
      (part.startsWith("\\(") && part.endsWith("\\)"))
    ) {
      const rawMath = part.startsWith("$")
        ? part.slice(1, -1)
        : part.slice(2, -2);
      return (
        <span
          key={`math-${index}`}
          className="inline-math font-mono text-[0.95em] px-1 py-0.5 rounded bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--accent-text,var(--text-primary))] font-semibold"
          title={rawMath}
        >
          {formatMathSymbol(rawMath)}
        </span>
      );
    }

    return renderFormatting(part, `fmt-${index}`);
  });
}

/**
 * Replace common LaTeX commands with unicode / clean symbols
 */
function formatMathSymbol(mathStr: string): string {
  let res = mathStr;
  res = res.replace(/\\text\{([^}]+)\}/g, "$1");
  res = res.replace(/\\mathrm\{([^}]+)\}/g, "$1");
  res = res.replace(/\\mathcal\{([^}]+)\}/g, "$1");
  res = res.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");
  res = res.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");
  res = res.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, "∑($1..$2)");
  res = res.replace(/\\sum/g, "∑");
  res = res.replace(/\\prod/g, "∏");
  res = res.replace(/\\le|\\leq/g, "≤");
  res = res.replace(/\\ge|\\geq/g, "≥");
  res = res.replace(/\\neq/g, "≠");
  res = res.replace(/\\approx/g, "≈");
  res = res.replace(/\\times/g, "×");
  res = res.replace(/\\cdot/g, "·");
  res = res.replace(/\\infty/g, "∞");
  res = res.replace(/\\in/g, "∈");
  res = res.replace(/\\notin/g, "∉");
  res = res.replace(/\\subset/g, "⊂");
  res = res.replace(/\\cup/g, "∪");
  res = res.replace(/\\cap/g, "∩");
  res = res.replace(/\\alpha/g, "α");
  res = res.replace(/\\beta/g, "β");
  res = res.replace(/\\gamma/g, "γ");
  res = res.replace(/\\lambda/g, "λ");
  res = res.replace(/\\theta/g, "θ");
  res = res.replace(/\\pi/g, "π");
  res = res.replace(/\\sigma/g, "σ");
  res = res.replace(/\\omega/g, "ω");
  res = res.replace(/\\Delta/g, "Δ");
  res = res.replace(/\\dots|\\ldots|\\cdots/g, "…");
  return res;
}

/**
 * Render bold, italic, code formatting inside text
 */
function renderFormatting(text: string, keyPrefix: string): React.ReactNode {
  // Simple regex parser for `code`, **bold**, *italic*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
  const parts = text.split(tokenRegex);

  if (parts.length === 1) return text;

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-primary)] border border-[var(--border-default)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return (
        <em key={key} className="italic text-[var(--text-primary)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
  style,
}) => {
  if (!content) return null;

  // Split by double newline or block quotes / headers / math blocks
  const blocks = content.split(/\n\s*\n/);

  return (
    <div
      data-testid="markdown-container"
      className={`markdown-body flex flex-col gap-4 text-base leading-relaxed text-[var(--text-secondary)] ${className}`}
      style={style}
    >
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Display Math Block $$...$$ or \[...\]
        if (
          (trimmed.startsWith("$$") && trimmed.endsWith("$$")) ||
          (trimmed.startsWith("\\[") && trimmed.endsWith("\\]"))
        ) {
          const rawMath = trimmed.startsWith("$$")
            ? trimmed.slice(2, -2).trim()
            : trimmed.slice(2, -2).trim();
          return (
            <div
              key={`block-${bIdx}`}
              data-testid="math-block"
              className="my-2 p-4 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-default)] text-center font-mono text-base text-[var(--text-primary)] overflow-x-auto"
            >
              {formatMathSymbol(rawMath)}
            </div>
          );
        }

        // Headers: ###, ##, #
        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={`block-${bIdx}`}
              className="m-0 mt-3 text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-1"
            >
              {renderInlineMath(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={`block-${bIdx}`}
              className="m-0 mt-4 text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-1"
            >
              {renderInlineMath(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={`block-${bIdx}`}
              className="m-0 mt-4 text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-1.5"
            >
              {renderInlineMath(trimmed.slice(2))}
            </h1>
          );
        }

        // Bullet lists
        if (trimmed.split("\n").every((line) => line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim().startsWith("1. ") || line.trim().startsWith("2. ") || line.trim().startsWith("3. ") || line.trim().startsWith("4. "))) {
          const lines = trimmed.split("\n");
          const isOrdered = lines[0].trim().match(/^\d+\./);
          const ListTag = isOrdered ? "ol" : "ul";
          return (
            <ListTag
              key={`block-${bIdx}`}
              className={`m-0 pl-5 space-y-1.5 ${isOrdered ? "list-decimal" : "list-disc"}`}
            >
              {lines.map((line, lIdx) => {
                const cleanLine = line.trim().replace(/^(-\s*|\*\s*|\d+\.\s*)/, "");
                return (
                  <li key={`line-${lIdx}`} className="text-base leading-relaxed">
                    {renderInlineMath(cleanLine)}
                  </li>
                );
              })}
            </ListTag>
          );
        }

        // Default Paragraph
        return (
          <p key={`block-${bIdx}`} className="m-0 text-base leading-relaxed">
            {renderInlineMath(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownRenderer;
