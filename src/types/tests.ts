import { z } from "zod";
import { ExamType, TestMode, TestStatus, MarkingSchemeConfig, Question } from "./database";

// Allowed State Transitions Graph
export const VALID_TEST_STATUS_TRANSITIONS: Record<TestStatus, TestStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["SCHEDULED", "LIVE", "ARCHIVED"],
  SCHEDULED: ["LIVE", "COMPLETED", "ARCHIVED"],
  LIVE: ["COMPLETED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

/**
 * Validates whether a state transition is permitted.
 */
export function isValidTestStatusTransition(from: TestStatus, to: TestStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_TEST_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export interface TestDetail {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  exam_type: ExamType;
  test_mode: TestMode;
  duration_minutes: number;
  total_marks: number;
  marking_scheme: MarkingSchemeConfig;
  status: TestStatus;
  start_time?: string | null;
  end_time?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  sections: {
    id: string;
    name: string;
    order_index: number;
    marking_scheme_override?: any;
  }[];
  questions: {
    id: string; // test_question id
    question_id: string;
    section_id?: string | null;
    section_name?: string;
    order_index: number;
    marks: number;
    negative_marks: number;
    question: Question;
  }[];
  assignments: {
    id: string;
    class_id?: string | null;
    class_name?: string;
    student_id?: string | null;
    student_name?: string;
    assigned_at: string;
    due_at?: string | null;
  }[];
  attemptsCount?: number;
}

/**
 * Publication Validation Checks.
 * Rejects unpublishable tests with explicit descriptive errors.
 */
export interface PublicationValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateTestForPublication(test: Partial<TestDetail>): PublicationValidationResult {
  const errors: string[] = [];

  if (!test.title || test.title.trim().length < 3) {
    errors.push("Test title must be at least 3 characters.");
  }

  if (!test.duration_minutes || test.duration_minutes <= 0) {
    errors.push("Test duration must be greater than 0 minutes.");
  }

  if (!test.questions || test.questions.length === 0) {
    errors.push("A publishable test must contain at least one question.");
  } else {
    // Check questions
    const questionIdSet = new Set<string>();
    test.questions.forEach((tq, idx) => {
      if (questionIdSet.has(tq.question_id)) {
        errors.push(`Duplicate question detected at position ${idx + 1}.`);
      }
      questionIdSet.add(tq.question_id);

      const q = tq.question;
      if (q) {
        if (q.status === "ARCHIVED") {
          errors.push(`Question at position ${idx + 1} is archived and cannot be published.`);
        }
        if (q.options && q.options.length !== 4) {
          errors.push(`Question at position ${idx + 1} must have exactly 4 options.`);
        }
        if (q.options && q.options.filter((o) => o.is_correct).length !== 1) {
          errors.push(`Question at position ${idx + 1} must have exactly 1 correct answer.`);
        }
      }
    });
  }

  if (test.start_time && test.end_time) {
    if (new Date(test.end_time).getTime() <= new Date(test.start_time).getTime()) {
      errors.push("End time must be after start time.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Zod Validation Schemas for Actions
export const TestDraftSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(1000).optional().nullable(),
  instructions: z.string().max(3000).optional().nullable(),
  examType: z.enum(["JEE_MAIN", "JEE_ADV", "NEET", "GENERIC"]).default("JEE_MAIN"),
  testMode: z.enum(["SCHEDULED", "PRACTICE_SELF", "MOCK"]).default("SCHEDULED"),
  durationMinutes: z.number().int().min(5).max(360),
  markingScheme: z.object({
    correct: z.number().default(4),
    incorrect: z.number().default(-1),
    unattempted: z.number().default(0),
  }),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
});

export const TestAssignmentSchema = z.object({
  testId: z.string().uuid("Invalid test ID"),
  classId: z.string().uuid("Invalid class ID").optional().nullable(),
  studentId: z.string().uuid("Invalid student ID").optional().nullable(),
  dueAt: z.string().optional().nullable(),
}).refine((data) => data.classId || data.studentId, {
  message: "Either class ID or student ID must be provided for assignment.",
});
