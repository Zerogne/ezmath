"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookPlus, Plus, Trash2 } from "lucide-react";
import { createLesson, updateLesson, type LessonFormState } from "@/app/admin/lessons/actions";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/shadcn/button";

const initialState: LessonFormState = {};

export type LessonEditorData = {
  id: string;
  title: string;
  slug: string;
  moduleId: string;
  summary: string;
  durationMinutes: number;
  sortOrder: number;
  status: "draft" | "published";
  objectives: string[];
  sections: { title: string; body: string; example?: string }[];
};

type SectionDraft = { id: string; title: string; body: string; example: string };

function blankSection(): SectionDraft {
  return { id: crypto.randomUUID(), title: "", body: "", example: "" };
}

export function LessonForm({ initial }: { initial?: LessonEditorData }) {
  const router = useRouter();
  const action = initial ? updateLesson : createLesson;
  const [state, formAction, pending] = useActionState(action, initialState);
  useEffect(() => { if (!initial && state.id) router.replace(`/admin/lessons/${state.id}/edit`); }, [initial, router, state.id]);
  const [sections, setSections] = useState<SectionDraft[]>(
    initial?.sections.map((section) => ({ id: crypto.randomUUID(), title: section.title, body: section.body, example: section.example ?? "" })) ?? [],
  );

  const updateSection = (id: string, patch: Partial<SectionDraft>) => setSections((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const addSection = () => { if (sections.length < 10) setSections((items) => [...items, blankSection()]); };
  const removeSection = (id: string) => setSections((items) => items.filter((item) => item.id !== id));

  return <form action={formAction} className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    {initial && <input type="hidden" name="lessonId" value={initial.id}/>}
    <input type="hidden" name="sectionCount" value={sections.length}/>
    {!initial && <input type="hidden" name="status" value="draft"/>}
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Үндсэн мэдээлэл</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Сэдвийн нэр" className="sm:col-span-2"><Input name="title" required minLength={3} maxLength={160} defaultValue={initial?.title} placeholder="Жишээ: Анхны тооны тархалт"/></Field>
          <Field label="URL slug"><Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={initial?.slug} placeholder="prime-number-distribution"/></Field>
          <Field label="Хичээл"><Select name="moduleId" required defaultValue={initial?.moduleId}><SelectTrigger><SelectValue placeholder="Хичээл сонгох"/></SelectTrigger><SelectContent>{coreMathCourse.modules.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Хугацаа (минут)"><Input name="durationMinutes" type="number" required min={1} max={300} defaultValue={initial?.durationMinutes ?? 15}/></Field>
          {initial && <Field label="Дараалал"><Input name="sortOrder" type="number" min={0} max={10000} defaultValue={initial.sortOrder}/></Field>}
          <Field label="Товч тайлбар" className="sm:col-span-2"><Textarea name="summary" required minLength={10} maxLength={1000} rows={4} defaultValue={initial?.summary} placeholder="Сурагч энэ хичээлээс юу ойлгох вэ?"/></Field>
          <Field label="Суралцах зорилгууд — мөр бүрт нэг" className="sm:col-span-2"><Textarea name="objectives" required rows={4} defaultValue={initial?.objectives.join("\n")} placeholder={"Үндсэн ойлголтыг тайлбарлах\nЖишээн дээр хэрэглэх"}/></Field>
        </CardContent>
      </Card>
      {initial && <>
        <div className="flex items-center justify-between"><h2 className="font-bold">Агуулгын хэсгүүд</h2><Button type="button" size="sm" variant="secondary" onClick={addSection} disabled={sections.length >= 10}><Plus size={15}/>Хэсэг нэмэх</Button></div>
        {sections.length === 0 && <p className="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">Хэсэг алга байна. Нийтлэхийн тулд дор хаяж нэг хэсэг нэмнэ үү.</p>}
        {sections.map((section, index) => <Card key={section.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Хэсэг {index + 1}</CardTitle>
            <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeSection(section.id)}><Trash2 size={14}/>Хасах</Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Гарчиг"><Input name={`sectionTitle${index}`} value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} placeholder="Үндсэн санаа"/></Field>
            <Field label="Тайлбар"><Textarea name={`sectionBody${index}`} rows={6} value={section.body} onChange={(event) => updateSection(section.id, { body: event.target.value })} placeholder="Хичээлийн дэлгэрэнгүй агуулга…"/></Field>
            <Field label="Жишээ — заавал биш"><Textarea name={`sectionExample${index}`} rows={3} className="font-mono text-sm" value={section.example} onChange={(event) => updateSection(section.id, { example: event.target.value })} placeholder="Ажилласан жишээ эсвэл томьёо"/></Field>
          </CardContent>
        </Card>)}
      </>}
    </div>
    <aside>
      <Card className="sticky top-24">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0"><BookPlus size={18} className="text-primary"/><CardTitle>Хадгалах</CardTitle></CardHeader>
        <CardContent>
          {initial
            ? <>
              <p className="text-xs leading-5 text-muted-foreground">Draft нь зөвхөн админд харагдана. Published бол сонгосон хичээлд шинэ сэдэв болж нэмэгдэнэ.</p>
              <Field label="Төлөв" className="mt-5"><Select name="status" defaultValue={initial.status}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select></Field>
            </>
            : <p className="text-xs leading-5 text-muted-foreground">Эхлээд үндсэн мэдээллээ хадгал. Агуулгын хэсгүүдээ дараа нь энэ сэдвийг нээгээд нэмнэ.</p>}
          {state.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{state.error}</p>}
          {state.success && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{state.success}</p>}
          <Button type="submit" disabled={pending} className="mt-5 w-full">{pending ? "Хадгалж байна…" : initial ? "Хадгалах" : "Сэдэв нэмэх"}</Button>
        </CardContent>
      </Card>
    </aside>
  </form>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-1.5 ${className}`}><Label>{label}</Label>{children}</div>;
}
