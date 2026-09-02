"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { checkpointTestSession } from "./test-sync";
import { testStorage } from "./test-storage";
import type { SyncStatus, TestSession } from "./test-types";

type Action = { type: "hydrate"; session: TestSession } | { type: "attempt"; attemptId: string } | { type: "answer"; questionId: string; choiceId: string } | { type: "write"; questionId: string; fieldId: string; value: string } | { type: "navigate"; index: number } | { type: "mark"; questionId: string } | { type: "tick" } | { type: "submitted" };
function reducer(session: TestSession, action: Action): TestSession {
  switch (action.type) {
    case "hydrate": return { ...action.session, writtenAnswers: action.session.writtenAnswers ?? {} };
    case "attempt": return { ...session, attemptId: action.attemptId, version: session.version + 1 };
    case "answer": return { ...session, answers: { ...session.answers, [action.questionId]: action.choiceId }, version: session.version + 1 };
    case "write": return { ...session, writtenAnswers: { ...session.writtenAnswers, [action.questionId]: { ...(session.writtenAnswers[action.questionId] ?? {}), [action.fieldId]: action.value } }, version: session.version + 1 };
    case "navigate": return { ...session, currentQuestionIndex: action.index, version: session.version + 1 };
    case "mark": return { ...session, markedForReview: session.markedForReview.includes(action.questionId) ? session.markedForReview.filter((id) => id !== action.questionId) : [...session.markedForReview, action.questionId], version: session.version + 1 };
    case "tick": return { ...session, remainingSeconds: Math.max(0, session.remainingSeconds - 1) };
    case "submitted": return { ...session, status: "submitted", version: session.version + 1 };
  }
}

export function useTestSession(testId: string, durationSeconds: number, active = true) {
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const [session, dispatch] = useReducer(reducer, null, (): TestSession => ({ testId, currentQuestionIndex: 0, answers: {}, writtenAnswers: {}, markedForReview: [], startedAt: new Date().toISOString(), remainingSeconds: durationSeconds, version: 0, status: "in_progress" }));
  const latestRef = useRef(session);
  useEffect(() => { latestRef.current = session; }, [session]);

  useEffect(() => {
    const stored = testStorage.load(testId);
    if (stored?.status === "in_progress") {
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(stored.lastSavedAt ?? stored.startedAt).getTime()) / 1000));
      const recovered = { ...stored, remainingSeconds: Math.max(0, stored.remainingSeconds - elapsed) };
      // Browser persistence is necessarily hydrated after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRestored(true);
      dispatch({ type: "hydrate", session: recovered });
      latestRef.current = recovered;
    }
    setReady(true);
  }, [testId]);

  useEffect(() => { if (!ready) return; testStorage.save({ ...latestRef.current, lastSavedAt: new Date().toISOString() }); }, [ready, session.version, session.status]);
  useEffect(() => { if (!ready) return; const localTimer = window.setInterval(() => testStorage.save({ ...latestRef.current, lastSavedAt: new Date().toISOString() }), 5_000); return () => clearInterval(localTimer); }, [ready]);
  useEffect(() => { if (!ready || !active || session.status !== "in_progress") return; const timer = window.setInterval(() => dispatch({ type: "tick" }), 1000); return () => clearInterval(timer); }, [active, ready, session.status]);

  const sync = useCallback(async () => {
    const current = { ...latestRef.current, lastSavedAt: new Date().toISOString() };
    testStorage.save(current);
    if (!navigator.onLine) { setSyncStatus("offline"); return; }
    setSyncStatus("saving");
    try { await checkpointTestSession(current); setSyncStatus("saved"); }
    catch { setSyncStatus(navigator.onLine ? "saved" : "offline"); }
  }, []);

  useEffect(() => { if (!ready) return; const interval = window.setInterval(sync, 25_000); const onOnline = () => void sync(); const onOffline = () => setSyncStatus("offline"); const onVisibility = () => { if (document.visibilityState === "hidden") void sync(); }; window.addEventListener("online", onOnline); window.addEventListener("offline", onOffline); document.addEventListener("visibilitychange", onVisibility); return () => { clearInterval(interval); window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); document.removeEventListener("visibilitychange", onVisibility); }; }, [ready, sync]);

  return { session, dispatch, ready, restored, syncStatus };
}
