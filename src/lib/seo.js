const SITE_NAME = "OX Arena";
const SITE_TAGLINE = "Tic-Tac-Toe";
const DEFAULT_DESCRIPTION =
  "เล่น Tic-Tac-Toe กับ Bot พร้อมระบบคะแนน Leaderboard และ Admin — วัดฝีมือ จัดอันดับใน OX Arena";

function siteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.AUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return new URL(withProtocol);
}

export const siteConfig = {
  name: SITE_NAME,
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: DEFAULT_DESCRIPTION,
  url: siteUrl(),
  locale: "th_TH",
  ogImage: "/favicon.png",
};

/** @param {{ title?: string, description?: string, path?: string, noIndex?: boolean }} opts */
export function createPageMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
} = {}) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : siteConfig.title;
  const url = new URL(path, siteConfig.url).toString();

  return {
    title: title ? title : { absolute: siteConfig.title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: SITE_NAME,
      title: pageTitle,
      description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 512,
          height: 512,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description,
      images: [siteConfig.ogImage],
    },
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : { robots: { index: true, follow: true } }),
  };
}
