import "server-only";

// Verify.MN reverse-SMS verification: the student sends `text` to the shortcode from `phone`,
// and Verify.MN marks the session VERIFIED. We poll the session status from the server and never
// trust anything the browser reports. Docs: https://verify.mn (API base https://api.verify.mn).

const BASE_URL = "https://api.verify.mn";

export type VerifyMnSession = { sessionId: string; shortcode: string; text: string; smsUri: string; expiresAt: string };
export type VerifyMnStatus = "PENDING" | "VERIFIED" | "EXPIRED";

export class VerifyMnError extends Error {
  constructor(readonly status: number) { super(`Verify.MN request failed with ${status}`); }
}

export function isVerifyMnConfigured() {
  return Boolean(process.env.VERIFY_MN_API_KEY);
}

export async function createVerifyMnSession(phone: string, text: string): Promise<VerifyMnSession> {
  const response = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.VERIFY_MN_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ phone, text }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new VerifyMnError(response.status);
  const body = await response.json() as Partial<VerifyMnSession>;
  if (!body.sessionId || !body.expiresAt) throw new VerifyMnError(502);
  return { sessionId: body.sessionId, shortcode: body.shortcode ?? "144773", text: body.text ?? text, smsUri: body.smsUri ?? `sms:144773?body=${encodeURIComponent(text)}`, expiresAt: body.expiresAt };
}

export async function getVerifyMnStatus(sessionId: string): Promise<VerifyMnStatus> {
  const response = await fetch(`${BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (response.status === 404) return "EXPIRED";
  if (!response.ok) throw new VerifyMnError(response.status);
  const body = await response.json() as { sessionStatus?: string };
  return body.sessionStatus === "VERIFIED" ? "VERIFIED" : body.sessionStatus === "EXPIRED" ? "EXPIRED" : "PENDING";
}

/** Accepts "9911 2233", "+976 99112233", "97699112233" and returns the 8-digit national number, or null. */
export function normalizeMongolianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("976")) digits = digits.slice(3);
  return /^[5-9]\d{7}$/.test(digits) ? digits : null;
}
