import React from "react";

export interface MLInfraKnowledgeGraphProps {
  onSelectCategoryFolder?: (folder: string) => void;
}

export const MLInfraKnowledgeGraph: React.FC<MLInfraKnowledgeGraphProps> = ({ onSelectCategoryFolder }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Interactive Machine Learning Infrastructure Roadmap"
      onClick={() => onSelectCategoryFolder?.("")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectCategoryFolder?.("");
        }
      }}
      className="w-full flex flex-col items-center justify-center mx-auto gap-4 relative cursor-pointer outline-none focus:outline-2 focus:outline-[var(--border-accent)]"
    >
      <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-8 shadow-2xl relative overflow-hidden mx-auto text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Machine Learning Infrastructure Roadmap
        </h2>
        <p className="text-[var(--text-secondary)] text-sm max-w-2xl mx-auto">
          Interactive prerequisite roadmap for distributed training, GPU memory management, inference acceleration, and ML cluster infrastructure.
        </p>
      </div>
    </div>
  );
};

export default MLInfraKnowledgeGraph;
