"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { TestCard } from "@/components/home/test-card";
import { Button } from "@/components/ui/button";
import type { ExamType, Test, TestType } from "@/types/exam";

type ExamFilter = "ALL" | ExamType;
const types: { value: "ALL" | TestType; label: string }[] = [{ value: "ALL", label: "Бүх төрөл" }, { value: "full", label: "Full test" }, { value: "practice", label: "Practice" }, { value: "previous-year", label: "Өмнөх он" }];

export function TestFilter({ tests, initialExam = "ALL" }: { tests: Test[]; initialExam?: ExamFilter }) {
  const [exam, setExam] = useState<ExamFilter>(initialExam);
  const [subject, setSubject] = useState("Бүгд");
  const [type, setType] = useState<"ALL" | TestType>("ALL");
  const [year, setYear] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const subjects = useMemo(() => ["Бүгд", ...new Set(tests.map((test) => test.subject))], [tests]);
  const years = useMemo(() => ["ALL", ...new Set(tests.map((test) => test.year).filter((value): value is number => value !== undefined).sort((a, b) => b - a).map(String))], [tests]);
  const filtered = useMemo(() => tests.filter((test) => (exam === "ALL" || test.examType === exam) && (subject === "Бүгд" || test.subject === subject) && (type === "ALL" || test.type === type) && (year === "ALL" || test.year === Number(year))), [tests, exam, subject, type, year]);
  const reset = () => { setSubject("Бүгд"); setType("ALL"); setYear("ALL"); };
  const hasActiveFilters = subject !== "Бүгд" || type !== "ALL" || year !== "ALL";
  return <>
    <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex w-fit rounded-xl bg-muted p-1" role="group" aria-label="Шалгалтын ангилал">{(["ALL", "SAT", "EYESH"] as const).map((value) => <button type="button" key={value} aria-pressed={exam === value} onClick={() => setExam(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${exam === value ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{value === "ALL" ? "Бүгд" : value === "EYESH" ? "ЭЕШ" : value}</button>)}</div>
      <Button type="button" variant="secondary" aria-expanded={showFilters} aria-controls="test-filters" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={16}/>Шүүлтүүр{hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Идэвхтэй шүүлтүүртэй"/>}</Button>
    </div>
    {showFilters && <div id="test-filters" className="mt-4 grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-3"><Filter label="Хичээл" value={subject} onChange={setSubject} options={subjects}/><Filter label="Төрөл" value={type} onChange={(v) => setType(v as "ALL" | TestType)} options={types.map((x) => x.value)} labels={Object.fromEntries(types.map((x) => [x.value, x.label]))}/><Filter label="Он" value={year} onChange={setYear} options={years} labels={{ ALL: "Бүх он" }}/>{hasActiveFilters && <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-left text-sm font-medium text-muted-foreground hover:text-foreground sm:col-span-3"><X size={15}/>Шүүлтүүр цэвэрлэх</button>}</div>}
    <div className="mt-8 flex items-baseline justify-between"><h2 className="text-lg font-semibold">{filtered.length} шалгалт</h2></div>
    {filtered.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((test) => <TestCard key={test.id} test={test}/>)}</div> : <div className="mt-5 rounded-xl border border-dashed bg-white py-16 text-center"><p className="font-semibold">Шалгалт олдсонгүй</p><p className="mt-1 text-sm text-muted-foreground">Шүүлтүүрээ өөрчилж дахин оролдоно уу.</p></div>}
  </>;
}
function Filter({ label, value, onChange, options, labels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string,string> }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<select className="h-11 rounded-xl border bg-white px-3 font-normal" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}</select></label>; }
