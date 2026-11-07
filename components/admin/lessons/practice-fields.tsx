"use client";

import { useEffect, useState } from "react";
import type { Practice } from "@/lib/learning/course-catalog";
import { extractTikz, looksLikeLatex } from "@/lib/latex/render";
import { renderTikzPictures } from "@/lib/admin/question-image-upload";
import { LatexContent } from "@/components/math/latex-content";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Example + test problem inputs shared by the module/submodule dialog and the topic form.
 * Field names (example, testProblem, testAnswer) are read by parsePractice in app/admin/lessons/actions.ts.
 */
export function PracticeFields({ initial, compact = false }: { initial?: Practice; compact?: boolean }) {
  const [example, setExample] = useState(initial?.example ?? "");
  const [problem, setProblem] = useState(initial?.problem ?? "");
  return <div className="grid gap-4">
    <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">LaTeX бүрэн дэмжинэ: <code>$...$</code>, <code>\[...\]</code>, <code>align</code>, <code>\textbf</code>, <code>itemize</code>/<code>enumerate</code>, <code>tabular</code>, <code>tikzpicture</code> гэх мэт. TikZ зураг хадгалах үед зурагдана.</p>
    <div className="grid gap-1.5">
      <Label htmlFor="practice-example">Жишээ <span className="font-normal text-muted-foreground">— заавал биш</span></Label>
      <Textarea id="practice-example" name="example" rows={compact ? 4 : 6} maxLength={4000} value={example} onChange={(event) => setExample(event.target.value)} className="font-mono text-[13px]" placeholder={String.raw`Бодсон жишээ: $x^2 - 5x + 6 = 0$ бол \[(x-2)(x-3)=0\] тиймээс $x=2$ эсвэл $x=3$.`}/>
      <Preview text={example}/>
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="practice-problem">Тест бодлого <span className="font-normal text-muted-foreground">— заавал биш</span></Label>
      <Textarea id="practice-problem" name="testProblem" rows={compact ? 4 : 6} maxLength={4000} value={problem} onChange={(event) => setProblem(event.target.value)} className="font-mono text-[13px]" placeholder={String.raw`$x^2 - 7x + 12 = 0$ тэгшитгэлийн \textbf{их} шийдийг ол.`}/>
      <Preview text={problem}/>
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="practice-answer">Тест бодлогын хариу {problem.trim() ? "" : <span className="font-normal text-muted-foreground">— бодлого нэмбэл заавал</span>}</Label>
      <Input id="practice-answer" name="testAnswer" maxLength={300} required={Boolean(problem.trim())} defaultValue={initial?.answer} placeholder="4"/>
      <p className="text-xs text-muted-foreground">Олон зөв хариу байвал <code>;</code>-ээр тусгаарлана (жишээ: <code>0.5; 1/2</code>). Сурагчийн хариуг зай, том жижиг үсгээс үл хамааран шалгана.</p>
    </div>
  </div>;
}

/** Live preview of a LaTeX field; TikZ drawings are rendered through the admin TikZ endpoint after a short pause. */
function Preview({ text }: { text: string }) {
  const [tikz, setTikz] = useState<{ images: Record<string, string>; errors: string[]; pending: boolean }>({ images: {}, errors: [], pending: false });
  useEffect(() => {
    const pictures = extractTikz(text);
    if (!pictures.length) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setTikz((current) => ({ ...current, pending: true }));
      try {
        // All pictures in one field share its preamble (\usetikzlibrary lines).
        const results = await renderTikzPictures(pictures.map((picture) => picture.source), pictures[0].preamble);
        if (cancelled) return;
        const images: Record<string, string> = {};
        const errors: string[] = [];
        results.forEach((result, index) => {
          if ("svg" in result) images[pictures[index].key] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg)}`;
          else errors.push(result.error);
        });
        setTikz({ images, errors, pending: false });
      } catch (error) {
        if (!cancelled) setTikz({ images: {}, errors: [error instanceof Error ? error.message : "TikZ зурж чадсангүй."], pending: false });
      }
    }, 1200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [text]);

  if (!looksLikeLatex(text)) return null;
  return <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2.5 text-sm leading-6">
    <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Харагдах байдал{tikz.pending ? " · TikZ зурж байна…" : ""}</p>
    <LatexContent source={text} tikzImages={tikz.images}/>
    {tikz.errors.map((error) => <p key={error} role="alert" className="mt-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{error}</p>)}
  </div>;
}
