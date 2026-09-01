import { Chakra_Petch } from "next/font/google";
import NavBar from "@/components/auth/NavBar";
import SiteFooter from "@/components/legal/SiteFooter";
import { siteConfig } from "@/lib/seo";
import "./globals.css";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  metadataBase: siteConfig.url,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "OX Arena",
    "Tic-Tac-Toe",
    "OX",
    "เกม OX",
    "leaderboard",
    "เล่นกับ Bot",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.png"],
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 512,
        height: 512,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${chakraPetch.variable} min-h-full antialiased`}>
      <body className={`${chakraPetch.className} flex min-h-full flex-col`}>
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-6 sm:px-4 sm:py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
