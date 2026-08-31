import { Chakra_Petch } from "next/font/google";
import NavBar from "@/components/auth/NavBar";
import "./globals.css";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "OX Arena — Tic-Tac-Toe",
  description: "เล่น Tic-Tac-Toe กับ Bot พร้อมระบบคะแนน Leaderboard และ Admin",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${chakraPetch.variable} h-full antialiased`}>
      <body className={`${chakraPetch.className} min-h-full flex flex-col`}>
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
