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
export function Squiggle({ children, color = "#2B4BE8" }: { children: ReactNode; color?: string }) {
  return <span className="rd-sq" data-rv-sq>{children}<svg className="rd-sq-line" viewBox="0 0 240 14" preserveAspectRatio="none" fill="none" aria-hidden><path d="M3 9 C 40 3, 70 12, 110 7 S 180 3, 237 8" stroke={color} strokeWidth="5" strokeLinecap="round" pathLength={1}/></svg></span>;
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

const card = "absolute rounded-[22px] border-2 border-[#EEF0F6] bg-white p-4 text-[#0B1030] shadow-[0_24px_50px_-24px_rgba(11,16,48,.35)]";
const chips: [string, number, number][] = [["∑ n = n(n+1)/2", 40, 120], ["sin 30° = ½", 900, 40], ["SAT 1490", 1300, 110], ["x² − 4x + 3 = 0", 440, 30]];

/** Closing scene built from the product itself: a practice question, the predicted score and the streak,
 *  floating as cards that Эзи's crew stands on. Plain positioned HTML on a 1440×360 stage centred at the
 *  bottom (phones see the middle: the score card and Эзи). Layers carry parallax classes; the crew pops up and bobs. */
export function ProductScene() {
  return <div className="rd-land" aria-hidden><div className="absolute bottom-0 left-1/2 h-[360px] w-[1440px] -translate-x-1/2">
    <div className="rd-p-mtn absolute inset-0 opacity-75">
      <i className="absolute left-[400px] top-[80px] h-[140px] w-[140px] rounded-full border-[1.5px] border-dashed border-white"/>
      <i className="absolute left-[890px] top-[40px] h-[180px] w-[180px] rounded-full border-[1.5px] border-dashed border-white"/>
      {chips.map(([label, x, y]) => <span key={label} className="absolute whitespace-nowrap rounded-full bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-[#2B4BE8]" style={{ left: x, top: y }}>{label}</span>)}
    </div>
    <div className={`rd-p-h1 ${card} left-[110px] top-[196px] h-[200px] w-[320px]`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold"><span className="rounded-md bg-[#E8EEFF] px-[7px] py-[3px] text-[#2B4BE8]">ЭЕШ 2019</span><span className="text-[#5B6275]">Бодлого 14</span></div>
      <p className="rd-serif mt-2.5 text-[15px]">log<sub>2</sub>(x + 3) = 3 бол x = ?</p>
      <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[13px]">{[["A", "3"], ["B", "5"], ["C", "6"], ["D", "8"]].map(([letter, value]) => <span key={letter} className={`flex items-center gap-2 rounded-lg border-2 px-2 py-1 ${letter === "B" ? "border-[#22C55E] bg-[#F0FDF4]" : "border-[#E4E7F0]"}`}><b className="text-[11px]">{letter}</b>{value}</span>)}</div>
    </div>
    <div className={`rd-p-h2 ${card} left-[560px] top-[230px] h-[170px] w-[320px]`}>
      <p className="text-xs font-medium text-[#5B6275]">Таамагласан ЭЕШ оноо</p>
      <p className="rd-display mt-0.5 flex items-baseline gap-2 text-[36px] leading-tight">742<span className="text-[13px] font-semibold text-[#16A34A]">↑ +86 оноо</span></p>
      <div className="mt-2 h-2 rounded-full bg-[#EEF0F6]"><i className="block h-full w-[74%] rounded-full bg-[#2B4BE8]"/></div>
    </div>
    <div className={`rd-p-h3 ${card} left-[1010px] top-[200px] h-[200px] w-[320px]`}>
      <div className="flex items-center justify-between"><p className="text-[13px] font-semibold">Өдрийн цуврал</p><span className="flex items-center gap-1 text-[13px] font-semibold text-[#E2523F]"><Image src="/illustrations/object-flame.svg" width={22} height={22} alt=""/>12 өдөр</span></div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">{Array.from({ length: 14 }, (_, i) => <i key={i} className={`h-6 rounded-md ${i < 12 ? "bg-[#2B4BE8]" : "bg-[#EEF0F6]"}`}/>)}</div>
    </div>
    {crew.map((c, i) => <div key={c.name} className="rd-p-mascot absolute" data-pop data-float style={{ left: c.x, top: c.y, "--d": `${0.2 + i * 0.1}s`, animationDelay: `${-0.6 * i}s` } as CSSProperties}>
      <Art name={c.name} size={c.size}/>
    </div>)}
  </div></div>;
}
