import { MistakeCategory } from "./mistakes";
import { EvidenceStatus } from "./diagnosticReport";
import { ExamType, DifficultyLevel } from "./database";

export interface TeacherClassItem {
  id: string;
  name: string;
  grade: string;
  academic_year: number;
  student_count: number;
  test_count: number;
  created_at: string;
}

export interface ClassPerformanceMetrics {
  average_score: number;
  median_score: number;
  average_accuracy: number;
  participation_rate: number;
  completion_rate: number;
  total_attempts: number;
  highest_score: number;
  lowest_score: number;
}

export interface ClassTestPerformance {
  test_id: string;
  title: string;
  exam_type: ExamType;
  duration_minutes: number;
  total_marks: number;
  assigned_at: string;
  participants_count: number;
  total_students: number;
  average_score: number;
  median_score: number;
  average_accuracy: number;
  completion_percentage: number;
}

export interface OptionDistribution {
  option_key: string;
  content_latex: string;
  is_correct: boolean;
  selected_count: number;
  selected_percentage: number;
}

export interface QuestionDifficultyAnalysis {
  question_id: string;
  order_index: number;
  subject_name: string;
  chapter_name: string;
  topic_name?: string | null;
  difficulty: DifficultyLevel | string;
  content_latex: string;
  total_attempts: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  accuracy_percentage: number;
  most_selected_wrong_option_key?: string | null;
  options: OptionDistribution[];
}

export interface TopicMasteryClassSummary {
  subject_name: string;
  chapter_name: string;
  topic_name?: string | null;
  total_questions_tested: number;
  attempted_count: number;
  correct_count: number;
  incorrect_count: number;
  accuracy_percentage: number;
  evidence_status: EvidenceStatus;
}

export interface ClassMistakeMatrixSummary {
  subject_name: string;
  chapter_name: string;
  topic_name?: string | null;
  total_mistakes: number;
  confirmed_count: number;
  suggested_count: number;
  category_counts: Record<MistakeCategory, number>;
}

export type StudentAttentionStatus = "NEEDS_REVIEW" | "IMPROVING" | "STABLE" | "INSUFFICIENT_DATA";
export type StudentTrendStatus = "IMPROVING" | "STABLE" | "WORSENING" | "INSUFFICIENT_DATA";

export interface StudentPerformanceRow {
  student_id: string;
  student_name: string;
  email: string;
  tests_completed: number;
  total_tests_assigned: number;
  average_score: number;
  average_accuracy: number;
  total_questions_solved: number;
  recurring_mistake_count: number;
  weak_topic_count: number;
  trend: StudentTrendStatus;
  attention_status: StudentAttentionStatus;
  last_attempt_at?: string | null;
}

export interface StudentIndividualClassDetail {
  student_id: string;
  student_name: string;
  email: string;
  average_score: number;
  average_accuracy: number;
  total_tests: number;
  weak_topics: TopicMasteryClassSummary[];
  recurring_mistakes: {
    chapter_name: string;
    mistake_type: MistakeCategory;
    occurrences: number;
    trend: StudentTrendStatus;
  }[];
  recent_attempts: {
    attempt_id: string;
    test_id: string;
    test_title: string;
    submitted_at: string;
    score: number;
    max_score: number;
    accuracy: number;
  }[];
}

export interface ClassAnalyticsBundle {
  class_id: string;
  class_name: string;
  grade: string;
  academic_year: number;
  total_students: number;
  performance_metrics: ClassPerformanceMetrics;
  test_performances: ClassTestPerformance[];
  topic_mastery: TopicMasteryClassSummary[];
  mistake_matrix: ClassMistakeMatrixSummary[];
  student_rows: StudentPerformanceRow[];
}
