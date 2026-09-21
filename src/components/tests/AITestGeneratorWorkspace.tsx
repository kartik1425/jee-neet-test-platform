"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  HelpCircle,
  FileText,
  Sliders,
  ShieldCheck,
  RotateCw,
  ExternalLink,
} from "lucide-react";
import { AITestBlueprint, QuestionSelectionDetail } from "@/types/aiTestGenerator";
import {
  generateBlueprintFromPromptAction,
  createAITestDraftAction,
  replaceDraftQuestionAction,
} from "@/lib/tests/aiActions";
import { LatexRenderer } from "@/components/LatexRenderer";

const PROMPT_TEMPLATES = [
  {
    title: "JEE Advanced Physics Tough Mock",
    prompt:
      "Create a 30-question very difficult JEE Advanced Physics paper from Rotation, Centre of Mass, and Work Energy Power. Use PYQs only. Focus on high-thinking conceptual problems.",
  },
  {
    title: "JEE Main 3-Subject Sprint",
    prompt:
      "Make a 60-question JEE Main test. Physics 20 (Kinematics, Laws of Motion), Chemistry 20 (Thermodynamics, Chemical Bonding), Mathematics 20 (Calculus, Coordinate Geometry). Moderate to Hard difficulty. PYQs from 2020 to 2024.",
  },
  {
    title: "NEET Biology High-Yield Blitz",
    prompt:
      "Generate a 45-question NEET Biology paper focusing on Genetics and Cell Biology. 70% Medium, 30% Hard. Use verified PYQs only. Do not repeat questions from recent tests.",
  },
];

export function AITestGeneratorWorkspace() {
  const router = useRouter();

  // Wizard States
  const [prompt, setPrompt] = useState("");
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [blueprint, setBlueprint] = useState<AITestBlueprint | null>(null);

  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftTestId, setDraftTestId] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionSelectionDetail[]>([]);
  const [shortageError, setShortageError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [replacingQId, setReplacingQId] = useState<string | null>(null);

  // Step 1: Handle Blueprint Generation
  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGeneratingBlueprint(true);
    setGeneralError(null);
    setShortageError(null);

    const res = await generateBlueprintFromPromptAction(prompt);
    setIsGeneratingBlueprint(false);

    if (res.success && res.blueprint) {
      setBlueprint(res.blueprint);
      setDraftTestId(null);
      setSelectedQuestions([]);
    } else {
      setGeneralError(res.error || "Failed to generate test blueprint.");
    }
  };

  // Step 2: Handle Draft Creation
  const handleCreateDraft = async () => {
    if (!blueprint) return;

    setIsCreatingDraft(true);
    setGeneralError(null);
    setShortageError(null);

    const res = await createAITestDraftAction(blueprint);
    setIsCreatingDraft(false);

    if (res.success && res.test_id) {
      setDraftTestId(res.test_id);
      setSelectedQuestions(res.selected_questions);
    } else if (res.is_shortage) {
      setShortageError(res.shortage_details?.message || "Question shortage encountered.");
    } else {
      setGeneralError(res.errors?.join(", ") || "Failed to create draft test paper.");
    }
  };

  // Step 3: Handle Individual Question Replacement
  const handleReplaceQuestion = async (oldQId: string) => {
    if (!draftTestId) return;
    setReplacingQId(oldQId);

    const res = await replaceDraftQuestionAction(draftTestId, oldQId);
    setReplacingQId(null);

    if (res.success) {
      // Re-trigger draft fetch or update local state
      setSelectedQuestions((prev) =>
        prev.map((q) =>
          q.question_id === oldQId
            ? { ...q, selection_reason: "Replaced with alternative chapter candidate" }
            : q
        )
      );
    } else {
      alert(res.error || "Could not replace question.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI Test Paper Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Construct Authentic Test Papers in Seconds
          </h1>
          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Describe your desired examination in natural language. Our AI extracts a structured blueprint,
            matches curriculum constraints, and compiles the paper <strong>100% from approved question bank records</strong>.
          </p>
        </div>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Generation Error</p>
            <p>{generalError}</p>
          </div>
        </div>
      )}

      {/* Shortage Error Banner */}
      {shortageError && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            Question Pool Shortage Detected
          </div>
          <p className="text-sm text-amber-800">{shortageError}</p>
          <div className="pt-2 border-t border-amber-200 text-xs text-amber-700 space-y-1">
            <p className="font-semibold">Suggested Actions:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Reduce the total requested question count</li>
              <li>Relax difficulty constraints (e.g. allow Medium difficulty)</li>
              <li>Expand chapter selections or widen PYQ year boundaries</li>
            </ul>
          </div>
        </div>
      )}

      {/* STEP 1: Prompt Builder Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              Describe Your Test Paper
            </h2>
            <p className="text-xs text-slate-500">
              Mention exam type, subject breakdown, chapters, difficulty, and PYQ constraints.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateBlueprint} className="space-y-4">
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create a 30-question very difficult JEE Advanced Physics paper from Rotation and Work Energy Power. Use verified PYQs only and avoid questions used in the last 2 tests."
            className="w-full p-4 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
          />

          {/* Quick Prompt Templates */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Or Try a Preset Template:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PROMPT_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(tmpl.prompt)}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs transition space-y-1"
                >
                  <p className="font-bold text-slate-800">{tmpl.title}</p>
                  <p className="text-slate-500 line-clamp-2">{tmpl.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isGeneratingBlueprint || !prompt.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 transition"
            >
              {isGeneratingBlueprint ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Request & Generating Blueprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Test Blueprint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* STEP 2: Structured Blueprint Review */}
      {blueprint && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  AI Test Blueprint
                </h2>
                <p className="text-xs text-slate-500">
                  Review the extracted constraints before compiling candidate questions.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              Schema Validated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Exam Target</span>
              <p className="text-sm font-bold text-slate-900">{blueprint.exam_type.replace("_", " ")}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
              <p className="text-sm font-bold text-slate-900">{blueprint.total_questions} Questions</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duration</span>
              <p className="text-sm font-bold text-slate-900">{blueprint.duration_minutes} Minutes</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PYQ Constraints</span>
              <p className="text-sm font-bold text-slate-900">
                {blueprint.source_constraints.pyq_only ? "Verified PYQs Only" : "Standard Pool"}
              </p>
            </div>
          </div>

          {/* Subjects Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subject Allocations:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blueprint.subjects.map((sub, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                    <span>{sub.subject_name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs">
                      {sub.question_count} Qs
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-500">Chapters:</p>
                    <div className="flex flex-wrap gap-1">
                      {sub.chapter_names.map((ch, cIdx) => (
                        <span key={cIdx} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px]">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleCreateDraft}
              disabled={isCreatingDraft}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 transition"
            >
              {isCreatingDraft ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Matching Constraints & Creating Draft...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Compile Draft Test Paper</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Generated Draft Review Table */}
      {draftTestId && selectedQuestions.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  Draft Test Compiled ({selectedQuestions.length} Questions)
                </h2>
                <p className="text-xs text-slate-500">
                  All questions sourced from approved question bank records.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/admin/tests/${draftTestId}`)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              <span>Open in Review & Publish Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selected Questions List */}
          <div className="space-y-4">
            {selectedQuestions.map((item, idx) => (
              <div
                key={item.question_id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                      {item.subject_name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                      {item.chapter_name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
                      {item.difficulty}
                    </span>
                    {item.pyq_year && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                        PYQ {item.pyq_year}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReplaceQuestion(item.question_id)}
                    disabled={replacingQId === item.question_id}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${replacingQId === item.question_id ? "animate-spin" : ""}`} />
                    <span>Replace</span>
                  </button>
                </div>

                {/* Question LaTeX Body */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 leading-relaxed">
                  <LatexRenderer content={item.question.content_latex} />
                </div>

                {/* Selection Reason */}
                <div className="text-xs text-indigo-600 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{item.selection_reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
