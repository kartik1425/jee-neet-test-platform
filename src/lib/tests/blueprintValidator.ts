import {
  AITestBlueprint,
  AITestBlueprintSchema,
  ValidatedTestBlueprint,
  ResolvedSubjectSpec,
} from "@/types/aiTestGenerator";
import { Subject, Chapter, Topic } from "@/types/database";

export interface DBTaxonomyContext {
  subjects: Subject[];
  chapters: (Chapter & { subject_id: string })[];
  topics?: (Topic & { chapter_id: string })[];
}

/**
 * Deterministically validates an AI-generated or teacher-provided blueprint
 * against real database curriculum taxonomy records.
 */
export function validateBlueprintAgainstTaxonomy(
  rawBlueprint: unknown,
  taxonomy: DBTaxonomyContext
): ValidatedTestBlueprint {
  const errors: string[] = [];
  const unrecognizedSubjects: string[] = [];
  const unrecognizedChapters: string[] = [];

  // 1. Zod Schema Validation
  const parseResult = AITestBlueprintSchema.safeParse(rawBlueprint);
  if (!parseResult.success) {
    const formattedIssues = parseResult.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return {
      blueprint: rawBlueprint as AITestBlueprint,
      resolved_subjects: [],
      total_questions: 0,
      unrecognized_subjects: [],
      unrecognized_chapters: [],
      is_valid: false,
      validation_errors: [`Blueprint Schema Validation Failed: ${formattedIssues}`],
    };
  }

  const blueprint = parseResult.data;

  // 2. Validate Sum of Question Counts
  const sumSubjectCounts = blueprint.subjects.reduce((sum, s) => sum + s.question_count, 0);
  if (sumSubjectCounts !== blueprint.total_questions) {
    errors.push(
      `Sum of subject question counts (${sumSubjectCounts}) does not match total requested questions (${blueprint.total_questions}).`
    );
  }

  // 3. Resolve Subject and Chapter Names against DB Records
  const resolvedSubjects: ResolvedSubjectSpec[] = [];

  for (const subSpec of blueprint.subjects) {
    const cleanSubName = subSpec.subject_name.trim().toLowerCase();

    // Match subject in DB
    const matchedSubject = taxonomy.subjects.find((s) => {
      const dbName = s.name.trim().toLowerCase();
      return dbName === cleanSubName || dbName.includes(cleanSubName) || cleanSubName.includes(dbName);
    });

    if (!matchedSubject) {
      unrecognizedSubjects.push(subSpec.subject_name);
      errors.push(`Subject "${subSpec.subject_name}" is not registered in the institutional curriculum taxonomy.`);
      continue;
    }

    const availableChapters = taxonomy.chapters.filter((c) => c.subject_id === matchedSubject.id);
    const resolvedChapterIds: string[] = [];
    const resolvedChapterNames: string[] = [];

    for (const chapName of subSpec.chapter_names) {
      const cleanChapName = chapName.trim().toLowerCase();

      const matchedChap = availableChapters.find((c) => {
        const dbChapName = c.name.trim().toLowerCase();
        return (
          dbChapName === cleanChapName ||
          dbChapName.includes(cleanChapName) ||
          cleanChapName.includes(dbChapName)
        );
      });

      if (matchedChap) {
        if (!resolvedChapterIds.includes(matchedChap.id)) {
          resolvedChapterIds.push(matchedChap.id);
          resolvedChapterNames.push(matchedChap.name);
        }
      } else {
        unrecognizedChapters.push(`${subSpec.subject_name}: ${chapName}`);
      }
    }

    // If no chapters matched specifically, use all chapters of this subject if available
    if (resolvedChapterIds.length === 0) {
      if (availableChapters.length > 0) {
        availableChapters.forEach((c) => {
          resolvedChapterIds.push(c.id);
          resolvedChapterNames.push(c.name);
        });
      } else {
        errors.push(`No valid curriculum chapters found for subject "${matchedSubject.name}".`);
      }
    }

    resolvedSubjects.push({
      subject_id: matchedSubject.id,
      subject_name: matchedSubject.name,
      question_count: subSpec.question_count,
      chapter_ids: resolvedChapterIds,
      chapter_names: resolvedChapterNames,
      topic_ids: [],
      topic_names: [],
      difficulty_distribution: {
        EASY: subSpec.difficulty_distribution.EASY ?? 0,
        MEDIUM: subSpec.difficulty_distribution.MEDIUM ?? 0,
        HARD: subSpec.difficulty_distribution.HARD ?? 0,
        ADVANCED: subSpec.difficulty_distribution.ADVANCED ?? 0,
      },
    });
  }

  // 4. Validate Year Constraints if specified
  if (
    blueprint.source_constraints.year_start &&
    blueprint.source_constraints.year_end &&
    blueprint.source_constraints.year_start > blueprint.source_constraints.year_end
  ) {
    errors.push(
      `Start year (${blueprint.source_constraints.year_start}) cannot be greater than end year (${blueprint.source_constraints.year_end}).`
    );
  }

  return {
    blueprint,
    resolved_subjects: resolvedSubjects,
    total_questions: blueprint.total_questions,
    unrecognized_subjects: unrecognizedSubjects,
    unrecognized_chapters: unrecognizedChapters,
    is_valid: errors.length === 0,
    validation_errors: errors,
  };
}
