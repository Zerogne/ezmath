export function ProgressRing({ value, size = 52 }: { value: number; size?: number }) {
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`${value}% дууссан`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e8eaf2" strokeWidth="5" />
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#8057eb" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-[#111735]">{value}%</span>
    </div>
  );
}
