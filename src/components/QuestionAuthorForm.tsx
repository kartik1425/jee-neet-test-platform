"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LatexRenderer } from "@/components/LatexRenderer";
import { createQuestionAction, updateQuestionAction } from "@/lib/questions/actions";
import { Question } from "@/types/database";
import { Eye, Code, CheckCircle2, AlertCircle, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TaxonomySubject {
  id: string;
  name: string;
  code: string;
  chapters: {
    id: string;
    name: string;
    topics: {
      id: string;
      name: string;
    }[];
  }[];
}

interface QuestionAuthorFormProps {
  taxonomy: TaxonomySubject[];
  initialData?: Question | null;
  mode?: "create" | "edit";
}

export function QuestionAuthorForm({
  taxonomy,
  initialData,
  mode = "create",
}: QuestionAuthorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  // Form State
  const [examType, setExamType] = useState<string>(initialData?.exam_type || "JEE_MAIN");
  const [subjectId, setSubjectId] = useState<string>(
    initialData?.subject_id || (taxonomy.length > 0 ? taxonomy[0].id : "")
  );

  const selectedSubject = taxonomy.find((s) => s.id === subjectId) || taxonomy[0];
  const chapters = selectedSubject?.chapters || [];

  const [chapterId, setChapterId] = useState<string>(
    initialData?.chapter_id || (chapters.length > 0 ? chapters[0].id : "")
  );

  const selectedChapter = chapters.find((c) => c.id === chapterId) || chapters[0];
  const topics = selectedChapter?.topics || [];

  const [topicId, setTopicId] = useState<string>(
    initialData?.topic_id || (topics.length > 0 ? topics[0].id : "")
  );

  const [difficulty, setDifficulty] = useState<string>(initialData?.difficulty || "MEDIUM");
  const [sourceType, setSourceType] = useState<string>(initialData?.source_type || "INSTITUTE");
  const [pyqYear, setPyqYear] = useState<string>(
    initialData?.pyq_year ? String(initialData.pyq_year) : ""
  );
  const [pyqShift, setPyqShift] = useState<string>(initialData?.pyq_shift || "");
  const [sourceReference, setSourceReference] = useState<string>(
    initialData?.source_reference || ""
  );

  const [contentLatex, setContentLatex] = useState<string>(
    initialData?.content_latex || ""
  );
  const [explanationLatex, setExplanationLatex] = useState<string>(
    initialData?.explanation_latex || ""
  );

  // Options State (A, B, C, D)
  const initialOptions = initialData?.options || [];
  const [options, setOptions] = useState<{
    optionKey: "A" | "B" | "C" | "D";
    contentLatex: string;
    isCorrect: boolean;
  }[]>([
    {
      optionKey: "A",
      contentLatex: initialOptions.find((o) => o.option_key === "A")?.content_latex || "",
      isCorrect: initialOptions.find((o) => o.option_key === "A")?.is_correct ?? true,
    },
    {
      optionKey: "B",
      contentLatex: initialOptions.find((o) => o.option_key === "B")?.content_latex || "",
      isCorrect: initialOptions.find((o) => o.option_key === "B")?.is_correct ?? false,
    },
    {
      optionKey: "C",
      contentLatex: initialOptions.find((o) => o.option_key === "C")?.content_latex || "",
      isCorrect: initialOptions.find((o) => o.option_key === "C")?.is_correct ?? false,
    },
    {
      optionKey: "D",
      contentLatex: initialOptions.find((o) => o.option_key === "D")?.content_latex || "",
      isCorrect: initialOptions.find((o) => o.option_key === "D")?.is_correct ?? false,
    },
  ]);

  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  const handleCorrectOptionChange = (selectedKey: "A" | "B" | "C" | "D") => {
    setOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        isCorrect: opt.optionKey === selectedKey,
      }))
    );
  };

  const handleOptionContentChange = (
    key: "A" | "B" | "C" | "D",
    value: string
  ) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.optionKey === key ? { ...opt, contentLatex: value } : opt))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors(null);

    const payload = {
      subjectId,
      chapterId,
      topicId: topicId || null,
      examType,
      difficulty,
      contentLatex,
      explanationLatex: explanationLatex || null,
      sourceType,
      pyqYear: pyqYear ? parseInt(pyqYear, 10) : null,
      pyqShift: pyqShift || null,
      sourceReference: sourceReference || null,
      options,
    };

    startTransition(async () => {
      let result;
      if (mode === "edit" && initialData?.id) {
        result = await updateQuestionAction(initialData.id, payload);
      } else {
        result = await createQuestionAction(payload);
      }

      if (result.success) {
        router.push("/admin/questions");
        router.refresh();
      } else {
        setErrorMsg(result.error || "An error occurred while saving.");
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Question Bank
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving Question..." : mode === "edit" ? "Save Changes" : "Create Question"}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{errorMsg}</p>
            {fieldErrors && (
              <ul className="list-disc list-inside mt-1 text-xs space-y-0.5">
                {Object.entries(fieldErrors).map(([field, msgs]) => (
                  <li key={field}>{msgs.join(", ")}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 1. Academic Taxonomy & Metadata */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          1. Academic Classification & Metadata
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Exam</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="JEE_MAIN">JEE Main</option>
              <option value="JEE_ADV">JEE Advanced</option>
              <option value="NEET">NEET UG</option>
              <option value="GENERIC">General / Foundation</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                const s = taxonomy.find((tx) => tx.id === e.target.value);
                if (s?.chapters?.length) {
                  setChapterId(s.chapters[0].id);
                  setTopicId(s.chapters[0].topics[0]?.id || "");
                }
              }}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {taxonomy.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Chapter</label>
            <select
              value={chapterId}
              onChange={(e) => {
                setChapterId(e.target.value);
                const ch = chapters.find((c) => c.id === e.target.value);
                setTopicId(ch?.topics[0]?.id || "");
              }}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {chapters.map((chap) => (
                <option key={chap.id} value={chap.id}>
                  {chap.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Topic</label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">(No topic / General)</option>
              {topics.map((top) => (
                <option key={top.id} value={top.id}>
                  {top.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="ADVANCED">Advanced / Multi-Concept</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="INSTITUTE">Institute Question Bank</option>
              <option value="PYQ">Previous Year Question (PYQ)</option>
              <option value="AI_GENERATED">AI Synthesized</option>
              <option value="SEED_DEMO">Seed / Demo Record</option>
            </select>
          </div>

          {sourceType === "PYQ" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Year</label>
                <input
                  type="number"
                  placeholder="2024"
                  value={pyqYear}
                  onChange={(e) => setPyqYear(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Shift</label>
                <input
                  type="text"
                  placeholder="29 Jan Shift 1"
                  value={pyqShift}
                  onChange={(e) => setPyqShift(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Question Text (LaTeX & KaTeX) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">2. Question Statement</h2>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setPreviewTab("edit")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                previewTab === "edit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              <Code className="w-3.5 h-3.5 inline mr-1" /> LaTeX Editor
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("preview")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                previewTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" /> KaTeX Live Preview
            </button>
          </div>
        </div>

        {previewTab === "edit" ? (
          <div className="space-y-2">
            <textarea
              rows={4}
              required
              value={contentLatex}
              onChange={(e) => setContentLatex(e.target.value)}
              placeholder="Enter question statement. Use $...$ for inline math (e.g. $E=mc^2$) and $$...$$ for display math equations."
              className="w-full font-mono text-sm bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition leading-relaxed"
            />
            <p className="text-xs text-slate-400">
              Supports standard LaTeX syntax: fractions <code className="text-slate-600">{"\\frac{a}{b}"}</code>, roots <code className="text-slate-600">{"\\sqrt{x}"}</code>, vectors <code className="text-slate-600">{"\\vec{v}"}</code>, and integrals.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 min-h-[100px]">
            {contentLatex ? (
              <LatexRenderer content={contentLatex} />
            ) : (
              <p className="text-xs text-slate-400 italic">Enter question statement to see rendered preview.</p>
            )}
          </div>
        )}
      </div>

      {/* 3. Four Single-Choice MCQ Options */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">3. Options (Single MCQ Only)</h2>
            <p className="text-xs text-slate-500">
              Provide exactly 4 options. Select the radio button corresponding to the authoritative correct answer.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {options.map((opt) => (
            <div
              key={opt.optionKey}
              className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
                opt.isCorrect
                  ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="radio"
                  name="correct_option"
                  checked={opt.isCorrect}
                  onChange={() => handleCorrectOptionChange(opt.optionKey)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  id={`opt-radio-${opt.optionKey}`}
                />
                <label
                  htmlFor={`opt-radio-${opt.optionKey}`}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer ${
                    opt.isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {opt.optionKey}
                </label>
              </div>

              <div className="flex-1 w-full space-y-1">
                <input
                  type="text"
                  required
                  value={opt.contentLatex}
                  onChange={(e) => handleOptionContentChange(opt.optionKey, e.target.value)}
                  placeholder={`Option ${opt.optionKey} content (e.g. $\\frac{R}{\\sqrt{2}}$)`}
                  className="w-full text-sm font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                {opt.contentLatex && (
                  <div className="px-1 text-xs text-slate-600">
                    <LatexRenderer content={opt.contentLatex} />
                  </div>
                )}
              </div>

              {opt.isCorrect && (
                <div className="shrink-0 flex items-center gap-1 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Correct Key
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Solution & Explanation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          4. Solution & Detailed Explanation
        </h2>
        <textarea
          rows={3}
          value={explanationLatex}
          onChange={(e) => setExplanationLatex(e.target.value)}
          placeholder="Provide step-by-step solution and mathematical reasoning (shown to students post-submission)."
          className="w-full font-mono text-sm bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition leading-relaxed"
        />
        {explanationLatex && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-500 block mb-1">Rendered Explanation:</span>
            <LatexRenderer content={explanationLatex} />
          </div>
        )}
      </div>
    </form>
  );
}
