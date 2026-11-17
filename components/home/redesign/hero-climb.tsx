import type { CSSProperties, ReactNode } from "react";
import { ArrowUp, Flag } from "lucide-react";
import { Art, Ezi, type ArtName } from "@/components/home/redesign/illustrations";

/* Palette from the illustration set (design/illustrations-v2): ink + brand blue carry the scene,
 * periwinkle/mint steppe is the ground, and each friend's colour is used only as its own milestone accent.
 * The upper-left of the stage is left empty on purpose: on wide screens the hero copy sits there. */
const BLUE = "#2B4BE8";
const PERI = "#DDE3FF";

const W = 1200;
const H = 760;
const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

/** Points the score curve passes through: start, four milestones, summit. Kept low on the left, under the copy. */
const P: [number, number][] = [[70, 708], [330, 680], [600, 620], [820, 510], [990, 396], [1130, 280]];

/** Catmull-Rom → cubic Bézier, so the milestone dots sit exactly on the curve. */
function curve(points: [number, number][]) {
  let path = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    path += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return path;
}
const CURVE = curve(P);

type Milestone = { n: string; title: string; meta: ReactNode; friend: ArtName; accent: string; tint: string; above: boolean };
const milestones: Milestone[] = [
  { n: "01", title: "Оношлох сорил", meta: "Эхлэх түвшин · 520", friend: "friend-mint", accent: "#1FA97A", tint: "#ECFBF4", above: true },
  { n: "02", title: "Хувийн төлөвлөгөө", meta: "7 хоног бүр шинэчлэгдэнэ", friend: "friend-sun", accent: "#C47E0A", tint: "#FFF6DD", above: false },
  { n: "03", title: "Сул сэдвээ давт", meta: <>Тригонометр 58% → <b>81%</b></>, friend: "friend-violet", accent: "#6E45DB", tint: "#F1ECFF", above: true },
  { n: "04", title: "Бүтэн mock шалгалт", meta: "ЭЕШ 2021 · A хувилбар", friend: "friend-coral", accent: "#E2523F", tint: "#FFEEEA", above: false },
];

/** Steppe from the set's landscape: far periwinkle ridges, three mint hills and a small ger. */
function Steppe() {
  return <svg className="rd-steppe absolute inset-x-0 bottom-0 h-[300px] w-full" viewBox="0 0 1200 300" preserveAspectRatio="none" fill="none" aria-hidden>
    <defs>
      <linearGradient id="hc-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C9D6FF"/><stop offset="1" stopColor="#E3E9FF"/></linearGradient>
      <linearGradient id="hc-h1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D5F2E3"/><stop offset="1" stopColor="#B6E7CD"/></linearGradient>
      <linearGradient id="hc-h2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A9E4C6"/><stop offset="1" stopColor="#7FD3AA"/></linearGradient>
      <linearGradient id="hc-h3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6FCB9D"/><stop offset="1" stopColor="#4DB585"/></linearGradient>
    </defs>
    <path d="M0 150 L90 96 L140 120 L240 52 L320 112 L400 84 L470 130 L560 168 L560 190 L0 190 Z" fill="url(#hc-far)"/>
    <path d="M640 170 L720 136 L820 70 L880 108 L970 46 L1070 116 L1140 88 L1200 116 L1200 190 L640 190 Z" fill="url(#hc-far)"/>
    <path d="M240 52 L266 72 L253 74 L240 64 L228 76 L216 71 Z M970 46 L996 66 L983 68 L970 58 L958 70 L946 65 Z" fill="#fff" opacity=".9"/>
    <path d="M0 176 C170 130 320 154 470 168 C640 184 760 136 930 144 C1060 150 1140 168 1200 160 V300 H0 Z" fill="url(#hc-h1)"/>
    <path d="M0 222 C200 182 380 214 600 206 C820 198 990 172 1200 202 V300 H0 Z" fill="url(#hc-h2)"/>
    <path d="M0 264 C250 240 500 256 720 252 C920 248 1090 240 1200 256 V300 H0 Z" fill="url(#hc-h3)"/>
    <g transform="translate(1080 176)">
      <ellipse cx="0" cy="22" rx="30" ry="4" fill="#0B1030" opacity=".08"/>
      <path d="M-26 6 H26 V21 H-26 Z" fill="#fff"/><path d="M-30 7 Q0 -16 30 7 Z" fill="#F6F4EF"/><path d="M-30 7 Q0 -16 30 7" stroke="#FF6B57" strokeWidth="2.4"/>
      <path d="M-26 12 H26" stroke="#FF6B57" strokeWidth="2"/><rect x="-5" y="11" width="10" height="10" rx="1.5" fill="#FF6B57"/><circle cx="0" cy="-9" r="2.4" fill="#0B1030"/>
    </g>
  </svg>;
}

/** Score guides labelled at their left end, and the climbing line: the set's math layer. */
function Chart() {
  const ticks = [[700, 360], [600, 480], [500, 600]] as const;
  return <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
    {ticks.map(([label, y]) => <g key={label}>
      <path d={`M${y < 540 ? 700 : 110} ${y} H1180`} stroke={PERI} strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round"/>
      <text x={y < 540 ? 692 : 102} y={y + 4} textAnchor="end" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" fill="#8A90A2">{label}</text>
    </g>)}
    <path d={CURVE} stroke="#fff" strokeWidth="14" strokeLinecap="round" opacity=".9"/>
    <path className="rd-climb" data-rv-sq d={CURVE} stroke={BLUE} strokeWidth="5" strokeLinecap="round" pathLength={1}/>
  </svg>;
}

function Dot({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  return <div className="absolute" style={{ left: x - 11, top: y - 11 }}><div className="h-[22px] w-[22px] rounded-full border-[5px] bg-white shadow-[0_4px_10px_-2px_rgba(11,16,48,.25)]" style={{ borderColor: color, ...d(delay) }} data-pop/></div>;
}

/** The 1200×760 scene: the score climbs over the steppe from today to exam day; each friend holds one milestone. */
function ClimbStage() {
  return <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, scale: "var(--hc-s)" } as CSSProperties}>
    <Steppe/>
    <Chart/>
    <span className="absolute rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#5B6275] shadow-[0_6px_16px_-8px_rgba(11,16,48,.3)]" style={{ left: 40, top: 724 }}>Өнөөдөр</span>

    {milestones.map((m, i) => {
      const [x, y] = P[i + 1];
      const delay = 0.5 + i * 0.32;
      const top = m.above ? y - 128 : y + 30;
      return <div key={m.n}>
        <Dot x={x} y={y} color={m.accent} delay={delay}/>
        <div className="absolute w-[190px]" style={{ left: x - 95, top }}>
          <div className="relative rounded-[18px] border-2 border-[#EEF0F6] bg-white px-3.5 pb-3 pt-3 shadow-[0_18px_40px_-20px_rgba(11,16,48,.35)]" data-pop style={d(delay + 0.08)}>
            <p className="flex items-center gap-2 text-[11px] font-bold" style={{ color: m.accent }}><span className="rounded-md px-1.5 py-0.5" style={{ background: m.tint }}>{m.n}</span>алхам</p>
            <p className="mt-1.5 text-[15px] font-semibold leading-tight">{m.title}</p>
            <p className="mt-1 text-xs text-[#5B6275]">{m.meta}</p>
          </div>
          <div className={`absolute ${m.above ? "-top-[54px] right-3" : "-top-[52px] left-3"}`}><div data-pop data-float style={{ ...d(delay + 0.18), animationDelay: `${-0.9 * i}s` }}><Art name={m.friend} size={62}/></div></div>
        </div>
      </div>;
    })}

    {/* summit: exam day */}
    <Dot x={P[5][0]} y={P[5][1]} color={BLUE} delay={1.8}/>
    <div className="absolute" style={{ left: P[5][0] - 65, top: P[5][1] - 134 }}><div data-pop data-float style={d(1.9)}><Ezi pose="celebrate" size={130} priority/></div></div>
    <span className="absolute inline-flex items-center gap-1.5 rounded-full bg-[#0B1030] px-3 py-1 text-xs font-semibold text-white" style={{ left: P[5][0] - 50, top: P[5][1] + 18 }} data-pop><Flag size={12}/>ЭЕШ өдөр</span>
    <div className="absolute w-[160px] rounded-[18px] border-2 border-[#EEF0F6] bg-white px-4 py-3 shadow-[0_18px_40px_-20px_rgba(11,16,48,.35)]" style={{ left: 1030, top: P[5][1] + 52 }} data-pop>
      <p className="text-xs font-medium text-[#5B6275]">Таамагласан оноо</p>
      <p className="rd-display flex items-center gap-2 text-[30px] leading-tight">742<span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#ECFBF4] text-[#1FA97A]"><ArrowUp size={14} strokeWidth={3}/></span></p>
      <p className="text-xs font-semibold text-[#1FA97A]">+222 оноо</p>
    </div>
  </div>;
}

/** Phones: the same climb as a vertical path, read bottom-up like the score rising. */
function PhoneClimb() {
  return <div className="relative mt-8 overflow-hidden rounded-[26px] border-2 border-[#EEF0F6] bg-white p-4 shadow-[0_24px_50px_-28px_rgba(11,16,48,.35)] sm:hidden">
    <div className="flex items-center gap-3 rounded-[18px] bg-[#EEF1FF] p-3">
      <Ezi pose="celebrate" size={64}/>
      <div><p className="text-xs font-medium text-[#5B6275]">ЭЕШ өдөр · таамагласан оноо</p><p className="rd-display flex items-baseline gap-2 text-[28px] leading-tight">742<span className="text-xs font-semibold text-[#1FA97A]">↑ +222</span></p></div>
    </div>
    <ol className="relative mt-3 flex flex-col-reverse gap-2 pl-7">
      <i className="absolute bottom-4 left-[10px] top-2 w-[3px] rounded-full bg-gradient-to-t from-[#C9D4FF] to-[#2B4BE8]" aria-hidden/>
      {milestones.map((m) => <li key={m.n} className="relative flex items-center gap-3 rounded-[14px] px-2 py-2" style={{ background: m.tint }}>
        <span className="absolute -left-[25px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full border-[4px] bg-white" style={{ borderColor: m.accent }} aria-hidden/>
        <Art name={m.friend} size={40}/>
        <div className="min-w-0"><p className="text-[11px] font-bold" style={{ color: m.accent }}>{m.n} алхам</p><p className="text-sm font-semibold leading-tight">{m.title}</p><p className="text-xs text-[#5B6275]">{m.meta}</p></div>
      </li>)}
    </ol>
    <p className="mt-2 pl-7 text-xs font-semibold text-[#8A90A2]">Өнөөдөр</p>
  </div>;
}

/** Scaled stage from 640px. From 1280px the hero copy is laid over its empty upper-left; narrower screens stack the copy
 *  above it, and phones get the vertical PhoneClimb instead. */
export function HeroClimb() {
  return <>
    <PhoneClimb/>
    <div className="rd-climb-wrap relative mt-8 hidden sm:block xl:mt-0" role="img" aria-label="Оношлох сорилоос эхлээд ЭЕШ өдөр хүртэл оноо өсөх зам: оношлох сорил, хувийн төлөвлөгөө, сул сэдвээ давтах, бүтэн mock шалгалт, таамагласан оноо 742">
      <div className="relative mx-auto" style={{ width: "calc(1200px * var(--hc-s))", height: "calc(760px * var(--hc-s))" }}><ClimbStage/></div>
    </div>
  </>;
}
