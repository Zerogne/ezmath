const INTERNAL_ORIGIN = "https://ezmath.invalid";

export function safeNextPath(value: string | null | undefined) {
  if (!value?.startsWith("/")) return undefined;

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}
