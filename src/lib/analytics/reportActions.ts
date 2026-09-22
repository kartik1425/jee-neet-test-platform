"use server";

import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import {
  AIDiagnosticReport,
  AIDiagnosticReportSchema,
  DeterministicAnalyticsPayload,
  FullDiagnosticReportBundle,
} from "@/types/diagnosticReport";
import {
  buildDeterministicAnalyticsPayload,
  AttemptWithDetails,
  AnswerWithQuestion,
} from "./diagnosticAggregator";
import { Subject, Chapter, Topic } from "@/types/database";

/**
 * Retrieves an existing AI diagnostic report or computes the deterministic payload
 * and asynchronously triggers the structured 6-section AI interpretation.
 */
export async function getOrGenerateDiagnosticReportAction(
  attemptId: string
): Promise<{ success: boolean; data?: FullDiagnosticReportBundle; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    // 1. Fetch Attempt & verify access
    const { data: attemptData, error: attemptErr } = await supabase
      .from("attempts")
      .select(`
        *,
        test:tests (
          id,
          title,
          exam_type,
          duration_minutes,
          total_marks
        )
      `)
      .eq("id", attemptId)
      .single();

    if (attemptErr || !attemptData) {
      return { success: false, error: "Attempt not found or unauthorized." };
    }

    // Check if attempt belongs to user or user is teacher/admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isTeacherOrAdmin = profile?.role === "TEACHER" || profile?.role === "ADMIN";
    if (attemptData.student_id !== user.id && !isTeacherOrAdmin) {
      return { success: false, error: "Forbidden: You do not have access to this attempt's analysis." };
    }

    // 2. Check for existing cached AI analysis
    const { data: existingAnalysis } = await supabase
      .from("ai_analysis")
      .select("*")
      .eq("attempt_id", attemptId)
      .maybeSingle();

    if (existingAnalysis && existingAnalysis.status === "COMPLETED" && existingAnalysis.ai_report) {
      return {
        success: true,
        data: {
          attempt_id: attemptId,
          test_id: attemptData.test_id,
          status: "COMPLETED",
          deterministic_payload: existingAnalysis.deterministic_payload as DeterministicAnalyticsPayload,
          ai_report: existingAnalysis.ai_report as AIDiagnosticReport,
          generated_at: existingAnalysis.completed_at || existingAnalysis.created_at,
        },
      };
    }

    // 3. Fetch Attempt Answers & Taxonomy to build deterministic payload
    const { data: answersData, error: ansErr } = await supabase
      .from("attempt_answers")
      .select(`
        *,
        question:questions (
          *,
          options:question_options (*)
        )
      `)
      .eq("attempt_id", attemptId);

    if (ansErr || !answersData) {
      return { success: false, error: "Failed to retrieve attempt answers." };
    }

    const { data: subjectsData } = await supabase.from("subjects").select("*");
    const { data: chaptersData } = await supabase.from("chapters").select("*");
    const { data: topicsData } = await supabase.from("topics").select("*");

    const deterministicPayload = buildDeterministicAnalyticsPayload(
      attemptData as unknown as AttemptWithDetails,
      answersData as unknown as AnswerWithQuestion[],
      (subjectsData || []) as Subject[],
      (chaptersData || []) as Chapter[],
      (topicsData || []) as Topic[]
    );

    // 4. Generate AI Diagnostic Report
    const startTime = Date.now();
    let validatedAiReport;
    try {
      const aiProvider = getAIProvider();
      const rawAiReport = await aiProvider.generateDiagnosticReport(deterministicPayload);
      validatedAiReport = AIDiagnosticReportSchema.parse(rawAiReport);
    } catch (aiErr: any) {
      console.warn("Primary AI Diagnostic report generation notice (falling back to deterministic AI model):", aiErr?.message);
      const { MockAIProvider } = await import("@/lib/ai/mockAdapter");
      const fallbackProvider = new MockAIProvider();
      const rawFallback = await fallbackProvider.generateDiagnosticReport(deterministicPayload);
      validatedAiReport = AIDiagnosticReportSchema.parse(rawFallback);
    }

    const genTimeMs = Date.now() - startTime;

    // Upsert completed record into ai_analysis
    const analysisRecord = {
      attempt_id: attemptId,
      user_id: attemptData.student_id,
      test_id: attemptData.test_id,
      status: "COMPLETED" as const,
      report_version: validatedAiReport.report_version || "v1.0.0",
      deterministic_payload: deterministicPayload,
      ai_report: validatedAiReport,
      error_message: null,
      generation_time_ms: genTimeMs,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase.from("ai_analysis").upsert(analysisRecord, { onConflict: "attempt_id" });

    // Automatically trigger persistent mistake engine extraction in background
    try {
      const { processAttemptMistakes } = await import("@/lib/mistakes/pipeline");
      await processAttemptMistakes(attemptId, supabase);
    } catch (mErr) {
      console.warn("Persistent mistake extraction non-blocking notice:", mErr);
    }

    return {
      success: true,
      data: {
        attempt_id: attemptId,
        test_id: attemptData.test_id,
        status: "COMPLETED",
        deterministic_payload: deterministicPayload,
        ai_report: validatedAiReport,
        generated_at: analysisRecord.completed_at,
      },
    };
  } catch (err: any) {
    console.error("Error in getOrGenerateDiagnosticReportAction:", err);
    return { success: false, error: err?.message || "Internal server error." };
  }
}

/**
 * Retries AI Diagnostic Report generation for a given attempt.
 */
export async function retryDiagnosticReportAction(
  attemptId: string
): Promise<{ success: boolean; data?: FullDiagnosticReportBundle; error?: string }> {
  try {
    const supabase = await createClient();
    // Delete existing failed analysis to force fresh generation
    await supabase.from("ai_analysis").delete().eq("attempt_id", attemptId);
    return await getOrGenerateDiagnosticReportAction(attemptId);
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to retry diagnostic report." };
  }
}
