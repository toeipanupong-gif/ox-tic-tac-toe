import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GameClient from "@/components/game/GameClient";

export default async function GamePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { score: true, winStreak: true },
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-teal-300">
          Play
        </h1>
        <p className="mt-2 text-slate-300">ผู้เล่น vs Bot (Minimax)</p>
      </div>
      <GameClient
        initialScore={user?.score ?? 0}
        initialWinStreak={user?.winStreak ?? 0}
      />
    </section>
  );
}
