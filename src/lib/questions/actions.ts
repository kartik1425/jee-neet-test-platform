"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { QuestionCreateSchema, Question, QuestionOption } from "@/types/database";
import { revalidatePath } from "next/cache";

function getDbClient(fallbackSupabase: any) {
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return createAdminClient();
    }
  } catch {
    // Fallback
  }
  return fallbackSupabase;
}

export interface QuestionListParams {
  page?: number;
  limit?: number;
  examType?: string;
  subjectId?: string;
  chapterId?: string;
  difficulty?: string;
  status?: string;
  search?: string;
}

export interface QuestionListResponse {
  questions: (Question & {
    subject_name?: string;
    chapter_name?: string;
    options: QuestionOption[];
  })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch Paginated Question Bank with filtering and search.
 */
export async function getQuestionsList(
  params: QuestionListParams = {}
): Promise<QuestionListResponse> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 10));
  const offset = (page - 1) * limit;

  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  let query = dbClient
    .from("questions")
    .select(
      `
      *,
      subjects!questions_subject_id_fkey(name),
      chapters!questions_chapter_id_fkey(name),
      question_options(*)
    `,
      { count: "exact" }
    );

  if (params.examType && params.examType !== "ALL") {
    query = query.eq("exam_type", params.examType);
  }
  if (params.subjectId && params.subjectId !== "ALL") {
    query = query.eq("subject_id", params.subjectId);
  }
  if (params.chapterId && params.chapterId !== "ALL") {
    query = query.eq("chapter_id", params.chapterId);
  }
  if (params.difficulty && params.difficulty !== "ALL") {
    query = query.eq("difficulty", params.difficulty);
  }
  if (params.status && params.status !== "ALL") {
    query = query.eq("status", params.status);
  }
  if (params.search && params.search.trim() !== "") {
    query = query.ilike("content_latex", `%${params.search.trim()}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    console.error("Error fetching questions list:", error);
    return {
      questions: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  const formattedQuestions = data.map((item: any) => ({
    ...item,
    subject_name: item.subjects?.name,
    chapter_name: item.chapters?.name,
    options: (item.question_options || []).sort(
      (a: QuestionOption, b: QuestionOption) => a.order_index - b.order_index
    ),
  }));

  const total = count || 0;
  return {
    questions: formattedQuestions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Fetch a single question with options.
 */
export async function getQuestionById(id: string): Promise<Question | null> {
  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  const { data, error } = await dbClient
    .from("questions")
    .select(`*, question_options(*)`)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    options: (data.question_options || []).sort(
      (a: QuestionOption, b: QuestionOption) => a.order_index - b.order_index
    ),
  };
}

/**
 * Create a new V1 Single MCQ Question.
 * Authorized for TEACHER and ADMIN only.
 */
export async function createQuestionAction(rawData: any) {
  const session = await requireRole(["TEACHER", "ADMIN"]);

  const parsed = QuestionCreateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    subjectId,
    chapterId,
    topicId,
    examType,
    difficulty,
    contentLatex,
    explanationLatex,
    sourceType,
    pyqYear,
    pyqShift,
    sourceReference,
    options,
  } = parsed.data;

  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  // 1. Insert Question Record
  const { data: question, error: qErr } = await dbClient
    .from("questions")
    .insert({
      subject_id: subjectId,
      chapter_id: chapterId,
      topic_id: topicId || null,
      exam_type: examType,
      question_type: "SINGLE_MCQ",
      difficulty,
      content_latex: contentLatex,
      explanation_latex: explanationLatex || null,
      source_type: sourceType,
      pyq_year: pyqYear || null,
      pyq_shift: pyqShift || null,
      source_reference: sourceReference || null,
      status: "APPROVED",
      is_active: true,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (qErr || !question) {
    return { success: false, error: qErr?.message || "Failed to create question." };
  }

  // 2. Insert Options
  const optionRows = options.map((opt, idx) => ({
    question_id: question.id,
    option_key: opt.optionKey,
    content_latex: opt.contentLatex,
    is_correct: opt.isCorrect,
    order_index: idx + 1,
  }));

  const { error: optErr } = await dbClient.from("question_options").insert(optionRows);

  if (optErr) {
    // Clean up created question if option insert fails
    await dbClient.from("questions").delete().eq("id", question.id);
    return { success: false, error: optErr.message };
  }

  revalidatePath("/admin/questions");
  return { success: true, questionId: question.id };
}

/**
 * Update Question Action
 */
export async function updateQuestionAction(questionId: string, rawData: any) {
  await requireRole(["TEACHER", "ADMIN"]);

  const parsed = QuestionCreateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    subjectId,
    chapterId,
    topicId,
    examType,
    difficulty,
    contentLatex,
    explanationLatex,
    sourceType,
    pyqYear,
    pyqShift,
    sourceReference,
    options,
  } = parsed.data;

  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  // 1. Update question
  const { error: qErr } = await dbClient
    .from("questions")
    .update({
      subject_id: subjectId,
      chapter_id: chapterId,
      topic_id: topicId || null,
      exam_type: examType,
      difficulty,
      content_latex: contentLatex,
      explanation_latex: explanationLatex || null,
      source_type: sourceType,
      pyq_year: pyqYear || null,
      pyq_shift: pyqShift || null,
      source_reference: sourceReference || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId);

  if (qErr) {
    return { success: false, error: qErr.message };
  }

  // 2. Upsert options
  for (let idx = 0; idx < options.length; idx++) {
    const opt = options[idx];
    await dbClient
      .from("question_options")
      .upsert({
        question_id: questionId,
        option_key: opt.optionKey,
        content_latex: opt.contentLatex,
        is_correct: opt.isCorrect,
        order_index: idx + 1,
      });
  }

  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${questionId}`);
  return { success: true };
}

/**
 * Archive Question Action
 */
export async function archiveQuestionAction(questionId: string) {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  const { error } = await dbClient
    .from("questions")
    .update({
      status: "ARCHIVED",
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/questions");
  return { success: true };
}

/**
 * Restore Question Action
 */
export async function restoreQuestionAction(questionId: string) {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  const { error } = await dbClient
    .from("questions")
    .update({
      status: "APPROVED",
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/questions");
  return { success: true };
}
