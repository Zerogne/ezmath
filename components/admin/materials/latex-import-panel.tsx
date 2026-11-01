"use client";

import Image from "next/image";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, FileCode2, FileUp, ImageIcon, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MathText } from "@/components/math/math-text";
import type { MaterialQuestion } from "@/lib/admin/material-types";
import type { ExamType } from "@/types/exam";
import { latexImportExample, parseLatexQuestions, type LatexImageRef, type LatexImportIssue, type ParsedLatexQuestion } from "@/lib/admin/latex-import";
import { imageKey, renderTikzPictures, uploadQuestionImageFiles, type TikzRender } from "@/lib/admin/question-image-upload";

type ImageState = { url?: string; pending?: boolean };

export function LatexImportPanel({ examType, onImport, defaultOpen = false }: { examType: ExamType; onImport: (questions: MaterialQuestion[]) => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [source, setSource] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [renders, setRenders] = useState<Map<string, TikzRender>>(() => new Map());
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const requested = useRef(new Set<string>());
  const deferredSource = useDeferredValue(source);
  const result = useMemo(() => parseLatexQuestions(deferredSource, examType), [deferredSource, examType]);
  const attached = useMemo(() => new Map(images.map((file) => [imageKey(file.name), file])), [images]);
  const previews = useMemo(() => new Map(images.map((file) => [imageKey(file.name), URL.createObjectURL(file)])), [images]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);
  // Rendered pictures are cached by their code plus the document's TikZ set-up, which changes how they draw.
  const tikzKey = useCallback((code: string) => `${result.tikzPreamble}\n${code}`, [result.tikzPreamble]);

  // Draw new tikzpicture blocks on the server shortly after typing stops.
  useEffect(() => {
    const pictures = [...new Set(result.questions.flatMap((item) => item.images.filter((ref) => ref.kind === "tikz").map((ref) => ref.source)))].filter((code) => !requested.current.has(tikzKey(code)));
    if (!pictures.length) return;
    const timer = window.setTimeout(() => {
      const keys = pictures.map(tikzKey);
      keys.forEach((key) => requested.current.add(key));
      const store = (results: TikzRender[]) => setRenders((current) => new Map([...current, ...keys.map((key, index) => [key, results[index]] as const)]));
      renderTikzPictures(pictures, result.tikzPreamble).then(store, (error: unknown) => store(keys.map(() => ({ error: error instanceof Error ? error.message : "TikZ зургийг зурж чадсангүй." }))));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [result, tikzKey]);

  const imageState = useCallback((ref: LatexImageRef): ImageState => {
    if (ref.kind === "file") return { url: previews.get(imageKey(ref.source)) };
    const render = renders.get(tikzKey(ref.source));
    if (!render) return { pending: true };
    return "svg" in render ? { url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(render.svg)}` } : {};
  }, [previews, renders, tikzKey]);

  // Missing files are warnings until attached; a TikZ picture that failed to draw is an error.
  const questions = useMemo(() => result.questions.map((item) => {
    const extra = item.images.flatMap((ref): LatexImportIssue[] => {
      if (ref.kind === "file") return attached.has(imageKey(ref.source)) ? [] : [{ level: "warning", message: `Зураг "${ref.source}" хавсаргаагүй — "Зураг" товчоор файлаа нэмнэ үү.` }];
      const render = renders.get(tikzKey(ref.source));
      return render && "error" in render ? [{ level: "error", message: `TikZ (${ref.target === "question" ? "асуулт" : `${ref.target} сонголт`}): ${render.error}` }] : [];
    });
    return extra.length ? { ...item, issues: [...item.issues, ...extra] } : item;
  }), [result.questions, attached, renders, tikzKey]);
  const errorCount = questions.filter((item) => item.issues.some((issue) => issue.level === "error")).length;
  const warningCount = questions.filter((item) => item.issues.length && item.issues.every((issue) => issue.level === "warning")).length;
  const readyCount = questions.length - errorCount - warningCount;
  const importable = questions.filter((item) => item.question.text.trim());
  const drawing = importable.some((item) => item.images.some((ref) => imageState(ref).pending));

  async function loadFile(file: File | undefined) {
    if (!file) return;
    setSource(await file.text());
    setNotice(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function addImages(list: FileList | null) {
    // Copy first: the FileList is live and empties when the input is reset below.
    const files = [...(list ?? [])];
    if (!files.length) return;
    // A newer file with the same name replaces the older one.
    setImages((current) => [...current.filter((file) => !files.some((added) => imageKey(added.name) === imageKey(file.name))), ...files]);
    setNotice(null);
    if (imageInput.current) imageInput.current.value = "";
  }

  async function importQuestions() {
    const refKey = (ref: LatexImageRef) => ref.kind === "file" ? `file:${imageKey(ref.source)}` : `tikz:${tikzKey(ref.source)}`;
    const uploads = new Map<string, File>();
    for (const ref of importable.flatMap((item) => item.images)) {
      const key = refKey(ref);
      if (uploads.has(key)) continue;
      const render = ref.kind === "tikz" ? renders.get(tikzKey(ref.source)) : undefined;
      const file = ref.kind === "file" ? attached.get(imageKey(ref.source)) : render && "svg" in render ? new File([render.svg], `tikz-${uploads.size + 1}.svg`, { type: "image/svg+xml" }) : undefined;
      if (file) uploads.set(key, file);
    }
    let urls = new Map<string, string>();
    if (uploads.size) {
      setUploading(true);
      try {
        const uploaded = await uploadQuestionImageFiles([...uploads.values()]);
        urls = new Map([...uploads.keys()].map((key, index) => [key, uploaded[index]]));
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Зургийг хадгалж чадсангүй.");
        return;
      } finally {
        setUploading(false);
      }
    }
    onImport(importable.map(({ question, images: refs }) => {
      const urlFor = (target: string) => { const ref = refs.find((item) => item.target === target); return ref ? urls.get(refKey(ref)) : undefined; };
      return { ...question, imageUrl: urlFor("question") ?? question.imageUrl, choices: question.choices.map((choice) => ({ ...choice, imageUrl: urlFor(choice.label) ?? choice.imageUrl })) };
    }));
    setNotice(`${importable.length} асуулт${uploads.size ? `, ${uploads.size} зураг` : ""} нэмэгдлээ.${errorCount ? ` ${errorCount} асуултын алдааг editor дотор засна уу.` : ""}`);
    setSource("");
    setImages([]);
  }

  return <Card>
    <CardHeader className="flex flex-row items-start gap-3 space-y-0">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted"><FileCode2 size={18} /></span>
      <div className="min-w-0 flex-1"><CardTitle>LaTeX-ээр асуулт оруулах</CardTitle><p className="mt-1 text-xs leading-5 text-muted-foreground">LaTeX <span className="font-mono">exam</span> class-ийн форматаар олон асуултыг нэг дор бичих эсвэл paste хийнэ.</p></div>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Хаах" : "Нээх"}<ChevronDown size={15} className={`transition ${open ? "rotate-180" : ""}`} /></Button>
    </CardHeader>
    {open && <CardContent className="space-y-4">
      <FormatGuide examType={examType} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid content-start gap-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => { setSource(latexImportExample); setNotice(null); }}>Жишээ</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => fileInput.current?.click()}><FileUp size={15} />.tex файл</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => imageInput.current?.click()}><ImageIcon size={15} />Зураг</Button>
            {source && <Button type="button" size="sm" variant="ghost" onClick={() => setSource("")}>Цэвэрлэх</Button>}
            <input ref={fileInput} type="file" accept=".tex,.txt,text/plain,application/x-tex" className="hidden" onChange={(event) => void loadFile(event.target.files?.[0])} />
            <input ref={imageInput} type="file" multiple accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => addImages(event.target.files)} />
          </div>
          {images.length > 0 && <ul className="flex flex-wrap gap-1.5" aria-label="Хавсаргасан зургууд">{images.map((file) => <li key={file.name} className="inline-flex items-center gap-1.5 rounded-full border bg-card py-1 pl-2.5 pr-1 text-xs"><ImageIcon size={13} className="text-muted-foreground" />{file.name}<button type="button" aria-label={`${file.name} хасах`} onClick={() => setImages((current) => current.filter((item) => item !== file))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-muted"><X size={12} /></button></li>)}</ul>}
          <Textarea value={source} onChange={(event) => { setSource(event.target.value); setNotice(null); }} rows={22} spellCheck={false} placeholder={"\\question ...\n\\begin{choices}\n  \\choice ...\n  \\CorrectChoice ...\n\\end{choices}"} className="min-h-[420px] font-mono text-xs leading-5" aria-label="LaTeX эх" />
        </div>
        <div className="grid content-start gap-2">
          <p className="text-xs font-medium text-muted-foreground" aria-live="polite">{questions.length ? <>{questions.length} асуулт · <span className="text-emerald-700">{readyCount} бэлэн</span>{warningCount > 0 && <> · <span className="text-amber-700">{warningCount} анхааруулгатай</span></>}{errorCount > 0 && <> · <span className="text-red-700">{errorCount} алдаатай</span></>}</> : "Урьдчилан харах"}</p>
          <div className="max-h-[460px] min-h-[420px] space-y-2 overflow-y-auto rounded-xl border bg-muted/20 p-2">
            {result.issues.map((issue, index) => <IssueLine key={index} level={issue.level} message={issue.message} />)}
            {!questions.length && !result.issues.length && <p className="p-6 text-center text-xs text-muted-foreground">LaTeX бичихэд асуултууд энд харагдана.</p>}
            {questions.map((item) => <PreviewItem key={item.number} item={item} imageState={imageState} />)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!importable.length || uploading || drawing} onClick={() => void importQuestions()}>{uploading ? "Зураг хуулж байна…" : drawing ? "График зурж байна…" : importable.length ? `${importable.length} асуулт нэмэх` : "Асуулт нэмэх"}</Button>
        {errorCount > 0 && <p className="text-xs text-amber-700">{errorCount} асуулт алдаатай — нэмсний дараа editor дотор засах эсвэл энд засаад нэмнэ үү.</p>}
        {notice && <p role="status" className="text-xs font-medium text-primary">{notice}</p>}
      </div>
    </CardContent>}
  </Card>;
}

function PreviewItem({ item, imageState }: { item: ParsedLatexQuestion; imageState: (ref: LatexImageRef) => ImageState }) {
  const { question, issues } = item;
  const imageFor = (target: string): ImageState => { const ref = item.images.find((image) => image.target === target); return ref ? imageState(ref) : { url: target === "question" ? question.imageUrl : question.choices.find((choice) => choice.label === target)?.imageUrl }; };
  const hasError = issues.some((issue) => issue.level === "error");
  const Icon = hasError ? XCircle : issues.length ? AlertTriangle : CheckCircle2;
  return <article className={`rounded-lg border bg-card p-3 text-sm ${hasError ? "border-red-200" : issues.length ? "border-amber-200" : ""}`}>
    <div className="flex items-start gap-2">
      <Icon size={16} className={`mt-0.5 shrink-0 ${hasError ? "text-red-600" : issues.length ? "text-amber-600" : "text-emerald-600"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-muted-foreground">№{item.number}{question.topic && ` · ${question.topic}`} · {question.difficulty}</p>
        <div className="mt-1 overflow-x-auto whitespace-pre-line leading-7"><MathText>{question.text || "—"}</MathText></div>
        <PreviewImage {...imageFor("question")} />
        {question.questionType === "multiple-choice" ? <ul className="mt-2 grid gap-1">{question.choices.map((choice) => <li key={choice.id} className={`flex gap-2 rounded-md px-2 py-1 ${choice.label === question.correctAnswer ? "bg-emerald-50 font-medium text-emerald-900" : ""}`}><span className="font-semibold">{choice.label}.</span><span className="min-w-0 overflow-x-auto"><MathText>{choice.text}</MathText><PreviewImage small {...imageFor(choice.label)} /></span></li>)}</ul>
          : <ul className="mt-2 grid gap-1">{question.responseFields.map((field) => <li key={field.id} className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-900"><span className="font-semibold">{field.label}:</span> {field.acceptedAnswers.join("  |  ") || "—"}</li>)}</ul>}
        {question.explanation && <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold">Тайлбар:</span> <MathText>{question.explanation}</MathText></p>}
        {issues.length > 0 && <div className="mt-2 space-y-1">{issues.map((issue, index) => <IssueLine key={index} level={issue.level} message={issue.message} />)}</div>}
      </div>
    </div>
  </article>;
}

/** The LaTeX format and its limits; answer rules depend on the exam type. Everything listed here is what the parser does. */
function FormatGuide({ examType }: { examType: ExamType }) {
  const sat = examType === "SAT";
  return <details className="rounded-xl border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
    <summary className="cursor-pointer font-semibold text-foreground">Формат ба дүрэм{sat ? " (SAT)" : " (ЭЕШ)"}</summary>
    <div className="mt-3 grid gap-4 sm:grid-cols-2">
      <GuideSection title="Асуулт">
        <li>Асуулт бүр <C>{String.raw`\question`}</C>-оор эхэлнэ. Бүтэн <C>.tex</C> файл оруулж болно — преамбулаас зөвхөн TikZ тохиргоог авна.</li>
        <li>Математик: <C>{"$...$"}</C>, <C>{"$$...$$"}</C>, <C>{String.raw`\[...\]`}</C>. Хүснэгт: <C>{String.raw`$$\begin{array}{c|c} x & y \\ \hline 1 & 2 \end{array}$$`}</C>.</li>
        <li>Хоосон мөр шинэ догол мөр, <C>{String.raw`\\`}</C> мөр шилжүүлнэ. <C>{String.raw`\textbf`}</C>, <C>{String.raw`\emph`}</C> энгийн текст болно; <C>%</C> тайлбар орохгүй.</li>
      </GuideSection>
      <GuideSection title="Хариулт">
        <li>Сонголттой: <C>{String.raw`\begin{choices}`}</C> дотор <C>{String.raw`\choice`}</C>, зөвийг нь <C>{String.raw`\CorrectChoice`}</C>. {sat ? "SAT: A–D, 4 хүртэл сонголт." : "ЭЕШ: A–E, 5 хүртэл сонголт."}</li>
        {sat ? <>
          <li>Бичих хариулт (grid-in): <C>{String.raw`\answer{3/4|.75}`}</C> — нэг талбар, олон зөв хувилбарыг <C>|</C>-ээр. Эерэг хариу 5, сөрөг 6 тэмдэгт хүртэл.</li>
          <li>Тэнцүү бутархай/аравтыг (<C>3/4</C> = <C>.75</C>) болон SAT-ийн дүрмээр тайрсан, бөөрөнхийлсөн аравтыг (<C>2/3</C> → <C>.6666</C>, <C>.6667</C>) автоматаар зөвд тооцно.</li>
          <li className="text-amber-800">Холимог бутархай бичихгүй: <C>1 1/2</C> нь <C>11/2</C> гэж уншигдана — <C>3/2</C> эсвэл <C>1.5</C> гэж бичнэ.</li>
        </> : <>
          <li>Бичих хариулт: <C>{String.raw`\answer{9}`}</C>, олон зөв хувилбар <C>{String.raw`\answer{0,75|3/4}`}</C>, II хэсгийн талбар <C>{String.raw`\answer[ab]{12}`}</C>.</li>
          <li>Түлхүүрт кирилл үсэг ч болно: <C>3-В</C> = <C>3-C</C>.</li>
        </>}
        <li>Тусдаа түлхүүр (<C>{String.raw`\CorrectChoice`}</C>-гүй асуултад): <C>{String.raw`\answers{1-B, 2-3/4}`}</C>.</li>
      </GuideSection>
      <GuideSection title="График ба зураг">
        <li><C>{String.raw`\begin{tikzpicture}…\end{tikzpicture}`}</C> (TikZ, pgfplots <C>axis</C>) автоматаар зурагдаж асуултын зураг болно. <C>{String.raw`\choice`}</C> дотор бичвэл сонголт өөрөө график болно.</li>
        <li><C>{String.raw`\usetikzlibrary`}</C>, <C>{String.raw`\pgfplotsset`}</C>, <C>{String.raw`\tikzset`}</C> бүх зурагт хэрэглэгдэнэ; <C>compat=1.18</C> гэх мэтийг автоматаар тааруулна. TikZ алдаатай бол тухайн асуулт дээр шалтгааныг харуулна.</li>
        <li>Файл: <C>{String.raw`\includegraphics{graph.png}`}</C> + “Зураг” товчоор файлаа хавсаргана (нэрээр таарна; PNG, JPG, WebP, SVG, 10MB хүртэл). <C>https://</C> холбоос шууд ажиллана.</li>
        <li>Асуулт, сонголт бүрт нэг зураг — олон байвал эхнийхийг авна.</li>
      </GuideSection>
      <GuideSection title="Нэмэлт ба хязгаарлалт">
        {sat ? <li><C>{String.raw`\topic{Linear functions}`}</C> — SAT-ийн албан ёсны ур чадварын нэр; бодлогын сан үүгээр шүүнэ. “Systems of equations” гэх мэт түгээмэл нэрийг автоматаар хөрвүүлнэ, танигдаагүй бол “Ангилаагүй”.</li>
          : <li><C>{String.raw`\topic{Алгебр}`}</C> — сэдэв.</li>}
        <li><C>{String.raw`\difficulty{Easy|Medium|Hard}`}</C>, <C>{String.raw`\explanation{...}`}</C> эсвэл <C>solution</C> орчин.</li>
        <li className="text-amber-800">Дэмжихгүй: <C>tabular</C> (оронд нь <C>array</C>), өөрийн макро <C>{String.raw`\newcommand`}</C>, <C>{String.raw`\input`}</C>. Ийм команд анхааруулга эсвэл алдаа өгнө.</li>
        <li>“Жишээ” товчоор бүтэн жишээ ачаална.</li>
      </GuideSection>
    </div>
  </details>;
}

function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h4 className="font-semibold text-foreground">{title}</h4><ul className="mt-1 list-disc space-y-1 pl-4">{children}</ul></section>;
}

function C({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-background px-1 py-px font-mono text-[11px] text-foreground">{children}</code>;
}

function IssueLine({ level, message }: { level: "error" | "warning"; message: string }) {
  return <p className={`rounded-md px-2 py-1 text-xs ${level === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{message}</p>;
}

function PreviewImage({ url, pending = false, small = false }: ImageState & { small?: boolean }) {
  if (pending) return <span className={`mt-2 grid animate-pulse place-items-center rounded-md border bg-muted/60 text-xs text-muted-foreground ${small ? "h-16 w-28" : "h-40"}`}>График зурж байна…</span>;
  return url ? <span className={`relative mt-2 block overflow-hidden rounded-md border bg-white ${small ? "h-16 w-28" : "h-40"}`}><Image src={url} alt="" fill unoptimized className="object-contain" /></span> : null;
}
