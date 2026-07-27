import React, { Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../ui/templates/PageHeader";
import { CategoryType } from "../types/dsa";

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
      aria-label="ML Infra Roadmap"
      className="relative w-[90%] py-8 mx-auto flex flex-col items-center gap-8 text-center box-border flex-1"
    >
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <PageHeader
        title="ML Infrastructure Roadmap"
        description="Interactive Machine Learning Infrastructure & System Design Prerequisite Roadmap"
        className="text-center flex flex-col items-center justify-center max-w-3xl mx-auto mt-6 md:mt-8 mb-6"
      />
      <Suspense
        fallback={
          <div className="w-full py-12 text-center text-[var(--text-muted)]">
            Loading ML Infrastructure Roadmap...
          </div>
        }
      >
        <MLInfraKnowledgeGraph
          onSelectCategoryFolder={(folder) => {
            navigate({ to: "/problems", search: { category: folder as CategoryType } });
          }}
        />
      </Suspense>
    </main>
  );
}
