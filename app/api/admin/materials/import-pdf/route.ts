import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/auth";
import type { MaterialEditorData, MaterialQuestion } from "@/lib/admin/material-types";
import { ensureImageBucket } from "@/lib/admin/question-images";
import { SAT_DOMAINS, resolveSatSkill } from "@/lib/sat/taxonomy";
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

function extractionPrompt(examType: ExamType, layoutJson: string, chunk?: { index: number; total: number }) {
  return `Convert this ${examType} exam PDF into editable JSON. You are a transcription and layout parser only. Never solve a question, infer a correct answer, or copy an answer key. Preserve Mongolian Cyrillic and passages exactly. Remove printed question numbers. Normalize Cyrillic option labels А/Б/В/Г/Д to Latin A/B/C/D/E.

MATH TRANSCRIPTION: Convert every mathematical expression in question and choice text to valid KaTeX-compatible LaTeX. Wrap inline math in $...$ and standalone equations in $$...$$. Use proper commands such as \\frac, \\sqrt, exponents, subscripts, \\log, \\sin, \\angle, \\triangle, and matrices instead of ambiguous Unicode/plain-text approximations. Keep Mongolian prose outside math delimiters. Escape LaTeX backslashes correctly for JSON. Transcribe only what is printed; never simplify, solve, repair values, or invent missing notation.

Coordinates are normalized PDF page coordinates [x0,y0,x1,y1], each from 0 to 1. Return an imageBox only for a diagram, graph, table, or genuinely pictorial answer that the student must see. Do not crop ordinary printed formulas or text. The box must tightly contain exactly that one visual: never include another question, answer-key row, score label, header, or neighboring content. If an answer option is an image, leave its text empty and return its own tight imageBox. Do not use a full-page or multi-question box; use null when no isolated visual exists.

For ordinary choices use questionType "multiple-choice". For EYESH part 2 written/fill questions use "multi-blank" and return every printed answer field label exactly (examples: af, bg, abc) in responseFields. These labels remain editable. Do not provide accepted answers.

EYESH PART II HIERARCHY (CRITICAL): Part II contains exactly FOUR parent problems. Each parent problem can contain several instructions, equations, subquestions, and named answer blanks. Return exactly one question object per parent problem—not one object per subquestion, sentence, blank, or layout block. Put the entire parent problem text and all of its subquestions into that one object's text, in reading order, and put all named blanks into that object's responseFields. Set section to "II" and parentProblemNumber to the printed parent problem number. If the layout makes you emit a fragment despite this rule, repeat the same parentProblemNumber and set subpartLabel so the server can merge it. Part I questions use section "I" and an empty parentProblemNumber/subpartLabel.

Return ONLY valid JSON:
{"title":"string","subject":"string","year":2026,"durationMinutes":35,"type":"practice","description":"string","questions":[{"sourceQuestionNumber":"1","section":"I","parentProblemNumber":"","subpartLabel":"","questionType":"multiple-choice","text":"string","pageNumber":1,"imageBox":null,"choices":[{"label":"A","text":"string","imageBox":null}],"responseFields":[],"explanation":"","topic":"string","difficulty":"Medium"}]}
Allowed type: full, practice, previous-year. Allowed difficulty: Easy, Medium, Hard.${examType === "SAT" ? ` For SAT, topic must be exactly one of these official College Board skill names (pick the closest; use "" if none fits): ${SAT_DOMAINS.flatMap((domain) => domain.skills).join("; ")}.` : ""} A multiple-choice question needs at least two choices whose text or imageBox is present. A multi-blank question needs at least one responseFields item shaped {"label":"af"}.

COMPLETENESS IS REQUIRED: transcribe every numbered question in the supplied pages, including incomplete-looking questions and every EYESH II хэсэг / задгай даалгавар. Never omit a question because its choices, diagram, formula, or response-field labels are difficult to read. Preserve its sourceQuestionNumber separately while removing that number from text. Never promote nested numbering such as a), б), 1), 2), or an individual answer blank into a separate parent problem.

PyMuPDF4LLM extracted the following native structured layout JSON. Treat it as the primary source for reading order, text, tables, formulas, picture regions, page numbers, and bounding boxes. Use the attached PDF only to resolve ambiguity. Convert absolute PyMuPDF4LLM bounding boxes to normalized page coordinates for imageBox.

${chunk ? `This is layout chunk ${chunk.index + 1} of ${chunk.total}. Return only questions whose first content appears in this chunk. Keep the original PDF pageNumber values. Use an empty title/description when they are not present in this chunk.` : ""}

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
  const signal = AbortSignal.timeout(140_000);
  if (provider === "openai") {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: [{ role: "user", content: [{ type: "input_file", filename, file_data: `data:application/pdf;base64,${pdfBase64}` }, { type: "input_text", text: prompt }] }], temperature: 0.1 }),
    });
  } else if (provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 32000,
        temperature: 0.1,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 }, cache_control: { type: "ephemeral" } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });
  } else if (provider === "gemini") {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      signal,
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: "application/pdf", data: pdfBase64 } }, { text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
  } else {
    response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      signal,
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

function normalizedText(value: unknown) {
  return stringValue(value).toLocaleLowerCase("mn").replace(/\s+/g, " ").trim();
}

function partTwoParentNumber(question: Record<string, unknown>) {
  const explicit = stringValue(question.parentProblemNumber);
  const section = stringValue(question.section).toUpperCase().replace(/\s+/g, "");
  const partTwoSection = new Set(["II", "2", "PARTII", "ХЭСЭГII", "IIХЭСЭГ"]).has(section);
  if (question.questionType !== "multi-blank" && !partTwoSection && !explicit) return "";
  if (explicit) {
    const numeric = explicit.match(/^0*(\d+)/);
    return numeric?.[1] ?? explicit;
  }
  if (!partTwoSection) return "";
  const source = stringValue(question.sourceQuestionNumber);
  const match = source.match(/^0*(\d+)/);
  return match?.[1] ?? "";
}

function mergeQuestionText(questions: Record<string, unknown>[]) {
  const texts = questions.map((question) => stringValue(question.text)).filter(Boolean);
  const unique = texts.filter((text, index) => texts.findIndex((candidate) => normalizedText(candidate) === normalizedText(text)) === index);
  const fragments = unique.filter((text, index) => !unique.some((candidate, candidateIndex) => candidateIndex !== index && normalizedText(candidate).includes(normalizedText(text))));
  return fragments.join("\n\n");
}

function consolidateEyeshPartTwo(raw: Record<string, unknown>) {
  const source = Array.isArray(raw.questions) ? raw.questions : [];
  const output: Record<string, unknown>[] = [];
  const groupIndexes = new Map<string, number>();
  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const question = item as Record<string, unknown>;
    const parent = partTwoParentNumber(question);
    if (!parent) {
      output.push(question);
      continue;
    }
    const key = `part-II:${parent}`;
    const existingIndex = groupIndexes.get(key);
    if (existingIndex === undefined) {
      groupIndexes.set(key, output.length);
      output.push({ ...question, section: "II", parentProblemNumber: parent, sourceQuestionNumber: parent, questionType: "multi-blank", choices: [] });
      continue;
    }
    const existing = output[existingIndex];
    const fragments = [existing, question];
    const fields = fragments.flatMap((fragment) => Array.isArray(fragment.responseFields) ? fragment.responseFields : []).filter((field): field is Record<string, unknown> => Boolean(field) && typeof field === "object");
    const seenFields = new Set<string>();
    existing.text = mergeQuestionText(fragments);
    existing.responseFields = fields.filter((field) => {
      const label = normalizedText(field.label);
      if (!label || seenFields.has(label)) return false;
      seenFields.add(label);
      return true;
    });
    existing.pageNumber = Math.min(Number(existing.pageNumber) || Number(question.pageNumber) || 1, Number(question.pageNumber) || Number(existing.pageNumber) || 1);
    if (!validBox(existing.imageBox) && validBox(question.imageBox)) existing.imageBox = question.imageBox;
  }
  return { ...raw, questions: output };
}

function normalize(raw: Record<string, unknown>, examType: ExamType, filename: string, assets: Record<string, string>, selectedYear?: number, selectedVariant?: "A" | "B" | "C" | "D" | "E"): MaterialEditorData {
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
      return [{ id: randomUUID(), label: stringValue(record.label, String.fromCharCode(65 + index)).slice(0, 5), text, imageUrl }];
    });
    const text = stringValue(question.text);
    const questionType = question.questionType === "multi-blank" ? "multi-blank" : "multiple-choice";
    const responseFields = (Array.isArray(question.responseFields) ? question.responseFields : []).flatMap((field) => {
      const label = field && typeof field === "object" ? stringValue((field as Record<string, unknown>).label) : "";
      return label ? [{ id: randomUUID(), label, acceptedAnswers: [] }] : [];
    });
    if (!text) return [];
    const minimumChoiceCount = examType === "EYESH" ? 5 : 4;
    while (questionType === "multiple-choice" && choices.length < minimumChoiceCount) {
      const index = choices.length;
      choices.push({ id: randomUUID(), label: String.fromCharCode(65 + index), text: "", imageUrl: "" });
    }
    if (questionType === "multi-blank" && !responseFields.length) responseFields.push({ id: randomUUID(), label: "answer", acceptedAnswers: [] });
    const difficulty = ["Easy", "Medium", "Hard"].includes(stringValue(question.difficulty)) ? stringValue(question.difficulty) as MaterialQuestion["difficulty"] : "Medium";
    return [{ id: randomUUID(), text, imageUrl: assets[`q-${questionIndex}`] ?? "", questionType, responseFields, choices: questionType === "multiple-choice" ? choices : [], correctAnswer: "", explanation: stringValue(question.explanation), topic: examType === "SAT" ? resolveSatSkill(stringValue(question.topic))?.skill ?? stringValue(question.topic) : stringValue(question.topic), difficulty }];
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
  const response = await fetch(new URL("/api/pdf_extract", request.url), { method: "POST", headers: { "x-extractor-secret": secret }, body: form, signal: AbortSignal.timeout(60_000) });
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
  const response = await fetch(new URL("/api/pdf_extract", request.url), { method: "POST", headers: { "x-extractor-secret": secret }, body: form, signal: AbortSignal.timeout(60_000) });
  const body = await response.json().catch(() => ({})) as { layout?: unknown; detail?: string };
  if (!response.ok || !body.layout) throw new Error(body.detail ?? "PyMuPDF4LLM PDF бүтцийг уншиж чадсангүй.");
  return body.layout;
}

function splitLayout(layout: unknown, maxChars = 120_000): string[] {
  const compacted = compactLayout(layout);
  const serialized = JSON.stringify(compacted);
  if (serialized.length <= maxChars) return [serialized];
  const record = compacted && typeof compacted === "object" && !Array.isArray(compacted) ? compacted as Record<string, unknown> : null;
  const pageKey = record ? Object.keys(record).find((key) => Array.isArray(record[key]) && /page/i.test(key)) : undefined;
  const pages = Array.isArray(compacted) ? compacted : pageKey && Array.isArray(record?.[pageKey]) ? record[pageKey] : null;
  if (!pages?.length) throw new Error("PyMuPDF4LLM layout хэт том бөгөөд хуудсаар хуваах бүтэц олдсонгүй.");
  const chunks: string[] = [];
  let current: unknown[] = [];
  for (const page of pages) {
    const candidate = [...current, page];
    const wrapped = Array.isArray(compacted) ? candidate : { ...record, [pageKey as string]: candidate };
    if (current.length && JSON.stringify(wrapped).length > maxChars) {
      chunks.push(JSON.stringify(Array.isArray(compacted) ? current : { ...record, [pageKey as string]: current }));
      current = [current.at(-1), page].filter((item) => item !== undefined);
    } else {
      current = candidate;
    }
  }
  if (current.length) chunks.push(JSON.stringify(Array.isArray(compacted) ? current : { ...record, [pageKey as string]: current }));
  if (chunks.some((item) => item.length > 650_000)) throw new Error("PDF-ийн нэг хуудасны бүтэц Claude-ийн context хэмжээнээс хэтэрсэн байна.");
  return chunks;
}

function compactLayout(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(compactLayout);
  if (!value || typeof value !== "object") return value;
  const noisyKeys = new Set(["chars", "words", "spans", "font", "color", "flags", "origin", "ascender", "descender"]);
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
    if (noisyKeys.has(key)) return [];
    if (typeof item === "string" && item.length > 20_000 && /^[A-Za-z0-9+/=\s]+$/.test(item)) return [];
    return [[key, compactLayout(item)]];
  }));
}

function mergeImports(imports: Record<string, unknown>[]) {
  const first = imports[0] ?? {};
  const questions: unknown[] = [];
  const seen = new Set<string>();
  for (const item of imports) for (const question of Array.isArray(item.questions) ? item.questions : []) {
    if (!question || typeof question !== "object") continue;
    const record = question as Record<string, unknown>;
    const number = stringValue(record.sourceQuestionNumber);
    const text = stringValue(record.text).toLocaleLowerCase().replace(/\s+/g, " ").slice(0, 160);
    const parent = stringValue(record.parentProblemNumber);
    const subpart = stringValue(record.subpartLabel);
    const key = `${Number(record.pageNumber) || 0}:${number}:${parent}:${subpart}:${text}`;
    if (!text || seen.has(key)) continue;
    seen.add(key);
    questions.push(question);
  }
  return {
    ...first,
    title: imports.map((item) => stringValue(item.title)).find(Boolean) ?? "",
    subject: imports.map((item) => stringValue(item.subject)).find(Boolean) ?? "",
    description: imports.map((item) => stringValue(item.description)).find(Boolean) ?? "",
    questions,
  };
}

export async function POST(request: Request) {
  if (!await getAdminIdentity()) return NextResponse.json({ error: "Админ эрх шаардлагатай." }, { status: 403 });
  let stage = "request";
  try {
    const form = await request.formData();
    const provider = stringValue(form.get("provider")) as Provider;
    const submittedApiKey = stringValue(form.get("apiKey"));
    const model = stringValue(form.get("model")) || defaults[provider];
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
    const selectedVariant = stringValue(form.get("variant")) as "A" | "B" | "C" | "D" | "E";
    if (examType === "EYESH" && (!Number.isInteger(selectedYear) || selectedYear < 2006 || selectedYear > 2026)) return NextResponse.json({ error: "ЭЕШ-ийн он 2006–2026 хооронд байна." }, { status: 400 });
    if (examType === "EYESH" && !["A", "B", "C", "D", "E"].includes(selectedVariant)) return NextResponse.json({ error: "ЭЕШ-ийн хувилбар A–E байна." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return NextResponse.json({ error: "Файл PDF форматтай биш байна." }, { status: 400 });
    const startedAt = Date.now();
    stage = "pymupdf4llm";
    const layout = await extractLayout(request, file);
    const layoutChunks = splitLayout(layout);
    console.info("PDF import stage completed", { stage, durationMs: Date.now() - startedAt, chunks: layoutChunks.length });
    stage = "claude_mapping";
    const mappingStartedAt = Date.now();
    const pdfBase64 = Buffer.from(bytes).toString("base64");
    const imports = await Promise.all(layoutChunks.map(async (layoutJson, index) => {
      try {
        const output = await requestJson(provider, apiKey, model, extractionPrompt(examType, layoutJson, layoutChunks.length > 1 ? { index, total: layoutChunks.length } : undefined), pdfBase64, layoutJson, file.name);
        return parseJson(output);
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI mapping failed";
        throw new Error(`AI chunk ${index + 1}/${layoutChunks.length}: ${message}`);
      }
    }));
    console.info("PDF import stage completed", { stage, durationMs: Date.now() - mappingStartedAt, chunks: layoutChunks.length });
    const merged = mergeImports(imports);
    const raw = examType === "EYESH" ? consolidateEyeshPartTwo(merged) : merged;
    if (examType === "EYESH") {
      const partTwoCount = (Array.isArray(raw.questions) ? raw.questions : []).filter((question) => question && typeof question === "object" && (question as Record<string, unknown>).questionType === "multi-blank").length;
      console.info("EYESH Part II consolidation completed", { partTwoCount });
    }
    stage = "image_extraction";
    const imageStartedAt = Date.now();
    const assets = await extractAndUploadImages(request, file, raw);
    console.info("PDF import stage completed", { stage, durationMs: Date.now() - imageStartedAt, assets: Object.keys(assets).length, totalDurationMs: Date.now() - startedAt });
    stage = "normalization";
    return NextResponse.json({ material: normalize(raw, examType, file.name, assets, selectedYear, selectedVariant) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF импорт амжилтгүй боллоо.";
    console.error("PDF material import failed", { stage, error: message });
    return NextResponse.json({ error: message, stage }, { status: 422 });
  }
}
