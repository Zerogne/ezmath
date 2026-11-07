import katex from "katex";

/**
 * LaTeX → safe HTML for lesson content (examples, test problems). Runs in server and client components.
 * Supported: text formatting, paragraphs and line breaks, itemize/enumerate/description, tabular, center,
 * quote, headings, footnotes, colors, links, \includegraphics, every math form KaTeX supports (inline,
 * display, equation/align/gather/multline) and tikzpicture (drawn to SVG on save, see lib/latex/tikz-store.ts).
 * Every piece of text is HTML-escaped; only tags emitted here reach the page.
 */

export type TikzPicture = { key: string; source: string; preamble: string };

const TIKZ_BUCKET_PATH = "storage/v1/object/public/exam-question-images/tikz";

/** Public URL of a saved TikZ drawing. */
export function tikzUrl(key: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base.replace(/\/$/, "")}/${TIKZ_BUCKET_PATH}/${key}.svg` : "";
}

/** Stable 64-bit FNV-1a hash (hex) used as the storage key of a TikZ drawing; identical on server and client. */
export function tikzKey(source: string, preamble: string) {
  const input = `${preamble.trim()}\n${source.trim()}`;
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b ^ code, 0x5bd1e995) >>> 0;
  }
  return `${a.toString(16).padStart(8, "0")}${b.toString(16).padStart(8, "0")}`;
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function stripComments(source: string) {
  return source.split("\n").map((line) => line.replace(/(^|[^\\])%.*$/, "$1")).join("\n");
}

/** \usetikzlibrary / \tikzset lines become the TikZ preamble and are removed from the text. */
function takePreamble(source: string) {
  const lines: string[] = [];
  const text = source.replace(/\\(usetikzlibrary|usepgfplotslibrary|pgfplotsset|tikzset)\s*(\{(?:[^{}]|\{[^{}]*\})*\})/g, (match) => { lines.push(match); return ""; });
  return { text, preamble: lines.join("\n") };
}

/** Every tikzpicture in a field with its storage key (used by the save step and the admin preview). */
export function extractTikz(source: string): TikzPicture[] {
  const { text, preamble } = takePreamble(stripComments(source));
  return [...text.matchAll(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g)].map((match) => ({ key: tikzKey(match[0], preamble), source: match[0], preamble }));
}

// ---- math ----------------------------------------------------------------------------------------

function renderMath(latex: string, displayMode: boolean) {
  const html = katex.renderToString(latex, { displayMode, throwOnError: false, strict: "ignore", trust: false, output: "htmlAndMathml" });
  return displayMode ? `<div class="latex-display">${html}</div>` : `<span class="latex-inline">${html}</span>`;
}

const DISPLAY_ENVS: Record<string, (body: string) => string> = {
  equation: (body) => body, "equation*": (body) => body, displaymath: (body) => body,
  align: (body) => `\\begin{aligned}${body}\\end{aligned}`, "align*": (body) => `\\begin{aligned}${body}\\end{aligned}`,
  eqnarray: (body) => `\\begin{aligned}${body.replace(/&\s*=\s*&/g, "&=")}\\end{aligned}`, "eqnarray*": (body) => `\\begin{aligned}${body.replace(/&\s*=\s*&/g, "&=")}\\end{aligned}`,
  gather: (body) => `\\begin{gathered}${body}\\end{gathered}`, "gather*": (body) => `\\begin{gathered}${body}\\end{gathered}`,
  multline: (body) => `\\begin{gathered}${body}\\end{gathered}`, "multline*": (body) => `\\begin{gathered}${body}\\end{gathered}`,
};

// ---- scanning helpers ----------------------------------------------------------------------------

/** Reads a {...} group starting at `open` (which must be "{"); returns its content and the index after "}". */
function readGroup(source: string, open: number): [string, number] | null {
  if (source[open] !== "{") return null;
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === "\\") { index += 1; continue; }
    if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return [source.slice(open + 1, index), index + 1];
  }
  return [source.slice(open + 1), source.length];
}

function readOptional(source: string, open: number): [string, number] | null {
  if (source[open] !== "[") return null;
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") depth -= 1;
    else if (source[index] === "]" && depth === 0) return [source.slice(open + 1, index), index + 1];
  }
  return null;
}

const skipSpaces = (source: string, index: number) => { while (source[index] === " " || source[index] === "\t") index += 1; return index; };

/** Finds the \end{name} matching a \begin{name} whose body starts at `from`, honouring nesting. */
function findEnd(source: string, name: string, from: number) {
  const pattern = new RegExp(`\\\\(begin|end)\\{${name.replace(/\*/g, "\\*")}\\}`, "g");
  pattern.lastIndex = from;
  let depth = 1;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    depth += match[1] === "begin" ? 1 : -1;
    if (depth === 0) return { bodyEnd: match.index, after: match.index + match[0].length };
  }
  return { bodyEnd: source.length, after: source.length };
}

/** Splits on a separator (\item, &, \\) only at nesting depth 0: outside {...} groups and nested environments. */
function splitTopLevel(source: string, separator: RegExp) {
  const sticky = new RegExp(separator.source, "y");
  const parts: string[] = [];
  let depth = 0, environments = 0, last = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source.startsWith("\\begin{", index)) { environments += 1; index += 6; continue; }
    if (source.startsWith("\\end{", index)) { environments -= 1; index += 4; continue; }
    if (depth === 0 && environments === 0) {
      sticky.lastIndex = index;
      const hit = sticky.exec(source);
      if (hit && hit[0].length) { parts.push(source.slice(last, index)); last = index + hit[0].length; index = last - 1; continue; }
    }
    const char = source[index];
    if (char === "\\") { index += 1; continue; } // escaped character, e.g. \& or \{
    if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;
  }
  parts.push(source.slice(last));
  return parts;
}

// ---- inline (text-mode) ------------------------------------------------------------------------

const SYMBOLS: Record<string, string> = {
  ldots: "…", dots: "…", textellipsis: "…", LaTeX: "LaTeX", TeX: "TeX", textendash: "–", textemdash: "—",
  textbullet: "•", textdegree: "°", copyright: "©", textregistered: "®", S: "§", P: "¶", dag: "†", ddag: "‡",
  quad: " ", qquad: "  ", enspace: " ", thinspace: " ", newline: "<br>", linebreak: "<br>", par: "<br><br>",
  textbackslash: "\\", textasciitilde: "~", textasciicircum: "^", textless: "&lt;", textgreater: "&gt;", textbar: "|",
};
const IGNORED = new Set(["noindent", "indent", "centering", "raggedright", "raggedleft", "medskip", "smallskip", "bigskip", "newpage", "clearpage", "pagebreak", "hfill", "vfill", "displaystyle", "normalsize", "small", "footnotesize", "scriptsize", "tiny", "large", "Large", "LARGE", "huge", "Huge", "selectfont", "maketitle", "label", "ref", "caption*", "protect", "relax", "item"]);
const ONE_ARG_DROP = new Set(["vspace", "hspace", "vskip", "hskip", "label", "phantom", "hphantom", "vphantom", "setlength", "addvspace"]);
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|[a-z]+(![0-9]{1,3})?)$/i;
const NAMED_COLORS: Record<string, string> = { red: "#DC2626", blue: "#2B4BE8", green: "#16A34A", orange: "#EA580C", purple: "#7C4DEB", violet: "#7C4DEB", gray: "#6B7280", grey: "#6B7280", brown: "#92400E", teal: "#0D9488", magenta: "#C026D3", cyan: "#0891B2", black: "#0B1030", yellow: "#CA8A04" };

function color(value: string) {
  const clean = value.trim();
  if (!SAFE_COLOR.test(clean)) return null;
  if (clean.startsWith("#")) return clean;
  return NAMED_COLORS[clean.split("!")[0].toLowerCase()] ?? null;
}

const httpsUrl = (value: string) => /^https:\/\/[^\s"<>]+$/i.test(value.trim()) ? value.trim() : null;

type Ctx = { math: string[] };

function inline(source: string, ctx: Ctx): string {
  let out = "";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "\u0000") { // math placeholder: \u0000<n>\u0000
      const end = source.indexOf("\u0000", index + 1);
      out += ctx.math[Number(source.slice(index + 1, end))] ?? "";
      index = end;
      continue;
    }
    if (char === "\\") {
      const next = source[index + 1];
      if (next === "\\") { out += "<br>"; index += 1; const opt = readOptional(source, skipSpaces(source, index + 1)); if (opt) index = opt[1] - 1; continue; }
      if (next && "%&$#_{}".includes(next)) { out += escapeHtml(next); index += 1; continue; }
      if (next === " " || next === ",") { out += next === "," ? " " : " "; index += 1; continue; }
      const name = /^[a-zA-Z]+\*?/.exec(source.slice(index + 1))?.[0];
      if (!name) { index += 1; continue; }
      let cursor = index + 1 + name.length;
      const argument = () => { const group = readGroup(source, skipSpaces(source, cursor)); if (group) cursor = group[1]; return group?.[0] ?? ""; };
      const optional = () => { const group = readOptional(source, skipSpaces(source, cursor)); if (group) cursor = group[1]; return group?.[0] ?? ""; };
      switch (name) {
        case "textbf": case "bfseries": case "mathbf": out += name === "bfseries" ? "" : `<strong>${inline(argument(), ctx)}</strong>`; break;
        case "textit": case "emph": case "textsl": out += `<em>${inline(argument(), ctx)}</em>`; break;
        case "underline": case "uline": out += `<u>${inline(argument(), ctx)}</u>`; break;
        case "sout": out += `<s>${inline(argument(), ctx)}</s>`; break;
        case "texttt": out += `<code>${inline(argument(), ctx)}</code>`; break;
        case "textsc": out += `<span style="font-variant:small-caps">${inline(argument(), ctx)}</span>`; break;
        case "textsuperscript": out += `<sup>${inline(argument(), ctx)}</sup>`; break;
        case "textsubscript": out += `<sub>${inline(argument(), ctx)}</sub>`; break;
        case "text": case "textrm": case "textsf": case "textnormal": case "textup": case "mbox": case "fbox": case "makebox": out += inline(argument(), ctx); break;
        case "textcolor": { const value = color(argument()); const body = inline(argument(), ctx); out += value ? `<span style="color:${value}">${body}</span>` : body; break; }
        case "colorbox": { const value = color(argument()); const body = inline(argument(), ctx); out += value ? `<span style="background:${value}22;padding:0 .25em;border-radius:.25em">${body}</span>` : body; break; }
        case "footnote": out += `<span class="latex-footnote">(${inline(argument(), ctx)})</span>`; break;
        case "href": { const url = httpsUrl(argument()); const body = inline(argument(), ctx); out += url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer nofollow">${body}</a>` : body; break; }
        case "url": { const url = httpsUrl(argument()); out += url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(url)}</a>` : ""; break; }
        case "includegraphics": { optional(); const url = httpsUrl(argument()); out += url ? `<img class="latex-image" src="${escapeHtml(url)}" alt="" loading="lazy">` : ""; break; }
        case "caption": out += `<span class="latex-caption">${inline(argument(), ctx)}</span>`; break;
        default:
          if (SYMBOLS[name] !== undefined) out += SYMBOLS[name];
          else if (ONE_ARG_DROP.has(name)) { optional(); argument(); }
          else if (IGNORED.has(name)) { /* layout-only command */ }
          else { optional(); const group = readGroup(source, skipSpaces(source, cursor)); if (group) { cursor = group[1]; out += inline(group[0], ctx); } }
      }
      index = cursor - 1;
      continue;
    }
    if (char === "{" ) { const group = readGroup(source, index); if (group) { out += inline(group[0], ctx); index = group[1] - 1; continue; } }
    if (char === "}") continue;
    if (char === "~") { out += " "; continue; }
    if (char === "-" && source.startsWith("---", index)) { out += "—"; index += 2; continue; }
    if (char === "-" && source.startsWith("--", index)) { out += "–"; index += 1; continue; }
    if (char === "`" && source[index + 1] === "`") { out += "“"; index += 1; continue; }
    if (char === "'" && source[index + 1] === "'") { out += "”"; index += 1; continue; }
    if (char === "\n") { out += " "; continue; }
    out += escapeHtml(char);
  }
  return out;
}

// ---- blocks -------------------------------------------------------------------------------------

function paragraphs(text: string, ctx: Ctx) {
  let out = "";
  for (const chunk of text.split(/\n[ \t]*\n+/)) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    // Display math and drawings are block elements of their own, never wrapped in <p>.
    if (/^(\u0000\d+\u0000\s*)+$/.test(trimmed)) { out += inline(trimmed, ctx); continue; }
    const heading = /^\\(section|subsection|subsubsection|paragraph)\*?\s*(\{[\s\S]*)$/.exec(trimmed);
    if (heading) {
      const group = readGroup(heading[2], 0);
      const level = heading[1] === "section" ? 3 : heading[1] === "subsection" ? 4 : 5;
      out += `<h${level} class="latex-heading">${inline(group?.[0] ?? "", ctx)}</h${level}>`;
      const rest = group ? heading[2].slice(group[1]).trim() : "";
      if (rest) out += `<p>${inline(rest, ctx)}</p>`;
      continue;
    }
    // Single newlines inside a paragraph are kept as line breaks: admins type examples line by line.
    out += `<p>${trimmed.split("\n").map((line) => inline(line, ctx)).join("<br>")}</p>`;
  }
  return out;
}

function list(body: string, kind: "itemize" | "enumerate" | "description", options: string, ctx: Ctx) {
  const items = splitTopLevel(body, /\\item\b\s*/).slice(1);
  if (kind === "description") {
    return `<dl class="latex-dl">${items.map((item) => { const label = readOptional(item, 0); return `<dt>${inline(label?.[0] ?? "", ctx)}</dt><dd>${blocks(label ? item.slice(label[1]) : item, ctx)}</dd>`; }).join("")}</dl>`;
  }
  // Classes, not the type attribute: HTML matches type="a" and type="A" case-insensitively in CSS.
  const style = /\\alph/.test(options) ? " latex-lower-alpha" : /\\Alph/.test(options) ? " latex-upper-alpha" : /\\roman/.test(options) ? " latex-lower-roman" : /\\Roman/.test(options) ? " latex-upper-roman" : "";
  const tag = kind === "enumerate" ? "ol" : "ul";
  return `<${tag} class="latex-list${style}">${items.map((item) => {
    const custom = readOptional(item, 0);
    return `<li${custom ? ' class="latex-custom-item"' : ""}>${custom ? `<span class="latex-item-label">${inline(custom[0], ctx)}</span> ` : ""}${blocks(custom ? item.slice(custom[1]) : item, ctx)}</li>`;
  }).join("")}</${tag}>`;
}

function table(spec: string, body: string, ctx: Ctx) {
  const aligns = [...spec.replace(/\{[^}]*\}/g, "").replace(/[|@!>< ]/g, "")].map((letter) => letter === "c" ? "center" : letter === "r" ? "right" : "left");
  const bordered = /\|/.test(spec) || /\\hline/.test(body);
  const rows = splitTopLevel(body.replace(/\\(hline|toprule|midrule|bottomrule|cline\{[^}]*\})/g, ""), /\\\\(\[[^\]]*\])?/).map((row) => row.trim()).filter(Boolean);
  return `<div class="latex-table-wrap"><table class="latex-table${bordered ? " latex-table-bordered" : ""}"><tbody>${rows.map((row) => `<tr>${splitTopLevel(row, /&/).map((cell, column) => {
    const multi = /^\s*\\multicolumn\{(\d+)\}\{([^}]*)\}\{([\s\S]*)\}\s*$/.exec(cell);
    if (multi) return `<td colspan="${Number(multi[1]) || 1}" style="text-align:${multi[2].includes("c") ? "center" : multi[2].includes("r") ? "right" : "left"}">${inline(multi[3], ctx)}</td>`;
    return `<td style="text-align:${aligns[column] ?? "left"}">${inline(cell.trim(), ctx)}</td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function blocks(source: string, ctx: Ctx): string {
  let out = "";
  let cursor = 0;
  const begin = /\\begin\{([a-zA-Z*]+)\}/g;
  for (let match = begin.exec(source); match; match = begin.exec(source)) {
    out += paragraphs(source.slice(cursor, match.index), ctx);
    const name = match[1];
    let bodyStart = match.index + match[0].length;
    const { bodyEnd, after } = findEnd(source, name, bodyStart);
    let options = "";
    const opt = readOptional(source, skipSpaces(source, bodyStart));
    if (opt && ["enumerate", "itemize", "figure", "table", "center", "minipage"].includes(name)) { options = opt[0]; bodyStart = opt[1]; }
    const body = source.slice(bodyStart, bodyEnd);
    if (name === "itemize" || name === "enumerate" || name === "description") out += list(body, name, options, ctx);
    else if (name === "tabular" || name === "tabular*" || name === "array") { const spec = readGroup(body, skipSpaces(body, 0)); out += spec ? table(spec[0], body.slice(spec[1]), ctx) : ""; }
    else if (name === "center" || name === "flushleft" || name === "flushright") out += `<div class="latex-${name}">${blocks(body, ctx)}</div>`;
    else if (name === "quote" || name === "quotation") out += `<blockquote class="latex-quote">${blocks(body, ctx)}</blockquote>`;
    else if (name === "figure" || name === "table") out += `<figure class="latex-figure">${blocks(body, ctx)}</figure>`;
    else if (name === "minipage") { const width = readGroup(body, skipSpaces(body, 0)); out += `<div>${blocks(width ? body.slice(width[1]) : body, ctx)}</div>`; }
    else out += blocks(body, ctx); // theorem-like or unknown environments: keep their content
    cursor = after;
    begin.lastIndex = after;
  }
  out += paragraphs(source.slice(cursor), ctx);
  return out;
}

/**
 * Renders a LaTeX field to HTML. `tikzImages` maps a drawing's key to an image URL; by default saved
 * drawings load from storage (see tikzUrl), the admin preview passes freshly rendered SVGs instead.
 */
export function renderLatex(input: string, tikzImages?: Record<string, string>) {
  const { text: withoutPreamble, preamble } = takePreamble(stripComments(input.replace(/\r\n?/g, "\n")));
  const ctx: Ctx = { math: [] };
  const hold = (html: string) => `\u0000${ctx.math.push(html) - 1}\u0000`;
  const holdBlock = (html: string) => `\n\n${hold(html)}\n\n`;
  const text = withoutPreamble
    .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, (picture) => {
      const key = tikzKey(picture, preamble);
      const src = tikzImages?.[key] ?? tikzUrl(key);
      return holdBlock(src ? `<span class="latex-tikz"><img src="${escapeHtml(src)}" alt="Зураг" loading="lazy"></span>` : "");
    })
    .replace(/\\begin\{(equation\*?|align\*?|gather\*?|multline\*?|eqnarray\*?|displaymath)\}([\s\S]*?)\\end\{\1\}/g, (_, name: string, body: string) => holdBlock(renderMath(DISPLAY_ENVS[name](body.replace(/\\label\{[^}]*\}|\\nonumber|\\notag/g, "")), true)))
    .replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (_, a?: string, b?: string) => holdBlock(renderMath(a ?? b ?? "", true)))
    .replace(/\\\(([\s\S]+?)\\\)|(?<!\\)\$((?:\\\$|[^$])+?)\$/g, (_, a?: string, b?: string) => hold(renderMath(a ?? b ?? "", false)));
  return blocks(text, ctx);
}

/** True when a field uses anything beyond plain text (used to decide whether to show a preview). */
export function looksLikeLatex(text: string) {
  return /\$|\\[a-zA-Z(\[]|\\\\/.test(text);
}
