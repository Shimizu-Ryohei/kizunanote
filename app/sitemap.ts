import type { MetadataRoute } from "next";

const defaultSiteUrl = "https://www.kizunanote.com";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? defaultSiteUrl).replace(/\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();
  const routes = [
    { path: "/", priority: 1 },
    { path: "/lp", priority: 1 },
    { path: "/plans", priority: 0.8 },
    { path: "/legal", priority: 0.4 },
    { path: "/legal/commerce", priority: 0.4 },
    { path: "/contact", priority: 0.4 },
    { path: "/sign-up", priority: 0.7 },
  ];

  return routes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));
}
