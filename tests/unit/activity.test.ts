import { describe, expect, it } from "vitest";
import { mnDay, summarizeActivity, type DayActivity } from "@/lib/data/student-activity";

const day = (date: string, problems = 5, lessons = 0): DayActivity => ({ day: date, problems, correct: 0, lessons });

describe("mnDay", () => {
  it("uses Ulaanbaatar time (UTC+8), not the server's", () => {
    expect(mnDay("2026-11-08T15:59:00Z")).toBe("2026-11-08");
    expect(mnDay("2026-11-08T16:00:00Z")).toBe("2026-11-09");
  });
});

describe("summarizeActivity", () => {
  const today = "2026-11-11"; // a Wednesday

  it("counts consecutive days ending today", () => {
    const result = summarizeActivity([day("2026-11-09"), day("2026-11-10"), day("2026-11-11", 12)], today);
    expect(result.streak).toBe(3);
    expect(result.activeToday).toBe(true);
    expect(result.solvedToday).toBe(12);
  });
  it("keeps yesterday's streak alive until today ends", () => {
    const result = summarizeActivity([day("2026-11-09"), day("2026-11-10")], today);
    expect(result.streak).toBe(2);
    expect(result.activeToday).toBe(false);
  });
  it("breaks on a missed day and remembers the best run", () => {
    const rows = [day("2026-11-01"), day("2026-11-02"), day("2026-11-03"), day("2026-11-04"), day("2026-11-10"), day("2026-11-11")];
    const result = summarizeActivity(rows, today);
    expect(result.streak).toBe(2);
    expect(result.bestStreak).toBe(4);
  });
  it("counts a lesson-only day as active", () => {
    expect(summarizeActivity([day("2026-11-11", 0, 1)], today).streak).toBe(1);
  });
  it("lays the week out Monday to Sunday", () => {
    const { week } = summarizeActivity([day("2026-11-09", 7)], today);
    expect(week.map((item) => item.day)).toEqual(["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"]);
    expect(week[0].problems).toBe(7);
    expect(week[2].isToday).toBe(true);
  });
  it("handles no activity", () => {
    expect(summarizeActivity([], today)).toMatchObject({ streak: 0, bestStreak: 0, activeToday: false, solvedToday: 0 });
  });
});
