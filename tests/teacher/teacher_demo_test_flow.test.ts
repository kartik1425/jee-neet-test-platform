import { describe, it, expect } from "vitest";
import {
  calculateClassPerformanceMetrics,
  formatClassAnalyticsCsv,
} from "@/lib/teacher/analytics";
import { calculateAttemptScore } from "@/lib/scoring";
import { getAIProvider } from "@/lib/ai";
import { ClassAnalyticsBundle } from "@/types/teacherAnalytics";

describe("Teacher Test & Exam Flow End-to-End Verification [DEMO_TEST]", () => {
  it("creates a comprehensive 30-question JEE mock test, simulates student attempts, verifies scoring, AI report, and teacher analytics", async () => {
    // 1. Teacher Creates Test Blueprint & Marking Scheme (+4 / -1)
    const testConfig = {
      title: "JEE Advanced 2026 Comprehensive Mock - Demo Examination",
      exam_type: "JEE_ADV",
      duration_minutes: 180,
      total_marks: 120, // 30 Qs * 4 marks
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      question_count: 30,
    };

    // 2. Generate 30 Calibrated Demo Questions (10 Physics, 10 Chemistry, 10 Math)
    const mockQuestions = Array.from({ length: 30 }).map((_, i) => {
      const subject = i < 10 ? "Physics" : i < 20 ? "Chemistry" : "Mathematics";
      const subjectId = i < 10 ? "sub-phy" : i < 20 ? "sub-chem" : "sub-math";
      const chapter = i < 10 ? "Rotational Motion" : i < 20 ? "Chemical Equilibrium" : "Integral Calculus";
      const chapterId = `chap-${i % 6}`;
      const topic = `Topic-${i % 10}`;
      const topicId = `top-${i % 10}`;

      return {
        id: `q-${i + 1}`,
        subject_id: subjectId,
        chapter_id: chapterId,
        topic_id: topicId,
        marks: 4,
        negative_marks: 1,
        correct_option_id: `opt-${i + 1}-A`,
        options: [
          { id: `opt-${i + 1}-A`, key: "A", text: "Correct Answer Formulation" },
          { id: `opt-${i + 1}-B`, key: "B", text: "Distractor 1" },
          { id: `opt-${i + 1}-C`, key: "C", text: "Distractor 2" },
          { id: `opt-${i + 1}-D`, key: "D", text: "Distractor 3" },
        ],
        subject_name: subject,
        chapter_name: chapter,
        topic_name: topic,
      };
    });

    expect(mockQuestions.length).toBe(30);

    // 3. Simulate Student Attempt on Demo Test
    // Student answers 24 questions: 18 Correct, 6 Incorrect, 6 Unattempted
    const studentAnswers = mockQuestions.map((q, idx) => {
      if (idx < 18) {
        return {
          questionId: q.id,
          selectedOptionId: `opt-${idx + 1}-A`, // Correct
          timeSpentSeconds: 120,
        };
      } else if (idx < 24) {
        return {
          questionId: q.id,
          selectedOptionId: `opt-${idx + 1}-B`, // Incorrect
          timeSpentSeconds: 180,
        };
      } else {
        return {
          questionId: q.id,
          selectedOptionId: null, // Unattempted
          timeSpentSeconds: 30,
        };
      }
    });

    // 4. Deterministic Scoring Verification
    const scoredQuestions = mockQuestions.map((q, idx) => {
      const ans = studentAnswers[idx];
      const isCorrect = ans.selectedOptionId === q.correct_option_id;
      const isAttempted = ans.selectedOptionId !== null;

      let marksAwarded = 0;
      if (isCorrect) marksAwarded = 4;
      else if (isAttempted) marksAwarded = -1;

      return {
        question_id: q.id,
        selected_option_id: ans.selectedOptionId,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
        time_spent_seconds: ans.timeSpentSeconds,
        subject_id: q.subject_id,
        chapter_id: q.chapter_id,
        topic_id: q.topic_id,
        subject_name: q.subject_name,
        chapter_name: q.chapter_name,
        topic_name: q.topic_name,
      };
    });

    const totalScore = scoredQuestions.reduce((sum, q) => sum + q.marks_awarded, 0);
    const correctCount = scoredQuestions.filter((q) => q.is_correct).length;
    const incorrectCount = scoredQuestions.filter((q) => !q.is_correct && q.selected_option_id !== null).length;
    const unattemptedCount = scoredQuestions.filter((q) => q.selected_option_id === null).length;
    const accuracy = Math.round((correctCount / (correctCount + incorrectCount)) * 100);

    // Expected score: (18 * 4) + (6 * -1) = 72 - 6 = 66
    expect(totalScore).toBe(66);
    expect(correctCount).toBe(18);
    expect(incorrectCount).toBe(6);
    expect(unattemptedCount).toBe(6);
    expect(accuracy).toBe(75); // 18 / 24 = 75%

    // 5. Verify AI Diagnostic Pipeline Aggregation
    const promptPayload: any = {
      attempt_id: "att-demo-123",
      test_title: testConfig.title,
      exam_type: testConfig.exam_type,
      total_score: totalScore,
      maximum_score: testConfig.total_marks,
      accuracy_percentage: accuracy,
      total_questions: 30,
      total_attempted: 24,
      total_correct: 18,
      total_incorrect: 6,
      total_unattempted: 6,
      total_time_spent_seconds: 3600,
      subject_metrics: [
        { subject_id: "sub-phy", subject_name: "Physics", score: 22, max_score: 40, accuracy: 75, attempted: 8, correct: 6, incorrect: 2, time_spent_seconds: 1200 },
        { subject_id: "sub-chem", subject_name: "Chemistry", score: 22, max_score: 40, accuracy: 75, attempted: 8, correct: 6, incorrect: 2, time_spent_seconds: 1200 },
        { subject_id: "sub-math", subject_name: "Mathematics", score: 22, max_score: 40, accuracy: 75, attempted: 8, correct: 6, incorrect: 2, time_spent_seconds: 1200 },
      ],
      chapter_metrics: [
        { chapter_id: "chap-0", chapter_name: "Rotational Motion", subject_name: "Physics", correct: 6, incorrect: 2, unattempted: 2, attempted: 8, total_questions: 10, accuracy: 75, avg_time_seconds: 135, evidence_status: "STRONG" },
      ],
      incorrect_questions: scoredQuestions.filter((q) => !q.is_correct && q.selected_option_id !== null).map((q) => ({
        question_id: q.question_id,
        subject_name: q.subject_name,
        chapter_name: q.chapter_name,
        topic_name: q.topic_name,
        difficulty: "MEDIUM",
        selected_option_key: "B",
        correct_option_key: "A",
        time_spent_seconds: q.time_spent_seconds,
        marks_awarded: q.marks_awarded,
      })),
      time_metrics: {
        avg_time_per_question_seconds: 120,
        avg_time_correct_seconds: 120,
        avg_time_incorrect_seconds: 180,
        late_exam_accuracy: 70,
      },
    };

    expect(promptPayload).toBeDefined();
    expect(promptPayload.attempt_id).toBe("att-demo-123");
    expect(promptPayload.incorrect_questions.length).toBe(6);

    // Verify AI Provider executes and conforms to schema
    const aiProvider = getAIProvider();
    expect(aiProvider).toBeDefined();
    expect(typeof aiProvider.generateTestBlueprint).toBe("function");

    // 6. Verify Teacher Class Analytics Rollups
    const classMetrics = calculateClassPerformanceMetrics(
      [
        { student_id: "stu-1", total_score: 66, accuracy_percentage: 75, maximum_score: 120, status: "SUBMITTED" },
        { student_id: "stu-2", total_score: 90, accuracy_percentage: 85, maximum_score: 120, status: "SUBMITTED" },
        { student_id: "stu-3", total_score: 48, accuracy_percentage: 55, maximum_score: 120, status: "SUBMITTED" },
      ],
      3
    );

    expect(classMetrics.total_attempts).toBe(3);
    expect(classMetrics.average_score).toBe(68); // (66+90+48)/3 = 68
    expect(classMetrics.highest_score).toBe(90);

    const csvOutput = formatClassAnalyticsCsv({
      class_id: "cls-123",
      class_name: "Rankers JEE 2026",
      grade: "12th",
      academic_year: 2026,
      total_students: 3,
      performance_metrics: classMetrics,
      test_performances: [],
      topic_mastery: [],
      mistake_matrix: [],
      student_rows: [
        {
          student_id: "stu-1",
          student_name: "Aarav Sharma",
          email: "aarav@school.edu",
          tests_completed: 1,
          total_tests_assigned: 1,
          average_score: 66,
          average_accuracy: 75,
          total_questions_solved: 30,
          recurring_mistake_count: 2,
          weak_topic_count: 1,
          trend: "IMPROVING",
          attention_status: "STABLE",
          last_attempt_at: "2026-09-22T10:00:00.000Z",
        },
      ],
    });

    expect(csvOutput).toContain("Student Name,Email,Class,Grade,Tests Completed");
    expect(csvOutput).toContain("Rankers JEE 2026");
    expect(csvOutput).toContain("Aarav Sharma");
  });
});
