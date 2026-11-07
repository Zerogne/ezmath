import Link from "next/link";
import { Logo } from "@/components/layout/logo";

const groups = [["Хөтөлбөр", [["ЭЕШ Математик", "/tests?exam=EYESH"], ["SAT Math", "/tests?exam=SAT"], ["SAT бодлогын сан", "/tests?exam=SAT#bank"], ["Онолын хичээл", "/lesson"]]], ["Платформ", [["Шалгалтууд", "/tests"], ["Үнийн багц", "/pricing"]]], ["Бүртгэл", [["Нэвтрэх", "/login"], ["Бүртгүүлэх", "/register"], ["Сурагчийн хэсэг", "/dashboard"], ["Үйлчилгээний нөхцөл", "/terms"], ["Нууцлалын бодлого", "/privacy"]]]] as const;

export function SiteFooter() {
  return <footer className="container-page border-t-2 border-[#EEF0F6] pb-10 pt-[72px]">
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
      <div><Logo/><p className="mt-4 max-w-[280px] text-sm leading-relaxed text-[#5B6275]">Монгол сурагчдад зориулсан математикийн бэлтгэлийн платформ. Улаанбаатар, Монгол.</p></div>
      {groups.map(([heading, links]) => <nav key={heading} aria-label={heading}><p className="text-sm font-semibold">{heading}</p>{links.map(([label, href]) => <Link key={label} href={href} className="mt-3.5 block text-sm text-[#5B6275] hover:text-[#0B1030]">{label}</Link>)}</nav>)}
    </div>
    <p className="mt-14 border-t-2 border-[#EEF0F6] pt-6 text-[13px] text-[#5B6275]">© 2026 EzMath. Бүх эрх хуулиар хамгаалагдсан.</p>
  </footer>;
}
