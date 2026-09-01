import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateAllStats, UserNotFoundError } from "@/lib/game/stats";
import DashboardStats from "@/components/dashboard/DashboardStats";
import StartGameButton from "@/components/game/StartGameButton";
import { createPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createPageMetadata({
  title: "Dashboard",
  description: "แดชบอร์ด OX Arena — ดูสถิติคะแนนและเริ่มเล่นกับ Bot",
  path: "/dashboard",
});

function clearSessionAndLogin() {
  redirect("/api/auth/invalidate");
}

export default async function DashboardPage() {
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

  let statsByDifficulty;
  try {
    statsByDifficulty = await getOrCreateAllStats(dbUser.id);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      clearSessionAndLogin();
    }
    throw error;
  }

  const serializable = Object.fromEntries(
    Object.entries(statsByDifficulty).map(([level, stat]) => [
      level,
      {
        score: stat.score,
        winStreak: stat.winStreak,
        wins: stat.wins,
        losses: stat.losses,
        draws: stat.draws,
      },
    ])
  );

  return (
    <section className="space-y-8 sm:space-y-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-teal-300 sm:text-4xl md:text-5xl">
            Hello,
            <span className="mt-2 block text-xl font-semibold tracking-normal text-slate-200 sm:text-2xl">
              {session.user.name || session.user.email}
            </span>
          </h1>
        </div>

        <DashboardStats statsByDifficulty={serializable} />
      </div>

      <div className="flex flex-col items-center justify-center gap-6 py-6 text-center sm:gap-8 sm:py-10">
        <div
          className="play-mascot relative flex h-36 w-48 items-center justify-center sm:h-48 sm:w-64"
          aria-hidden
        >
          <span className="play-mascot-x absolute left-0 top-0 font-[family-name:var(--font-display)] text-7xl font-extrabold text-teal-400 sm:text-9xl">
            O
          </span>
          <span className="play-mascot-o absolute bottom-0 right-0 font-[family-name:var(--font-display)] text-7xl font-extrabold text-cyan-300 sm:text-9xl">
            X
          </span>
        </div>

        <p className="max-w-sm px-2 text-base text-slate-300 sm:text-lg">
          พร้อมวัดฝีมือบนกระดาน OX แล้วหรือยัง?
        </p>

        <StartGameButton />
      </div>
    </section>
  );
}
