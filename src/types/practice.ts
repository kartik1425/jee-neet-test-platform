import { z } from "zod";
import { ExamType, DifficultyLevel, MarkingSchemeConfig, Question } from "./database";

export interface SelfTestTaxonomySubject {
  id: string;
  name: string;
  code: string;
  chapters: {
    id: string;
    name: string;
    topics: {
      id: string;
      name: string;
    }[];
  }[];
}

export const SelfTestConfigSchema = z.object({
  examType: z.enum(["JEE_MAIN", "JEE_ADV", "NEET"]),
  subjectIds: z.array(z.string().uuid()).min(1, "Select at least one subject"),
  chapterIds: z.array(z.string().uuid()).min(1, "Select at least one chapter"),
  topicIds: z.array(z.string().uuid()).optional().default([]),
  difficulty: z.enum(["ANY", "EASY", "MEDIUM", "HARD", "ADVANCED"]).default("ANY"),
  questionCount: z.number().int().min(5, "Minimum 5 questions").max(180, "Maximum 180 questions"),
  durationMinutes: z.number().int().min(5, "Minimum 5 minutes").max(360, "Maximum 360 minutes"),
  pyqOnly: z.boolean().default(true),
  yearStart: z.number().int().min(2000).max(2030).optional().nullable(),
  yearEnd: z.number().int().min(2000).max(2030).optional().nullable(),
  allowPreviouslyAttempted: z.boolean().default(false),
  customTitle: z.string().max(200).optional().nullable(),
});

export type SelfTestConfig = z.infer<typeof SelfTestConfigSchema>;

export interface QuestionPoolAvailabilityResult {
  totalEligibleCount: number;
  unusedEligibleCount: number;
  previouslyAttemptedCount: number;
  isSufficient: boolean;
  requestedCount: number;
  subjectCounts: Record<string, { total: number; unused: number }>;
  difficultyCounts: Record<string, number>;
}

export interface GenerateSelfTestOutput {
  success: boolean;
  testId?: string;
  error?: string;
  shortageDetails?: {
    requested: number;
    available: number;
    message: string;
  };
}

export interface SelfTestSummaryDetails {
  id: string;
  title: string;
  examType: ExamType;
  durationMinutes: number;
  totalMarks: number;
  markingScheme: MarkingSchemeConfig;
  difficulty: string;
  pyqYearsSummary?: string | null;
  subjectsSummary: string[];
  chaptersSummary: string[];
  questionCount: number;
  createdAt: string;
}
