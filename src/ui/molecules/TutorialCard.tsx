import React from "react";
import { GraduationCap, X } from "lucide-react";
import { Card, IconButton } from "../../ui";
import { StepExplanation } from "../../types/dsa";

export interface TutorialCardProps {
  explanation?: StepExplanation;
  what?: string;
  why?: string;
  stepIndex?: number;
  totalSteps?: number;
  onClose?: () => void;
}

const PROSE: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-md)",
  lineHeight: 1.6,
  color: "var(--text-secondary)",
  minHeight: "calc(var(--text-md) * 1.6 * 2)",
};

export const hasTutorialContent = (
  explanation?: StepExplanation,
  what?: string,
  why?: string,
): boolean =>
  Boolean((what || explanation?.what || "").trim() || (why || explanation?.why || "").trim());

const STRIP: React.CSSProperties = {
  background: "transparent",
  borderWidth: 0,
  borderRadius: 0,
  boxShadow: "none",
};

export const TutorialCard: React.FC<TutorialCardProps> = ({
  explanation,
  what,
  why,
  stepIndex,
  totalSteps,
  onClose,
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
      style={STRIP}
      className="h-full overflow-auto bg-[var(--bg-surface)]"
    >
      <Card.Body className="p-6 md:p-8 flex flex-col gap-2 min-w-0">
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

          {onClose && (
            <IconButton
              icon={<X />}
              aria-label="Hide tutorial"
              title="Dismiss explanation"
              onClick={onClose}
            >
              <span className="sr-only">Dismiss explanation</span>
            </IconButton>
          )}
        </div>

        <p style={PROSE}>
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
