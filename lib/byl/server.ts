import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { BylCheckout, BylCustomer, CreateBylCheckout, CreateBylCustomer } from "@/lib/byl/types";

const BYL_API_URL = "https://byl.mn/api/v1";

export class BylApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "BylApiError";
  }
}

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
  const body = await response.json().catch(() => null) as { data?: BylCheckout; message?: string; error?: string } | null;
  if (!response.ok || !body?.data?.id || !body.data.url) throw new BylApiError(body?.message || "BYL checkout үүсгэж чадсангүй.", response.status, body?.error);
  return body.data;
}

export async function upsertBylCustomer(input: CreateBylCustomer): Promise<BylCustomer> {
  const { projectId, apiToken } = bylConfig();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${BYL_API_URL}/projects/${encodeURIComponent(projectId)}/customers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}`, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const body = await response.json().catch(() => null) as { data?: BylCustomer; message?: string; error?: string } | null;
    if (response.ok && body?.data?.id) return body.data;
    if (response.status >= 500 && attempt === 0) continue;
    throw new BylApiError(body?.message || "BYL customer үүсгэж чадсангүй.", response.status, body?.error);
  }
  throw new BylApiError("BYL customer үүсгэж чадсангүй.", 500);
}

export async function findBylCustomerByReference(clientReferenceId: string): Promise<BylCustomer | null> {
  const { projectId, apiToken } = bylConfig();
  const response = await fetch(`${BYL_API_URL}/projects/${encodeURIComponent(projectId)}/customers/by-client-reference-id/${encodeURIComponent(clientReferenceId)}`, {
    headers: { Authorization: `Bearer ${apiToken}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 404) return null;
  const body = await response.json().catch(() => null) as { data?: BylCustomer; message?: string; error?: string } | null;
  if (!response.ok || !body?.data?.id) throw new BylApiError(body?.message || "BYL customer хайж чадсангүй.", response.status, body?.error);
  return body.data;
}

export function verifyBylWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.BYL_WEBHOOK_SECRET;
  if (!secret || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
