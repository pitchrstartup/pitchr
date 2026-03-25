import type { Project } from "@prisma/client";
import { Section } from "./Section";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="w-full h-full bg-surface border border-border rounded-card shadow-card flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-start gap-3 mb-2">
          {project.logoUrl ? (
            <img
              src={project.logoUrl}
              alt={`${project.name} logo`}
              className="w-10 h-10 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <span className="text-accent font-bold text-base">
                {project.name[0]}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-text-primary leading-tight truncate">
              {project.name}
            </h2>
            <p className="text-accent font-medium text-sm leading-snug mt-0.5">
              {project.tagline}
            </p>
          </div>
        </div>
        {project.tokenMint && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
            Token: {project.tokenMint.slice(0, 6)}…
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <Section label="About" content={project.description} />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {project.builderAvatar ? (
            <img
              src={project.builderAvatar}
              alt={project.builderName}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-surface-2 border border-border flex items-center justify-center">
              <span className="text-[9px] text-text-secondary font-bold">
                {project.builderName[0]}
              </span>
            </div>
          )}
          <span className="text-xs text-text-secondary">{project.builderName}</span>
        </div>
        <div className="flex items-center gap-3">
          {project.twitterUrl && (
            <a
              href={project.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-text-secondary hover:text-accent transition-colors"
            >
              X / Twitter
            </a>
          )}
          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-text-secondary hover:text-accent transition-colors"
            >
              Website
            </a>
          )}
          {!project.twitterUrl && !project.websiteUrl && (
            <span className="text-xs text-text-secondary/50">drag to swipe</span>
          )}
        </div>
      </div>
    </div>
  );
}
