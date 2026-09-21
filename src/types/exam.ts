import { ExamType, MarkingSchemeConfig } from "./database";

export type PaletteStatus =
  | "NOT_VISITED"
  | "NOT_ANSWERED"
  | "ANSWERED"
  | "MARKED_FOR_REVIEW"
  | "ANSWERED_AND_MARKED_FOR_REVIEW";

export interface StudentExamOption {
  id: string;
  option_key: "A" | "B" | "C" | "D";
  content_latex: string;
}

export interface StudentExamQuestion {
  id: string; // Question ID
  test_question_id: string;
  section_id?: string | null;
  section_name?: string;
  order_index: number;
  content_latex: string;
  marks: number;
  negative_marks: number;
  options: StudentExamOption[];
}

export interface ExamAttemptState {
  attemptId: string;
  testId: string;
  testTitle: string;
  examType: ExamType;
  durationMinutes: number;
  serverEndTime: string; // ISO string
  remainingSeconds: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "EXPIRED";
  markingScheme: MarkingSchemeConfig;
  questions: StudentExamQuestion[];
  answers: Record<
    string,
    {
      selectedOptionId: string | null;
      isMarkedForReview: boolean;
      isVisited: boolean;
      timeSpentSeconds: number;
    }
  >;
}

/**
 * Calculates NTA Palette status for a question.
 */
export function getQuestionPaletteStatus(
  answer:
    | {
        selectedOptionId: string | null;
        isMarkedForReview: boolean;
        isVisited: boolean;
      }
    | undefined
): PaletteStatus {
  if (!answer || !answer.isVisited) {
    return "NOT_VISITED";
  }

  const hasAnswer = Boolean(answer.selectedOptionId);

  if (answer.isMarkedForReview) {
    return hasAnswer ? "ANSWERED_AND_MARKED_FOR_REVIEW" : "MARKED_FOR_REVIEW";
  }

  return hasAnswer ? "ANSWERED" : "NOT_ANSWERED";
}
