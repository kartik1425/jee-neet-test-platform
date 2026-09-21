import { MarkingSchemeConfig, ExamType } from "./database";

export interface QuestionScoringItem {
  questionId: string;
  testQuestionId: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  topicId?: string | null;
  topicName?: string | null;
  orderIndex: number;
  marksConfig: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  correctOptionId: string;
  correctOptionKey: "A" | "B" | "C" | "D";
  selectedOptionId: string | null;
  selectedOptionKey?: "A" | "B" | "C" | "D" | null;
  timeSpentSeconds: number;
  contentLatex: string;
  explanationLatex?: string | null;
  options: {
    id: string;
    optionKey: "A" | "B" | "C" | "D";
    contentLatex: string;
    isCorrect: boolean;
  }[];
}

export interface QuestionScoringResult {
  questionId: string;
  testQuestionId: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  topicId?: string | null;
  topicName?: string | null;
  orderIndex: number;
  selectedOptionId: string | null;
  selectedOptionKey?: "A" | "B" | "C" | "D" | null;
  correctOptionId: string;
  correctOptionKey: "A" | "B" | "C" | "D";
  isCorrect: boolean | null; // null if unattempted
  isAttempted: boolean;
  marksAwarded: number;
  maxMarks: number;
  timeSpentSeconds: number;
  contentLatex?: string;
  explanationLatex?: string | null;
}

export interface AggregateMetrics {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracy: number; // Formula: (correct / attempted) * 100 or 0
}

export interface SubjectScoreAggregate extends AggregateMetrics {
  subjectId: string;
  subjectName: string;
}

export interface ChapterScoreAggregate extends AggregateMetrics {
  chapterId: string;
  chapterName: string;
  subjectName: string;
}

export interface TopicScoreAggregate extends AggregateMetrics {
  topicId: string;
  topicName: string;
  chapterName: string;
  subjectName: string;
}

export interface DeterministicScoreReport {
  attemptId: string;
  testId: string;
  studentId: string;
  scoringVersion: string; // e.g. "v1.0.0"
  totalScore: number;
  maximumScore: number;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracyPercentage: number;
  totalTimeSpentSeconds: number;
  questionResults: QuestionScoringResult[];
  subjectBreakdown: SubjectScoreAggregate[];
  chapterBreakdown: ChapterScoreAggregate[];
  topicBreakdown: TopicScoreAggregate[];
  calculatedAt: string;
}

/**
 * Pure Deterministic Scoring Engine.
 * Formula for Accuracy: (correct / attempted) * 100. If attempted === 0, accuracy is 0.
 * Zero AI dependence. 100% reproducible.
 */
export function computeDeterministicScore(
  items: QuestionScoringItem[],
  testMarkingScheme: MarkingSchemeConfig,
  metadata: { attemptId: string; testId: string; studentId: string }
): DeterministicScoreReport {
  let totalScore = 0;
  let maximumScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let totalTimeSpentSeconds = 0;

  const questionResults: QuestionScoringResult[] = [];

  // Group maps for rollups
  const subjectMap = new Map<string, { name: string; items: QuestionScoringResult[] }>();
  const chapterMap = new Map<string, { name: string; subjectName: string; items: QuestionScoringResult[] }>();
  const topicMap = new Map<string, { name: string; chapterName: string; subjectName: string; items: QuestionScoringResult[] }>();

  for (const item of items) {
    const marksCfg = item.marksConfig || testMarkingScheme;
    const isAttempted = Boolean(item.selectedOptionId);
    let isCorrect: boolean | null = null;
    let marksAwarded = 0;

    if (!isAttempted) {
      isCorrect = null;
      marksAwarded = marksCfg.unattempted ?? 0;
      unattemptedCount++;
    } else if (item.selectedOptionId === item.correctOptionId) {
      isCorrect = true;
      marksAwarded = marksCfg.correct;
      correctCount++;
    } else {
      isCorrect = false;
      marksAwarded = marksCfg.incorrect;
      incorrectCount++;
    }

    const maxMarks = marksCfg.correct;
    totalScore += marksAwarded;
    maximumScore += maxMarks;
    totalTimeSpentSeconds += item.timeSpentSeconds || 0;

    const qResult: QuestionScoringResult = {
      questionId: item.questionId,
      testQuestionId: item.testQuestionId,
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      chapterId: item.chapterId,
      chapterName: item.chapterName,
      topicId: item.topicId || null,
      topicName: item.topicName || null,
      orderIndex: item.orderIndex,
      selectedOptionId: item.selectedOptionId,
      selectedOptionKey: item.selectedOptionKey || null,
      correctOptionId: item.correctOptionId,
      correctOptionKey: item.correctOptionKey,
      isCorrect,
      isAttempted,
      marksAwarded,
      maxMarks,
      timeSpentSeconds: item.timeSpentSeconds || 0,
      contentLatex: item.contentLatex,
      explanationLatex: item.explanationLatex,
    };

    questionResults.push(qResult);

    // Subject Grouping
    const sGroup = subjectMap.get(item.subjectId) || { name: item.subjectName, items: [] };
    sGroup.items.push(qResult);
    subjectMap.set(item.subjectId, sGroup);

    // Chapter Grouping
    const cGroup = chapterMap.get(item.chapterId) || {
      name: item.chapterName,
      subjectName: item.subjectName,
      items: [],
    };
    cGroup.items.push(qResult);
    chapterMap.set(item.chapterId, cGroup);

    // Topic Grouping (if exists)
    if (item.topicId) {
      const tGroup = topicMap.get(item.topicId) || {
        name: item.topicName || "General",
        chapterName: item.chapterName,
        subjectName: item.subjectName,
        items: [],
      };
      tGroup.items.push(qResult);
      topicMap.set(item.topicId, tGroup);
    }
  }

  const totalQuestions = items.length;
  const attemptedCount = correctCount + incorrectCount;
  const accuracyPercentage =
    attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

  // Helper to aggregate list of results
  const buildAggregate = (results: QuestionScoringResult[]): AggregateMetrics => {
    const totalQ = results.length;
    let cor = 0;
    let incor = 0;
    let unatt = 0;
    let sc = 0;
    let maxSc = 0;

    for (const r of results) {
      if (r.isCorrect === true) cor++;
      else if (r.isCorrect === false) incor++;
      else unatt++;
      sc += r.marksAwarded;
      maxSc += r.maxMarks;
    }

    const att = cor + incor;
    const acc = att > 0 ? (cor / att) * 100 : 0;

    return {
      totalQuestions: totalQ,
      attempted: att,
      correct: cor,
      incorrect: incor,
      unattempted: unatt,
      score: Math.round(sc * 100) / 100,
      maxScore: Math.round(maxSc * 100) / 100,
      accuracy: Math.round(acc * 100) / 100,
    };
  };

  const subjectBreakdown: SubjectScoreAggregate[] = Array.from(subjectMap.entries()).map(
    ([subjId, val]) => ({
      subjectId: subjId,
      subjectName: val.name,
      ...buildAggregate(val.items),
    })
  );

  const chapterBreakdown: ChapterScoreAggregate[] = Array.from(chapterMap.entries()).map(
    ([chapId, val]) => ({
      chapterId: chapId,
      chapterName: val.name,
      subjectName: val.subjectName,
      ...buildAggregate(val.items),
    })
  );

  const topicBreakdown: TopicScoreAggregate[] = Array.from(topicMap.entries()).map(
    ([topId, val]) => ({
      topicId: topId,
      topicName: val.name,
      chapterName: val.chapterName,
      subjectName: val.subjectName,
      ...buildAggregate(val.items),
    })
  );

  return {
    attemptId: metadata.attemptId,
    testId: metadata.testId,
    studentId: metadata.studentId,
    scoringVersion: "v1.0.0",
    totalScore: Math.round(totalScore * 100) / 100,
    maximumScore: Math.round(maximumScore * 100) / 100,
    totalQuestions,
    attemptedCount,
    correctCount,
    incorrectCount,
    unattemptedCount,
    accuracyPercentage: Math.round(accuracyPercentage * 100) / 100,
    totalTimeSpentSeconds,
    questionResults,
    subjectBreakdown,
    chapterBreakdown,
    topicBreakdown,
    calculatedAt: new Date().toISOString(),
  };
}
