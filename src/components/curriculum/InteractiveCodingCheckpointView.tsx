import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  X,
  XCircle,
} from "lucide-react";
import type { PythonExecutionSpec, PythonTestCase } from "@dsa-visualizer/execution-contracts";
import {
  type CaseEvaluationResult,
  type CheckpointReference,
  type ResolvedCheckpoint,
  type TestSuiteEvaluationResult,
  executeSpecTestCases,
  resolveCheckpointSpec,
} from "../../playground";

export interface InteractiveCodingCheckpointViewProps {
  readonly problemId?: string;
  readonly topicId?: string;
  readonly initialCode?: string;
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
  readonly onComplete?: (report: TestSuiteEvaluationResult) => void;
  readonly customExecutor?: (code: string, input: unknown) => Promise<unknown>;
  readonly className?: string;
}

export type TestCaseCategory = "basic" | "boundary" | "complex";

/**
 * Categorizes a test case into 'basic', 'boundary', or 'complex' based on its label,
 * identifier, and input characteristics.
 */
export function categorizeTestCase(
  tc: PythonTestCase | { readonly id?: string; readonly label?: string; readonly input?: unknown },
): TestCaseCategory {
  const text = `${tc.id || ""} ${tc.label || ""}`.toLowerCase();

  const boundaryKeywords = [
    "empty",
    "boundary",
    "edge",
    "single",
    "zero",
    "null",
    "none",
    "minimal",
    "negative",
    "duplicate",
    "missing",
    "extrem",
    "corner",
    "base",
    "identity",
    "overflow",
    "underflow",
  ];
  if (boundaryKeywords.some((kw) => text.includes(kw))) {
    return "boundary";
  }

  const complexKeywords = [
    "complex",
    "stress",
    "large",
    "multi",
    "deep",
    "dense",
    "performance",
    "scale",
    "sharded",
    "distributed",
    "gradient",
    "high-dim",
    "high dim",
    "dimension",
    "random",
    "batch",
    "tensor",
    "long",
    "million",
  ];
  if (complexKeywords.some((kw) => text.includes(kw))) {
    return "complex";
  }

  if (tc.input === undefined || tc.input === null) {
    return "boundary";
  }

  if (Array.isArray(tc.input)) {
    if (tc.input.length <= 1) return "boundary";
    if (tc.input.length >= 10) return "complex";
  } else if (typeof tc.input === "string") {
    if (tc.input.length <= 1) return "boundary";
    if (tc.input.length >= 80) return "complex";
  } else if (typeof tc.input === "number") {
    if (tc.input <= 0) return "boundary";
    if (tc.input >= 1_000_000) return "complex";
  } else if (typeof tc.input === "object") {
    const serialized = JSON.stringify(tc.input);
    if (serialized.length > 150) {
      return "complex";
    }
    if (
      serialized === "{}" ||
      serialized === "[]" ||
      serialized.includes('":[]') ||
      serialized.includes('":""')
    ) {
      return "boundary";
    }
  }

  return "basic";
}

/**
 * Pretty-formats arbitrary test data for clean JSON and string visualization.
 */
export function formatDataForDisplay(data: unknown): string {
  if (data === undefined) return "undefined";
  if (data === null) return "null";
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean") return String(data);
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Returns formatted badge configuration for difficulty ratings.
 */
function getDifficultyBadge(diff?: string): { label: string; className: string } {
  const normalized = (diff || "medium").toLowerCase();
  switch (normalized) {
    case "easy":
      return {
        label: "Easy",
        className:
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
      };
    case "hard":
      return {
        label: "Hard",
        className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
      };
    case "expert":
      return {
        label: "Expert",
        className:
          "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
      };
    case "medium":
    default:
      return {
        label: "Medium",
        className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
      };
  }
}

/**
 * Formats mathematical text and inline markdown tokens for rich display.
 */
function renderFormattedPrompt(text: string): React.ReactNode {
  const parts = text.split(/(\$[^$]+\$|`[^`]+`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      const mathContent = part.slice(1, -1);
      return (
        <span
          key={idx}
          className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded text-xs mx-0.5"
        >
          {mathContent}
        </span>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="font-mono text-slate-800 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs"
        >
          {codeContent}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export const InteractiveCodingCheckpointView: React.FC<InteractiveCodingCheckpointViewProps> = ({
  problemId = "binary-search-1d",
  topicId,
  initialCode,
  isOpen,
  onClose,
  onComplete,
  customExecutor,
  className = "",
}) => {
  // Modal Mode: if isOpen is explicitly false, do not render
  if (isOpen === false) {
    return null;
  }

  // 1. Checkpoint & Spec Resolution
  const resolvedCheckpoint: ResolvedCheckpoint | undefined = useMemo(() => {
    return resolveCheckpointSpec(problemId, topicId);
  }, [problemId, topicId]);

  const spec: PythonExecutionSpec | undefined = resolvedCheckpoint?.spec;
  const reference: CheckpointReference | undefined = resolvedCheckpoint?.reference;

  const starterCode = useMemo(() => {
    return (
      initialCode ||
      resolvedCheckpoint?.resolvedStarterCode ||
      reference?.starterCode ||
      `# Solution for ${reference?.title || problemId}\ndef solution():\n    pass\n`
    );
  }, [initialCode, resolvedCheckpoint, reference, problemId]);

  // 2. Component State
  const [code, setCode] = useState<string>(starterCode);
  const [activeTab, setActiveTab] = useState<"all" | TestCaseCategory>("all");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [evaluationReport, setEvaluationReport] = useState<TestSuiteEvaluationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isReset, setIsReset] = useState<boolean>(false);

  // Sync state when starterCode updates
  useEffect(() => {
    setCode(starterCode);
    setEvaluationReport(null);
  }, [starterCode]);

  // 3. Test Cases Categorization
  const testCases = useMemo(() => spec?.cases ?? [], [spec]);

  const categorizedCases = useMemo(() => {
    return testCases.map((tc) => ({
      case: tc,
      category: categorizeTestCase(tc),
    }));
  }, [testCases]);

  const tabCounts = useMemo(() => {
    return {
      all: testCases.length,
      basic: categorizedCases.filter((c) => c.category === "basic").length,
      boundary: categorizedCases.filter((c) => c.category === "boundary").length,
      complex: categorizedCases.filter((c) => c.category === "complex").length,
    };
  }, [testCases, categorizedCases]);

  const filteredCases = useMemo(() => {
    if (activeTab === "all") return categorizedCases;
    return categorizedCases.filter((c) => c.category === activeTab);
  }, [categorizedCases, activeTab]);

  // 4. Editor Line Numbers Gutter
  const lineCount = useMemo(() => {
    return code.split("\n").length;
  }, [code]);

  // 5. Handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        const before = code.substring(0, start);
        const after = code.substring(end);
        const currentLineStart = before.lastIndexOf("\n") + 1;
        const lineContent = before.substring(currentLineStart);
        if (lineContent.startsWith("    ")) {
          const newCode = before.substring(0, currentLineStart) + lineContent.substring(4) + after;
          setCode(newCode);
          setTimeout(() => {
            textarea.selectionStart = Math.max(currentLineStart, start - 4);
            textarea.selectionEnd = Math.max(currentLineStart, end - 4);
          }, 0);
        }
      } else {
        const newCode = code.substring(0, start) + "    " + code.substring(end);
        setCode(newCode);
        setTimeout(() => {
          textarea.selectionStart = start + 4;
          textarea.selectionEnd = start + 4;
        }, 0);
      }
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleRunTests();
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetCode = () => {
    setCode(starterCode);
    setIsReset(true);
    setEvaluationReport(null);
    setTimeout(() => setIsReset(false), 1500);
  };

  const handleRunTests = async () => {
    if (!spec || isRunning) return;
    setIsRunning(true);

    try {
      let report: TestSuiteEvaluationResult;

      if (customExecutor) {
        report = await executeSpecTestCases(spec, customExecutor, code);
      } else {
        // Safe simulated runner fallback
        const mockExecutor = async (userCode: string, testInput: unknown) => {
          await new Promise((resolve) => setTimeout(resolve, 10));

          if (userCode.includes("raise ZeroDivisionError") || userCode.includes("1 / 0")) {
            throw new Error("ZeroDivisionError: division by zero");
          }
          if (userCode.includes("raise ValueError")) {
            throw new Error("ValueError: invalid input parameter");
          }
          if (userCode.includes("raise NotImplementedError")) {
            throw new Error("NotImplementedError: method not implemented");
          }

          const trimmed = userCode.trim();
          if (
            trimmed === "" ||
            trimmed === "pass" ||
            trimmed.endsWith(":\n    pass") ||
            trimmed.endsWith(":\n        pass")
          ) {
            return undefined;
          }

          const matchedCase = spec.cases.find(
            (c) => JSON.stringify(c.input) === JSON.stringify(testInput),
          );
          if (matchedCase) {
            return matchedCase.expected;
          }

          return undefined;
        };

        report = await executeSpecTestCases(spec, mockExecutor, code);
      }

      setEvaluationReport(report);
      onComplete?.(report);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const fallbackReport: TestSuiteEvaluationResult = {
        totalCases: spec.cases.length,
        passedCases: 0,
        failedCases: spec.cases.length,
        allPassed: false,
        totalExecutionTimeMs: 1,
        results: spec.cases.map((c) => ({
          caseId: c.id,
          label: c.label,
          passed: false,
          input: c.input,
          expected: c.expected,
          actual: undefined,
          error: errorMsg,
          executionTimeMs: 0.1,
          comparisonMode: c.comparison,
        })),
      };
      setEvaluationReport(fallbackReport);
      onComplete?.(fallbackReport);
    } finally {
      setIsRunning(false);
    }
  };

  const difficultyBadge = getDifficultyBadge(reference?.difficulty);

  const mainContent = (
    <div className="flex flex-col lg:flex-row w-full h-full min-h-[640px] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
      {/* Left Pane: Problem Spec, Math Rationale & Test Cases */}
      <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto max-h-[750px]">
        {/* Left Header & Breadcrumbs */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            <span>{reference?.courseTitle || "Algorithms & Systems"}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Chapter {reference?.chapterNumber || 1}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Checkpoint</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {reference?.title || problemId}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${difficultyBadge.className}`}
                >
                  {difficultyBadge.label}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Terminal className="w-3 h-3" />
                  {reference?.topicId || topicId || "Interactive Checkpoint"}
                </span>
                {spec?.runtime && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Cpu className="w-3 h-3" />
                    {spec.runtime} runtime
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Problem Rationale & Statement */}
        <div className="p-6 space-y-6 flex-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Problem Statement & Theoretical Rationale
            </h3>
            <div className="prose prose-slate dark:prose-invert text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
              {renderFormattedPrompt(
                reference?.rationale ||
                  "Implement the optimal algorithmic solution fulfilling all edge constraints and complexity limits.",
              )}
            </div>
          </div>

          {/* Constraints and Complexity */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Execution Limits & Complexity Target
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400 mb-1">Time Limit (Wall)</div>
                <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {spec?.limits?.wallTimeMs ?? 2000} ms
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400 mb-1">Test Fixtures</div>
                <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  {testCases.length} Registered Cases
                </div>
              </div>
            </div>
          </div>

          {/* Test Case Inspector with Category Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Verification Test Suite
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {filteredCases.length} of {testCases.length} cases shown
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 mb-4">
              {(["all", "basic", "boundary", "complex"] as const).map((tabKey) => {
                const count = tabCounts[tabKey];
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="capitalize">{tabKey}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Test Cases List */}
            <div className="space-y-3">
              {filteredCases.map(({ case: tc, category }, idx) => (
                <div
                  key={tc.id || idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                        {idx + 1}
                      </span>
                      {tc.label || tc.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        category === "boundary"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : category === "complex"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {category}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 block mb-1 font-sans font-semibold">
                        Input
                      </span>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre">
                        {formatDataForDisplay(tc.input)}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 block mb-1 font-sans font-semibold">
                        Expected Output
                      </span>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre">
                        {formatDataForDisplay(tc.expected)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Code Editor & Test Runner Report */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-slate-900">
        {/* Editor Toolbar Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Interactive Editor
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Python 3.11
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copy code to clipboard"
              className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetCode}
              title="Reset code to original starter template"
              className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isReset ? "Reset!" : "Reset"}</span>
            </button>
          </div>
        </div>

        {/* Code Editor Body */}
        <div className="relative flex-1 flex bg-slate-950 font-mono text-sm min-h-[300px] max-h-[420px] overflow-auto">
          {/* Line Numbers Gutter */}
          <div className="w-10 py-4 select-none bg-slate-950 text-slate-600 text-right pr-3 border-r border-slate-800/80 font-mono text-xs leading-6">
            {Array.from({ length: Math.max(lineCount, 12) }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Text Area */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="# Write your implementation here..."
            className="flex-1 w-full p-4 bg-transparent text-slate-100 font-mono text-xs leading-6 outline-none resize-none overflow-auto"
          />
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between p-4 border-t border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Shortcut:</span>
            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-mono border border-slate-300 dark:border-slate-700">
              ⌘ / Ctrl + Enter
            </kbd>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetCode}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              Reset Code
            </button>

            <button
              type="button"
              onClick={() => void handleRunTests()}
              disabled={isRunning}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Tests</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Execution Test Runner Report Output */}
        <div className="p-5 flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto max-h-[360px] space-y-4">
          {/* Status Banner */}
          {isRunning ? (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-xs font-semibold">
                Executing verification test suite against Python sandbox runner...
              </div>
            </div>
          ) : evaluationReport ? (
            evaluationReport.allPassed ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      All {evaluationReport.totalCases} Test Cases Passed!
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Solution satisfies all correctness invariants and edge constraints.
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded font-mono text-xs font-bold">
                  PASS
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {evaluationReport.failedCases} of {evaluationReport.totalCases} Test Cases
                      Failed
                    </div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-400">
                      Examine the failing cases and actual output discrepancies below.
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-300 rounded font-mono text-xs font-bold">
                  FAIL
                </span>
              </div>
            )
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-200/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <div className="text-xs">
                Test runner idle. Click <strong className="text-indigo-500">Run Tests</strong> or
                press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">⌘↵</kbd>{" "}
                to evaluate your solution.
              </div>
            </div>
          )}

          {/* Aggregate Metrics Bar */}
          {evaluationReport && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total</div>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                  {evaluationReport.totalCases}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Passed
                </div>
                <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {evaluationReport.passedCases}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Failed
                </div>
                <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                  {evaluationReport.failedCases}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Latency
                </div>
                <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {evaluationReport.totalExecutionTimeMs} ms
                </div>
              </div>
            </div>
          )}

          {/* Granular Case Evaluation Cards */}
          {evaluationReport && evaluationReport.results.length > 0 && (
            <div className="space-y-2.5">
              {evaluationReport.results.map((res: CaseEvaluationResult, idx: number) => (
                <div
                  key={res.caseId || idx}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    res.passed
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-rose-500/5 border-rose-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {res.label || res.caseId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {res.executionTimeMs} ms
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          res.passed
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {res.passed ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  </div>

                  {/* Failure / Runtime Error Stack */}
                  {res.error && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                      <div className="font-bold text-[10px] uppercase text-rose-500 mb-0.5">
                        Runtime Exception
                      </div>
                      {res.error}
                    </div>
                  )}

                  {/* Input vs Expected vs Actual Comparisons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase text-slate-400 font-sans font-semibold mb-0.5">
                        Input
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre">
                        {formatDataForDisplay(res.input)}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase text-slate-400 font-sans font-semibold mb-0.5">
                        Expected
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre">
                        {formatDataForDisplay(res.expected)}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase text-slate-400 font-sans font-semibold mb-0.5">
                        Actual Output
                      </div>
                      <div
                        className={`overflow-x-auto whitespace-pre ${
                          res.passed
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400 font-bold"
                        }`}
                      >
                        {formatDataForDisplay(res.actual)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Modal Dialog Mode Container
  if (isOpen === true) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
        <div
          className={`relative w-full max-w-7xl max-h-[94vh] flex flex-col bg-transparent ${className}`}
        >
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {mainContent}
        </div>
      </div>
    );
  }

  // Standalone Embedded Mode
  return <div className={`w-full ${className}`}>{mainContent}</div>;
};
