import "server-only";
import { ulaanbaatarWeekday, ulaanbaatarWeekStart } from "@/lib/ulaanbaatar-time";
import { z } from "zod";
import { aiErrorMessage, AI_MODEL, generateStructured, isAiConfigured } from "@/lib/ai/claude";
import { shouldClaim } from "@/lib/ai/claim";
import { AttemptAnalysisSchema } from "@/lib/ai/attempt-analysis";
import { daysUntil, examDate, goalFromProfile, goalIncludes, GOAL_COLUMNS, GRADE_LABELS } from "@/lib/goals";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import { hasPaidAccess } from "@/lib/payments/entitlement";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

export const WEEKDAYS = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"] as const;

export const StudyPlanSchema = z.object({
  focus: z.string().describe("Энэ 7 хоногийн гол зорилго, 1–2 өгүүлбэр"),
  days: z.array(z.object({
    day: z.enum(WEEKDAYS),
    minutes: z.number().int().describe("Тухайн өдөр суралцах минут, амралтын өдөр 0"),
    tasks: z.array(z.object({
      kind: z.enum(["lesson", "exercise", "mock", "review", "rest"]),
      title: z.string().describe("Богино гарчиг"),
      detail: z.string().describe("Юу хийхийг нэг өгүүлбэрээр"),
    })),
  })).describe("Даваагаас Ням хүртэл яг 7 өдөр, дарааллаар"),
  tips: z.array(z.string()).describe("2–3 богино зөвлөгөө"),
});
export type StudyPlan = z.infer<typeof StudyPlanSchema>;

export type PlanState =
  | { status: "unavailable" }
  | { status: "locked" }
  | { status: "pending" }
  | { status: "failed" }
  | { status: "ready"; plan: StudyPlan; weekStart: string };

const SYSTEM = `Та EzMath платформын математикийн багш. Монголын ЭЕШ болон SAT Math-д бэлдэж буй сурагчид 7 хоногийн суралцах төлөвлөгөө гаргана.
- Зөвхөн монгол хэлээр (кирилл), сурагчид "чи" гэж хандаж бич.
- Сурагчийн 7 хоногт зарцуулж чадах цагийг хэтрүүлж болохгүй. Долоо хоногт нэг өдрийг амралт эсвэл хөнгөн давталт болго.
- Сул сэдвүүдэд илүү цаг өг. Зөвхөн өгөгдсөн сэдэв, хичээл, сорилын нэрийг ашигла; байхгүй зүйл зохиож болохгүй.
- Бүтэн mock сорилыг 7 хоногт хамгийн ихдээ нэг удаа, ихэвчлэн амралтын өдөр төлөвлө.
- Даалгавар бүр тодорхой, хийж болохуйц байна.`;

/** Index of today (0 = Monday) in Ulaanbaatar. */
export const todayIndex = ulaanbaatarWeekday;

export async function readStudyPlan(userId: string): Promise<PlanState> {
  if (!isAiConfigured()) return { status: "unavailable" };
  if (!await hasPaidAccess(userId)) return { status: "locked" };
  const weekStart = ulaanbaatarWeekStart();
  const { data: row } = await createAdminClient().from("ai_study_plans").select("status, content").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();
  if (!row || row.status === "pending") return { status: "pending" };
  if (row.status === "failed") return { status: "failed" };
  const parsed = StudyPlanSchema.safeParse(row.content);
  return parsed.success ? { status: "ready", plan: parsed.data, weekStart } : { status: "failed" };
}

/** Generates this week's plan unless it is ready or in progress. Callers check the plan first; run inside `after()`. */
export async function generateStudyPlan(userId: string) {
  const admin = createAdminClient();
  const weekStart = ulaanbaatarWeekStart();
  const { data: existing } = await admin.from("ai_study_plans").select("status, updated_at").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();
  if (!shouldClaim(existing)) return;
  const now = new Date().toISOString();
  const claim = existing
    ? await admin.from("ai_study_plans").update({ status: "pending", error: null, updated_at: now }).eq("user_id", userId).eq("week_start", weekStart).eq("updated_at", existing.updated_at).select("user_id")
    : await admin.from("ai_study_plans").insert({ user_id: userId, week_start: weekStart, status: "pending", updated_at: now }).select("user_id");
  if (claim.error || !claim.data?.length) return;

  try {
    const plan = await generateStructured(StudyPlanSchema, SYSTEM, await buildPrompt(userId));
    // Keep the 7 days in order even if the model repeats or skips one.
    const days = WEEKDAYS.map((day) => plan.days.find((item) => item.day === day) ?? { day, minutes: 0, tasks: [] });
    await admin.from("ai_study_plans").update({ status: "ready", content: { ...plan, days } as unknown as Json, model: AI_MODEL, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("week_start", weekStart);
  } catch (error) {
    console.error("Study plan failed", { userId, error: aiErrorMessage(error) });
    await admin.from("ai_study_plans").update({ status: "failed", error: aiErrorMessage(error), updated_at: new Date().toISOString() }).eq("user_id", userId).eq("week_start", weekStart);
  }
}

async function buildPrompt(userId: string) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [{ data: profile }, { data: attempts }, { data: analyses }, { data: published }] = await Promise.all([
    admin.from("profiles").select(GOAL_COLUMNS).eq("id", userId).maybeSingle(),
    admin.from("test_attempts").select("id, test_id, score, completed_at").eq("user_id", userId).eq("status", "submitted").gte("completed_at", since).order("completed_at", { ascending: false }).limit(20),
    admin.from("ai_attempt_analyses").select("content").eq("user_id", userId).eq("status", "ready").order("created_at", { ascending: false }).limit(1),
    admin.from("tests").select("id, title, exam_type, test_type").eq("status", "published").in("test_type", ["full", "previous-year"]).order("created_at", { ascending: false }).limit(60),
  ]);
  const goal = goalFromProfile(profile);
  const attemptIds = (attempts ?? []).map((row) => row.id);
  const { data: answers } = attemptIds.length ? await admin.from("attempt_answers").select("question_id, is_correct").in("attempt_id", attemptIds) : { data: [] };
  const questionIds = [...new Set((answers ?? []).map((row) => row.question_id))];
  const { data: questions } = questionIds.length ? await admin.from("questions").select("id, topic").in("id", questionIds) : { data: [] };
  const topicOf = new Map((questions ?? []).map((row) => [row.id, row.topic?.trim() || "Бусад"]));
  const topics = new Map<string, { correct: number; total: number }>();
  for (const answer of answers ?? []) {
    const topic = topicOf.get(answer.question_id) ?? "Бусад";
    const t = topics.get(topic) ?? { correct: 0, total: 0 };
    t.total++; if (answer.is_correct) t.correct++;
    topics.set(topic, t);
  }
  const weakest = [...topics].filter(([, t]) => t.total >= 3).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).slice(0, 8);
  const tested = new Set((attempts ?? []).map((row) => row.test_id));
  const examsWanted = (["EYESH", "SAT"] as const).filter((exam) => !goal || goalIncludes(goal, exam));
  const untakenMocks = (published ?? []).filter((test) => examsWanted.includes(test.exam_type) && !tested.has(test.id)).slice(0, 6);
  const latestAnalysis = AttemptAnalysisSchema.safeParse(analyses?.[0]?.content);

  const goalLines = goal ? examsWanted.map((exam) => {
    const target = exam === "EYESH" ? goal.eyeshGoal : goal.satGoal;
    const date = examDate(goal, exam);
    return `- ${exam === "EYESH" ? "ЭЕШ математик (0–800)" : "SAT Math (200–800)"}: зорилго ${target ?? "тодорхойгүй"}${date ? `, шалгалт хүртэл ~${Math.max(0, daysUntil(date))} хоног` : ""}`;
  }) : ["- Зорилго тодорхойгүй"];

  return [
    "Сурагчийн мэдээлэл:",
    ...goalLines,
    `- Анги: ${goal?.grade ? GRADE_LABELS[goal.grade] : "тодорхойгүй"}`,
    `- 7 хоногт бэлдэж чадах цаг: ${goal?.weeklyStudyHours ? `~${goal.weeklyStudyHours} цаг` : "тодорхойгүй (~5 цаг гэж үз)"}`,
    "",
    attempts?.length ? `Сүүлийн 30 хоногт ${attempts.length} сорил өгсөн. Оноо (шинээс хуучин руу): ${attempts.map((row) => row.score).join(", ")}.` : "Сүүлийн 30 хоногт сорил өгөөгүй.",
    weakest.length ? ["Сул сэдвүүд (зөв / нийт):", ...weakest.map(([topic, t]) => `- ${topic}: ${t.correct} / ${t.total}`)].join("\n") : "Сэдвийн өгөгдөл хангалтгүй.",
    latestAnalysis.success ? `Сүүлийн сорилын дүгнэлт: ${latestAnalysis.data.summary} Анхаарах: ${latestAnalysis.data.weaknesses.map((w) => w.topic).join(", ")}.` : "",
    "",
    "EzMath дээрх хичээлийн бүлгүүд:",
    ...coreMathCourse.modules.map((main) => `- ${main.title}: ${main.submodules.map((sub) => sub.title).join(", ")}`),
    untakenMocks.length ? ["", "Өгөөгүй mock сорилууд:", ...untakenMocks.map((test) => `- ${test.title} (${test.exam_type === "EYESH" ? "ЭЕШ" : "SAT"})`)].join("\n") : "",
    "",
    "Энэ 7 хоногийн (Даваа–Ням) төлөвлөгөөг гарга.",
  ].filter((line) => line !== "").join("\n");
}
