import { Navbar } from "@/components/layout/navbar";

export default function TestsLoading() {
  return <><Navbar/><main className="container-page py-12 sm:py-16" aria-busy="true"><span className="sr-only">Шалгалтуудыг ачаалж байна…</span><Skeleton className="h-4 w-28"/><Skeleton className="mt-3 h-10 w-56 sm:w-64"/><Skeleton className="mt-3 h-6 w-full max-w-2xl"/><div className="mt-10 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between"><Skeleton className="h-11 w-52 rounded-xl"/><Skeleton className="h-11 w-32 rounded-xl"/></div><Skeleton className="mt-8 h-6 w-24"/><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <TestCardSkeleton key={index}/>)}</div></main></>;
}

function TestCardSkeleton() { return <article className="rounded-xl border bg-white p-5"><Skeleton className="h-6 w-12 rounded-full"/><Skeleton className="mt-5 h-6 w-4/5"/><div className="mt-3 flex gap-4"><Skeleton className="h-5 w-24"/><Skeleton className="h-5 w-20"/></div><Skeleton className="mt-2 h-5 w-32"/><Skeleton className="mt-5 h-9 w-28"/></article>; }
function Skeleton({ className }: { className: string }) { return <div aria-hidden="true" className={`animate-pulse rounded-md bg-slate-200 ${className}`}/>; }
