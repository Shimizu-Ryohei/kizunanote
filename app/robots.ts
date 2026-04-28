import type { MetadataRoute } from "next";

const defaultSiteUrl = "https://www.kizunanote.com";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? defaultSiteUrl).replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/home", "/profiles", "/settings"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
