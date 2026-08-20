import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { BylCheckout, CreateBylCheckout } from "@/lib/byl/types";

const BYL_API_URL = "https://byl.mn/api/v1";

function bylConfig() {
  const projectId = process.env.BYL_PROJECT_ID;
  const apiToken = process.env.BYL_API_TOKEN;
  if (!projectId || !apiToken) throw new Error("BYL төлбөрийн тохиргоо хийгдээгүй байна.");
  return { projectId, apiToken };
}

export function isBylConfigured() {
  return Boolean(process.env.BYL_PROJECT_ID && process.env.BYL_API_TOKEN && process.env.BYL_WEBHOOK_SECRET);
}

export async function createBylCheckout(input: CreateBylCheckout): Promise<BylCheckout> {
  const { projectId, apiToken } = bylConfig();
  const response = await fetch(`${BYL_API_URL}/projects/${encodeURIComponent(projectId)}/checkouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const body = await response.json().catch(() => null) as { data?: BylCheckout; message?: string } | null;
  if (!response.ok || !body?.data?.id || !body.data.url) throw new Error(body?.message || `BYL checkout үүсгэж чадсангүй (${response.status}).`);
  return body.data;
}

export function verifyBylWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.BYL_WEBHOOK_SECRET;
  if (!secret || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
