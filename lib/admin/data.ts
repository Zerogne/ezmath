import "server-only";

import { getAdminIdentity } from "@/lib/admin/auth";
import type { ExamType, Test } from "@/types/exam";
import type { MaterialEditorData, MaterialQuestion } from "@/lib/admin/material-types";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: "student" | "admin";
  created_at: string;
};

type AuthUser = {
  id: string;
  email?: string;
  last_sign_in_at?: string;
};

type AttemptRow = {
  user_id: string;
  started_at: string;
  completed_at: string | null;
  tests: { exam_type: "SAT" | "EYESH" } | null;
};

export type AdminStudent = {
  id: string;
  name: string;
  email: string;
  joined: string;
  satAttempts: number;
  eyeshAttempts: number;
  lastActive: string;
  status: "active" | "inactive";
};

function adminConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin environment variables are not configured.");
  return { url, headers: { apikey: key, Authorization: `Bearer ${key}` } };
}

async function requireAdmin() {
  const identity = await getAdminIdentity();
  if (!identity) throw new Error("Admin authorization is required.");
}

async function request<T>(path: string): Promise<T> {
  const { url, headers } = adminConfig();
  const response = await fetch(`${url}${path}`, { headers, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.message ?? "Supabase admin data could not be loaded.");
  return body as T;
}

/** Row count via PostgREST's Content-Range header, without downloading the rows. */
async function count(path: string): Promise<number> {
  const { url, headers } = adminConfig();
  const response = await fetch(`${url}${path}`, { method: "HEAD", headers: { ...headers, Prefer: "count=exact" }, cache: "no-store" });
  if (!response.ok) throw new Error("Supabase admin data could not be loaded.");
  return Number(response.headers.get("content-range")?.split("/")[1]) || 0;
}

/** Starts the admin check alongside the data requests; the data is only returned once the check passes. */
async function asAdmin<T>(load: Promise<T>): Promise<T> {
  const [, data] = await Promise.all([requireAdmin(), load]);
  return data;
}

async function loadAdminData() {
  const [profiles, attempts, authResult] = await asAdmin(Promise.all([
    request<ProfileRow[]>("/rest/v1/profiles?select=id,full_name,role,created_at&order=created_at.desc"),
    request<AttemptRow[]>("/rest/v1/test_attempts?select=user_id,started_at,completed_at,tests(exam_type)"),
    request<{ users: AuthUser[] }>("/auth/v1/admin/users?page=1&per_page=1000"),
  ]));
  return { profiles, attempts, authUsers: authResult.users ?? [] };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("mn-MN", { dateStyle: "medium" }).format(new Date(value));
}

function formatLastActive(value?: string) {
  if (!value) return "Идэвхгүй";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "Өнөөдөр";
  if (days === 1) return "Өчигдөр";
  if (days < 7) return `${days} хоногийн өмнө`;
  return formatDate(value);
}

function toStudents(profiles: ProfileRow[], authUsers: AuthUser[], attempts: AttemptRow[]) {
  const authById = new Map(authUsers.map((user) => [user.id, user]));
  const attemptsByUser = new Map<string, AttemptRow[]>();
  for (const attempt of attempts) attemptsByUser.set(attempt.user_id, [...(attemptsByUser.get(attempt.user_id) ?? []), attempt]);

  return profiles.filter((profile) => profile.role === "student").map<AdminStudent>((profile) => {
    const authUser = authById.get(profile.id);
    const userAttempts = attemptsByUser.get(profile.id) ?? [];
    const lastAttempt = userAttempts.reduce<string | undefined>((latest, attempt) => {
      const candidate = attempt.completed_at ?? attempt.started_at;
      return !latest || candidate > latest ? candidate : latest;
    }, undefined);
    const lastActiveAt = authUser?.last_sign_in_at ?? lastAttempt;
    const active = Boolean(lastActiveAt && Date.now() - new Date(lastActiveAt).getTime() <= 30 * 86_400_000);
    return {
      id: profile.id,
      name: profile.full_name ?? "Нэргүй сурагч",
      email: authUser?.email ?? "—",
      joined: formatDate(profile.created_at),
      satAttempts: userAttempts.filter((attempt) => attempt.tests?.exam_type === "SAT").length,
      eyeshAttempts: userAttempts.filter((attempt) => attempt.tests?.exam_type === "EYESH").length,
      lastActive: formatLastActive(lastActiveAt),
      status: active ? "active" : "inactive",
    };
  });
}

export async function listAdminStudents() {
  const data = await loadAdminData();
  return toStudents(data.profiles, data.authUsers, data.attempts);
}

export async function getAdminStudent(studentId: string) {
  const id = encodeURIComponent(studentId);
  const [profiles, attempts, authUser] = await asAdmin(Promise.all([
    request<ProfileRow[]>(`/rest/v1/profiles?select=id,full_name,role,created_at&id=eq.${id}&limit=1`),
    request<AttemptRow[]>(`/rest/v1/test_attempts?select=user_id,started_at,completed_at,tests(exam_type)&user_id=eq.${id}`),
    request<AuthUser>(`/auth/v1/admin/users/${id}`).catch(() => undefined),
  ]));
  const profile = profiles[0];
  if (!profile || profile.role !== "student") return undefined;
  return toStudents([profile], authUser ? [authUser] : [], attempts)[0];
}

export async function getAdminDashboardData() {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [studentCount, newThisMonth, satMaterials, eyeshMaterials, paidPayments, recentProfiles] = await asAdmin(Promise.all([
    count("/rest/v1/profiles?role=eq.student"),
    count(`/rest/v1/profiles?role=eq.student&created_at=gte.${encodeURIComponent(monthStart.toISOString())}`),
    count("/rest/v1/tests?exam_type=eq.SAT"),
    count("/rest/v1/tests?exam_type=eq.EYESH"),
    request<{ amount_mnt: number }[]>("/rest/v1/payment_orders?select=amount_mnt&status=eq.paid"),
    request<ProfileRow[]>("/rest/v1/profiles?select=id,full_name,role,created_at&role=eq.student&order=created_at.desc&limit=5"),
  ]));
  const recentAuthUsers = await Promise.all(recentProfiles.map((profile) => request<AuthUser>(`/auth/v1/admin/users/${profile.id}`).catch(() => undefined)));
  return {
    studentCount,
    newThisMonth,
    satMaterials,
    eyeshMaterials,
    paidRevenueMnt: paidPayments.reduce((sum, payment) => sum + payment.amount_mnt, 0),
    paidCount: paidPayments.length,
    recentStudents: toStudents(recentProfiles, recentAuthUsers.filter((user): user is AuthUser => Boolean(user)), []),
  };
}

type PaymentOrderRow = {
  id: string;
  user_id: string;
  plan_code: string;
  amount_mnt: number;
  status: "pending" | "checkout_created" | "paid" | "expired" | "canceled" | "failed" | "refunded";
  provider_checkout_id: number | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
};

export type AdminPayment = {
  id: string;
  studentName: string;
  email: string;
  plan: string;
  amountMnt: number;
  status: PaymentOrderRow["status"];
  checkoutId: number | null;
  paymentMethod: string | null;
  createdAt: string;
  paidAt: string | null;
};

export async function getAdminPaymentsData() {
  const [orders, profiles, authResult, subscriptions] = await asAdmin(Promise.all([
    request<PaymentOrderRow[]>("/rest/v1/payment_orders?select=id,user_id,plan_code,amount_mnt,status,provider_checkout_id,payment_method,paid_at,created_at&order=created_at.desc&limit=200"),
    request<ProfileRow[]>("/rest/v1/profiles?select=id,full_name,role,created_at"),
    request<{ users: AuthUser[] }>("/auth/v1/admin/users?page=1&per_page=1000"),
    request<{ id: string }[]>("/rest/v1/student_subscriptions?select=id&status=in.(trialing,active)"),
  ]));
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const authById = new Map((authResult.users ?? []).map((user) => [user.id, user]));
  const payments: AdminPayment[] = orders.map((order) => ({
    id: order.id,
    studentName: profilesById.get(order.user_id)?.full_name ?? "Нэргүй сурагч",
    email: authById.get(order.user_id)?.email ?? "—",
    plan: order.plan_code === "mentor_monthly" ? "Ментор+" : order.plan_code === "standard_monthly" ? "Стандарт" : order.plan_code,
    amountMnt: order.amount_mnt,
    status: order.status,
    checkoutId: order.provider_checkout_id,
    paymentMethod: order.payment_method,
    createdAt: order.created_at,
    paidAt: order.paid_at,
  }));
  return {
    payments,
    paidRevenueMnt: payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amountMnt, 0),
    paidCount: payments.filter((payment) => payment.status === "paid").length,
    pendingCount: payments.filter((payment) => payment.status === "pending" || payment.status === "checkout_created").length,
    activeSubscriptions: subscriptions.length,
  };
}

type MaterialRow = {
  id: string;
  exam_type: ExamType;
  title: string;
  subject: string;
  year: number | null;
  duration_minutes: number;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  test_type: "full" | "practice" | "previous-year";
  status: "draft" | "published" | "archived";
  instructions: string | null;
  updated_at: string;
};

export type AdminMaterialListItem = Test & { status: "draft" | "published" | "archived"; updated: string };

export async function listAdminMaterials(examType: ExamType): Promise<AdminMaterialListItem[]> {
  const tests = await asAdmin(request<MaterialRow[]>(`/rest/v1/tests?select=id,exam_type,title,subject,year,duration_minutes,difficulty,test_type,status,instructions,updated_at&exam_type=eq.${examType}&order=updated_at.desc`));
  const testIds = tests.map((test) => test.id);
  const questions = testIds.length ? await request<{ test_id: string }[]>(`/rest/v1/questions?select=test_id&test_id=in.(${testIds.join(",")})`) : [];
  const counts = new Map<string, number>();
  for (const question of questions) counts.set(question.test_id, (counts.get(question.test_id) ?? 0) + 1);
  return tests.map((test) => ({
    id: test.id,
    title: test.title,
    description: test.instructions ?? "",
    examType: test.exam_type,
    subject: test.subject,
    year: test.year ?? undefined,
    questionCount: counts.get(test.id) ?? 0,
    durationMinutes: test.duration_minutes,
    difficulty: test.difficulty ?? undefined,
    type: test.test_type,
    status: test.status,
    updated: formatDate(test.updated_at),
  }));
}

export async function getAdminMaterial(testId: string): Promise<MaterialEditorData | undefined> {
  const [tests, questions] = await asAdmin(Promise.all([
    request<(MaterialRow & { variant: "A" | "B" | "C" | "D" | "E" | null })[]>(`/rest/v1/tests?select=id,exam_type,title,subject,year,variant,duration_minutes,difficulty,test_type,status,instructions,updated_at&id=eq.${encodeURIComponent(testId)}&limit=1`),
    request<{ id: string; test_id: string; question_number: number; question_text: string; question_type: string; response_fields: { id: string; label: string; acceptedAnswers: string[] }[]; image_url: string | null; topic: string | null; difficulty: "Easy" | "Medium" | "Hard" | null; explanation: string | null }[]>(`/rest/v1/questions?select=id,test_id,question_number,question_text,question_type,response_fields,image_url,topic,difficulty,explanation&test_id=eq.${encodeURIComponent(testId)}&order=question_number`),
  ]));
  const test = tests[0];
  if (!test) return undefined;
  const questionIds = questions.map((question) => question.id);
  const [choices, responseAnswers] = questionIds.length ? await Promise.all([
    request<{ id: string; question_id: string; label: string; text: string; image_url: string | null; is_correct: boolean; sort_order: number }[]>(`/rest/v1/answer_choices?select=id,question_id,label,text,image_url,is_correct,sort_order&question_id=in.(${questionIds.join(",")})&order=sort_order`),
    request<{ question_id: string; field_id: string; accepted_answers: string[] }[]>(`/rest/v1/question_response_answers?select=question_id,field_id,accepted_answers&question_id=in.(${questionIds.join(",")})`),
  ]) : [[], []];
  const editorQuestions: MaterialQuestion[] = questions.map((question) => {
    const questionChoices = choices.filter((choice) => choice.question_id === question.id);
    return {
      id: question.id,
      text: question.question_text,
      imageUrl: question.image_url ?? "",
      questionType: question.question_type === "multi-blank" ? "multi-blank" : "multiple-choice",
      responseFields: Array.isArray(question.response_fields) ? question.response_fields.map((field) => ({ id: field.id, label: field.label, acceptedAnswers: responseAnswers.find((answer) => answer.question_id === question.id && answer.field_id === field.id)?.accepted_answers ?? [] })) : [],
      choices: questionChoices.map((choice) => ({ id: choice.id, label: choice.label, text: choice.text, imageUrl: choice.image_url ?? "" })),
      correctAnswer: questionChoices.find((choice) => choice.is_correct)?.label ?? "",
      explanation: question.explanation ?? "",
      topic: question.topic ?? "",
      difficulty: question.difficulty ?? "Medium",
    };
  });
  return {
    id: test.id,
    examType: test.exam_type,
    title: test.title,
    subject: test.subject,
    year: test.year ?? undefined,
    variant: test.variant ?? undefined,
    durationMinutes: test.duration_minutes,
    type: test.test_type,
    status: test.status,
    description: test.instructions ?? "",
    questions: editorQuestions,
  };
}
