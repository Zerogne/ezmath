import katex from "katex";

const mathPattern = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;

export function MathText({ children, className = "" }: { children: string; className?: string }) {
  const parts = children.split(mathPattern);
  return <span className={className}>{parts.map((part, index) => {
    const displayMode = (part.startsWith("$$") && part.endsWith("$$")) || (part.startsWith("\\[") && part.endsWith("\\]"));
    const inlineMode = (part.startsWith("$") && part.endsWith("$")) || (part.startsWith("\\(") && part.endsWith("\\)"));
    if (!displayMode && !inlineMode) return <span key={index}>{part}</span>;
    const singleDollar = part.startsWith("$") && !part.startsWith("$$");
    const latex = part.slice(singleDollar ? 1 : 2, singleDollar ? -1 : -2);
    const html = katex.renderToString(latex, { displayMode, throwOnError: false, strict: "warn", trust: false, output: "htmlAndMathml" });
    return <span key={index} className={displayMode ? "my-3 block overflow-x-auto py-1" : "inline-block max-w-full align-middle"} dangerouslySetInnerHTML={{ __html: html }} />;
  })}</span>;
}
