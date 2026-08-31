import React, { useCallback, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Flame,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  ATTACK_VECTORS,
  type AdversarialStressResult,
  type AttackSeverity,
  type AttackVector,
  type AttackVectorCategory,
  type ResilienceReport,
  evaluateAlgorithmResilience,
  executeStressTest,
  getAllAttackVectors,
  getAttackVector,
} from "../../curriculum";

export interface AdversarialStressArenaProps {
  readonly topicId?: string;
  readonly onComplete?: (report: ResilienceReport) => void;
  readonly className?: string;
  readonly initialAttackId?: string;
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
}

/**
 * Maps attack severity to Tailwind styling classes.
 */
function getSeverityBadgeClass(severity: AttackSeverity): string {
  switch (severity) {
    case "Critical":
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case "High":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "Medium":
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    case "Low":
      return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    default:
      return "bg-slate-700/50 text-slate-300 border-slate-600/30";
  }
}

/**
 * Maps attack category to Tailwind styling classes.
 */
function getCategoryBadgeClass(category: AttackVectorCategory): string {
  switch (category) {
    case "Numerical":
      return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    case "Geometric":
      return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    case "Hardware":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "Algorithmic":
      return "bg-orange-500/15 text-orange-300 border-orange-500/30";
    default:
      return "bg-slate-700/50 text-slate-300 border-slate-600/30";
  }
}

/**
 * Maps impact percentage to color classes and status label.
 */
function getImpactMeterConfig(impactPercent: number): {
  colorClass: string;
  bgClass: string;
  label: string;
  textClass: string;
} {
  if (impactPercent <= 20) {
    return {
      colorClass: "bg-emerald-500",
      bgClass: "bg-emerald-950/40 border-emerald-800/40",
      label: "Immune / Nominal Impact",
      textClass: "text-emerald-400",
    };
  }
  if (impactPercent <= 50) {
    return {
      colorClass: "bg-yellow-500",
      bgClass: "bg-yellow-950/40 border-yellow-800/40",
      label: "Moderate Degradation",
      textClass: "text-yellow-400",
    };
  }
  if (impactPercent <= 80) {
    return {
      colorClass: "bg-amber-500",
      bgClass: "bg-amber-950/40 border-amber-800/40",
      label: "Severe Degradation",
      textClass: "text-amber-400",
    };
  }
  return {
    colorClass: "bg-rose-500",
    bgClass: "bg-rose-950/40 border-rose-800/40",
    label: "Catastrophic Collapse / DoS",
    textClass: "text-rose-400",
  };
}

/**
 * Maps letter grades to badge colors.
 */
function getGradeColorClass(grade: string): string {
  switch (grade) {
    case "A+":
    case "A":
      return "text-emerald-400 border-emerald-500/50 bg-emerald-950/30";
    case "B":
      return "text-blue-400 border-blue-500/50 bg-blue-950/30";
    case "C":
      return "text-yellow-400 border-yellow-500/50 bg-yellow-950/30";
    case "D":
      return "text-amber-400 border-amber-500/50 bg-amber-950/30";
    default:
      return "text-rose-400 border-rose-500/50 bg-rose-950/30";
  }
}

export const AdversarialStressArena: React.FC<AdversarialStressArenaProps> = ({
  topicId,
  onComplete,
  className = "",
  initialAttackId,
  isOpen,
  onClose,
}) => {
  if (isOpen === false) return null;

  const [selectedCategory, setSelectedCategory] = useState<"All" | AttackVectorCategory>("All");
  const [selectedAttackId, setSelectedAttackId] = useState<string>(
    initialAttackId || ATTACK_VECTORS[0].id,
  );
  const [applyDefense, setApplyDefense] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"countermeasure" | "hardware" | "pathology">(
    "countermeasure",
  );
  const [resultsMap, setResultsMap] = useState<Record<string, AdversarialStressResult>>({});
  const [fullSuiteReport, setFullSuiteReport] = useState<ResilienceReport | null>(null);
  const [isRunningSingle, setIsRunningSingle] = useState<boolean>(false);
  const [isRunningSuite, setIsRunningSuite] = useState<boolean>(false);

  // Filter attack vectors
  const filteredVectors: readonly AttackVector[] = useMemo(() => {
    if (selectedCategory === "All") return ATTACK_VECTORS;
    return getAllAttackVectors(selectedCategory);
  }, [selectedCategory]);

  // Active selected attack vector
  const selectedAttack: AttackVector = useMemo(() => {
    const found = getAttackVector(selectedAttackId);
    return found || ATTACK_VECTORS[0];
  }, [selectedAttackId]);

  // Current attack result
  const currentResult: AdversarialStressResult | undefined = resultsMap[selectedAttack.id];

  // Run single attack test
  const handleRunSingleAttack = useCallback(() => {
    setIsRunningSingle(true);
    setTimeout(() => {
      const result = executeStressTest(selectedAttack.id, topicId, {
        applyCounterMeasure: applyDefense,
      });

      setResultsMap((prev) => {
        const next = { ...prev, [selectedAttack.id]: result };
        if (fullSuiteReport) {
          const updatedReport = evaluateAlgorithmResilience(Object.values(next));
          setFullSuiteReport(updatedReport);
          onComplete?.(updatedReport);
        }
        return next;
      });

      setIsRunningSingle(false);
    }, 150);
  }, [selectedAttack.id, topicId, applyDefense, fullSuiteReport, onComplete]);

  // Run full stress suite
  const handleRunFullSuite = useCallback(() => {
    setIsRunningSuite(true);
    setTimeout(() => {
      const suiteResults: AdversarialStressResult[] = ATTACK_VECTORS.map((attack) =>
        executeStressTest(attack.id, topicId, { applyCounterMeasure: applyDefense }),
      );

      const newResultsMap: Record<string, AdversarialStressResult> = {};
      for (const r of suiteResults) {
        newResultsMap[r.attackId] = r;
      }

      const report = evaluateAlgorithmResilience(suiteResults);
      setResultsMap(newResultsMap);
      setFullSuiteReport(report);
      onComplete?.(report);
      setIsRunningSuite(false);
    }, 250);
  }, [topicId, applyDefense, onComplete]);

  // Reset arena
  const handleReset = useCallback(() => {
    setResultsMap({});
    setFullSuiteReport(null);
  }, []);

  // Stats calculation
  const evaluatedCount = Object.keys(resultsMap).length;
  const passedCount = Object.values(resultsMap).filter((r) => r.passed).length;
  const failedCount = evaluatedCount - passedCount;

  const impactMetrics = currentResult
    ? getImpactMeterConfig(currentResult.impactPercent)
    : getImpactMeterConfig(applyDefense ? 8 : selectedAttack.stressMetrics.impactPercent);

  const displayedImpactPercent = currentResult
    ? currentResult.impactPercent
    : applyDefense
      ? 8
      : selectedAttack.stressMetrics.impactPercent;

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-all overflow-hidden ${className}`}
      data-testid="adversarial-stress-arena"
    >
      {/* Top Header Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Adversarial Stress Testing Arena
                </h2>
                <p className="text-xs text-slate-400 sm:text-sm">
                  Simulate arithmetic denormals, collinear geometric degeneracies, and algorithmic
                  DoS vectors.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunFullSuite}
              disabled={isRunningSuite}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50"
              data-testid="run-full-suite-btn"
            >
              {isRunningSuite ? (
                <Activity className="h-4 w-4 animate-spin text-white" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-white" />
              )}
              <span>Run Full Stress Suite</span>
            </button>

            {evaluatedCount > 0 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                data-testid="reset-suite-btn"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-800/60 pt-4">
          {(["All", "Numerical", "Geometric", "Hardware", "Algorithmic"] as const).map((cat) => {
            const isActive = selectedCategory === cat;
            const count =
              cat === "All"
                ? ATTACK_VECTORS.length
                : ATTACK_VECTORS.filter((v) => v.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
                data-testid={`filter-${cat.toLowerCase()}`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-indigo-800/80 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Catalog List & Active Inspector */}
      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-12 sm:p-6">
        {/* Left Column: Attack Vector Catalog */}
        <div className="space-y-3 lg:col-span-5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Attack Vectors ({filteredVectors.length})
            </span>
            {evaluatedCount > 0 && (
              <span className="text-xs text-slate-400">
                <span className="text-emerald-400 font-semibold">{passedCount} Passed</span>
                {" / "}
                <span className="text-rose-400 font-semibold">{failedCount} Vulnerable</span>
              </span>
            )}
          </div>

          <div className="max-h-[640px] space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
            {filteredVectors.map((vector) => {
              const isSelected = vector.id === selectedAttack.id;
              const res = resultsMap[vector.id];

              return (
                <div
                  key={vector.id}
                  onClick={() => setSelectedAttackId(vector.id)}
                  className={`group relative cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-indigo-500/80 bg-slate-800/90 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                      : "border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50"
                  }`}
                  data-testid={`attack-card-${vector.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getCategoryBadgeClass(
                          vector.category,
                        )}`}
                      >
                        {vector.category}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getSeverityBadgeClass(
                          vector.severity,
                        )}`}
                      >
                        {vector.severity}
                      </span>
                    </div>

                    {res && (
                      <div className="flex items-center gap-1">
                        {res.passed ? (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Resilient</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Vulnerable</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <h3
                    className={`mt-2 text-sm font-semibold transition ${
                      isSelected ? "text-indigo-200" : "text-slate-200 group-hover:text-white"
                    }`}
                  >
                    {vector.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-400 leading-relaxed">
                    {vector.pathology}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Impact: {vector.stressMetrics.impactPercent}%</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        isSelected
                          ? "translate-x-0.5 text-indigo-400"
                          : "text-slate-600 group-hover:translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Attack Inspector & Execution Bench */}
        <div className="space-y-5 lg:col-span-7">
          {/* Active Attack Header Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getCategoryBadgeClass(
                    selectedAttack.category,
                  )}`}
                >
                  {selectedAttack.category}
                </span>
                <span
                  className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getSeverityBadgeClass(
                    selectedAttack.severity,
                  )}`}
                >
                  {selectedAttack.severity} Severity
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">ID: {selectedAttack.id}</span>
            </div>

            <h3 className="mt-3 text-lg font-bold text-white sm:text-xl">{selectedAttack.title}</h3>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed sm:text-sm">
              {selectedAttack.description}
            </p>

            {/* Theoretical Degradation Callout */}
            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-300">
              <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Theoretical Complexity Degradation:</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-amber-200/90">
                {selectedAttack.theoreticalComplexityDegradation}
              </div>
            </div>

            {/* Defense Toggle & Attack Trigger */}
            <div className="mt-5 rounded-xl border border-slate-800/80 bg-slate-950/70 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={applyDefense}
                    onChange={(e) => setApplyDefense(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950"
                    data-testid="defense-toggle"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      Apply Counter-Measure Defense
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Enable stabilized algorithmic logic (Log-Sum-Exp, Tikhonov, SipHash-2-4,
                      robust predicates).
                    </p>
                  </div>
                </label>

                <button
                  onClick={handleRunSingleAttack}
                  disabled={isRunningSingle}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                  data-testid="launch-attack-btn"
                >
                  {isRunningSingle ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 text-yellow-300" />
                  )}
                  <span>Launch Adversarial Attack</span>
                </button>
              </div>
            </div>

            {/* Live Attack Impact Meter */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Live Attack Impact Meter:</span>
                <span className={`font-bold ${impactMetrics.textClass}`}>
                  {displayedImpactPercent}% ({impactMetrics.label})
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${impactMetrics.colorClass}`}
                  style={{ width: `${Math.min(100, Math.max(2, displayedImpactPercent))}%` }}
                />
              </div>
            </div>

            {/* Resilience Pass/Fail Status Banner */}
            {currentResult && (
              <div
                className={`mt-4 rounded-xl border p-4 transition-all ${
                  currentResult.passed
                    ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                    : "border-rose-500/30 bg-rose-950/30 text-rose-300"
                }`}
                data-testid="result-banner"
              >
                <div className="flex items-start gap-3">
                  {currentResult.passed ? (
                    <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {currentResult.passed
                          ? "STATUS: PASSED (Resilient)"
                          : "STATUS: FAILED (Vulnerable to Attack)"}
                      </span>
                      <span className="rounded bg-slate-900/60 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        {currentResult.latencyMs} ms
                      </span>
                    </div>
                    {currentResult.violationDetails && (
                      <p className="text-xs text-rose-200/90 leading-relaxed font-mono">
                        {currentResult.violationDetails}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Performance & Precision Breakdown Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Latency</span>
                <p className="mt-0.5 font-mono text-xs font-bold text-slate-200">
                  {currentResult
                    ? `${currentResult.latencyMs} ms`
                    : `${selectedAttack.stressMetrics.degradedLatencyMs} ms`}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Memory Delta
                </span>
                <p className="mt-0.5 font-mono text-xs font-bold text-slate-200">
                  {currentResult?.memoryOverheadMB !== undefined
                    ? `+${currentResult.memoryOverheadMB} MB`
                    : selectedAttack.stressMetrics.memoryOverheadMB
                      ? `+${selectedAttack.stressMetrics.memoryOverheadMB} MB`
                      : "0 MB"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Precision Loss
                </span>
                <p className="mt-0.5 font-mono text-xs font-bold text-slate-200">
                  {currentResult?.precisionLossBits !== undefined
                    ? `${currentResult.precisionLossBits} bits`
                    : selectedAttack.stressMetrics.precisionLossBits
                      ? `${selectedAttack.stressMetrics.precisionLossBits} bits`
                      : "0 bits"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Defense Active
                </span>
                <p
                  className={`mt-0.5 font-mono text-xs font-bold ${
                    applyDefense ? "text-emerald-400" : "text-slate-400"
                  }`}
                >
                  {applyDefense ? "Active" : "Disabled"}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Tabs Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveTab("countermeasure")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                  activeTab === "countermeasure"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                data-testid="tab-countermeasure"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Algorithmic Defense</span>
              </button>

              <button
                onClick={() => setActiveTab("hardware")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                  activeTab === "hardware"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                data-testid="tab-hardware"
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Hardware Mitigation</span>
              </button>

              <button
                onClick={() => setActiveTab("pathology")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                  activeTab === "pathology"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                data-testid="tab-pathology"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Payload & Pathology</span>
              </button>
            </div>

            <div className="pt-4 text-xs leading-relaxed">
              {activeTab === "countermeasure" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                    <ShieldCheck className="h-4 w-4 text-indigo-400" />
                    <span>Algorithmic Counter-Measure Strategy</span>
                  </div>
                  <p className="text-slate-300">{selectedAttack.counterMeasure}</p>
                </div>
              )}

              {activeTab === "hardware" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                    <Cpu className="h-4 w-4 text-emerald-400" />
                    <span>Hardware-Level ISA & SIMD Mitigations</span>
                  </div>
                  <p className="text-slate-300">{selectedAttack.hardwareMitigation}</p>
                </div>
              )}

              {activeTab === "pathology" && (
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-rose-300">Pathological Mechanism:</span>
                    <p className="mt-1 text-slate-300">{selectedAttack.pathology}</p>
                  </div>
                  {selectedAttack.defaultPayloadSummary && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300">
                      <span className="text-slate-500 font-sans block mb-1">
                        Default Attack Payload:
                      </span>
                      {selectedAttack.defaultPayloadSummary}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Suite Scorecard Section */}
      {fullSuiteReport && (
        <div
          className="border-t border-slate-800/80 bg-slate-900/90 p-5 sm:p-6"
          data-testid="resilience-scorecard"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Score and Rating Card */}
            <div className="flex items-center gap-4">
              <div
                className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 font-black shadow-xl ${getGradeColorClass(
                  fullSuiteReport.letterRating,
                )}`}
              >
                <span className="text-2xl leading-none">{fullSuiteReport.letterRating}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                  Grade
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Full Suite Resilience Score</h3>
                  <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300">
                    {fullSuiteReport.overallScore} / 100
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluated across {fullSuiteReport.total} adversarial vectors (
                  {fullSuiteReport.passed} resilient, {fullSuiteReport.failed} vulnerable).
                </p>
              </div>
            </div>

            {/* Aggregate Metrics Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Pass Rate
                </span>
                <p className="mt-0.5 text-sm font-bold text-emerald-400">
                  {fullSuiteReport.total > 0
                    ? `${Math.round((fullSuiteReport.passed / fullSuiteReport.total) * 100)}%`
                    : "0%"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Avg Impact
                </span>
                <p className="mt-0.5 text-sm font-bold text-amber-400">
                  {fullSuiteReport.averageImpactPercent}%
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                <span className="text-[10px] font-semibold uppercase text-slate-500">Critical</span>
                <p
                  className={`mt-0.5 text-sm font-bold ${
                    fullSuiteReport.criticalVulnerabilities > 0
                      ? "text-rose-400"
                      : "text-emerald-400"
                  }`}
                >
                  {fullSuiteReport.criticalVulnerabilities}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Total Tests
                </span>
                <p className="mt-0.5 text-sm font-bold text-slate-200">{fullSuiteReport.total}</p>
              </div>
            </div>
          </div>

          {/* Recommendations List */}
          {fullSuiteReport.recommendations.length > 0 && (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Resilience Recommendations:
              </span>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                {fullSuiteReport.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
