import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ALL_COURSE_JOURNEYS,
  type CourseFlashcard,
  generateTopicFlashcards,
  getAllFlashcards,
} from "../../curriculum";

export type SpacedRepetitionRating = "again" | "hard" | "good" | "easy";

export interface FlashcardReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopicId?: string;
  initialTrackFilter?: "all" | "dsa" | "ml-infra";
}

export const FlashcardReviewModal: React.FC<FlashcardReviewModalProps> = ({
  isOpen,
  onClose,
  initialTopicId,
  initialTrackFilter = "all",
}) => {
  const [selectedTrack, setSelectedTrack] = useState<"all" | "dsa" | "ml-infra">(
    initialTrackFilter,
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || "all");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Spaced repetition progression tracking
  const [cardBoxes, setCardBoxes] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState<number>(0);
  const [totalReviewed, setTotalReviewed] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  // Filter cards based on selected track and topic
  const deck: readonly CourseFlashcard[] = useMemo(() => {
    if (selectedTopicId && selectedTopicId !== "all") {
      return generateTopicFlashcards(selectedTopicId);
    }
    const track = selectedTrack === "all" ? undefined : selectedTrack;
    return getAllFlashcards(track);
  }, [selectedTopicId, selectedTrack]);

  // Reset card index & flip when deck changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedTopicId, selectedTrack]);

  const currentCard: CourseFlashcard | undefined = deck[currentIndex];
  const currentBox = currentCard ? cardBoxes[currentCard.id] || 1 : 1;
  const accuracyPct = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 100;

  const handleRate = useCallback(
    (rating: SpacedRepetitionRating) => {
      if (!currentCard) return;

      let nextBox = currentBox;
      let isSuccess = false;

      if (rating === "again") {
        nextBox = 1;
        setStreak(0);
      } else if (rating === "hard") {
        nextBox = Math.max(1, currentBox);
        setStreak((s) => s + 1);
        isSuccess = true;
      } else if (rating === "good") {
        nextBox = Math.min(5, currentBox + 1);
        setStreak((s) => s + 1);
        isSuccess = true;
      } else if (rating === "easy") {
        nextBox = Math.min(5, currentBox + 2);
        setStreak((s) => s + 1);
        isSuccess = true;
      }

      setCardBoxes((prev) => ({ ...prev, [currentCard.id]: nextBox }));
      setTotalReviewed((n) => n + 1);
      if (isSuccess) setCorrectCount((n) => n + 1);

      // Advance to next card
      setIsFlipped(false);
      if (currentIndex + 1 < deck.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setCurrentIndex(0); // Loop back or completed
      }
    },
    [currentCard, currentBox, currentIndex, deck.length],
  );

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleRate("again");
        else if (e.key === "2") handleRate("hard");
        else if (e.key === "3") handleRate("good");
        else if (e.key === "4") handleRate("easy");
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFlipped, handleRate, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  return (
    <div
      data-testid="flashcard-review-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(2, 6, 23, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          background: "#090d16",
          borderRadius: "16px",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header with Filters & Close Button */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: "#0f172a",
            borderBottom: "1px solid #1e293b",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>🗂️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#38bdf8" }}>
                Active Recall & Spaced Repetition Engine
              </h2>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                Leitner 5-Box Interval Scheduler
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Track Filter */}
            <select
              value={selectedTrack}
              onChange={(e) => {
                setSelectedTrack(e.target.value as "all" | "dsa" | "ml-infra");
                setSelectedTopicId("all");
              }}
              style={{
                padding: "4px 8px",
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#e2e8f0",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option value="all">All Tracks</option>
              <option value="dsa">DSA Track (23)</option>
              <option value="ml-infra">ML Systems Track (41)</option>
            </select>

            {/* Topic Filter */}
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              style={{
                padding: "4px 8px",
                maxWidth: "200px",
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#e2e8f0",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option value="all">All Course Topics</option>
              {ALL_COURSE_JOURNEYS.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "18px",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats Sub-Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 20px",
            background: "rgba(15, 23, 42, 0.6)",
            borderBottom: "1px solid #1e293b",
            fontSize: "12px",
            color: "#94a3b8",
          }}
        >
          <span>
            Card <strong>{deck.length > 0 ? currentIndex + 1 : 0}</strong> of{" "}
            <strong>{deck.length}</strong>
          </span>

          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <span>
              🔥 Streak:{" "}
              <strong style={{ color: streak > 0 ? "#fbbf24" : "#94a3b8" }}>{streak}</strong>
            </span>
            <span>
              🎯 Accuracy:{" "}
              <strong style={{ color: accuracyPct >= 80 ? "#34d399" : "#f59e0b" }}>
                {accuracyPct}%
              </strong>
            </span>
            <span>
              📦 Leitner Box: <strong style={{ color: "#c084fc" }}>Box {currentBox}/5</strong>
            </span>
          </div>
        </div>

        {/* Flashcard Body */}
        <div style={{ padding: "24px 20px" }}>
          {currentCard ? (
            <div
              onClick={() => setIsFlipped((f) => !f)}
              style={{
                minHeight: "280px",
                background: isFlipped ? "rgba(15, 23, 42, 0.9)" : "rgba(30, 41, 59, 0.5)",
                border: isFlipped ? "1px solid #38bdf8" : "1px solid #334155",
                borderRadius: "12px",
                padding: "24px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: isFlipped ? "0 0 20px rgba(56, 189, 248, 0.15)" : "none",
                transition: "all 0.2s ease-in-out",
              }}
            >
              {/* Card Meta Badges */}
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      background:
                        currentCard.category === "theorem"
                          ? "rgba(168, 85, 247, 0.2)"
                          : currentCard.category === "systems"
                            ? "rgba(56, 189, 248, 0.2)"
                            : "rgba(52, 211, 153, 0.2)",
                      color:
                        currentCard.category === "theorem"
                          ? "#c084fc"
                          : currentCard.category === "systems"
                            ? "#38bdf8"
                            : "#34d399",
                    }}
                  >
                    {currentCard.category.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {currentCard.courseTitle}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color:
                      currentCard.difficulty === "Hard"
                        ? "#f87171"
                        : currentCard.difficulty === "Medium"
                          ? "#fbbf24"
                          : "#34d399",
                  }}
                >
                  {currentCard.difficulty}
                </span>
              </div>

              {/* Card Content (Front vs Back) */}
              <div style={{ margin: "20px 0" }}>
                {!isFlipped ? (
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        fontWeight: 700,
                        marginBottom: "8px",
                      }}
                    >
                      QUESTION / THEOREM PROMPT:
                    </div>
                    <div
                      style={{
                        fontSize: "17px",
                        fontWeight: 600,
                        color: "#ffffff",
                        lineHeight: 1.5,
                      }}
                    >
                      {currentCard.front}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#38bdf8",
                        fontWeight: 700,
                        marginBottom: "8px",
                      }}
                    >
                      ANSWER / RIGOROUS DERIVATION:
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#e2e8f0",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {currentCard.back}
                    </div>

                    {currentCard.keyTakeaway && (
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "8px 12px",
                          background: "rgba(56, 189, 248, 0.1)",
                          borderRadius: "6px",
                          borderLeft: "3px solid #38bdf8",
                          fontSize: "12px",
                          color: "#7dd3fc",
                        }}
                      >
                        <strong>Key Invariant:</strong> {currentCard.keyTakeaway}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Flip Prompt Footer */}
              <div style={{ textAlign: "center", fontSize: "11px", color: "#64748b" }}>
                {isFlipped
                  ? "Click or press Space to flip back"
                  : "Click or press Space to reveal answer"}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
              No flashcards available in this selection.
            </div>
          )}
        </div>

        {/* 4-Tier Spaced Repetition Rating Buttons */}
        <div
          style={{
            padding: "16px 20px",
            background: "#0f172a",
            borderTop: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {isFlipped ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {/* Again Button */}
              <button
                onClick={() => handleRate("again")}
                style={{
                  padding: "10px 0",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #ef4444",
                  color: "#f87171",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <span>Again (1)</span>
                <span style={{ fontSize: "10px", opacity: 0.7 }}>&lt; 1 min (Box 1)</span>
              </button>

              {/* Hard Button */}
              <button
                onClick={() => handleRate("hard")}
                style={{
                  padding: "10px 0",
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid #f59e0b",
                  color: "#fbbf24",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <span>Hard (2)</span>
                <span style={{ fontSize: "10px", opacity: 0.7 }}>10 mins</span>
              </button>

              {/* Good Button */}
              <button
                onClick={() => handleRate("good")}
                style={{
                  padding: "10px 0",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid #10b981",
                  color: "#34d399",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <span>Good (3)</span>
                <span style={{ fontSize: "10px", opacity: 0.7 }}>1 day (+1 Box)</span>
              </button>

              {/* Easy Button */}
              <button
                onClick={() => handleRate("easy")}
                style={{
                  padding: "10px 0",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid #38bdf8",
                  color: "#38bdf8",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <span>Easy (4)</span>
                <span style={{ fontSize: "10px", opacity: 0.7 }}>3 days (+2 Box)</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                style={{
                  padding: "6px 14px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  color: currentIndex === 0 ? "#475569" : "#cbd5e1",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                }}
              >
                ← Previous
              </button>

              <button
                onClick={() => setIsFlipped(true)}
                style={{
                  padding: "8px 20px",
                  background: "#0284c7",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reveal Answer (Space)
              </button>

              <button
                onClick={handleNext}
                style={{
                  padding: "6px 14px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  color: "#cbd5e1",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
