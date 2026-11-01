import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/auth";
import { renderTikz, TikzRenderError } from "@/lib/admin/tikz-render";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PICTURES = 30;
const MAX_PICTURE_LENGTH = 20_000;

/** Renders the LaTeX importer's `tikzpicture` blocks to SVG for its preview; nothing is stored here. */
export async function POST(request: Request) {
  if (!await getAdminIdentity()) return NextResponse.json({ error: "Админ эрх шаардлагатай." }, { status: 403 });
  const body = await request.json().catch(() => null) as { pictures?: unknown; preamble?: unknown } | null;
  const pictures = Array.isArray(body?.pictures) ? body.pictures.filter((item): item is string => typeof item === "string") : [];
  const preamble = typeof body?.preamble === "string" ? body.preamble.slice(0, 5_000) : "";
  if (!pictures.length) return NextResponse.json({ error: "TikZ зураг алга." }, { status: 400 });
  if (pictures.length > MAX_PICTURES) return NextResponse.json({ error: `Нэг удаад ${MAX_PICTURES} хүртэл зураг зурна.` }, { status: 400 });
  const results: ({ svg: string } | { error: string })[] = [];
  for (const picture of pictures) {
    if (picture.length > MAX_PICTURE_LENGTH) { results.push({ error: "TikZ код хэт урт байна." }); continue; }
    try {
      results.push({ svg: await renderTikz(picture, preamble) });
    } catch (error) {
      results.push({ error: error instanceof TikzRenderError ? error.message : "TikZ кодыг зурж чадсангүй." });
    }
  }
  return NextResponse.json({ results });
}
