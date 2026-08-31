import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeaderboardView from "@/components/leaderboard/LeaderboardView";
import { DEFAULT_DIFFICULTY } from "@/lib/game/difficulty";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Leaderboard",
  description: "ตารางอันดับ OX Arena — ดูคะแนนผู้เล่นตามระดับความยาก",
  path: "/leaderboard",
});

export default async function LeaderboardPage() {
  const session = await auth();
  const difficulty = DEFAULT_DIFFICULTY;
  const pageSize = DEFAULT_PAGE_SIZE;

  const where = {
    difficulty,
    user: { role: "USER" },
  };

  const [total, stats] = await Promise.all([
    prisma.userStat.count({ where }),
    prisma.userStat.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
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

  const players = stats.map((s) => ({
    id: s.user.id,
    name: s.user.name,
    email: s.user.email,
    score: s.score,
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
  }));

  let self = null;
  const currentUserId = session?.user?.id ?? null;
  if (currentUserId) {
    const selfStat = await prisma.userStat.findUnique({
      where: {
        userId_difficulty: { userId: currentUserId, difficulty },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (selfStat?.user?.role === "USER") {
      const betterCount = await prisma.userStat.count({
        where: {
          difficulty,
          user: { role: "USER" },
          OR: [
            { score: { gt: selfStat.score } },
            {
              AND: [
                { score: selfStat.score },
                { wins: { gt: selfStat.wins } },
              ],
            },
            {
              AND: [
                { score: selfStat.score },
                { wins: selfStat.wins },
                { losses: { lt: selfStat.losses } },
              ],
            },
          ],
        },
      });
      self = {
        rank: betterCount + 1,
        player: {
          id: selfStat.user.id,
          name: selfStat.user.name,
          email: selfStat.user.email,
          score: selfStat.score,
          wins: selfStat.wins,
          losses: selfStat.losses,
          draws: selfStat.draws,
        },
      };
    }
  }

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
