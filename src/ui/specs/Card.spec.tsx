import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardActions, CardBody, CardHeader, CardTitle } from "../index";

describe("Card components", () => {
  it("renders Card with title, icon, actions, and children using default props", () => {
    const { container } = render(
      <Card
        title="Card Title"
        icon={<span data-testid="card-icon">Icon</span>}
        actions={<button>Action</button>}
      >
        <div>Card Content</div>
      </Card>,
    );

    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByTestId("card-icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByText("Card Content")).toBeInTheDocument();

    const cardEl = container.firstChild as HTMLElement;
    expect(cardEl).toHaveClass("ui-card");
    expect(cardEl).not.toHaveClass("ui-card--inset");
  });

  it("renders Card with inset variant explicitly and via inset prop", () => {
    const { container: c1 } = render(
      <Card variant="inset" title="Inset Card">
        Content
      </Card>,
    );
    expect(c1.firstChild as HTMLElement).toHaveClass("ui-card--inset");

    const { container: c2 } = render(
      <Card inset title="Inset Prop Card">
        Content
      </Card>,
    );
    expect(c2.firstChild as HTMLElement).toHaveClass("ui-card--inset");
  });

  it("renders Card with custom padding and custom className", () => {
    const { container } = render(<Card className="my-custom-card">Small Padding Content</Card>);

    const cardEl = container.firstChild as HTMLElement;
    expect(cardEl).toHaveClass("my-custom-card");

    const bodyEl = container.querySelector(".ui-card__body");
    expect(bodyEl).toHaveClass("ui-card__body--md");
  });

  it("CardHeader returns null when no content is provided", () => {
    const { container } = render(<CardHeader />);
    expect(container.firstChild).toBeNull();
  });

  it("CardHeader renders children directly when provided", () => {
    render(
      <CardHeader>
        <span data-testid="header-child">Header Child</span>
      </CardHeader>,
    );
    expect(screen.getByTestId("header-child")).toBeInTheDocument();
  });

  it("renders standalone sub-components CardTitle, CardActions, and CardBody with padding none", () => {
    const { container } = render(
      <div>
        <CardTitle>Standalone Title</CardTitle>
        <CardActions>
          <button>Standalone Action</button>
        </CardActions>
        <CardBody>
          <span>No Padding Body</span>
        </CardBody>
      </div>,
    );

    expect(screen.getByText("Standalone Title")).toHaveClass("ui-card__title");
    expect(screen.getByRole("button", { name: "Standalone Action" }).parentElement).toHaveClass(
      "ui-card__actions",
    );
    expect(container.querySelector(".ui-card__body")).toHaveClass("ui-card__body--md");
  });

  it("exposes compound static properties on Card component", () => {
    expect(Card.Header).toBe(CardHeader);
    expect(Card.Title).toBe(CardTitle);
    expect(Card.Actions).toBe(CardActions);
    expect(Card.Body).toBe(CardBody);
  });
});
