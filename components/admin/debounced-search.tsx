"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function DebouncedSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  useEffect(() => {
    // Only navigate when the typed value differs from the URL; otherwise every replace re-triggers this effect.
    if (value.trim() === (searchParams.get("search") ?? "")) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) params.set("search", value.trim());
      else params.delete("search");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [pathname, router, searchParams, value]);
  return (
    <label className="relative block w-full max-w-sm">
      <span className="sr-only">{placeholder}</span>
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        placeholder={placeholder}
        className="h-11 rounded-full border-2 border-[#EEF0F6] bg-white pl-10 shadow-none focus-visible:border-[#2B4BE8] focus-visible:ring-0"
      />
    </label>
  );
}
