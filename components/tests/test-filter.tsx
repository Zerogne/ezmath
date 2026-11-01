"use client";

import { ArrowDownAZ, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { TestCard } from "@/components/home/test-card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ExamType, Test, TestType } from "@/types/exam";
import { EmptyState } from "@/components/ui/empty-state";

type ExamFilter = "ALL" | ExamType;
type SortOrder = "newest" | "oldest";
const exams: { value: ExamFilter; label: string }[] = [{ value: "ALL", label: "Бүгд" }, { value: "SAT", label: "SAT" }, { value: "EYESH", label: "ЭЕШ" }];
const types: { value: "ALL" | TestType; label: string }[] = [{ value: "ALL", label: "Бүх төрөл" }, { value: "full", label: "Full test" }, { value: "practice", label: "Practice" }];

export function TestFilter({ tests, initialExam = "ALL", showExamFilter = true }: { tests: Test[]; initialExam?: ExamFilter; showExamFilter?: boolean }) {
  const [exam, setExam] = useState<ExamFilter>(initialExam);
  const [type, setType] = useState<"ALL" | TestType>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const selectExam = (value: ExamFilter) => { setExam(value); if (value !== "SAT") setType("ALL"); };

  const filtered = useMemo(() => {
    const result = tests.filter((test) => (exam === "ALL" || test.examType === exam) && (exam !== "SAT" || type === "ALL" || test.type === type));
    return result.slice().sort((a, b) => {
      if (a.year === undefined && b.year === undefined) return (a.variant ?? "").localeCompare(b.variant ?? "");
      if (a.year === undefined) return 1;
      if (b.year === undefined) return -1;
      if (a.year !== b.year) return sortOrder === "newest" ? b.year - a.year : a.year - b.year;
      return (a.variant ?? "").localeCompare(b.variant ?? "");
    });
  }, [tests, exam, type, sortOrder]);

  const hasActiveFilters = (showExamFilter && exam !== "ALL") || type !== "ALL" || sortOrder !== "newest";

  return <>
    <div className="flex items-center justify-between border-b pb-6">
      <h2 className="text-lg font-semibold">{filtered.length} шалгалт</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="secondary"><SlidersHorizontal size={16}/>Шүүлтүүр{hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Идэвхтэй шүүлтүүртэй"/>}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {showExamFilter && <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Ангилал</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={exam} onValueChange={(value) => selectExam(value as ExamFilter)}>
              {exams.map((item) => <DropdownMenuRadioItem key={item.value} value={item.value}>{item.label}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator/>
          </>}
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
    {filtered.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((test) => <TestCard key={test.id} test={test}/>)}</div> : <EmptyState className="mt-5" pose="think" title="Шалгалт олдсонгүй" text="Шүүлтүүрээ өөрчилж дахин оролдоно уу."/>}
  </>;
}
