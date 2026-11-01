import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { EmptyState } from "@/components/ui/empty-state";
import { PracticeSession } from "@/components/question-bank/practice-session";
import { selectPracticeSet, type BankFilters, type BankMode } from "@/lib/data/question-bank";
import { createClient } from "@/lib/supabase/server";
import { satGroupLabel } from "@/lib/sat/taxonomy";
import type { Difficulty } from "@/types/exam";

export const metadata: Metadata = { title: "SAT бодлогын сан — дасгал", robots: { index: false, follow: false } };

const MODES: BankMode[] = ["all", "new", "incorrect", "marked"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const COUNTS = [5, 10, 20, 30];
type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";

function parseFilters(params: Params): BankFilters {
  const mode = one(params.mode) as BankMode;
  const count = Number(one(params.count));
  return {
    section: one(params.section) === "reading-writing" ? "Reading and Writing" : "Math",
    groups: one(params.groups).split(",").filter((group) => /^[a-z0-9-]{1,120}$/.test(group)).slice(0, 40),
    difficulties: one(params.difficulty).split(",").filter((value): value is Difficulty => DIFFICULTIES.includes(value as Difficulty)),
    mode: MODES.includes(mode) ? mode : "all",
    count: COUNTS.includes(count) ? count : 10,
  };
}

export default async function QuestionBankPracticePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const query = new URLSearchParams({ section: filters.section === "Math" ? "math" : "reading-writing", mode: filters.mode, count: String(filters.count) });
  if (filters.groups.length) query.set("groups", filters.groups.join(","));
  if (filters.difficulties.length) query.set("difficulty", filters.difficulties.join(","));
  const href = `/question-bank/practice?${query}`;
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(href)}`);
  const set = await selectPracticeSet(filters, user.id);
  return <>
    <Navbar/>
    <main className="container-page max-w-4xl py-8 sm:py-12">
      {set.questions.length
        ? <PracticeSession key={set.questions.map((item) => item.question.id).join(",")} items={set.questions.map((item) => ({ ...item, groupLabel: satGroupLabel(item.group) }))}/>
        : <EmptyState heading="h1" pose="think" title="Тохирох асуулт олдсонгүй" text="Шүүлтүүрээ өөрчлөөд дахин оролдоно уу. “Буруу хариулсан”, “Тэмдэглэсэн” нь таны өмнө бодсон асуултаас сонгогдоно." action={<Link href="/question-bank" className="btn-dark">Бодлогын сан руу</Link>}/>}
    </main>
  </>;
}
