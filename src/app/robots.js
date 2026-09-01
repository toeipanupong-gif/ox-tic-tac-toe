import { siteConfig } from "@/lib/seo";

export default function robots() {
  const base = siteConfig.url.toString().replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/game", "/profile", "/admin", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
