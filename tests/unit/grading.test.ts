import { describe, expect, it } from "vitest";
import { gradeWritten } from "@/lib/exam/grade-question";
import { isValidSatResponse, satAnswerMatches } from "@/lib/exam/sat-answer";

describe("SAT grid-in answers", () => {
  it("accepts equal fractions and decimals", () => {
    expect(satAnswerMatches("3/4", "0.75")).toBe(true);
    expect(satAnswerMatches(".75", "3/4")).toBe(true);
    expect(satAnswerMatches("0.75", "3/4")).toBe(true);
  });
  it("accepts a non-terminating decimal only when it fills the box", () => {
    expect(satAnswerMatches(".6666", "2/3")).toBe(true);
    expect(satAnswerMatches(".6667", "2/3")).toBe(true);
    expect(satAnswerMatches("0.667", "2/3")).toBe(true);
    expect(satAnswerMatches(".67", "2/3")).toBe(false);
  });
  it("handles negatives, commas and unicode minus", () => {
    expect(satAnswerMatches("−2", "-2")).toBe(true);
    expect(satAnswerMatches("1,5", "3/2")).toBe(true);
  });
  it("rejects wrong, empty and too-long answers", () => {
    expect(satAnswerMatches("5", "4")).toBe(false);
    expect(satAnswerMatches("", "4")).toBe(false);
    expect(isValidSatResponse("123456")).toBe(false);
    expect(isValidSatResponse("-12345")).toBe(true);
    expect(isValidSatResponse("1/0")).toBe(false);
  });
});

describe("written (multi-blank) answers", () => {
  const fields = [{ id: "a" }, { id: "b" }];
  const key: Record<string, string[]> = { a: ["2"], b: ["-3", "−3"] };
  const accepted = (id: string) => key[id] ?? [];

  it("is correct only when every blank matches", () => {
    expect(gradeWritten(fields, { a: "2", b: "-3" }, accepted, false)).toBe("correct");
    expect(gradeWritten(fields, { a: " 2 ", b: "−3" }, accepted, false)).toBe("correct");
    expect(gradeWritten(fields, { a: "2", b: "3" }, accepted, false)).toBe("incorrect");
    expect(gradeWritten(fields, { a: "2" }, accepted, false)).toBe("incorrect");
  });
  it("is unanswered when every blank is empty", () => {
    expect(gradeWritten(fields, {}, accepted, false)).toBe("unanswered");
    expect(gradeWritten(fields, { a: "  " }, accepted, false)).toBe("unanswered");
  });
  it("never counts a question with no blanks as correct", () => {
    expect(gradeWritten([], { a: "2" }, accepted, false)).toBe("unanswered");
  });
});
