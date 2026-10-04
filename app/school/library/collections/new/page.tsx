import type { Metadata } from "next";
import { CollectionEditor } from "@/components/library/collection-editor";
import { SchoolShell } from "@/components/school/school-shell";
import { getLibraryCollectionEditor } from "@/lib/data/school-library";

export const metadata: Metadata = { title: "Шинэ материал", robots: { index: false, follow: false } };

export default async function NewLibraryCollectionPage() {
  const data = await getLibraryCollectionEditor("school_admin", null);
  return <SchoolShell name={data.accountName} schoolName={data.schoolName} active="/school/library">
    <header><p className="text-xs font-semibold tracking-[.15em] text-primary">БОДЛОГЫН САН</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.02em] sm:text-[28px]">Шинэ материал</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">Бүтэн материалын бодлогуудыг дарааллаар нь оруулна. Шалгалт үүсгэхдээ бүгдийг эсвэл заримыг нь сонгоно.</p></header>
    <CollectionEditor collection={null} basePath={data.basePath} canEdit/>
  </SchoolShell>;
}
