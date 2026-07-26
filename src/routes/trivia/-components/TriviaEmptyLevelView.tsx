import { Home, SlidersHorizontal } from "lucide-react";
import { Button, ButtonGroup, Card } from "../../../ui";

interface TriviaEmptyLevelViewProps {
  level: number;
  onEditSettings: () => void;
  onBackToHome: () => void;
}

export function TriviaEmptyLevelView({
  level,
  onEditSettings,
  onBackToHome,
}: TriviaEmptyLevelViewProps): React.ReactElement {
  return (
    <Card className="border-[var(--border-default)]" title="Nothing to drill at this level">
      <div className="flex flex-col gap-3">
        <span className="text-xs text-[var(--text-muted)] leading-normal">
          {`No algorithm in the deck has ${level} lines to hide at once. Add a longer solution or lower the hardest level in the deck setup.`}
        </span>
        <ButtonGroup gap="sm">
          <Button
            size="sm"
            variant="secondary"
            icon={<SlidersHorizontal aria-hidden="true" />}
            onClick={onEditSettings}
          >
            Edit deck & settings
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Home aria-hidden="true" />}
            onClick={onBackToHome}
          >
            Back to Trivia Home
          </Button>
        </ButtonGroup>
      </div>
    </Card>
  );
}
