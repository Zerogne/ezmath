"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { SatSection } from "@/lib/sat/taxonomy";
import type { Difficulty } from "@/types/exam";

export type BankBrowserQuestion = { section: SatSection; group: string; difficulty: Difficulty | null; result: "new" | "correct" | "incorrect"; marked: boolean };
export type BankBrowserSection = { section: SatSection; unclassifiedKey: string; domains: { name: string; groups: { key: string; label: string }[] }[] };
type Mode = "all" | "new" | "incorrect" | "marked";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [{ value: "Easy", label: "Хялбар" }, { value: "Medium", label: "Дунд" }, { value: "Hard", label: "Хүнд" }];
const MODES: { value: Mode; label: string }[] = [{ value: "all", label: "Бүгд" }, { value: "new", label: "Шинэ" }, { value: "incorrect", label: "Буруу хариулсан" }, { value: "marked", label: "Тэмдэглэсэн" }];
const COUNTS = [5, 10, 20, 30];
const SECTION_LABEL: Record<SatSection, string> = { Math: "Math", "Reading and Writing": "Reading & Writing" };
const sectionParam = (section: SatSection) => section === "Math" ? "math" : "reading-writing";

function matches(question: BankBrowserQuestion, section: SatSection, groups: Set<string>, difficulties: Set<Difficulty>, mode: Mode) {
  if (question.section !== section) return false;
  if (groups.size && !groups.has(question.group)) return false;
  if (difficulties.size && (!question.difficulty || !difficulties.has(question.difficulty))) return false;
  if (mode === "new") return question.result === "new";
  if (mode === "incorrect") return question.result === "incorrect";
  if (mode === "marked") return question.marked;
  return true;
}

/** OnePrep-style filters: section → domain → skill, difficulty and personal filters, then start a practice set. */
export function BankBrowser({ sections, questions, signedIn }: { sections: BankBrowserSection[]; questions: BankBrowserQuestion[]; signedIn: boolean }) {
  const [section, setSection] = useState<SatSection>(sections[0].section);
  const [groups, setGroups] = useState<Set<string>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<Difficulty>>(new Set());
  const [mode, setMode] = useState<Mode>("all");
  const [count, setCount] = useState(10);
  const current = sections.find((item) => item.section === section)!;

  // Per-group totals and progress for the current section, and the number of questions the filters select.
  const stats = useMemo(() => {
    const byGroup = new Map<string, { total: number; answered: number; correct: number }>();
    for (const question of questions) {
      if (question.section !== section) continue;
      const value = byGroup.get(question.group) ?? { total: 0, answered: 0, correct: 0 };
      value.total += 1;
      if (question.result !== "new") value.answered += 1;
      if (question.result === "correct") value.correct += 1;
      byGroup.set(question.group, value);
    }
    return byGroup;
  }, [questions, section]);
  const sectionTotals = useMemo(() => new Map(sections.map((item) => [item.section, questions.filter((question) => question.section === item.section).length])), [sections, questions]);
  const matching = useMemo(() => questions.filter((question) => matches(question, section, groups, difficulties, mode)).length, [questions, section, groups, difficulties, mode]);

  const toggle = <T,>(set: Set<T>, value: T) => { const next = new Set(set); if (next.has(value)) next.delete(value); else next.add(value); return next; };
  const selectSection = (value: SatSection) => { setSection(value); setGroups(new Set()); };
  const domainKeys = (domain: BankBrowserSection["domains"][number]) => domain.groups.map((group) => group.key).filter((key) => stats.get(key)?.total);
  const toggleDomain = (domain: BankBrowserSection["domains"][number]) => {
    const keys = domainKeys(domain);
    const all = keys.length > 0 && keys.every((key) => groups.has(key));
    const next = new Set(groups);
    for (const key of keys) if (all) next.delete(key); else next.add(key);
    setGroups(next);
  };

  const params = new URLSearchParams({ section: sectionParam(section), mode, count: String(count) });
  if (groups.size) params.set("groups", [...groups].join(","));
  if (difficulties.size) params.set("difficulty", [...difficulties].join(","));
  const practiceHref = `/question-bank/practice?${params}`;
  const startHref = signedIn ? practiceHref : `/login?next=${encodeURIComponent(practiceHref)}`;
  const unclassified = stats.get(current.unclassifiedKey);

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <div>
      <div className="inline-flex rounded-full bg-[#F1F3F8] p-1" role="tablist" aria-label="Хэсэг">
        {sections.map((item) => <button key={item.section} type="button" role="tab" aria-selected={item.section === section} onClick={() => selectSection(item.section)} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${item.section === section ? "bg-white text-[#0B1030] shadow-sm" : "text-[#5B6275] hover:text-[#0B1030]"}`}>{SECTION_LABEL[item.section]} <span className="ml-1 font-medium text-[#9AA0B4]">{sectionTotals.get(item.section) ?? 0}</span></button>)}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {current.domains.map((domain) => {
          const keys = domainKeys(domain);
          const allSelected = keys.length > 0 && keys.every((key) => groups.has(key));
          return <section key={domain.name} className="rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">{domain.name}</h2>
              {keys.length > 0 && <button type="button" onClick={() => toggleDomain(domain)} className="shrink-0 text-xs font-semibold text-[#2B4BE8]">{allSelected ? "Цуцлах" : "Бүгдийг сонгох"}</button>}
            </div>
            <ul className="mt-3 space-y-1">
              {domain.groups.map((group) => {
                const value = stats.get(group.key);
                if (!value && group.key.startsWith("other-")) return null;
                return <li key={group.key}><SkillRow label={group.label} checked={groups.has(group.key)} disabled={!value} total={value?.total ?? 0} answered={value?.answered ?? 0} correct={value?.correct ?? 0} onToggle={() => setGroups(toggle(groups, group.key))}/></li>;
              })}
            </ul>
          </section>;
        })}
        {unclassified && <section className="rounded-[22px] border-2 border-dashed border-[#E3E6EF] bg-white p-5"><h2 className="text-lg font-medium">Ангилаагүй</h2><p className="mt-1 text-xs text-[#5B6275]">Ур чадвар нь тодорхойгүй асуултууд.</p><ul className="mt-3"><li><SkillRow label="Ангилаагүй асуултууд" checked={groups.has(current.unclassifiedKey)} disabled={false} total={unclassified.total} answered={unclassified.answered} correct={unclassified.correct} onToggle={() => setGroups(toggle(groups, current.unclassifiedKey))}/></li></ul></section>}
      </div>
    </div>
    <aside className="h-fit space-y-5 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 lg:sticky lg:top-24">
      <Filter title="Түвшин">{DIFFICULTIES.map((item) => <Chip key={item.value} active={difficulties.has(item.value)} onClick={() => setDifficulties(toggle(difficulties, item.value))}>{item.label}</Chip>)}</Filter>
      <Filter title="Асуултууд">{MODES.map((item) => <Chip key={item.value} active={mode === item.value} onClick={() => setMode(item.value)}>{item.label}</Chip>)}</Filter>
      <Filter title="Хэдэн асуулт">{COUNTS.map((value) => <Chip key={value} active={count === value} onClick={() => setCount(value)}>{value}</Chip>)}</Filter>
      <div className="border-t-2 border-[#F0F1F6] pt-4">
        <p className="text-sm text-[#5B6275]"><b className="font-display text-2xl font-medium text-[#0B1030]">{matching}</b> асуулт тохирч байна{groups.size === 0 && " · бүх ур чадвар"}</p>
        {matching > 0 ? <Link href={startHref} className="btn-dark mt-3 w-full text-base">{signedIn ? `${Math.min(count, matching)} асуулт эхлэх` : "Нэвтэрч эхлэх"}<ArrowRight size={17}/></Link>
          : <p className="mt-3 rounded-xl bg-[#F7F8FC] px-3 py-2.5 text-xs text-[#5B6275]">Шүүлтүүрт тохирох асуулт алга. Түвшин эсвэл ур чадвараа өөрчилнө үү.</p>}
      </div>
    </aside>
  </div>;
}

function SkillRow({ label, checked, disabled, total, answered, correct, onToggle }: { label: string; checked: boolean; disabled: boolean; total: number; answered: number; correct: number; onToggle: () => void }) {
  return <label className={`flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 transition ${disabled ? "cursor-default opacity-45" : "hover:bg-[#F7F8FC]"}`}>
    <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={onToggle}/>
    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#2B4BE8] ${checked ? "border-[#2B4BE8] bg-[#2B4BE8] text-white" : "border-[#C9CDDA] bg-white"}`}>{checked && <Check size={13} strokeWidth={3}/>}</span>
    <span className="min-w-0 flex-1 text-sm leading-5">{label}<span className="mt-0.5 block text-xs text-[#9AA0B4]">{total} асуулт{answered > 0 && ` · ${answered} бодсон · ${Math.round(correct / answered * 100)}% зөв`}</span></span>
  </label>;
}

function Filter({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="text-sm font-semibold">{title}</p><div className="mt-2 flex flex-wrap gap-2">{children}</div></div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition ${active ? "border-[#2B4BE8] bg-[#EEF1FF] text-[#2B4BE8]" : "border-[#E3E6EF] text-[#5B6275] hover:border-[#C9CDDA] hover:text-[#0B1030]"}`}>{children}</button>;
}
