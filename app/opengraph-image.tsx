import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "EzMath — ЭЕШ ба SAT математикийн бэлтгэл";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Shared link preview (Facebook, Messenger, Telegram): Эзи, the wordmark and the two exams. */
export default async function Image() {
  const root = process.cwd();
  const [latin, cyrillic, ezi] = await Promise.all([
    readFile(join(root, "assets/fonts/onest-latin-600.woff")),
    readFile(join(root, "assets/fonts/onest-cyrillic-600.woff")),
    readFile(join(root, "public/illustrations/ezi-happy.svg")),
  ]);
  const eziSrc = `data:image/svg+xml;base64,${ezi.toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 48, padding: "0 80px", background: "#E8EEFF", fontFamily: "Onest, OnestCyrillic", color: "#0B1030" }}>
      <img src={eziSrc} width={280} height={280} alt=""/>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 96, letterSpacing: -3 }}>EzMath</div>
        <div style={{ marginTop: 12, fontSize: 42, lineHeight: 1.25, color: "#2B4BE8", maxWidth: 680 }}>ЭЕШ ба SAT математикийн бэлтгэл</div>
        <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.35, color: "#5B6275", maxWidth: 640 }}>Өмнөх оны хувилбар, mock сорил, хичээл, ахицын тайлан</div>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Onest", data: latin, weight: 600, style: "normal" }, { name: "OnestCyrillic", data: cyrillic, weight: 600, style: "normal" }] },
  );
}
