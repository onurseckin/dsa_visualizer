import React from "react";
import { GraduationCap } from "lucide-react";
import { Card } from "../index";
import { StepExplanation } from "../../types/dsa";

export interface TutorialCardProps {
  explanation?: StepExplanation;
  what?: string;
  why?: string;
  stepIndex?: number;
  totalSteps?: number;
}

const PROSE: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-md)",
  lineHeight: 1.6,
  color: "var(--text-secondary)",
};

export const hasTutorialContent = (
  explanation?: StepExplanation,
  what?: string,
  why?: string,
): boolean =>
  Boolean((what || explanation?.what || "").trim() || (why || explanation?.why || "").trim());

export const TutorialCard: React.FC<TutorialCardProps> = ({
  explanation,
  what,
  why,
  stepIndex,
  totalSteps,
}) => {
  const whatText = (what || explanation?.what || "").trim();
  const whyText = (why || explanation?.why || "").trim();

  if (!whatText && !whyText) return null;

  const lead = whatText && !/[.!?:]$/.test(whatText) ? `${whatText}.` : whatText;

  const stepLabel =
    stepIndex !== undefined
      ? `Step ${stepIndex + 1}${totalSteps !== undefined ? ` of ${totalSteps}` : ""}`
      : undefined;

  return (
    <Card
      data-testid="tutorial-card"
      className="h-auto min-h-fit overflow-visible border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface)]"
    >
      <Card.Body className="py-2 px-4 flex flex-col gap-1.5 min-w-0">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            minWidth: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{ display: "inline-flex", flexShrink: 0, color: "var(--text-secondary)" }}
          >
            <GraduationCap size={16} />
          </span>

          {stepLabel && (
            <span
              style={{
                flexShrink: 0,
                fontSize: "var(--text-md)",
                fontWeight: 600,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {stepLabel}
            </span>
          )}

          <div style={{ flex: 1, minWidth: 0 }} />
        </div>

        <p style={PROSE} className="whitespace-normal break-words leading-relaxed">
          {lead && (
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{lead}</strong>
          )}
          {lead && whyText ? " " : ""}
          {whyText}
        </p>
      </Card.Body>
    </Card>
  );
};

export default TutorialCard;
