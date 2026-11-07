"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, Minus } from "lucide-react";
import type { SatSection } from "@/lib/sat/taxonomy";
import type { Difficulty } from "@/types/exam";

export type BankBrowserQuestion = { section: SatSection; group: string; difficulty: Difficulty | null; result: "new" | "correct" | "incorrect"; marked: boolean };
export type BankBrowserSection = { section: SatSection; unclassifiedKey: string; domains: { name: string; groups: { key: string; label: string }[] }[] };
type Mode = "all" | "new" | "incorrect" | "marked";
type Stat = { total: number; answered: number; correct: number };

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

/**
 * Question bank filters: section tabs, then one collapsible row per domain (skills without questions are hidden),
 * difficulty / question / count filters, and a start button that stays reachable — beside the list on desktop,
 * pinned to the bottom of the bank on phones.
 */
export function BankBrowser({ sections, questions, signedIn }: { sections: BankBrowserSection[]; questions: BankBrowserQuestion[]; signedIn: boolean }) {
  const [section, setSection] = useState<SatSection>(sections[0].section);
  const [groups, setGroups] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<Difficulty>>(new Set());
  const [mode, setMode] = useState<Mode>("all");
  const [count, setCount] = useState(10);
  const current = sections.find((item) => item.section === section)!;

  const stats = useMemo(() => {
    const byGroup = new Map<string, Stat>();
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

  // Only domains and skills that actually have questions are listed; "Ангилаагүй" joins as its own row.
  const domains = useMemo(() => {
    const rows = current.domains.map((domain) => ({ name: domain.name, skills: domain.groups.flatMap((group) => { const stat = stats.get(group.key); return stat ? [{ ...group, stat }] : []; }) }));
    const unclassified = stats.get(current.unclassifiedKey);
    if (unclassified) rows.push({ name: "Ангилаагүй", skills: [{ key: current.unclassifiedKey, label: "Ур чадвар нь тодорхойгүй асуултууд", stat: unclassified }] });
    return rows.filter((row) => row.skills.length);
  }, [current, stats]);

  const toggle = <T,>(set: Set<T>, value: T) => { const next = new Set(set); if (next.has(value)) next.delete(value); else next.add(value); return next; };
  const selectSection = (value: SatSection) => { setSection(value); setGroups(new Set()); setOpen(new Set()); };
  const toggleDomain = (keys: string[]) => {
    const all = keys.every((key) => groups.has(key));
    const next = new Set(groups);
    for (const key of keys) if (all) next.delete(key); else next.add(key);
    setGroups(next);
  };

  const params = new URLSearchParams({ section: sectionParam(section), mode, count: String(count) });
  if (groups.size) params.set("groups", [...groups].join(","));
  if (difficulties.size) params.set("difficulty", [...difficulties].join(","));
  const practiceHref = `/question-bank/practice?${params}`;
  const startHref = signedIn ? practiceHref : `/login?next=${encodeURIComponent(practiceHref)}`;
  const startLabel = signedIn ? `${Math.min(count, matching)} асуулт эхлэх` : "Нэвтэрч эхлэх";
  const summary = <><b className="font-display text-2xl font-medium text-[#0B1030]">{matching}</b> асуулт тохирч байна{groups.size === 0 && " · бүх ур чадвар"}</>;

  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-[#F1F3F8] p-1" role="tablist" aria-label="Хэсэг">
          {sections.map((item) => <button key={item.section} type="button" role="tab" aria-selected={item.section === section} onClick={() => selectSection(item.section)} className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${item.section === section ? "bg-white text-[#0B1030] shadow-sm" : "text-[#5B6275] hover:text-[#0B1030]"}`}>{SECTION_LABEL[item.section]} <span className="ml-1 font-medium text-[#9AA0B4]">{sectionTotals.get(item.section) ?? 0}</span></button>)}
        </div>
        {groups.size > 0 && <button type="button" onClick={() => setGroups(new Set())} className="text-sm font-semibold text-[#5B6275] hover:text-[#0B1030]">Сонголтыг арилгах ({groups.size})</button>}
      </div>

      {/* Phones: filters come before the list; the start button lives in the bar pinned at the bottom of the bank. */}
      <div className="mt-4 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-4 lg:hidden"><Filters {...{ difficulties, setDifficulties, mode, setMode, count, setCount, toggle }}/></div>

      <div className="mt-4 overflow-hidden rounded-[22px] border-2 border-[#EEF0F6] bg-white">
        {domains.length ? domains.map((domain, index) => {
          const keys = domain.skills.map((skill) => skill.key);
          const selected = keys.filter((key) => groups.has(key)).length;
          const total = domain.skills.reduce((sum, skill) => sum + skill.stat.total, 0);
          const expanded = open.has(domain.name);
          return <section key={domain.name} className={index ? "border-t-2 border-[#F1F3F8]" : ""}>
            <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <CheckBox state={selected === 0 ? "off" : selected === keys.length ? "on" : "mixed"} label={`${domain.name} бүгдийг сонгох`} onClick={() => toggleDomain(keys)}/>
              <button type="button" onClick={() => setOpen(toggle(open, domain.name))} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className="min-w-0 flex-1"><span className="block font-semibold leading-snug">{domain.name}</span><span className="mt-0.5 block text-xs text-[#5B6275]">{domain.skills.length} ур чадвар · {total} асуулт{selected > 0 && <span className="font-semibold text-[#2B4BE8]"> · {selected} сонгосон</span>}</span></span>
                <ChevronDown size={18} className={`shrink-0 text-[#9AA0B4] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}/>
              </button>
            </div>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <ul className="min-h-0 overflow-hidden" inert={!expanded}>
                {domain.skills.map((skill) => <li key={skill.key}><SkillRow label={skill.label} stat={skill.stat} checked={groups.has(skill.key)} onToggle={() => setGroups(toggle(groups, skill.key))}/></li>)}
                <li aria-hidden className="h-2"/>
              </ul>
            </div>
          </section>;
        }) : <p className="px-5 py-8 text-center text-sm text-[#5B6275]">Энэ хэсэгт асуулт хараахан нэмэгдээгүй байна.</p>}
      </div>

      <div className="sticky bottom-3 z-20 mt-4 flex items-center gap-3 rounded-[20px] border-2 border-[#EEF0F6] bg-white/95 p-3 pl-4 shadow-[0_18px_40px_-20px_rgba(11,16,48,.45)] backdrop-blur lg:hidden">
        <p className="min-w-0 flex-1 text-sm leading-tight text-[#5B6275]">{summary}</p>
        {matching > 0 ? <Link href={startHref} className="btn-dark shrink-0 px-4">{startLabel}<ArrowRight size={16}/></Link> : <span className="text-xs text-[#9AA0B4]">Шүүлтүүрээ өөрчил</span>}
      </div>
    </div>

    <aside className="hidden h-fit space-y-5 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 lg:sticky lg:top-24 lg:block">
      <Filters {...{ difficulties, setDifficulties, mode, setMode, count, setCount, toggle }}/>
      <div className="border-t-2 border-[#F0F1F6] pt-4">
        <p className="text-sm text-[#5B6275]">{summary}</p>
        {matching > 0 ? <Link href={startHref} className="btn-dark mt-3 w-full text-base">{startLabel}<ArrowRight size={17}/></Link>
          : <p className="mt-3 rounded-xl bg-[#F7F8FC] px-3 py-2.5 text-xs text-[#5B6275]">Шүүлтүүрт тохирох асуулт алга. Түвшин эсвэл ур чадвараа өөрчилнө үү.</p>}
      </div>
    </aside>
  </div>;
}

function Filters({ difficulties, setDifficulties, mode, setMode, count, setCount, toggle }: {
  difficulties: Set<Difficulty>; setDifficulties: (value: Set<Difficulty>) => void;
  mode: Mode; setMode: (value: Mode) => void;
  count: number; setCount: (value: number) => void;
  toggle: <T>(set: Set<T>, value: T) => Set<T>;
}) {
  return <div className="space-y-4">
    <Filter title="Түвшин">{DIFFICULTIES.map((item) => <Chip key={item.value} active={difficulties.has(item.value)} onClick={() => setDifficulties(toggle(difficulties, item.value))}>{item.label}</Chip>)}</Filter>
    <Filter title="Асуултууд">{MODES.map((item) => <Chip key={item.value} active={mode === item.value} onClick={() => setMode(item.value)}>{item.label}</Chip>)}</Filter>
    <Filter title="Хэдэн асуулт">{COUNTS.map((value) => <Chip key={value} active={count === value} onClick={() => setCount(value)}>{value}</Chip>)}</Filter>
  </div>;
}

function CheckBox({ state, label, onClick }: { state: "on" | "off" | "mixed"; label: string; onClick: () => void }) {
  return <button type="button" role="checkbox" aria-checked={state === "mixed" ? "mixed" : state === "on"} aria-label={label} onClick={onClick} className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition ${state === "off" ? "border-[#C9CDDA] bg-white hover:border-[#2B4BE8]" : "border-[#2B4BE8] bg-[#2B4BE8] text-white"}`}>{state === "on" ? <Check size={13} strokeWidth={3}/> : state === "mixed" ? <Minus size={13} strokeWidth={3}/> : null}</button>;
}

function SkillRow({ label, stat, checked, onToggle }: { label: string; stat: Stat; checked: boolean; onToggle: () => void }) {
  const accuracy = stat.answered ? Math.round(stat.correct / stat.answered * 100) : null;
  return <label className="mx-2 flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 pl-10 transition hover:bg-[#F7F8FC] sm:pl-11">
    <input type="checkbox" className="peer sr-only" checked={checked} onChange={onToggle}/>
    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#2B4BE8] ${checked ? "border-[#2B4BE8] bg-[#2B4BE8] text-white" : "border-[#C9CDDA] bg-white"}`}>{checked && <Check size={13} strokeWidth={3}/>}</span>
    <span className="min-w-0 flex-1">
      <span className="flex items-baseline justify-between gap-3 text-sm leading-5"><span>{label}</span><span className="shrink-0 text-xs font-medium text-[#9AA0B4]">{stat.total}</span></span>
      {stat.answered > 0 && <span className="mt-1.5 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF0F6]"><i className="block h-full rounded-full bg-[#2B4BE8]" style={{ width: `${stat.answered / stat.total * 100}%` }}/></span><span className={`text-[11px] font-semibold ${accuracy !== null && accuracy >= 70 ? "text-[#15803D]" : "text-[#5B6275]"}`}>{stat.answered}/{stat.total} · {accuracy}%</span></span>}
    </span>
  </label>;
}

function Filter({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="text-sm font-semibold">{title}</p><div className="mt-2 flex flex-wrap gap-2">{children}</div></div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition ${active ? "border-[#2B4BE8] bg-[#EEF1FF] text-[#2B4BE8]" : "border-[#E3E6EF] text-[#5B6275] hover:border-[#C9CDDA] hover:text-[#0B1030]"}`}>{children}</button>;
}
