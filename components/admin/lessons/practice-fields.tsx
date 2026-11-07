"use client";

import { useState } from "react";
import type { Practice } from "@/lib/learning/course-catalog";
import { MathText } from "@/components/math/math-text";
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
    <div className="grid gap-1.5">
      <Label htmlFor="practice-example">Жишээ <span className="font-normal text-muted-foreground">— заавал биш</span></Label>
      <Textarea id="practice-example" name="example" rows={compact ? 3 : 4} maxLength={4000} value={example} onChange={(event) => setExample(event.target.value)} placeholder="Бодсон жишээ: $x^2 - 5x + 6 = 0$ бол $(x-2)(x-3)=0$, тиймээс $x=2$ эсвэл $x=3$."/>
      <Preview text={example}/>
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="practice-problem">Тест бодлого <span className="font-normal text-muted-foreground">— заавал биш</span></Label>
      <Textarea id="practice-problem" name="testProblem" rows={compact ? 3 : 4} maxLength={4000} value={problem} onChange={(event) => setProblem(event.target.value)} placeholder="Сурагч өөрөө бодох бодлого: $x^2 - 7x + 12 = 0$ тэгшитгэлийн их шийдийг ол."/>
      <Preview text={problem}/>
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="practice-answer">Тест бодлогын хариу {problem.trim() ? "" : <span className="font-normal text-muted-foreground">— бодлого нэмбэл заавал</span>}</Label>
      <Input id="practice-answer" name="testAnswer" maxLength={300} required={Boolean(problem.trim())} defaultValue={initial?.answer} placeholder="4"/>
      <p className="text-xs text-muted-foreground">Олон зөв хариу байвал <code>;</code>-ээр тусгаарлана (жишээ: <code>0.5; 1/2</code>). Сурагчийн хариуг зай, том жижиг үсгээс үл хамааран шалгана.</p>
    </div>
  </div>;
}

function Preview({ text }: { text: string }) {
  if (!/\$|\\\(|\\\[/.test(text)) return null;
  return <div className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm leading-6"><span className="mr-2 text-xs font-semibold text-muted-foreground">Харагдах байдал:</span><MathText>{text}</MathText></div>;
}
