import { siteConfig } from "@/lib/seo";

const PUBLIC_PATHS = ["/", "/login", "/leaderboard", "/privacy", "/terms"];

export default function sitemap() {
  const base = siteConfig.url.toString().replace(/\/$/, "");
  const lastModified = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
