"use client";

import { useEffect, useRef } from "react";

const REVEAL = "[data-rv],[data-pop],[data-rv-sq]";

/** Marks `data-rv` / `data-pop` / `data-rv-sq` elements with `data-in` as they scroll into view and drives the `--p` parallax variable on `data-parallax` scenes. */
export function ScrollMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".rd");
    if (!root) return;
    const targets = [...root.querySelectorAll<Element>(REVEAL)];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { targets.forEach((el) => el.setAttribute("data-in", "")); return; }

    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.setAttribute("data-in", "");
      io.unobserve(entry.target);
    }), { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    targets.forEach((el) => io.observe(el));

    const scenes = [...root.querySelectorAll<HTMLElement>("[data-parallax]")];
    let frame = 0;
    const update = () => {
      frame = 0;
      scenes.forEach((scene) => {
        const rect = scene.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
        scene.style.setProperty("--p", progress.toFixed(3));
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { io.disconnect(); removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  return null;
}

/** Counts from 0 to `value` the first time it scrolls into view. */
export function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const format = (n: number) => n.toLocaleString("en-US");
    el.textContent = format(0);
    let raf = 0, timer = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / 1100);
        el.textContent = format(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { io.disconnect(); timer = window.setTimeout(run, delay); } }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); clearTimeout(timer); el.textContent = format(value); };
  }, [value, delay]);
  return <span ref={ref}>{value.toLocaleString("en-US")}</span>;
}
