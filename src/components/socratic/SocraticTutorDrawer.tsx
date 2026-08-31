import React, { useEffect, useRef, useState } from "react";
import {
  createSocraticSession,
  processStudentTurn,
  SessionSummaryReport,
  SocraticDialogueTurn,
  SocraticSessionState,
  summarizeSession,
} from "../../curriculum/adaptiveTutor";

export interface SocraticTutorDrawerProps {
  readonly topicId: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCompleteSession?: (summary: SessionSummaryReport) => void;
  readonly initialCustomPrompt?: string;
}

export const SocraticTutorDrawer: React.FC<SocraticTutorDrawerProps> = ({
  topicId,
  isOpen,
  onClose,
  onCompleteSession,
}) => {
  const [session, setSession] = useState<SocraticSessionState>(() =>
    createSocraticSession(topicId),
  );
  const [studentInput, setStudentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryReport, setSummaryReport] = useState<SessionSummaryReport | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Re-initialize when topicId changes
  useEffect(() => {
    if (topicId) {
      const newSession = createSocraticSession(topicId);
      setSession(newSession);
      setSummaryReport(null);
      setStudentInput("");
    }
  }, [topicId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.conversationHistory.length, session.isComplete]);

  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (!studentInput.trim() || isSubmitting || session.isComplete) return;

    setIsSubmitting(true);
    const updated = processStudentTurn({ ...session }, studentInput.trim());
    setSession(updated.session);
    setStudentInput("");
    setIsSubmitting(false);

    if (updated.session.isComplete) {
      const report = summarizeSession(updated.session);
      setSummaryReport(report);
      onCompleteSession?.(report);
    }
  };

  const handleFinishEarly = () => {
    const report = summarizeSession(session);
    setSummaryReport(report);
    onCompleteSession?.(report);
  };

  const profile = session.studentProfile;
  const invPct = Math.round(profile.invariantComprehension * 100);
  const asympPct = Math.round(profile.asymptoticRigor * 100);
  const hwPct = Math.round(profile.hardwareAwareness * 100);
  const masteryPct = Math.round(profile.overallMastery * 100);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "min(680px, 100vw)",
        backgroundColor: "#020617",
        borderLeft: "1px solid #1e293b",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.7)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#f8fafc",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #1e293b",
          backgroundColor: "#090d16",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🏛️</span>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#38bdf8", margin: 0 }}>
              Socratic Diagnostic Laboratory
            </h2>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Course: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{session.courseTitle}</span>{" "}
            | Checkpoint{" "}
            <span style={{ color: "#f59e0b" }}>
              {session.currentQuestionIndex + 1}/{session.totalQuestions}
            </span>
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {!session.isComplete && !summaryReport && (
            <button
              onClick={handleFinishEarly}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                backgroundColor: "#1e293b",
                color: "#94a3b8",
                border: "1px solid #334155",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Finish Early
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px",
              fontSize: "14px",
              backgroundColor: "transparent",
              color: "#94a3b8",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Live Student Understanding Profile Meters */}
      <div
        style={{
          padding: "12px 20px",
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #1e293b",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          fontSize: "11px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#94a3b8",
              marginBottom: "4px",
            }}
          >
            <span>Invariant</span>
            <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{invPct}%</span>
          </div>
          <div
            style={{
              height: "4px",
              backgroundColor: "#1e293b",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${invPct}%`, height: "100%", backgroundColor: "#38bdf8" }} />
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#94a3b8",
              marginBottom: "4px",
            }}
          >
            <span>Asymptotic</span>
            <span style={{ color: "#a7f3d0", fontWeight: "bold" }}>{asympPct}%</span>
          </div>
          <div
            style={{
              height: "4px",
              backgroundColor: "#1e293b",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${asympPct}%`, height: "100%", backgroundColor: "#10b981" }} />
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#94a3b8",
              marginBottom: "4px",
            }}
          >
            <span>Hardware</span>
            <span style={{ color: "#fcd34d", fontWeight: "bold" }}>{hwPct}%</span>
          </div>
          <div
            style={{
              height: "4px",
              backgroundColor: "#1e293b",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${hwPct}%`, height: "100%", backgroundColor: "#f59e0b" }} />
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#94a3b8",
              marginBottom: "4px",
            }}
          >
            <span>Mastery</span>
            <span style={{ color: "#c084fc", fontWeight: "bold" }}>{masteryPct}%</span>
          </div>
          <div
            style={{
              height: "4px",
              backgroundColor: "#1e293b",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${masteryPct}%`, height: "100%", backgroundColor: "#8b5cf6" }} />
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {session.conversationHistory.map((turn: SocraticDialogueTurn, idx: number) => {
          const isTutor = turn.role === "tutor";
          const isMisconception = turn.interventionType === "counter_example";
          const isHint = turn.interventionType === "scaffolded_hint";

          return (
            <div
              key={`turn_${idx}`}
              style={{
                alignSelf: isTutor ? "flex-start" : "flex-end",
                maxWidth: "88%",
                backgroundColor: isTutor
                  ? isMisconception
                    ? "#450a0a"
                    : isHint
                      ? "#1e1b4b"
                      : "#0f172a"
                  : "#1e293b",
                border: `1px solid ${
                  isTutor
                    ? isMisconception
                      ? "#dc2626"
                      : isHint
                        ? "#6366f1"
                        : "#334155"
                    : "#38bdf8"
                }`,
                borderRadius: "10px",
                padding: "14px 16px",
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              {/* Role Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  fontSize: "11px",
                  color: isTutor ? "#94a3b8" : "#38bdf8",
                  fontWeight: "bold",
                }}
              >
                <span>
                  {isTutor
                    ? isMisconception
                      ? "⚠️ Socratic Misconception Counter-Example"
                      : isHint
                        ? "💡 Socratic Invariant Guidance"
                        : "🏛️ Socratic Tutor"
                    : "🧑‍💻 Student Analysis"}
                </span>
                {turn.evaluation && (
                  <span
                    style={{
                      backgroundColor: turn.evaluation.passed ? "#065f46" : "#7f1d1d",
                      color: turn.evaluation.passed ? "#a7f3d0" : "#fca5a5",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    Score: {Math.round(turn.evaluation.score)}%
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div style={{ whiteSpace: "pre-wrap" }}>{turn.content}</div>
            </div>
          );
        })}

        {/* Summary Card when Completed */}
        {summaryReport && (
          <div
            style={{
              marginTop: "12px",
              padding: "18px",
              backgroundColor: "#090d16",
              border: "1px solid #10b981",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "16px", color: "#10b981", fontWeight: "bold" }}>
                🎓 Socratic Diagnostic Complete
              </h3>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#fbbf24",
                  padding: "4px 12px",
                  backgroundColor: "#1e293b",
                  borderRadius: "6px",
                  border: "1px solid #f59e0b",
                }}
              >
                Grade: {summaryReport.letterGrade}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "0 0 12px 0" }}>
              Overall Mastery Score:{" "}
              <strong style={{ color: "#38bdf8" }}>
                {Math.round(summaryReport.overallMasteryScore * 100)}%
              </strong>{" "}
              across {summaryReport.turnsTotal} dialogue turns.
            </p>

            {summaryReport.masteredConcepts.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: "#a7f3d0", fontWeight: "bold" }}>
                  Mastered Invariants:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  {summaryReport.masteredConcepts.map((c, i) => (
                    <span
                      key={`m_${i}`}
                      style={{
                        fontSize: "11px",
                        backgroundColor: "#064e3b",
                        color: "#a7f3d0",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {summaryReport.recommendedFollowUps.length > 0 && (
              <div>
                <span style={{ fontSize: "12px", color: "#93c5fd", fontWeight: "bold" }}>
                  Recommended Next Steps:
                </span>
                <ul
                  style={{
                    margin: "6px 0 0 0",
                    paddingLeft: "20px",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  {summaryReport.recommendedFollowUps.map((f, i) => (
                    <li key={`rec_${i}`} style={{ margin: "4px 0" }}>
                      <strong style={{ color: "#38bdf8" }}>{f.title}</strong> — {f.rationale}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Stage */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #1e293b",
          backgroundColor: "#090d16",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <textarea
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              session.isComplete
                ? "Diagnostic session completed. Close drawer to resume course."
                : "Formulate your inductive invariant, asymptotic bound, or cache mechanism (Cmd+Enter to submit)..."
            }
            disabled={session.isComplete || isSubmitting}
            rows={3}
            style={{
              flex: 1,
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "10px 12px",
              color: "#f8fafc",
              fontSize: "13px",
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
            }}
          />

          <button
            onClick={handleSendMessage}
            disabled={session.isComplete || !studentInput.trim() || isSubmitting}
            style={{
              padding: "0 18px",
              backgroundColor: session.isComplete || !studentInput.trim() ? "#1e293b" : "#0284c7",
              color: session.isComplete || !studentInput.trim() ? "#64748b" : "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "13px",
              cursor: session.isComplete || !studentInput.trim() ? "not-allowed" : "pointer",
            }}
          >
            Submit Response
          </button>
        </div>
      </div>
    </div>
  );
};
