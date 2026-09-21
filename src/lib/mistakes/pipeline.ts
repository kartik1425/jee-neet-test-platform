import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { classifyMistakeDeterministically } from "./ruleClassifier";
import {
  MistakeCategory,
  ClassificationSource,
  ClassificationConfidence,
  PersistentMistakeRecord,
} from "@/types/mistakes";
import { Subject, Chapter, Topic, QuestionOption } from "@/types/database";

export interface MistakeProcessingResult {
  success: boolean;
  attempt_id: string;
  processed_count: number;
  error?: string;
}

/**
 * Processes and persists mistake records for a submitted exam attempt.
 * This operation is idempotent and secondary to authoritative exam scoring.
 */
export async function processAttemptMistakes(
  attemptId: string,
  customSupabase?: any
): Promise<MistakeProcessingResult> {
  try {
    const supabase = customSupabase || (await createClient());

    // 1. Fetch Attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from("attempts")
      .select("id, test_id, student_id, time_spent_seconds, test:tests(id, title, duration_minutes, exam_type)")
      .eq("id", attemptId)
      .single();

    if (attemptErr || !attempt) {
      return {
        success: false,
        attempt_id: attemptId,
        processed_count: 0,
        error: `Attempt not found: ${attemptErr?.message || "Unknown"}`,
      };
    }

    // 2. Fetch Answers with Question Snapshot & Options
    const { data: answers, error: ansErr } = await supabase
      .from("attempt_answers")
      .select(`
        id,
        attempt_id,
        question_id,
        selected_option_id,
        is_marked_for_review,
        is_visited,
        time_spent_seconds,
        is_correct,
        marks_awarded,
        question:questions (
          id,
          content_latex,
          difficulty,
          subject_id,
          chapter_id,
          topic_id,
          options:question_options (id, option_key, content_latex, is_correct)
        )
      `)
      .eq("attempt_id", attemptId);

    if (ansErr || !answers) {
      return {
        success: false,
        attempt_id: attemptId,
        processed_count: 0,
        error: `Failed to fetch attempt answers: ${ansErr?.message}`,
      };
    }

    // 3. Fetch Taxonomy Names
    const { data: subjectsData } = await supabase.from("subjects").select("id, name");
    const { data: chaptersData } = await supabase.from("chapters").select("id, name");
    const { data: topicsData } = await supabase.from("topics").select("id, name");

    const subjectMap = new Map<string, string>((subjectsData || []).map((s: any) => [s.id, s.name]));
    const chapterMap = new Map<string, string>((chaptersData || []).map((c: any) => [c.id, c.name]));
    const topicMap = new Map<string, string>((topicsData || []).map((t: any) => [t.id, t.name]));

    const mistakesToInsert: any[] = [];
    const questionHistoryUpdates: Array<{
      student_id: string;
      question_id: string;
      is_correct: boolean | null;
      is_attempted: boolean;
    }> = [];

    const aiProvider = getAIProvider();

    // 4. Process each answer
    for (let idx = 0; idx < answers.length; idx++) {
      const ans = answers[idx];
      const q = ans.question as any;
      if (!q) continue;

      const isAttempted = ans.selected_option_id !== null;
      const isCorrect = ans.is_correct === true;
      const isIncorrect = isAttempted && ans.is_correct === false;
      const isDeliberatedUnattempted =
        !isAttempted && ans.is_visited === true && (ans.time_spent_seconds || 0) >= 30;

      // Track question history for every visited question
      questionHistoryUpdates.push({
        student_id: attempt.student_id,
        question_id: q.id,
        is_correct: ans.is_correct,
        is_attempted: isAttempted,
      });

      // Filter for mistakes
      if (!isIncorrect && !isDeliberatedUnattempted) {
        continue;
      }

      const options: QuestionOption[] = q.options || [];
      const correctOption = options.find((o) => o.is_correct);
      const selectedOption = options.find((o) => o.id === ans.selected_option_id);

      const subjName = subjectMap.get(q.subject_id) || "General";
      const chapName = chapterMap.get(q.chapter_id) || "General Chapter";
      const topName = q.topic_id ? topicMap.get(q.topic_id) : null;

      // Deterministic classification
      const ruleResult = classifyMistakeDeterministically({
        selected_option_id: ans.selected_option_id,
        is_correct: ans.is_correct,
        time_spent_seconds: ans.time_spent_seconds || 0,
        is_marked_for_review: ans.is_marked_for_review || false,
        is_visited: ans.is_visited || false,
        difficulty: q.difficulty,
        question_order_index: idx + 1,
        total_questions: answers.length,
      });

      let finalType: MistakeCategory = ruleResult.mistake_type;
      let finalSource: ClassificationSource = ruleResult.source;
      let finalConfidence: ClassificationConfidence = ruleResult.confidence;
      let rationale: string = ruleResult.rationale;

      // If deterministic rule is ambiguous (UNKNOWN), invoke AI classifier
      if (finalType === "UNKNOWN" && isIncorrect) {
        try {
          const aiResult = await aiProvider.classifyMistake({
            question_id: q.id,
            question_latex: q.content_latex || "",
            options: options.map((o) => ({
              option_key: o.option_key,
              content_latex: o.content_latex,
              is_correct: o.is_correct,
            })),
            selected_option_key: selectedOption?.option_key || null,
            correct_option_key: correctOption?.option_key || "A",
            time_spent_seconds: ans.time_spent_seconds || 0,
            difficulty: q.difficulty || "MEDIUM",
            subject_name: subjName,
            chapter_name: chapName,
            topic_name: topName,
            is_marked_for_review: ans.is_marked_for_review || false,
            deterministic_hint: ruleResult.rule_triggered,
          });

          finalType = aiResult.mistake_type;
          finalSource = "AI";
          finalConfidence = aiResult.confidence;
          rationale = aiResult.pedagogical_rationale;
        } catch (aiErr) {
          console.warn("AI mistake classification fallback to rule:", aiErr);
          // Keep deterministic UNKNOWN fallback
        }
      }

      const evidence = {
        time_spent_seconds: ans.time_spent_seconds || 0,
        allocated_average_seconds: Math.round(
          ((attempt.test?.duration_minutes || 180) * 60) / answers.length
        ),
        selected_option_key: selectedOption?.option_key || null,
        correct_option_key: correctOption?.option_key || "A",
        difficulty: q.difficulty,
        is_marked_for_review: ans.is_marked_for_review || false,
        is_unattempted: !isAttempted,
        rule_triggered: ruleResult.rule_triggered,
        rationale,
        audit_history: [
          {
            changed_at: new Date().toISOString(),
            previous_type: finalType,
            new_type: finalType,
            changed_by: "SYSTEM",
            source: finalSource,
            notes: "Initial automated extraction",
          },
        ],
      };

      mistakesToInsert.push({
        attempt_answer_id: ans.id,
        student_id: attempt.student_id,
        question_id: q.id,
        attempt_id: attempt.id,
        test_id: attempt.test_id,
        subject_id: q.subject_id,
        chapter_id: q.chapter_id,
        topic_id: q.topic_id,
        mistake_type: finalType,
        classification_source: finalSource,
        classification_confidence: finalConfidence,
        classification_status: "SUGGESTED" as const,
        resolution_status: "OPEN" as const,
        evidence,
        updated_at: new Date().toISOString(),
      });
    }

    // 5. Idempotent Upsert into mistakes Table
    if (mistakesToInsert.length > 0) {
      const { error: upsertErr } = await supabase
        .from("mistakes")
        .upsert(mistakesToInsert, { onConflict: "attempt_answer_id" });

      if (upsertErr) {
        console.error("Error upserting mistakes:", upsertErr);
      }
    }

    // 6. Update student_question_history
    for (const qh of questionHistoryUpdates) {
      try {
        const { data: existingQh } = await supabase
          .from("student_question_history")
          .select("*")
          .eq("student_id", qh.student_id)
          .eq("question_id", qh.question_id)
          .maybeSingle();

        const lastResult =
          qh.is_correct === true
            ? "CORRECT"
            : qh.is_correct === false
            ? "INCORRECT"
            : "UNATTEMPTED";

        if (existingQh) {
          await supabase
            .from("student_question_history")
            .update({
              times_attempted: existingQh.times_attempted + (qh.is_attempted ? 1 : 0),
              times_correct: existingQh.times_correct + (qh.is_correct === true ? 1 : 0),
              times_incorrect: existingQh.times_incorrect + (qh.is_correct === false ? 1 : 0),
              last_attempted_at: new Date().toISOString(),
              last_result: lastResult,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingQh.id);
        } else {
          await supabase.from("student_question_history").insert({
            student_id: qh.student_id,
            question_id: qh.question_id,
            times_attempted: qh.is_attempted ? 1 : 0,
            times_correct: qh.is_correct === true ? 1 : 0,
            times_incorrect: qh.is_correct === false ? 1 : 0,
            first_attempted_at: new Date().toISOString(),
            last_attempted_at: new Date().toISOString(),
            last_result: lastResult,
          });
        }
      } catch (qhErr) {
        console.warn("Failed to update student question history:", qhErr);
      }
    }

    return {
      success: true,
      attempt_id: attemptId,
      processed_count: mistakesToInsert.length,
    };
  } catch (err: any) {
    console.error("Critical error in processAttemptMistakes:", err);
    return {
      success: false,
      attempt_id: attemptId,
      processed_count: 0,
      error: err?.message || "Internal mistake pipeline error",
    };
  }
}
