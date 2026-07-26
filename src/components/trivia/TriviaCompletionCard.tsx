import { Trophy } from "lucide-react";
import { Badge, Card } from "../../ui";

export interface TriviaCompletionCardProps {
  sourcesCount: number;
  maxBlanks: number;
}

export function TriviaCompletionCard({ sourcesCount, maxBlanks }: TriviaCompletionCardProps) {
  return (
    <Card
      className="border-[var(--border-default)]"
      icon={<Trophy aria-hidden="true" />}
      title="Deck complete"
      actions={
        <Badge variant="success" size="md">
          Curriculum covered
        </Badge>
      }
    >
      <span className="text-xs color-[var(--text-muted)] leading-relaxed">
        {`Every line of all ${sourcesCount} algorithm${sourcesCount === 1 ? "" : "s"} has been drilled at up to ${maxBlanks} blank${maxBlanks === 1 ? "" : "s"}. Raise the hardest level to keep going, add more algorithms, or reset progress to start the deck over.`}
      </span>
    </Card>
  );
}
