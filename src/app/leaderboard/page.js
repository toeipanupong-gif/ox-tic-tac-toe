import { prisma } from "@/lib/prisma";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

function winRate(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return 0;
  return wins / total;
}

export default async function LeaderboardPage() {
  const players = await prisma.user.findMany({
    where: { role: "USER" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      score: true,
      wins: true,
      losses: true,
      draws: true,
    },
    take: 100,
  });

  players.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const rateDiff = winRate(b.wins, b.losses, b.draws) - winRate(a.wins, a.losses, a.draws);
    if (rateDiff !== 0) return rateDiff;
    return a.name?.localeCompare(b.name || "") || 0;
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-teal-300">
          Leaderboard
        </h1>
        <p className="mt-2 text-slate-300">
          เรียงตาม Score → Wins → Win Rate (ไม่รวม Admin)
        </p>
      </div>
      <LeaderboardTable players={players} />
    </section>
  );
}
