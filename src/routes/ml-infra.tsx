import React, { Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
      aria-label="ML Infrastructure Knowledge Tree"
      className="w-full h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden bg-[var(--bg-page)]"
    >
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-page)]">
            Loading ML Infrastructure Knowledge Tree...
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
