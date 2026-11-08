"use client";

/** Fullscreen API with the webkit-prefixed fallback older Safari and iPadOS still need. */
type WebkitDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void; webkitFullscreenEnabled?: boolean };
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

export function fullscreenSupported() {
  if (typeof document === "undefined") return false;
  const root = document.documentElement as WebkitElement;
  return typeof root.requestFullscreen === "function" || typeof root.webkitRequestFullscreen === "function";
}

export function isFullscreen() {
  if (typeof document === "undefined") return false;
  const doc = document as WebkitDocument;
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

/** Resolves once fullscreen is on; rejects if the browser refuses (no user gesture, policy, exit still animating…). */
export async function enterFullscreen() {
  if (isFullscreen()) return;
  const root = document.documentElement as WebkitElement;
  if (typeof root.requestFullscreen === "function") await root.requestFullscreen();
  else if (typeof root.webkitRequestFullscreen === "function") await root.webkitRequestFullscreen();
  else throw new Error("fullscreen_unsupported");
}

export async function exitFullscreen() {
  if (!isFullscreen()) return;
  const doc = document as WebkitDocument;
  try {
    if (typeof doc.exitFullscreen === "function") await doc.exitFullscreen();
    else await doc.webkitExitFullscreen?.();
  } catch { /* already leaving */ }
}

export function subscribeToFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
  return () => {
    document.removeEventListener("fullscreenchange", onChange);
    document.removeEventListener("webkitfullscreenchange", onChange);
  };
}
