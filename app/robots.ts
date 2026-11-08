import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public marketing and exam pages are crawlable; portals, exam sessions and APIs are not. */
export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  if (!production) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/dashboard", "/teacher", "/school", "/onboarding", "/auth/", "/payments", "/history", "/progress", "/question-bank/practice", "/tests/*/take", "/tests/*/result", "/tests/*/report"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
