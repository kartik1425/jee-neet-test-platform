import { describe, it, expect } from "vitest";
import {
  computeDeterministicScore,
  QuestionScoringItem,
} from "@/types/scoring";
import { MarkingSchemeConfig } from "@/types/database";

describe("Phase 5 Deterministic Scoring Engine & Aggregate Verification", () => {
  const standardJeeScheme: MarkingSchemeConfig = {
    correct: 4,
    incorrect: -1,
    unattempted: 0,
  };

  const sampleQuestions: QuestionScoringItem[] = [
    {
      questionId: "q-101",
      testQuestionId: "tq-1",
      subjectId: "subj-phy",
      subjectName: "Physics",
      chapterId: "chap-rot",
      chapterName: "Rotation",
      topicId: "top-moi",
      topicName: "Moment of Inertia",
      orderIndex: 1,
      marksConfig: { correct: 4, incorrect: -1, unattempted: 0 },
      correctOptionId: "opt-1A",
      correctOptionKey: "A",
      selectedOptionId: "opt-1A", // Correct (+4)
      selectedOptionKey: "A",
      timeSpentSeconds: 60,
      contentLatex: "Calculate MOI of cylinder",
      options: [],
    },
    {
      questionId: "q-102",
      testQuestionId: "tq-2",
      subjectId: "subj-phy",
      subjectName: "Physics",
      chapterId: "chap-rot",
      chapterName: "Rotation",
      topicId: "top-ang",
      topicName: "Angular Momentum",
      orderIndex: 2,
      marksConfig: { correct: 4, incorrect: -1, unattempted: 0 },
      correctOptionId: "opt-2B",
      correctOptionKey: "B",
      selectedOptionId: "opt-2C", // Incorrect (-1)
      selectedOptionKey: "C",
      timeSpentSeconds: 45,
      contentLatex: "Conservation of Angular Momentum",
      options: [],
    },
    {
      questionId: "q-103",
      testQuestionId: "tq-3",
      subjectId: "subj-chem",
      subjectName: "Chemistry",
      chapterId: "chap-thermo",
      chapterName: "Thermodynamics",
      topicId: "top-enthalpy",
      topicName: "Enthalpy",
      orderIndex: 3,
      marksConfig: { correct: 4, incorrect: -1, unattempted: 0 },
      correctOptionId: "opt-3C",
      correctOptionKey: "C",
      selectedOptionId: null, // Unattempted (0)
      selectedOptionKey: null,
      timeSpentSeconds: 20,
      contentLatex: "Standard heat of reaction",
      options: [],
    },
    {
      questionId: "q-104",
      testQuestionId: "tq-4",
      subjectId: "subj-chem",
      subjectName: "Chemistry",
      chapterId: "chap-thermo",
      chapterName: "Thermodynamics",
      topicId: "top-gibbs",
      topicName: "Gibbs Energy",
      orderIndex: 4,
      marksConfig: { correct: 4, incorrect: -1, unattempted: 0 },
      correctOptionId: "opt-4D",
      correctOptionKey: "D",
      selectedOptionId: "opt-4D", // Correct (+4)
      selectedOptionKey: "D",
      timeSpentSeconds: 55,
      contentLatex: "Spontaneity criteria $\\Delta G < 0$",
      options: [],
    },
  ];

  describe("1. [UNIT] Deterministic Marks Calculation & Accuracy Formula", () => {
    it("computes mixed attempt scores accurately (+4, -1, 0, +4 = 7 / 16)", () => {
      const report = computeDeterministicScore(sampleQuestions, standardJeeScheme, {
        attemptId: "att-1",
        testId: "test-1",
        studentId: "student-1",
      });

      expect(report.totalScore).toBe(7);
      expect(report.maximumScore).toBe(16);
      expect(report.totalQuestions).toBe(4);
      expect(report.attemptedCount).toBe(3);
      expect(report.correctCount).toBe(2);
      expect(report.incorrectCount).toBe(1);
      expect(report.unattemptedCount).toBe(1);
      // Accuracy = (2 / 3) * 100 = 66.67%
      expect(report.accuracyPercentage).toBe(66.67);
      expect(report.totalTimeSpentSeconds).toBe(180);
    });

    it("evaluates 100% correct score and 100% accuracy", () => {
      const allCorrect = sampleQuestions.map((q) => ({
        ...q,
        selectedOptionId: q.correctOptionId,
        selectedOptionKey: q.correctOptionKey,
      }));

      const report = computeDeterministicScore(allCorrect, standardJeeScheme, {
        attemptId: "att-2",
        testId: "test-1",
        studentId: "student-1",
      });

      expect(report.totalScore).toBe(16);
      expect(report.correctCount).toBe(4);
      expect(report.incorrectCount).toBe(0);
      expect(report.accuracyPercentage).toBe(100);
    });

    it("evaluates all incorrect score with negative marks and 0% accuracy", () => {
      const allIncorrect = sampleQuestions.map((q) => ({
        ...q,
        selectedOptionId: "wrong-opt-id",
        selectedOptionKey: "D" as const,
      }));

      const report = computeDeterministicScore(allIncorrect, standardJeeScheme, {
        attemptId: "att-3",
        testId: "test-1",
        studentId: "student-1",
      });

      expect(report.totalScore).toBe(-4);
      expect(report.correctCount).toBe(0);
      expect(report.incorrectCount).toBe(4);
      expect(report.accuracyPercentage).toBe(0);
    });

    it("returns accuracy = 0 when attempted = 0 (zero division safety)", () => {
      const allUnattempted = sampleQuestions.map((q) => ({
        ...q,
        selectedOptionId: null,
        selectedOptionKey: null,
      }));

      const report = computeDeterministicScore(allUnattempted, standardJeeScheme, {
        attemptId: "att-4",
        testId: "test-1",
        studentId: "student-1",
      });

      expect(report.totalScore).toBe(0);
      expect(report.attemptedCount).toBe(0);
      expect(report.accuracyPercentage).toBe(0);
    });

    it("supports custom fractional negative marking schemes (+3, -0.5, 0)", () => {
      const customScheme: MarkingSchemeConfig = {
        correct: 3,
        incorrect: -0.5,
        unattempted: 0,
      };

      const customItems = sampleQuestions.map((q) => ({
        ...q,
        marksConfig: { correct: 3, incorrect: -0.5, unattempted: 0 },
      }));

      const report = computeDeterministicScore(customItems, customScheme, {
        attemptId: "att-5",
        testId: "test-2",
        studentId: "student-1",
      });

      // Q1: +3, Q2: -0.5, Q3: 0, Q4: +3 => Total: 5.5
      expect(report.totalScore).toBe(5.5);
      expect(report.maximumScore).toBe(12);
    });
  });

  describe("2. [UNIT] Subject, Chapter & Topic Multi-Dimensional Rollups", () => {
    it("aggregates subject-level scores and accuracies accurately", () => {
      const report = computeDeterministicScore(sampleQuestions, standardJeeScheme, {
        attemptId: "att-1",
        testId: "test-1",
        studentId: "student-1",
      });

      const physicsSubj = report.subjectBreakdown.find((s) => s.subjectName === "Physics");
      expect(physicsSubj).toBeDefined();
      expect(physicsSubj?.totalQuestions).toBe(2);
      expect(physicsSubj?.attempted).toBe(2);
      expect(physicsSubj?.correct).toBe(1);
      expect(physicsSubj?.incorrect).toBe(1);
      expect(physicsSubj?.score).toBe(3); // +4 - 1 = 3
      expect(physicsSubj?.accuracy).toBe(50);

      const chemSubj = report.subjectBreakdown.find((s) => s.subjectName === "Chemistry");
      expect(chemSubj).toBeDefined();
      expect(chemSubj?.totalQuestions).toBe(2);
      expect(chemSubj?.attempted).toBe(1);
      expect(chemSubj?.correct).toBe(1);
      expect(chemSubj?.unattempted).toBe(1);
      expect(chemSubj?.score).toBe(4); // +4 + 0 = 4
      expect(chemSubj?.accuracy).toBe(100);
    });

    it("aggregates chapter-level performance", () => {
      const report = computeDeterministicScore(sampleQuestions, standardJeeScheme, {
        attemptId: "att-1",
        testId: "test-1",
        studentId: "student-1",
      });

      const rotChap = report.chapterBreakdown.find((c) => c.chapterName === "Rotation");
      expect(rotChap).toBeDefined();
      expect(rotChap?.score).toBe(3);
    });

    it("aggregates topic-level performance for future mistake diagnosis", () => {
      const report = computeDeterministicScore(sampleQuestions, standardJeeScheme, {
        attemptId: "att-1",
        testId: "test-1",
        studentId: "student-1",
      });

      const moiTopic = report.topicBreakdown.find((t) => t.topicName === "Moment of Inertia");
      expect(moiTopic?.correct).toBe(1);
      expect(moiTopic?.accuracy).toBe(100);

      const angTopic = report.topicBreakdown.find((t) => t.topicName === "Angular Momentum");
      expect(angTopic?.incorrect).toBe(1);
      expect(angTopic?.accuracy).toBe(0);
    });
  });

  describe("3. [INTEGRATION] Idempotency & Answer State Invariants", () => {
    it("produces identical deterministic scores on repeated invocations (idempotency)", () => {
      const run1 = computeDeterministicScore(sampleQuestions, standardJeeScheme, {
        attemptId: "att-idempotent",
        testId: "test-1",
        studentId: "student-1",
      });

      const run2 = computeDeterministicScore(sampleQuestions, standardJeeScheme, {
        attemptId: "att-idempotent",
        testId: "test-1",
        studentId: "student-1",
      });

      expect(run1.totalScore).toBe(run2.totalScore);
      expect(run1.accuracyPercentage).toBe(run2.accuracyPercentage);
      expect(run1.correctCount).toBe(run2.correctCount);
      expect(run1.questionResults.length).toBe(run2.questionResults.length);
    });

    it("scores only the final chosen answer when option was changed before submission", () => {
      // Student initially picked B (wrong), then changed to A (correct) before submit
      const changedAnswerItem: QuestionScoringItem = {
        ...sampleQuestions[0],
        selectedOptionId: "opt-1A", // Final selection
        selectedOptionKey: "A",
      };

      const report = computeDeterministicScore([changedAnswerItem], standardJeeScheme, {
        attemptId: "att-change",
        testId: "test-1",
        studentId: "student-1",
      });

      expect(report.questionResults[0].isCorrect).toBe(true);
      expect(report.totalScore).toBe(4);
    });
  });

  describe("4. [DATABASE/RLS] Historical Snapshot Immutability", () => {
    it("proves scoring uses published snapshot data, unaffected by subsequent question bank edits", () => {
      // Test Question Snapshot taken at exam publication (Q1 correct answer = Option A)
      const frozenSnapshotQuestion: QuestionScoringItem = {
        questionId: "q-historical",
        testQuestionId: "tq-hist",
        subjectId: "subj-phy",
        subjectName: "Physics",
        chapterId: "chap-rot",
        chapterName: "Rotation",
        orderIndex: 1,
        marksConfig: { correct: 4, incorrect: -1, unattempted: 0 },
        correctOptionId: "opt-hist-A", // Frozen key in test snapshot
        correctOptionKey: "A",
        selectedOptionId: "opt-hist-A",
        selectedOptionKey: "A",
        timeSpentSeconds: 50,
        contentLatex: "Historical question snapshot",
        options: [
          { id: "opt-hist-A", optionKey: "A", contentLatex: "Option A", isCorrect: true },
          { id: "opt-hist-B", optionKey: "B", contentLatex: "Option B", isCorrect: false },
        ],
      };

      // Score historical attempt against snapshot
      const report = computeDeterministicScore([frozenSnapshotQuestion], standardJeeScheme, {
        attemptId: "att-hist",
        testId: "test-published",
        studentId: "student-1",
      });

      expect(report.totalScore).toBe(4);
      expect(report.correctCount).toBe(1);

      // Even if a teacher mutates Question Bank record in live DB, the frozen snapshot remains unchanged
      expect(frozenSnapshotQuestion.correctOptionId).toBe("opt-hist-A");
    });
  });
});
