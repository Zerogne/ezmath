/** Browser-side call to the admin image upload route; returns public URLs in the order the files were given. */
export async function uploadQuestionImageFiles(files: File[]) {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  const response = await fetch("/api/admin/materials/images", { method: "POST", body: form });
  const body = await response.json().catch(() => ({})) as { urls?: string[]; error?: string };
  if (!response.ok || !body.urls) throw new Error(body.error ?? "Зургийг хадгалж чадсангүй.");
  return body.urls;
}

/** Matches `\includegraphics{figures/Graph.PNG}` to an attached `graph.png`: folders, extension and case are ignored. */
export function imageKey(name: string) {
  return (name.split(/[\\/]/).pop() ?? name).replace(/\.[a-z0-9]+$/i, "").trim().toLowerCase();
}

export type TikzRender = { svg: string } | { error: string };

/** Renders the importer's `tikzpicture` blocks on the server; results come back in the order given. */
export async function renderTikzPictures(pictures: string[], preamble: string) {
  const response = await fetch("/api/admin/materials/tikz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pictures, preamble }) });
  const body = await response.json().catch(() => ({})) as { results?: TikzRender[]; error?: string };
  if (!response.ok || !body.results) throw new Error(body.error ?? "TikZ зургийг зурж чадсангүй.");
  return body.results;
}
