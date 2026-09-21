"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import {
  IngestionUploadSchema,
  IngestionUploadInput,
  IngestionItemEditSchema,
  IngestionItemEditInput,
  IngestionBatch,
  IngestionItem,
  StagingOptionItem,
} from "@/types/ingestion";
import { parseCsvQuestionDocument, parseStructuredTextDocument } from "./parser";
import { normalizeLatexContent } from "./latexNormalizer";
import { validateStagingItem } from "./validator";
import { evaluateDuplicateCandidate } from "./duplicateDetector";
import { getAIProvider } from "../ai";
import { revalidatePath } from "next/cache";

/**
 * Fetch Paginated Ingestion Batches.
 */
export async function getIngestionBatchesList() {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { data: batches, error } = await supabase
    .from("ingestion_batches")
    .select(`
      *,
      profiles!ingestion_batches_created_by_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (error || !batches) {
    return [];
  }

  return batches as IngestionBatch[];
}

/**
 * Fetch Ingestion Batch with Staging Items.
 */
export async function getIngestionBatchDetail(batchId: string): Promise<{
  batch: IngestionBatch;
  items: IngestionItem[];
} | null> {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { data: batch, error: bErr } = await supabase
    .from("ingestion_batches")
    .select(`
      *,
      profiles!ingestion_batches_created_by_fkey(full_name, email)
    `)
    .eq("id", batchId)
    .single();

  if (bErr || !batch) {
    return null;
  }

  const { data: items, error: iErr } = await supabase
    .from("ingestion_items")
    .select("*")
    .eq("batch_id", batchId)
    .order("order_index", { ascending: true });

  return {
    batch: batch as IngestionBatch,
    items: (items || []) as IngestionItem[],
  };
}

/**
 * Create Ingestion Batch and Execute Parsing & Staging Pipeline.
 */
export async function createIngestionBatchAction(rawInput: IngestionUploadInput) {
  const session = await requireRole(["TEACHER", "ADMIN"]);
  const userId = session.user.id;

  const parsed = IngestionUploadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: `Validation failed: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    };
  }

  const {
    title,
    rightsDeclaration,
    fileType,
    examType,
    defaultSubjectId,
    defaultChapterId,
    textContent,
  } = parsed.data;

  if (!textContent || textContent.trim() === "") {
    return { success: false, error: "Document content is empty." };
  }

  const supabase = await createClient();

  // 1. Create Ingestion Batch Record
  const { data: batch, error: batchErr } = await supabase
    .from("ingestion_batches")
    .insert({
      title,
      created_by: userId,
      rights_declaration: rightsDeclaration,
      status: "PROCESSING",
      source_filename: `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${fileType.toLowerCase()}`,
      file_type: fileType,
      file_size_bytes: Buffer.byteLength(textContent, "utf8"),
    })
    .select("id")
    .single();

  if (batchErr || !batch) {
    return { success: false, error: batchErr?.message || "Failed to create ingestion batch." };
  }

  // 2. Fetch existing question bank for duplicate detection
  const { data: existingQuestions } = await supabase
    .from("questions")
    .select("id, content_latex")
    .limit(200);

  const existingBank = (existingQuestions || []).map((q: any) => ({
    id: q.id,
    content_latex: q.content_latex,
  }));

  // 3. Fetch Taxonomy for auto-mapping
  const { data: dbSubjects } = await supabase.from("subjects").select("id, name");
  const { data: dbChapters } = await supabase.from("chapters").select("id, subject_id, name");

  const subjectsList = dbSubjects || [];
  const chaptersList = dbChapters || [];

  // 4. Parse Raw Document
  let parsedRawItems =
    fileType === "CSV"
      ? parseCsvQuestionDocument(textContent)
      : parseStructuredTextDocument(textContent);

  if (parsedRawItems.length === 0) {
    await supabase
      .from("ingestion_batches")
      .update({
        status: "FAILED",
        processing_error: "No questions could be identified from the document structure.",
      })
      .eq("id", batch.id);

    return { success: false, error: "No questions could be extracted from the document." };
  }

  const aiProvider = getAIProvider();
  const stagingItemsPayload: any[] = [];
  const batchSeenTexts: { id: string; content_latex: string }[] = [];

  let validCount = 0;
  let needsReviewCount = 0;
  let duplicateCount = 0;

  // 5. Process each extracted question
  for (let i = 0; i < parsedRawItems.length; i++) {
    const raw = parsedRawItems[i];

    // If text needs deeper AI normalization/structuring
    let questionLatex = raw.question_text;
    let options: StagingOptionItem[] = raw.options;
    let correctKey = raw.correct_option_key;
    let explanationLatex = raw.explanation_text;
    let pyqYear = raw.pyq_year;
    let pyqShift = raw.pyq_shift;
    let suggestedSubjectName = raw.suggested_subject_name;
    let suggestedChapterName = raw.suggested_chapter_name;
    let suggestedTopicName = raw.suggested_topic_name;
    let diff = (raw.difficulty as any) || "MEDIUM";

    // If options were not fully extracted by deterministic parser, consult AI
    const has4Options = options.length === 4 && options.every((o) => o.content_latex.trim() !== "");
    if (!has4Options) {
      try {
        const aiExtracted = await aiProvider.normalizeAndExtractQuestion(raw.raw_content, {
          examType,
          defaultSubject: subjectsList.find((s) => s.id === defaultSubjectId)?.name,
        });

        questionLatex = aiExtracted.question_latex;
        options = aiExtracted.options;
        correctKey = aiExtracted.correct_option_key;
        explanationLatex = aiExtracted.explanation_latex || explanationLatex;
        suggestedSubjectName = aiExtracted.suggested_subject_name || suggestedSubjectName;
        suggestedChapterName = aiExtracted.suggested_chapter_name || suggestedChapterName;
        suggestedTopicName = aiExtracted.suggested_topic_name || suggestedTopicName;
        diff = aiExtracted.difficulty || diff;
        pyqYear = aiExtracted.pyq_year || pyqYear;
        pyqShift = aiExtracted.pyq_shift || pyqShift;
      } catch (aiErr) {
        console.warn(`AI extraction fallback for item ${i + 1}:`, aiErr);
      }
    }

    // Resolve Taxonomy ID match
    let resolvedSubjectId = defaultSubjectId || null;
    let resolvedChapterId = defaultChapterId || null;

    if (suggestedSubjectName) {
      const match = subjectsList.find(
        (s) => s.name.toLowerCase() === suggestedSubjectName?.toLowerCase()
      );
      if (match) resolvedSubjectId = match.id;
    }

    if (suggestedChapterName) {
      const match = chaptersList.find(
        (c) =>
          c.name.toLowerCase() === suggestedChapterName?.toLowerCase() &&
          (!resolvedSubjectId || c.subject_id === resolvedSubjectId)
      );
      if (match) {
        resolvedChapterId = match.id;
        if (!resolvedSubjectId) resolvedSubjectId = match.subject_id;
      }
    }

    // 6. Duplicate Detection (Bank + Batch)
    const bankDupCheck = evaluateDuplicateCandidate(questionLatex, existingBank);
    const batchDupCheck = evaluateDuplicateCandidate(questionLatex, batchSeenTexts);

    let dupStatus = bankDupCheck.status;
    let matchedQId = bankDupCheck.matchedQuestionId;
    let simScore = bankDupCheck.similarityScore;

    if (batchDupCheck.status === "DUPLICATE" || batchDupCheck.status === "POSSIBLE_DUPLICATE") {
      dupStatus = batchDupCheck.status;
      simScore = Math.max(simScore, batchDupCheck.similarityScore);
    }

    if (dupStatus === "DUPLICATE") {
      duplicateCount++;
    }

    // 7. Validation Pipeline
    const validation = validateStagingItem(
      questionLatex,
      options,
      correctKey,
      resolvedSubjectId,
      resolvedChapterId
    );

    let itemStatus = validation.isValid && dupStatus === "NEW" ? "VALIDATED" : "NEEDS_REVIEW";
    if (dupStatus === "DUPLICATE") itemStatus = "DUPLICATE";

    if (itemStatus === "VALIDATED") validCount++;
    else needsReviewCount++;

    const stagingRow = {
      batch_id: batch.id,
      order_index: i + 1,
      raw_content: raw.raw_content,
      source_page_number: raw.source_page_number || 1,
      source_location_ref: raw.source_location_ref || `Item ${i + 1}`,
      extracted_latex: questionLatex,
      options,
      correct_option_key: correctKey,
      answer_status: validation.answerStatus,
      explanation_latex: explanationLatex,
      exam_type: examType,
      subject_id: resolvedSubjectId,
      chapter_id: resolvedChapterId,
      topic_id: null,
      suggested_subject_name: suggestedSubjectName,
      suggested_chapter_name: suggestedChapterName,
      suggested_topic_name: suggestedTopicName,
      difficulty: diff,
      source_type: pyqYear ? "PYQ" : "INSTITUTE",
      pyq_year: pyqYear,
      pyq_shift: pyqShift,
      pyq_provenance_status: pyqYear ? "USER_DECLARED" : "UNKNOWN",
      concept_tags: [],
      duplicate_status: dupStatus,
      duplicate_matched_question_id: matchedQId,
      similarity_score: simScore,
      status: itemStatus,
      validation_errors: validation.errors,
      ai_confidence: 0.95,
    };

    stagingItemsPayload.push(stagingRow);
    batchSeenTexts.push({ id: `batch-item-${i + 1}`, content_latex: questionLatex });
  }

  // 8. Insert Staging Items
  const { error: insertItemsErr } = await supabase
    .from("ingestion_items")
    .insert(stagingItemsPayload);

  if (insertItemsErr) {
    await supabase
      .from("ingestion_batches")
      .update({ status: "FAILED", processing_error: insertItemsErr.message })
      .eq("id", batch.id);

    return { success: false, error: insertItemsErr.message };
  }

  // 9. Update Batch Status to REVIEW
  await supabase
    .from("ingestion_batches")
    .update({
      status: "REVIEW",
      total_items_count: stagingItemsPayload.length,
      valid_items_count: validCount,
      needs_review_count: needsReviewCount,
      duplicate_items_count: duplicateCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", batch.id);

  revalidatePath("/admin/ingestion");
  return { success: true, batchId: batch.id };
}

/**
 * Update Ingestion Item from Review UI.
 */
export async function updateIngestionItemAction(itemId: string, rawData: any) {
  await requireRole(["TEACHER", "ADMIN"]);
  const parsed = IngestionItemEditSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      error: `Validation failed: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    };
  }

  const {
    extracted_latex,
    options,
    correct_option_key,
    explanation_latex,
    exam_type,
    subject_id,
    chapter_id,
    topic_id,
    difficulty,
    source_type,
    pyq_year,
    pyq_shift,
    pyq_provenance_status,
  } = parsed.data;

  const normalizedQuestion = normalizeLatexContent(extracted_latex);
  const normalizedOptions = options.map((opt) => ({
    ...opt,
    content_latex: normalizeLatexContent(opt.content_latex),
    is_correct: opt.option_key === correct_option_key,
  }));

  const validation = validateStagingItem(
    normalizedQuestion,
    normalizedOptions,
    correct_option_key,
    subject_id,
    chapter_id
  );

  const supabase = await createClient();

  const newStatus = validation.isValid ? "VALIDATED" : "NEEDS_REVIEW";

  const { error } = await supabase
    .from("ingestion_items")
    .update({
      extracted_latex: normalizedQuestion,
      options: normalizedOptions,
      correct_option_key,
      answer_status: validation.answerStatus,
      explanation_latex: explanation_latex ? normalizeLatexContent(explanation_latex) : null,
      exam_type,
      subject_id,
      chapter_id,
      topic_id: topic_id || null,
      difficulty,
      source_type,
      pyq_year: pyq_year || null,
      pyq_shift: pyq_shift || null,
      pyq_provenance_status,
      status: newStatus,
      validation_errors: validation.errors,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, status: newStatus };
}

/**
 * Approve Staging Item.
 */
export async function approveIngestionItemAction(itemId: string) {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { data: item, error: fetchErr } = await supabase
    .from("ingestion_items")
    .select("extracted_latex, options, correct_option_key, subject_id, chapter_id")
    .eq("id", itemId)
    .single();

  if (fetchErr || !item) {
    return { success: false, error: "Item not found." };
  }

  const validation = validateStagingItem(
    item.extracted_latex,
    item.options,
    item.correct_option_key,
    item.subject_id,
    item.chapter_id
  );

  if (!validation.isValid) {
    return {
      success: false,
      error: `Cannot approve item: ${validation.errors.join("; ")}`,
    };
  }

  const { error } = await supabase
    .from("ingestion_items")
    .update({
      status: "APPROVED",
      pyq_provenance_status: "VERIFIED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Reject Staging Item.
 */
export async function rejectIngestionItemAction(itemId: string) {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("ingestion_items")
    .update({
      status: "REJECTED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Import Approved Items from Ingestion Batch into Authoritative Question Bank.
 */
export async function importApprovedBatchQuestionsAction(batchId: string) {
  const session = await requireRole(["TEACHER", "ADMIN"]);
  const userId = session.user.id;
  const supabase = await createClient();

  // Fetch approved items
  const { data: approvedItems, error: itemsErr } = await supabase
    .from("ingestion_items")
    .select("*")
    .eq("batch_id", batchId)
    .eq("status", "APPROVED");

  if (itemsErr || !approvedItems || approvedItems.length === 0) {
    return { success: false, error: "No approved items found to import in this batch." };
  }

  let importedCount = 0;

  for (const item of approvedItems) {
    // 1. Insert into questions table
    const { data: newQ, error: qErr } = await supabase
      .from("questions")
      .insert({
        subject_id: item.subject_id,
        chapter_id: item.chapter_id,
        topic_id: item.topic_id || null,
        exam_type: item.exam_type,
        question_type: "SINGLE_MCQ",
        difficulty: item.difficulty,
        content_latex: item.extracted_latex,
        explanation_latex: item.explanation_latex,
        source_type: item.source_type,
        pyq_year: item.pyq_year,
        pyq_shift: item.pyq_shift,
        source_reference: `Batch: ${batchId}, Ref: ${item.source_location_ref || ""}`,
        status: "APPROVED",
        is_active: true,
        created_by: userId,
        ingestion_batch_id: batchId,
        ingestion_item_id: item.id,
      })
      .select("id")
      .single();

    if (qErr || !newQ) {
      console.error(`Failed to import item ${item.id}:`, qErr);
      continue;
    }

    // 2. Insert 4 options
    const optionsPayload = (item.options || []).map((opt: any, idx: number) => ({
      question_id: newQ.id,
      option_key: opt.option_key,
      content_latex: opt.content_latex,
      is_correct: opt.is_correct || opt.option_key === item.correct_option_key,
      order_index: idx + 1,
    }));

    await supabase.from("question_options").insert(optionsPayload);

    // 3. Mark staging item as IMPORTED
    await supabase
      .from("ingestion_items")
      .update({
        status: "IMPORTED",
        imported_question_id: newQ.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    importedCount++;
  }

  // Update batch status to COMPLETED
  await supabase
    .from("ingestion_batches")
    .update({
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  revalidatePath("/admin/questions");
  revalidatePath("/admin/ingestion");
  revalidatePath(`/admin/ingestion/${batchId}`);

  return { success: true, importedCount };
}
