import "server-only";

import { planByCode, type PlanCode } from "@/lib/payments/plans";

export function isBylTestMode() {
  return process.env.BYL_TEST_MODE === "true";
}

export function bylChargeAmount(planCode: Exclude<PlanCode, "free">) {
  return isBylTestMode() ? 50 : planByCode[planCode].priceMnt;
}
