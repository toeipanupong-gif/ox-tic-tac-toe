import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserStat } from "@/lib/game/stats";
import { normalizeDifficulty, difficultyLabel } from "@/lib/game/difficulty";
import GameClient from "@/components/game/GameClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Play",
  description: "เล่น Tic-Tac-Toe กับ Bot ใน OX Arena — เลือกระดับความยากแล้ววัดฝีมือ",
  path: "/game",
});

export default async function GamePage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const difficulty = normalizeDifficulty(params?.difficulty);
  const stat = await getUserStat(session.user.id, difficulty);

  return (
    <section className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-teal-300 sm:text-4xl">
          Play
        </h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
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
