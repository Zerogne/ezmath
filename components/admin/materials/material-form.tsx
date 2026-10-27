"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Eye, FileUp, Plus, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveMaterial } from "@/app/admin/materials/actions";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { MaterialEditorData, MaterialQuestion } from "@/lib/admin/material-types";
import type { ExamType, TestType } from "@/types/exam";
import { QuestionEditor } from "./question-editor";
import { LatexImportPanel } from "./latex-import-panel";

export type EditorQuestion = MaterialQuestion;

function emptyQuestion(): EditorQuestion {
  return {
    id: crypto.randomUUID(),
    text: "",
    imageUrl: "",
    questionType: "multiple-choice",
    responseFields: [],
    choices: ["A", "B", "C", "D"].map((label) => ({ id: crypto.randomUUID(), label, text: "", imageUrl: "" })),
    correctAnswer: "A",
    explanation: "",
    topic: "",
    difficulty: "Medium",
  };
}

export function MaterialForm({ examType, initial }: { examType: ExamType; initial?: MaterialEditorData }) {
  const router = useRouter();
  const [savedId, setSavedId] = useState(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? (examType === "SAT" ? "Math" : "Математик"));
  const [duration, setDuration] = useState(initial?.durationMinutes ?? 35);
  const [testType, setTestType] = useState<TestType>(initial?.type ?? (examType === "SAT" ? "practice" : "previous-year"));
  const [status, setStatus] = useState<MaterialEditorData["status"]>(initial?.status ?? "draft");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [year, setYear] = useState(initial?.year ?? 2026);
  const [variant, setVariant] = useState<"A" | "B" | "C" | "D" | "E">(initial?.variant ?? "A");
  const [questions, setQuestions] = useState<EditorQuestion[]>(initial?.questions.length ? initial.questions : [emptyQuestion()]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const subjects = examType === "SAT" ? ["Math", "Reading & Writing"] : ["Математик", "Англи хэл", "Физик", "Монгол хэл", "Хими", "Биологи", "Газар зүй", "Нийгэм судлал"];
  const subjectOptions = subjects.includes(subject) ? subjects : [subject, ...subjects];
  const years = Array.from({ length: 21 }, (_, index) => String(2026 - index));

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const validStructure = useMemo(() => Boolean(title.trim() && subject && duration > 0 && questions.every((question) => question.text.trim())), [duration, questions, subject, title]);
  const unansweredCount = useMemo(() => questions.filter((question) => question.questionType === "multiple-choice" ? !question.choices.some((choice) => choice.label === question.correctAnswer && (choice.text.trim() || choice.imageUrl)) : question.responseFields.some((field) => !field.acceptedAnswers.some((answer) => answer.trim()))).length, [questions]);
  const change = <T,>(setter: (value: T) => void, value: T) => { setter(value); setDirty(true); setMessage(null); };

  async function save(nextStatus: MaterialEditorData["status"]) {
    if (!validStructure || (nextStatus === "published" && unansweredCount > 0)) {
      setErrors(["Шаардлагатай талбаруудыг бөглөнө үү."]);
      return;
    }
    setSaving(true);
    setErrors([]);
    setMessage(null);
    const result = await saveMaterial({
      id: savedId,
      examType,
      title,
      subject,
      year: examType === "EYESH" ? year : undefined,
      variant: examType === "EYESH" ? variant : undefined,
      durationMinutes: duration,
      type: testType,
      status: nextStatus,
      description,
      questions,
    });
    setSaving(false);
    if (result.error || !result.id) {
      setErrors([result.error ?? "Материал хадгалж чадсангүй."]);
      return;
    }
    const wasNew = !savedId;
    setSavedId(result.id);
    setStatus(nextStatus);
    setDirty(false);
    setMessage(nextStatus === "published" ? "Тест нийтлэгдлээ." : nextStatus === "archived" ? "Материал архивлагдлаа." : "Материал хадгалагдлаа.");
    if (wasNew) router.replace(`/admin/materials/${examType.toLowerCase()}/${result.id}/edit`);
    router.refresh();
  }

  async function importPdf(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImporting(true);
    setErrors([]);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    form.set("examType", examType);
    try {
      const response = await fetch("/api/admin/materials/import-pdf", { method: "POST", body: form });
      const body = await response.json().catch(() => ({})) as { material?: MaterialEditorData; error?: string; stage?: string };
      if (!response.ok || !body.material) {
        if (response.status === 504) throw new Error("Хугацаа хэтэрлээ. PDF-ээ хэсэгчлэн оруулна уу.");
        throw new Error(body.error ? `${body.error}${body.stage ? ` (${body.stage})` : ""}` : "PDF импорт амжилтгүй боллоо.");
      }
      const material = body.material;
      setTitle(material.title);
      setSubject(material.subject);
      setDuration(material.durationMinutes);
      setTestType(material.type);
      setStatus("draft");
      setDescription(material.description);
      setYear(material.year ?? 2026);
      setVariant(material.variant ?? "A");
      setQuestions(material.questions);
      setDirty(true);
      setMessage(`${material.questions.length} асуулт, ${material.questions.filter((question) => question.imageUrl).length} зураг орууллаа. Хариултаа шалгаад нийтэлнэ үү.`);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "PDF импорт амжилтгүй боллоо."]);
    } finally {
      setImporting(false);
    }
  }

  function importLatex(imported: EditorQuestion[]) {
    const isBlank = (question: EditorQuestion) => !question.text.trim() && !question.imageUrl && question.choices.every((choice) => !choice.text.trim() && !choice.imageUrl);
    setQuestions((items) => [...items.filter((item) => !isBlank(item)), ...imported]);
    setDirty(true);
    setErrors([]);
    setMessage(`LaTeX-ээс ${imported.length} асуулт нэмэгдлээ. Шалгаад хадгална уу.`);
  }

  function deleteQuestion() {
    if (!deleteQuestionId) return;
    setQuestions((items) => items.filter((item) => item.id !== deleteQuestionId));
    setDirty(true);
    setDeleteQuestionId(null);
  }

  return <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="space-y-6">
      {!initial && <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles size={18} /></span>
          <div><CardTitle>AI-аар PDF материал оруулах</CardTitle><p className="mt-1 text-xs leading-5 text-muted-foreground">PDF-ээ оруулахад AI асуултуудыг автоматаар бэлдэнэ.</p></div>
        </CardHeader>
        <CardContent>
          <form onSubmit={importPdf} className="grid gap-4 sm:grid-cols-2">
            <Field label="AI provider"><Select name="provider" defaultValue="anthropic"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="anthropic">Claude Haiku 4.5 / Anthropic</SelectItem><SelectItem value="openai">ChatGPT / OpenAI</SelectItem><SelectItem value="gemini">Gemini / Google</SelectItem><SelectItem value="nvidia">NVIDIA NIM</SelectItem></SelectContent></Select></Field>
            <Field label="API key (optional)"><Input name="apiKey" type="password" autoComplete="off" placeholder="Server key ашиглана" /></Field>
            <Field label="Model (optional)"><Input name="model" placeholder="Provider-ийн default model" /></Field>
            <Field label="SAT / ЭЕШ PDF"><Input name="file" type="file" accept="application/pdf,.pdf" required className="py-2 file:mr-3 file:border-0 file:bg-transparent file:font-semibold" /></Field>
            {examType === "EYESH" && <><Field label="Шалгалтын он"><Select name="year" defaultValue={String(year)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{years.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Хувилбар"><Select name="variant" defaultValue={variant}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["A", "B", "C", "D", "E"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field></>}
            <div className="sm:col-span-2"><Button type="submit" disabled={importing}><FileUp size={16} />{importing ? "PDF боловсруулж байна…" : "PDF-ээс материал үүсгэх"}</Button><p className="mt-2 text-[11px] text-muted-foreground">4 MB хүртэл. Импортын дараа editor дотор шалгана.</p></div>
          </form>
        </CardContent>
      </Card>}
      <LatexImportPanel examType={examType} onImport={importLatex} />
      <Card>
        <CardHeader><CardTitle>Үндсэн мэдээлэл</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Гарчиг" className="sm:col-span-2"><Input value={title} onChange={(event) => change(setTitle, event.target.value)} placeholder={examType === "SAT" ? "SAT Math Practice Test 01" : "ЭЕШ Математик 2025"} /></Field>
          <Field label={examType === "SAT" ? "Хэсэг" : "Хичээл"}><Select value={subject} onValueChange={(value) => change(setSubject, value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{subjectOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
          {examType === "EYESH" ? <><Field label="Он"><Select value={String(year)} onValueChange={(value) => change(setYear, Number(value))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{years.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Хувилбар"><Select value={variant} onValueChange={(value) => change(setVariant, value as "A" | "B" | "C" | "D" | "E")}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["A", "B", "C", "D", "E"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field></> : null}
          <Field label="Төрөл"><Select value={testType} onValueChange={(value) => change(setTestType, value as TestType)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="practice">Practice</SelectItem><SelectItem value="full">Full Mock</SelectItem>{examType === "EYESH" && <SelectItem value="previous-year">Previous year</SelectItem>}</SelectContent></Select></Field>
          <Field label="Хугацаа (минут)"><Input type="number" min="1" value={duration} onChange={(event) => change(setDuration, Number(event.target.value))} /></Field>
          <Field label="Төлөв"><Select value={status} onValueChange={(value) => change(setStatus, value as MaterialEditorData["status"])}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem>{status === "archived" && <SelectItem value="archived">Archived</SelectItem>}</SelectContent></Select></Field>
          <Field label="Тайлбар / заавар" className="sm:col-span-2"><Textarea rows={4} value={description} onChange={(event) => change(setDescription, event.target.value)} /></Field>
        </CardContent>
      </Card>
      <section>
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Асуултууд</h2><p className="mt-1 text-xs text-muted-foreground">{questions.length} асуулт</p></div><Button type="button" size="sm" variant="secondary" onClick={() => { setQuestions((items) => [...items, emptyQuestion()]); setDirty(true); }}><Plus size={15} />Асуулт нэмэх</Button></div>
        <div className="space-y-3">{questions.map((question, index) => <QuestionEditor key={question.id} question={question} examType={examType} index={index} total={questions.length} onChange={(value) => { setQuestions((items) => items.map((item) => item.id === question.id ? value : item)); setDirty(true); }} onDuplicate={() => { const duplicate = { ...question, id: crypto.randomUUID(), choices: question.choices.map((choice) => ({ ...choice, id: crypto.randomUUID() })), responseFields: question.responseFields.map((field) => ({ ...field, id: crypto.randomUUID() })) }; setQuestions((items) => [...items.slice(0, index + 1), duplicate, ...items.slice(index + 1)]); setDirty(true); }} onDelete={() => { if (questions.length > 1) setDeleteQuestionId(question.id); }} onMove={(direction) => { const target = index + direction; if (target < 0 || target >= questions.length) return; setQuestions((items) => { const copy = [...items]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; }); setDirty(true); }} />)}</div>
      </section>
    </div>
    <aside>
      <Card className="sticky top-24">
        <CardHeader><CardTitle>Нийтлэх</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs leading-5 text-muted-foreground">Зөв хариулт зөвхөн админд харагдана.</p>
          {unansweredCount > 0 && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800">{unansweredCount} асуултад хариулт сонгоогүй — нийтлэх боломжгүй.</p>}
          {errors.map((error) => <p key={error} role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>)}
          {message && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-primary">{message}</p>}
          <div className="mt-5 grid gap-2">
            <Button type="button" disabled={saving || (status === "published" && unansweredCount > 0)} onClick={() => save(status)}><Save size={16} />{saving ? "Хадгалж байна…" : status === "published" ? "Published хадгалах" : status === "archived" ? "Archived хадгалах" : "Draft хадгалах"}</Button>
            {status !== "published" && <Button type="button" variant="secondary" disabled={saving || unansweredCount > 0} onClick={() => save("published")}>Нийтлэх</Button>}
            {savedId && status === "published" ? <Button asChild variant="ghost"><Link href={`/tests/${savedId}`}><Eye size={16} />Preview</Link></Button> : <Button type="button" variant="ghost" disabled><Eye size={16} />Preview</Button>}
            {savedId && status !== "archived" && <Button type="button" variant="ghost" disabled={saving} className="text-muted-foreground" onClick={() => setArchiveConfirmOpen(true)}><Archive size={16} />Архивлах</Button>}
          </div>
          {dirty && <p className="mt-4 text-center text-[11px] text-amber-700">Хадгалаагүй өөрчлөлт байна</p>}
        </CardContent>
      </Card>
    </aside>
    <AlertDialog open={Boolean(deleteQuestionId)} onOpenChange={(open) => !open && setDeleteQuestionId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Асуултыг устгах уу?</AlertDialogTitle><AlertDialogDescription>Буцаах боломжгүй.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Болих</AlertDialogCancel><AlertDialogAction onClick={deleteQuestion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Устгах</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Материалыг архивлах уу?</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Болих</AlertDialogCancel><AlertDialogAction onClick={() => void save("archived")}>Архивлах</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-1.5 ${className}`}><Label>{label}</Label>{children}</div>;
}
