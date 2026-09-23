import {
  AIExtractedQuestion,
  AITaxonomySuggestion,
  AIDuplicateCheckResult,
} from "@/types/ai";
import { AITestBlueprint } from "@/types/aiTestGenerator";

export interface AIProvider {
  /**
   * Structure and normalize raw question text into KaTeX MCQ format.
   */
  normalizeAndExtractQuestion(
    rawText: string,
    context?: { examType?: string; defaultSubject?: string }
  ): Promise<AIExtractedQuestion>;

  /**
   * Multimodal extraction of questions, options (A,B,C,D), and LaTeX from an image or PDF.
   */
  extractQuestionsFromMedia(
    base64Data: string,
    mimeType: string,
    context?: { examType?: string; defaultSubject?: string }
  ): Promise<AIExtractedQuestion[]>;

  /**
   * Suggests standard taxonomy mapping (subject, chapter, topic, difficulty).
   */
  classifyTaxonomy(
    contentLatex: string,
    availableTaxonomy: { subjectName: string; chapterNames: string[] }[]
  ): Promise<AITaxonomySuggestion>;

  /**
   * Evaluates semantic duplicate similarity against candidate question bodies.
   */
  detectPotentialDuplicate(
    newQuestionText: string,
    existingCandidateTexts: { id: string; text: string }[]
  ): Promise<AIDuplicateCheckResult>;

  /**
   * Translates natural language teacher request into a strongly-typed test blueprint.
   */
  generateTestBlueprint(
    prompt: string,
    availableTaxonomy: { subjectName: string; chapterNames: string[] }[]
  ): Promise<AITestBlueprint>;

  /**
   * Generates a 6-section structured diagnostic report based on deterministic performance metrics.
   */
  generateDiagnosticReport(
    payload: import("@/types/diagnosticReport").DeterministicAnalyticsPayload
  ): Promise<import("@/types/diagnosticReport").AIDiagnosticReport>;

  /**
   * Classifies an individual mistake using structured JSON output and pedagogical rationale.
   */
  classifyMistake(
    input: import("@/types/mistakes").AIMistakeClassificationInput
  ): Promise<import("@/types/mistakes").AIMistakeClassificationOutput>;
}
