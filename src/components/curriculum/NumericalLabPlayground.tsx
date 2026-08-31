import React, { useCallback, useEffect, useMemo, useState } from "react";
import { generateNumericalExercises, type NumericalExercise } from "../../curriculum";
import { NumericalLabHeader } from "./NumericalLabHeader";
import { NumericalLabProblemCard } from "./NumericalLabProblemCard";
import { NumericalLabTabs } from "./NumericalLabTabs";
import type { NumericalAttemptRecord } from "./numericalLabUtils";

export interface NumericalLabPlaygroundProps {
  readonly topicId?: string;
  readonly initialSeed?: number;
  readonly className?: string;
  readonly onComplete?: (result: {
    readonly exerciseId: string;
    readonly isCorrect: boolean;
    readonly score: number;
  }) => void;
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
}

export const NumericalLabPlayground: React.FC<NumericalLabPlaygroundProps> = ({
  topicId,
  initialSeed = 42,
  className = "",
  onComplete,
  isOpen,
  onClose,
}) => {
  if (isOpen === false) return null;

  const [seed, setSeed] = useState<number>(initialSeed);
  const [seedInput, setSeedInput] = useState<string>(String(initialSeed));
  const [selectedTopic, setSelectedTopic] = useState<string>(topicId || "all");
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [studentInput, setStudentInput] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<{
    readonly isCorrect: boolean;
    readonly errorPct: number;
    readonly feedback: string;
  } | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [totalAttempted, setTotalAttempted] = useState<number>(0);
  const [totalCorrect, setTotalCorrect] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [history, setHistory] = useState<readonly NumericalAttemptRecord[]>([]);

  const exercises: readonly NumericalExercise[] = useMemo(() => {
    const topicArg = selectedTopic === "all" ? undefined : selectedTopic;
    const list = generateNumericalExercises(topicArg, seed);
    return list.length > 0 ? list : generateNumericalExercises(undefined, seed);
  }, [selectedTopic, seed]);

  useEffect(() => {
    if (activeExerciseIndex >= exercises.length) setActiveExerciseIndex(0);
    setStudentInput("");
    setVerificationResult(null);
    setInputError(null);
    setShowSolution(false);
  }, [exercises.length, activeExerciseIndex, seed, selectedTopic]);

  const activeExercise: NumericalExercise | undefined = exercises[activeExerciseIndex];

  const handleRandomizeSeed = useCallback(() => {
    const nextSeed = Math.floor(Math.random() * 9000) + 1000;
    setSeed(nextSeed);
    setSeedInput(String(nextSeed));
  }, []);

  const handleApplyCustomSeed = useCallback(() => {
    const parsed = parseInt(seedInput.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) setSeed(parsed);
    else setSeedInput(String(seed));
  }, [seedInput, seed]);

  const handleVerify = useCallback(() => {
    if (!activeExercise) return;
    const trimmed = studentInput.trim();
    if (!trimmed) {
      setInputError("Please enter a numeric answer before verifying.");
      return;
    }
    const numVal = parseFloat(trimmed);
    if (isNaN(numVal)) {
      setInputError("Invalid number. Please enter a valid decimal or integer value.");
      return;
    }
    setInputError(null);
    const result = activeExercise.verify(numVal);
    setVerificationResult(result);
    const isCorrect = result.isCorrect;
    const earnedScore = isCorrect ? 100 + streak * 15 : 0;
    setTotalAttempted((prev) => prev + 1);
    if (isCorrect) {
      setTotalCorrect((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setTotalScore((prev) => prev + earnedScore);
    } else {
      setStreak(0);
    }
    const record: NumericalAttemptRecord = {
      id: `${activeExercise.id}_${Date.now()}`,
      exerciseId: activeExercise.id,
      title: activeExercise.title,
      studentAnswer: numVal,
      correctAnswer: activeExercise.correctAnswer,
      unit: activeExercise.unit,
      isCorrect,
      errorPct: result.errorPct,
      timestamp: Date.now(),
    };
    setHistory((prev) => [record, ...prev.slice(0, 9)]);
    if (onComplete) {
      onComplete({ exerciseId: activeExercise.id, isCorrect, score: earnedScore });
    }
  }, [activeExercise, studentInput, streak, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const accuracyPct = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 100;

  const body = (
    <div
      data-testid="numerical-lab-playground"
      className={`numerical-lab-container ${className}`}
      style={{
        width: "100%",
        maxWidth: "960px",
        background: "#090d16",
        borderRadius: "16px",
        border: "1px solid rgba(56, 189, 248, 0.3)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#f8fafc",
      }}
    >
      <NumericalLabHeader
        selectedTopic={selectedTopic}
        onSelectTopic={(t) => {
          setSelectedTopic(t);
          setActiveExerciseIndex(0);
        }}
        seedInput={seedInput}
        onSeedInputChange={setSeedInput}
        onApplyCustomSeed={handleApplyCustomSeed}
        onRandomizeSeed={handleRandomizeSeed}
        isOpen={isOpen}
        onClose={onClose}
        activeExerciseIndex={activeExerciseIndex}
        totalExercises={exercises.length}
        activeSeed={seed}
        streak={streak}
        accuracyPct={accuracyPct}
        totalCorrect={totalCorrect}
        totalAttempted={totalAttempted}
        totalScore={totalScore}
      />

      <NumericalLabTabs
        exercises={exercises}
        activeIndex={activeExerciseIndex}
        onSelectIndex={(idx) => {
          setActiveExerciseIndex(idx);
          setStudentInput("");
          setVerificationResult(null);
          setInputError(null);
          setShowSolution(false);
        }}
      />

      {activeExercise ? (
        <NumericalLabProblemCard
          exercise={activeExercise}
          activeIndex={activeExerciseIndex}
          totalCount={exercises.length}
          onPrev={() => setActiveExerciseIndex((i) => Math.max(0, i - 1))}
          onNext={() => setActiveExerciseIndex((i) => Math.min(exercises.length - 1, i + 1))}
          studentInput={studentInput}
          onInputChange={(val) => {
            setStudentInput(val);
            setInputError(null);
          }}
          onVerify={handleVerify}
          onClear={() => {
            setStudentInput("");
            setVerificationResult(null);
            setInputError(null);
          }}
          inputError={inputError}
          verificationResult={verificationResult}
          showSolution={showSolution}
          onToggleSolution={() => setShowSolution((s) => !s)}
        />
      ) : null}

      {history.length > 0 && (
        <div
          data-testid="session-history-drawer"
          style={{
            padding: "10px 20px",
            background: "#0f172a",
            borderTop: "1px solid #1e293b",
            fontSize: "11px",
            color: "#94a3b8",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 700 }}>History:</span>
          {history.slice(0, 4).map((rec) => (
            <span
              key={rec.id}
              style={{
                padding: "2px 6px",
                borderRadius: "4px",
                background: rec.isCorrect ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: rec.isCorrect ? "#34d399" : "#f87171",
              }}
            >
              {rec.isCorrect ? "✓" : "✕"} {rec.title.slice(0, 20)} ({rec.studentAnswer} {rec.unit})
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (isOpen === true) {
    return (
      <div
        data-testid="numerical-lab-modal-overlay"
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
          overflowY: "auto",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        {body}
      </div>
    );
  }

  return body;
};
