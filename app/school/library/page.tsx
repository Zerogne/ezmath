import type { Metadata } from "next";
import { LibraryManager } from "@/components/library/library-manager";
import { SchoolShell } from "@/components/school/school-shell";
import { getSchoolAdminLibrary } from "@/lib/data/school-library";

export const metadata: Metadata = { title: "Сургуулийн бодлогын сан", robots: { index: false, follow: false } };

export default async function SchoolLibraryPage() {
  const data = await getSchoolAdminLibrary();
  return <SchoolShell name={data.accountName} schoolName={data.schoolName} active="/school/library"><header><p className="text-xs font-semibold tracking-[.15em] text-primary">БОДЛОГЫН САН</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.02em] sm:text-[28px]">{data.schoolName}-ийн материал</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">Сургуулийн бүх багшийн үүсгэсэн материалыг харах, засах, удирдах хэсэг.</p></header><LibraryManager materials={data.materials} currentUserId={data.currentUserId} canManageAll={data.canManageAll}/></SchoolShell>;
}
