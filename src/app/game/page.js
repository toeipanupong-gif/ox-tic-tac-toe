import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserStat, UserNotFoundError } from "@/lib/game/stats";
import { normalizeDifficulty, difficultyLabel } from "@/lib/game/difficulty";
import GameClient from "@/components/game/GameClient";
import { createPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createPageMetadata({
  title: "Play",
  description: "เล่น Tic-Tac-Toe กับ Bot ใน OX Arena — เลือกระดับความยากแล้ววัดฝีมือ",
  path: "/game",
});

function clearSessionAndLogin() {
  redirect("/api/auth/invalidate");
}

export default async function GamePage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.id) {
    clearSessionAndLogin();
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!dbUser) {
    clearSessionAndLogin();
  }

  const params = await searchParams;
  const difficulty = normalizeDifficulty(params?.difficulty);

  let stat;
  try {
    stat = await getUserStat(dbUser.id, difficulty);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      clearSessionAndLogin();
    }
    throw error;
  }

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
