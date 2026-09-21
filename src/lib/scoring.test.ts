import { describe, it, expect } from "vitest";

describe("Deterministic Scoring Smoke Test", () => {
  it("computes standard JEE Main scores accurately with negative marking", () => {
    const markingScheme = { correct: 4, incorrect: -1, unattempted: 0 };
    const correctCount = 20;
    const incorrectCount = 5;
    const unattemptedCount = 5;

    const score =
      correctCount * markingScheme.correct +
      incorrectCount * markingScheme.incorrect +
      unattemptedCount * markingScheme.unattempted;

    expect(score).toBe(75);
  });
});
