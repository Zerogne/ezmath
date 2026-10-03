"use client";

import { ArrowDownAZ, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { TestCard } from "@/components/home/test-card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ExamType, Test, TestType } from "@/types/exam";

type ExamFilter = "ALL" | ExamType;
type SortOrder = "newest" | "oldest";
const types: { value: "ALL" | TestType; label: string }[] = [{ value: "ALL", label: "Бүх төрөл" }, { value: "full", label: "Full test" }, { value: "practice", label: "Practice" }];

export function TestFilter({ tests, initialExam = "ALL" }: { tests: Test[]; initialExam?: ExamFilter }) {
  const [exam, setExam] = useState<ExamFilter>(initialExam);
  const [type, setType] = useState<"ALL" | TestType>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const selectExam = (value: ExamFilter) => { setExam(value); if (value !== "SAT") setType("ALL"); };

  const filtered = useMemo(() => {
    const result = tests.filter((test) => (exam === "ALL" || test.examType === exam) && (exam !== "SAT" || type === "ALL" || test.type === type));
    return sortOrder === "oldest" ? result.slice().reverse() : result;
  }, [tests, exam, type, sortOrder]);

  const hasActiveFilters = type !== "ALL" || sortOrder !== "newest";

  return <>
    <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex w-fit rounded-xl bg-muted p-1" role="group" aria-label="Шалгалтын ангилал">{(["ALL", "SAT", "EYESH"] as const).map((value) => <button type="button" key={value} aria-pressed={exam === value} onClick={() => selectExam(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${exam === value ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{value === "ALL" ? "Бүгд" : value === "EYESH" ? "ЭЕШ" : value}</button>)}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="secondary"><SlidersHorizontal size={16}/>Шүүлтүүр{hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Идэвхтэй шүүлтүүртэй"/>}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowDownAZ size={14}/>Эрэмбэлэх</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <DropdownMenuRadioItem value="newest">Шинэ эхэндээ</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="oldest">Хуучин эхэндээ</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          {exam === "SAT" && <>
            <DropdownMenuSeparator/>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Төрөл</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={type} onValueChange={(value) => setType(value as "ALL" | TestType)}>
              {types.map((item) => <DropdownMenuRadioItem key={item.value} value={item.value}>{item.label}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </>}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div className="mt-8 flex items-baseline justify-between"><h2 className="text-lg font-semibold">{filtered.length} шалгалт</h2></div>
    {filtered.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((test) => <TestCard key={test.id} test={test}/>)}</div> : <div className="mt-5 rounded-xl border border-dashed bg-white py-16 text-center"><p className="font-semibold">Шалгалт олдсонгүй</p><p className="mt-1 text-sm text-muted-foreground">Шүүлтүүрээ өөрчилж дахин оролдоно уу.</p></div>}
  </>;
}
