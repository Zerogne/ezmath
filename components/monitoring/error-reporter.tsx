"use client";

import { useEffect } from "react";
import { clientRollbar } from "@/lib/monitoring/client";

/** Starts browser error capture once per page load. Renders nothing. */
export function ErrorReporter() {
  useEffect(() => { clientRollbar(); }, []);
  return null;
}
