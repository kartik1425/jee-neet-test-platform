import { AIProvider } from "./provider";
import {
  AIExtractedQuestion,
  AIExtractedQuestionSchema,
  AITaxonomySuggestion,
  AITaxonomySuggestionSchema,
  AIDuplicateCheckResult,
  AIDuplicateCheckSchema,
} from "@/types/ai";
import { normalizeLatexContent } from "../ingestion/latexNormalizer";

export const DEPRECATED_SHUTDOWN_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.0-pro",
  "gemini-pro",
];

export const CURRENT_PRODUCTION_GEMINI_MODEL = "gemini-3.5-flash";

export class GeminiAdapter implements AIProvider {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    const selectedModel = modelName || process.env.GEMINI_MODEL || CURRENT_PRODUCTION_GEMINI_MODEL;
    if (DEPRECATED_SHUTDOWN_MODELS.includes(selectedModel)) {
      throw new Error(
        `Configured Gemini model "${selectedModel}" is an explicitly shut-down model. Please use "${CURRENT_PRODUCTION_GEMINI_MODEL}" or a currently supported GA model.`
      );
    }
    this.modelName = selectedModel;
  }

  getModelName(): string {
    return this.modelName;
  }

  async normalizeAndExtractQuestion(
    rawText: string,
    context?: { examType?: string; defaultSubject?: string }
  ): Promise<AIExtractedQuestion> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const systemPrompt = `You are an expert AI parser for Indian competitive examinations (JEE Main, JEE Advanced, NEET).
Extract and structure the provided raw question text into clean JSON matching the required schema.
Requirements:
1. Question text and all 4 options (A, B, C, D) must contain valid mathematical KaTeX expressions enclosed in $...$ for inline or $$...$$ for display math.
2. Must produce exactly 4 options with keys "A", "B", "C", "D".
3. Identify the single correct option key ("A", "B", "C", or "D") from the text if provided.
4. Extract PYQ provenance (Exam type, Year, Shift) if present in the text. Do NOT fabricate years.
5. Suggest subject name, chapter name, and difficulty (EASY, MEDIUM, HARD, ADVANCED).
Return ONLY raw JSON.`;

    const userPrompt = `Context: Exam=${context?.examType || "JEE_MAIN"}, DefaultSubject=${context?.defaultSubject || "General"}
Raw Text to Parse:
"""
${rawText}
"""`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Empty response from Gemini API.");
    }

    const rawParsed = JSON.parse(candidateText);

    // Normalize LaTeX on output
    if (rawParsed.question_latex) {
      rawParsed.question_latex = normalizeLatexContent(rawParsed.question_latex);
    }
    if (Array.isArray(rawParsed.options)) {
      rawParsed.options = rawParsed.options.map((opt: any) => ({
        ...opt,
        content_latex: normalizeLatexContent(opt.content_latex || ""),
      }));
    }

    // Strict Zod validation
    return AIExtractedQuestionSchema.parse(rawParsed);
  }

  async extractQuestionsFromMedia(
    base64Data: string,
    mimeType: string,
    context?: { examType?: string; defaultSubject?: string }
  ): Promise<AIExtractedQuestion[]> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    // Clean base64 data if it contains a data URL prefix
    let cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
    // If input is raw string rather than standard base64 characters, convert to base64
    if (!cleanBase64.match(/^[A-Za-z0-9+/=\r\n]+$/)) {
      cleanBase64 = Buffer.from(cleanBase64, "binary").toString("base64");
    } else {
      cleanBase64 = cleanBase64.replace(/[\r\n]/g, "");
    }

    const systemPrompt = `You are an expert AI multimodal OCR parser for competitive examination papers (JEE Main, JEE Advanced, NEET, Physics, Chemistry, Mathematics, Biology).
Analyze the provided document (image or PDF) and extract ALL multiple-choice questions (MCQs) into a structured JSON array.
Requirements for each question:
1. "question_latex": Complete question statement with all mathematical, physical, and chemical formulas properly converted to KaTeX LaTeX enclosed in $...$ for inline or $$...$$ for display math.
2. "options": Array of EXACTLY 4 options with "option_key" ('A', 'B', 'C', 'D'), "content_latex" (with KaTeX formulas), and "is_correct" boolean.
3. "correct_option_key": 'A', 'B', 'C', or 'D'.
4. "explanation_latex": Step-by-step scientific solution or explanation with LaTeX.
5. "suggested_subject_name": 'Physics', 'Chemistry', 'Mathematics', or 'Biology'.
6. "suggested_chapter_name": Standard chapter name in Indian syllabus.
7. "difficulty": 'EASY', 'MEDIUM', 'HARD', or 'ADVANCED'.
8. "exam_type": '${context?.examType || "JEE_MAIN"}'.
9. "source_type": 'INSTITUTE'.

Return ONLY a JSON array of question objects: [ { ... }, { ... } ]`;

    const userPrompt = `Extract all MCQs from this uploaded media sheet. Context: Exam=${context?.examType || "JEE_MAIN"}, DefaultSubject=${context?.defaultSubject || "General"}.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: cleanBase64,
                  },
                },
                { text: `${systemPrompt}\n\n${userPrompt}` },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Multimodal API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Empty response from Gemini multimodal parser.");
    }

    let parsedList = JSON.parse(candidateText);
    if (!Array.isArray(parsedList)) {
      if (parsedList && typeof parsedList === "object" && (parsedList.questions || parsedList.items)) {
        parsedList = parsedList.questions || parsedList.items;
      } else if (parsedList && typeof parsedList === "object" && parsedList.question_latex) {
        parsedList = [parsedList];
      } else {
        parsedList = [];
      }
    }

    return parsedList.map((item: any) => {
      const qLatex = normalizeLatexContent(item.question_latex || item.content_latex || "");
      const expLatex = item.explanation_latex ? normalizeLatexContent(item.explanation_latex) : null;
      const opts = Array.isArray(item.options)
        ? item.options.map((opt: any, idx: number) => {
            const key = (opt.option_key || ["A", "B", "C", "D"][idx] || "A") as "A" | "B" | "C" | "D";
            return {
              option_key: key,
              content_latex: normalizeLatexContent(opt.content_latex || opt.text || ""),
              is_correct: Boolean(opt.is_correct || key === item.correct_option_key),
            };
          })
        : [
            { option_key: "A" as const, content_latex: "Option A", is_correct: true },
            { option_key: "B" as const, content_latex: "Option B", is_correct: false },
            { option_key: "C" as const, content_latex: "Option C", is_correct: false },
            { option_key: "D" as const, content_latex: "Option D", is_correct: false },
          ];

      return {
        question_latex: qLatex,
        options: opts,
        correct_option_key: (item.correct_option_key || "A") as "A" | "B" | "C" | "D",
        explanation_latex: expLatex,
        exam_type: (context?.examType as any) || item.exam_type || "JEE_MAIN",
        suggested_subject_name: item.suggested_subject_name || context?.defaultSubject || "Physics",
        suggested_chapter_name: item.suggested_chapter_name || "General Mechanics",
        suggested_topic_name: item.suggested_topic_name || null,
        difficulty: item.difficulty || "MEDIUM",
        source_type: "INSTITUTE" as const,
        concept_tags: item.concept_tags || [],
        confidence: 0.95,
      };
    });
  }

  async classifyTaxonomy(
    contentLatex: string,
    availableTaxonomy: { subjectName: string; chapterNames: string[] }[]
  ): Promise<AITaxonomySuggestion> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const prompt = `Classify this question into the most appropriate subject and chapter from the available list.
Available Taxonomy:
${JSON.stringify(availableTaxonomy, null, 2)}

Question:
"""
${contentLatex}
"""

Return JSON with fields: { "subject_name": string, "chapter_name": string, "topic_name": string | null, "confidence": number }`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      }
    );

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const rawParsed = JSON.parse(candidateText || "{}");
    return AITaxonomySuggestionSchema.parse(rawParsed);
  }

  async detectPotentialDuplicate(
    newQuestionText: string,
    existingCandidateTexts: { id: string; text: string }[]
  ): Promise<AIDuplicateCheckResult> {
    if (!this.apiKey || existingCandidateTexts.length === 0) {
      return { is_duplicate: false, similarity_score: 0 };
    }

    const prompt = `Compare this new question against existing candidate questions to detect semantic duplication.
New Question:
"""
${newQuestionText}
"""

Candidates:
${JSON.stringify(existingCandidateTexts.slice(0, 10), null, 2)}

Return JSON: { "is_duplicate": boolean, "similarity_score": number (0 to 1), "matched_question_id": string | null, "reason": string }`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      }
    );

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const rawParsed = JSON.parse(candidateText || "{}");
    return AIDuplicateCheckSchema.parse(rawParsed);
  }

  async generateTestBlueprint(
    prompt: string,
    availableTaxonomy: { subjectName: string; chapterNames: string[] }[]
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const systemPrompt = `You are an expert exam designer for Indian competitive exams (JEE Main, JEE Advanced, NEET).
Your task is to interpret a teacher's natural language test requirements and output a strictly structured Test Blueprint in JSON.
Available Institutional Curriculum Taxonomy:
${JSON.stringify(availableTaxonomy, null, 2)}

Requirements:
1. Map teacher requests strictly to the available subjects and chapters wherever possible.
2. If the user specifies "very difficult", "tough", or "high-thinking", assign high percentages to HARD and ADVANCED difficulty.
3. Ensure the sum of question_count across all subjects equals total_questions.
4. Set pyq_only=true if the user asks for PYQs, past questions, or previous years.
5. Return ONLY valid JSON conforming to the blueprint schema.`;

    const userPrompt = `Teacher Request:
"""
${prompt}
"""`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API blueprint error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Empty response from Gemini API for blueprint generation.");
    }

    const rawParsed = JSON.parse(candidateText);
    return rawParsed;
  }

  async generateDiagnosticReport(
    payload: import("@/types/diagnosticReport").DeterministicAnalyticsPayload
  ): Promise<import("@/types/diagnosticReport").AIDiagnosticReport> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const { AIDiagnosticReportSchema } = await import("@/types/diagnosticReport");

    const systemPrompt = `You are an expert diagnostic tutor and exam mentor for Indian competitive exams (JEE Main, JEE Advanced, NEET).
Your task is to analyze the student's test performance strictly based on the provided deterministic analytics payload.

CRITICAL INVARIANTS & GROUND RULES:
1. Ground all observations strictly in the provided data. DO NOT fabricate or hallucinate any numbers, scores, percentages, times, or question counts.
2. For chapters labeled with evidence_status="INSUFFICIENT_DATA", explicitly note that the data sample (< 2 questions) is insufficient to definitively diagnose a weakness.
3. For mistake analysis, provide pedagogical observations for the incorrect questions based on difficulty, marks lost, time spent, and selected vs correct options.
4. For time strategy, provide actionable feedback on pacing and stamina.
5. In the action plan, prioritize topics needing attention and recommend concrete, reasonable practice target question counts (5-50).
6. Return ONLY valid JSON matching the AIDiagnosticReport schema.`;

    const userPrompt = `Deterministic Analytics Payload:
"""
${JSON.stringify(payload, null, 2)}
"""`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API diagnostic report error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Empty response from Gemini API for diagnostic report.");
    }

    const rawParsed = JSON.parse(candidateText);
    return AIDiagnosticReportSchema.parse(rawParsed);
  }

  async classifyMistake(
    input: import("@/types/mistakes").AIMistakeClassificationInput
  ): Promise<import("@/types/mistakes").AIMistakeClassificationOutput> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const { AIMistakeClassificationOutputSchema } = await import("@/types/mistakes");

    const systemPrompt = `You are an expert diagnostic tutor and examiner for Indian competitive exams (JEE Main, JEE Advanced, NEET).
Your task is to analyze a student's incorrect or unattempted response and classify the root pedagogical mistake type into one of the 10 controlled categories:
- CONCEPTUAL_ERROR
- FORMULA_ERROR
- CALCULATION_ERROR
- MISREAD_QUESTION
- WRONG_ASSUMPTION
- TIME_PRESSURE
- CARELESS_ERROR
- GUESS
- UNABLE_TO_START
- UNKNOWN

GROUND RULES:
1. Ground observations strictly in the provided timing, option choices, and question difficulty.
2. Do NOT invent or assume arbitrary mental states unless supported by time or option choice.
3. Return ONLY valid JSON matching the schema with fields:
   { "mistake_type": string, "confidence": "HIGH" | "MEDIUM" | "LOW", "pedagogical_rationale": string }`;

    const userPrompt = `Question Context:
Subject: ${input.subject_name}
Chapter: ${input.chapter_name}
Topic: ${input.topic_name || "General"}
Difficulty: ${input.difficulty}
Time Spent: ${input.time_spent_seconds} seconds
Selected Option: Option ${input.selected_option_key || "None (Unattempted)"}
Correct Option: Option ${input.correct_option_key}
Marked For Review: ${input.is_marked_for_review}
Deterministic Signal: ${input.deterministic_hint || "None"}

Question Content:
"""
${input.question_latex}
"""

Options:
${JSON.stringify(input.options, null, 2)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API mistake classification error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Empty response from Gemini API for mistake classification.");
    }

    const rawParsed = JSON.parse(candidateText);
    return AIMistakeClassificationOutputSchema.parse(rawParsed);
  }
}
