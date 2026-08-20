import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { getAdminIdentity } from "@/lib/admin/auth";
import type { MaterialEditorData, MaterialQuestion } from "@/lib/admin/material-types";
import type { ExamType, TestType } from "@/types/exam";

export const runtime = "nodejs";
export const maxDuration = 300;

type Provider = "openai" | "anthropic" | "gemini" | "nvidia";

const defaults: Record<Provider, string> = {
  openai: "gpt-5-mini",
  anthropic: "claude-sonnet-4-6",
  gemini: "gemini-2.5-flash",
  nvidia: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
};

function extractionPrompt(examType: ExamType) {
  return `You convert an exam PDF into editable test data. Extract every ${examType} question and its answer choices from the PDF text below. Use the answer key when present. Preserve mathematical notation in readable plain text or LaTeX. Never invent missing answers. Return ONLY valid JSON with this exact shape:
{"title":"string","subject":"string","year":2026,"durationMinutes":35,"type":"practice","description":"string","questions":[{"text":"string","choices":[{"label":"A","text":"string"}],"correctAnswer":"A","explanation":"string","topic":"string","difficulty":"Medium"}]}
Allowed type values: full, practice, previous-year. Allowed difficulty values: Easy, Medium, Hard. Each question needs at least two non-empty choices. If the answer key is absent, use the first choice as correctAnswer and mention that review is required in explanation.`;
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
      body: JSON.stringify({ model, input: [{ role: "user", content: [{ type: "input_file", filename, file_data: `data:application/pdf;base64,${pdfBase64}` }, { type: "input_text", text: prompt }] }] }),
    });
  } else if (provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 32000, messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } }, { type: "text", text: prompt }] }] }),
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

function normalize(raw: Record<string, unknown>, examType: ExamType, filename: string): MaterialEditorData {
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions.slice(0, 200) : [];
  const questions: MaterialQuestion[] = rawQuestions.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const question = item as Record<string, unknown>;
    const rawChoices = Array.isArray(question.choices) ? question.choices : [];
    const choices = rawChoices.flatMap((choice, index) => {
      if (!choice || typeof choice !== "object") return [];
      const record = choice as Record<string, unknown>;
      const text = stringValue(record.text);
      if (!text) return [];
      return [{ id: randomUUID(), label: stringValue(record.label, String.fromCharCode(65 + index)).slice(0, 5), text }];
    });
    const text = stringValue(question.text);
    if (!text || choices.length < 2) return [];
    const requestedAnswer = stringValue(question.correctAnswer);
    const correctAnswer = choices.some((choice) => choice.label === requestedAnswer) ? requestedAnswer : choices[0].label;
    const difficulty = ["Easy", "Medium", "Hard"].includes(stringValue(question.difficulty)) ? stringValue(question.difficulty) as MaterialQuestion["difficulty"] : "Medium";
    return [{ id: randomUUID(), text, choices, correctAnswer, explanation: stringValue(question.explanation), topic: stringValue(question.topic), difficulty }];
  });
  if (!questions.length) throw new Error("PDF-ээс хүчинтэй асуулт олдсонгүй.");
  const type = ["full", "practice", "previous-year"].includes(stringValue(raw.type)) ? stringValue(raw.type) as TestType : examType === "SAT" ? "practice" : "previous-year";
  const duration = Number(raw.durationMinutes);
  const year = Number(raw.year);
  return {
    examType,
    title: stringValue(raw.title, filename.replace(/\.pdf$/i, "")),
    subject: stringValue(raw.subject, examType === "SAT" ? "Math" : "Математик"),
    year: examType === "EYESH" && year >= 2000 && year <= 2100 ? year : undefined,
    durationMinutes: Number.isInteger(duration) && duration > 0 && duration <= 600 ? duration : 35,
    type,
    status: "draft",
    description: stringValue(raw.description),
    questions,
  };
}

export async function POST(request: Request) {
  if (!await getAdminIdentity()) return NextResponse.json({ error: "Админ эрх шаардлагатай." }, { status: 403 });
  try {
    const form = await request.formData();
    const provider = stringValue(form.get("provider")) as Provider;
    const apiKey = stringValue(form.get("apiKey"));
    const model = stringValue(form.get("model"), defaults[provider]);
    const examType = stringValue(form.get("examType")) as ExamType;
    const file = form.get("file");
    if (!Object.hasOwn(defaults, provider)) return NextResponse.json({ error: "AI provider буруу байна." }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: "API key оруулна уу." }, { status: 400 });
    if (examType !== "SAT" && examType !== "EYESH") return NextResponse.json({ error: "Шалгалтын төрөл буруу байна." }, { status: 400 });
    if (!(file instanceof File) || file.type !== "application/pdf") return NextResponse.json({ error: "PDF файл сонгоно уу." }, { status: 400 });
    if (file.size <= 0 || file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "PDF файл 15 MB-аас бага байх ёстой." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return NextResponse.json({ error: "Файл PDF форматтай биш байна." }, { status: 400 });
    const parser = new PDFParse({ data: bytes });
    let pdfText = "";
    try { pdfText = (await parser.getText()).text.trim(); } finally { await parser.destroy(); }
    if (!pdfText && provider === "nvidia") return NextResponse.json({ error: "NVIDIA NIM импортод PDF дотор уншигдах текст хэрэгтэй. Scan PDF бол OCR-той хувилбар ашиглана уу." }, { status: 422 });
    const output = await requestJson(provider, apiKey, model, extractionPrompt(examType), Buffer.from(bytes).toString("base64"), pdfText.slice(0, 350_000), file.name);
    return NextResponse.json({ material: normalize(parseJson(output), examType, file.name) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF импорт амжилтгүй боллоо.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
