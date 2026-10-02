import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LessonForm } from "@/components/admin/lessons/lesson-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/shadcn/badge";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminLessonsPage() {
  const data = isSupabaseConfigured() ? (await (await createClient()).from("course_lessons").select("id,title,module_id,status,duration_minutes,slug").order("created_at", { ascending: false }).limit(100)).data : [];
  return <div className="mx-auto max-w-[1280px]"><AdminPageHeader title="Онолын сэдвүүд" description="Шинэ сэдэв үүсгэж, тохирох хичээлд нийтэлнэ."/>
    {!!data?.length&&<Card className="mt-7 overflow-hidden"><CardHeader className="border-b"><CardTitle>Админаас нэмсэн сэдвүүд</CardTitle></CardHeader><CardContent className="divide-y p-0">{data.map((item)=><div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm"><div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.module_id} · {item.duration_minutes} мин</p></div><Badge variant={item.status==="published"?"success":"secondary"} className={item.status!=="published"?"bg-amber-50 text-amber-700":undefined}>{item.status}</Badge>{item.status==="published"&&<Link href={`/lesson/theory-core/${item.slug}`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={`${item.title} нээх`}><ExternalLink size={16}/></Link>}</div>)}</CardContent></Card>}
    <LessonForm/>
  </div>;
}
