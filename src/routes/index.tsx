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
      className="flex flex-col items-center justify-start text-center px-4 md:px-8 py-6 w-full max-w-7xl mx-auto box-border flex-1 gap-6 overflow-y-auto"
    >
      <PageHeader
        title="Knowledge Tree"
        description="Interactive Data Structures and Algorithms Prerequisite Roadmap"
        className="mb-2 text-center flex flex-col items-center justify-center max-w-3xl mx-auto"
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
