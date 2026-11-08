import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { RedesignLanding } from "@/components/home/redesign/redesign-landing";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/" } };

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "EducationalOrganization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.svg`, description: SITE_DESCRIPTION, areaServed: "MN" },
    { "@type": "WebSite", "@id": `${SITE_URL}/#site`, name: SITE_NAME, url: SITE_URL, inLanguage: "mn", publisher: { "@id": `${SITE_URL}/#org` } },
  ],
};

export default function HomePage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}/><RedesignLanding/></>;
}
