import { auth, signOut } from "@/lib/auth";
import NavBarClient from "./NavBarClient";

export default async function NavBar() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "ADMIN";

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return <NavBarClient isAdmin={isAdmin} logoutAction={logoutAction} />;
}
