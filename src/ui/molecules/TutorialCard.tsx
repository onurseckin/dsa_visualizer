import React from "react";
import { GraduationCap } from "lucide-react";
import { Card } from "../index";

export interface TutorialCardProps {
  narrative?: string;
  stepIndex?: number;
  totalSteps?: number;
}

const PROSE: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-md)",
  lineHeight: 1.6,
  color: "var(--text-secondary)",
};

export const hasTutorialContent = (narrative?: string): boolean => Boolean(narrative?.trim());

export const TutorialCard: React.FC<TutorialCardProps> = ({ narrative, stepIndex, totalSteps }) => {
  const prose = narrative?.trim() ?? "";

  if (!prose) return null;

  const displayStep = stepIndex !== undefined ? stepIndex + 1 : undefined;
  const stepLabel =
    displayStep !== undefined
      ? `Step ${displayStep}${totalSteps !== undefined ? ` of ${totalSteps}` : ""}`
      : undefined;

  return (
    <Card
      data-testid="tutorial-card"
      className="h-full min-h-[160px] overflow-visible border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface)] flex flex-col"
    >
      <Card.Body className="py-3 px-4 flex flex-col justify-start gap-2 min-w-0 flex-1">
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
          {prose}
        </p>
      </Card.Body>
    </Card>
  );
};

export default TutorialCard;
