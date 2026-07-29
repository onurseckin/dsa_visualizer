import React, { Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../ui/templates/PageHeader";
import { isTopicId } from "../app/topics";

const MLInfraKnowledgeGraph = React.lazy(
  () => import("../components/knowledge-graph/MLInfraKnowledgeGraph"),
);

export const Route = createFileRoute("/ml-infra")({
  component: MLInfraPage,
});

function MLInfraPage(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <main
      aria-label="ML Infrastructure Knowledge Tree"
      className="relative w-[90%] py-8 mx-auto flex flex-col items-center gap-8 text-center box-border flex-1"
    >
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <PageHeader
        title="ML Infrastructure Knowledge Tree"
        description="Interactive Machine Learning Systems & Infrastructure Prerequisite Roadmap"
        className="text-center flex flex-col items-center justify-center max-w-3xl mx-auto mt-6 md:mt-8 mb-6"
      />
      <Suspense
        fallback={
          <div className="w-full h-64 flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-page)]">
            Loading ML Infrastructure Knowledge Tree...
          </div>
        }
      >
        <MLInfraKnowledgeGraph
          onSelectTopic={(topicId) => {
            if (isTopicId(topicId)) {
              navigate({ to: "/problems", search: { topic: topicId } });
            }
          }}
        />
      </Suspense>
    </main>
  );
}
