import { signOut } from "@/lib/auth";

/** Route Handler — เคลียร์ session cookie แล้วไป /login (เรียกจาก Server Component ไม่ได้) */
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
