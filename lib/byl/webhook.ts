import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { bylPriceId, isBylTestMode, planForBylPrice } from "@/lib/byl/config";
import { addPlanPeriod, isPaidPlanCode, planByCode, type PaidPlanCode } from "@/lib/payments/plans";
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
  if (event.type === "checkout.completed") return processCheckoutCompleted(admin, event);
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

async function processCheckoutCompleted(admin: AdminClient, event: BylWebhookEvent) {
  const object = event.data.object;
  const checkoutId = integer(object.id);
  const orderId = stringValue(object.client_reference_id);
  const amountTotal = integerAmount(object.amount_total);
  const paymentMethod = nullableString(object.payment_method);
  if (!checkoutId || !uuid(orderId) || amountTotal === null || object.status !== "complete") throw new Error("BYL checkout payload хүчингүй байна.");

  const { data: order, error: orderError } = await admin.from("payment_orders")
    .select("id,user_id,plan_code,amount_mnt,status,provider_checkout_id")
    .eq("id", orderId)
    .eq("provider", "byl")
    .single();
  if (orderError || !order) throw new Error("BYL checkout-д харгалзах захиалга олдсонгүй.");
  if (order.provider_checkout_id !== checkoutId) throw new Error("BYL checkout захиалгын ID зөрж байна.");
  if (!isPaidPlanCode(order.plan_code)) throw new Error("BYL checkout багц танигдсангүй.");
  const planCode = order.plan_code;
  if (!validCheckoutAmount(planCode, amountTotal)) throw new Error("BYL checkout серверийн үнэтэй зөрж байна.");
  if (checkoutPriceId(object) !== bylPriceId(planCode)) throw new Error("BYL checkout price ID захиалгын багцтай зөрж байна.");

  if (order.status !== "paid") {
    const { error } = await admin.from("payment_orders").update({
      status: "paid",
      amount_mnt: amountTotal,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
    }).eq("id", order.id).neq("status", "paid");
    if (error) throw new Error(`Захиалга paid болгож чадсангүй: ${error.code}`);
  }

  // BYL may complete a recurring-price checkout as a one-time payment. In that
  // case there is no subscription event/id, so the paid checkout itself is the
  // stable entitlement identifier for the purchased month.
  if (object.mode === "payment" && object.subscription_id === null) {
    await grantCheckoutEntitlement(admin, event, object, { user_id: order.user_id, plan_code: planCode }, checkoutId);
  }
  return "processed" as const;
}

async function grantCheckoutEntitlement(
  admin: AdminClient,
  event: BylWebhookEvent,
  object: Record<string, unknown>,
  order: { user_id: string; plan_code: PaidPlanCode },
  checkoutId: number,
) {
  const customer = recordValue(object.customer);
  const customerId = customer && integer(customer.id);
  const customerUserId = customer && stringValue(customer.client_reference_id);
  if (!customerId || customerUserId !== order.user_id) throw new Error("BYL checkout customer захиалгын хэрэглэгчтэй зөрж байна.");

  // A pass bought while another is still running starts when the current one ends, so no paid days are lost.
  const paidAt = validDate(event.created_at) ? new Date(event.created_at) : new Date();
  const { data: current } = await admin.from("student_subscriptions").select("current_period_end").eq("user_id", order.user_id).in("status", ["trialing", "active"]).neq("provider_subscription_id", checkoutId).order("current_period_end", { ascending: false }).limit(1).maybeSingle();
  const currentEnd = current?.current_period_end ? new Date(current.current_period_end) : null;
  const periodStart = currentEnd && currentEnd > paidAt ? currentEnd : paidAt;
  const periodEnd = addPlanPeriod(periodStart, order.plan_code);

  const { error: cancelError } = await admin.from("student_subscriptions").update({
    status: "canceled",
    canceled_at: paidAt.toISOString(),
    provider_updated_at: event.updated_at ?? event.created_at,
  }).eq("user_id", order.user_id).in("status", ["trialing", "active", "past_due"]).neq("provider_subscription_id", checkoutId);
  if (cancelError) throw new Error(`Өмнөх subscription шинэчилж чадсангүй: ${cancelError.code}`);

  const { error } = await admin.from("student_subscriptions").upsert({
    user_id: order.user_id,
    provider: "byl",
    plan_code: order.plan_code,
    status: "active",
    provider_customer_id: customerId,
    provider_subscription_id: checkoutId,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    canceled_at: null,
    provider_updated_at: event.updated_at ?? event.created_at,
  }, { onConflict: "provider,provider_subscription_id" });
  if (error) throw new Error(`Checkout subscription хадгалж чадсангүй: ${error.code}`);
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
  const planCode = priceId && planForBylPrice(priceId);
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

function checkoutPriceId(object: Record<string, unknown>) {
  const items = Array.isArray(object.items) ? object.items : [];
  const firstItem = recordValue(items[0]);
  const price = firstItem && recordValue(firstItem.price);
  return price && integer(price.id);
}

function validCheckoutAmount(planCode: PaidPlanCode, amount: number) {
  return amount === planByCode[planCode].priceMnt || (isBylTestMode() && amount === 50);
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
function integerAmount(value: unknown) {
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
  if (typeof value !== "string" || !/^\d+(?:\.0+)?$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : null;
}
function uuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function validDate(value: string) { return Number.isFinite(Date.parse(value)); }
function nullableDate(value: unknown) { const date = nullableString(value); if (!date) return null; if (!validDate(date)) throw new Error("BYL огнооны утга хүчингүй байна."); return date; }
