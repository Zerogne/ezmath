import { describe, expect, it } from "vitest";
import { summarizeActivity, type DayActivity } from "@/lib/data/student-activity";
import { startOfUlaanbaatarDay, ulaanbaatarDay, ulaanbaatarWeekday, ulaanbaatarWeekStart } from "@/lib/ulaanbaatar-time";

const day = (date: string, problems = 5, lessons = 0): DayActivity => ({ day: date, problems, correct: 0, lessons });

describe("Ulaanbaatar time", () => {
  it("uses UTC+8 for the calendar day, not the server's zone", () => {
    expect(ulaanbaatarDay("2026-11-08T15:59:00Z")).toBe("2026-11-08");
    expect(ulaanbaatarDay("2026-11-08T16:00:00Z")).toBe("2026-11-09");
  });
  it("starts the day at 00:00 Ulaanbaatar (16:00 UTC the day before)", () => {
    expect(startOfUlaanbaatarDay(new Date("2026-11-09T03:00:00Z"))).toBe("2026-11-08T16:00:00.000Z");
  });
  it("starts the week on Monday", () => {
    // Sunday 23:30 in Ulaanbaatar is still the old week; 00:30 Monday is the new one.
    expect(ulaanbaatarWeekday(new Date("2026-11-15T15:30:00Z"))).toBe(6);
    expect(ulaanbaatarWeekStart(new Date("2026-11-15T15:30:00Z"))).toBe("2026-11-09");
    expect(ulaanbaatarWeekStart(new Date("2026-11-15T16:30:00Z"))).toBe("2026-11-16");
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
