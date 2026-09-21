import {
  MistakeCategory,
  MISTAKE_CATEGORIES,
  PersistentMistakeRecord,
  TopicMistakeMatrixItem,
  RecurringMistakePattern,
  StudentMistakeSummary,
  TrendStatus,
  ResolutionStatus,
} from "@/types/mistakes";

export interface AggregationOptions {
  /**
   * Minimum occurrences of a mistake type in a chapter across tests to be flagged as recurring.
   * Default: 3
   */
  recurringThreshold?: number;

  /**
   * Minimum accuracy % on subsequent attempts to consider a pattern improving.
   * Default: 70
   */
  improvingAccuracyThreshold?: number;

  /**
   * Minimum accuracy % on subsequent attempts to consider a pattern resolved.
   * Default: 80
   */
  resolvedAccuracyThreshold?: number;
}

/**
 * Calculates longitudinal mistake aggregations, Topic + Error Taxonomy matrix,
 * recurring mistake patterns, and deterministic trend/resolution states.
 */
export function aggregateStudentMistakes(
  mistakes: PersistentMistakeRecord[],
  studentId: string,
  options: AggregationOptions = {}
): StudentMistakeSummary {
  const recurringThreshold = options.recurringThreshold ?? 3;

  // Initialize category distribution
  const categoryDistribution: Record<MistakeCategory, number> = {} as any;
  for (const cat of MISTAKE_CATEGORIES) {
    categoryDistribution[cat] = 0;
  }

  let suggestedCount = 0;
  let confirmedCount = 0;

  // 1. Topic + Mistake Matrix Mapping
  const matrixMap = new Map<string, TopicMistakeMatrixItem>();

  // 2. Grouping for Recurring Pattern Detection: Key = `chapter_name || mistake_type`
  const patternMap = new Map<
    string,
    {
      subject_name: string;
      chapter_name: string;
      topic_name?: string | null;
      mistake_type: MistakeCategory;
      occurrences: PersistentMistakeRecord[];
      test_ids: Set<string>;
    }
  >();

  for (const m of mistakes) {
    // Count categories
    if (categoryDistribution[m.mistake_type] !== undefined) {
      categoryDistribution[m.mistake_type]++;
    } else {
      categoryDistribution[m.mistake_type] = 1;
    }

    if (m.classification_status === "CONFIRMED") {
      confirmedCount++;
    } else if (m.classification_status === "SUGGESTED") {
      suggestedCount++;
    }

    const subjName = (m as any).subject?.name || (m as any).subject_name || "General";
    const chapName = (m as any).chapter?.name || (m as any).chapter_name || "General Chapter";
    const topName = (m as any).topic?.name || (m as any).topic_name || null;
    const subjId = m.subject_id || "general-sub";
    const chapId = m.chapter_id || "general-chap";
    const topId = m.topic_id || null;

    // Matrix key
    const matrixKey = `${subjId}:${chapId}:${topId || "none"}`;
    let matrixItem = matrixMap.get(matrixKey);
    if (!matrixItem) {
      const initialCounts: Record<MistakeCategory, number> = {} as any;
      for (const cat of MISTAKE_CATEGORIES) {
        initialCounts[cat] = 0;
      }
      matrixItem = {
        subject_id: subjId,
        subject_name: subjName,
        chapter_id: chapId,
        chapter_name: chapName,
        topic_id: topId,
        topic_name: topName,
        total_mistakes: 0,
        category_counts: initialCounts,
      };
      matrixMap.set(matrixKey, matrixItem);
    }
    matrixItem.total_mistakes++;
    if (matrixItem.category_counts[m.mistake_type] !== undefined) {
      matrixItem.category_counts[m.mistake_type]++;
    }

    // Pattern key: Subject + Chapter + MistakeType
    const patternKey = `${chapName}:${m.mistake_type}`;
    let patternGroup = patternMap.get(patternKey);
    if (!patternGroup) {
      patternGroup = {
        subject_name: subjName,
        chapter_name: chapName,
        topic_name: topName,
        mistake_type: m.mistake_type,
        occurrences: [],
        test_ids: new Set<string>(),
      };
      patternMap.set(patternKey, patternGroup);
    }
    patternGroup.occurrences.push(m);
    if (m.test_id) {
      patternGroup.test_ids.add(m.test_id);
    }
  }

  // 3. Compute Recurring Patterns & Deterministic Trends
  const recurringPatterns: RecurringMistakePattern[] = [];
  let recurringCount = 0;
  let improvingCount = 0;
  let resolvedCount = 0;

  for (const [key, group] of patternMap.entries()) {
    const totalOccurrences = group.occurrences.length;
    const testsAffected = group.test_ids.size;

    // Sort by created_at ascending
    const sorted = [...group.occurrences].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const lastOccurredAt = sorted[sorted.length - 1]?.created_at || new Date().toISOString();

    // Check if recurring threshold is reached
    const isRecurring = totalOccurrences >= recurringThreshold && testsAffected >= 2;

    // Determine deterministic trend
    let trend: TrendStatus = "INSUFFICIENT_DATA";
    let resolution: ResolutionStatus = "OPEN";

    // Check resolution states of individual records
    const hasResolvedRecords = sorted.some((o) => o.resolution_status === "RESOLVED");
    const hasImprovingRecords = sorted.some((o) => o.resolution_status === "IMPROVING");

    if (totalOccurrences < 2) {
      trend = "INSUFFICIENT_DATA";
      resolution = "OPEN";
    } else if (hasResolvedRecords) {
      trend = "IMPROVING";
      resolution = "RESOLVED";
      resolvedCount++;
    } else if (hasImprovingRecords) {
      trend = "IMPROVING";
      resolution = "IMPROVING";
      improvingCount++;
    } else if (isRecurring) {
      // If recurring across multiple tests without resolution
      trend = totalOccurrences >= 5 ? "WORSENING" : "STABLE";
      resolution = "OPEN";
      recurringCount++;
    } else {
      trend = "STABLE";
      resolution = "OPEN";
    }

    recurringPatterns.push({
      id: `pattern-${group.chapter_name}-${group.mistake_type}`.replace(/\s+/g, "_"),
      student_id: studentId,
      subject_name: group.subject_name,
      chapter_name: group.chapter_name,
      topic_name: group.topic_name,
      mistake_type: group.mistake_type,
      total_occurrences: totalOccurrences,
      tests_affected_count: testsAffected,
      last_occurred_at: lastOccurredAt,
      trend,
      resolution_status: resolution,
      is_recurring: isRecurring,
    });
  }

  // Sort patterns: recurring first, then by total occurrences descending
  recurringPatterns.sort((a, b) => {
    if (a.is_recurring !== b.is_recurring) {
      return a.is_recurring ? -1 : 1;
    }
    return b.total_occurrences - a.total_occurrences;
  });

  const matrixList = Array.from(matrixMap.values()).sort(
    (a, b) => b.total_mistakes - a.total_mistakes
  );

  return {
    student_id: studentId,
    total_mistakes: mistakes.length,
    suggested_count: suggestedCount,
    confirmed_count: confirmedCount,
    recurring_patterns_count: recurringCount,
    improving_patterns_count: improvingCount,
    resolved_patterns_count: resolvedCount,
    category_distribution: categoryDistribution,
    matrix: matrixList,
    recurring_patterns: recurringPatterns,
  };
}
