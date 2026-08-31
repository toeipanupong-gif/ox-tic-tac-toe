import Image from "next/image";
import { signIn } from "@/lib/auth";

export default function GoogleSignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/dashboard" });
      }}
    >
      <button
        type="submit"
        className="login-btn inline-flex w-full items-center justify-center gap-3 rounded-xl bg-teal-400 px-6 py-3 text-base font-semibold text-slate-950 hover:bg-teal-300"
      >
        <Image
          src="/google.png"
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] shrink-0"
          aria-hidden
        />
        Continue with Google
      </button>
    </form>
  );
}
