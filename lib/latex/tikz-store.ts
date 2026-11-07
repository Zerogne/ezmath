import "server-only";
import { ensureImageBucket, QUESTION_IMAGE_BUCKET } from "@/lib/admin/question-images";
import { renderTikz, TikzRenderError } from "@/lib/admin/tikz-render";
import { extractTikz } from "@/lib/latex/render";

const MAX_PICTURES = 10;
const MAX_PICTURE_LENGTH = 20_000;

/**
 * Draws every tikzpicture in the given LaTeX fields that is not stored yet and uploads it as
 * tikz/<key>.svg, where lib/latex/render.ts looks for it. Unchanged drawings are not re-rendered.
 * Returns an error message the admin can act on, or nothing on success.
 */
export async function storeTikzDrawings(fields: string[]): Promise<string | undefined> {
  const pictures = new Map(fields.flatMap(extractTikz).map((picture) => [picture.key, picture]));
  if (!pictures.size) return;
  if (pictures.size > MAX_PICTURES) return `Нэг удаад ${MAX_PICTURES} хүртэл TikZ зураг хадгална.`;
  if ([...pictures.values()].some((picture) => picture.source.length > MAX_PICTURE_LENGTH)) return "TikZ код хэт урт байна.";

  const admin = await ensureImageBucket();
  const bucket = admin.storage.from(QUESTION_IMAGE_BUCKET);
  for (const picture of pictures.values()) {
    const { data: found } = await bucket.list("tikz", { search: picture.key, limit: 1 });
    if (found?.some((file) => file.name === `${picture.key}.svg`)) continue;
    let svg: string;
    try {
      svg = await renderTikz(picture.source, picture.preamble);
    } catch (error) {
      return error instanceof TikzRenderError ? `TikZ зургийг зурж чадсангүй: ${error.message}` : "TikZ зургийг зурж чадсангүй.";
    }
    const { error } = await bucket.upload(`tikz/${picture.key}.svg`, new Blob([svg], { type: "image/svg+xml" }), { contentType: "image/svg+xml", upsert: true, cacheControl: "31536000" });
    if (error) return "TikZ зургийг хадгалж чадсангүй.";
  }
}
