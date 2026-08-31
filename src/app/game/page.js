import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserStat } from "@/lib/game/stats";
import { normalizeDifficulty, difficultyLabel } from "@/lib/game/difficulty";
import GameClient from "@/components/game/GameClient";

export default async function GamePage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const difficulty = normalizeDifficulty(params?.difficulty);
  const stat = await getUserStat(session.user.id, difficulty);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-teal-300">
          Play
        </h1>
        <p className="mt-2 text-slate-300">
          ผู้เล่น vs Bot — ระดับ {difficultyLabel(difficulty)}
        </p>
      </div>
      <GameClient
        initialScore={stat.score}
        initialWinStreak={stat.winStreak}
        difficulty={difficulty}
      />
    </section>
  );
}
