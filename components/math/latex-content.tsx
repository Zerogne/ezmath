import { renderLatex } from "@/lib/latex/render";

/**
 * Renders a LaTeX field (text mode + math + lists + tables + TikZ) as HTML.
 * Safe to use in server and client components: renderLatex escapes all text and emits only its own tags.
 */
export function LatexContent({ source, tikzImages, className = "" }: { source: string; tikzImages?: Record<string, string>; className?: string }) {
  return <div className={`latex-content ${className}`} dangerouslySetInnerHTML={{ __html: renderLatex(source, tikzImages) }}/>;
}
