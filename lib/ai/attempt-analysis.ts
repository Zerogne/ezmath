import "server-only";
import { z } from "zod";
import { aiErrorMessage, AI_MODEL, generateStructured, isAiConfigured } from "@/lib/ai/claude";
import { shouldClaim } from "@/lib/ai/claim";
import { daysUntil, examDate, goalFromProfile, GOAL_COLUMNS } from "@/lib/goals";
import { hasPaidAccess } from "@/lib/payments/entitlement";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

export const AttemptAnalysisSchema = z.object({
  summary: z.string().describe("2–3 өгүүлбэрт багтсан ерөнхий дүгнэлт"),
  strengths: z.array(z.string()).describe("1–3 сайн тал, тодорхой сэдвийн нэртэй"),
  weaknesses: z.array(z.object({
    topic: z.string().describe("Сэдвийн нэр, өгөгдлөөс яг хуулж бичнэ"),
    issue: z.string().describe("Юу буруу байгааг нэг өгүүлбэрээр"),
    action: z.string().describe("Сайжруулах нэг тодорхой алхам"),
  })).describe("Хамгийн их оноо алдсан 2–4 сэдэв"),
  timeManagement: z.string().describe("Цагийн зарцуулалтын талаар нэг өгүүлбэр"),
  goalOutlook: z.string().describe("Зорилтот оноо хүртэлх зай, хугацааны талаар 1–2 өгүүлбэр"),
  nextSteps: z.array(z.string()).describe("Дараагийн 7 хоногт хийх 3–4 алхам"),
});
export type AttemptAnalysis = z.infer<typeof AttemptAnalysisSchema>;

export type AnalysisState =
  | { status: "unavailable" }
  | { status: "locked" }
  | { status: "pending" }
  | { status: "failed" }
  | { status: "ready"; analysis: AttemptAnalysis };

const SYSTEM = `Та EzMath платформын математикийн багш. Монголын ЭЕШ болон SAT Math-д бэлдэж буй сурагчийн шалгалтын үр дүнд дүн шинжилгээ хийнэ.
- Зөвхөн монгол хэлээр (кирилл), сурагчид "чи" гэж хандаж, урам өгсөн боловч шударга бич.
- Зөвхөн өгөгдсөн тоо баримт дээр тулгуурла. Байхгүй сэдэв, асуулт, тоо зохиож болохгүй.
- Сэдвийн нэрийг өгөгдлөөс яг хуулж бич.
- Богино, тодорхой өгүүлбэр ашигла. Ерөнхий зөвлөгөө ("илүү их хичээ") бус, хийж болох алхам санал болго.`;

/** Mocks are full and previous-year tests; practice sets get no AI analysis. */
function isMock(testType: string) { return testType === "full" || testType === "previous-year"; }

/** Current state for the attempt's owner. Never starts a generation. */
export async function readAttemptAnalysis(userId: string, attemptId: string): Promise<AnalysisState> {
  const admin = createAdminClient();
  const { data: attempt } = await admin.from("test_attempts").select("id, user_id, test_id, status").eq("id", attemptId).maybeSingle();
  if (!attempt || attempt.user_id !== userId || attempt.status !== "submitted") return { status: "unavailable" };
  const { data: test } = await admin.from("tests").select("test_type").eq("id", attempt.test_id).maybeSingle();
  if (!test || !isMock(test.test_type) || !isAiConfigured()) return { status: "unavailable" };
  if (!await hasPaidAccess(userId)) return { status: "locked" };
  const { data: row } = await admin.from("ai_attempt_analyses").select("status, content").eq("attempt_id", attemptId).maybeSingle();
  if (!row || row.status === "pending") return { status: "pending" };
  if (row.status === "failed") return { status: "failed" };
  const parsed = AttemptAnalysisSchema.safeParse(row.content);
  return parsed.success ? { status: "ready", analysis: parsed.data } : { status: "failed" };
}

/**
 * Generates the analysis unless one is ready or already being generated.
 * Callers check ownership, plan and test type first (see readAttemptAnalysis); run it inside `after()`.
 */
export async function generateAttemptAnalysis(userId: string, attemptId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("ai_attempt_analyses").select("status, updated_at").eq("attempt_id", attemptId).maybeSingle();
  if (!shouldClaim(existing)) return;
  const now = new Date().toISOString();
  const claim = existing
    ? await admin.from("ai_attempt_analyses").update({ status: "pending", error: null, updated_at: now }).eq("attempt_id", attemptId).eq("updated_at", existing.updated_at).select("attempt_id")
    : await admin.from("ai_attempt_analyses").insert({ attempt_id: attemptId, user_id: userId, status: "pending", updated_at: now }).select("attempt_id");
  // Lost the race to another request (unique conflict or a changed row): that request generates it.
  if (claim.error || !claim.data?.length) return;

  try {
    const prompt = await buildPrompt(userId, attemptId);
    const analysis = await generateStructured(AttemptAnalysisSchema, SYSTEM, prompt);
    await admin.from("ai_attempt_analyses").update({ status: "ready", content: analysis as unknown as Json, model: AI_MODEL, updated_at: new Date().toISOString() }).eq("attempt_id", attemptId);
  } catch (error) {
    console.error("Attempt analysis failed", { attemptId, error: aiErrorMessage(error) });
    await admin.from("ai_attempt_analyses").update({ status: "failed", error: aiErrorMessage(error), updated_at: new Date().toISOString() }).eq("attempt_id", attemptId);
  }
}

async function buildPrompt(userId: string, attemptId: string) {
  const admin = createAdminClient();
  const { data: attempt } = await admin.from("test_attempts").select("test_id, score, duration_seconds, completed_at").eq("id", attemptId).single();
  if (!attempt) throw new Error("Attempt not found");
  const [{ data: test }, { data: answers }, { data: profile }] = await Promise.all([
    admin.from("tests").select("id, title, exam_type, duration_minutes").eq("id", attempt.test_id).single(),
    admin.from("attempt_answers").select("question_id, is_correct").eq("attempt_id", attemptId),
    admin.from("profiles").select(GOAL_COLUMNS).eq("id", userId).maybeSingle(),
  ]);
  if (!test) throw new Error("Test not found");
  const { data: questions } = await admin.from("questions").select("id, question_number, topic, difficulty").eq("test_id", test.id).order("question_number");
  const { data: history } = await admin.from("test_attempts").select("id, test_id, score, completed_at").eq("user_id", userId).eq("status", "submitted").not("score", "is", null).order("completed_at", { ascending: false }).limit(20);
  const historyTestIds = [...new Set((history ?? []).map((row) => row.test_id))];
  const { data: historyTests } = historyTestIds.length ? await admin.from("tests").select("id, exam_type").in("id", historyTestIds) : { data: [] };
  const examOf = new Map((historyTests ?? []).map((row) => [row.id, row.exam_type]));
  const previous = (history ?? []).filter((row) => row.id !== attemptId && examOf.get(row.test_id) === test.exam_type).slice(0, 5);

  const outcome = new Map((answers ?? []).map((row) => [row.question_id, row.is_correct === null ? "хариулаагүй" : row.is_correct ? "зөв" : "буруу"]));
  const topics = new Map<string, { correct: number; wrong: number; blank: number }>();
  const difficulty = new Map<string, { correct: number; total: number }>();
  for (const question of questions ?? []) {
    const result = outcome.get(question.id) ?? "хариулаагүй";
    const topic = question.topic?.trim() || "Бусад";
    const t = topics.get(topic) ?? { correct: 0, wrong: 0, blank: 0 };
    if (result === "зөв") t.correct++; else if (result === "буруу") t.wrong++; else t.blank++;
    topics.set(topic, t);
    if (question.difficulty) {
      const d = difficulty.get(question.difficulty) ?? { correct: 0, total: 0 };
      d.total++; if (result === "зөв") d.correct++;
      difficulty.set(question.difficulty, d);
    }
  }
  const goal = goalFromProfile(profile);
  const exam = test.exam_type;
  const target = exam === "EYESH" ? goal?.eyeshGoal : goal?.satGoal;
  const date = goal ? examDate(goal, exam) : null;
  const total = questions?.length ?? 0;
  const correct = [...topics.values()].reduce((sum, t) => sum + t.correct, 0);
  const blank = [...topics.values()].reduce((sum, t) => sum + t.blank, 0);

  return [
    `Шалгалт: ${test.title} (${exam === "EYESH" ? "ЭЕШ математик, 0–800 оноо" : "SAT Math, 200–800 оноо"})`,
    `Оноо: ${attempt.score} / 800. Зөв ${correct}/${total}, хариулаагүй ${blank}.`,
    `Хугацаа: ${Math.round((attempt.duration_seconds ?? 0) / 60)} минут зарцуулсан, нийт ${test.duration_minutes} минут.`,
    target ? `Зорилтот оноо: ${target}.${date ? ` Шалгалт хүртэл ойролцоогоор ${Math.max(0, daysUntil(date))} хоног.` : ""}` : "Зорилтот оноо тодорхойгүй.",
    previous.length ? `Өмнөх ${exam === "EYESH" ? "ЭЕШ" : "SAT"} сорилын оноо (шинээс хуучин руу): ${previous.map((row) => row.score).join(", ")}.` : "Өмнөх сорил байхгүй — энэ анхны сорил.",
    "",
    "Сэдэв тус бүрээр (зөв / буруу / хариулаагүй):",
    ...[...topics].map(([topic, t]) => `- ${topic}: ${t.correct} / ${t.wrong} / ${t.blank}`),
    ...(difficulty.size ? ["", "Хүндийн түвшнээр (зөв / нийт):", ...[...difficulty].map(([level, d]) => `- ${level === "Easy" ? "Хялбар" : level === "Medium" ? "Дунд" : "Хүнд"}: ${d.correct} / ${d.total}`)] : []),
    "",
    "Энэ сорилын дүн шинжилгээг гарга.",
  ].join("\n");
}
