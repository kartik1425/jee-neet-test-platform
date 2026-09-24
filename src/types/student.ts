import { ExamType, TestMode, TestStatus, MarkingSchemeConfig } from "./database";
import { SubjectScoreAggregate, TopicScoreAggregate } from "./scoring";

export interface StudentClassEnrollment {
  classId: string;
  className: string;
  grade: string;
}

export interface StudentDashboardProfile {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  targetExam: ExamType;
  avatarUrl?: string | null;
  classes: StudentClassEnrollment[];
}

export interface StudentActiveAttemptSummary {
  attemptId: string;
  testId: string;
  testTitle: string;
  examType: ExamType;
  startedAt: string;
  serverEndTime: string;
  totalQuestions: number;
  durationMinutes: number;
}

export interface StudentTestSummary {
  id: string;
  title: string;
  description?: string | null;
  examType: ExamType;
  testMode: TestMode;
  durationMinutes: number;
  totalMarks: number;
  markingScheme: MarkingSchemeConfig;
  status: TestStatus;
  startTime?: string | null;
  endTime?: string | null;
  dueAt?: string | null;
  assignmentSource: "DIRECT" | "CLASS" | "SELF_PRACTICE";
  questionCount: number;
  activeAttempt?: StudentActiveAttemptSummary | null;
  latestAttempt?: {
    attemptId: string;
    totalScore: number;
    maximumScore: number;
    accuracyPercentage: number;
    submittedAt: string;
  } | null;
  canStart: boolean;
  actionState: "START" | "RESUME" | "UPCOMING" | "EXPIRED" | "COMPLETED";
}

export interface StudentAttemptHistoryRecord {
  attemptId: string;
  testId: string;
  testTitle: string;
  examType: ExamType;
  submittedAt: string;
  totalScore: number;
  maximumScore: number;
  accuracyPercentage: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  totalTimeSpentSeconds: number;
}

export interface StudentSubjectPerformance {
  subjectId: string;
  subjectName: string;
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalQuestions: number;
  accuracyPercentage: number;
  totalScore: number;
}

export interface StudentOverallMetrics {
  testsCompletedCount: number;
  totalQuestionsAttempted: number;
  totalCorrectCount: number;
  totalIncorrectCount: number;
  overallAccuracyPercentage: number;
  totalTimeSpentMinutes: number;
  subjectBreakdown: StudentSubjectPerformance[];
  strongTopics: { topicName: string; subjectName: string; accuracy: number; totalCount: number }[];
  weakTopics: { topicName: string; subjectName: string; accuracy: number; totalCount: number }[];
}

export interface StudentDashboardData {
  profile: StudentDashboardProfile;
  activeAttempt: StudentActiveAttemptSummary | null;
  assignedTests: StudentTestSummary[];
  practiceTests: StudentTestSummary[];
  recentAttempts: StudentAttemptHistoryRecord[];
  metrics: StudentOverallMetrics;
}
