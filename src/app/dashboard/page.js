import { auth, loadUserDisplayPii } from "@/lib/auth";
import { getOrCreateAllStats, UserNotFoundError } from "@/lib/game/stats";
import DashboardStats from "@/components/dashboard/DashboardStats";
import StartGameButton from "@/components/game/StartGameButton";
import { createPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createPageMetadata({
  title: "Dashboard",
  description: "แดชบอร์ด OX Arena — ดูสถิติคะแนนและเริ่มเล่นกับ Bot",
  path: "/dashboard",
  noIndex: true,
});

function clearSessionAndLogin() {
  redirect("/api/auth/invalidate");
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    clearSessionAndLogin();
  }

  let statsByDifficulty;
  let display;
  try {
    [statsByDifficulty, display] = await Promise.all([
      getOrCreateAllStats(session.user.id, undefined, {
        skipAssert: true,
      }),
      loadUserDisplayPii(session.user.id),
    ]);
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
              {display.name || display.email}
            </span>
          </h1>
        </div>

        <DashboardStats statsByDifficulty={serializable} />
      </div>

      <div className="flex flex-col items-center justify-center gap-6 py-6 text-center sm:gap-8 sm:py-10">
        <div
          className="play-mascot relative flex h-44 w-56 items-center justify-center sm:h-52 sm:w-72 md:h-56 md:w-80 lg:h-72 lg:w-60"
          aria-hidden
        >
          <span className="play-mascot-x absolute -left-2 -top-5 sm:-left-3 sm:-top-6 md:-left-2 md:-top-5 lg:left-0 lg:top-0 font-[family-name:var(--font-display)] text-[10.5rem] font-extrabold leading-none text-teal-400 sm:text-[12rem] md:text-[13rem] lg:text-[11rem]">
            O
          </span>
          <span className="play-mascot-o absolute bottom-0 right-0 font-[family-name:var(--font-display)] text-[10.5rem] font-extrabold leading-none text-cyan-300 sm:text-[12rem] md:text-[13rem] lg:text-[11rem]">
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
