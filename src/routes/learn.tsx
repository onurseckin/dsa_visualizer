import React, { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ALL_COURSE_JOURNEYS,
  DSA_COURSE_JOURNEYS,
  getCourseJourney,
  ML_COURSE_JOURNEYS,
} from "../curriculum";
import { CoursePlayerStage } from "../components/curriculum";

interface LearnSearch {
  topic?: string;
}

/** Falls back to a course with a dedicated in-canvas visualizer when no topic is pinned. */
const DEFAULT_TOPIC_ID = "dsa_graph_flows_and_cuts";

export const Route = createFileRoute("/learn")({
  // Unknown or blank topics collapse to the default course instead of erroring so
  // shared or mistyped URLs still open the catalog.
  validateSearch: (
    search: Record<string, string | number | boolean | undefined | null | object>,
  ): LearnSearch => {
    const topic = typeof search.topic === "string" ? search.topic.trim() : "";
    return topic ? { topic } : {};
  },
  component: LearnPage,
});

function LearnPage(): React.ReactElement {
  const { topic } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<"all" | "dsa" | "ml-infra">("all");

  const selectedTopicId = topic && getCourseJourney(topic) ? topic : DEFAULT_TOPIC_ID;

  const filteredCourses = useMemo(() => {
    return ALL_COURSE_JOURNEYS.filter((c) => {
      if (selectedTrack === "dsa" && !c.id.startsWith("dsa_")) return false;
      if (selectedTrack === "ml-infra" && !c.id.startsWith("ml_")) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedTrack]);

  const handleSelectTopic = (nextTopicId: string) => {
    navigate({ search: (prev) => ({ ...prev, topic: nextTopicId }) });
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "calc(100vh - 64px)",
        background: "#020617",
        color: "#f8fafc",
      }}
    >
      {/* Left Sidebar: Course Catalog */}
      <div
        style={{
          width: "320px",
          minWidth: "320px",
          borderRight: "1px solid #1e293b",
          background: "#0b1120",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 64px)",
          position: "sticky",
          top: "64px",
        }}
      >
        {/* Search & Filter Header */}
        <div style={{ padding: "16px", borderBottom: "1px solid #1e293b" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px 0", color: "#f8fafc" }}>
            Curriculum Catalog ({ALL_COURSE_JOURNEYS.length} Courses)
          </h2>
          <input
            type="text"
            placeholder="Search topics, algorithms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              fontSize: "12px",
              borderRadius: "6px",
              background: "#020617",
              border: "1px solid #334155",
              color: "#f8fafc",
              boxSizing: "border-box",
            }}
          />

          {/* Track Filter Pills */}
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            {[
              { id: "all", label: "All" },
              { id: "dsa", label: `DSA (${DSA_COURSE_JOURNEYS.length})` },
              { id: "ml-infra", label: `ML Infra (${ML_COURSE_JOURNEYS.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTrack(t.id as "all" | "dsa" | "ml-infra")}
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "4px",
                  border: selectedTrack === t.id ? "1px solid #38bdf8" : "1px solid #334155",
                  background: selectedTrack === t.id ? "#0284c7" : "#1e293b",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Course List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {filteredCourses.map((c) => {
            const isSelected = c.id === selectedTopicId;
            const isDsa = c.id.startsWith("dsa_");
            return (
              <div
                key={c.id}
                onClick={() => handleSelectTopic(c.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  marginBottom: "4px",
                  cursor: "pointer",
                  background: isSelected ? "rgba(56, 189, 248, 0.15)" : "transparent",
                  border: isSelected ? "1px solid #38bdf8" : "1px solid transparent",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "9px",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      background: isDsa ? "#0369a1" : "#7c3aed",
                      color: "#ffffff",
                      fontWeight: 700,
                    }}
                  >
                    {isDsa ? "DSA" : "ML"}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "#38bdf8" : "#e2e8f0",
                    }}
                  >
                    {c.title}
                  </span>
                </div>
                {c.subtitle && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginTop: "3px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.subtitle}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Master Course Player Stage */}
      <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        <CoursePlayerStage topicId={selectedTopicId} />
      </div>
    </div>
  );
}
