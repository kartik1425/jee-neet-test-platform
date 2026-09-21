"use server";

import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import {
  AITestBlueprint,
  AITestBlueprintSchema,
  PaperGenerationResult,
} from "@/types/aiTestGenerator";
import { validateBlueprintAgainstTaxonomy, DBTaxonomyContext } from "./blueprintValidator";
import {
  executeAIPaperGeneration,
  CandidateQuestionRecord,
} from "./aiPaperGenerator";
import { Subject, Chapter, TestStatus } from "@/types/database";

/**
 * Helper to fetch database curriculum taxonomy.
 */
async function fetchDatabaseTaxonomy(supabase: any): Promise<DBTaxonomyContext> {
  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id, name, code, created_at")
    .order("name", { ascending: true });

  const { data: chaptersData } = await supabase
    .from("chapters")
    .select("id, subject_id, name, order_index, created_at")
    .order("order_index", { ascending: true });

  return {
    subjects: subjectsData || [],
    chapters: chaptersData || [],
  };
}

/**
 * Step 1: Generates structured blueprint from teacher's natural language request.
 */
export async function generateBlueprintFromPromptAction(
  prompt: string
): Promise<{ success: boolean; blueprint?: AITestBlueprint; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    const taxonomy = await fetchDatabaseTaxonomy(supabase);
    const availableTaxonomy = taxonomy.subjects.map((s) => ({
      subjectName: s.name,
      chapterNames: taxonomy.chapters
        .filter((c) => c.subject_id === s.id)
        .map((c) => c.name),
    }));

    // Call AI provider to generate structured blueprint
    const aiProvider = getAIProvider();
    const rawBlueprint = await aiProvider.generateTestBlueprint(prompt, availableTaxonomy);
    const validation = validateBlueprintAgainstTaxonomy(rawBlueprint, taxonomy);

    if (!validation.is_valid) {
      return {
        success: false,
        error: `Blueprint validation failed: ${validation.validation_errors.join(", ")}`,
      };
    }

    return {
      success: true,
      blueprint: validation.blueprint,
    };
  } catch (err: any) {
    console.error("Error generating AI test blueprint:", err);
    return { success: false, error: err.message || "Failed to generate blueprint." };
  }
}

/**
 * Step 2: Creates DRAFT test in PostgreSQL database using validated blueprint.
 */
export async function createAITestDraftAction(
  blueprint: AITestBlueprint
): Promise<PaperGenerationResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        blueprint,
        selected_questions: [],
        total_selected: 0,
        is_shortage: false,
        errors: ["Unauthorized: You must be logged in as a Teacher or Admin."],
      };
    }

    // Role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "TEACHER" && profile.role !== "ADMIN")) {
      return {
        success: false,
        blueprint,
        selected_questions: [],
        total_selected: 0,
        is_shortage: false,
        errors: ["Access denied: Only TEACHER or ADMIN roles can generate AI test papers."],
      };
    }

    const taxonomy = await fetchDatabaseTaxonomy(supabase);

    // Fetch recent question IDs to exclude
    const recentExcludedIds = new Set<string>();
    const excludeCount = blueprint.source_constraints.exclude_recent_test_count || 0;

    if (excludeCount > 0) {
      const { data: recentTests } = await supabase
        .from("tests")
        .select("id")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(excludeCount);

      if (recentTests && recentTests.length > 0) {
        const testIds = recentTests.map((t: any) => t.id);
        const { data: recentQuestions } = await supabase
          .from("test_questions")
          .select("question_id")
          .in("test_id", testIds);

        if (recentQuestions) {
          recentQuestions.forEach((rq: any) => recentExcludedIds.add(rq.question_id));
        }
      }
    }

    // Query candidate questions from database
    const { data: questionsData, error: qErr } = await supabase
      .from("questions")
      .select(`
        id, subject_id, chapter_id, topic_id, exam_type, question_type,
        difficulty, content_latex, explanation_latex, source_type,
        pyq_year, pyq_shift, status, is_active, created_at, updated_at,
        question_options (id, question_id, option_key, content_latex, is_correct, order_index)
      `)
      .eq("status", "APPROVED")
      .eq("is_active", true);

    if (qErr || !questionsData) {
      return {
        success: false,
        blueprint,
        selected_questions: [],
        total_selected: 0,
        is_shortage: false,
        errors: [`Database error fetching candidate questions: ${qErr?.message || "Unknown error"}`],
      };
    }

    const candidatePool: CandidateQuestionRecord[] = questionsData.map((q: any) => ({
      ...q,
      options: q.question_options || [],
      subject_name: taxonomy.subjects.find((s) => s.id === q.subject_id)?.name,
      chapter_name: taxonomy.chapters.find((c) => c.id === q.chapter_id)?.name,
    }));

    // Run deterministic selection & validation engine
    const selectionResult = executeAIPaperGeneration(
      blueprint,
      taxonomy,
      candidatePool,
      recentExcludedIds
    );

    if (!selectionResult.success) {
      return selectionResult;
    }

    // Insert DRAFT test into tests table
    const { data: testRecord, error: testErr } = await supabase
      .from("tests")
      .insert({
        title: blueprint.title,
        description: blueprint.description || "AI-generated exam draft",
        instructions: blueprint.instructions || "Standard competitive exam rules apply.",
        exam_type: blueprint.exam_type,
        test_mode: "SCHEDULED",
        duration_minutes: blueprint.duration_minutes,
        total_marks: selectionResult.selected_questions.length * blueprint.marking_scheme.correct,
        marking_scheme: blueprint.marking_scheme,
        status: "DRAFT" as TestStatus,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (testErr || !testRecord) {
      return {
        success: false,
        blueprint,
        selected_questions: [],
        total_selected: 0,
        is_shortage: false,
        errors: [`Failed to create draft test record: ${testErr?.message || "Unknown error"}`],
      };
    }

    const testId = testRecord.id;

    // Group selected questions by section
    const sectionMap = new Map<string, typeof selectionResult.selected_questions>();
    selectionResult.selected_questions.forEach((q) => {
      const list = sectionMap.get(q.section_name) || [];
      list.push(q);
      sectionMap.set(q.section_name, list);
    });

    let secOrder = 1;
    for (const [secName, qList] of sectionMap.entries()) {
      const { data: sectionRecord } = await supabase
        .from("test_sections")
        .insert({
          test_id: testId,
          name: secName,
          order_index: secOrder++,
        })
        .select("id")
        .single();

      const sectionId = sectionRecord?.id || null;

      const tqInserts = qList.map((sq) => ({
        test_id: testId,
        question_id: sq.question_id,
        section_id: sectionId,
        order_index: sq.order_index,
        marks: blueprint.marking_scheme.correct,
        negative_marks: Math.abs(blueprint.marking_scheme.incorrect),
      }));

      await supabase.from("test_questions").insert(tqInserts);
    }

    return {
      success: true,
      test_id: testId,
      blueprint,
      selected_questions: selectionResult.selected_questions,
      total_selected: selectionResult.selected_questions.length,
      is_shortage: false,
    };
  } catch (err: any) {
    console.error("Error creating AI test draft:", err);
    return {
      success: false,
      blueprint,
      selected_questions: [],
      total_selected: 0,
      is_shortage: false,
      errors: [err.message || "Failed to create AI test draft."],
    };
  }
}

/**
 * Step 3: Replaces an individual question in a draft test with an eligible substitute.
 */
export async function replaceDraftQuestionAction(
  testId: string,
  oldQuestionId: string
): Promise<{ success: boolean; newQuestionId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    // 1. Fetch test and verify status is DRAFT
    const { data: test } = await supabase
      .from("tests")
      .select("id, status, created_by, exam_type")
      .eq("id", testId)
      .single();

    if (!test || test.status !== "DRAFT") {
      return { success: false, error: "Only DRAFT tests can be modified." };
    }

    // 2. Fetch existing question IDs in this test
    const { data: existingTQs } = await supabase
      .from("test_questions")
      .select("id, question_id, section_id, order_index")
      .eq("test_id", testId);

    const oldTQ = existingTQs?.find((tq: any) => tq.question_id === oldQuestionId);
    if (!oldTQ) {
      return { success: false, error: "Question not found in this draft test." };
    }

    const currentQuestionIds = new Set((existingTQs || []).map((t: any) => t.question_id));

    // 3. Fetch old question taxonomy to find matching replacement
    const { data: oldQ } = await supabase
      .from("questions")
      .select("subject_id, chapter_id, difficulty")
      .eq("id", oldQuestionId)
      .single();

    if (!oldQ) {
      return { success: false, error: "Old question details could not be retrieved." };
    }

    // 4. Query candidate replacements
    const { data: candidates } = await supabase
      .from("questions")
      .select(`
        id, subject_id, chapter_id, difficulty, status, is_active,
        question_options (id, is_correct)
      `)
      .eq("subject_id", oldQ.subject_id)
      .eq("chapter_id", oldQ.chapter_id)
      .eq("status", "APPROVED")
      .eq("is_active", true);

    const eligible = (candidates || []).filter((q: any) => {
      if (currentQuestionIds.has(q.id)) return false;
      if (!q.question_options || q.question_options.length !== 4) return false;
      const correctCount = q.question_options.filter((o: any) => o.is_correct).length;
      return correctCount === 1;
    });

    if (eligible.length === 0) {
      return {
        success: false,
        error: "No alternative approved questions found in the same chapter.",
      };
    }

    const replacement = eligible[Math.floor(Math.random() * eligible.length)];

    // 5. Update test_questions record
    await supabase
      .from("test_questions")
      .update({ question_id: replacement.id })
      .eq("id", oldTQ.id);

    return {
      success: true,
      newQuestionId: replacement.id,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to replace question." };
  }
}
