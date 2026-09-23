import { AIProvider } from "./provider";
import {
  AIExtractedQuestion,
  AITaxonomySuggestion,
  AIDuplicateCheckResult,
} from "@/types/ai";
import { normalizeLatexContent } from "../ingestion/latexNormalizer";

export class MockAIProvider implements AIProvider {
  async normalizeAndExtractQuestion(
    rawText: string,
    context?: { examType?: string; defaultSubject?: string }
  ): Promise<AIExtractedQuestion> {
    const cleanText = normalizeLatexContent(rawText);

    // Deterministic extraction based on heuristics
    const options = [
      { option_key: "A" as const, content_latex: "10 \\text{ m/s}^2", is_correct: true },
      { option_key: "B" as const, content_latex: "20 \\text{ m/s}^2", is_correct: false },
      { option_key: "C" as const, content_latex: "30 \\text{ m/s}^2", is_correct: false },
      { option_key: "D" as const, content_latex: "40 \\text{ m/s}^2", is_correct: false },
    ];

    let suggestedSubject = context?.defaultSubject || "Physics";
    let suggestedChapter = "Kinematics";

    const lower = cleanText.toLowerCase();
    if (lower.includes("torque") || lower.includes("moment of inertia") || lower.includes("rotat")) {
      suggestedSubject = "Physics";
      suggestedChapter = "Rotation";
    } else if (lower.includes("thermo") || lower.includes("entropy") || lower.includes("enthalpy")) {
      suggestedSubject = "Chemistry";
      suggestedChapter = "Thermodynamics";
    } else if (lower.includes("integral") || lower.includes("derivative") || lower.includes("matrix")) {
      suggestedSubject = "Mathematics";
      suggestedChapter = "Calculus";
    } else if (lower.includes("cell") || lower.includes("dna") || lower.includes("genetics")) {
      suggestedSubject = "Biology";
      suggestedChapter = "Genetics";
    }

    return {
      question_latex: cleanText || "Find the acceleration of the body in $\\text{m/s}^2$.",
      options,
      correct_option_key: "A",
      explanation_latex: "Using Newton's second law $\\vec{F} = m\\vec{a}$.",
      exam_type: (context?.examType as any) || "JEE_MAIN",
      suggested_subject_name: suggestedSubject,
      suggested_chapter_name: suggestedChapter,
      suggested_topic_name: null,
      difficulty: "MEDIUM",
      source_type: "PYQ",
      pyq_year: 2023,
      pyq_shift: "Shift 1",
      concept_tags: ["Newton's Laws", "Mechanics"],
      confidence: 0.95,
      source_page_number: 1,
      source_location_ref: "Page 1, Item 1",
    };
  }

  async extractQuestionsFromMedia(
    base64Data: string,
    mimeType: string,
    context?: { examType?: string; defaultSubject?: string }
  ): Promise<AIExtractedQuestion[]> {
    return [
      {
        question_latex: "An alternating current circuit contains an inductor $L = 20\\text{ mH}$ and capacitor $C = 50\\,\\mu\\text{F}$. The resonance angular frequency $\\omega_0$ of the circuit is:",
        options: [
          { option_key: "A", content_latex: "1000\\text{ rad/s}", is_correct: true },
          { option_key: "B", content_latex: "500\\text{ rad/s}", is_correct: false },
          { option_key: "C", content_latex: "2000\\text{ rad/s}", is_correct: false },
          { option_key: "D", content_latex: "250\\text{ rad/s}", is_correct: false },
        ],
        correct_option_key: "A",
        explanation_latex: "Resonance angular frequency $\\omega_0 = \\frac{1}{\\sqrt{LC}} = \\frac{1}{\\sqrt{20 \\times 10^{-3} \\times 50 \\times 10^{-6}}} = 1000\\text{ rad/s}$.",
        exam_type: (context?.examType as any) || "JEE_MAIN",
        suggested_subject_name: context?.defaultSubject || "Physics",
        suggested_chapter_name: "Electromagnetic Induction & AC",
        suggested_topic_name: "LC Oscillations & Resonance",
        difficulty: "MEDIUM",
        source_type: "INSTITUTE",
        concept_tags: ["Resonance", "AC Circuits"],
        confidence: 0.96,
      },
    ];
  }

  async classifyTaxonomy(
    contentLatex: string,
    availableTaxonomy: { subjectName: string; chapterNames: string[] }[]
  ): Promise<AITaxonomySuggestion> {
    const firstSubject = availableTaxonomy[0]?.subjectName || "Physics";
    const firstChapter = availableTaxonomy[0]?.chapterNames[0] || "Kinematics";

    return {
      subject_name: firstSubject,
      chapter_name: firstChapter,
      topic_name: null,
      confidence: 0.92,
    };
  }

  async detectPotentialDuplicate(
    newQuestionText: string,
    existingCandidateTexts: { id: string; text: string }[]
  ): Promise<AIDuplicateCheckResult> {
    const cleanNew = newQuestionText.toLowerCase().replace(/[^a-z0-9]/g, "");

    for (const cand of existingCandidateTexts) {
      const cleanCand = cand.text.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanNew === cleanCand) {
        return {
          is_duplicate: true,
          similarity_score: 1.0,
          matched_question_id: cand.id,
          reason: "Exact text match detected.",
        };
      }
    }

    return {
      is_duplicate: false,
      similarity_score: 0.1,
    };
  }

  async generateTestBlueprint(
    prompt: string,
    availableTaxonomy: { subjectName: string; chapterNames: string[] }[]
  ): Promise<any> {
    const lower = prompt.toLowerCase();

    // 1. Detect Exam Type
    let examType: "JEE_MAIN" | "JEE_ADV" | "NEET" | "GENERIC" = "JEE_MAIN";
    if (lower.includes("adv") || lower.includes("advanced")) {
      examType = "JEE_ADV";
    } else if (lower.includes("neet")) {
      examType = "NEET";
    }

    // 2. Detect Total Question Count
    const countMatch = lower.match(/(\d+)\s*[-–]?\s*(?:questions?|qs|items?|problems?)\b/i);
    let totalQuestions = countMatch ? parseInt(countMatch[1], 10) : 30;

    // 3. Detect PYQ Only & Year Constraints
    const pyqOnly = lower.includes("pyq") || lower.includes("previous year");
    const yearMatch = lower.match(/(20\d{2})\s*(?:to|-|–)\s*(20\d{2})/i);
    const startYear = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
    const endYear = yearMatch ? parseInt(yearMatch[2], 10) : undefined;

    // 4. Detect Difficulty Distribution
    let difficultyDist = { EASY: 20, MEDIUM: 50, HARD: 30, ADVANCED: 0 };
    if (lower.includes("very difficult") || lower.includes("tough") || lower.includes("high thinking")) {
      difficultyDist = { EASY: 0, MEDIUM: 20, HARD: 40, ADVANCED: 40 };
    } else if (lower.includes("hard") || lower.includes("difficult")) {
      difficultyDist = { EASY: 10, MEDIUM: 30, HARD: 40, ADVANCED: 20 };
    } else if (lower.includes("easy")) {
      difficultyDist = { EASY: 60, MEDIUM: 30, HARD: 10, ADVANCED: 0 };
    }

    // 5. Detect Subject Allocation
    const detectedSubjects: string[] = [];
    for (const tax of availableTaxonomy) {
      if (lower.includes(tax.subjectName.toLowerCase())) {
        detectedSubjects.push(tax.subjectName);
      }
    }

    // Fallback if no specific subjects detected
    const activeSubjects = detectedSubjects.length > 0
      ? detectedSubjects
      : [availableTaxonomy[0]?.subjectName || "Physics"];

    const baseCount = Math.floor(totalQuestions / activeSubjects.length);
    let remainder = totalQuestions % activeSubjects.length;

    const subjectsSpec = activeSubjects.map((subName) => {
      const qCount = baseCount + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      const taxEntry = availableTaxonomy.find((t) => t.subjectName === subName);
      const matchedChapters: string[] = [];

      if (taxEntry) {
        for (const ch of taxEntry.chapterNames) {
          if (lower.includes(ch.toLowerCase())) {
            matchedChapters.push(ch);
          }
        }
      }

      return {
        subject_name: subName,
        question_count: qCount,
        chapter_names: matchedChapters.length > 0 ? matchedChapters : (taxEntry?.chapterNames.slice(0, 3) || ["General"]),
        topic_names: [],
        difficulty_distribution: difficultyDist,
      };
    });

    return {
      title: `${examType.replace("_", " ")} Practice Paper`,
      description: `AI-generated test blueprint based on: "${prompt.slice(0, 100)}"`,
      instructions: "Standard Indian competitive exam format. Negative marking applies.",
      exam_type: examType,
      duration_minutes: totalQuestions <= 30 ? 60 : totalQuestions <= 60 ? 120 : 180,
      total_questions: totalQuestions,
      marking_scheme: {
        correct: 4,
        incorrect: -1,
        unattempted: 0,
      },
      subjects: subjectsSpec,
      source_constraints: {
        pyq_only: pyqOnly,
        year_start: startYear,
        year_end: endYear,
        exclude_recent_test_count: 2,
      },
      pedagogical_focus: lower.includes("conceptual") ? ["conceptual", "multi-step"] : ["standard"],
    };
  }

  async generateDiagnosticReport(
    payload: import("@/types/diagnosticReport").DeterministicAnalyticsPayload
  ): Promise<import("@/types/diagnosticReport").AIDiagnosticReport> {
    // 1. Executive Summary
    const strongSubjects = payload.subject_metrics
      .filter((s) => s.accuracy >= 70)
      .map((s) => s.subject_name);
    const weakSubjects = payload.subject_metrics
      .filter((s) => s.accuracy < 50)
      .map((s) => s.subject_name);

    const strengthsSummary = strongSubjects.length > 0
      ? `Strong performance demonstrated in ${strongSubjects.join(", ")}, with solid concept retention and accurate execution under timed conditions.`
      : "Consistent attempt engagement across the paper, showing good familiarity with standard question types.";

    const weaknessesSummary = weakSubjects.length > 0
      ? `Identified performance dips in ${weakSubjects.join(", ")}, particularly in chapters requiring multi-step analytical deductions.`
      : "Overall accuracy can be improved by reducing unforced calculation errors and optimizing question selection strategy.";

    const overallInterpretation = `Student achieved ${payload.total_score}/${payload.max_score} (${payload.accuracy_percentage}% accuracy) across ${payload.total_attempted} attempted questions in ${payload.test_title}. Time spent was ${Math.round(payload.time_spent_seconds / 60)} minutes out of ${payload.duration_minutes} minutes allocated. Focus on eliminating negative marks to boost percentile standing.`;

    // 2. Subject Commentary
    const subjectAnalysis = payload.subject_metrics.map((s) => {
      let commentary = `Attempted ${s.attempted}/${s.attempted + s.unattempted} questions with ${s.accuracy}% accuracy. `;
      let standing = "Moderate";
      if (s.accuracy >= 75) {
        commentary += "Exhibits solid command over high-yield concepts with minimal negative marking.";
        standing = "Strong";
      } else if (s.accuracy < 50) {
        commentary += "Requires structured revision and targeted problem solving to build confidence and eliminate recurring traps.";
        standing = "Needs Improvement";
      } else {
        commentary += "Demonstrates adequate foundation, but consistency across moderate and difficult questions needs reinforcement.";
        standing = "Satisfactory";
      }
      return {
        subject_name: s.subject_name,
        commentary,
        relative_standing: standing,
      };
    });

    // 3. Chapter Analysis
    const chapterAnalysis = payload.chapter_metrics.map((c) => {
      let rationale = "";
      let confidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";

      if (c.evidence_status === "INSUFFICIENT_DATA") {
        rationale = `Only ${c.total_questions} question(s) tested. Insufficient data points to definitively confirm mastery or deficit. Additional chapter-specific drills recommended.`;
        confidence = "LOW";
      } else if (c.evidence_status === "NEEDS_ATTENTION") {
        rationale = `Attempted ${c.attempted} questions with low accuracy (${c.accuracy}%). Indicates conceptual gaps or calculation slip-ups in this chapter.`;
        confidence = c.attempted >= 3 ? "HIGH" : "MEDIUM";
      } else {
        rationale = `High accuracy (${c.accuracy}%) over ${c.attempted} attempted questions. Consistent topic grasp and reliable speed.`;
        confidence = "HIGH";
      }

      return {
        chapter_name: c.chapter_name,
        status: c.evidence_status,
        diagnostic_rationale: rationale,
        confidence,
      };
    });

    // 4. Mistake Analysis
    const mistakeAnalysis = payload.incorrect_questions.map((iq) => {
      let category: "CONCEPTUAL" | "CALCULATION" | "MISREAD" | "TIME_PRESSURE" | "UNKNOWN" = "CONCEPTUAL";
      let obs = "";

      if (iq.time_spent_seconds > 180) {
        category = "CALCULATION";
        obs = `Spent ${Math.round(iq.time_spent_seconds)}s before choosing Option ${iq.selected_option_key || "?"} instead of ${iq.correct_option_key}. Suggests an algebraic or sign error in the final simplification stages.`;
      } else if (iq.time_spent_seconds < 30) {
        category = "MISREAD";
        obs = `Quick selection within ${iq.time_spent_seconds}s suggests rushed reading or misinterpreting standard units/conditions.`;
      } else if (iq.marked_for_review) {
        category = "CONCEPTUAL";
        obs = `Marked for review and spent ${iq.time_spent_seconds}s. Indecision between remaining options indicates subtle conceptual ambiguity.`;
      } else {
        category = "CONCEPTUAL";
        obs = `Selected Option ${iq.selected_option_key || "?"} instead of correct Option ${iq.correct_option_key}. Review foundational formula derivations for ${iq.chapter_name}.`;
      }

      return {
        question_id: iq.question_id,
        likely_category: category,
        observation: obs,
        confidence: "MEDIUM" as const,
      };
    });

    // 5. Time Strategy
    const timeEfficiency = payload.time_metrics.avg_time_per_question_seconds < 120
      ? "Good pacing speed, maintaining reasonable buffer for review."
      : "Relatively deliberate pacing; consider skipping lengthy multi-step problems in round 1.";

    const pacingCommentary = `Average time spent on correct questions was ${payload.time_metrics.avg_time_correct_seconds}s versus ${payload.time_metrics.avg_time_incorrect_seconds}s on incorrect attempts. Total exam time utilized was ${Math.round(payload.time_spent_seconds / 60)} minutes.`;

    const staminaInsight =
      payload.time_metrics.late_exam_accuracy !== null && payload.time_metrics.late_exam_accuracy !== undefined
        ? `Late-exam accuracy in the final 20% of the paper was ${payload.time_metrics.late_exam_accuracy}%. ${payload.time_metrics.late_exam_accuracy < 50 ? "Sign of cognitive fatigue toward the end of the paper." : "Maintained strong stamina through the end of the test."}`
        : "Consistent speed maintained across questions.";

    // 6. Action Plan
    const actionPlanItems: any[] = [];
    const weakChapters = payload.chapter_metrics
      .filter((c) => c.evidence_status === "NEEDS_ATTENTION")
      .sort((a, b) => a.accuracy - b.accuracy);

    let priority = 1;
    for (const wc of weakChapters.slice(0, 3)) {
      actionPlanItems.push({
        priority: priority++,
        topic_name: wc.chapter_name,
        reason: `Accuracy was ${wc.accuracy}% across ${wc.attempted} attempts with ${wc.incorrect} incorrect response(s).`,
        recommended_action: `Review high-yield theory notes and solve 20-30 graded PYQ problems focusing on core formulas.`,
        target_practice_questions: 25,
      });
    }

    if (actionPlanItems.length === 0) {
      // If no weak chapters, suggest high-level maintenance plan
      const topSubject = payload.subject_metrics[0]?.subject_name || "General";
      actionPlanItems.push({
        priority: 1,
        topic_name: `${topSubject} Advanced Drills`,
        reason: "Maintain high percentile standing and refine speed on tricky multi-concept questions.",
        recommended_action: "Practice full-length timed sectional tests and analyze speed traps.",
        target_practice_questions: 30,
      });
    }

    return {
      report_version: "v1.0.0",
      summary: {
        strengths_summary: strengthsSummary,
        weaknesses_summary: weaknessesSummary,
        overall_interpretation: overallInterpretation,
      },
      subject_analysis: subjectAnalysis,
      chapter_analysis: chapterAnalysis,
      mistake_analysis: mistakeAnalysis,
      time_strategy: {
        pacing_commentary: pacingCommentary,
        time_management_efficiency: timeEfficiency,
        stamina_insight: staminaInsight,
      },
      action_plan: actionPlanItems,
    };
  }

  async classifyMistake(
    input: import("@/types/mistakes").AIMistakeClassificationInput
  ): Promise<import("@/types/mistakes").AIMistakeClassificationOutput> {
    const { time_spent_seconds, selected_option_key, is_marked_for_review, difficulty } = input;

    if (selected_option_key === null || selected_option_key === undefined) {
      return {
        mistake_type: "UNABLE_TO_START",
        confidence: "HIGH",
        pedagogical_rationale: "Question left unattempted without selection.",
      };
    }

    if (time_spent_seconds > 180) {
      return {
        mistake_type: "CALCULATION_ERROR",
        confidence: "MEDIUM",
        pedagogical_rationale: `Spent ${time_spent_seconds}s before choosing distractor Option ${selected_option_key}. Suggests an arithmetic or algebraic sign error during multi-step execution.`,
      };
    }

    if (time_spent_seconds <= 20) {
      return {
        mistake_type: "TIME_PRESSURE",
        confidence: "MEDIUM",
        pedagogical_rationale: `Rapid incorrect choice in ${time_spent_seconds}s indicates rushed pacing or hasty elimination.`,
      };
    }

    if (is_marked_for_review) {
      return {
        mistake_type: "CARELESS_ERROR",
        confidence: "LOW",
        pedagogical_rationale: "Flagged for review with hesitation; possible oversight or second-guessing.",
      };
    }

    if (time_spent_seconds <= 40) {
      return {
        mistake_type: "MISREAD_QUESTION",
        confidence: "LOW",
        pedagogical_rationale: "Quick answer selection suggests possible misreading of the question constraint or unit system.",
      };
    }

    return {
      mistake_type: "CONCEPTUAL_ERROR",
      confidence: "HIGH",
      pedagogical_rationale: `Selected Option ${selected_option_key} instead of correct Option ${input.correct_option_key}. Indicates conceptual ambiguity regarding core principles in ${input.chapter_name}.`,
    };
  }
}
