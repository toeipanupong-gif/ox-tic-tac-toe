import { Space_Grotesk, Syne } from "next/font/google";
import NavBar from "@/components/auth/NavBar";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "OX Arena — Tic-Tac-Toe",
  description: "เล่น Tic-Tac-Toe กับ Bot พร้อมระบบคะแนน Leaderboard และ Admin",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
