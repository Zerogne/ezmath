import type { MetadataRoute } from "next";
import { listPublishedTests } from "@/lib/data/test-repository";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tests = await listPublishedTests().catch(() => []);
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") => ({ url: `${SITE_URL}${path}`, changeFrequency, priority });
  return [
    page("", 1),
    page("/tests?exam=EYESH", 0.9, "daily"),
    page("/tests?exam=SAT", 0.8, "daily"),
    page("/pricing", 0.6, "monthly"),
    page("/register", 0.5, "monthly"),
    page("/privacy", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
    ...tests.map((test) => page(`/tests/${test.id}`, test.type === "previous-year" ? 0.8 : 0.6, "monthly")),
  ];
}
