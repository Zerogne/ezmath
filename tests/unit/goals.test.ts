import { describe, expect, it } from "vitest";
import { daysUntil, examDate, goalFromProfile } from "@/lib/goals";

describe("exam countdown", () => {
  const goal = goalFromProfile({ target_exam: "BOTH", eyesh_exam_year: 2027, sat_exam_month: "2027-03-01" })!;
  it("puts ЭЕШ on 1 June of the chosen year", () => {
    expect(examDate(goal, "EYESH")?.toISOString()).toBe("2027-06-01T00:00:00.000Z");
  });
  it("uses the first of the SAT month", () => {
    expect(examDate(goal, "SAT")?.toISOString()).toBe("2027-03-01T00:00:00.000Z");
  });
  it("counts whole days, rounding up", () => {
    expect(daysUntil(new Date("2027-06-01T00:00:00Z"), new Date("2027-05-30T12:00:00Z"))).toBe(2);
  });
  it("has no goal before onboarding", () => {
    expect(goalFromProfile(null)).toBeNull();
  });
});
