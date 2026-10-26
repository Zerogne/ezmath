"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ArrowUp, Check } from "lucide-react";
import { Art, ObjectArt, castSize, type ArtName, type ObjectKind } from "@/components/home/redesign/illustrations";

type Slide = {
  label: string; shape: "blob" | "squiggle" | "pill"; color: string;
  scoreLabel: string; score: string; delta: string; scorePos: CSSProperties;
  qno: string; prompt: React.ReactNode; options: [string, string][]; correct: string; count: string;
  tiles: { kind: ObjectKind; bg: string; pos: CSSProperties }[];
  character: ArtName;
};

const slides: Slide[] = [
  { label: "ЭЕШ Математик", shape: "blob", color: "#4C6FFF", scoreLabel: "Таамагласан оноо", score: "742", delta: "+86 оноо", scorePos: { top: 40, left: 14, rotate: "-6deg" },
    qno: "14", prompt: <>Хэрэв log<sub>2</sub>(x + 3) = 3 бол x-ийн утгыг ол.</>, options: [["A", "3"], ["B", "5"], ["C", "6"], ["D", "8"]], correct: "B", count: "14 / 36",
    tiles: [{ kind: "notebook", bg: "#E8EEFF", pos: { top: 58, right: 6, rotate: "8deg" } }, { kind: "chart", bg: "#FFE4EF", pos: { bottom: 12, right: 26, rotate: "5deg" } }], character: "cast-temuulen-wave" },
  { label: "Digital SAT Math", shape: "squiggle", color: "#FFD43B", scoreLabel: "Predicted SAT", score: "1490", delta: "+120 оноо", scorePos: { top: 196, right: -4, rotate: "5deg" },
    qno: "7", prompt: "If 3x + 7 = 2x + 15, what is the value of x?", options: [["A", "4"], ["B", "8"], ["C", "11"], ["D", "15"]], correct: "B", count: "7 / 22",
    tiles: [{ kind: "calculator", bg: "#E9FBF2", pos: { top: 40, left: 26, rotate: "-6deg" } }, { kind: "target", bg: "#EFE6FF", pos: { bottom: 110, right: 6, rotate: "9deg" } }], character: "cast-saraa-cheer" },
  { label: "Онолын хичээл", shape: "pill", color: "#34D399", scoreLabel: "Дуусгасан сэдэв", score: "18/24", delta: "+3 энэ долоо хоног", scorePos: { top: 150, left: 0, rotate: "-5deg" },
    qno: "3", prompt: "sin 30° + cos 60° илэрхийллийн утгыг ол.", options: [["A", "½"], ["B", "1"], ["C", "√3⁄2"], ["D", "2"]], correct: "B", count: "3 / 12",
    tiles: [{ kind: "books", bg: "#EFE6FF", pos: { top: 84, right: 0, rotate: "-7deg" } }, { kind: "bulb", bg: "#FFF6CC", pos: { top: 250, right: -6, rotate: "10deg" } }], character: "cast-anujin-book" },
];

function Shape({ shape, color }: { shape: Slide["shape"]; color: string }) {
  const cls = "rd-hv-shape absolute left-[10px] top-[66px] h-[520px] w-[540px]";
  if (shape === "blob") return <svg className={cls} viewBox="0 0 520 520" fill="none" aria-hidden><path d="M262 34 C362 22 462 92 478 200 C494 306 430 348 450 420 C470 494 376 520 296 488 C222 458 166 504 98 470 C24 432 34 352 58 292 C80 234 34 178 74 114 C114 52 188 42 262 34 Z" fill={color}/></svg>;
  if (shape === "squiggle") return <svg className={cls} viewBox="0 0 520 520" fill="none" aria-hidden><path d="M418 70 C330 104 150 110 120 190 C96 256 250 244 360 236 C460 230 470 310 380 330 C280 352 120 330 110 410 C104 460 170 470 210 440" stroke={color} strokeWidth="96" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <svg className={cls} viewBox="0 0 520 520" fill="none" aria-hidden><rect x="58" y="58" width="404" height="404" rx="150" transform="rotate(12 260 260)" fill={color}/></svg>;
}

const delays = [0, 0.05, 0.15, 0.3, 0.38, 0.46, 0.54];
const d = (i: number) => ({ "--d": `${delays[i]}s` }) as CSSProperties;

function HeroVisual({ slide, active, settled }: { slide: Slide; active: boolean; settled: boolean }) {
  return <div className="rd-hv absolute inset-0" data-active={active || undefined} data-settled={(active && settled) || undefined} aria-hidden={!active}>
    <p className="rd-display absolute inset-x-0 top-0 text-center text-[26px]" style={d(0)}>{slide.label}</p>
    <Shape shape={slide.shape} color={slide.color}/>
    <div className="absolute left-[150px] top-[110px] flex h-[440px] w-[300px] flex-col rounded-[26px] border-2 border-[#EEF0F6] bg-white p-4 shadow-[0_30px_60px_-24px_rgba(11,16,48,.35)]" style={d(2)}>
      <div className="flex items-center gap-2.5 rounded-[10px] bg-[#F4F5FA] px-2.5 py-2 text-xs font-semibold"><span className="rounded-md bg-[#0B1030] px-2 py-0.5 text-white">{slide.qno}</span><span className="font-medium text-[#5B6275]">☆ Дараа шалгах</span></div>
      <p className="rd-serif mt-4 text-[15px] leading-normal">{slide.prompt}</p>
      <div className="mt-4 flex flex-col gap-[9px]">{slide.options.map(([letter, value]) => { const ok = letter === slide.correct; return <div key={letter} className={`rd-serif flex items-center gap-3 rounded-xl border-2 px-3 py-[9px] text-[15px] ${ok ? "border-[#22C55E] bg-[#F0FDF4]" : "border-[#E4E7F0]"}`}><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border-2 font-sans text-[11px] font-semibold ${ok ? "border-[#22C55E] bg-[#22C55E] text-white" : "border-[#0B1030]"}`}>{ok ? <Check size={14} strokeWidth={3}/> : letter}</span>{value}</div>; })}</div>
      <div className="mt-auto flex items-center justify-between border-t-2 border-[#F0F1F6] pt-3 text-xs font-medium text-[#5B6275]"><span>{slide.count}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B1030] px-4 py-2.5 font-semibold text-white"><Check size={14} strokeWidth={3}/>Хариу шалгах</span></div>
    </div>
    <div className="rd-score absolute z-[2] w-[156px] rounded-[18px] border-2 border-[#EEF0F6] bg-white px-4 py-3.5 shadow-[0_18px_40px_-16px_rgba(11,16,48,.3)]" style={{ ...slide.scorePos, ...d(3) }}>
      <p className="text-xs font-medium text-[#5B6275]">{slide.scoreLabel}</p>
      <p className="rd-display mt-0.5 flex items-center gap-2 text-[34px] leading-tight">{slide.score}<span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"><ArrowUp size={16} strokeWidth={3}/></span></p>
      <p className="text-xs font-semibold text-[#16A34A]">{slide.delta}</p>
    </div>
    {slide.tiles.map((tile, i) => <div key={tile.kind} className="rd-tile absolute flex h-[104px] w-[104px] items-center justify-center rounded-[30px] border-2 border-[#0B1030]/[.06] shadow-[0_16px_34px_-14px_rgba(11,16,48,.28)]" style={{ background: tile.bg, ...tile.pos, ...d(4 + i) }}><ObjectArt kind={tile.kind}/></div>)}
    <div className="rd-tile absolute bottom-[-6px] left-[-24px] z-[3]" style={d(6)}><Art name={slide.character} {...castSize(228)} priority={slide.character === "cast-temuulen-wave"}/></div>
  </div>;
}

/** OnePrep-style hero visual that cycles ЭЕШ → SAT → Онол, popping each slide's pieces in turn. */
export function HeroCarousel() {
  const [active, setActive] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = window.setTimeout(() => setActive(0), 120);
    const rotate = reduce ? 0 : window.setInterval(() => { setSettled(false); setActive((i) => ((i ?? 0) + 1) % slides.length); }, 3600);
    return () => { clearTimeout(start); clearInterval(rotate); };
  }, []);
  useEffect(() => {
    if (active === null) return;
    const t = window.setTimeout(() => setSettled(true), 1300);
    return () => clearTimeout(t);
  }, [active]);
  return <div className="relative mx-auto h-[400px] w-full max-w-[560px] sm:h-[480px] lg:h-[600px]" role="img" aria-label="ЭЕШ, SAT болон онолын хичээлийн жишээ бодлого">
    <div className="absolute left-1/2 top-0 h-[600px] w-[560px] origin-top -translate-x-1/2 scale-[.66] sm:scale-[.8] lg:scale-100">
      {slides.map((slide, i) => <HeroVisual key={slide.label} slide={slide} active={active === i} settled={settled}/>)}
    </div>
  </div>;
}
