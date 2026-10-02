import type { Metadata } from "next";
import { Building2, GraduationCap, School, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AddSchoolManagerForm, SchoolOnboardingForm } from "@/components/admin/schools/school-onboarding-forms";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/shadcn/badge";
import { listAdminSchools } from "@/lib/admin/schools";

export const metadata: Metadata = { title: "Сургуулийн удирдлага" };

export default async function AdminSchoolsPage() {
  const schools = await listAdminSchools();
  return <>
    <AdminPageHeader title="Сургуулиуд" description="Сургууль, удирдлагын аккаунт болон хэрэглэгчдийн тоог нэг дор удирдана." />
    <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-4">
        {schools.length ? schools.map((school) => <Card key={school.id}>
          <CardHeader>
          <div className="flex items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><School size={20} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{school.name}</h2><Badge variant={school.is_active ? "success" : "secondary"}>{school.is_active ? "Идэвхтэй" : "Идэвхгүй"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{school.slug}</p></div></div>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center"><Metric icon={GraduationCap} value={school.teacherCount} label="Багш" /><Metric icon={Users} value={school.studentCount} label="Сурагч" /><Metric icon={Building2} value={school.classCount} label="Анги" /></div>
          <div className="mt-5 border-t pt-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Удирдлагын аккаунт</p><span className="text-xs text-muted-foreground">{school.accounts.length} эрх</span></div>{school.accounts.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{school.accounts.map((account) => <div key={account.id} className="rounded-xl bg-muted px-4 py-3"><p className="truncate text-sm font-semibold">{account.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{account.email}</p></div>)}</div> : <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Удирдлагын аккаунт үүсгээгүй байна.</p>}</div>
          </CardContent>
        </Card>) : <Card className="border-dashed p-10 text-center"><School size={24} className="mx-auto text-muted-foreground" /><p className="mt-3 font-semibold">Сургууль бүртгэгдээгүй байна</p><p className="mt-1 text-sm text-muted-foreground">Баруун талын маягтаар эхний сургуулиа нээнэ үү.</p></Card>}
      </section>
      <aside className="h-fit space-y-5 xl:sticky xl:top-24"><SchoolOnboardingForm /><AddSchoolManagerForm schools={schools.map(({ id, name }) => ({ id, name }))} /></aside>
    </div>
  </>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return <div className="rounded-xl bg-muted p-3"><Icon size={16} className="mx-auto text-primary" /><p className="mt-2 font-bold">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>;
}
