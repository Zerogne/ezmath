import katex from "katex";
import type { MaterialQuestion } from "@/lib/admin/material-types";
import { isValidSatResponse } from "@/lib/exam/sat-answer";
import type { Difficulty, ExamType } from "@/types/exam";

/**
 * Parses questions written with the LaTeX `exam` document class into editor questions.
 *
 * Supported per question: `\question`, a choices environment with `\choice` / `\CorrectChoice`,
 * `\answer{...}` or `\answer[label]{...}` for written answers (alternatives separated by `;` or `|`),
 * `\topic{}`, `\difficulty{}`, `\explanation{}` or a `solution` environment.
 * A separate key can be given anywhere as `\answers{1-B, 2-D, 3-0,75|3/4}`.
 */

export type LatexImportIssue = { level: "error" | "warning"; message: string };
export type ParsedLatexQuestion = { number: number; question: MaterialQuestion; issues: LatexImportIssue[] };
export type LatexImportResult = { questions: ParsedLatexQuestion[]; issues: LatexImportIssue[] };

const labels = ["A", "B", "C", "D", "E"];
const cyrillicLabels: Record<string, string> = { А: "A", Б: "B", В: "C", Г: "D", Д: "E" };
const mathPattern = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;
const choiceEnvironments = /\\begin\{(choices|oneparchoices|checkboxes|oneparcheckboxes)\}([\s\S]*?)\\end\{\1\}/;
const difficulties: Record<string, Difficulty> = { easy: "Easy", medium: "Medium", hard: "Hard", "1": "Easy", "2": "Medium", "3": "Hard", хялбар: "Easy", амархан: "Easy", дунд: "Medium", хүнд: "Hard", хэцүү: "Hard" };
// Formatting and spacing commands that carry no meaning for the student view.
const droppedCommands = /\\(?:vspace|hspace|vskip|hskip)\*?\{[^}]*\}|\\(?:noindent|medskip|smallskip|bigskip|centering|newpage|clearpage|pagebreak|fillin|quad|qquad)(?![a-zA-Z])|\\begin\{(?:center|flushleft|flushright|figure|minipage)\}(?:\[[^\]]*\])?(?:\{[^}]*\})?|\\end\{(?:center|flushleft|flushright|figure|minipage)\}/g;
const unwrappedCommands = ["textbf", "textit", "emph", "underline", "text", "textrm", "textsf", "texttt", "mbox"];

export function normalizeChoiceLabel(value: string) {
  const trimmed = value.trim().toUpperCase();
  return cyrillicLabels[trimmed] ?? trimmed;
}

/** Reads a `{...}` group starting at `open`, honoring nesting and escaped braces. */
function readGroup(source: string, open: number) {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === "\\") { index += 1; continue; }
    if (char === "{") depth += 1;
    if (char === "}" && --depth === 0) return { content: source.slice(open + 1, index), end: index + 1 };
  }
  return null;
}

/** Removes every `\name[opt]{arg}` from the source and returns the arguments in order. */
function takeCommand(source: string, name: string) {
  const found: { option?: string; argument: string }[] = [];
  const pattern = new RegExp(`\\\\${name}(?![a-zA-Z])\\s*(?:\\[([^\\]]*)\\])?\\s*(?=\\{)`, "g");
  let output = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    const group = readGroup(source, match.index + match[0].length);
    if (!group) break;
    found.push({ option: match[1]?.trim(), argument: group.content.trim() });
    output += source.slice(cursor, match.index);
    cursor = group.end;
    pattern.lastIndex = group.end;
  }
  return { source: output + source.slice(cursor), found };
}

function stripComments(source: string) {
  return source.split("\n").map((line) => line.replace(/(^|[^\\])%.*$/, "$1")).join("\n");
}

/** Applies `transform` only to text outside math delimiters. */
function mapOutsideMath(source: string, transform: (text: string) => string) {
  return source.split(mathPattern).map((part, index) => index % 2 === 1 ? part : transform(part)).join("");
}

/** Replaces `\name{content}` with `content`, keeping it in place. */
function unwrapCommand(source: string, name: string) {
  const pattern = new RegExp(`\\\\${name}(?![a-zA-Z])\\s*(?=\\{)`, "g");
  let output = source;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(output))) {
    const group = readGroup(output, match.index + match[0].length);
    if (!group) break;
    output = output.slice(0, match.index) + group.content + output.slice(group.end);
    pattern.lastIndex = match.index;
  }
  return output;
}

function cleanProse(text: string) {
  const output = unwrappedCommands.reduce(unwrapCommand, text.replace(droppedCommands, ""));
  return output
    .replace(/\\\\(\[[^\]]*\])?|\\newline(?![a-zA-Z])/g, lineBreak)
    .replace(/\\par(?![a-zA-Z])/g, "\n\n")
    .replace(/~/g, " ")
    .replace(/\\([%&_#{}])/g, "$1")
    .replace(/``|''/g, "\"");
}

// Forced line breaks (\\) survive paragraph joining as this marker, then become a single newline.
const lineBreak = "\u2028";

/** Mirrors LaTeX paragraph rules: single newlines join lines, blank lines separate paragraphs. */
function tidy(text: string) {
  return mapOutsideMath(text, cleanProse)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.split("\n").map((line) => line.trim()).filter(Boolean).join(" ").replace(/[ \t]{2,}/g, " "))
    .filter(Boolean)
    .join("\n\n")
    .replace(new RegExp(` ?${lineBreak} ?`, "g"), "\n")
    .trim();
}

function checkLatex(text: string, where: string, issues: LatexImportIssue[]) {
  const parts = text.split(mathPattern);
  parts.forEach((part, index) => {
    if (index % 2 === 0) {
      if (/(^|[^\\])\$/.test(part)) issues.push({ level: "error", message: `${where}: хаагдаагүй $ тэмдэгт байна.` });
      const unknown = part.match(/\\[a-zA-Z]+/g);
      if (unknown) issues.push({ level: "warning", message: `${where}: math-аас гадна танигдаагүй команд ${[...new Set(unknown)].join(", ")}` });
      return;
    }
    const display = part.startsWith("$$") || part.startsWith("\\[");
    const latex = part.startsWith("$") && !display ? part.slice(1, -1) : part.slice(2, -2);
    try {
      katex.renderToString(latex, { displayMode: display, throwOnError: true, strict: "ignore", trust: false });
    } catch (error) {
      const message = error instanceof Error ? error.message.replace(/^KaTeX parse error:\s*/, "") : "тодорхойгүй алдаа";
      issues.push({ level: "error", message: `${where}: KaTeX алдаа — ${message}` });
    }
  });
}

/** Parses `\answers{1-B, 2-0,75|3/4, 3-Д}` into question number → raw answer. */
function parseAnswerKey(raw: string) {
  const key = new Map<number, string>();
  const entry = /(\d+)\s*[-.):=]\s*(.+?)(?=(?:\s*[,;]\s*|\s+)\d+\s*[-.):=]|\s*[,;]?\s*$)/g;
  let match: RegExpExecArray | null;
  while ((match = entry.exec(raw.trim()))) key.set(Number(match[1]), match[2].trim());
  return key;
}

const splitAlternatives = (value: string) => value.split(/[;|]/).map((answer) => answer.trim()).filter(Boolean);

function parseQuestion(block: string, number: number, keyAnswer: string | undefined, examType: ExamType): ParsedLatexQuestion {
  const issues: LatexImportIssue[] = [];
  let source = block;

  const solution = source.match(/\\begin\{solution\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{solution\}/);
  source = source.replace(/\\begin\{solution\}(?:\[[^\]]*\])?[\s\S]*?\\end\{solution\}/g, "");
  const explanationCommand = takeCommand(source, "explanation");
  source = explanationCommand.source;
  const topicCommand = takeCommand(source, "topic");
  source = topicCommand.source;
  const difficultyCommand = takeCommand(source, "difficulty");
  source = difficultyCommand.source;
  const answerCommand = takeCommand(source, "answer");
  source = answerCommand.source;

  const graphics = takeCommand(source, "includegraphics");
  source = graphics.source;
  if (graphics.found.length) issues.push({ level: "warning", message: "Зураг (\\includegraphics) хуулагдахгүй — editor дотор зургаа оруулна уу." });

  const environment = source.match(choiceEnvironments);
  source = source.replace(choiceEnvironments, "");
  if (choiceEnvironments.test(source)) issues.push({ level: "warning", message: "Нэгээс олон choices орчин байна — эхнийхийг л авлаа." });

  const maxChoices = examType === "SAT" ? 4 : 5;
  const choices: MaterialQuestion["choices"] = [];
  let correctAnswer = "";
  if (environment) {
    const items = environment[2].split(/\\(choice|CorrectChoice|correctchoice)(?![a-zA-Z])/).slice(1);
    for (let index = 0; index < items.length; index += 2) {
      const choiceIndex = index / 2;
      if (choiceIndex >= maxChoices) { issues.push({ level: "error", message: `${examType === "SAT" ? "SAT" : "ЭЕШ"} асуулт хамгийн ихдээ ${maxChoices} сонголттой.` }); break; }
      const label = labels[choiceIndex];
      if (items[index] !== "choice") {
        if (correctAnswer) issues.push({ level: "warning", message: `Хэд хэдэн \\CorrectChoice байна — ${correctAnswer}-г авлаа.` });
        else correctAnswer = label;
      }
      const text = tidy(items[index + 1]);
      checkLatex(text, `${label} сонголт`, issues);
      choices.push({ id: crypto.randomUUID(), label, text, imageUrl: "" });
    }
  }

  const text = tidy(source.replace(/^\s*\[[^\]]*\]/, ""));
  if (!text) issues.push({ level: "error", message: "Асуултын текст хоосон байна." });
  else checkLatex(text, "Асуулт", issues);

  const writtenAnswers = answerCommand.found;
  let questionType: MaterialQuestion["questionType"] = "multiple-choice";
  let responseFields: MaterialQuestion["responseFields"] = [];
  if (choices.length && writtenAnswers.length) issues.push({ level: "warning", message: "Сонголттой асуултад \\answer байна — үл тооцлоо." });

  if (choices.length) {
    if (keyAnswer) {
      const keyLabel = normalizeChoiceLabel(keyAnswer);
      if (!choices.some((choice) => choice.label === keyLabel)) issues.push({ level: "error", message: `Түлхүүрийн хариулт "${keyAnswer}" сонголтуудад байхгүй.` });
      else if (correctAnswer && correctAnswer !== keyLabel) issues.push({ level: "warning", message: `Түлхүүр (${keyLabel}) ба \\CorrectChoice (${correctAnswer}) зөрж байна — \\CorrectChoice-г авлаа.` });
      else correctAnswer = keyLabel;
    }
    if (choices.length < 2) issues.push({ level: "error", message: "Дор хаяж 2 сонголт шаардлагатай." });
    if (!correctAnswer) issues.push({ level: "error", message: "Зөв хариулт байхгүй (\\CorrectChoice эсвэл \\answers{} түлхүүр)." });
  } else {
    questionType = "multi-blank";
    const fields = writtenAnswers.length ? writtenAnswers : keyAnswer ? [{ option: undefined, argument: keyAnswer }] : [];
    responseFields = fields.map((field) => ({ id: crypto.randomUUID(), label: field.option || "Хариулт", acceptedAnswers: splitAlternatives(field.argument) }));
    const usedLabels = responseFields.map((field) => field.label);
    if (new Set(usedLabels).size !== usedLabels.length) issues.push({ level: "error", message: "Хариултын талбарын нэр давхардсан — \\answer[ab]{...} гэж ялгана уу." });
    if (!responseFields.length) issues.push({ level: "error", message: "Сонголт ч, \\answer{} ч байхгүй байна." });
    else if (responseFields.some((field) => !field.acceptedAnswers.length)) issues.push({ level: "error", message: "Хоосон \\answer{} байна." });
    if (examType === "SAT") {
      if (responseFields.length > 1) issues.push({ level: "error", message: "SAT бичих асуулт нэг л хариултын талбартай." });
      const unenterable = responseFields.flatMap((field) => field.acceptedAnswers).filter((answer) => !isValidSatResponse(answer));
      if (unenterable.length) issues.push({ level: "warning", message: `SAT хариултын нүдэнд оруулах боломжгүй: ${unenterable.join(", ")} (эерэг 5, сөрөг 6 тэмдэгт хүртэл, тоо, ".", "/", "-").` });
    }
  }

  const difficultyRaw = difficultyCommand.found.at(-1)?.argument.toLocaleLowerCase("mn");
  const difficulty = difficultyRaw ? difficulties[difficultyRaw] : "Medium";
  if (!difficulty) issues.push({ level: "warning", message: `Түвшин "${difficultyRaw}" танигдсангүй — Medium болгов.` });
  const explanation = tidy(explanationCommand.found.at(-1)?.argument ?? solution?.[1] ?? "");
  if (explanation) checkLatex(explanation, "Тайлбар", issues);

  return {
    number,
    issues,
    question: {
      id: crypto.randomUUID(),
      text,
      imageUrl: "",
      questionType,
      responseFields,
      choices,
      correctAnswer: questionType === "multiple-choice" ? correctAnswer : "",
      explanation,
      topic: tidy(topicCommand.found.at(-1)?.argument ?? ""),
      difficulty: difficulty ?? "Medium",
    },
  };
}

export function parseLatexQuestions(input: string, examType: ExamType): LatexImportResult {
  const issues: LatexImportIssue[] = [];
  let source = stripComments(input.replace(/\r\n?/g, "\n"));
  const body = source.match(/\\begin\{document\}([\s\S]*?)(?:\\end\{document\}|$)/);
  if (body) source = body[1];

  const keyCommand = takeCommand(source, "answers");
  source = keyCommand.source;
  const key = new Map<number, string>();
  for (const { argument } of keyCommand.found) for (const [number, answer] of parseAnswerKey(argument)) key.set(number, answer);

  source = source.replace(/\\(?:begin|end)\{questions\}/g, "");
  const blocks = source.split(/\\question(?![a-zA-Z])/).slice(1);
  if (!blocks.length) {
    if (input.trim()) issues.push({ level: "error", message: "\\question олдсонгүй. Асуулт бүрийг \\question-оор эхлүүлнэ үү." });
    return { questions: [], issues };
  }
  const questions = blocks.map((block, index) => parseQuestion(block, index + 1, key.get(index + 1), examType));
  const extraKeys = [...key.keys()].filter((number) => number > questions.length);
  if (extraKeys.length) issues.push({ level: "warning", message: `Түлхүүрт асуултгүй дугаар байна: ${extraKeys.join(", ")}.` });
  return { questions, issues };
}

export const latexImportExample = String.raw`\begin{questions}

\question If $3x + 7 = 2x + 15$, what is the value of $x$?
\topic{Algebra} \difficulty{Easy}
\begin{choices}
  \choice $4$
  \CorrectChoice $8$
  \choice $11$
  \choice $15$
\end{choices}
\explanation{Subtract $2x$ and $7$ from both sides: $x = 8$.}

\question What is $\frac{3}{4}$ of $12$?   % written answer (SAT grid-in)
\answer{9}

\question What is the value of $2 \div 3$?
\answer{2/3}   % .6666, .6667, 0.666, 0.667 are also accepted on SAT

\question The value of $\sqrt{49} + 2^3$ is
\begin{choices}
  \choice $13$
  \choice $14$
  \choice $15$
  \choice $16$
\end{choices}

\end{questions}

% Answer key (optional): question number - letter or value; alternatives with |
\answers{4-C}`;
