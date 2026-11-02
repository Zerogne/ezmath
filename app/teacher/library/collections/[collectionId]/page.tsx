import type { Metadata } from "next";
import { CollectionEditor } from "@/components/library/collection-editor";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { getLibraryCollectionEditor } from "@/lib/data/school-library";

export const metadata: Metadata = { title: "Материал", robots: { index: false, follow: false } };

export default async function LibraryCollectionPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  const data = await getLibraryCollectionEditor("teacher", collectionId);
  const collection = data.collection!;
  return <TeacherShell name={data.accountName} schoolName={data.schoolName} active="/teacher/library">
    <header><p className="text-xs font-semibold tracking-[.15em] text-[#2B4BE8]">МАТЕРИАЛ</p><h1 className="mt-2 text-[26px] font-medium tracking-[-0.03em] sm:text-[30px]">{collection.title}</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">{[collection.subject, collection.year, collection.variant && `${collection.variant} хувилбар`].filter(Boolean).join(" · ")}</p></header>
    {/* key resets the editor's local state after a save refreshes the data */}
    <CollectionEditor key={collection.updatedAt} collection={collection} basePath={data.basePath} canEdit={data.canEdit}/>
  </TeacherShell>;
}
