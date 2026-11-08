"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/monitoring/client";

/** Last-resort boundary for errors in the root layout itself; it replaces the whole document. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { reportClientError(error, { boundary: "global", digest: error.digest }); }, [error]);
  return <html lang="mn"><body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, textAlign: "center", padding: 16 }}>
    <div><h1 style={{ fontSize: 28, fontWeight: 500 }}>Алдаа гарлаа</h1><p style={{ color: "#5B6275" }}>Хуудсыг ачаалж чадсангүй. Дахин оролдоно уу.</p>
      <button type="button" onClick={() => retry()} style={{ marginTop: 16, height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#0B1030", color: "#fff", fontWeight: 600 }}>Дахин оролдох</button></div>
  </body></html>;
}
