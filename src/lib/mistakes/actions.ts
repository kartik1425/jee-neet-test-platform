"use server";

import { createClient } from "@/lib/supabase/server";
import {
  MistakeCategory,
  PersistentMistakeRecord,
  StudentMistakeSummary,
  AggregationOptions,
} from "@/types/mistakes";
import { aggregateStudentMistakes } from "./aggregator";
import { processAttemptMistakes } from "./pipeline";

/**
 * Server action to fetch a student's full longitudinal mistake history,
 * summary metrics, Topic + Mistake Matrix, and recurring patterns.
 */
export async function getStudentMistakeHistoryAction(
  targetStudentId?: string,
  options?: AggregationOptions
): Promise<{
  success: boolean;
  summary?: StudentMistakeSummary;
  mistakes?: PersistentMistakeRecord[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isTeacherOrAdmin = profile?.role === "TEACHER" || profile?.role === "ADMIN";
    const studentId = isTeacherOrAdmin && targetStudentId ? targetStudentId : user.id;

    // Fetch student's mistake records with joined metadata
    const { data: rawMistakes, error: fetchErr } = await supabase
      .from("mistakes")
      .select(`
        *,
        subject:subjects (id, name),
        chapter:chapters (id, name),
        topic:topics (id, name),
        question:questions (id, content_latex, difficulty, options:question_options(*)),
        attempt:attempts (id, started_at, submitted_at, total_score, accuracy_percentage),
        test:tests (id, title, exam_type)
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (fetchErr) {
      return { success: false, error: `Failed to fetch mistakes: ${fetchErr.message}` };
    }

    const mistakes = (rawMistakes || []) as PersistentMistakeRecord[];
    const summary = aggregateStudentMistakes(mistakes, studentId, options);

    return {
      success: true,
      summary,
      mistakes,
    };
  } catch (err: any) {
    console.error("Error in getStudentMistakeHistoryAction:", err);
    return { success: false, error: err?.message || "Internal server error" };
  }
}

/**
 * Server action for teachers/admins to confirm or correct an AI/Rule mistake classification.
 * Preserves the previous classification in the audit trail.
 */
export async function teacherConfirmOrCorrectMistakeAction(
  mistakeId: string,
  newType: MistakeCategory,
  teacherNotes?: string
): Promise<{ success: boolean; data?: PersistentMistakeRecord; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "TEACHER" && profile?.role !== "ADMIN") {
      return { success: false, error: "Forbidden: Only teachers and admins can review mistakes." };
    }

    // 1. Fetch current mistake
    const { data: existing, error: getErr } = await supabase
      .from("mistakes")
      .select("*")
      .eq("id", mistakeId)
      .single();

    if (getErr || !existing) {
      return { success: false, error: "Mistake record not found." };
    }

    const currentEvidence = existing.evidence || {};
    const auditHistory = currentEvidence.audit_history || [];

    // Append new audit entry
    auditHistory.push({
      changed_at: new Date().toISOString(),
      previous_type: existing.mistake_type,
      new_type: newType,
      changed_by: user.id,
      source: "TEACHER",
      notes: teacherNotes || "Teacher confirmed/corrected classification",
    });

    const updatedEvidence = {
      ...currentEvidence,
      rationale: teacherNotes || currentEvidence.rationale,
      audit_history: auditHistory,
    };

    // 2. Update record
    const { data: updated, error: updateErr } = await supabase
      .from("mistakes")
      .update({
        mistake_type: newType,
        classification_source: "TEACHER",
        classification_confidence: "HIGH",
        classification_status: "CONFIRMED",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        evidence: updatedEvidence,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mistakeId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: `Failed to update mistake: ${updateErr.message}` };
    }

    return {
      success: true,
      data: updated as PersistentMistakeRecord,
    };
  } catch (err: any) {
    console.error("Error in teacherConfirmOrCorrectMistakeAction:", err);
    return { success: false, error: err?.message || "Internal server error" };
  }
}

/**
 * Server action to trigger mistake processing for a given attempt.
 */
export async function processAttemptMistakesAction(
  attemptId: string
): Promise<{ success: boolean; processed_count?: number; error?: string }> {
  const result = await processAttemptMistakes(attemptId);
  return {
    success: result.success,
    processed_count: result.processed_count,
    error: result.error,
  };
}
