export default function Loading() {
  return <div className="min-h-screen animate-pulse bg-white">
    <div className="h-[72px] border-b-2 border-[#EEF0F6]"/>
    <div className="bg-gradient-to-b from-white to-[#F6F2FF]"><div className="container-page grid gap-12 pb-20 pt-12 lg:grid-cols-[minmax(0,1fr)_480px]"><div><div className="h-7 w-32 rounded-full bg-[#EFE6FF]"/><div className="mt-6 h-14 w-[80%] rounded-2xl bg-[#EEF0F6]"/><div className="mt-3 h-14 w-[50%] rounded-2xl bg-[#EEF0F6]"/><div className="mt-6 h-5 w-[90%] rounded-lg bg-[#EEF0F6]"/><div className="mt-3 h-5 w-[70%] rounded-lg bg-[#EEF0F6]"/><div className="mt-8 flex gap-2.5"><div className="h-[52px] w-52 rounded-full bg-[#DDE1EC]"/><div className="h-[52px] w-48 rounded-full bg-[#EEF0F6]"/></div></div><div className="h-[340px] rounded-[26px] border-2 border-[#EEF0F6] bg-white"/></div></div>
    <div className="container-page grid gap-5 py-16 lg:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-[300px] rounded-[24px] border-2 border-[#EEF0F6] bg-white"/>)}</div>
  </div>;
}
