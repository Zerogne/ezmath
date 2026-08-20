import type { CompletedAttempt, TestSession } from "./test-types";

const ACTIVE_PREFIX = "alphamath:session:v2:";
const RESULT_PREFIX = "alphamath:result:v2:";

function parse<T>(value: string | null): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export const testStorage = {
  load(testId: string) { return parse<TestSession>(localStorage.getItem(`${ACTIVE_PREFIX}${testId}`)); },
  save(session: TestSession) { localStorage.setItem(`${ACTIVE_PREFIX}${session.testId}`, JSON.stringify(session)); },
  clear(testId: string) { localStorage.removeItem(`${ACTIVE_PREFIX}${testId}`); },
  saveCompleted(attempt: CompletedAttempt) { localStorage.setItem(`${RESULT_PREFIX}${attempt.testId}`, JSON.stringify(attempt)); },
  loadCompleted(testId: string) { return parse<CompletedAttempt>(localStorage.getItem(`${RESULT_PREFIX}${testId}`)); },
};

export const loadSession = testStorage.load;
export const saveSession = testStorage.save;
export const clearSession = testStorage.clear;
export const saveCompletedAttempt = testStorage.saveCompleted;
export const loadCompletedAttempt = testStorage.loadCompleted;
