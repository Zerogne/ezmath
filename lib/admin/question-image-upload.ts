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
