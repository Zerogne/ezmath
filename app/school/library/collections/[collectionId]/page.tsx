import type { Metadata } from "next";
import { CollectionEditor } from "@/components/library/collection-editor";
import { SchoolShell } from "@/components/school/school-shell";
import { getLibraryCollectionEditor } from "@/lib/data/school-library";

export const metadata: Metadata = { title: "Материал", robots: { index: false, follow: false } };

export default async function LibraryCollectionPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  const data = await getLibraryCollectionEditor("school_admin", collectionId);
  const collection = data.collection!;
  return <SchoolShell name={data.accountName} schoolName={data.schoolName} active="/school/library">
    <header><p className="text-xs font-semibold tracking-[.15em] text-primary">МАТЕРИАЛ</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.02em] sm:text-[28px]">{collection.title}</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">{[collection.subject, collection.year, collection.variant && `${collection.variant} хувилбар`].filter(Boolean).join(" · ")}</p></header>
    {/* key resets the editor's local state after a save refreshes the data */}
    <CollectionEditor key={collection.updatedAt} collection={collection} basePath={data.basePath} canEdit={data.canEdit}/>
  </SchoolShell>;
}
