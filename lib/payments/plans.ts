/** Plans on sale: same features, different length. */
export const PAID_PLAN_CODES = ["weekly", "monthly", "quarterly"] as const;
/** Earlier monthly plans, kept so existing subscriptions and payment history still resolve. */
export const LEGACY_PLAN_CODES = ["standard_monthly", "mentor_monthly"] as const;

export type PaidPlanCode = (typeof PAID_PLAN_CODES)[number];
export type SubscriptionPlanCode = PaidPlanCode | (typeof LEGACY_PLAN_CODES)[number];
/** "free" means the student has no current plan (limited access). It is not sold. */
export type PlanCode = "free" | SubscriptionPlanCode;

export type Plan = {
  code: PaidPlanCode;
  name: string;
  priceMnt: number;
  priceLabel: string;
  periodLabel: string;
  /** Length of access bought by one payment. */
  period: { days: number } | { months: number };
  featured?: boolean;
  cta: string;
};

/** Every paid plan includes all of these. */
export const PLAN_FEATURES = [
  "Бүх ЭЕШ ба SAT mock шалгалт",
  "Бүх онолын хичээл",
  "Хязгааргүй сэдэвчилсэн дасгал",
  "Шалгалтын дэлгэрэнгүй тайлан",
  "Mock бүрийн дараа AI дүн шинжилгээ",
  "7 хоног бүрийн AI сургалтын төлөвлөгөө",
] as const;

// The BYL price for each plan must charge exactly this amount, or the payment webhook rejects it.
export const plans: readonly Plan[] = [
  { code: "weekly", name: "7 хоног", priceMnt: 8_900, priceLabel: "₮8,900", periodLabel: "7 хоног", period: { days: 7 }, cta: "7 хоногийн эрх авах" },
  { code: "monthly", name: "1 сар", priceMnt: 14_900, priceLabel: "₮14,900", periodLabel: "сар", period: { months: 1 }, featured: true, cta: "1 сарын эрх авах" },
  { code: "quarterly", name: "3 сар", priceMnt: 29_900, priceLabel: "₮29,900", periodLabel: "3 сар", period: { months: 3 }, cta: "3 сарын эрх авах" },
];

export const planByCode = Object.fromEntries(plans.map((plan) => [plan.code, plan])) as Record<PaidPlanCode, Plan>;

export function isPaidPlanCode(value: string): value is PaidPlanCode {
  return (PAID_PLAN_CODES as readonly string[]).includes(value);
}

export function planName(code: PlanCode | string) {
  if (isPaidPlanCode(code)) return planByCode[code].name;
  if (code === "standard_monthly") return "Стандарт";
  if (code === "mentor_monthly") return "Ментор+";
  return "Багцгүй";
}

/** End of the access period that starts at `start` for one payment of `code`. */
export function addPlanPeriod(start: Date, code: SubscriptionPlanCode) {
  const end = new Date(start);
  const period = isPaidPlanCode(code) ? planByCode[code].period : { months: 1 };
  if ("days" in period) end.setUTCDate(end.getUTCDate() + period.days);
  else end.setUTCMonth(end.getUTCMonth() + period.months);
  return end;
}
