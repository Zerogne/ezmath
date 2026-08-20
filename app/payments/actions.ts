"use server";

import { redirect } from "next/navigation";
import { createBylCheckout, upsertBylCustomer } from "@/lib/byl/server";
import { paidPlans, type PlanCode } from "@/lib/payments/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const paidPlanCodes = new Set<PlanCode>(paidPlans.map((plan) => plan.code));

export async function startBylCheckout(formData: FormData) {
  const rawPlanCode = String(formData.get("planCode") ?? "");
  if (!paidPlanCodes.has(rawPlanCode as PlanCode)) redirect("/?payment=invalid-plan#pricing");
  const planCode = rawPlanCode as Exclude<PlanCode, "free">;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect(`/login?next=${encodeURIComponent(`/?plan=${planCode}#pricing`)}`);

  const admin = createAdminClient();
  const [{ data: profile }, { data: existingSubscription }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    admin.from("student_subscriptions").select("plan_code,status").eq("user_id", user.id).in("status", ["trialing", "active", "past_due"]).maybeSingle(),
  ]);
  if (existingSubscription?.plan_code === planCode) redirect("/dashboard?payment=already-subscribed");

  const plan = paidPlans.find((candidate) => candidate.code === planCode)!;
  const priceId = priceIdForPlan(planCode);
  const appUrl = productionAppUrl();
  const { data: order, error: orderError } = await admin.from("payment_orders").insert({
    user_id: user.id,
    plan_code: planCode,
    amount_mnt: plan.priceMnt,
    status: "pending",
  }).select("id").single();
  if (orderError || !order) redirect("/?payment=order-failed#pricing");

  try {
    const customer = await upsertBylCustomer({
      email: user.email,
      name: profile?.full_name?.trim() || undefined,
      client_reference_id: user.id,
    });
    const checkout = await createBylCheckout({
      customer_id: customer.id,
      client_reference_id: order.id,
      items: [{ price_id: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?payment=processing`,
      cancel_url: `${appUrl}/?payment=canceled#pricing`,
      email_collection: false,
      allow_promotion_codes: false,
    });
    const { error: updateError } = await admin.from("payment_orders").update({
      status: "checkout_created",
      provider_checkout_id: checkout.id,
      checkout_url: checkout.url,
    }).eq("id", order.id).eq("user_id", user.id);
    if (updateError) throw new Error(`Checkout хадгалж чадсангүй: ${updateError.code}`);
    redirect(checkout.url);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    await admin.from("payment_orders").update({ status: "failed" }).eq("id", order.id).eq("user_id", user.id);
    console.error("BYL checkout creation failed", { orderId: order.id, planCode, error: error instanceof Error ? error.message : "Unknown error" });
    redirect("/?payment=checkout-failed#pricing");
  }
}

function priceIdForPlan(planCode: Exclude<PlanCode, "free">) {
  const raw = planCode === "standard_monthly" ? process.env.BYL_STANDARD_PRICE_ID : process.env.BYL_MENTOR_PRICE_ID;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${planCode} BYL price ID тохируулагдаагүй байна.`);
  return value;
}

function productionAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) throw new Error("NEXT_PUBLIC_APP_URL тохируулагдаагүй байна.");
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("Production app URL HTTPS байх ёстой.");
  return url.origin;
}

function isRedirectError(error: unknown): error is Error & { digest: string } {
  return error instanceof Error && "digest" in error && typeof (error as { digest?: unknown }).digest === "string" && (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");
}
