import { DuplicateStatus } from "@/types/ingestion";

export interface DuplicateCheckItem {
  id: string;
  content_latex: string;
}

export interface DuplicateDetectionResult {
  status: DuplicateStatus;
  matchedQuestionId?: string | null;
  similarityScore: number;
  reason?: string;
}

/**
 * Strips whitespace, LaTeX wrappers, and punctuation for robust canonical comparison.
 */
export function canonicalizeQuestionText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/\$+/g, "")
    .replace(/\\(text|mathrm|mathbf|mathit)\{([^\}]+)\}/g, "$2")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Calculates token-level Jaccard similarity between two strings (0.0 to 1.0).
 */
export function calculateTokenSimilarity(textA: string, textB: string): number {
  const tokenize = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1)
    );
  };

  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection++;
  });

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : Math.round((intersection / union) * 100) / 100;
}

/**
 * Evaluates candidate question against a collection of existing questions.
 */
export function evaluateDuplicateCandidate(
  candidateText: string,
  existingQuestions: DuplicateCheckItem[]
): DuplicateDetectionResult {
  const canonCandidate = canonicalizeQuestionText(candidateText);
  if (!canonCandidate) {
    return { status: "NEW", similarityScore: 0, matchedQuestionId: null };
  }

  let highestScore = 0;
  let matchedId: string | null = null;
  let isExact = false;

  for (const item of existingQuestions) {
    const canonExisting = canonicalizeQuestionText(item.content_latex);

    // 1. Exact match
    if (canonCandidate === canonExisting) {
      return {
        status: "DUPLICATE",
        matchedQuestionId: item.id,
        similarityScore: 1.0,
        reason: "Exact character-normalized match with existing question.",
      };
    }

    // 2. Token similarity
    const sim = calculateTokenSimilarity(candidateText, item.content_latex);
    if (sim > highestScore) {
      highestScore = sim;
      matchedId = item.id;
    }
  }

  if (highestScore >= 0.85) {
    return {
      status: "DUPLICATE",
      matchedQuestionId: matchedId,
      similarityScore: highestScore,
      reason: `High semantic similarity (${Math.round(highestScore * 100)}%) with question ${matchedId}.`,
    };
  }

  if (highestScore >= 0.65) {
    return {
      status: "POSSIBLE_DUPLICATE",
      matchedQuestionId: matchedId,
      similarityScore: highestScore,
      reason: `Moderate similarity (${Math.round(highestScore * 100)}%) with question ${matchedId}. Review recommended.`,
    };
  }

  return {
    status: "NEW",
    similarityScore: highestScore,
    matchedQuestionId: null,
  };
}
