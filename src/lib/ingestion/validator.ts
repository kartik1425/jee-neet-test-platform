import { StagingOptionItem, AnswerStatus } from "@/types/ingestion";
import { validateLatexSyntax } from "./latexNormalizer";

export interface StagingValidationResult {
  isValid: boolean;
  errors: string[];
  answerStatus: AnswerStatus;
  suggestedStatus: "VALIDATED" | "NEEDS_REVIEW" | "DUPLICATE";
}

export function validateStagingItem(
  questionLatex: string,
  options: StagingOptionItem[],
  correctKey?: "A" | "B" | "C" | "D" | null,
  subjectId?: string | null,
  chapterId?: string | null
): StagingValidationResult {
  const errors: string[] = [];
  let answerStatus: AnswerStatus = "UNVERIFIED";

  // 1. Validate Question Body
  if (!questionLatex || questionLatex.trim().length < 3) {
    errors.push("Question content must be at least 3 characters.");
  } else {
    const syntaxCheck = validateLatexSyntax(questionLatex);
    if (!syntaxCheck.isValid) {
      errors.push(`Question LaTeX: ${syntaxCheck.error}`);
    }
  }

  // 2. Validate Exactly 4 Options
  if (!options || options.length !== 4) {
    errors.push("MCQ must contain exactly 4 options (A, B, C, D).");
  } else {
    const expectedKeys = ["A", "B", "C", "D"];
    options.forEach((opt, idx) => {
      const expectedKey = expectedKeys[idx];
      if (opt.option_key !== expectedKey) {
        errors.push(`Option ${idx + 1} has invalid key '${opt.option_key}'. Expected '${expectedKey}'.`);
      }
      if (!opt.content_latex || opt.content_latex.trim() === "") {
        errors.push(`Option ${expectedKey} content cannot be empty.`);
      } else {
        const optSyntax = validateLatexSyntax(opt.content_latex);
        if (!optSyntax.isValid) {
          errors.push(`Option ${expectedKey} LaTeX: ${optSyntax.error}`);
        }
      }
    });
  }

  // 3. Validate Answer Key
  const correctOptions = (options || []).filter((o) => o.is_correct);
  if (!correctKey && correctOptions.length === 0) {
    answerStatus = "MISSING";
    errors.push("No correct answer key is specified.");
  } else if (correctKey && correctOptions.length > 0 && correctOptions[0].option_key !== correctKey) {
    answerStatus = "CONFLICTING";
    errors.push(`Conflicting answer: Option marked correct is '${correctOptions[0].option_key}', but extracted key is '${correctKey}'.`);
  } else if (correctOptions.length > 1) {
    answerStatus = "CONFLICTING";
    errors.push(`Multiple options (${correctOptions.map((o) => o.option_key).join(", ")}) are marked as correct.`);
  } else {
    answerStatus = "VERIFIED";
  }

  // 4. Validate Taxonomy Mapping
  if (!subjectId || !chapterId) {
    errors.push("Subject and Chapter mapping required before final approval.");
  }

  const isValid = errors.length === 0;
  const suggestedStatus = isValid ? "VALIDATED" : "NEEDS_REVIEW";

  return {
    isValid,
    errors,
    answerStatus,
    suggestedStatus,
  };
}
