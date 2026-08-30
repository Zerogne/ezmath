import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/auth";
import type { MaterialEditorData, MaterialQuestion } from "@/lib/admin/material-types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ExamType, TestType } from "@/types/exam";

export const runtime = "nodejs";
export const maxDuration = 300;

type Provider = "openai" | "anthropic" | "gemini" | "nvidia";

const defaults: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
  gemini: "gemini-2.5-flash",
  nvidia: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
};

function extractionPrompt(examType: ExamType, layoutJson: string) {
  return `Convert this ${examType} exam PDF into editable JSON. You are a transcription and layout parser only. Never solve a question, infer a correct answer, or copy an answer key. Preserve Mongolian Cyrillic, passages, math, and LaTeX. Remove printed question numbers. Normalize Cyrillic option labels А/Б/В/Г/Д to Latin A/B/C/D/E.

Coordinates are normalized PDF page coordinates [x0,y0,x1,y1], each from 0 to 1. Return a tight imageBox for every diagram, graph, table, formula-as-image, or other visual required by a question. If an answer option is an image, leave its text empty and return its own tight imageBox. Do not use a full-page box.

For ordinary choices use questionType "multiple-choice". For EYESH part 2 written/fill questions use "multi-blank" and return every printed answer field label exactly (examples: af, bg, abc) in responseFields. These labels remain editable. Do not provide accepted answers.

Return ONLY valid JSON:
{"title":"string","subject":"string","year":2026,"durationMinutes":35,"type":"practice","description":"string","questions":[{"questionType":"multiple-choice","text":"string","pageNumber":1,"imageBox":null,"choices":[{"label":"A","text":"string","imageBox":null}],"responseFields":[],"explanation":"","topic":"string","difficulty":"Medium"}]}
Allowed type: full, practice, previous-year. Allowed difficulty: Easy, Medium, Hard. A multiple-choice question needs at least two choices whose text or imageBox is present. A multi-blank question needs at least one responseFields item shaped {"label":"af"}.

PyMuPDF4LLM extracted the following native structured layout JSON. Treat it as the primary source for reading order, text, tables, formulas, picture regions, page numbers, and bounding boxes. Use the attached PDF only to resolve ambiguity. Convert absolute PyMuPDF4LLM bounding boxes to normalized page coordinates for imageBox.

PYMUPDF4LLM_LAYOUT_JSON:
${layoutJson}`;
}

function apiError(provider: Provider, status: number, body: unknown) {
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const nested = record.error && typeof record.error === "object" ? record.error as Record<string, unknown> : {};
  const message = typeof nested.message === "string" ? nested.message : typeof record.message === "string" ? record.message : `HTTP ${status}`;
  return `${provider} API: ${message}`;
}

async function requestJson(provider: Provider, apiKey: string, model: string, prompt: string, pdfBase64: string, pdfText: string, filename: string) {
  let response: Response;
  if (provider === "openai") {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: [{ role: "user", content: [{ type: "input_file", filename, file_data: `data:application/pdf;base64,${pdfBase64}` }, { type: "input_text", text: prompt }] }], temperature: 0.1 }),
    });
  } else if (provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 32000, temperature: 0.1, messages: [{ role: "user", content: [{ type: "text", text: prompt }] }] }),
    });
  } else if (provider === "gemini") {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: "application/pdf", data: pdfBase64 } }, { text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
  } else {
    response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: `${prompt}\n\nPDF TEXT:\n${pdfText}` }], max_tokens: 32000, temperature: 0.1 }),
    });
  }
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(apiError(provider, response.status, body));
  if (provider === "openai") {
    if (typeof body.output_text === "string") return body.output_text;
    const output = Array.isArray(body.output) ? body.output : [];
    for (const item of output) for (const content of Array.isArray((item as Record<string, unknown>).content) ? (item as Record<string, unknown>).content as unknown[] : []) {
      const text = (content as Record<string, unknown>).text;
      if (typeof text === "string") return text;
    }
  }
  if (provider === "anthropic") {
    const content = Array.isArray(body.content) ? body.content : [];
    const block = content.find((item) => (item as Record<string, unknown>).type === "text") as Record<string, unknown> | undefined;
    if (typeof block?.text === "string") return block.text;
  }
  if (provider === "gemini") {
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];
    const content = candidates[0] && typeof candidates[0] === "object" ? (candidates[0] as Record<string, unknown>).content as Record<string, unknown> : undefined;
    const parts = Array.isArray(content?.parts) ? content.parts : [];
    const text = parts[0] && typeof parts[0] === "object" ? (parts[0] as Record<string, unknown>).text : undefined;
    if (typeof text === "string") return text;
  }
  if (provider === "nvidia") {
    const choices = Array.isArray(body.choices) ? body.choices : [];
    const message = choices[0] && typeof choices[0] === "object" ? (choices[0] as Record<string, unknown>).message as Record<string, unknown> : undefined;
    if (typeof message?.content === "string") return message.content;
  }
  throw new Error(`${provider} API returned no text.`);
}

function parseJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(cleaned) as Record<string, unknown>; } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    throw new Error("AI хариултыг JSON хэлбэрээр уншиж чадсангүй.");
  }
}

function stringValue(value: unknown, fallback = "") { return typeof value === "string" ? value.trim() : fallback; }

function normalize(raw: Record<string, unknown>, examType: ExamType, filename: string, assets: Record<string, string>, selectedYear?: number, selectedVariant?: "A" | "B" | "C" | "D"): MaterialEditorData {
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions.slice(0, 200) : [];
  const questions: MaterialQuestion[] = rawQuestions.flatMap((item, questionIndex) => {
    if (!item || typeof item !== "object") return [];
    const question = item as Record<string, unknown>;
    const rawChoices = Array.isArray(question.choices) ? question.choices : [];
    const choices = rawChoices.flatMap((choice, index) => {
      if (!choice || typeof choice !== "object") return [];
      const record = choice as Record<string, unknown>;
      const text = stringValue(record.text);
      const imageUrl = assets[`q-${questionIndex}-c-${index}`] ?? "";
      if (!text && !imageUrl) return [];
      return [{ id: randomUUID(), label: stringValue(record.label, String.fromCharCode(65 + index)).slice(0, 5), text, imageUrl }];
    });
    const text = stringValue(question.text);
    const questionType = question.questionType === "multi-blank" ? "multi-blank" : "multiple-choice";
    const responseFields = (Array.isArray(question.responseFields) ? question.responseFields : []).flatMap((field) => {
      const label = field && typeof field === "object" ? stringValue((field as Record<string, unknown>).label) : "";
      return label ? [{ id: randomUUID(), label, acceptedAnswers: [] }] : [];
    });
    if (!text || (questionType === "multiple-choice" ? choices.length < 2 : responseFields.length < 1)) return [];
    const difficulty = ["Easy", "Medium", "Hard"].includes(stringValue(question.difficulty)) ? stringValue(question.difficulty) as MaterialQuestion["difficulty"] : "Medium";
    return [{ id: randomUUID(), text, imageUrl: assets[`q-${questionIndex}`] ?? "", questionType, responseFields, choices: questionType === "multiple-choice" ? choices : [], correctAnswer: "", explanation: stringValue(question.explanation), topic: stringValue(question.topic), difficulty }];
  });
  if (!questions.length) throw new Error("PDF-ээс хүчинтэй асуулт олдсонгүй.");
  const type = ["full", "practice", "previous-year"].includes(stringValue(raw.type)) ? stringValue(raw.type) as TestType : examType === "SAT" ? "practice" : "previous-year";
  const duration = Number(raw.durationMinutes);
  const year = Number(raw.year);
  return {
    examType,
    title: stringValue(raw.title, filename.replace(/\.pdf$/i, "")),
    subject: stringValue(raw.subject, examType === "SAT" ? "Math" : "Математик"),
    year: examType === "EYESH" ? selectedYear ?? (year >= 2006 && year <= 2026 ? year : 2026) : undefined,
    variant: examType === "EYESH" ? selectedVariant ?? "A" : undefined,
    durationMinutes: Number.isInteger(duration) && duration > 0 && duration <= 600 ? duration : 35,
    type,
    status: "draft",
    description: stringValue(raw.description),
    questions,
  };
}

function imageRegions(raw: Record<string, unknown>) {
  const questions = Array.isArray(raw.questions) ? raw.questions : [];
  return questions.flatMap((item, questionIndex) => {
    if (!item || typeof item !== "object") return [];
    const question = item as Record<string, unknown>;
    const page = Number(question.pageNumber);
    if (!Number.isInteger(page) || page < 1) return [];
    const regions: { id: string; pageNumber: number; box: number[] }[] = [];
    if (validBox(question.imageBox)) regions.push({ id: `q-${questionIndex}`, pageNumber: page, box: question.imageBox as number[] });
    for (const [choiceIndex, choice] of (Array.isArray(question.choices) ? question.choices : []).entries()) {
      if (choice && typeof choice === "object" && validBox((choice as Record<string, unknown>).imageBox)) regions.push({ id: `q-${questionIndex}-c-${choiceIndex}`, pageNumber: page, box: (choice as Record<string, unknown>).imageBox as number[] });
    }
    return regions;
  });
}

function validBox(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 4 && value.every((item) => typeof item === "number" && item >= 0 && item <= 1) && value[0] < value[2] && value[1] < value[3];
}

async function ensureImageBucket() {
  const admin = createAdminClient();
  const { data } = await admin.storage.getBucket("exam-question-images");
  if (data) {
    await admin.storage.updateBucket("exam-question-images", { public: true, allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"], fileSizeLimit: 10 * 1024 * 1024 });
    return admin;
  }
  const { error } = await admin.storage.createBucket("exam-question-images", {
    public: true,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    fileSizeLimit: 10 * 1024 * 1024,
  });
  if (error && !error.message.toLowerCase().includes("already")) throw new Error("Асуултын зургийн санг үүсгэж чадсангүй.");
  return admin;
}

async function extractAndUploadImages(request: Request, file: File, raw: Record<string, unknown>) {
  const regions = imageRegions(raw);
  if (!regions.length) return {};
  await ensureImageBucket();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Image extractor тохиргоо дутуу байна.");
  const form = new FormData();
  form.set("file", file);
  form.set("regions", JSON.stringify(regions));
  form.set("upload_prefix", randomUUID());
  const response = await fetch(new URL("/api/pdf_extract", request.url), { method: "POST", headers: { "x-extractor-secret": secret }, body: form });
  const body = await response.json().catch(() => ({})) as { assets?: Record<string, string>; detail?: string };
  if (!response.ok) throw new Error(body.detail ?? "PDF зургийг Python extractor-аар задлаж чадсангүй.");
  return body.assets ?? {};
}

async function extractLayout(request: Request, file: File) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("PyMuPDF4LLM extractor тохиргоо дутуу байна.");
  const form = new FormData();
  form.set("file", file);
  form.set("action", "layout");
  const response = await fetch(new URL("/api/pdf_extract", request.url), { method: "POST", headers: { "x-extractor-secret": secret }, body: form });
  const body = await response.json().catch(() => ({})) as { layout?: unknown; detail?: string };
  if (!response.ok || !body.layout) throw new Error(body.detail ?? "PyMuPDF4LLM PDF бүтцийг уншиж чадсангүй.");
  const serialized = JSON.stringify(body.layout);
  if (serialized.length > 600_000) throw new Error("PDF-ийн бүтэц Claude Haiku-ийн нэг хүсэлтэд хэт том байна. PDF-ийг жижиг хэсгүүдэд хувааж импортлоно уу.");
  return serialized;
}

export async function POST(request: Request) {
  if (!await getAdminIdentity()) return NextResponse.json({ error: "Админ эрх шаардлагатай." }, { status: 403 });
  let stage = "request";
  try {
    const form = await request.formData();
    const provider = stringValue(form.get("provider")) as Provider;
    const submittedApiKey = stringValue(form.get("apiKey"));
    const model = stringValue(form.get("model"), defaults[provider]);
    const examType = stringValue(form.get("examType")) as ExamType;
    const file = form.get("file");
    if (!Object.hasOwn(defaults, provider)) return NextResponse.json({ error: "AI provider буруу байна." }, { status: 400 });
    const serverApiKeys: Partial<Record<Provider, string | undefined>> = {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      nvidia: process.env.NVIDIA_API_KEY,
    };
    const apiKey = submittedApiKey || serverApiKeys[provider];
    if (!apiKey) return NextResponse.json({ error: `${provider} API key серверт тохируулаагүй байна.` }, { status: 400 });
    if (examType !== "SAT" && examType !== "EYESH") return NextResponse.json({ error: "Шалгалтын төрөл буруу байна." }, { status: 400 });
    if (!(file instanceof File) || file.type !== "application/pdf") return NextResponse.json({ error: "PDF файл сонгоно уу." }, { status: 400 });
    if (file.size <= 0 || file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "PDF файл 4 MB-аас бага байх ёстой." }, { status: 400 });
    const selectedYear = Number(form.get("year"));
    const selectedVariant = stringValue(form.get("variant")) as "A" | "B" | "C" | "D";
    if (examType === "EYESH" && (!Number.isInteger(selectedYear) || selectedYear < 2006 || selectedYear > 2026)) return NextResponse.json({ error: "ЭЕШ-ийн он 2006–2026 хооронд байна." }, { status: 400 });
    if (examType === "EYESH" && !["A", "B", "C", "D"].includes(selectedVariant)) return NextResponse.json({ error: "ЭЕШ-ийн хувилбар A–D байна." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return NextResponse.json({ error: "Файл PDF форматтай биш байна." }, { status: 400 });
    stage = "pymupdf4llm";
    const layoutJson = await extractLayout(request, file);
    stage = "claude_mapping";
    const output = await requestJson(provider, apiKey, model, extractionPrompt(examType, layoutJson), Buffer.from(bytes).toString("base64"), layoutJson, file.name);
    stage = "json_parse";
    const raw = parseJson(output);
    stage = "image_extraction";
    const assets = await extractAndUploadImages(request, file, raw);
    stage = "normalization";
    return NextResponse.json({ material: normalize(raw, examType, file.name, assets, selectedYear, selectedVariant) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF импорт амжилтгүй боллоо.";
    console.error("PDF material import failed", { stage, error: message });
    return NextResponse.json({ error: message, stage }, { status: 422 });
  }
}
