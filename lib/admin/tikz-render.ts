import "server-only";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { dvi2svg, load, tex, type TeXOptions } from "node-tikzjax";

// Shipped with the route through outputFileTracingIncludes (next.config.ts).
const FONT_DIR = path.join(process.cwd(), "node_modules", "node-tikzjax", "css", "bakoma", "ttf");
const fontCache = new Map<string, string>();

export class TikzRenderError extends Error {}

// The engine keeps global state, so pictures render one at a time.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Renders one `tikzpicture` (TikZ or pgfplots) to a self-contained SVG: the TeX fonts it uses are embedded,
 * because an SVG shown through <img> cannot load external font files.
 */
export function renderTikz(picture: string, preamble = "") {
  const run = queue.then(() => renderNow(picture, preamble));
  queue = run.catch(() => undefined);
  return run;
}

async function renderNow(picture: string, preamble: string) {
  const input = `\\begin{document}\n${withNewestCompat(picture)}\n\\end{document}`;
  const options: TeXOptions = {
    texPackages: { amsmath: "", amssymb: "", ...(/\\begin\{(?:semilog|loglog)?axis\}|\\addplot|\\pgfplots/.test(picture + preamble) ? { pgfplots: "" } : {}) },
    addToPreamble: withNewestCompat(preamble),
  };
  await load();
  let dvi: Buffer;
  try {
    dvi = await tex(input, options);
  } catch {
    throw new TikzRenderError(await explainFailure(input, options));
  }
  return embedFonts(await dvi2svg(dvi));
}

/** The bundled pgfplots is older than most documents expect, and an unknown `compat=` value is a hard error. */
function withNewestCompat(source: string) {
  return source.replace(/compat\s*=\s*[^,}\]\s]+/g, "compat=newest");
}

/** Re-runs a failed picture with the TeX log on and returns its first error line ("! ...") with the line it points at. */
async function explainFailure(input: string, options: TeXOptions) {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => { lines.push(args.map(String).join(" ")); };
  try {
    await tex(input, { ...options, showConsole: true });
  } catch {
    // Expected: this run only exists to collect the log.
  } finally {
    console.log = original;
  }
  const errorIndex = lines.findIndex((line) => line.startsWith("!"));
  if (errorIndex < 0) return "TikZ кодыг зурж чадсангүй.";
  const where = lines.slice(errorIndex + 1).find((line) => /^l\.\d+/.test(line));
  return [lines[errorIndex].replace(/^!\s*/, ""), where?.replace(/^l\.\d+\s*/, "→ ")].filter(Boolean).join(" ").slice(0, 300);
}

async function embedFonts(svg: string) {
  const families = [...new Set([...svg.matchAll(/font-family="([a-z0-9]+)"/g)].map((match) => match[1]))];
  const faces = await Promise.all(families.map(async (family) => {
    if (!fontCache.has(family)) {
      const file = path.join(FONT_DIR, `${family}.ttf`);
      fontCache.set(family, existsSync(file) ? (await readFile(file)).toString("base64") : "");
    }
    const data = fontCache.get(family);
    return data ? `@font-face{font-family:${family};src:url(data:font/ttf;base64,${data})}` : "";
  }));
  const style = faces.join("");
  return style ? svg.replace(/<svg([^>]*)>/, `<svg$1><defs><style>${style}</style></defs>`) : svg;
}
