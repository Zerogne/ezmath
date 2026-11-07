import { planName } from "@/lib/payments/plans";
import Link from "next/link";
import { Check, Clock3, Plus, Search, X } from "lucide-react";
import { Art, ObjectArt, type ObjectKind } from "@/components/home/redesign/illustrations";
import type { getAdminDashboardData } from "@/lib/admin/data";
import type { listAdminSchools } from "@/lib/admin/schools";

type Data = Awaited<ReturnType<typeof getAdminDashboardData>>;
type Schools = Awaited<ReturnType<typeof listAdminSchools>>;

const card = "rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 sm:p-[22px]";
const title = "font-sans text-base font-semibold tracking-normal";
const tugrik = (value: number) => `₮${value.toLocaleString("en-US")}`;
const millions = (value: number) => value >= 1_000_000 ? `₮${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : tugrik(value);
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
const AVATAR_TONES = ["#FFE4EF", "#E8EEFF", "#E9FBF2", "#FFF6CC", "#EFE6FF"];

/** Admin dashboard, laid out after the "Admin Dashboard — Desktop" Figma frame. */
export function AdminDashboard({ data, schools }: { data: Data; schools: Schools }) {
  const topSchools = [...schools].sort((a, b) => b.studentCount - a.studentCount).slice(0, 3);
  return <div className="space-y-4">
    <header className="flex flex-wrap items-center gap-4 pb-2">
      <div className="mr-auto"><h1 className="text-[30px] font-medium leading-tight">Dashboard</h1><p className="mt-1 text-[15px] text-[#5B6275]">EzMath платформын бодит мэдээлэл</p></div>
      <form action="/admin/students" className="relative hidden md:block"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA0B4]"/><input name="search" aria-label="Сурагч хайх" placeholder="Сурагч хайх…" className="h-11 w-[260px] rounded-xl border-2 border-[#E3E6EF] bg-white pl-10 pr-3 text-sm placeholder:text-[#9AA0B4] focus:border-[#2B4BE8] focus:outline-none"/></form>
      <span className="hidden h-11 items-center rounded-xl border-2 border-[#E3E6EF] bg-white px-3.5 text-sm font-semibold lg:inline-flex">Сүүлийн 30 хоног</span>
      <Link href="/admin/materials" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0B1030] px-5 text-sm font-semibold text-white hover:bg-[#1A2150]"><Plus size={16}/>Материал нэмэх</Link>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi art="gradcap" tile="#E8EEFF" label="Нийт сурагч" value={data.studentCount.toLocaleString("en-US")} note={`↑ +${data.newThisMonth} энэ сард`} positive={data.newThisMonth > 0}/>
      <Kpi art="calculator" tile="#E9FBF2" label="SAT материал" value={String(data.satMaterials)} note={`${data.satFullMocks} бүрэн mock`}/>
      <Kpi art="notebook" tile="#FFF6CC" label="ЭЕШ материал" value={String(data.eyeshMaterials)} note={data.eyeshYearRange}/>
      <Kpi art="chart" tile="#FFE4EF" label="Төлбөрийн орлого" value={millions(data.paidRevenueMnt)} note={`${data.paidCount} амжилттай төлбөр`}/>
    </section>

    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <SignupChart signups={data.signups}/>
      <RevenueChart months={data.revenueByMonth}/>
    </div>

    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className={card}>
        <div className="flex items-center justify-between"><h2 className={title}>Шинэ сурагчид</h2><Link href="/admin/students" className="text-[13px] font-semibold text-[#2B4BE8]">Бүх сурагчийг харах →</Link></div>
        <div className="mt-3.5 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm">
          <thead><tr className="border-b-2 border-[#F0F1F6] text-xs font-semibold text-[#9AA0B4]">{["Сурагч", "Сургууль", "Багц", "Бүртгүүлсэн"].map((heading) => <th key={heading} className="px-3 pb-2.5 font-semibold">{heading}</th>)}</tr></thead>
          <tbody>{data.recentStudents.length ? data.recentStudents.map((student, index) => <tr key={student.id} className="border-b-2 border-[#F4F5FA] last:border-0">
            <td className="p-3"><Link href={`/admin/students/${student.id}`} className="flex items-center gap-2.5 font-semibold hover:text-[#2B4BE8]"><span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-xs font-semibold" style={{ background: AVATAR_TONES[index % AVATAR_TONES.length] }}>{initials(student.name)}</span><span className="min-w-0"><span className="block truncate">{student.name}</span><span className="block truncate text-xs font-normal text-[#5B6275]">{student.email}</span></span></Link></td>
            <td className="p-3 text-[#5B6275]">{student.school}</td>
            <td className="p-3"><PlanBadge plan={student.plan}/></td>
            <td className="p-3 text-[#5B6275]">{student.joined}</td>
          </tr>) : <tr><td colSpan={4} className="px-3 py-8 text-center text-[#5B6275]">Одоогоор сурагч бүртгэгдээгүй байна.</td></tr>}</tbody>
        </table></div>
      </section>
      <section className={card}>
        <div className="flex items-center justify-between"><h2 className={title}>Сүүлийн төлбөрүүд</h2><Link href="/admin/payments" className="text-[13px] font-semibold text-[#2B4BE8]">Бүгд →</Link></div>
        <div className="mt-2">{data.recentPayments.length ? data.recentPayments.map((payment) => <div key={payment.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b-2 border-[#F4F5FA] py-[13px] last:border-0">
          <p className="truncate text-sm font-semibold">{payment.name}</p><p className="text-right font-display text-[17px] font-medium tracking-[-0.03em]">{tugrik(payment.amountMnt)}</p>
          <p className="truncate text-xs text-[#5B6275]">{payment.plan} · 1 сар · {formatDateTime(payment.at)}</p><PaymentStatus status={payment.status}/>
        </div>) : <p className="py-8 text-center text-sm text-[#5B6275]">Төлбөр хараахан алга.</p>}</div>
      </section>
    </div>

    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      <section className={card}>
        <div className="flex items-center justify-between"><h2 className={title}>Сургуулиуд</h2><Link href="/admin/schools" className="text-[13px] font-semibold text-[#2B4BE8]">Удирдах →</Link></div>
        <div className="mt-2">{topSchools.length ? topSchools.map((school) => <div key={school.id} className="flex items-center gap-3.5 border-b-2 border-[#F4F5FA] py-3.5 last:border-0">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#E8EEFF]"><ObjectArt kind="gradcap" size={34}/></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{school.name}</p><p className="mt-0.5 text-xs text-[#5B6275]">{school.teacherCount} багш · {school.studentCount} сурагч</p></div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${school.is_active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F1F3F8] text-[#5B6275]"}`}>{school.is_active ? "● Идэвхтэй" : "Идэвхгүй"}</span>
        </div>) : <p className="py-8 text-center text-sm text-[#5B6275]">Сургууль бүртгэгдээгүй байна.</p>}</div>
      </section>
      <section className="relative rounded-[22px] border-2 border-[#EEF0F6] bg-[#F7F8FC] p-5 sm:p-[22px]">
        <Art name="friend-mint" size={86} className="absolute -top-10 right-4 hidden sm:block"/>
        <h2 className={title}>Түргэн үйлдэл</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickAction href="/admin/materials/eyesh/new" art="notebook" tile="#E8EEFF" label="ЭЕШ материал нэмэх" text="PDF-ээс тест үүсгэх"/>
          <QuickAction href="/admin/materials/sat/new" art="calculator" tile="#E9FBF2" label="SAT материал нэмэх" text="LaTeX, TikZ импорт"/>
          <QuickAction href="/admin/lessons/new" art="bulb" tile="#EFE6FF" label="Онолын хичээл нэмэх" text="Модуль, хичээл"/>
          <QuickAction href="/admin/schools" art="gradcap" tile="#FFF6CC" label="Сургууль нэмэх" text="Удирдлагын аккаунт"/>
        </div>
      </section>
    </div>
  </div>;
}

function Kpi({ art, tile, label, value, note, positive = false }: { art: ObjectKind; tile: string; label: string; value: string; note: string; positive?: boolean }) {
  return <article className={`${card} flex items-center gap-3.5`}>
    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px]" style={{ background: tile }}><ObjectArt kind={art} size={56}/></span>
    <div className="min-w-0"><p className="text-[13px] font-medium text-[#5B6275]">{label}</p><p className="mt-0.5 font-display text-[30px] font-medium leading-tight tracking-[-0.03em]">{value}</p><p className={`mt-0.5 truncate text-xs font-medium ${positive ? "text-[#16A34A]" : "text-[#5B6275]"}`}>{note}</p></div>
  </article>;
}

function SignupChart({ signups }: { signups: Data["signups"] }) {
  const max = Math.max(...signups.daily.map((item) => item.count), 1);
  const scale = Math.max(4, Math.ceil(max / 4) * 4);
  const peak = signups.daily.findIndex((item) => item.count === max && max > 0);
  const label = (day: string) => day.slice(5).replace("-", ".");
  return <section className={card}>
    <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className={title}>Шинэ бүртгэл</h2><span className="text-[13px] font-medium text-[#5B6275]">Өдөр бүр · сүүлийн 30 хоног</span></div>
    <p className="mt-1.5 flex items-baseline gap-3"><b className="font-display text-[30px] font-medium tracking-[-0.03em]">{signups.total}</b>{signups.change !== null && <span className={`text-[13px] font-semibold ${signups.change >= 0 ? "text-[#16A34A]" : "text-red-600"}`}>{signups.change >= 0 ? "↑" : "↓"} {Math.abs(signups.change)}% өмнөх 30 хоногоос</span>}</p>
    <div className="relative mt-5 pl-[30px]">
      {[0.25, 0.5, 0.75, 1].map((fraction) => <div key={fraction} className="absolute inset-x-0 border-t border-[#EEF0F6] pl-0" style={{ bottom: `${fraction * 168}px` }}><span className="absolute -top-2 left-0 text-[11px] font-medium text-[#9AA0B4]">{Math.round(scale * fraction)}</span></div>)}
      <div className="relative flex h-[170px] items-end gap-[5px] border-b border-[#EEF0F6]">{signups.daily.map((item, index) => <div key={item.day} className="relative flex h-full flex-1 items-end" title={`${label(item.day)} · ${item.count}`}>
        {index === peak && <span className="absolute left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0B1030] px-2 py-1 text-xs font-semibold text-white" style={{ bottom: `${item.count / scale * 168 + 8}px` }}>{label(item.day)} · {item.count}</span>}
        <i className={`block w-full rounded-b-[2px] rounded-t-[5px] ${index === peak ? "bg-[#2B4BE8]" : "bg-[#9DB0FF]"}`} style={{ height: `${Math.max(item.count ? 4 : 2, item.count / scale * 168)}px` }}/>
      </div>)}</div>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-[#9AA0B4]"><span>{label(signups.daily[0].day)}</span><span>{label(signups.daily[14].day)}</span><span>{label(signups.daily[29].day)}</span></div>
    </div>
  </section>;
}

function RevenueChart({ months }: { months: Data["revenueByMonth"] }) {
  const totals = months.map((month) => month.standard + month.mentor);
  const max = Math.max(...totals, 1);
  const top = totals.indexOf(Math.max(...totals));
  return <section className={card}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className={title}>Орлого багцаар</h2><span className="flex gap-4 text-xs font-medium text-[#5B6275]"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px] bg-[#2B4BE8]"/>Стандарт</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px] bg-[#D97706]"/>Ментор+</span></span></div>
    <p className="mt-1.5 text-[13px] text-[#5B6275]">Сар бүрийн нийт орлого</p>
    <div className="mt-3.5 flex gap-2.5 border-b border-[#EEF0F6]">{months.map((month, index) => {
      const total = totals[index];
      return <div key={month.key} className="flex flex-1 flex-col items-center gap-2 pb-2">
        <div className="flex h-[170px] w-full flex-col items-center justify-end">
          {index === top && total > 0 && <span className="mb-1 text-xs font-semibold">{millions(total)}</span>}
          {month.mentor > 0 && <i className="block w-[30px] rounded-t-md bg-[#D97706]" style={{ height: `${month.mentor / max * 150}px` }}/>}
          {month.mentor > 0 && month.standard > 0 && <i className="block h-0.5 w-[30px] bg-white"/>}
          <i className={`block w-[30px] rounded-b-[3px] bg-[#2B4BE8] ${month.mentor > 0 ? "" : "rounded-t-md"}`} style={{ height: `${Math.max(total ? 0 : 2, month.standard / max * 150)}px` }}/>
        </div>
        <span className="text-[11px] font-medium text-[#9AA0B4]">{month.label}</span>
      </div>;
    })}</div>
  </section>;
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan !== "free") return <span className="rounded-full bg-[#E8EEFF] px-2.5 py-1 text-xs font-semibold text-[#2B4BE8]">{planName(plan)}</span>;
  return <span className="rounded-full bg-[#F1F3F8] px-2.5 py-1 text-xs font-semibold text-[#5B6275]">{planName(plan)}</span>;
}

function PaymentStatus({ status }: { status: Data["recentPayments"][number]["status"] }) {
  if (status === "paid") return <span className="inline-flex items-center gap-1.5 justify-self-end rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-semibold text-[#15803D]"><Check size={12} strokeWidth={3}/>Төлсөн</span>;
  if (status === "pending" || status === "checkout_created") return <span className="inline-flex items-center gap-1.5 justify-self-end rounded-full bg-[#E0F2FE] px-2 py-0.5 text-xs font-semibold text-[#0369A1]"><Clock3 size={12}/>Хүлээгдэж буй</span>;
  return <span className="inline-flex items-center gap-1.5 justify-self-end rounded-full bg-[#F1F3F8] px-2 py-0.5 text-xs font-semibold text-[#5B6275]"><X size={12}/>{status === "refunded" ? "Буцаасан" : status === "expired" ? "Хугацаа дууссан" : "Цуцалсан"}</span>;
}

function QuickAction({ href, art, tile, label, text }: { href: string; art: ObjectKind; tile: string; label: string; text: string }) {
  return <Link href={href} className="flex flex-col gap-2.5 rounded-[18px] border-2 border-[#EEF0F6] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#C9D3FF]">
    <span className="grid h-[58px] w-[58px] place-items-center rounded-[18px]" style={{ background: tile }}><ObjectArt kind={art} size={46}/></span>
    <span className="text-sm font-semibold leading-snug">{label}</span><span className="-mt-1.5 text-xs text-[#5B6275]">{text}</span>
  </Link>;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() + 8 * 3_600_000);
  return `${String(local.getUTCMonth() + 1).padStart(2, "0")}.${String(local.getUTCDate()).padStart(2, "0")} ${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
}
