"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { submitTestAttempt } from "@/app/tests/actions";
import { useTestSession } from "@/lib/exam/test-session";
import { testStorage } from "@/lib/exam/test-storage";
import type { StudentQuestion, Test } from "@/types/exam";
import { ExamHeader } from "./exam-header";
import { FinishTestDialog } from "./finish-test-dialog";
import { QuestionGrid } from "./question-grid";
import { QuestionNavigation } from "./question-navigation";
import { QuestionView } from "./question-view";

export function ExamShell({ test, questions }: { test: Test; questions: StudentQuestion[] }) {
  const router = useRouter();
  const { session, dispatch, ready, restored, syncStatus } = useTestSession(test.id, test.durationMinutes * 60);
  const [timerVisible, setTimerVisible] = useState(true);
  const [gridOpen, setGridOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="h-1 bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${((session.currentQuestionIndex + 1) / questions.length) * 100}%` }}/></div>
    <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="overflow-y-auto px-5 py-8 sm:px-10 sm:py-12"><QuestionView question={current} total={questions.length} answer={session.answers[current.id]} marked={session.markedForReview.includes(current.id)} onAnswer={(choiceId) => dispatch({ type: "answer", questionId: current.id, choiceId })} onMark={() => dispatch({ type: "mark", questionId: current.id })}/>{submitError && <p role="alert" className="mx-auto mt-5 max-w-3xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>}</div><aside className="hidden overflow-y-auto border-l bg-background p-6 lg:block"><QuestionGrid questions={questions} currentIndex={session.currentQuestionIndex} answers={session.answers} marked={session.markedForReview} onSelect={updateIndex}/></aside></main>
    <QuestionNavigation index={session.currentQuestionIndex} total={questions.length} onPrevious={() => updateIndex(session.currentQuestionIndex - 1)} onNext={() => updateIndex(session.currentQuestionIndex + 1)} onToggleGrid={() => setGridOpen(true)}/>
    {gridOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setGridOpen(false)}><aside className="absolute inset-y-0 right-0 w-[min(88vw,360px)] overflow-y-auto bg-background p-6 shadow-xl"><button onClick={() => setGridOpen(false)} className="absolute right-4 top-4 rounded-lg p-2 hover:bg-muted" aria-label="Хаах"><X size={20}/></button><QuestionGrid questions={questions} currentIndex={session.currentQuestionIndex} answers={session.answers} marked={session.markedForReview} onSelect={updateIndex}/></aside></div>}
    <FinishTestDialog open={finishOpen} answered={Object.keys(session.answers).length} total={questions.length} marked={session.markedForReview.length} onClose={() => !submitting && setFinishOpen(false)} onConfirm={() => void finish()}/>
  </div>;
}
