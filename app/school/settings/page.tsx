import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { ChangePasswordForm } from "@/components/school/change-password-form";
import { SchoolShell } from "@/components/school/school-shell";
import { requireSchoolAdmin } from "@/lib/data/school-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Тохиргоо", robots: { index: false, follow: false } };

export default async function SchoolSettingsPage() {
  const { user, profile, schoolId } = await requireSchoolAdmin("/school/settings");
  const { data: school } = await createAdminClient().from("schools").select("name").eq("id", schoolId).maybeSingle();
  const temporary = user.user_metadata?.password_temporary === true;

  return <SchoolShell name={profile.full_name || "Сургуулийн админ"} schoolName={school?.name || "Сургууль"} active="/school/settings">
    <header>
      <p className="text-xs font-semibold tracking-[.15em] text-[#2B4BE8]">ТОХИРГОО</p>
      <h1 className="mt-2 text-[26px] font-medium tracking-[-0.03em] sm:text-[30px]">Бүртгэлийн тохиргоо</h1>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Нэвтрэх мэдээлэл болон нууц үгээ удирдана.</p>
    </header>
    <div className="mt-7 grid max-w-2xl gap-5">
      <section className="rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 sm:p-6">
        <h2 className="font-semibold">Нэвтрэх мэдээлэл</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Нэр</dt><dd className="mt-0.5 font-medium">{profile.full_name || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Имэйл</dt><dd className="mt-0.5 break-all font-medium">{user.email}</dd></div>
        </dl>
      </section>
      <section id="password" className="scroll-mt-24 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 sm:p-6">
        <h2 className="font-semibold">Нууц үг солих</h2>
        <p className="mt-1 text-sm text-muted-foreground">Солисны дараа шинэ нууц үгээрээ нэвтэрнэ. Энэ төхөөрөмж дээрх нэвтрэлт хэвээр үлдэнэ.</p>
        {temporary && <p className="mt-4 flex gap-2 rounded-[16px] border-2 border-[#EEF0F6] border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle size={17} className="mt-0.5 shrink-0"/>Та системээс өгсөн түр нууц үгээр нэвтэрсэн байна. Аюулгүй байдлын үүднээс өөрийн нууц үгээ тохируулна уу.</p>}
        <div className="mt-5"><ChangePasswordForm/></div>
      </section>
    </div>
  </SchoolShell>;
}
