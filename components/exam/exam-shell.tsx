"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Maximize2, Play, ShieldCheck, X } from "lucide-react";
import { startTestAttempt, submitTestAttempt } from "@/app/tests/actions";
import { useTestSession } from "@/lib/exam/test-session";
import { testStorage } from "@/lib/exam/test-storage";
import { enterFullscreen, exitFullscreen, fullscreenSupported as browserSupportsFullscreen, isFullscreen, subscribeToFullscreen } from "@/lib/exam/fullscreen";
import type { StudentQuestion, Test } from "@/types/exam";
import { ButtonLink } from "@/components/ui/button";
import { ExamHeader } from "./exam-header";
import { FinishTestDialog } from "./finish-test-dialog";
import { QuestionGrid } from "./question-grid";
import { QuestionNavigation } from "./question-navigation";
import { QuestionView } from "./question-view";

const subscribeToBrowserCapabilities = () => () => undefined;
const START_ERROR_MESSAGES = { limit_reached: "Багцгүй эрхээр 1 бүтэн шалгалт өгөх боломжтой. Үргэлжлүүлэхийн тулд багц сонгоно уу.", failed: "Оролдлого үүсгэж чадсангүй. Дахин оролдоно уу.", unavailable: "Энэ шалгалт одоогоор нээлттэй биш байна." } as const;
const CONNECTION_ERROR = "Сервертэй холбогдож чадсангүй. Хуудсаа шинэчлээд (refresh) дахин оролдоно уу. Хариултууд тань хадгалагдсан.";

export function ExamShell({ test, questions, isAuthenticated = true, monitored = true }: { test: Test; questions: StudentQuestion[]; isAuthenticated?: boolean; monitored?: boolean }) {
  const router = useRouter();
  const [monitoringStarted, setMonitoringStarted] = useState(false);
  // Read from the browser itself, so the overlay can never disagree with the real fullscreen state.
  const fullscreenActive = useSyncExternalStore(subscribeToFullscreen, isFullscreen, () => false);
  const fullscreenSupported = useSyncExternalStore(subscribeToBrowserCapabilities, browserSupportsFullscreen, () => false);
  const useFullscreen = monitored && fullscreenSupported;
  // Set when the browser refuses fullscreen: the student continues anyway and the refusal is logged for the teacher.
  const [fullscreenRefused, setFullscreenRefused] = useState(false);
  const blocked = !monitoringStarted || (useFullscreen && !fullscreenActive && !fullscreenRefused);
  const { session, dispatch, ready, restored, syncStatus } = useTestSession(test.id, test.durationMinutes * 60, !blocked);
  const [timerVisible, setTimerVisible] = useState(true);
  const [gridOpen, setGridOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(!isAuthenticated);
  const [starting, setStarting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [integrityWarning, setIntegrityWarning] = useState<string | null>(null);

  const reportViolationFor = useCallback((attemptId: string, eventType: "page_hidden" | "window_blur" | "fullscreen_exit") => {
    const labels = { page_hidden: "Шалгалтын табаас гарсан", window_blur: "Сайтаас гарсан", fullscreen_exit: "Full screen горимоос гарсан" };
    setViolationCount((count) => count + 1);
    setIntegrityWarning(`${labels[eventType]}. Энэ үйлдэл багшид харагдахаар тэмдэглэгдлээ.`);
    void fetch("/api/test-attempts/integrity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ attemptId, eventType, occurredAt: new Date().toISOString() }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);
  const reportViolation = useCallback((eventType: "page_hidden" | "window_blur" | "fullscreen_exit") => {
    if (!session.attemptId || session.status !== "in_progress") return;
    reportViolationFor(session.attemptId, eventType);
  }, [reportViolationFor, session.attemptId, session.status]);

  useEffect(() => {
    if (!monitored || !monitoringStarted || !session.attemptId || session.status !== "in_progress") return;
    const onVisibility = () => { if (document.hidden) reportViolation("page_hidden"); };
    const onBlur = () => reportViolation("window_blur");
    const onFullscreen = () => { if (!isFullscreen()) reportViolation("fullscreen_exit"); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    const unsubscribe = useFullscreen ? subscribeToFullscreen(onFullscreen) : undefined;
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      unsubscribe?.();
    };
  }, [monitored, useFullscreen, monitoringStarted, reportViolation, session.attemptId, session.status]);

  async function enterMonitoredMode() {
    if (starting) return;
    setStarting(true);
    setStartError(null);
    setAuthRequired(false);
    // 1. Fullscreen first, while the click still counts as a user gesture. A refusal never blocks the exam.
    let refused = false;
    if (useFullscreen) {
      try { await enterFullscreen(); setFullscreenRefused(false); }
      catch { refused = true; setFullscreenRefused(true); }
    }
    try {
      // 2. On first start (and after a reload) confirm the attempt with the server. It returns the open attempt
      //    for this test or creates one, which also replaces a stale id left in this browser.
      let attemptId = session.attemptId;
      if (!monitoringStarted) {
        let result: Awaited<ReturnType<typeof startTestAttempt>>;
        try { result = await startTestAttempt(test.id, new Date().toISOString()); }
        catch { await exitFullscreen(); setStartError(CONNECTION_ERROR); return; }
        if (result.error === "auth_required") { await exitFullscreen(); setAuthRequired(true); return; }
        if (result.error) { await exitFullscreen(); setStartError(START_ERROR_MESSAGES[result.error]); return; }
        // A null id without an error means local mock mode (no database): the exam runs without a server attempt.
        if (result.attemptId && result.attemptId !== attemptId) { attemptId = result.attemptId; dispatch({ type: "attempt", attemptId }); }
      }
      setMonitoringStarted(true);
      if (refused && attemptId) reportViolationFor(attemptId, "fullscreen_exit");
    } finally {
      setStarting(false);
    }
  }

  const finish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitTestAttempt({ attemptId: session.attemptId, testId: test.id, answers: Object.entries(session.answers).map(([questionId, selectedChoiceId]) => ({ questionId, selectedChoiceId })), writtenAnswers: Object.entries(session.writtenAnswers).map(([questionId, responses]) => ({ questionId, responses })), markedForReview: session.markedForReview, durationSeconds: test.durationMinutes * 60 - session.remainingSeconds, startedAt: session.startedAt });
      dispatch({ type: "submitted" });
      testStorage.saveCompleted({ ...session, status: "submitted", completedAt: new Date().toISOString(), result });
      testStorage.clear(test.id);
      setMonitoringStarted(false);
      void exitFullscreen();
      router.replace(`/tests/${test.id}/result`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Шалгалтыг дуусгаж чадсангүй. Таны хариулт төхөөрөмж дээр хадгалагдсан.");
      setSubmitting(false);
    }
  }, [dispatch, router, session, submitting, test]);

  useEffect(() => { if (ready && session.remainingSeconds <= 0 && session.status === "in_progress") {
    // Timer expiry is an external clock event that submits the current snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void finish();
  } }, [finish, ready, session.remainingSeconds, session.status]);
  useEffect(() => { if (!monitored) return; const warn = (event: BeforeUnloadEvent) => { if (session.status === "in_progress") event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [monitored, session.status]);

  if (!ready) return <div className="grid min-h-screen place-items-center bg-white text-sm text-muted-foreground">Шалгалтыг бэлдэж байна…</div>;
  const current = questions[session.currentQuestionIndex];
  if (!current) return <div className="grid min-h-screen place-items-center">Асуулт олдсонгүй.</div>;
  const updateIndex = (index: number) => { dispatch({ type: "navigate", index }); setGridOpen(false); };
  const syncLabel = syncStatus === "saving" ? "Хадгалж байна…" : syncStatus === "offline" ? "Офлайн · төхөөрөмжид хадгалсан" : "Хадгалагдсан";
  const answeredQuestions = Object.fromEntries(questions.filter((question) => question.questionType === "multi-blank" ? Object.values(session.writtenAnswers[question.id] ?? {}).some((value) => value.trim()) : Boolean(session.answers[question.id])).map((question) => [question.id, session.answers[question.id] ?? "written"]));

  return <div className="flex h-dvh flex-col bg-white">
    <ExamHeader title={test.examType === "SAT" ? `SAT ${test.subject}` : test.title} module={test.module} seconds={session.remainingSeconds} timerVisible={timerVisible} syncLabel={syncLabel} onTimerToggle={() => setTimerVisible((value) => !value)} onFinish={() => setFinishOpen(true)}/>
    {restored && <div className="border-b bg-emerald-50 px-4 py-1.5 text-center text-xs text-primary">Өмнөх оролдлогыг сэргээж үргэлжлүүллээ.</div>}
    {integrityWarning && <div role="alert" className="flex items-center justify-center gap-2 border-b bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-800"><AlertTriangle size={15}/>{integrityWarning} <button type="button" className="ml-2 underline" onClick={() => setIntegrityWarning(null)}>Хаах</button></div>}
    <div className="h-1 bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${((session.currentQuestionIndex + 1) / questions.length) * 100}%` }}/></div>
    <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="overflow-y-auto px-5 py-8 sm:px-10 sm:py-12"><QuestionView question={current} examType={test.examType} total={questions.length} answer={session.answers[current.id]} writtenAnswers={session.writtenAnswers[current.id]} marked={session.markedForReview.includes(current.id)} onAnswer={(choiceId) => dispatch({ type: "answer", questionId: current.id, choiceId })} onWrite={(fieldId, value) => dispatch({ type: "write", questionId: current.id, fieldId, value })} onMark={() => dispatch({ type: "mark", questionId: current.id })}/>{submitError && <p role="alert" className="mx-auto mt-5 max-w-3xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>}</div><aside className="hidden overflow-y-auto border-l bg-background p-6 lg:block"><QuestionGrid questions={questions} currentIndex={session.currentQuestionIndex} answers={answeredQuestions} marked={session.markedForReview} onSelect={updateIndex}/></aside></main>
    <QuestionNavigation index={session.currentQuestionIndex} total={questions.length} onPrevious={() => updateIndex(session.currentQuestionIndex - 1)} onNext={() => updateIndex(session.currentQuestionIndex + 1)} onToggleGrid={() => setGridOpen(true)}/>
    {gridOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setGridOpen(false)}><aside className="absolute inset-y-0 right-0 w-[min(88vw,360px)] overflow-y-auto bg-background p-6 shadow-xl"><button type="button" onClick={() => setGridOpen(false)} className="absolute right-4 top-4 rounded-lg p-2 hover:bg-muted" aria-label="Хаах"><X size={20}/></button><QuestionGrid questions={questions} currentIndex={session.currentQuestionIndex} answers={answeredQuestions} marked={session.markedForReview} onSelect={updateIndex}/></aside></div>}
    <FinishTestDialog open={finishOpen} answered={Object.keys(answeredQuestions).length} total={questions.length} marked={session.markedForReview.length} submitting={submitting} onClose={() => !submitting && setFinishOpen(false)} onConfirm={() => void finish()}/>
    {blocked && session.status === "in_progress" && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="integrity-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">{monitored ? <ShieldCheck size={27}/> : <Play size={27}/>}</span><h2 id="integrity-title" className="mt-5 text-xl font-bold">{authRequired ? "Нэвтэрнэ үү" : monitoringStarted ? "Шалгалт түр зогслоо" : !monitored ? "Шалгалт эхлэх" : !fullscreenSupported ? "Гар утасны хяналттай шалгалт" : "Хяналттай шалгалт"}</h2>{!authRequired && <p className="mt-3 text-sm leading-6 text-muted-foreground">{monitoringStarted ? "Үргэлжлүүлэхийн тулд бүтэн дэлгэцийн горимд дахин орно уу." : !monitored ? "Хариултууд автоматаар хадгалагдана. Хүссэн үедээ гарч, дараа нь үргэлжлүүлж болно." : !fullscreenSupported ? "Таны browser Full screen горимыг дэмжихгүй байна. Апп солих, дэлгэц түгжих, таб солих, фокус алдах үйлдэл тэмдэглэгдэнэ." : "Эхэлсний дараа таб солих, цонхны фокус алдах болон бүтэн дэлгэцээс гарах үйлдэл бүр тэмдэглэгдэж багшид харагдана."}</p>}{violationCount > 0 && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">Тэмдэглэгдсэн үйлдэл: {violationCount}</p>}{authRequired ? <div className="mt-4"><p className="text-sm leading-6 text-muted-foreground">Шалгалт өгөхийн тулд нэвтэрнэ үү.</p><ButtonLink href={`/login?next=${encodeURIComponent(`/tests/${test.id}/take`)}`} className="mt-5 w-full">Нэвтрэх</ButtonLink></div> : <>{startError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{startError}</p>}<button type="button" disabled={starting} onClick={() => void enterMonitoredMode()} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-opacity disabled:opacity-70">{starting ? <Loader2 size={17} className="animate-spin"/> : useFullscreen ? <Maximize2 size={17}/> : <Play size={17}/>}{starting ? "Бэлдэж байна…" : !useFullscreen ? "Шалгалт эхлэх" : monitoringStarted ? "Full screen үргэлжлүүлэх" : "Full screen эхлэх"}</button></>}</section></div>}
  </div>;
}
