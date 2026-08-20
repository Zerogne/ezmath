import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCode } from "@/lib/payments/plans";
import { bylChargeAmount } from "@/lib/byl/config";
import type { BylWebhookEvent } from "@/lib/byl/types";
import type { Database, Json } from "@/lib/supabase/database.types";

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.renewed",
  "subscription.updated",
  "subscription.renewal_due",
  "subscription.past_due",
  "subscription.canceled",
]);

type AdminClient = SupabaseClient<Database>;
type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export function parseBylWebhook(rawBody: string): BylWebhookEvent | null {
  try {
    const value = JSON.parse(rawBody) as Partial<BylWebhookEvent>;
    if (!Number.isSafeInteger(value.id) || !Number.isSafeInteger(value.project_id) || typeof value.type !== "string" || typeof value.object !== "string" || !isRecord(value.data) || !isRecord(value.data.object) || typeof value.created_at !== "string") return null;
    return value as BylWebhookEvent;
  } catch {
    return null;
  }
}

export async function recordBylEvent(admin: AdminClient, event: BylWebhookEvent) {
  const { error } = await admin.from("payment_webhook_events").insert({
    provider_event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Json,
  });
  if (!error) return "new" as const;
  if (error.code !== "23505") throw new Error(`Webhook event хадгалж чадсангүй: ${error.code}`);

  const { data, error: readError } = await admin.from("payment_webhook_events")
    .select("processing_status")
    .eq("provider", "byl")
    .eq("provider_event_id", event.id)
    .single();
  if (readError) throw new Error(`Webhook event шалгаж чадсангүй: ${readError.code}`);
  return data.processing_status === "processed" || data.processing_status === "ignored" ? "done" as const : "retry" as const;
}

export async function processBylEvent(admin: AdminClient, event: BylWebhookEvent) {
  if (event.type === "checkout.completed") return processCheckoutCompleted(admin, event.data.object);
  if (SUBSCRIPTION_EVENTS.has(event.type)) return processSubscription(admin, event);
  return "ignored" as const;
}

export async function finishBylEvent(admin: AdminClient, eventId: number, status: "processed" | "ignored" | "failed", errorMessage?: string) {
  const { error } = await admin.from("payment_webhook_events").update({
    processing_status: status,
    processed_at: status === "failed" ? null : new Date().toISOString(),
    error_message: errorMessage?.slice(0, 1000) ?? null,
  }).eq("provider", "byl").eq("provider_event_id", eventId);
  if (error) throw new Error(`Webhook event төлөв шинэчилж чадсангүй: ${error.code}`);
}

async function processCheckoutCompleted(admin: AdminClient, object: Record<string, unknown>) {
  const checkoutId = integer(object.id);
  const orderId = stringValue(object.client_reference_id);
  const amountTotal = integer(object.amount_total);
  const paymentMethod = nullableString(object.payment_method);
  if (!checkoutId || !uuid(orderId) || amountTotal === null || object.status !== "complete") throw new Error("BYL checkout payload хүчингүй байна.");

  const { data: order, error: orderError } = await admin.from("payment_orders")
    .select("id,plan_code,amount_mnt,status,provider_checkout_id")
    .eq("id", orderId)
    .eq("provider", "byl")
    .single();
  if (orderError || !order) throw new Error("BYL checkout-д харгалзах захиалга олдсонгүй.");
  if (order.status === "paid") return "processed" as const;
  if (order.provider_checkout_id !== checkoutId || order.amount_mnt !== amountTotal) throw new Error("BYL checkout захиалгын дүн эсвэл ID зөрж байна.");
  if (order.plan_code !== "standard_monthly" && order.plan_code !== "mentor_monthly") throw new Error("BYL checkout багц танигдсангүй.");
  if (bylChargeAmount(order.plan_code) !== amountTotal) throw new Error("BYL checkout серверийн үнэтэй зөрж байна.");

  const { error } = await admin.from("payment_orders").update({
    status: "paid",
    payment_method: paymentMethod,
    paid_at: new Date().toISOString(),
  }).eq("id", order.id).neq("status", "paid");
  if (error) throw new Error(`Захиалга paid болгож чадсангүй: ${error.code}`);
  return "processed" as const;
}

async function processSubscription(admin: AdminClient, event: BylWebhookEvent) {
  const object = event.data.object;
  const subscriptionId = integer(object.id);
  const customer = recordValue(object.customer);
  const price = recordValue(object.price);
  const userId = customer && stringValue(customer.client_reference_id);
  const customerId = customer && integer(customer.id);
  const priceId = price && integer(price.id);
  const upstreamUpdatedAt = nullableString(object.updated_at) ?? event.updated_at ?? event.created_at;
  const status = subscriptionStatus(event.type, object.status);
  const planCode = priceId && planCodeForPrice(priceId);
  if (!subscriptionId || !uuid(userId) || !customerId || !planCode || !status || !validDate(upstreamUpdatedAt)) throw new Error("BYL subscription payload эсвэл price mapping хүчингүй байна.");

  const row = {
    user_id: userId,
    provider: "byl" as const,
    plan_code: planCode,
    status,
    provider_customer_id: customerId,
    provider_subscription_id: subscriptionId,
    current_period_start: nullableDate(object.current_period_start),
    current_period_end: nullableDate(object.current_period_end),
    canceled_at: event.type === "subscription.canceled" ? (nullableDate(object.canceled_at) ?? upstreamUpdatedAt) : nullableDate(object.canceled_at),
    provider_updated_at: upstreamUpdatedAt,
  };

  const { data: existing, error: existingError } = await admin.from("student_subscriptions")
    .select("provider_updated_at")
    .eq("provider", "byl")
    .eq("provider_subscription_id", subscriptionId)
    .maybeSingle();
  if (existingError) throw new Error(`Subscription шалгаж чадсангүй: ${existingError.code}`);
  if (existing && Date.parse(existing.provider_updated_at) > Date.parse(upstreamUpdatedAt)) return "ignored" as const;

  const { error } = await admin.from("student_subscriptions").upsert(row, { onConflict: "provider,provider_subscription_id" });
  if (error) throw new Error(`Subscription хадгалж чадсангүй: ${error.code}`);
  return "processed" as const;
}

function planCodeForPrice(priceId: number): Exclude<PlanCode, "free"> | null {
  if (String(priceId) === process.env.BYL_STANDARD_PRICE_ID) return "standard_monthly";
  if (String(priceId) === process.env.BYL_MENTOR_PRICE_ID) return "mentor_monthly";
  return null;
}

function subscriptionStatus(eventType: string, rawStatus: unknown): SubscriptionStatus | null {
  if (eventType === "subscription.canceled") return "canceled";
  if (eventType === "subscription.past_due") return "past_due";
  return rawStatus === "trialing" || rawStatus === "active" || rawStatus === "past_due" || rawStatus === "canceled" ? rawStatus : null;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function recordValue(value: unknown) { return isRecord(value) ? value : null; }
function stringValue(value: unknown) { return typeof value === "string" ? value : null; }
function nullableString(value: unknown) { return value === null || value === undefined ? null : stringValue(value); }
function integer(value: unknown) { return typeof value === "number" && Number.isSafeInteger(value) ? value : null; }
function uuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function validDate(value: string) { return Number.isFinite(Date.parse(value)); }
function nullableDate(value: unknown) { const date = nullableString(value); if (!date) return null; if (!validDate(date)) throw new Error("BYL огнооны утга хүчингүй байна."); return date; }
