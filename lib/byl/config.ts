import "server-only";

import { planByCode, type PaidPlanCode, type SubscriptionPlanCode } from "@/lib/payments/plans";

export function isBylTestMode() {
  return process.env.BYL_TEST_MODE === "true";
}

export function bylChargeAmount(planCode: PaidPlanCode) {
  return isBylTestMode() ? 50 : planByCode[planCode].priceMnt;
}

/** Env var holding each plan's numeric BYL price ID. Legacy plans stay mapped so their renewals still resolve. */
const PRICE_ENV: Record<SubscriptionPlanCode, string> = {
  weekly: "BYL_WEEKLY_PRICE_ID",
  monthly: "BYL_MONTHLY_PRICE_ID",
  quarterly: "BYL_QUARTERLY_PRICE_ID",
  standard_monthly: "BYL_STANDARD_PRICE_ID",
  mentor_monthly: "BYL_MENTOR_PRICE_ID",
};

export function bylPriceId(planCode: SubscriptionPlanCode): number | null {
  const value = Number(process.env[PRICE_ENV[planCode]]);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function planForBylPrice(priceId: number): SubscriptionPlanCode | null {
  const match = (Object.keys(PRICE_ENV) as SubscriptionPlanCode[]).find((code) => bylPriceId(code) === priceId);
  return match ?? null;
}
