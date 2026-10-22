import type { ReactNode } from "react";

type MascotProps = { body?: string; shade?: string; size?: number; cap?: boolean; wave?: boolean; className?: string };

export function Mascot({ body = "#4C6FFF", shade = "#2B4BE8", size = 120, cap = false, wave = false, className }: MascotProps) {
  return <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden className={className}>
    <ellipse cx="60" cy="112" rx="34" ry="5" fill="#0B1030" opacity=".08"/>
    <ellipse cx="44" cy="106" rx="11" ry="7" fill={shade}/><ellipse cx="76" cy="106" rx="11" ry="7" fill={shade}/>
    <ellipse cx="14" cy="74" rx="8" ry="11" fill={shade}/>
    {wave ? <path d="M104 62 C114 52 118 44 116 36" stroke={shade} strokeWidth="10" strokeLinecap="round"/> : <ellipse cx="106" cy="74" rx="8" ry="11" fill={shade}/>}
    <path d="M60 22 C86 22 106 40 106 68 C106 92 88 106 60 106 C32 106 14 92 14 68 C14 40 34 22 60 22 Z" fill={body}/>
    <path d="M22 80 C30 98 46 104 60 104 C76 104 94 98 100 80 C92 94 76 98 60 98 C44 98 30 94 22 80 Z" fill={shade} opacity=".55"/>
    <ellipse cx="40" cy="44" rx="10" ry="6" fill="#fff" opacity=".35" transform="rotate(-25 40 44)"/>
    <ellipse cx="45" cy="63" rx="9" ry="10.5" fill="#fff"/><ellipse cx="75" cy="63" rx="9" ry="10.5" fill="#fff"/>
    <circle cx="47" cy="65" r="5.2" fill="#0B1030"/><circle cx="77" cy="65" r="5.2" fill="#0B1030"/>
    <circle cx="49" cy="62.5" r="1.8" fill="#fff"/><circle cx="79" cy="62.5" r="1.8" fill="#fff"/>
    <ellipse cx="34" cy="78" rx="6" ry="3.5" fill="#FF8FB8" opacity=".75"/><ellipse cx="86" cy="78" rx="6" ry="3.5" fill="#FF8FB8" opacity=".75"/>
    <path d="M54 79 C57 83 63 83 66 79" stroke="#0B1030" strokeWidth="2.6" strokeLinecap="round"/>
    {cap && <>
      <path d="M34 22 L60 10 L86 22 L60 34 Z" fill="#0B1030"/>
      <path d="M44 27 L44 36 C52 41 68 41 76 36 L76 27 L60 34 Z" fill="#1A2150"/>
      <path d="M86 22 L86 36" stroke="#FFD43B" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="86" cy="38" r="3.5" fill="#FFD43B"/>
    </>}
  </svg>;
}

export const mascotColors = {
  blue: { body: "#4C6FFF", shade: "#2B4BE8" },
  yellow: { body: "#FFD43B", shade: "#E0A800" },
  pink: { body: "#FF8FB8", shade: "#E85D93" },
  green: { body: "#34D399", shade: "#16A34A" },
} as const;

export type TileKind = "notebook" | "stopwatch" | "chart" | "triangle" | "flame" | "target" | "book" | "calc" | "school" | "pdf" | "formula" | "mistake";

const tileArt: Record<TileKind, ReactNode> = {
  notebook: <><rect x="16" y="10" width="46" height="60" rx="8" fill="#4C6FFF"/><rect x="22" y="10" width="40" height="60" rx="6" fill="#DCE5FF"/><path d="M51 26 H33 L43 38 L33 50 H51" stroke="#2B4BE8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="22" r="3" fill="#0B1030"/><circle cx="16" cy="40" r="3" fill="#0B1030"/><circle cx="16" cy="58" r="3" fill="#0B1030"/></>,
  stopwatch: <><rect x="34" y="6" width="12" height="8" rx="3" fill="#E0A800"/><circle cx="40" cy="44" r="28" fill="#FFD43B"/><circle cx="40" cy="44" r="21" fill="#FFF6CC"/><path d="M40 44 L40 29" stroke="#0B1030" strokeWidth="4" strokeLinecap="round"/><path d="M40 44 L50 50" stroke="#0B1030" strokeWidth="4" strokeLinecap="round"/><circle cx="40" cy="44" r="3.5" fill="#0B1030"/></>,
  chart: <><rect x="10" y="10" width="60" height="60" rx="12" fill="#FFE4EF"/><rect x="18" y="42" width="10" height="20" rx="3" fill="#FF6FA8"/><rect x="35" y="30" width="10" height="32" rx="3" fill="#FF6FA8"/><rect x="52" y="18" width="10" height="44" rx="3" fill="#E0457F"/><path d="M18 34 L38 22 L56 12" stroke="#0B1030" strokeWidth="3" strokeLinecap="round"/></>,
  triangle: <><path d="M12 66 L12 14 L66 66 Z" fill="#22C55E"/><path d="M22 56 L22 38 L40 56 Z" fill="#DCFCE7"/><path d="M12 24 h8 M12 34 h6 M12 44 h8 M22 66 v-8 M32 66 v-6 M42 66 v-8" stroke="#0B1030" strokeWidth="2.5" strokeLinecap="round"/></>,
  flame: <><path d="M40 8 C46 22 62 30 62 50 C62 64 52 72 40 72 C28 72 18 64 18 50 C18 38 26 32 28 22 C32 30 36 32 38 32 C38 22 36 14 40 8 Z" fill="#FF8A3D"/><path d="M40 38 C44 46 52 50 52 58 C52 66 46 70 40 70 C34 70 28 66 28 58 C28 52 34 48 40 38 Z" fill="#FFD43B"/></>,
  target: <><circle cx="40" cy="40" r="30" fill="#EFE6FF"/><circle cx="40" cy="40" r="21" fill="#8B5CF6"/><circle cx="40" cy="40" r="12" fill="#EFE6FF"/><circle cx="40" cy="40" r="5" fill="#8B5CF6"/><path d="M40 40 L64 16" stroke="#0B1030" strokeWidth="4" strokeLinecap="round"/><path d="M58 12 L66 14 L68 22" stroke="#0B1030" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></>,
  book: <><path d="M10 18 C22 12 32 14 40 20 C48 14 58 12 70 18 V64 C58 58 48 60 40 66 C32 60 22 58 10 64 Z" fill="#8B5CF6"/><path d="M14 20 C24 16 32 18 38 22 V60 C32 56 24 56 14 58 Z" fill="#EFE6FF"/><path d="M42 22 C48 18 56 16 66 20 V58 C56 56 48 56 42 60 Z" fill="#F7F2FF"/><path d="M20 30 h12 M20 38 h12 M48 30 h12 M48 38 h10" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"/></>,
  calc: <><rect x="16" y="8" width="48" height="64" rx="10" fill="#0B1030"/><rect x="22" y="14" width="36" height="14" rx="4" fill="#8FF0C0"/><g fill="#fff"><rect x="22" y="34" width="9" height="9" rx="2.5"/><rect x="35.5" y="34" width="9" height="9" rx="2.5"/><rect x="22" y="47" width="9" height="9" rx="2.5"/><rect x="35.5" y="47" width="9" height="9" rx="2.5"/><rect x="22" y="60" width="9" height="7" rx="2.5"/><rect x="35.5" y="60" width="9" height="7" rx="2.5"/></g><rect x="49" y="34" width="9" height="33" rx="2.5" fill="#FFD43B"/></>,
  school: <><path d="M40 8 L70 26 L10 26 Z" fill="#2B4BE8"/><rect x="14" y="26" width="52" height="40" rx="3" fill="#DCE5FF"/><rect x="34" y="46" width="12" height="20" rx="2" fill="#2B4BE8"/><rect x="20" y="34" width="9" height="9" rx="2" fill="#4C6FFF"/><rect x="51" y="34" width="9" height="9" rx="2" fill="#4C6FFF"/><rect x="8" y="64" width="64" height="6" rx="3" fill="#0B1030"/></>,
  pdf: <><path d="M18 8 H50 L64 22 V72 H18 Z" fill="#fff" stroke="#0B1030" strokeWidth="3" strokeLinejoin="round"/><path d="M50 8 V22 H64" fill="#DCE5FF" stroke="#0B1030" strokeWidth="3" strokeLinejoin="round"/><rect x="12" y="40" width="40" height="18" rx="5" fill="#FF5A5A"/><text x="32" y="53" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="11" fill="#fff" textAnchor="middle">PDF</text></>,
  formula: <><rect x="8" y="12" width="64" height="56" rx="12" fill="#FFF6CC"/><text x="40" y="49" fontFamily="Georgia, serif" fontStyle="italic" fontSize="24" fill="#0B1030" textAnchor="middle">f(x)</text><path d="M18 58 h44" stroke="#E0A800" strokeWidth="3" strokeLinecap="round"/></>,
  mistake: <><rect x="10" y="10" width="60" height="60" rx="14" fill="#FFE4E4"/><path d="M28 28 L52 52 M52 28 L28 52" stroke="#FF5A5A" strokeWidth="7" strokeLinecap="round"/></>,
};

export function TileArt({ kind, size = 72 }: { kind: TileKind; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden>{tileArt[kind]}</svg>;
}

/** Hand-drawn underline that draws itself in when its heading scrolls into view. */
export function Squiggle({ children }: { children: ReactNode }) {
  return <span className="rd-sq" data-rv-sq>{children}<svg className="rd-sq-line" viewBox="0 0 240 14" preserveAspectRatio="none" fill="none" aria-hidden><path d="M3 9 C 40 3, 70 12, 110 7 S 180 3, 237 8" stroke="#2B4BE8" strokeWidth="5" strokeLinecap="round" pathLength={1}/></svg></span>;
}

export function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={className} style={style} aria-hidden><svg viewBox="0 0 260 120" fill="none" className="h-auto w-full"><path d="M40 110 C14 110 4 92 10 76 C16 60 34 56 44 60 C46 36 66 20 92 24 C108 6 142 4 160 22 C180 12 210 20 214 46 C240 46 256 66 250 86 C246 102 232 110 216 110 Z" fill="#fff"/></svg></div>;
}

const steppeMascots = [
  { x: 250, y: 196, size: 110, color: mascotColors.blue, cap: true, wave: true },
  { x: 1010, y: 214, size: 92, color: mascotColors.yellow },
  { x: 1130, y: 236, size: 74, color: mascotColors.pink },
  { x: 560, y: 250, size: 64, color: mascotColors.green },
];

/** Mongolian steppe with a ger; layers carry parallax classes and the mascots pop up and bob. */
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
    <g className="rd-p-ger"><g transform="translate(760 168)">
      <path d="M0 52 L0 30 C0 30 30 6 60 6 C90 6 120 30 120 30 L120 52 Z" fill="#fff"/>
      <path d="M0 30 C0 30 30 6 60 6 C90 6 120 30 120 30" stroke="#E0A800" strokeWidth="4"/>
      <path d="M20 22 C40 12 80 12 100 22" stroke="#FF6FA8" strokeWidth="3" strokeDasharray="6 5"/>
      <path d="M48 52 L48 30 L72 30 L72 52 Z" fill="#E85D3D"/>
      <path d="M54 4 L60 -6 L66 4 Z" fill="#E0A800"/>
      <rect x="0" y="40" width="120" height="4" fill="#E0A800" opacity=".6"/>
    </g></g>
    {steppeMascots.map((m, i) => <g key={i} className="rd-p-mascot" data-pop data-float style={{ "--d": `${0.2 + i * 0.12}s`, animationDelay: `${-0.7 * i}s` } as React.CSSProperties}>
      <g transform={`translate(${m.x} ${m.y})`}><Mascot body={m.color.body} shade={m.color.shade} size={m.size} cap={"cap" in m && m.cap} wave={"wave" in m && m.wave}/></g>
    </g>)}
  </svg>;
}
