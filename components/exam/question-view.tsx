import Image from "next/image";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { AnswerOption } from "./answer-option";
import { MathText } from "@/components/math/math-text";
import type { ExamType, StudentQuestion } from "@/types/exam";

type Props = { question: StudentQuestion; examType?: ExamType; total: number; answer?: string; writtenAnswers?: Record<string, string>; marked: boolean; onAnswer: (id: string) => void; onWrite: (fieldId: string, value: string) => void; onMark: () => void };

export function QuestionView({ question, examType, total, answer, writtenAnswers = {}, marked, onAnswer, onWrite, onMark }: Props) {
  const written = question.questionType === "multi-blank";
  return <article className="mx-auto w-full max-w-3xl"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Асуулт {question.questionNumber} / {total}</p>{question.topic && <span className="text-xs text-muted-foreground">{question.topic}</span>}</div><h1 className="mt-8 whitespace-pre-line text-xl font-semibold leading-8 sm:text-2xl sm:leading-9"><MathText>{question.questionText}</MathText></h1>{question.imageUrl && <div className="relative mt-6 h-72 w-full overflow-hidden rounded-xl border bg-slate-50 sm:h-96"><Image src={question.imageUrl} alt={`${question.questionNumber}-р асуултын зураг`} fill unoptimized className="object-contain" /></div>}{written ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{(question.responseFields ?? []).map((field) => <WrittenAnswerInput key={field.id} id={`answer-${question.id}-${field.id}`} label={field.label} value={writtenAnswers[field.id] ?? ""} sat={examType === "SAT"} onChange={(value) => onWrite(field.id, value)} />)}</div> : <div role="radiogroup" aria-label={`Асуулт ${question.questionNumber}-ийн хариултууд`} className="mt-8 grid gap-3">{question.choices.map((choice) => <AnswerOption key={choice.id} choice={choice} selected={answer === choice.id} onSelect={() => onAnswer(choice.id)} />)}</div>}<button type="button" aria-pressed={marked} onClick={onMark} className={`mt-7 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold ${marked ? "text-amber-700" : "text-muted-foreground hover:text-foreground"}`}>{marked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}Дараа шалгахаар тэмдэглэх</button></article>;
}

/**
 * Phone number keypads (iOS `decimal`) have no minus or slash key, so those are offered as buttons
 * that keep the input focused and the keypad open.
 */
function WrittenAnswerInput({ id, label, value, sat, onChange }: { id: string; label: string; value: string; sat: boolean; onChange: (value: string) => void }) {
  const toggleNegative = () => onChange(value.startsWith("-") ? value.slice(1) : `-${value}`);
  const addSlash = () => { if (!value.includes("/")) onChange(`${value}/`); };
  const keepFocus = (event: React.PointerEvent) => event.preventDefault();
  const keyClass = "grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-white text-lg font-semibold text-muted-foreground transition hover:border-primary hover:text-primary";
  return <div className="grid gap-2 text-sm font-semibold">
    <label htmlFor={id}>{label}</label>
    <div className="flex gap-2">
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" maxLength={sat ? 6 : undefined} autoComplete="off" className="h-12 min-w-0 flex-1 rounded-xl border bg-white px-4 text-base font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder={sat ? "Жишээ: 3/4, .75, -2" : `${label} хариу`} />
      <button type="button" onPointerDown={keepFocus} onClick={toggleNegative} aria-pressed={value.startsWith("-")} aria-label="Сөрөг тэмдэг" className={keyClass}>−</button>
      {sat && <button type="button" onPointerDown={keepFocus} onClick={addSlash} disabled={value.includes("/")} aria-label="Бутархайн зураас" className={`${keyClass} disabled:opacity-40`}>/</button>}
    </div>
  </div>;
}
