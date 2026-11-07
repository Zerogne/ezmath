"use server";

import { redirect } from "next/navigation";
import { BylApiError, createBylCheckout, findBylCustomerByReference, upsertBylCustomer } from "@/lib/byl/server";
import { bylChargeAmount, bylPriceId } from "@/lib/byl/config";
import { isPaidPlanCode } from "@/lib/payments/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";


export async function startBylCheckout(formData: FormData) {
  const rawPlanCode = String(formData.get("planCode") ?? "");
  if (!isPaidPlanCode(rawPlanCode)) redirect("/pricing?payment=invalid-plan");
  const planCode = rawPlanCode;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect(`/login?next=${encodeURIComponent(`/pricing?plan=${planCode}`)}`);

  // Plans are fixed-length passes: buying again while one is active extends it (see grantCheckoutEntitlement).
  const admin = createAdminClient();

  const priceId = bylPriceId(planCode);
  if (!priceId) {
    console.error("BYL price ID missing for plan", { planCode });
    redirect("/pricing?payment=unavailable");
  }
  const appUrl = productionAppUrl();
  const { data: order, error: orderError } = await admin.from("payment_orders").insert({
    user_id: user.id,
    plan_code: planCode,
    amount_mnt: bylChargeAmount(planCode),
    status: "pending",
  }).select("id").single();
  if (orderError || !order) redirect("/pricing?payment=order-failed");

  let stage: "customer_lookup" | "customer_create" | "checkout" | "order_update" = "customer_lookup";
  try {
    let customer = await findBylCustomerByReference(user.id);
    if (!customer) {
      stage = "customer_create";
      customer = await upsertBylCustomer({ email: user.email, client_reference_id: user.id });
    }
    stage = "checkout";
    const checkout = await createBylCheckout({
      customer_id: customer.id,
      client_reference_id: order.id,
      items: [{ price_id: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?payment=processing`,
      cancel_url: `${appUrl}/pricing?payment=canceled`,
      email_collection: false,
      allow_promotion_codes: false,
    });
    stage = "order_update";
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
    console.error("BYL checkout creation failed", { orderId: order.id, planCode, stage, source: error instanceof BylApiError ? "byl_api" : "internal", httpStatus: error instanceof BylApiError ? error.status : undefined, providerCode: error instanceof BylApiError ? error.code : undefined, error: error instanceof Error ? error.message : "Unknown error" });
    redirect("/pricing?payment=checkout-failed");
  }
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
