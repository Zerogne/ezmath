import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

/** Files in public/illustrations, drawn from the EzMath illustration set (sources in design/illustrations). */
export type ArtName =
  | "ezi-wave" | "ezi-point" | "ezi-celebrate"
  | "cast-temuulen-wave" | "cast-saraa-cheer" | "cast-anujin-book" | "cast-anujin-think" | "cast-anujin-cheer" | "cast-bat-wave"
  | "buddy-triangle";

export type ObjectKind = "notebook" | "timer" | "chart" | "calculator" | "target" | "books" | "bulb" | "flame" | "pencil" | "gradcap" | "setsquare" | "medal";

export function Art({ name, width, height, className, style, priority }: { name: ArtName; width: number; height: number; className?: string; style?: CSSProperties; priority?: boolean }) {
  return <Image src={`/illustrations/${name}.svg`} width={width} height={height} alt="" aria-hidden draggable={false} priority={priority} className={className} style={style}/>;
}

/** Character sizes keep each drawing's own aspect ratio: cast 200×240, Эзи 160×160. */
export const castSize = (height: number) => ({ width: Math.round(height * 200 / 240), height });

export function Ezi({ pose = "wave", size, className }: { pose?: "wave" | "point" | "celebrate"; size: number; className?: string }) {
  return <Art name={`ezi-${pose}`} width={size} height={size} className={className}/>;
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

const steppeCast: { name: ArtName; x: number; y: number; w: number; h: number }[] = [
  { name: "cast-temuulen-wave", x: 200, y: 110, w: 124, h: 149 },
  { name: "cast-saraa-cheer", x: 330, y: 150, w: 116, h: 139 },
  { name: "ezi-celebrate", x: 560, y: 214, w: 96, h: 96 },
  { name: "cast-bat-wave", x: 990, y: 128, w: 120, h: 144 },
  { name: "cast-anujin-cheer", x: 1110, y: 150, w: 116, h: 139 },
  { name: "buddy-triangle", x: 1250, y: 222, w: 74, h: 74 },
];

/** Mongolian steppe with a ger; layers carry parallax classes and the cast pops up and bobs. */
export function SteppeScene() {
  return <svg className="rd-land" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" fill="none" aria-hidden>
    <g className="rd-p-mtn">
      <path d="M0 170 L120 96 L190 140 L300 60 L400 128 L470 92 L560 150 L0 190 Z" fill="#A9C4F5"/>
      <path d="M300 60 L332 82 L318 84 L300 72 L286 86 L270 82 Z" fill="#fff"/>
      <path d="M880 160 L990 70 L1060 120 L1160 50 L1280 132 L1360 96 L1440 140 L1440 190 L860 190 Z" fill="#A9C4F5"/>
      <path d="M1160 50 L1190 72 L1176 74 L1160 62 L1146 76 L1130 70 Z" fill="#fff"/>
    </g>
    <path className="rd-p-h1" d="M0 200 C200 140 380 170 560 190 C760 212 900 150 1100 160 C1260 168 1360 190 1440 180 L1440 360 L0 360 Z" fill="#9BE2B6"/>
    <path className="rd-p-h2" d="M0 260 C240 210 460 250 720 240 C980 230 1180 200 1440 236 L1440 360 L0 360 Z" fill="#6FD39A"/>
    <path className="rd-p-h3" d="M0 310 C300 280 600 300 860 296 C1100 292 1300 280 1440 300 L1440 360 L0 360 Z" fill="#4CBF83"/>
    <g className="rd-p-ger"><image href="/illustrations/object-ger.svg" x="748" y="112" width="144" height="144"/></g>
    {steppeCast.map((c, i) => <g key={c.name} className="rd-p-mascot" data-pop data-float style={{ "--d": `${0.2 + i * 0.1}s`, animationDelay: `${-0.6 * i}s` } as CSSProperties}>
      <image href={`/illustrations/${c.name}.svg`} x={c.x} y={c.y} width={c.w} height={c.h}/>
    </g>)}
  </svg>;
}
