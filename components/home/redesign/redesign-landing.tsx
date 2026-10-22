import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, Check, Clock3, Plus, TrendingUp } from "lucide-react";
import { HeroCarousel } from "@/components/home/redesign/hero-carousel";
import { Cloud, Mascot, mascotColors, SteppeScene, Squiggle, TileArt, type TileKind } from "@/components/home/redesign/illustrations";
import { CountUp, ScrollMotion } from "@/components/home/redesign/scroll-motion";
import "@/components/home/redesign/redesign.css";

const INK = "#0B1030";
const BLUE = "#2B4BE8";
const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;
const container = "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-[112px]";
const btnDark = "inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#0B1030] px-[26px] text-[17px] font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#1A2150]";
const btnOutline = "inline-flex h-[52px] items-center justify-center gap-2 rounded-full border-2 border-[#E3E6EF] bg-white px-[26px] text-[17px] font-medium text-[#5B6275] transition hover:border-[#C9CDDA] hover:text-[#0B1030]";
const muted = "text-[#5B6275]";

const steps = [
  { n: "01", title: "Түвшингээ тогтоо", text: "25 минутын сорил өгөөд таамагласан оноо, хамгийн их оноо алдаж буй сэдвүүдээ хар.", bg: "#E8EEFF" },
  { n: "02", title: "Хувийн төлөвлөгөө ав", text: "Шалгалтын өдөр, зорилтот оноогоо оруул. Төлөвлөгөө чиний ахицаар өөрөө шинэчлэгдэнэ.", bg: "#FFF6CC" },
  { n: "03", title: "Зорилтот оноондоо хүр", text: "Сул сэдэв дээр төвлөрсөн бодлого, дасгал, онолын тайлбараар ахиц гарга.", bg: "#E9FBF2" },
];
const focusTopics = [["Функц ба график", 72, BLUE], ["Тригонометр", 58, "#FFB020"], ["Магадлал & статистик", 41, "#FF6FA8"]] as const;
const planTasks = [["Функц ба график", "ЭЕШ", "30 мин"], ["Тригонометр", "ЭЕШ", "25 мин"], ["Algebra", "SAT", "15 мин"]] as const;
const stats = [{ value: "2006–2023", label: "ЭЕШ-ийн бүх хувилбар, хариутай" }, { value: 8, label: "Бүрэн SAT mock шалгалт" }, { value: "5 түвшин", label: "Чадвар бүрийн оноо, ахицын тайлан" }, { value: "100%", label: "Монгол хэл дээрх тайлбар" }];
const weekPlan = [
  { day: "21", weekday: "Да", title: "Функц ба график · 24 бодлого", meta: "40 мин · ЭЕШ", status: "Дууссан ✓", tone: "bg-[#DCFCE7] text-[#16A34A]" },
  { day: "22", weekday: "Мя", title: "Тригонометр · онолын хичээл", meta: "25 мин · Онол", status: "Эхлэх", tone: "bg-[#2B4BE8] text-white" },
  { day: "24", weekday: "Ба", title: "Бүрэн ЭЕШ сорил · 2021 A", meta: "100 мин · Mock", status: "Товлосон", tone: "bg-[#F1F3F8] text-[#5B6275]" },
];
const topicChart = [["Алгебр", 86, "#22C55E"], ["Функц", 72, "#22C55E"], ["Тригонометр", 58, "#FFB020"], ["Геометр", 67, "#FFB020"], ["Магадлал", 41, "#FF5A5A"], ["Прогресс", 80, "#22C55E"], ["Лог", 49, "#FF5A5A"]] as const;
const heat = ["#E8EEFF", "#B9C9FF", "#4C6FFF", "#2B4BE8", "#E8EEFF", "#7F98FF", "#2B4BE8"];
const moreFeatures: [TileKind, string, string][] = [["formula", "#FFF6CC", "Томъёоны сан"], ["calc", "#E9FBF2", "Оноо тооцоолуур"], ["mistake", "#FFE4E4", "Алдааны дэвтэр"], ["stopwatch", "#FFF6CC", "Цагтай сорил"], ["school", "#E8EEFF", "Ангийн шалгалт"], ["pdf", "#F1F3F8", "PDF материал"], ["chart", "#FFE4EF", "Ахицын тайлан"], ["book", "#EFE6FF", "Онолын хичээл"], ["target", "#EFE6FF", "Зорилтот оноо"], ["flame", "#FFF0E6", "Өдрийн цуврал"], ["triangle", "#E9FBF2", "Геометрийн зураг"], ["notebook", "#E8EEFF", "Багшийн самбар"]];
// Sample reviews for the design preview; replace with real student feedback before launch.
const reviews = [
  { from: 612, to: 768, name: "Тэмүүжин", grade: "12-р анги", text: "Алдаа бүрийн тайлбарыг уншаад яг хаана буруу бодсноо ойлгодог болсон. Тригонометр хамгийн их ахисан." },
  { from: 1310, to: 1490, name: "Анужин", grade: "11-р анги · SAT", text: "SAT-ийн mock шалгалтууд бодит шалгалттай маш төстэй. Цагаа зөв хуваарилж сурсан." },
  { from: 540, to: 702, name: "Билгүүн", grade: "12-р анги", text: "Өдөр бүр 20 минут. Төлөвлөгөө юу хийхийг хэлж өгдөг болохоор бодох л үлддэг." },
  { from: 655, to: 790, name: "Номин", grade: "12-р анги", text: "Сүүлийн 20 жилийн бодлого нэг дор байгаа нь хамгийн том давуу тал." },
  { from: 590, to: 731, name: "Хүслэн", grade: "11-р анги", text: "Эзигээс асуухад шууд хариуг биш санааг нь өгдөг нь их таалагдсан." },
  { from: 1220, to: 1430, name: "Ганзориг", grade: "12-р анги · SAT", text: "Сэдэв тус бүрийн анализ сул талаа олоход тусалсан." },
];
const faqs = ["EzMath үнэгүй юу?", "ЭЕШ-ийн аль онуудын бодлого багтсан бэ?", "SAT-д бэлдэхэд тохирох уу?", "Сургууль, багш нар хэрхэн ашиглах вэ?", "Гар утсан дээр ажилладаг уу?", "Төлбөрөө хэрхэн төлөх вэ?"];
const footerGroups = [["Хөтөлбөр", [["ЭЕШ Математик", "/tests?exam=EYESH"], ["SAT Math", "/tests?exam=SAT"], ["Онолын хичээл", "/lesson"]]], ["Платформ", [["Шалгалтууд", "/tests"], ["Үнийн багц", "/pricing"]]], ["Бүртгэл", [["Нэвтрэх", "/login"], ["Бүртгүүлэх", "/register"], ["Сурагчийн хэсэг", "/dashboard"]]]] as const;

export function RedesignLanding() {
  return <div className="rd">
    <ScrollMotion/>
    <Nav/>
    <main>
      <Hero/>
      <Steps/>
      <Testimonial/>
      <StatsBand/>
      <FeatureQuestionBank/>
      <FeaturePlanner/>
      <FeatureAnalytics/>
      <MoreFeatures/>
      <Reviews/>
      <Faq/>
      <ClosingCta/>
    </main>
    <Footer/>
  </div>;
}

function Logo() { return <Link href="/" className="rd-display flex items-center gap-2.5 text-2xl font-bold"><Mascot size={40}/>EzMath</Link>; }

function Nav() {
  return <header className="sticky top-0 z-40 bg-white/95 backdrop-blur"><div className={`${container} flex h-[72px] items-center gap-10`}>
    <Logo/>
    <nav className="ml-auto hidden items-center gap-8 text-[15px] font-medium text-[#333A4D] lg:flex" aria-label="Үндсэн цэс">
      <Link href="/tests?exam=EYESH">ЭЕШ</Link><Link href="/tests?exam=SAT">SAT</Link>
      <Link href="/lesson">Онолын хичээл<span className="ml-1.5 rounded-full bg-[#2B4BE8] px-[7px] py-0.5 align-[2px] text-[10px] font-semibold text-white">Шинэ</span></Link>
      <Link href="/pricing">Үнэ</Link>
    </nav>
    <div className="ml-auto flex gap-2 lg:ml-0"><Link href="/login" className="rounded-[10px] bg-[#F1F3F8] px-3.5 py-2 text-sm font-medium text-[#5B6275]">Нэвтрэх</Link><Link href="/register" className="rounded-[10px] bg-[#0B1030] px-3.5 py-2 text-sm font-medium text-white">Бүртгүүлэх</Link></div>
  </div></header>;
}

function Hero() {
  return <section className={`${container} grid items-center gap-6 pb-16 pt-10 lg:grid-cols-[1fr_560px] lg:gap-10 lg:pb-24 lg:pt-14`}>
    <div>
      <h1 className="rd-display text-[40px] leading-[1.08] sm:text-5xl lg:text-[64px]" data-rv>ЭЕШ ба SAT математикийн <Squiggle>цогц</Squiggle> бэлтгэл нэг дор</h1>
      <p className={`mt-6 max-w-[600px] text-lg leading-relaxed lg:text-[21px] ${muted}`} data-rv style={delay(0.08)}>Сүүлийн 20 жилийн ЭЕШ-ийн бодлого, бодит форматтай SAT сорил, онолын хичээл. Алдаа бүрээ ойлгож, сул сэдвээ анализаар олоорой.</p>
      <div className="mt-8 flex flex-wrap gap-2.5" data-rv style={delay(0.16)}><Link href="/register" className={btnDark}>Үнэгүй эхлэх</Link><Link href="/pricing" className={btnOutline}>Би эцэг эх</Link><Link href="/register" className={btnOutline}>Би багш</Link></div>
      <div className={`mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm ${muted}`} data-rv style={delay(0.24)}>{["Картын мэдээлэл шаардахгүй", "Монгол хэл дээр"].map((x) => <span key={x} className="inline-flex items-center gap-1.5"><Check size={14} strokeWidth={3} className="text-[#2B4BE8]"/>{x}</span>)}</div>
      <Link href="/pricing" className="mt-5 inline-block border-b-[1.5px] border-[#0B1030] pb-0.5 text-base font-medium" data-rv style={delay(0.32)}>Сургуулиудад зориулсан EzMath →</Link>
    </div>
    <div className="order-first lg:order-none"><HeroCarousel/></div>
  </section>;
}

function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`rd-display text-center text-[34px] leading-[1.1] sm:text-[44px] lg:text-[56px] ${className}`} data-rv>{children}</h2>;
}

function Steps() {
  return <section className={`${container} pb-24 pt-6 lg:pb-[120px]`}>
    <SectionTitle>Оношил, төлөвлө, <Squiggle>ухаалгаар</Squiggle> дасгал хий</SectionTitle>
    <div className="mt-14 grid gap-5 lg:grid-cols-3">{steps.map((step, i) => <article key={step.n} className="overflow-hidden rounded-3xl border-2 border-[#EEF0F6] bg-white" data-rv style={delay(i * 0.09)}>
      <div className="relative h-[300px] overflow-hidden px-[30px] pt-8" style={{ background: step.bg }}>{i === 0 ? <DiagnosticMini/> : i === 1 ? <PlanMini/> : <PracticeMini/>}</div>
      <div className="px-[26px] pb-[30px] pt-6"><p className="rd-display text-[30px] font-light text-[#8A90A2]">{step.n}</p><h3 className="rd-display mt-2.5 text-2xl">{step.title}</h3><p className={`mt-2.5 text-[15px] leading-relaxed ${muted}`}>{step.text}</p></div>
    </article>)}</div>
  </section>;
}

function DiagnosticMini() {
  return <div className="h-full rounded-t-[18px] border-2 border-b-0 border-[#0B1030]/[.06] bg-white p-5">
    <p className={`text-xs ${muted}`}>Таамагласан ЭЕШ оноо</p><p className="rd-display mt-0.5 text-[40px]"><CountUp value={640}/></p>
    <p className={`mt-2 text-xs ${muted}`}>Анхаарах сэдэв</p>
    {focusTopics.map(([topic, value, color]) => <div key={topic} className="mt-3"><div className="flex justify-between text-xs"><span>{topic}</span><span className={muted}>{value}%</span></div><div className="mt-1.5 h-1.5 rounded-full bg-[#EEF0F6]"><i className="rd-grow-w block h-full rounded-full" style={{ "--v": `${value}%`, background: color } as CSSProperties}/></div></div>)}
  </div>;
}

function PlanMini() {
  return <div className="h-full rounded-t-[18px] border-2 border-b-0 border-[#0B1030]/[.06] bg-white px-5 pt-2">{planTasks.map(([title, exam, minutes]) => <div key={title} className="border-b-2 border-[#F0F1F6] py-3 last:border-0">
    <p className="flex items-center gap-2.5 text-sm font-medium"><i className="inline-block h-4 w-4 rounded-[5px] border-2 border-[#C9CDDA]"/>{title}</p>
    <div className="mt-2.5 flex items-center justify-between"><span className={`flex items-center gap-2 text-xs ${muted}`}><span className={`rounded-md px-[7px] py-[3px] text-[11px] font-semibold ${exam === "SAT" ? "bg-[#FFF6CC] text-[#B98400]" : "bg-[#E8EEFF] text-[#2B4BE8]"}`}>{exam}</span><Clock3 size={12}/>{minutes}</span><span className={`rounded-full bg-[#F1F3F8] px-3 py-1 text-xs font-medium ${muted}`}>Эхлэх ›</span></div>
  </div>)}</div>;
}

function PracticeMini() {
  const cards: [string, string, string, TileKind, string][] = [["Бодлогын сан", "2006–2023 оны ЭЕШ-ийн бодлогыг бодолттой нь", "Үргэлжлүүлэх", "notebook", "8deg"], ["Цагтай сорил", "Бодит шалгалтын нөхцөлд хурдаа сорь", "Эхлэх", "stopwatch", "-8deg"]];
  return <div className="flex flex-col gap-2.5">{cards.map(([title, text, cta, kind, rotate], i) => <div key={title} className="relative rounded-[18px] border-2 border-[#EEF0F6] bg-white px-4 py-3.5">
    <p className="text-sm font-semibold">{title}</p><p className={`mt-1.5 w-[170px] text-xs ${muted}`}>{text}</p><span className={`mt-3 inline-block rounded-full bg-[#F1F3F8] px-3 py-1 text-xs font-medium ${muted}`}>{cta}</span>
    <div className="absolute right-2.5 top-4" style={{ rotate }}><div data-pop data-float style={delay(0.3 + i * 0.12)}><TileArt kind={kind}/></div></div>
  </div>)}</div>;
}

function Testimonial() {
  const clouds: [number, number, number, number][] = [[-4, 120, 320, 0.9], [82, 90, 300, 0.95], [8, 420, 260, 0.7], [75, 400, 340, 0.8], [39, 40, 200, 0.6]];
  return <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff_0%,#E3EEFF_34%,#CFEFFF_70%,#BDE9FF_100%)] pb-[340px] pt-24 lg:pt-28" data-parallax>
    {clouds.map(([left, top, width, opacity], i) => <Cloud key={i} className="rd-cloud" style={{ left: `${left}%`, top, width, opacity }}/>)}
    <div className={`${container} relative z-[2] text-center`}>
      <SectionTitle>Ирээдүйгээ <Squiggle>өөрчлөх</Squiggle> оноо</SectionTitle>
      <p className="rd-display mx-auto mt-16 max-w-[820px] text-2xl leading-[1.3] lg:mt-[120px] lg:text-4xl" data-rv>“EzMath дээр өдөр бүр 30 бодлого бодож, алдаа бүрийнхээ тайлбарыг уншсан. <span className="text-[#2B4BE8]">ЭЕШ-ийн оноогоо 612-оос 768 болгосон.</span>”</p>
      <div className="mt-7 inline-flex items-center gap-3.5 text-left" data-rv style={delay(0.1)}><div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#FFE4EF]"><Mascot {...mascotColors.pink} size={50}/></div><div><p className="text-[17px] font-semibold">Тэмүүжин</p><p className={`text-sm ${muted}`}>12-р анги · Жишээ сэтгэгдэл</p></div></div>
      <div className="mt-9 flex justify-center gap-2" aria-hidden><i className="h-2 w-[30px] rounded-full bg-[#2B4BE8]"/><i className="h-2 w-2 rounded-full bg-[#9CC6F0]"/><i className="h-2 w-2 rounded-full bg-[#9CC6F0]"/><i className="h-2 w-2 rounded-full bg-[#9CC6F0]"/></div>
    </div>
    <SteppeScene/>
  </section>;
}

function StatsBand() {
  return <section className="bg-[#0B1030] py-[72px] text-white"><div className={container}>
    <h3 className="rd-display text-center text-[22px]" data-rv>EzMath-ийн сан ба боломжууд</h3>
    <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{stats.map((stat, i) => <div key={stat.label} className="rounded-[20px] border-[1.5px] border-white/[.12] bg-white/[.04] p-[26px]" data-rv style={delay(i * 0.09)}>
      <b className="rd-display block text-[44px] font-medium">{typeof stat.value === "number" ? <CountUp value={stat.value}/> : stat.value}</b><span className="mt-1.5 block text-[15px] text-[#AEB4CC]">{stat.label}</span>
    </div>)}</div>
  </div></section>;
}

function FeatureHead({ chip, chipBg, chipIcon, title, text }: { chip: string; chipBg: string; chipIcon: ReactNode; title: ReactNode; text: string }) {
  return <div className="grid items-end gap-6 lg:grid-cols-2 lg:gap-[60px]">
    <div data-rv><span className="inline-flex items-center gap-2.5 text-[15px] font-medium"><i className="rd-display inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] text-[15px] font-bold not-italic text-white" style={{ background: chipBg }}>{chipIcon}</i>{chip}</span><h2 className="rd-display mt-[18px] text-4xl leading-[1.08] lg:text-[52px]">{title}</h2><Link href="/register" className={`${btnDark} mt-7`}>Үнэгүй эхлэх</Link></div>
    <p className={`max-w-[500px] text-lg leading-relaxed lg:justify-self-end lg:text-[19px] ${muted}`} data-rv style={delay(0.1)}>{text}</p>
  </div>;
}

function Mock({ children, mascot, mascotPos, tile, tilePos }: { children: ReactNode; mascot: keyof typeof mascotColors; mascotPos: CSSProperties; tile: [TileKind, string]; tilePos: CSSProperties }) {
  return <div className="relative mt-16 rounded-[28px] border-2 border-[#EEF0F6] bg-[#F7F8FC] p-4 sm:p-6" data-rv>
    <div className="absolute -top-[78px] hidden sm:block" style={mascotPos}><div data-pop data-float style={delay(0.45)}><Mascot {...mascotColors[mascot]} size={96} wave/></div></div>
    <div className="absolute z-[3] hidden sm:block" style={tilePos}><div className="flex h-[104px] w-[104px] items-center justify-center rounded-[30px] border-2 border-[#0B1030]/[.06] shadow-[0_16px_34px_-14px_rgba(11,16,48,.28)]" style={{ background: tile[1] }} data-pop data-float><TileArt kind={tile[0]}/></div></div>
    {children}
  </div>;
}

const panel = "rounded-[18px] border-2 border-[#EEF0F6] bg-white p-[22px]";

function FeatureQuestionBank() {
  return <section className={`${container} pt-24 lg:pt-[120px]`}>
    <FeatureHead chip="Бодлогын сан" chipBg={BLUE} chipIcon="∑" title={<>Бодлого дээр<br/>гацахаа боль</>} text="ЭЕШ-ийн 20 жилийн бодлого бүрт алхам алхмаар бодолт. Гацсан үедээ Эзигээс асуугаад зөвхөн дараагийн алхмын санааг аваарай."/>
    <Mock mascot="blue" mascotPos={{ right: 70 }} tile={["notebook", "#E8EEFF"]} tilePos={{ left: -34, top: -40, rotate: "-9deg" }}>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className={panel}>
          <div className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-2.5"><span className="rounded-md bg-[#E8EEFF] px-[7px] py-[3px] text-[11px] font-semibold text-[#2B4BE8]">ЭЕШ 2019 · B хувилбар</span><span className={muted}>Бодлого 21</span></span><span className={`font-medium ${muted}`}>⏱ 01:42</span></div>
          <p className="rd-serif mt-[22px] text-lg leading-[1.7]">Арифметик прогрессийн эхний гишүүн a<sub>1</sub> = 3, ялгавар d = 4 бол <span className="rounded bg-[#FFF1A8] px-[3px]">эхний 10 гишүүний нийлбэр</span> S<sub>10</sub>-ийг ол.</p>
          <div className="mt-[22px] grid grid-cols-2 gap-2.5">{[["A", "180"], ["B", "200"], ["C", "210"], ["D", "230"]].map(([letter, value]) => { const ok = letter === "C"; return <div key={letter} className={`rd-serif flex items-center gap-3 rounded-xl border-2 px-3 py-[9px] text-[15px] ${ok ? "border-[#22C55E] bg-[#F0FDF4]" : "border-[#E4E7F0]"}`}><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border-2 font-sans text-[11px] font-semibold ${ok ? "border-[#22C55E] bg-[#22C55E] text-white" : "border-[#0B1030]"}`}>{ok ? <Check size={14} strokeWidth={3}/> : letter}</span>{value}</div>; })}</div>
          <div className="mt-[22px] flex items-center justify-between border-t-2 border-[#F0F1F6] pt-4"><span className={`text-[13px] ${muted}`}>21 / 36</span><span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B1030] px-4 py-2.5 text-[13px] font-semibold text-white">Дараагийн бодлого <ArrowRight size={14}/></span></div>
        </div>
        <div className={`${panel} flex flex-col gap-3 text-sm leading-normal`}>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2.5 text-[15px] font-semibold"><Mascot size={36}/>Эзигээс асуух</span><span className="rounded-md bg-[#E9FBF2] px-[7px] py-[3px] text-[11px] font-semibold text-[#16A34A]">Бодолт</span></div>
          <div className="w-4/5 self-end rounded-2xl bg-[#F4F5FA] px-3.5 py-3">Нийлбэрийн томъёогоо мартчихлаа 😅</div>
          <div className="w-[92%] rounded-2xl bg-[#E8EEFF] px-3.5 py-3">Сануулга: S<sub>n</sub> = n(2a<sub>1</sub> + (n−1)d) / 2. Эхлээд 2a<sub>1</sub> + 9d-г олоод үз.</div>
          <div className="w-3/5 self-end rounded-2xl bg-[#F4F5FA] px-3.5 py-3">6 + 36 = 42 ✔</div>
          <div className="w-[92%] rounded-2xl bg-[#E8EEFF] px-3.5 py-3">Зөв! Одоо 10 · 42 / 2 = <b>210</b>. Хариулт C 🎉</div>
          <div className="mt-auto rounded-xl border-2 border-[#EEF0F6] p-3 text-[#9AA0B4]">Асуултаа бич…</div>
        </div>
      </div>
    </Mock>
  </section>;
}

function FeaturePlanner() {
  return <section className={`${container} pt-24 lg:pt-[120px]`}>
    <FeatureHead chip="Сорил төлөвлөгч" chipBg="#FFB020" chipIcon={<Clock3 size={16}/>} title={<>Юу давтахаа бодож<br/>цаг бүү үр</>} text="Шалгалтын өдөр, зорилтот оноогоо оруулахад долоо хоног бүрийн төлөвлөгөө гарна. Сорил бүрийн дараа төлөвлөгөө дахин тооцоологдоно."/>
    <Mock mascot="yellow" mascotPos={{ left: 80 }} tile={["stopwatch", "#FFF6CC"]} tilePos={{ right: -30, top: -44, rotate: "8deg" }}>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-3"><p className="p-1 text-[15px] font-semibold">Энэ долоо хоног</p>{weekPlan.map((item) => <div key={item.day} className={`${panel} grid grid-cols-[56px_1fr_auto] items-center gap-4 !p-4`}>
          <div className="text-center"><p className="rd-display text-[28px]">{item.day}</p><p className={`text-xs ${muted}`}>{item.weekday}</p></div>
          <div><p className="text-[15px] font-semibold">{item.title}</p><p className={`mt-1 text-[13px] ${muted}`}>{item.meta}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.tone}`}>{item.status}</span>
        </div>)}</div>
        <div className="flex flex-col gap-3">
          <div className="rounded-[18px] bg-[#0B1030] p-[22px] text-white"><p className="text-[13px] text-[#AEB4CC]">ЭЕШ хүртэл</p><p className="rd-display mt-1.5 text-[54px]"><CountUp value={48}/> <span className="text-xl text-[#AEB4CC]">өдөр</span></p><div className="mt-3.5 flex gap-1.5">{Array.from({ length: 14 }, (_, i) => <i key={i} className={`h-2 flex-1 rounded-full ${i < 9 ? "bg-[#4C6FFF]" : "bg-white/15"}`}/>)}</div><p className="mt-3 text-[13px] text-[#AEB4CC]">Төлөвлөгөөний 64% биелсэн</p></div>
          <div className={`${panel} flex items-center gap-4`}><div className="flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-[#FFF0E6]" data-pop><TileArt kind="flame"/></div><div><p className="rd-display text-[30px]"><CountUp value={12}/> өдөр</p><p className={`text-[13px] ${muted}`}>дараалан бодсон цуврал</p></div></div>
        </div>
      </div>
    </Mock>
  </section>;
}

function FeatureAnalytics() {
  return <section className={`${container} pt-24 lg:pt-[120px]`}>
    <FeatureHead chip="Ахицын анализ" chipBg="#FF6FA8" chipIcon={<TrendingUp size={16}/>} title={<>Сул сэдвээ шалгалтаас<br/>өмнө ол</>} text="Сэдэв тус бүрийн гүйцэтгэл, бодох хурд, алдааны давтамжаа хар. Аль сэдэв оноо хамгийн их алдуулж байгааг тодорхой харуулна."/>
    <Mock mascot="pink" mascotPos={{ right: 90 }} tile={["chart", "#FFE4EF"]} tilePos={{ left: -30, bottom: -36, rotate: "-7deg" }}>
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className={panel}><div className="flex items-center justify-between"><p className="text-[15px] font-semibold">Сэдэв тус бүрийн гүйцэтгэл</p><span className={`rounded-md bg-[#F1F3F8] px-[7px] py-[3px] text-[11px] font-semibold ${muted}`}>Сүүлийн 30 хоног</span></div>
          <div className="mt-[22px] flex gap-2 sm:gap-3.5">{topicChart.map(([topic, value, color]) => <div key={topic} className="flex flex-1 flex-col items-center gap-2"><div className="flex h-[180px] w-full items-end"><i className="rd-grow-h block w-full rounded-t-lg rounded-b" style={{ "--v": `${value}%`, background: color } as CSSProperties}/></div><span className={`break-all text-center text-[11px] ${muted}`}>{topic}</span></div>)}</div>
        </div>
        <div className="flex flex-col gap-3">
          <div className={`${panel} flex items-center gap-[18px]`}><svg width="96" height="96" viewBox="0 0 36 36" aria-hidden><circle cx="18" cy="18" r="15" stroke="#EEF0F6" strokeWidth="5" fill="none"/><circle cx="18" cy="18" r="15" stroke={BLUE} strokeWidth="5" fill="none" strokeDasharray="68 94" strokeLinecap="round" transform="rotate(-90 18 18)"/><text x="18" y="21" textAnchor="middle" fontSize="9" fontWeight="600" fill={INK}>72%</text></svg><div><p className="text-[15px] font-semibold">Зөв хариулт</p><p className={`mt-1 text-[13px] ${muted}`}>1,284 бодлогоос 924 зөв</p><p className="mt-2 text-[13px] font-semibold text-[#16A34A]">↑ 9% өмнөх сараас</p></div></div>
          <div className={panel}><p className="text-[15px] font-semibold">Өдөр тутмын идэвх</p><div className="mt-3.5 grid grid-cols-[repeat(14,14px)] gap-1.5">{Array.from({ length: 42 }, (_, i) => <i key={i} className="h-3.5 w-3.5 rounded" style={{ background: heat[i % heat.length] }}/>)}</div></div>
        </div>
      </div>
    </Mock>
  </section>;
}

function MoreFeatures() {
  return <section className={`${container} pt-28 text-center lg:pt-[130px]`}>
    <SectionTitle>Мөн 12+ <Squiggle>хэрэгтэй</Squiggle> боломж</SectionTitle>
    <div className="mt-14 grid grid-cols-2 gap-[18px] sm:grid-cols-3 lg:grid-cols-6">{moreFeatures.map(([kind, bg, label], i) => <div key={label} className="flex flex-col items-center gap-3 rounded-[22px] border-2 border-[#EEF0F6] px-3 pb-[18px] pt-[22px] text-sm font-medium" data-rv style={delay((i % 6) * 0.05)}>
      <div className="flex h-[84px] w-[84px] items-center justify-center rounded-3xl" style={{ background: bg }} data-pop><TileArt kind={kind}/></div>{label}
    </div>)}</div>
  </section>;
}

function Reviews() {
  return <section className={`${container} pt-24 lg:pt-[110px]`}>
    <SectionTitle>EzMath-аар бэлдсэн сурагчид</SectionTitle>
    <p className={`mt-3.5 text-center text-lg ${muted}`}>Жишээ сэтгэгдлүүд, бодит сэтгэгдлээр солих</p>
    <div className="mt-[52px] grid gap-5 md:grid-cols-2 lg:grid-cols-3">{reviews.map((review, i) => <article key={review.name} className="rounded-[22px] border-2 border-[#EEF0F6] p-6" data-rv style={delay((i % 3) * 0.09)}>
      <div className="flex items-center gap-2 text-xs font-semibold"><span className="rounded-lg bg-[#FFF6CC] px-[9px] py-[5px] text-[#B98400]">{review.from} → {review.to}</span><span className="rounded-lg bg-[#DCFCE7] px-[9px] py-[5px] text-[#16A34A]">+{review.to - review.from} оноо</span></div>
      <h4 className="mt-[18px] text-base font-semibold">{review.name} <span className={`text-[13px] font-normal ${muted}`}>· {review.grade}</span></h4>
      <p className="mt-3 text-[15px] leading-relaxed text-[#3B4256]">{review.text}</p>
    </article>)}</div>
  </section>;
}

function Faq() {
  return <section className={`${container} pt-24 lg:pt-[110px]`}>
    <SectionTitle>Түгээмэл асуултууд</SectionTitle>
    <div className="mx-auto mt-12 max-w-[880px]">{faqs.map((question) => <div key={question} className="flex items-center justify-between border-b-2 border-[#EEF0F6] px-1 py-6 text-[19px] font-medium" data-rv><span>{question}</span><Plus className="shrink-0 text-[#9AA0B4]"/></div>)}</div>
  </section>;
}

function ClosingCta() {
  return <section className="relative mt-[120px] overflow-hidden bg-[linear-gradient(180deg,#E8EEFF_0%,#D4E7FF_60%,#C3F0E2_100%)] pb-[340px] pt-24" data-parallax>
    <Cloud className="rd-cloud" style={{ left: "4%", top: 60, width: 260, opacity: 0.9 }}/>
    <Cloud className="rd-cloud" style={{ left: "78%", top: 40, width: 300, opacity: 0.9 }}/>
    <Cloud className="rd-cloud" style={{ left: "57%", top: 180, width: 180, opacity: 0.6 }}/>
    <div className={`${container} relative z-[2] text-center`}>
      <h2 className="rd-display text-[34px] leading-[1.1] sm:text-5xl lg:text-[56px]" data-rv>Маргаашийг хүлээх хэрэггүй —<br/><Squiggle>яг одоо</Squiggle> эхэл!</h2>
      <p className={`mt-[18px] text-lg lg:text-[19px] ${muted}`} data-rv style={delay(0.08)}>25 минутын сорил өгөөд өөртөө тохирсон төлөвлөгөөгөө аваарай.</p>
      <div className="mt-[30px] flex flex-wrap justify-center gap-2.5" data-rv style={delay(0.16)}><Link href="/tests" className={btnDark}>Үнэгүй сорил өгөх</Link><Link href="/pricing" className={btnOutline}>Үнийн багц харах</Link></div>
    </div>
    <SteppeScene/>
  </section>;
}

function Footer() {
  return <footer className={`${container} border-t-2 border-[#EEF0F6] pb-10 pt-[72px]`}>
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
      <div><Logo/><p className={`mt-4 max-w-[280px] text-sm leading-relaxed ${muted}`}>Монгол сурагчдад зориулсан математикийн бэлтгэлийн платформ. Улаанбаатар, Монгол.</p></div>
      {footerGroups.map(([heading, links]) => <nav key={heading} aria-label={heading}><p className="text-sm font-semibold">{heading}</p>{links.map(([label, href]) => <Link key={label} href={href} className={`mt-3.5 block text-sm ${muted} hover:text-[#0B1030]`}>{label}</Link>)}</nav>)}
    </div>
    <p className={`mt-14 border-t-2 border-[#EEF0F6] pt-6 text-[13px] ${muted}`}>© 2026 EzMath LLC. Бүх эрх хуулиар хамгаалагдсан.</p>
  </footer>;
}
