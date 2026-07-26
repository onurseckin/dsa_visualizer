import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CategoryType } from '../types/dsa';
import { KnowledgeGraph } from '../components/KnowledgeGraph';

export const Route = createFileRoute('/')({
  component: KnowledgeTreePage,
});

function KnowledgeTreePage(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <KnowledgeGraph
      onSelectCategoryFolder={(folder) => {
        // Roadmap nodes emit canonical CategoryType ids as plain strings; the
        // /problems validateSearch re-checks the value against the real list.
        navigate({ to: '/problems', search: { category: folder as CategoryType } });
      }}
    />
  );
}
