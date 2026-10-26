import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

/** Files in public/illustrations, drawn from the Эзи mascot set (sources in design/illustrations-v2). */
export type EziPose = "idle" | "happy" | "wave" | "point" | "think" | "celebrate" | "read" | "laptop" | "sleep" | "oops" | "streak" | "trophy";
export type ArtName = `ezi-${EziPose}` | "friend-mint" | "friend-coral" | "friend-violet" | "friend-sun";

export type ObjectKind = "graph" | "notebook" | "chart" | "calculator" | "target" | "bulb" | "stopwatch" | "flame" | "pencil" | "gradcap" | "laptop" | "protractor" | "scorecard";

export function Art({ name, size, className, style, priority }: { name: ArtName; size: number; className?: string; style?: CSSProperties; priority?: boolean }) {
  return <Image src={`/illustrations/${name}.svg`} width={size} height={size} alt="" aria-hidden draggable={false} priority={priority} className={className} style={style}/>;
}

export function Ezi({ pose = "idle", size, className, priority }: { pose?: EziPose; size: number; className?: string; priority?: boolean }) {
  return <Art name={`ezi-${pose}`} size={size} className={className} priority={priority}/>;
}

export function ObjectArt({ kind, size = 84 }: { kind: ObjectKind; size?: number }) {
  return <Image src={`/illustrations/object-${kind}.svg`} width={size} height={size} alt="" aria-hidden draggable={false}/>;
}

/** Hand-drawn underline that draws itself in when its heading scrolls into view. */
export function Squiggle({ children }: { children: ReactNode }) {
  return <span className="rd-sq" data-rv-sq>{children}<svg className="rd-sq-line" viewBox="0 0 240 14" preserveAspectRatio="none" fill="none" aria-hidden><path d="M3 9 C 40 3, 70 12, 110 7 S 180 3, 237 8" stroke="#2B4BE8" strokeWidth="5" strokeLinecap="round" pathLength={1}/></svg></span>;
}

export function Cloud({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={className} style={style} aria-hidden><svg viewBox="0 0 260 120" fill="none" className="h-auto w-full"><path d="M40 110 C14 110 4 92 10 76 C16 60 34 56 44 60 C46 36 66 20 92 24 C108 6 142 4 160 22 C180 12 210 20 214 46 C240 46 256 66 250 86 C246 102 232 110 216 110 Z" fill="#fff"/></svg></div>;
}

/** Square 200×200 drawings, placed so each one's shadow sits on the top edge of its card. */
const crew: { name: ArtName; x: number; y: number; size: number }[] = [
  { name: "friend-mint", x: 150, y: 117, size: 110 },
  { name: "friend-coral", x: 300, y: 130, size: 96 },
  { name: "ezi-wave", x: 635, y: 97, size: 170 },
  { name: "friend-violet", x: 1050, y: 121, size: 110 },
  { name: "friend-sun", x: 1190, y: 135, size: 94 },
];

const card = "h-full rounded-[22px] border-2 border-[#EEF0F6] bg-white p-4 text-[#0B1030] shadow-[0_24px_50px_-24px_rgba(11,16,48,.35)]";

/** Closing scene built from the product itself: a practice question, the predicted score and the streak,
 *  floating as cards that Эзи's crew stands on. Layers carry parallax classes; the crew pops up and bobs. */
export function ProductScene() {
  return <svg className="rd-land" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" fill="none" aria-hidden>
    <g className="rd-p-mtn" opacity=".75">
      <circle cx="470" cy="150" r="70" stroke="#fff" strokeWidth="1.5" strokeDasharray="4 7"/>
      <circle cx="980" cy="130" r="90" stroke="#fff" strokeWidth="1.5" strokeDasharray="4 7"/>
      {[["∑ n = n(n+1)/2", 40, 120], ["sin 30° = ½", 900, 40], ["SAT 1490", 1300, 110], ["x² − 4x + 3 = 0", 440, 30]].map(([label, x, y]) => <foreignObject key={label} x={x} y={y} width="190" height="40"><div className="inline-block rounded-full bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-[#2B4BE8]">{label}</div></foreignObject>)}
    </g>
    <g className="rd-p-h1"><foreignObject x="110" y="196" width="320" height="200"><div className={card}>
      <div className="flex items-center gap-2 text-[11px] font-semibold"><span className="rounded-md bg-[#E8EEFF] px-[7px] py-[3px] text-[#2B4BE8]">ЭЕШ 2019</span><span className="text-[#5B6275]">Бодлого 14</span></div>
      <p className="rd-serif mt-2.5 text-[15px]">log<sub>2</sub>(x + 3) = 3 бол x = ?</p>
      <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[13px]">{[["A", "3"], ["B", "5"], ["C", "6"], ["D", "8"]].map(([letter, value]) => <span key={letter} className={`flex items-center gap-2 rounded-lg border-2 px-2 py-1 ${letter === "B" ? "border-[#22C55E] bg-[#F0FDF4]" : "border-[#E4E7F0]"}`}><b className="text-[11px]">{letter}</b>{value}</span>)}</div>
    </div></foreignObject></g>
    <g className="rd-p-h2"><foreignObject x="560" y="230" width="320" height="170"><div className={card}>
      <p className="text-xs font-medium text-[#5B6275]">Таамагласан ЭЕШ оноо</p>
      <p className="rd-display mt-0.5 flex items-baseline gap-2 text-[36px] leading-tight">742<span className="text-[13px] font-semibold text-[#16A34A]">↑ +86 оноо</span></p>
      <div className="mt-2 h-2 rounded-full bg-[#EEF0F6]"><i className="block h-full w-[74%] rounded-full bg-[#2B4BE8]"/></div>
    </div></foreignObject></g>
    <g className="rd-p-h3"><foreignObject x="1010" y="200" width="320" height="200"><div className={card}>
      <div className="flex items-center justify-between"><p className="text-[13px] font-semibold">Өдрийн цуврал</p><span className="flex items-center gap-1 text-[13px] font-semibold text-[#E2523F]"><Image src="/illustrations/object-flame.svg" width={22} height={22} alt=""/>12 өдөр</span></div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">{Array.from({ length: 14 }, (_, i) => <i key={i} className={`h-6 rounded-md ${i < 12 ? "bg-[#2B4BE8]" : "bg-[#EEF0F6]"}`}/>)}</div>
    </div></foreignObject></g>
    {crew.map((c, i) => <g key={c.name} className="rd-p-mascot" data-pop data-float style={{ "--d": `${0.2 + i * 0.1}s`, animationDelay: `${-0.6 * i}s` } as CSSProperties}>
      <image href={`/illustrations/${c.name}.svg`} x={c.x} y={c.y} width={c.size} height={c.size}/>
    </g>)}
  </svg>;
}
