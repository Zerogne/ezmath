import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { Ezi } from "@/components/home/redesign/illustrations";

export default function NotFound() {
  return <><Navbar/><main className="container-page flex flex-col items-center py-16 text-center sm:py-24">
    <div className="flex items-center font-display text-[110px] font-medium leading-none tracking-[-0.04em] sm:text-[160px]" aria-hidden><span>4</span><Ezi pose="oops" size={150} className="-mx-2 h-auto w-[110px] sm:w-[150px]"/><span>4</span></div>
    <h1 className="mt-6 text-3xl font-medium sm:text-4xl">Энэ хуудас олдсонгүй</h1>
    <p className="mt-3 max-w-md text-[#5B6275]">Холбоос буруу эсвэл хуудас шилжсэн байж магадгүй. Эзи ч бас төөрчихлөө.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-2.5"><Link href="/" className="btn-dark">Нүүр хуудас</Link><Link href="/tests" className="btn-outline">Шалгалтууд</Link></div>
  </main><SiteFooter/></>;
}
