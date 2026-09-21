import { describe, it, expect } from "vitest";
import {
  parseCsvQuestionDocument,
  parseStructuredTextDocument,
} from "@/lib/ingestion/parser";
import {
  normalizeLatexContent,
  validateLatexSyntax,
} from "@/lib/ingestion/latexNormalizer";

describe("Phase 9 Document Parser & LaTeX Normalizer Suite", () => {
  /* ======================================================================== */
  /* 1. UNIT: CSV Question Document Parsing                                   */
  /* ======================================================================== */
  describe("[UNIT] CSV Question Parsing & Column Mapping", () => {
    it("parses valid CSV document with 4 options and correct answer key", () => {
      const csv = `Question,Option A,Option B,Option C,Option D,Correct Answer,Solution,Exam,Year,Subject,Chapter,Difficulty
"Find velocity $v = \\sqrt{2gh}$ for $h = 5\\text{ m}$.","10 m/s","20 m/s","30 m/s","40 m/s",A,"Using conservation of energy.",JEE_MAIN,2023,Physics,Kinematics,EASY
"Calculate force on $m = 2\\text{ kg}$ with $a = 3\\text{ m/s}^2$.","2 N","4 N","6 N","8 N",C,"F = ma = 6 N.",JEE_MAIN,2024,Physics,Kinematics,EASY`;

      const parsed = parseCsvQuestionDocument(csv);
      expect(parsed).toHaveLength(2);

      const q1 = parsed[0];
      expect(q1.question_text).toContain("Find velocity");
      expect(q1.options).toHaveLength(4);
      expect(q1.options[0].option_key).toBe("A");
      expect(q1.options[0].is_correct).toBe(true);
      expect(q1.options[1].is_correct).toBe(false);
      expect(q1.correct_option_key).toBe("A");
      expect(q1.pyq_year).toBe(2023);
      expect(q1.suggested_subject_name).toBe("Physics");
    });

    it("handles alternative column headers (e.g. optA, Ans, Level)", () => {
      const csv = `content,optA,optB,optC,optD,ans,level
"Calculate molarity of solution.","1 M","2 M","3 M","4 M",2,MEDIUM`;

      const parsed = parseCsvQuestionDocument(csv);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].correct_option_key).toBe("B"); // '2' maps to 'B'
      expect(parsed[0].options[1].is_correct).toBe(true);
    });

    it("returns empty array for empty or header-only CSV", () => {
      expect(parseCsvQuestionDocument("")).toEqual([]);
      expect(parseCsvQuestionDocument("Question,Option A,Option B,Option C,Option D")).toEqual([]);
    });
  });

  /* ======================================================================== */
  /* 2. UNIT: Structured Free-Text & Regex Segmentation                       */
  /* ======================================================================== */
  describe("[UNIT] Free-Text Document Question Segmentation", () => {
    const textSample = `
--- Page 1 ---
Q1. A body of mass $m = 2\\text{ kg}$ is accelerated by a force $F = 10\\text{ N}$. Find acceleration.
(A) $2\\text{ m/s}^2$
(B) $5\\text{ m/s}^2$
(C) $10\\text{ m/s}^2$
(D) $20\\text{ m/s}^2$
Ans: B
Solution: $a = F/m = 10/2 = 5\\text{ m/s}^2$.

--- Page 2 ---
Question 2: What is the oxidation state of Cr in $\\text{K}_2\\text{Cr}_2\\text{O}_7$? [JEE Main 2022]
1. +3
2. +4
3. +6
4. +7
Key: C
Solution: Let oxidation state be $x$. $2(+1) + 2x + 7(-2) = 0 \\implies 2x = 12 \\implies x = +6$.
`;

    it("correctly segments multiple questions across pages", () => {
      const parsed = parseStructuredTextDocument(textSample);
      expect(parsed).toHaveLength(2);

      const q1 = parsed[0];
      expect(q1.order_index).toBe(1);
      expect(q1.source_page_number).toBe(1);
      expect(q1.question_text).toContain("accelerated by a force");
      expect(q1.options).toHaveLength(4);
      expect(q1.correct_option_key).toBe("B");
      expect(q1.options[1].is_correct).toBe(true);

      const q2 = parsed[1];
      expect(q2.order_index).toBe(2);
      expect(q2.source_page_number).toBe(2);
      expect(q2.question_text).toContain("oxidation state of Cr");
      expect(q2.correct_option_key).toBe("C");
      expect(q2.pyq_year).toBe(2022);
      expect(q2.exam_type).toBe("JEE_MAIN");
    });
  });

  /* ======================================================================== */
  /* 3. UNIT: LaTeX Normalizer & KaTeX Syntax Verification                    */
  /* ======================================================================== */
  describe("[UNIT] LaTeX Math Normalization & Syntax Checks", () => {
    it("converts Unicode mathematical symbols and Greek letters into KaTeX macros", () => {
      const raw = "Find torque τ = r × F with angle θ = 30° and speed v ≤ 10 m/s.";
      const normalized = normalizeLatexContent(raw);

      expect(normalized).toContain("\\tau");
      expect(normalized).toContain("\\times");
      expect(normalized).toContain("\\theta");
      expect(normalized).toContain("\\le");
      expect(normalized).toContain("^{\\circ}");
    });

    it("cleans excessive spacing inside math delimiters", () => {
      const raw = "The integral $  \\int_0^1 x dx  $ equals $ 1/2 $.";
      const normalized = normalizeLatexContent(raw);
      expect(normalized).toBe("The integral $\\int_0^1 x dx$ equals $1/2$.");
    });

    it("verifies valid LaTeX formulas using KaTeX parser", () => {
      const valid = "Calculate $\\frac{a + b}{\\sqrt{c^2 + d^2}}$ and $\\int_0^\\infty e^{-x} dx$.";
      expect(validateLatexSyntax(valid).isValid).toBe(true);
    });

    it("detects invalid LaTeX syntax with unclosed braces", () => {
      const invalid = "Calculate $\\frac{a + b}{\\sqrt{c^2 + d^2$ without closing brace.";
      const check = validateLatexSyntax(invalid);
      expect(check.isValid).toBe(false);
      expect(check.error).toBeDefined();
    });
  });
});
