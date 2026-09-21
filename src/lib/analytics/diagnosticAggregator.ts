import {
  DeterministicAnalyticsPayload,
  SubjectMetric,
  ChapterMetric,
  TopicMetric,
  TimeStrategyMetrics,
  IncorrectQuestionEvidence,
  EvidenceStatus,
} from "@/types/diagnosticReport";
import { Attempt, AttemptAnswer, Question, QuestionOption, Subject, Chapter, Topic } from "@/types/database";

export interface AttemptWithDetails extends Attempt {
  test: {
    id: string;
    title: string;
    exam_type: string;
    duration_minutes: number;
    total_marks: number;
  };
}

export interface AnswerWithQuestion extends AttemptAnswer {
  question: Question & {
    options: QuestionOption[];
    subject?: Subject | null;
    chapter?: Chapter | null;
    topic?: Topic | null;
  };
}

/**
 * Applies strict deterministic evidence thresholds to chapter performance:
 * - >= 3 questions attempted & accuracy < 50% => NEEDS_ATTENTION (Confirmed Weak Area)
 * - >= 2 questions attempted & accuracy >= 70% => STRONG
 * - 2 questions attempted & accuracy < 50% => NEEDS_ATTENTION
 * - < 2 questions attempted => INSUFFICIENT_DATA
 */
export function determineChapterEvidenceStatus(
  totalQuestions: number,
  attempted: number,
  accuracy: number
): EvidenceStatus {
  if (attempted < 2) {
    return "INSUFFICIENT_DATA";
  }
  if (accuracy >= 70) {
    return "STRONG";
  }
  if (accuracy < 50) {
    return "NEEDS_ATTENTION";
  }
  return "STRONG";
}

/**
 * Builds the complete, deterministic, privacy-safe analytics payload for an attempt.
 */
export function buildDeterministicAnalyticsPayload(
  attempt: AttemptWithDetails,
  answers: AnswerWithQuestion[],
  subjects: Subject[],
  chapters: Chapter[],
  topics: Topic[] = []
): DeterministicAnalyticsPayload {
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
  const chapterMap = new Map<string, Chapter>(chapters.map((c) => [c.id, c]));
  const topicMap = new Map<string, Topic>(topics.map((t) => [t.id, t]));

  // 1. Subject Metrics
  const subjectDataMap = new Map<
    string,
    {
      subject_id: string;
      subject_name: string;
      score: number;
      max_score: number;
      attempted: number;
      correct: number;
      incorrect: number;
      unattempted: number;
      time_spent_seconds: number;
    }
  >();

  // 2. Chapter Metrics
  const chapterDataMap = new Map<
    string,
    {
      chapter_id: string;
      chapter_name: string;
      subject_name: string;
      total_questions: number;
      attempted: number;
      correct: number;
      incorrect: number;
      time_spent_seconds: number;
    }
  >();

  // 3. Topic Metrics
  const topicDataMap = new Map<
    string,
    {
      topic_id: string;
      topic_name: string;
      chapter_name: string;
      total_questions: number;
      attempted: number;
      correct: number;
    }
  >();

  // 4. Incorrect Question Evidence
  const incorrectQuestions: IncorrectQuestionEvidence[] = [];

  let totalCorrectTime = 0;
  let correctCountForTime = 0;
  let totalIncorrectTime = 0;
  let incorrectCountForTime = 0;
  let totalUnattemptedTime = 0;
  let unattemptedCountForTime = 0;

  let longestQuestionId: string | null = null;
  let longestQuestionSeconds = 0;

  answers.forEach((ans) => {
    const q = ans.question;
    const subj = subjectMap.get(q.subject_id);
    const chap = chapterMap.get(q.chapter_id);
    const top = q.topic_id ? topicMap.get(q.topic_id) : null;

    const subjName = subj?.name || "General";
    const chapName = chap?.name || "General Chapter";
    const topName = top?.name || null;

    const isAttempted = ans.selected_option_id !== null;
    const isCorrect = ans.is_correct === true;
    const marks = Number(ans.marks_awarded || 0);
    const timeSpent = ans.time_spent_seconds || 0;

    // Track longest question
    if (timeSpent > longestQuestionSeconds) {
      longestQuestionSeconds = timeSpent;
      longestQuestionId = q.id;
    }

    if (isAttempted) {
      if (isCorrect) {
        totalCorrectTime += timeSpent;
        correctCountForTime++;
      } else {
        totalIncorrectTime += timeSpent;
        incorrectCountForTime++;

        // Collect incorrect question evidence
        const correctOpt = q.options.find((o) => o.is_correct);
        const selectedOpt = q.options.find((o) => o.id === ans.selected_option_id);

        incorrectQuestions.push({
          question_id: q.id,
          subject_name: subjName,
          chapter_name: chapName,
          topic_name: topName,
          difficulty: q.difficulty,
          selected_option_key: selectedOpt?.option_key || null,
          correct_option_key: correctOpt?.option_key || "A",
          marks_awarded: marks,
          time_spent_seconds: timeSpent,
          marked_for_review: ans.is_marked_for_review || false,
        });
      }
    } else {
      totalUnattemptedTime += timeSpent;
      unattemptedCountForTime++;
    }

    // Aggregate Subject
    const sStat = subjectDataMap.get(q.subject_id) || {
      subject_id: q.subject_id,
      subject_name: subjName,
      score: 0,
      max_score: 0,
      attempted: 0,
      correct: 0,
      incorrect: 0,
      unattempted: 0,
      time_spent_seconds: 0,
    };
    sStat.score += marks;
    sStat.max_score += 4; // Standard MCQ 4 marks
    sStat.time_spent_seconds += timeSpent;
    if (isAttempted) {
      sStat.attempted++;
      if (isCorrect) sStat.correct++;
      else sStat.incorrect++;
    } else {
      sStat.unattempted++;
    }
    subjectDataMap.set(q.subject_id, sStat);

    // Aggregate Chapter
    const cStat = chapterDataMap.get(q.chapter_id) || {
      chapter_id: q.chapter_id,
      chapter_name: chapName,
      subject_name: subjName,
      total_questions: 0,
      attempted: 0,
      correct: 0,
      incorrect: 0,
      time_spent_seconds: 0,
    };
    cStat.total_questions++;
    cStat.time_spent_seconds += timeSpent;
    if (isAttempted) {
      cStat.attempted++;
      if (isCorrect) cStat.correct++;
      else cStat.incorrect++;
    }
    chapterDataMap.set(q.chapter_id, cStat);

    // Aggregate Topic
    if (q.topic_id) {
      const tStat = topicDataMap.get(q.topic_id) || {
        topic_id: q.topic_id,
        topic_name: topName || "Topic",
        chapter_name: chapName,
        total_questions: 0,
        attempted: 0,
        correct: 0,
      };
      tStat.total_questions++;
      if (isAttempted) {
        tStat.attempted++;
        if (isCorrect) tStat.correct++;
      }
      topicDataMap.set(q.topic_id, tStat);
    }
  });

  // Calculate Subject Metrics with accuracy
  const subjectMetrics: SubjectMetric[] = Array.from(subjectDataMap.values()).map((s) => ({
    ...s,
    accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
  }));

  // Calculate Chapter Metrics with evidence classification
  const chapterMetrics: ChapterMetric[] = Array.from(chapterDataMap.values()).map((c) => {
    const accuracy = c.attempted > 0 ? Math.round((c.correct / c.attempted) * 100) : 0;
    const avgTime = c.total_questions > 0 ? Math.round(c.time_spent_seconds / c.total_questions) : 0;
    const evidenceStatus = determineChapterEvidenceStatus(c.total_questions, c.attempted, accuracy);

    return {
      chapter_id: c.chapter_id,
      chapter_name: c.chapter_name,
      subject_name: c.subject_name,
      total_questions: c.total_questions,
      attempted: c.attempted,
      correct: c.correct,
      incorrect: c.incorrect,
      accuracy,
      avg_time_seconds: avgTime,
      evidence_status: evidenceStatus,
    };
  });

  // Calculate Topic Metrics
  const topicMetrics: TopicMetric[] = Array.from(topicDataMap.values()).map((t) => {
    const accuracy = t.attempted > 0 ? Math.round((t.correct / t.attempted) * 100) : 0;
    return {
      topic_id: t.topic_id,
      topic_name: t.topic_name,
      chapter_name: t.chapter_name,
      total_questions: t.total_questions,
      attempted: t.attempted,
      correct: t.correct,
      accuracy,
      evidence_status: determineChapterEvidenceStatus(t.total_questions, t.attempted, accuracy),
    };
  });

  // Time Strategy Metrics
  const totalQuestions = answers.length;
  const totalAttemptTime = attempt.time_spent_seconds || 0;
  const avgTimePerQ = totalQuestions > 0 ? Math.round(totalAttemptTime / totalQuestions) : 0;
  const avgCorrect = correctCountForTime > 0 ? Math.round(totalCorrectTime / correctCountForTime) : 0;
  const avgIncorrect = incorrectCountForTime > 0 ? Math.round(totalIncorrectTime / incorrectCountForTime) : 0;
  const avgUnattempted = unattemptedCountForTime > 0 ? Math.round(totalUnattemptedTime / unattemptedCountForTime) : 0;

  // Calculate Late Exam Accuracy (last 20% of answers list)
  let lateExamAccuracy: number | null = null;
  if (answers.length >= 5) {
    const splitIndex = Math.floor(answers.length * 0.8);
    const lateAnswers = answers.slice(splitIndex);
    const lateAttempted = lateAnswers.filter((a) => a.selected_option_id !== null);
    const lateCorrect = lateAttempted.filter((a) => a.is_correct === true);
    lateExamAccuracy = lateAttempted.length > 0 ? Math.round((lateCorrect.length / lateAttempted.length) * 100) : 0;
  }

  const timeMetrics: TimeStrategyMetrics = {
    total_time_seconds: totalAttemptTime,
    allocated_time_seconds: (attempt.test?.duration_minutes || 180) * 60,
    avg_time_per_question_seconds: avgTimePerQ,
    avg_time_correct_seconds: avgCorrect,
    avg_time_incorrect_seconds: avgIncorrect,
    avg_time_unattempted_seconds: avgUnattempted,
    longest_question_id: longestQuestionId,
    longest_question_seconds: longestQuestionSeconds,
    late_exam_accuracy: lateExamAccuracy,
  };

  const totalAttempted = Number(attempt.calculated_stats?.total_attempted ?? answers.filter((a) => a.selected_option_id !== null).length);
  const totalCorrect = Number(attempt.calculated_stats?.total_correct ?? answers.filter((a) => a.is_correct === true).length);
  const totalIncorrect = Number(attempt.calculated_stats?.total_incorrect ?? answers.filter((a) => a.selected_option_id !== null && a.is_correct === false).length);
  const totalUnattempted = Number(answers.length - totalAttempted);

  return {
    attempt_id: attempt.id,
    test_id: attempt.test_id,
    test_title: attempt.test?.title || "Examination Attempt",
    exam_type: (attempt.test?.exam_type as any) || "JEE_MAIN",
    total_score: Number(attempt.total_score || 0),
    max_score: Number(attempt.test?.total_marks || totalQuestions * 4),
    accuracy_percentage: Number(attempt.accuracy_percentage || 0),
    total_attempted: totalAttempted,
    total_correct: totalCorrect,
    total_incorrect: totalIncorrect,
    total_unattempted: totalUnattempted,
    duration_minutes: attempt.test?.duration_minutes || 180,
    time_spent_seconds: totalAttemptTime,
    subject_metrics: subjectMetrics,
    chapter_metrics: chapterMetrics,
    topic_metrics: topicMetrics,
    time_metrics: timeMetrics,
    incorrect_questions: incorrectQuestions,
  };
}
