import React from "react";

const PYTHON_KEYWORDS = new Set([
  "def",
  "return",
  "if",
  "else",
  "elif",
  "for",
  "while",
  "in",
  "and",
  "or",
  "not",
  "is",
  "True",
  "False",
  "None",
  "import",
  "from",
  "as",
  "class",
  "raise",
  "try",
  "except",
  "yield",
  "pass",
  "with",
  "lambda",
  "global",
  "nonlocal",
  "break",
  "continue",
]);

const PYTHON_BUILTINS = new Set([
  "int",
  "str",
  "list",
  "dict",
  "set",
  "bool",
  "float",
  "tuple",
  "len",
  "range",
  "print",
  "enumerate",
  "zip",
  "max",
  "min",
  "sum",
  "abs",
  "sorted",
  "map",
  "filter",
  "any",
  "all",
  "super",
  "self",
  "append",
  "pop",
  "add",
  "remove",
]);

export function highlightPythonLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    if (line[i] === "#") {
      nodes.push(
        <span key={i} className="text-[var(--text-muted)] italic">
          {line.slice(i)}
        </span>,
      );
      break;
    }

    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let end = i + 1;
      while (end < len && (line[end] !== quote || line[end - 1] === "\\")) {
        end++;
      }
      if (end < len) end++;
      nodes.push(
        <span key={i} className="text-[#86efac]">
          {line.slice(i, end)}
        </span>,
      );
      i = end;
      continue;
    }

    if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z_]/.test(line[i - 1]))) {
      let end = i;
      while (end < len && /[\d.xXa-fA-F]/.test(line[end])) {
        end++;
      }
      nodes.push(
        <span key={i} className="text-[#fb923c]">
          {line.slice(i, end)}
        </span>,
      );
      i = end;
      continue;
    }

    if (/[a-zA-Z_]/.test(line[i])) {
      let end = i;
      while (end < len && /[a-zA-Z0-9_]/.test(line[end])) {
        end++;
      }
      const token = line.slice(i, end);

      let prevDef = false;
      let p = i - 1;
      while (p >= 0 && /\s/.test(line[p])) p--;
      if (
        p >= 2 &&
        line.slice(p - 2, p + 1) === "def" &&
        (p - 3 < 0 || !/[a-zA-Z0-9_]/.test(line[p - 3]))
      ) {
        prevDef = true;
      }

      if (PYTHON_KEYWORDS.has(token)) {
        nodes.push(
          <span key={i} className="text-[#c084fc] font-semibold">
            {token}
          </span>,
        );
      } else if (prevDef) {
        nodes.push(
          <span key={i} className="text-[#facc15] font-semibold">
            {token}
          </span>,
        );
      } else if (PYTHON_BUILTINS.has(token)) {
        nodes.push(
          <span key={i} className="text-[#38bdf8]">
            {token}
          </span>,
        );
      } else {
        nodes.push(
          <span key={i} className="text-[#e4e4e7]">
            {token}
          </span>,
        );
      }
      i = end;
      continue;
    }

    if (/[=+\-*/%<>&|^~:;,!.]/.test(line[i])) {
      nodes.push(
        <span key={i} className="text-[#94a3b8]">
          {line[i]}
        </span>,
      );
      i++;
      continue;
    }

    nodes.push(line[i]);
    i++;
  }

  return nodes;
}
