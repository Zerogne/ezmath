/**
 * Canonical public origin for metadata, sitemap and robots. Set NEXT_PUBLIC_SITE_URL once a custom
 * domain is live; until then Vercel's production domain is used, so preview builds never become canonical.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://ezmath-rho.vercel.app")).replace(/\/$/, "");

export const SITE_NAME = "EzMath";
export const SITE_DESCRIPTION = "ЭЕШ болон SAT-ын математикийн шалгалтад өмнөх оны хувилбар, mock сорил, хичээл, ахицын тайлангаар бэлдэх онлайн платформ.";
