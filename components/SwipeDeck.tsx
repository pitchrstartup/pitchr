"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import type { Project } from "@prisma/client";
import { ProjectCard } from "@/components/ProjectCard";

type SwipeDirection = "RIGHT" | "LEFT";

type SwipeDeckProps = {
  projects: Project[];
  onSwipe: (projectId: string, direction: SwipeDirection) => Promise<void>;
};

export function SwipeDeck({ projects, onSwipe }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const x = useMotionValue(0);

  const activeProject = projects[index];
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const rightOpacity = useTransform(x, [0, 180], [0, 0.28]);
  const leftOpacity = useTransform(x, [-180, 0], [0.28, 0]);

  const seenAll = useMemo(() => index >= projects.length, [index, projects.length]);

  const handleSwipe = (direction: SwipeDirection) => {
    if (!activeProject || pending) return;

    startTransition(async () => {
      await onSwipe(activeProject.id, direction);
      setIndex((prev) => prev + 1);
      x.set(0);
    });
  };

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden pb-28 lg:pb-6">
      {seenAll ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-text-secondary">
          You've seen all projects — check back later!
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProject.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x, rotate }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 110) {
                  handleSwipe("RIGHT");
                } else if (info.offset.x < -110) {
                  handleSwipe("LEFT");
                }
              }}
              className="drag-card absolute inset-3 lg:inset-8"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div className="pointer-events-none absolute inset-0 rounded-card bg-swipe-right" style={{ opacity: rightOpacity }} />
              <motion.div className="pointer-events-none absolute inset-0 rounded-card bg-swipe-left" style={{ opacity: leftOpacity }} />
              <ProjectCard project={activeProject} />
            </motion.div>
          </AnimatePresence>

          <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 gap-2 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:absolute lg:bottom-6 lg:left-8 lg:right-8 lg:rounded-2xl lg:border">
            <button
              type="button"
              disabled={pending}
              onClick={() => handleSwipe("LEFT")}
              className="min-h-16 rounded-xl bg-swipe-left/20 px-4 text-base font-bold text-red-300 disabled:opacity-50"
            >
              ❌ LEFT
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => handleSwipe("RIGHT")}
              className="min-h-16 rounded-xl bg-swipe-right/20 px-4 text-base font-bold text-green-300 disabled:opacity-50"
            >
              ✅ RIGHT
            </button>
          </div>
        </>
      )}
    </section>
  );
}
