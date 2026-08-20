export const PLAN_CODES = ["free", "standard_monthly", "mentor_monthly"] as const;

export type PlanCode = (typeof PLAN_CODES)[number];

export type Plan = {
  code: PlanCode;
  name: string;
  priceMnt: number;
  priceLabel: string;
  interval: "month" | null;
  featured?: boolean;
  items: readonly string[];
  cta: string;
};

export const plans: readonly Plan[] = [
  {
    code: "free",
    name: "Үнэгүй",
    priceMnt: 0,
    priceLabel: "₮0",
    interval: null,
    items: [
      "1 удаагийн бүтэн mock эсвэл ЭЕШ шалгалт",
      "Өдөрт 10 сэдэвчилсэн дасгал",
      "Хичээлийн хязгаартай танилцах эрх",
      "Шалгалтын дэлгэрэнгүй тайлангүй",
    ],
    cta: "Үнэгүй эхлэх",
  },
  {
    code: "standard_monthly",
    name: "Стандарт",
    priceMnt: 49_000,
    priceLabel: "₮49,000",
    interval: "month",
    featured: true,
    items: [
      "Бүх курс, хичээлд бүрэн эрх",
      "Бүх mock болон ЭЕШ шалгалт",
      "Хязгааргүй сэдэвчилсэн дасгал",
      "Шалгалтын дэлгэрэнгүй тайлан",
      "AI хувийн гүйцэтгэлийн анализ",
      "AI хувийн сургалтын хуваарь",
    ],
    cta: "Стандарт авах",
  },
  {
    code: "mentor_monthly",
    name: "Ментор+",
    priceMnt: 149_000,
    priceLabel: "₮149,000",
    interval: "month",
    items: [
      "Стандарт багцын бүх боломж",
      "7 хоног бүр 1:1 менторын уулзалт",
      "Ментороор хянуулсан хувийн төлөвлөгөө",
      "Асуулт, бодолтын priority шалгалт",
      "Сар бүр эцэг эхэд ахицын тайлан",
      "Priority чат дэмжлэг",
    ],
    cta: "Ментор+ авах",
  },
] as const;

export const paidPlans = plans.filter((plan) => plan.priceMnt > 0);

export const planByCode = Object.fromEntries(plans.map((plan) => [plan.code, plan])) as Record<PlanCode, Plan>;

export const FREE_FULL_EXAM_ATTEMPT_LIMIT = 1;

export function hasDetailedReports(planCode: PlanCode) {
  return planCode !== "free";
}

export function hasAllLearningContent(planCode: PlanCode) {
  return planCode !== "free";
}
