import { normalizeLatexContent } from "./latexNormalizer";
import { StagingOptionItem } from "@/types/ingestion";

export interface ParsedRawQuestionItem {
  order_index: number;
  raw_content: string;
  source_page_number?: number | null;
  source_location_ref?: string | null;
  question_text: string;
  options: StagingOptionItem[];
  correct_option_key?: "A" | "B" | "C" | "D" | null;
  explanation_text?: string | null;
  exam_type?: string | null;
  suggested_subject_name?: string | null;
  suggested_chapter_name?: string | null;
  suggested_topic_name?: string | null;
  difficulty?: string | null;
  pyq_year?: number | null;
  pyq_shift?: string | null;
}

/**
 * Parses CSV question documents with flexible column mapping.
 */
export function parseCsvQuestionDocument(csvText: string): ParsedRawQuestionItem[] {
  if (!csvText || csvText.trim() === "") return [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ""));

  const getColIndex = (aliases: string[]) => {
    return headers.findIndex((h) => aliases.includes(h));
  };

  const qIdx = getColIndex(["question", "questiontext", "content", "problem", "body"]);
  const optAIdx = getColIndex(["optiona", "option1", "opta", "a"]);
  const optBIdx = getColIndex(["optionb", "option2", "optb", "b"]);
  const optCIdx = getColIndex(["optionc", "option3", "optc", "c"]);
  const optDIdx = getColIndex(["optiond", "option4", "optd", "d"]);
  const ansIdx = getColIndex(["correctanswer", "answer", "correctoption", "key", "ans"]);
  const solIdx = getColIndex(["solution", "explanation", "exp", "sol"]);
  const examIdx = getColIndex(["exam", "examtype"]);
  const yearIdx = getColIndex(["year", "pyqyear"]);
  const shiftIdx = getColIndex(["shift", "session", "pyqshift"]);
  const subjIdx = getColIndex(["subject", "subjectname"]);
  const chapIdx = getColIndex(["chapter", "chaptername"]);
  const topicIdx = getColIndex(["topic", "topicname"]);
  const diffIdx = getColIndex(["difficulty", "level"]);

  const results: ParsedRawQuestionItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (row.length === 0 || !row[qIdx]?.trim()) continue;

    const rawContent = lines[i];
    const questionText = normalizeLatexContent(row[qIdx] || "");

    const normalizeKey = (val: string): "A" | "B" | "C" | "D" | null => {
      const clean = (val || "").trim().toUpperCase();
      if (clean === "A" || clean === "1") return "A";
      if (clean === "B" || clean === "2") return "B";
      if (clean === "C" || clean === "3") return "C";
      if (clean === "D" || clean === "4") return "D";
      return null;
    };

    const correctKey = ansIdx !== -1 ? normalizeKey(row[ansIdx]) : null;

    const optA = normalizeLatexContent(optAIdx !== -1 ? row[optAIdx] : "");
    const optB = normalizeLatexContent(optBIdx !== -1 ? row[optBIdx] : "");
    const optC = normalizeLatexContent(optCIdx !== -1 ? row[optCIdx] : "");
    const optD = normalizeLatexContent(optDIdx !== -1 ? row[optDIdx] : "");

    const options: StagingOptionItem[] = [
      { option_key: "A", content_latex: optA, is_correct: correctKey === "A" },
      { option_key: "B", content_latex: optB, is_correct: correctKey === "B" },
      { option_key: "C", content_latex: optC, is_correct: correctKey === "C" },
      { option_key: "D", content_latex: optD, is_correct: correctKey === "D" },
    ];

    const yearVal = yearIdx !== -1 ? parseInt(row[yearIdx], 10) : null;

    results.push({
      order_index: i,
      raw_content: rawContent,
      source_location_ref: `Row ${i + 1}`,
      question_text: questionText,
      options,
      correct_option_key: correctKey,
      explanation_text: solIdx !== -1 ? normalizeLatexContent(row[solIdx] || "") : null,
      exam_type: examIdx !== -1 ? row[examIdx]?.toUpperCase() : null,
      suggested_subject_name: subjIdx !== -1 ? row[subjIdx] : null,
      suggested_chapter_name: chapIdx !== -1 ? row[chapIdx] : null,
      suggested_topic_name: topicIdx !== -1 ? row[topicIdx] : null,
      difficulty: diffIdx !== -1 ? row[diffIdx]?.toUpperCase() : null,
      pyq_year: !isNaN(yearVal as number) ? yearVal : null,
      pyq_shift: shiftIdx !== -1 ? row[shiftIdx] : null,
    });
  }

  return results;
}

/**
 * Standard CSV line parser handling quotes, escaped quotes, and commas.
 */
function parseCsvRow(rowStr: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    const nextChar = rowStr[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses free-text question material (PDF text, Word docs, TXT) with robust regex segmentation.
 */
export function parseStructuredTextDocument(rawText: string): ParsedRawQuestionItem[] {
  if (!rawText || rawText.trim() === "") return [];

  // Detect page breaks e.g. --- Page 3 --- or [Page 3]
  const pageSections = rawText.split(/(?:---+\s*Page\s*(\d+)\s*---+|\[\s*Page\s*(\d+)\s*\])/i);

  let fullSegments: { text: string; pageNum?: number }[] = [];
  if (pageSections.length > 1) {
    let currentPage = 1;
    for (let i = 0; i < pageSections.length; i++) {
      const part = pageSections[i];
      if (!part) continue;
      const num = parseInt(part, 10);
      if (!isNaN(num)) {
        currentPage = num;
      } else if (part.trim().length > 0) {
        fullSegments.push({ text: part, pageNum: currentPage });
      }
    }
  } else {
    fullSegments = [{ text: rawText, pageNum: 1 }];
  }

  const results: ParsedRawQuestionItem[] = [];
  let globalOrder = 1;

  for (const segment of fullSegments) {
    // Regex boundary to split into question blocks: Q1., Question 1, Que 1, Prob 1, etc.
    let questionBlocks = segment.text.split(
      /(?=(?:^|\n)(?:Q(?:uestion|ue)?\.?\s*\d+|Prob(?:lem)?\s*\d+)(?:\s+|\s*\:|\s*\-|\s*\[))/i
    );

    // If no Q1/Question markers found, fall back to numbered questions starting with capitalized words
    if (questionBlocks.length <= 1) {
      const altBlocks = segment.text.split(
        /(?=(?:^|\n)\d{1,3}\.\s+(?=[A-Z][a-z]))/
      );
      if (altBlocks.length > 1) {
        questionBlocks = altBlocks;
      }
    }

    for (const block of questionBlocks) {
      if (!block.trim() || block.trim().length < 15) continue;

      const parsed = extractSingleQuestionFromBlock(block, globalOrder, segment.pageNum);
      if (parsed) {
        results.push(parsed);
        globalOrder++;
      }
    }
  }

  return results;
}

/**
 * Extracts question body, 4 options (A-D), correct answer, and explanation from a single text block.
 */
function extractSingleQuestionFromBlock(
  block: string,
  orderIndex: number,
  pageNum?: number
): ParsedRawQuestionItem | null {
  const cleanBlock = block.trim();

  // 1. Extract Answer Key if present
  let correctKey: "A" | "B" | "C" | "D" | null = null;
  const ansMatch = cleanBlock.match(
    /(?:Ans(?:wer)?|Correct(?:\s*Option)?|Key)\s*[:=\-]?\s*\(?([A-D]|[1-4])\)?/i
  );
  if (ansMatch) {
    const rawKey = ansMatch[1].toUpperCase();
    if (rawKey === "A" || rawKey === "1") correctKey = "A";
    if (rawKey === "B" || rawKey === "2") correctKey = "B";
    if (rawKey === "C" || rawKey === "3") correctKey = "C";
    if (rawKey === "D" || rawKey === "4") correctKey = "D";
  }

  // 2. Extract Explanation / Solution
  let explanationText: string | null = null;
  const solMatch = cleanBlock.match(
    /(?:Solution|Explanation|Exp)\s*[:=\-]?\s*([\s\S]+?)(?=$)/i
  );
  if (solMatch) {
    explanationText = normalizeLatexContent(solMatch[1].trim());
  }

  // Remove Answer and Solution segments from the question+options parsing text
  let bodyAndOptions = cleanBlock;
  if (ansMatch) {
    bodyAndOptions = bodyAndOptions.replace(ansMatch[0], "");
  }
  if (solMatch) {
    bodyAndOptions = bodyAndOptions.replace(solMatch[0], "");
  }

  // 3. Segment Options (A, B, C, D)
  const optionMatches = Array.from(
    bodyAndOptions.matchAll(
      /(?:^|\n|\s+)(?:\(([A-D]|[1-4])\)|([A-D]|[1-4])[\.\)]|\b([A-D])\s*[\:\-])\s*([\s\S]*?)(?=(?:(?:\(([A-D]|[1-4])\)|([A-D]|[1-4])[\.\)]|\b([A-D])\s*[\:\-])|$))/gi
    )
  );

  let questionText = "";
  const optionsMap: Record<"A" | "B" | "C" | "D", string> = { A: "", B: "", C: "", D: "" };

  if (optionMatches.length >= 4) {
    // Question body is text before the first option match
    const firstOptIndex = optionMatches[0].index || 0;
    questionText = bodyAndOptions.substring(0, firstOptIndex).trim();

    // Map the 4 options
    optionMatches.slice(0, 4).forEach((match, idx) => {
      const keyLetter = ["A", "B", "C", "D"][idx] as "A" | "B" | "C" | "D";
      const content = (match[4] || "").trim();
      optionsMap[keyLetter] = normalizeLatexContent(content);
    });
  } else {
    // If option markers not distinctly segmented, treat the whole block as question body
    questionText = bodyAndOptions.trim();
  }

  // Remove leading question numbering (e.g. "Q1. ", "1. ", "Question 1: ")
  questionText = questionText.replace(/^(?:Q\.?\s*\d+|Question\s*\d+|\d+\.)(?:\s+|\s*\:|\s*\-)/i, "").trim();
  questionText = normalizeLatexContent(questionText);

  // Detect PYQ Year if present in question header e.g. [JEE Main 2023] or (NEET 2022)
  let pyqYear: number | null = null;
  let pyqShift: string | null = null;
  let examType: string | null = null;

  const pyqMatch = cleanBlock.match(/\b(JEE\s*Main|JEE\s*Adv(?:anced)?|NEET)\s*(?:[-–,\s]+)?(20\d{2})\b/i);
  if (pyqMatch) {
    const rawExam = pyqMatch[1].toUpperCase();
    if (rawExam.includes("ADV")) examType = "JEE_ADV";
    else if (rawExam.includes("NEET")) examType = "NEET";
    else examType = "JEE_MAIN";

    pyqYear = parseInt(pyqMatch[2], 10);
  }

  const shiftMatch = cleanBlock.match(/\b(Shift\s*[12]|Morning|Evening|Session\s*[12])\b/i);
  if (shiftMatch) {
    pyqShift = shiftMatch[1];
  }

  const options: StagingOptionItem[] = [
    { option_key: "A", content_latex: optionsMap.A, is_correct: correctKey === "A" },
    { option_key: "B", content_latex: optionsMap.B, is_correct: correctKey === "B" },
    { option_key: "C", content_latex: optionsMap.C, is_correct: correctKey === "C" },
    { option_key: "D", content_latex: optionsMap.D, is_correct: correctKey === "D" },
  ];

  return {
    order_index: orderIndex,
    raw_content: cleanBlock,
    source_page_number: pageNum || 1,
    source_location_ref: pageNum ? `Page ${pageNum}, Q${orderIndex}` : `Item ${orderIndex}`,
    question_text: questionText,
    options,
    correct_option_key: correctKey,
    explanation_text: explanationText,
    exam_type: examType,
    pyq_year: pyqYear,
    pyq_shift: pyqShift,
  };
}
