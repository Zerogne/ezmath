"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Maximize2, ShieldCheck, X } from "lucide-react";
import { startTestAttempt, submitTestAttempt } from "@/app/tests/actions";
import { useTestSession } from "@/lib/exam/test-session";
import { testStorage } from "@/lib/exam/test-storage";
import type { StudentQuestion, Test } from "@/types/exam";
import { ExamHeader } from "./exam-header";
import { FinishTestDialog } from "./finish-test-dialog";
import { QuestionGrid } from "./question-grid";
import { QuestionNavigation } from "./question-navigation";
import { QuestionView } from "./question-view";

const subscribeToBrowserCapabilities = () => () => undefined;

export function ExamShell({ test, questions }: { test: Test; questions: StudentQuestion[] }) {
  const router = useRouter();
  const [monitoringStarted, setMonitoringStarted] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const fullscreenSupported = useSyncExternalStore(subscribeToBrowserCapabilities, () => typeof document.documentElement.requestFullscreen === "function", () => false);
  const { session, dispatch, ready, restored, syncStatus } = useTestSession(test.id, test.durationMinutes * 60, monitoringStarted && fullscreenActive);
  const [timerVisible, setTimerVisible] = useState(true);
  const [gridOpen, setGridOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [integrityWarning, setIntegrityWarning] = useState<string | null>(null);

  const reportViolation = useCallback((eventType: "page_hidden" | "window_blur" | "fullscreen_exit") => {
    if (!session.attemptId || session.status !== "in_progress") return;
    const labels = { page_hidden: "Шалгалтын табаас гарсан", window_blur: "Шалгалтын цонх фокусаа алдсан", fullscreen_exit: "Бүтэн дэлгэцийн горимоос гарсан" };
    setViolationCount((count) => count + 1);
    setIntegrityWarning(`${labels[eventType]}. Энэ үйлдэл багшид харагдахаар тэмдэглэгдлээ.`);
    void fetch("/api/test-attempts/integrity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ attemptId: session.attemptId, eventType, occurredAt: new Date().toISOString() }),
      keepalive: true,
    });
  }, [session.attemptId, session.status]);

  useEffect(() => {
    if (!monitoringStarted || !session.attemptId || session.status !== "in_progress") return;
    const onVisibility = () => { if (document.hidden) reportViolation("page_hidden"); };
    const onBlur = () => reportViolation("window_blur");
    const onFullscreen = () => {
      const active = Boolean(document.fullscreenElement);
      setFullscreenActive(active);
      if (!active) reportViolation("fullscreen_exit");
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    if (fullscreenSupported) document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      if (fullscreenSupported) document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [fullscreenSupported, monitoringStarted, reportViolation, session.attemptId, session.status]);

  async function enterMonitoredMode() {
    setStartError(null);
    try {
      if (fullscreenSupported) await document.documentElement.requestFullscreen();
      if (!session.attemptId) {
        const attemptId = await startTestAttempt(test.id, new Date().toISOString());
        if (!attemptId) throw new Error("attempt_not_created");
        dispatch({ type: "attempt", attemptId });
      }
      setFullscreenActive(true);
      setMonitoringStarted(true);
    } catch {
      if (fullscreenSupported && document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      setStartError("Шалгалтыг эхлүүлэхийн тулд бүтэн дэлгэцийн зөвшөөрлийг идэвхжүүлнэ үү.");
    }
  }

  const finish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitTestAttempt({ attemptId: session.attemptId, testId: test.id, answers: Object.entries(session.answers).map(([questionId, selectedChoiceId]) => ({ questionId, selectedChoiceId })), markedForReview: session.markedForReview, durationSeconds: test.durationMinutes * 60 - session.remainingSeconds, startedAt: session.startedAt });
      dispatch({ type: "submitted" });
      testStorage.saveCompleted({ ...session, status: "submitted", completedAt: new Date().toISOString(), result });
      testStorage.clear(test.id);
      router.replace(`/tests/${test.id}/result`);
    } catch {
      setSubmitError("Шалгалтыг илгээж чадсангүй. Таны хариулт төхөөрөмж дээр хадгалагдсан. Холболтоо шалгаад дахин оролдоно уу.");
      setSubmitting(false);
    }
  }, [dispatch, router, session, submitting, test]);

  useEffect(() => { if (ready && session.remainingSeconds <= 0 && session.status === "in_progress") {
    // Timer expiry is an external clock event that submits the current snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void finish();
  } }, [finish, ready, session.remainingSeconds, session.status]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (session.status === "in_progress") event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [session.status]);

  if (!ready) return <div className="grid min-h-screen place-items-center bg-white text-sm text-muted-foreground">Шалгалтыг бэлдэж байна…</div>;
  const current = questions[session.currentQuestionIndex];
  if (!current) return <div className="grid min-h-screen place-items-center">Асуулт олдсонгүй.</div>;
  const updateIndex = (index: number) => { dispatch({ type: "navigate", index }); setGridOpen(false); };
  const syncLabel = syncStatus === "saving" ? "Хадгалж байна…" : syncStatus === "offline" ? "Офлайн · төхөөрөмжид хадгалсан" : "Хадгалагдсан";

  return <div className="flex h-dvh flex-col bg-white">
    <ExamHeader title={test.examType === "SAT" ? `SAT ${test.subject}` : test.title} module={test.module} seconds={session.remainingSeconds} timerVisible={timerVisible} syncLabel={syncLabel} onTimerToggle={() => setTimerVisible((value) => !value)} onFinish={() => setFinishOpen(true)}/>
    {restored && <div className="border-b bg-emerald-50 px-4 py-1.5 text-center text-xs text-primary">Өмнөх оролдлогыг сэргээж үргэлжлүүллээ.</div>}
    {integrityWarning && <div role="alert" className="flex items-center justify-center gap-2 border-b bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-800"><AlertTriangle size={15}/>{integrityWarning} <button type="button" className="ml-2 underline" onClick={() => setIntegrityWarning(null)}>Хаах</button></div>}
    <div className="h-1 bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${((session.currentQuestionIndex + 1) / questions.length) * 100}%` }}/></div>
    <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="overflow-y-auto px-5 py-8 sm:px-10 sm:py-12"><QuestionView question={current} total={questions.length} answer={session.answers[current.id]} marked={session.markedForReview.includes(current.id)} onAnswer={(choiceId) => dispatch({ type: "answer", questionId: current.id, choiceId })} onMark={() => dispatch({ type: "mark", questionId: current.id })}/>{submitError && <p role="alert" className="mx-auto mt-5 max-w-3xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>}</div><aside className="hidden overflow-y-auto border-l bg-background p-6 lg:block"><QuestionGrid questions={questions} currentIndex={session.currentQuestionIndex} answers={session.answers} marked={session.markedForReview} onSelect={updateIndex}/></aside></main>
    <QuestionNavigation index={session.currentQuestionIndex} total={questions.length} onPrevious={() => updateIndex(session.currentQuestionIndex - 1)} onNext={() => updateIndex(session.currentQuestionIndex + 1)} onToggleGrid={() => setGridOpen(true)}/>
    {gridOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setGridOpen(false)}><aside className="absolute inset-y-0 right-0 w-[min(88vw,360px)] overflow-y-auto bg-background p-6 shadow-xl"><button type="button" onClick={() => setGridOpen(false)} className="absolute right-4 top-4 rounded-lg p-2 hover:bg-muted" aria-label="Хаах"><X size={20}/></button><QuestionGrid questions={questions} currentIndex={session.currentQuestionIndex} answers={session.answers} marked={session.markedForReview} onSelect={updateIndex}/></aside></div>}
    <FinishTestDialog open={finishOpen} answered={Object.keys(session.answers).length} total={questions.length} marked={session.markedForReview.length} onClose={() => !submitting && setFinishOpen(false)} onConfirm={() => void finish()}/>
    {(!monitoringStarted || !fullscreenActive) && session.status === "in_progress" && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="integrity-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck size={27}/></span><h2 id="integrity-title" className="mt-5 text-xl font-bold">{monitoringStarted ? "Шалгалт түр зогслоо" : !fullscreenSupported ? "Гар утасны хяналттай шалгалт" : "Хяналттай шалгалт"}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{monitoringStarted ? "Үргэлжлүүлэхийн тулд бүтэн дэлгэцийн горимд дахин орно уу." : !fullscreenSupported ? "Таны браузер бүтэн дэлгэц дэмжихгүй байна. Апп солих, дэлгэц түгжих, таб солих болон фокус алдах үйлдэл тэмдэглэгдэнэ." : "Эхэлсний дараа таб солих, цонхны фокус алдах болон бүтэн дэлгэцээс гарах үйлдэл бүр тэмдэглэгдэж багшид харагдана."}</p>{violationCount > 0 && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">Тэмдэглэгдсэн үйлдэл: {violationCount}</p>}{startError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{startError}</p>}<button type="button" onClick={() => void enterMonitoredMode()} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"><Maximize2 size={17}/>{!fullscreenSupported ? "Шалгалт эхлэх" : monitoringStarted ? "Бүтэн дэлгэцээр үргэлжлүүлэх" : "Бүтэн дэлгэцээр эхлэх"}</button></section></div>}
  </div>;
}
