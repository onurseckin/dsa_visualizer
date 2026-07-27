import type { ReactElement } from "react";
import { Chip, Collapsible, Well } from "../index";
import type { ComplexityAnalysis, TimeComplexity } from "../../types/dsa";

export interface ComplexityCardProps {
  timeComplexity: TimeComplexity;
  spaceComplexity: string;
  complexityAnalysis: ComplexityAnalysis;
  variableState?: Record<string, string | number | boolean>;
}

export interface BigOChip {
  label: string;
  value: string;
  tone: string;
}

export function BigOChipRow({ chips }: { chips: BigOChip[] }): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Well key={chip.label} className="flex flex-col gap-1 min-w-[64px]">
          <span className="text-xs text-[var(--text-muted)]">{chip.label}</span>
          <span className="font-mono text-sm font-semibold" style={{ color: chip.tone }}>
            {chip.value}
          </span>
        </Well>
      ))}
    </div>
  );
}

export function ProseBlock({ label, body }: { label: string; body: string }): ReactElement {
  return (
    <div>
      <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">{label}</div>
      <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
    </div>
  );
}

export function ComplexityVariables({
  variableState,
}: {
  variableState?: Record<string, string | number | boolean>;
}): ReactElement | null {
  const variables = variableState ? Object.entries(variableState) : [];
  if (variables.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {variables.map(([key, value]) => (
        <Chip key={key} label={key} value={String(value)} />
      ))}
    </div>
  );
}

export function ComplexityCard({
  timeComplexity,
  spaceComplexity,
  complexityAnalysis,
  variableState,
}: ComplexityCardProps): ReactElement {
  const chips: BigOChip[] = [
    { label: "Best", value: timeComplexity.best, tone: "var(--success)" },
    { label: "Avg", value: timeComplexity.average, tone: "var(--text-primary)" },
    { label: "Worst", value: timeComplexity.worst, tone: "var(--warning)" },
    { label: "Space", value: spaceComplexity, tone: "var(--info)" },
  ];

  return (
    <Collapsible
      data-testid="complexity-card"
      title="Complexity"
      defaultOpen
      className="border-[var(--border-default)]"
    >
      <div className="flex flex-col gap-3 p-5 md:p-6">
        <BigOChipRow chips={chips} />
        <ProseBlock label="Time" body={complexityAnalysis.time} />
        <ProseBlock label="Space" body={complexityAnalysis.space} />
        <ComplexityVariables variableState={variableState} />
      </div>
    </Collapsible>
  );
}

ComplexityCard.Chips = BigOChipRow;
ComplexityCard.Prose = ProseBlock;
ComplexityCard.Variables = ComplexityVariables;
