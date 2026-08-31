import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminPanel from "@/components/admin/AdminPanel";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [users, totalGames, totalPlayers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { score: "desc" },
      include: {
        games: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    }),
    prisma.game.count(),
    prisma.user.count(),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-amber-300">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-slate-300">ตรวจสอบผู้เล่น คะแนน และประวัติเกม</p>
      </div>
      <AdminPanel
        users={users}
        totalGames={totalGames}
        totalPlayers={totalPlayers}
      />
    </section>
  );
}
