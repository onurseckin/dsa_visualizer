import type { CheckReport } from "../core/index.ts";
import { sortViolations } from "./json.ts";

export function renderMarkdownReport(report: CheckReport): string {
  if (report.mode === "ratchet") {
    const added = sortViolations(report.baselineDelta.added)
      .map((v) => `- added ${v.rule}: \`${v.path}\` (${v.observed}) — ${v.detail}`)
      .join("\n");
    const worsened = sortViolations(report.baselineDelta.worsened)
      .map((v) => `- worsened ${v.rule}: \`${v.path}\` (${v.observed}) — ${v.detail}`)
      .join("\n");
    const resolved = sortViolations(report.baselineDelta.resolved)
      .map((v) => `- resolved ${v.rule}: \`${v.path}\` — ${v.detail}`)
      .join("\n");

    const sections: string[] = [];
    if (added.length > 0) sections.push(`### Added violations (blocking)\n${added}`);
    if (worsened.length > 0) sections.push(`### Worsened violations (blocking)\n${worsened}`);
    if (resolved.length > 0) sections.push(`### Resolved violations (improved)\n${resolved}`);

    const status = report.passed ? "passed" : "failed";
    const body =
      sections.length > 0
        ? sections.join("\n\n")
        : `No new or worsened violations. (Baseline: ${report.violations.length} violations tracked)`;
    return `# Modularity report\n\nStatus: ${status}\n\n${body}\n`;
  }

  const findings = sortViolations(report.violations)
    .map((violation) => `- ${violation.rule}: \`${violation.path}\` — ${violation.detail}`)
    .join("\n");
  const content = findings.length > 0 ? findings : "No violations.";
  const status = report.passed ? "passed" : "failed";
  return `# Modularity report\n\nStatus: ${status}\n\n${content}\n`;
}
