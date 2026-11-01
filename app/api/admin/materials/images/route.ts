import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/auth";
import { QUESTION_IMAGE_MAX_BYTES, QUESTION_IMAGE_TYPES, uploadQuestionImages } from "@/lib/admin/question-images";

export const runtime = "nodejs";

const MAX_FILES = 40;

/** Uploads question/choice images for the material editor and the LaTeX importer. */
export async function POST(request: Request) {
  if (!await getAdminIdentity()) return NextResponse.json({ error: "Админ эрх шаардлагатай." }, { status: 403 });
  const form = await request.formData().catch(() => null);
  const files = form?.getAll("files").filter((value): value is File => value instanceof File) ?? [];
  if (!files.length) return NextResponse.json({ error: "Зураг сонгоогүй байна." }, { status: 400 });
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Нэг удаад ${MAX_FILES} хүртэл зураг оруулна.` }, { status: 400 });
  const invalid = files.find((file) => !QUESTION_IMAGE_TYPES[file.type] || file.size > QUESTION_IMAGE_MAX_BYTES);
  if (invalid) return NextResponse.json({ error: `${invalid.name}: зөвхөн PNG, JPG, WebP, 10MB хүртэл.` }, { status: 400 });
  try {
    return NextResponse.json({ urls: await uploadQuestionImages(files) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Зургийг хадгалж чадсангүй." }, { status: 500 });
  }
}
