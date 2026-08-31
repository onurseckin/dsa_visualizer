import React, { useMemo, useState } from "react";
import {
  CareerGoal,
  generateLearningPath,
  getDependents,
  getPrerequisites,
  validateDAG,
} from "../../curriculum/conceptGraph";
import { getCourseJourney } from "../../curriculum/catalog";

export interface CurriculumRoadmapExplorerProps {
  readonly initialCareerGoal?: CareerGoal | "ALL";
  readonly onSelectTopic?: (topicId: string) => void;
  readonly className?: string;
}

const CAREER_GOAL_LABELS: Record<CareerGoal, { title: string; subtitle: string; icon: string }> = {
  LLM_SYSTEMS_ENGINEER: {
    title: "LLM Systems Engineer",
    subtitle:
      "FlashAttention, SRAM Tiling, PagedAttention vLLM, continuous batching, and Speculative Decoding",
    icon: "⚡",
  },
  DISTRIBUTED_ML_ARCHITECT: {
    title: "Distributed ML Architect",
    subtitle:
      "Alpha-beta interconnects, Ring-AllReduce collectives, ZeRO-3 sharding, and 3D Parallelism",
    icon: "🌐",
  },
  COMPETITIVE_PROGRAMMING_GRANDMASTER: {
    title: "Competitive Programming Grandmaster",
    subtitle:
      "Dinic max-flows, 2D dynamic programming, Segment & Fenwick trees, and Sweep-line geometry",
    icon: "🏆",
  },
  MATHEMATICAL_OPTIMIZATION_SPECIALIST: {
    title: "Mathematical Optimization Specialist",
    subtitle:
      "Gram-Schmidt QR, Eckart-Young SVD/PCA, KKT dual multipliers, and AdamW second moments",
    icon: "📐",
  },
};

export const CurriculumRoadmapExplorer: React.FC<CurriculumRoadmapExplorerProps> = ({
  initialCareerGoal = "ALL",
  onSelectTopic,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<CareerGoal | "ALL">(initialCareerGoal);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Compute active path based on selection
  const activeRoadmap = useMemo(() => {
    if (selectedGoal === "ALL") {
      const validation = validateDAG();
      return {
        goal: "All 64 Core Curriculum Courses",
        estimatedHours: Math.round(validation.topologicalOrder.length * 1.5),
        orderedTopicIds: validation.topologicalOrder,
        milestones: validation.topologicalOrder.map((id, idx) => {
          const journey = getCourseJourney(id);
          const directPrereqs = getPrerequisites(id, { transitive: false });
          const unlockedDownstream = getDependents(id, { transitive: false });
          return {
            stepNumber: idx + 1,
            topicId: id,
            title: journey?.title ?? id,
            trackId: journey?.trackId ?? (id.startsWith("dsa_") ? "dsa" : "machine-learning"),
            directPrerequisites: directPrereqs,
            unlockedTopics: unlockedDownstream,
          };
        }),
      };
    }
    const path = generateLearningPath(selectedGoal);
    return {
      goal: path.goal,
      estimatedHours: path.estimatedHours,
      orderedTopicIds: path.orderedTopicIds,
      milestones: path.milestones.map((m) => {
        const journey = getCourseJourney(m.topicId);
        const directPrereqs = getPrerequisites(m.topicId, { transitive: false });
        return {
          stepNumber: m.step,
          topicId: m.topicId,
          title: m.title,
          trackId: journey?.trackId ?? (m.topicId.startsWith("dsa_") ? "dsa" : "machine-learning"),
          directPrerequisites: directPrereqs,
          unlockedTopics: m.unlocks,
        };
      }),
    };
  }, [selectedGoal]);

  // Filter milestones by search query
  const filteredMilestones = useMemo(() => {
    if (!searchQuery.trim()) return activeRoadmap.milestones;
    const q = searchQuery.toLowerCase();
    return activeRoadmap.milestones.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.topicId.toLowerCase().includes(q) ||
        m.directPrerequisites.some((p) => p.toLowerCase().includes(q)) ||
        m.unlockedTopics.some((u) => u.toLowerCase().includes(q)),
    );
  }, [activeRoadmap.milestones, searchQuery]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#020617",
        borderRadius: "12px",
        border: "1px solid #1e293b",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#f8fafc",
      }}
    >
      {/* Header & Goal Selector */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #1e293b",
          backgroundColor: "#090d16",
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
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#38bdf8", margin: 0 }}>
              🗺️ Topological Career Roadmap & Prerequisite DAG Explorer
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Stanford CS336 / MIT 18.065 / CS229 Accelerated Career Specializations
            </p>
          </div>

          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            Estimated Time:{" "}
            <strong style={{ color: "#f59e0b" }}>{activeRoadmap.estimatedHours} hrs</strong> |
            Courses:{" "}
            <strong style={{ color: "#10b981" }}>{activeRoadmap.orderedTopicIds.length}</strong>
          </div>
        </div>

        {/* Goal Filter Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button
            onClick={() => setSelectedGoal("ALL")}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              backgroundColor: selectedGoal === "ALL" ? "#0284c7" : "#1e293b",
              color: selectedGoal === "ALL" ? "#ffffff" : "#cbd5e1",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            All 64 Courses
          </button>
          {(Object.keys(CAREER_GOAL_LABELS) as CareerGoal[]).map((goal) => {
            const info = CAREER_GOAL_LABELS[goal];
            const isSelected = selectedGoal === goal;
            return (
              <button
                key={goal}
                onClick={() => setSelectedGoal(goal)}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  backgroundColor: isSelected ? "#065f46" : "#1e293b",
                  color: isSelected ? "#a7f3d0" : "#cbd5e1",
                  border: `1px solid ${isSelected ? "#10b981" : "#334155"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{info.icon}</span>
                <span>{info.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div
        style={{
          padding: "10px 20px",
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter courses by name, topic ID, or prerequisite..."
          style={{
            width: "360px",
            padding: "6px 10px",
            fontSize: "12px",
            backgroundColor: "#020617",
            border: "1px solid #334155",
            borderRadius: "6px",
            color: "#f8fafc",
            outline: "none",
          }}
        />
        <span style={{ fontSize: "11px", color: "#64748b" }}>
          Showing {filteredMilestones.length} of {activeRoadmap.milestones.length} milestones
        </span>
      </div>

      {/* Milestone Cards Timeline */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {filteredMilestones.map((m) => {
          const isSelected = selectedTopicId === m.topicId;
          const isML = m.trackId === "machine-learning" || m.topicId.startsWith("ml_");

          return (
            <div
              key={`m_${m.topicId}`}
              style={{
                backgroundColor: isSelected ? "#1e293b" : "#090d16",
                border: `1px solid ${isSelected ? "#38bdf8" : "#1e293b"}`,
                borderRadius: "8px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#38bdf8",
                    }}
                  >
                    {m.stepNumber}
                  </span>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#f8fafc" }}>
                      {m.title}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        marginLeft: "8px",
                        fontFamily: "monospace",
                      }}
                    >
                      ({m.topicId})
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: isML ? "#3b0764" : "#0c4a6e",
                      color: isML ? "#d8b4fe" : "#7dd3fc",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  >
                    {isML ? "Machine Learning" : "DSA Foundation"}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTopicId(m.topicId);
                      onSelectTopic?.(m.topicId);
                    }}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      backgroundColor: "#0284c7",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Open Topic
                  </button>
                </div>
              </div>

              {/* Prerequisites & Dependents Row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  fontSize: "11px",
                  marginTop: "4px",
                }}
              >
                {m.directPrerequisites.length > 0 && (
                  <div>
                    <span style={{ color: "#94a3b8" }}>Requires: </span>
                    {m.directPrerequisites.map((p) => (
                      <span
                        key={`p_${p}`}
                        onClick={() => setSelectedTopicId(p)}
                        style={{
                          display: "inline-block",
                          backgroundColor: "#1e293b",
                          color: "#fbbf24",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          marginRight: "4px",
                          cursor: "pointer",
                        }}
                      >
                        {p.replace(/^(dsa_|ml_)/, "")}
                      </span>
                    ))}
                  </div>
                )}

                {m.unlockedTopics.length > 0 && (
                  <div>
                    <span style={{ color: "#94a3b8" }}>Unlocks: </span>
                    {m.unlockedTopics.map((u) => (
                      <span
                        key={`u_${u}`}
                        onClick={() => setSelectedTopicId(u)}
                        style={{
                          display: "inline-block",
                          backgroundColor: "#064e3b",
                          color: "#a7f3d0",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          marginRight: "4px",
                          cursor: "pointer",
                        }}
                      >
                        {u.replace(/^(dsa_|ml_)/, "")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
