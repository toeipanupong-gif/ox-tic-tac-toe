import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeaderboardView from "@/components/leaderboard/LeaderboardView";
import { DEFAULT_DIFFICULTY } from "@/lib/game/difficulty";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { createPageMetadata } from "@/lib/seo";
import { mapLeaderboardPlayer } from "@/lib/leaderboard";
import { findSelfRank } from "@/lib/leaderboard-server";

export const metadata = createPageMetadata({
  title: "Leaderboard",
  description: "ตารางอันดับ OX Arena — ดูคะแนนผู้เล่นตามระดับความยาก",
  path: "/leaderboard",
});

export default async function LeaderboardPage() {
  const session = await auth();
  const difficulty = DEFAULT_DIFFICULTY;
  const pageSize = DEFAULT_PAGE_SIZE;
  const currentUserId = session?.user?.id ?? null;

  const where = {
    difficulty,
    user: { role: "USER" },
  };

  const [total, stats] = await Promise.all([
    prisma.userStat.count({ where }),
    prisma.userStat.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: [
        { score: "desc" },
        { wins: "desc" },
        { losses: "asc" },
        { user: { name: "asc" } },
      ],
      take: pageSize,
    }),
  ]);

  const players = stats.map((stat) =>
    mapLeaderboardPlayer(stat, { isSelf: stat.user.id === currentUserId })
  );

  const self = currentUserId
    ? await findSelfRank(currentUserId, difficulty)
    : null;

  return (
    <section className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-teal-300 sm:text-4xl">
          Leaderboard
        </h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          จัดอันดับคะแนนตามระดับ
        </p>
      </div>

      <LeaderboardView
        initialDifficulty={difficulty}
        initialData={{
          players,
          total,
          page: 1,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          self,
          currentUserId,
        }}
      />
    </section>
  );
}
