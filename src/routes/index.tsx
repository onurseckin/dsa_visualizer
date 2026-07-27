import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../ui/templates/PageHeader";
import { CategoryType } from "../types/dsa";
import { KnowledgeGraph } from "../ui";

export const Route = createFileRoute("/")({
  component: KnowledgeTreePage,
});

function KnowledgeTreePage(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <main
      aria-label="Algorithm Roadmap"
      className="relative max-w-7xl px-6 md:px-8 py-8 mx-auto flex flex-col items-center gap-8 text-center w-full box-border flex-1 overflow-y-auto"
    >
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <PageHeader
        title="Knowledge Tree"
        description="Interactive Data Structures and Algorithms Prerequisite Roadmap"
        className="text-center flex flex-col items-center justify-center max-w-3xl mx-auto mt-6 md:mt-8 mb-6"
      />
      <KnowledgeGraph
        onSelectCategoryFolder={(folder) => {
          // Roadmap nodes emit canonical CategoryType ids as plain strings; the
          // /problems validateSearch re-checks the value against the real list.
          navigate({ to: "/problems", search: { category: folder as CategoryType } });
        }}
      />
    </main>
  );
}
