import Link from "next/link";
import { Flame, Trophy } from "lucide-react";
import type { Leaderboard, LeaderboardRow } from "@/lib/data/leaderboard";

const card = "rounded-[22px] border-2 border-[#EEF0F6] bg-white";
const MEDALS = ["#F5B700", "#A7AFC2", "#CD7F32"];

/** Top rows plus the viewer's own row when they fall below the cut. */
function visibleRows(rows: LeaderboardRow[], limit: number) {
  const top = rows.slice(0, limit);
  const me = rows.find((row) => row.isMe);
  return { top, me: me && !top.includes(me) ? me : null };
}

export function LeaderboardTable({ rows, limit = rows.length, showStreak = true }: { rows: LeaderboardRow[]; limit?: number; showStreak?: boolean }) {
  const { top, me } = visibleRows(rows, limit);
  return <ol className="divide-y-2 divide-[#F4F5FA]">
    {top.map((row) => <Row key={row.studentId} row={row} showStreak={showStreak}/>)}
    {me && <><li aria-hidden className="py-1 text-center text-xs text-[#9AA0B4]">⋯</li><Row row={me} showStreak={showStreak}/></>}
  </ol>;
}

function Row({ row, showStreak }: { row: LeaderboardRow; showStreak: boolean }) {
  const medal = row.correct > 0 ? MEDALS[row.rank - 1] : undefined;
  return <li className={`flex items-center gap-3 px-2 py-2.5 ${row.isMe ? "rounded-xl bg-[#E8EEFF]" : ""}`}>
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold" style={medal ? { background: medal, color: "#fff" } : { background: "#F4F5FA", color: "#5B6275" }}>{row.rank}</span>
    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{row.name}{row.isMe && <span className="ml-1.5 text-xs font-medium text-[#2B4BE8]">(та)</span>}</span>
    {showStreak && row.streak > 0 && <span className="hidden items-center gap-0.5 text-xs font-semibold text-[#EA580C] sm:inline-flex" title={`${row.streak} хоног дараалан`}><Flame size={13}/>{row.streak}</span>}
    <span className="w-16 text-right"><b className="text-sm">{row.correct}</b><span className="block text-[11px] leading-3 text-[#9AA0B4]">зөв / {row.problems}</span></span>
  </li>;
}

/** Dashboard card: the student's first class, top 5 and their own place. Full lists live on /dashboard/classes. */
export function LeaderboardCard({ boards }: { boards: Leaderboard[] }) {
  const board = boards[0];
  if (!board) return null;
  const me = board.rows.find((row) => row.isMe);
  return <section className={`${card} p-5 sm:p-[22px]`}>
    <div className="flex items-center justify-between gap-3"><h2 className="inline-flex items-center gap-2 font-sans text-base font-semibold tracking-normal"><Trophy size={18} className="text-[#F5B700]"/>Энэ 7 хоногийн шилдэг</h2><Link href="/dashboard/classes" className="text-[13px] font-semibold text-[#2B4BE8]">Бүгд →</Link></div>
    <p className="mt-1 truncate text-[13px] text-[#5B6275]">{board.title}{me ? ` · Та ${me.rank}-р байр` : ""}</p>
    <div className="mt-3"><LeaderboardTable rows={board.rows} limit={5} showStreak={false}/></div>
  </section>;
}
