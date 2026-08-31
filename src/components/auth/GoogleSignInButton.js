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
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-teal-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-teal-300"
      >
        Continue with Google
      </button>
    </form>
  );
}
