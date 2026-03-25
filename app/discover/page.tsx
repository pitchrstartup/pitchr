import { getDiscoverFeed } from "@/actions/projects";
import { submitSwipe } from "@/actions/swipes";
import { Navigation } from "@/components/Navigation";
import { SwipeDeck } from "@/components/SwipeDeck";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const projects = await getDiscoverFeed();

  async function handleSwipe(projectId: string, direction: "RIGHT" | "LEFT") {
    "use server";
    await submitSwipe(projectId, direction);
  }

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-background">
      <Navigation />
      <SwipeDeck projects={projects} onSwipe={handleSwipe} />
    </main>
  );
}
