import type { Metadata } from "next";
import { LibraryManager } from "@/components/library/library-manager";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { getTeacherLibrary } from "@/lib/data/school-library";

export const metadata: Metadata = { title: "Сургуулийн бодлогын сан", robots: { index: false, follow: false } };

export default async function TeacherLibraryPage() {
  const data = await getTeacherLibrary();
  return <TeacherShell name={data.accountName} schoolName={data.schoolName} active="/teacher/library"><header><p className="text-xs font-semibold tracking-[.15em] text-primary">БОДЛОГЫН САН</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.02em] sm:text-[28px]">Сургуулийн материал</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">ЭЕШ шиг бүтэн материал эсвэл ганц бодлого нэмж, сургуулийнхаа багш нартай хуваалцаарай. Шалгалт үүсгэхдээ эндээс сонгоно.</p></header><LibraryManager materials={data.materials} collections={data.collections} currentUserId={data.currentUserId} canManageAll={data.canManageAll} basePath="/teacher/library"/></TeacherShell>;
}
