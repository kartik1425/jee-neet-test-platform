import { describe, it, expect } from "vitest";

export interface TestMarkingScheme {
  correctMarks: number;
  incorrectNegativeMarks: number; // e.g. -1 for -1 penalty
  unattemptedMarks: number;
}

export interface MCQQuestionResult {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
}

/**
 * Deterministic scoring function reading test-level marking configuration.
 * V1 supports MCQ questions strictly.
 */
export function calculateMCQTestScore(
  markingScheme: TestMarkingScheme,
  answers: MCQQuestionResult[]
) {
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  for (const item of answers) {
    if (!item.selectedOptionId) {
      unattemptedCount++;
    } else if (item.selectedOptionId === item.correctOptionId) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  }

  const totalScore =
    correctCount * markingScheme.correctMarks +
    incorrectCount * markingScheme.incorrectNegativeMarks +
    unattemptedCount * markingScheme.unattemptedMarks;

  const attemptedCount = correctCount + incorrectCount;
  const accuracyPercentage =
    attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

  return {
    totalQuestions: answers.length,
    attemptedCount,
    correctCount,
    incorrectCount,
    unattemptedCount,
    totalScore,
    accuracyPercentage: Math.round(accuracyPercentage * 100) / 100,
  };
}

describe("Test-Level Configurable MCQ Scoring Engine", () => {
  it("computes standard JEE Main MCQ test scheme (+4, -1, 0)", () => {
    const jeeMainScheme: TestMarkingScheme = {
      correctMarks: 4,
      incorrectNegativeMarks: -1,
      unattemptedMarks: 0,
    };

    const mockAnswers: MCQQuestionResult[] = [
      { questionId: "q1", selectedOptionId: "optA", correctOptionId: "optA" }, // Correct (+4)
      { questionId: "q2", selectedOptionId: "optB", correctOptionId: "optA" }, // Incorrect (-1)
      { questionId: "q3", selectedOptionId: null, correctOptionId: "optC" },   // Unattempted (0)
      { questionId: "q4", selectedOptionId: "optD", correctOptionId: "optD" }, // Correct (+4)
    ];

    const result = calculateMCQTestScore(jeeMainScheme, mockAnswers);

    expect(result.totalQuestions).toBe(4);
    expect(result.correctCount).toBe(2);
    expect(result.incorrectCount).toBe(1);
    expect(result.unattemptedCount).toBe(1);
    expect(result.totalScore).toBe(7); // 4 - 1 + 0 + 4 = 7
    expect(result.accuracyPercentage).toBe(66.67);
  });

  it("computes custom sectional practice test scheme (+3, -0.5, 0)", () => {
    const customScheme: TestMarkingScheme = {
      correctMarks: 3,
      incorrectNegativeMarks: -0.5,
      unattemptedMarks: 0,
    };

    const mockAnswers: MCQQuestionResult[] = [
      { questionId: "q1", selectedOptionId: "optA", correctOptionId: "optA" }, // +3
      { questionId: "q2", selectedOptionId: "optB", correctOptionId: "optC" }, // -0.5
      { questionId: "q3", selectedOptionId: "optC", correctOptionId: "optC" }, // +3
    ];

    const result = calculateMCQTestScore(customScheme, mockAnswers);

    expect(result.totalScore).toBe(5.5);
    expect(result.accuracyPercentage).toBe(66.67);
  });

  it("computes penalty-free practice test scheme (+2, 0, 0)", () => {
    const zeroNegativeScheme: TestMarkingScheme = {
      correctMarks: 2,
      incorrectNegativeMarks: 0,
      unattemptedMarks: 0,
    };

    const mockAnswers: MCQQuestionResult[] = [
      { questionId: "q1", selectedOptionId: "optA", correctOptionId: "optA" }, // +2
      { questionId: "q2", selectedOptionId: "optB", correctOptionId: "optC" }, // 0
      { questionId: "q3", selectedOptionId: null, correctOptionId: "optC" },   // 0
    ];

    const result = calculateMCQTestScore(zeroNegativeScheme, mockAnswers);

    expect(result.totalScore).toBe(2);
  });
});
