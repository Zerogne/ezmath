"use client";

import { useActionState } from "react";
import { BookPlus } from "lucide-react";
import { createLesson, type LessonFormState } from "@/app/admin/lessons/actions";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/shadcn/button";

const initialState: LessonFormState = {};

export function LessonForm() {
  const [state, action, pending] = useActionState(createLesson, initialState);
  return <form action={action} className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Үндсэн мэдээлэл</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Сэдвийн нэр" className="sm:col-span-2"><Input name="title" required minLength={3} maxLength={160} placeholder="Жишээ: Анхны тооны тархалт"/></Field>
          <Field label="URL slug"><Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="prime-number-distribution"/></Field>
          <Field label="Хичээл"><Select name="moduleId" required><SelectTrigger><SelectValue placeholder="Хичээл сонгох"/></SelectTrigger><SelectContent>{coreMathCourse.modules.map((item)=><SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Хугацаа (минут)"><Input name="durationMinutes" type="number" required min={1} max={300} defaultValue={15}/></Field>
          <Field label="Дараалал"><Input name="sortOrder" type="number" min={0} max={10000} defaultValue={100}/></Field>
          <Field label="Товч тайлбар" className="sm:col-span-2"><Textarea name="summary" required minLength={10} maxLength={1000} rows={4} placeholder="Сурагч энэ хичээлээс юу ойлгох вэ?"/></Field>
          <Field label="Суралцах зорилгууд — мөр бүрт нэг" className="sm:col-span-2"><Textarea name="objectives" required rows={4} placeholder={"Үндсэн ойлголтыг тайлбарлах\nЖишээн дээр хэрэглэх"}/></Field>
        </CardContent>
      </Card>
      {[1,2,3].map((index)=><Card key={index}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle>Агуулгын хэсэг {index}</CardTitle>{index>1&&<span className="text-xs text-muted-foreground">Заавал биш</span>}</CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Гарчиг"><Input name={`sectionTitle${index}`} required={index===1} placeholder="Үндсэн санаа"/></Field>
          <Field label="Тайлбар"><Textarea name={`sectionBody${index}`} required={index===1} rows={6} placeholder="Хичээлийн дэлгэрэнгүй агуулга…"/></Field>
          <Field label="Жишээ — заавал биш"><Textarea name={`sectionExample${index}`} rows={3} className="font-mono text-sm" placeholder="Ажилласан жишээ эсвэл томьёо"/></Field>
        </CardContent>
      </Card>)}
    </div>
    <aside>
      <Card className="sticky top-24">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0"><BookPlus size={18} className="text-primary"/><CardTitle>Хадгалах</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs leading-5 text-muted-foreground">Draft нь зөвхөн админд харагдана. Published бол сонгосон хичээлд шинэ сэдэв болж нэмэгдэнэ.</p>
          <Field label="Төлөв" className="mt-5">
            <Select name="status" defaultValue="draft"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select>
          </Field>
          {state.error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{state.error}</p>}
          {state.success&&<p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{state.success}</p>}
          <Button type="submit" disabled={pending} className="mt-5 w-full">{pending?"Хадгалж байна…":"Сэдэв нэмэх"}</Button>
        </CardContent>
      </Card>
    </aside>
  </form>;
}

function Field({label,children,className=""}:{label:string;children:React.ReactNode;className?:string}) {
  return <div className={`grid gap-1.5 ${className}`}><Label>{label}</Label>{children}</div>;
}
