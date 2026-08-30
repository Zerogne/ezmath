"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Eye, FileUp, Plus, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveMaterial } from "@/app/admin/materials/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import type { MaterialEditorData, MaterialQuestion } from "@/lib/admin/material-types";
import type { ExamType, TestType } from "@/types/exam";
import { QuestionEditor } from "./question-editor";

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
  const [variant, setVariant] = useState<"A" | "B" | "C" | "D">(initial?.variant ?? "A");
  const [questions, setQuestions] = useState<EditorQuestion[]>(initial?.questions.length ? initial.questions : [emptyQuestion()]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const subjects = examType === "SAT" ? ["Math", "Reading & Writing"] : ["Математик", "Англи хэл", "Физик", "Монгол хэл", "Хими", "Биологи", "Газар зүй", "Нийгэм судлал"];
  const subjectOptions = subjects.includes(subject) ? subjects : [subject, ...subjects];

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const validStructure = useMemo(() => Boolean(title.trim() && subject && duration > 0 && questions.every((question) => question.text.trim() && (question.questionType === "multiple-choice" ? question.choices.filter((choice) => choice.text.trim() || choice.imageUrl).length >= 2 : question.responseFields.length > 0))), [duration, questions, subject, title]);
  const unansweredCount = useMemo(() => questions.filter((question) => question.questionType === "multiple-choice" ? !question.choices.some((choice) => choice.label === question.correctAnswer && (choice.text.trim() || choice.imageUrl)) : question.responseFields.some((field) => !field.acceptedAnswers.some((answer) => answer.trim()))).length, [questions]);
  const change = <T,>(setter: (value: T) => void, value: T) => { setter(value); setDirty(true); setMessage(null); };

  async function save(nextStatus: MaterialEditorData["status"]) {
    if (!validStructure || (nextStatus === "published" && unansweredCount > 0)) {
      setErrors(["Гарчиг, хугацаа болон асуултын шаардлагатай талбаруудыг бүрэн бөглөнө үү."]);
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
      const body = await response.json() as { material?: MaterialEditorData; error?: string };
      if (!response.ok || !body.material) throw new Error(body.error ?? "PDF импорт амжилтгүй боллоо.");
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
      setMessage(`${material.questions.length} асуулт PDF-ээс орууллаа. ${material.questions.filter((question) => question.imageUrl).length} зураг автоматаар холболоо. Нийтлэхээс өмнө зөв хариулт бүрийг сонгоно уу.`);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "PDF импорт амжилтгүй боллоо."]);
    } finally {
      setImporting(false);
    }
  }

  return <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="space-y-6">
      {!initial && <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles size={18} /></span><div><h2 className="font-bold">AI-аар PDF материал оруулах</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">PyMuPDF4LLM бүтцийг задлаад Claude Haiku 4.5-аар EzMath JSON болгон хөрвүүлнэ. Серверийн API key ашиглавал энд key оруулах шаардлагагүй.</p></div></div>
        <form onSubmit={importPdf} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="AI provider"><select name="provider" defaultValue="anthropic" className="h-11 rounded-xl border bg-white px-3"><option value="anthropic">Claude Haiku 4.5 / Anthropic</option><option value="openai">ChatGPT / OpenAI</option><option value="gemini">Gemini / Google</option><option value="nvidia">NVIDIA NIM</option></select></Field>
          <Field label="API key (optional)"><input name="apiKey" type="password" autoComplete="off" placeholder="Server key ашиглана" className="h-11 rounded-xl border px-3" /></Field>
          <Field label="Model (optional)"><input name="model" placeholder="Provider-ийн default model" className="h-11 rounded-xl border px-3" /></Field>
          <Field label="SAT / ЭЕШ PDF"><input name="file" type="file" accept="application/pdf,.pdf" required className="h-11 rounded-xl border bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-transparent file:font-semibold" /></Field>
          {examType === "EYESH" && <><Field label="Шалгалтын он"><select name="year" defaultValue={year} className="h-11 rounded-xl border bg-white px-3">{Array.from({ length: 21 }, (_, index) => 2026 - index).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Хувилбар"><select name="variant" defaultValue={variant} className="h-11 rounded-xl border bg-white px-3">{["A", "B", "C", "D"].map((item) => <option key={item}>{item}</option>)}</select></Field></>}
          <div className="sm:col-span-2"><Button type="submit" disabled={importing}><FileUp size={16} />{importing ? "PDF боловсруулж байна…" : "PDF-ээс материал үүсгэх"}</Button><p className="mt-2 text-[11px] text-muted-foreground">Vercel upload хязгаарт нийцсэн 4 MB хүртэл. Импортын дараа зураг, талбар, зөв хариуг editor дотор шалгана.</p></div>
        </form>
      </section>}
      <section className="rounded-xl border bg-white p-5 sm:p-6">
        <h2 className="font-bold">Үндсэн мэдээлэл</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Гарчиг" className="sm:col-span-2"><input value={title} onChange={(event) => change(setTitle, event.target.value)} placeholder={examType === "SAT" ? "SAT Math Practice Test 01" : "ЭЕШ Математик 2025"} className="h-11 rounded-xl border px-3" /></Field>
          <Field label={examType === "SAT" ? "Хэсэг" : "Хичээл"}><select value={subject} onChange={(event) => change(setSubject, event.target.value)} className="h-11 rounded-xl border bg-white px-3">{subjectOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
          {examType === "EYESH" ? <><Field label="Он"><select value={year} onChange={(event) => change(setYear, Number(event.target.value))} className="h-11 rounded-xl border bg-white px-3">{Array.from({ length: 21 }, (_, index) => 2026 - index).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Хувилбар"><select value={variant} onChange={(event) => change(setVariant, event.target.value as "A" | "B" | "C" | "D")} className="h-11 rounded-xl border bg-white px-3">{["A", "B", "C", "D"].map((item) => <option key={item}>{item}</option>)}</select></Field></> : null}
          <Field label="Төрөл"><select value={testType} onChange={(event) => change(setTestType, event.target.value as TestType)} className="h-11 rounded-xl border bg-white px-3"><option value="practice">Practice</option><option value="full">Full Mock</option>{examType === "EYESH" && <option value="previous-year">Previous year</option>}</select></Field>
          <Field label="Хугацаа (минут)"><input type="number" min="1" value={duration} onChange={(event) => change(setDuration, Number(event.target.value))} className="h-11 rounded-xl border px-3" /></Field>
          <Field label="Төлөв"><select value={status} onChange={(event) => change(setStatus, event.target.value as MaterialEditorData["status"])} className="h-11 rounded-xl border bg-white px-3"><option value="draft">Draft</option><option value="published">Published</option>{status === "archived" && <option value="archived">Archived</option>}</select></Field>
          <Field label="Тайлбар / заавар" className="sm:col-span-2"><textarea rows={4} value={description} onChange={(event) => change(setDescription, event.target.value)} className="rounded-xl border p-3" /></Field>
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Асуултууд</h2><p className="mt-1 text-xs text-muted-foreground">{questions.length} асуулт</p></div><Button type="button" size="sm" variant="secondary" onClick={() => { setQuestions((items) => [...items, emptyQuestion()]); setDirty(true); }}><Plus size={15} />Асуулт нэмэх</Button></div>
        <div className="space-y-3">{questions.map((question, index) => <QuestionEditor key={question.id} question={question} index={index} total={questions.length} onChange={(value) => { setQuestions((items) => items.map((item) => item.id === question.id ? value : item)); setDirty(true); }} onDuplicate={() => { const duplicate = { ...question, id: crypto.randomUUID(), choices: question.choices.map((choice) => ({ ...choice, id: crypto.randomUUID() })), responseFields: question.responseFields.map((field) => ({ ...field, id: crypto.randomUUID() })) }; setQuestions((items) => [...items.slice(0, index + 1), duplicate, ...items.slice(index + 1)]); setDirty(true); }} onDelete={() => { if (questions.length > 1 && window.confirm("Энэ асуултыг устгах уу?")) { setQuestions((items) => items.filter((item) => item.id !== question.id)); setDirty(true); } }} onMove={(direction) => { const target = index + direction; if (target < 0 || target >= questions.length) return; setQuestions((items) => { const copy = [...items]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; }); setDirty(true); }} />)}</div>
      </section>
    </div>
    <aside><div className="sticky top-24 rounded-xl border bg-white p-5"><h2 className="font-bold">Нийтлэх</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Зөв хариулт зөвхөн админ болон серверийн scoring урсгалд харагдана.</p>{unansweredCount > 0 && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800">{unansweredCount} асуултын зөв хариултыг сонгоогүй байна. Draft хадгалж болно, нийтлэх боломжгүй.</p>}{errors.map((error) => <p key={error} role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>)}{message && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-primary">{message}</p>}<div className="mt-5 grid gap-2"><Button type="button" disabled={saving} onClick={() => save("draft")}><Save size={16} />{saving ? "Хадгалж байна…" : "Draft хадгалах"}</Button><Button type="button" variant="secondary" disabled={saving || unansweredCount > 0} onClick={() => save("published")}>Нийтлэх</Button>{savedId && status === "published" ? <ButtonLink href={`/tests/${savedId}`} variant="ghost"><Eye size={16} />Preview</ButtonLink> : <Button type="button" variant="ghost" disabled><Eye size={16} />Preview</Button>}{savedId && <Button type="button" variant="ghost" disabled={saving} className="text-muted-foreground" onClick={() => { if (window.confirm("Энэ материалыг архивлах уу?")) void save("archived"); }}><Archive size={16} />Архивлах</Button>}</div>{dirty && <p className="mt-4 text-center text-[11px] text-amber-700">Хадгалаагүй өөрчлөлт байна</p>}</div></aside>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`grid gap-1.5 text-sm font-medium ${className}`}>{label}{children}</label>;
}
