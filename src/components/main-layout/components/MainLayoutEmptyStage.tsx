import React from "react";
import { Card } from "../../../ui";

export const MainLayoutEmptyStage: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <Card
        style={{
          maxWidth: "42ch",
          textAlign: "center",
          borderColor: "var(--border-default)",
        }}
      >
        <p
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "var(--space-2)",
          }}
        >
          Every panel is hidden
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          Turn on Visualizer, Code, Tutorial or Aux data in the navbar to bring the workspace back.
        </p>
      </Card>
    </div>
  );
};
