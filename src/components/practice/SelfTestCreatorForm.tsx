"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  SelfTestConfig,
  SelfTestTaxonomySubject,
  QuestionPoolAvailabilityResult,
} from "@/types/practice";
import {
  getPracticeTaxonomyAction,
  checkPracticePoolAvailabilityAction,
  generateSelfPracticeTestAction,
} from "@/lib/practice/actions";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";

export function SelfTestCreatorForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [examType, setExamType] = useState<"JEE_MAIN" | "JEE_ADV" | "NEET">("JEE_MAIN");
  const [taxonomy, setTaxonomy] = useState<SelfTestTaxonomySubject[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"ANY" | "EASY" | "MEDIUM" | "HARD" | "ADVANCED">("ANY");
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [yearStart, setYearStart] = useState<number>(2018);
  const [yearEnd, setYearEnd] = useState<number>(2026);
  const [allowPreviouslyAttempted, setAllowPreviouslyAttempted] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>("");

  // Pool availability feedback state
  const [availability, setAvailability] = useState<QuestionPoolAvailabilityResult | null>(null);
  const [checkingPool, setCheckingPool] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // 1. Fetch Taxonomy when examType changes
  useEffect(() => {
    let isMounted = true;
    setLoadingTaxonomy(true);

    getPracticeTaxonomyAction(examType).then((data) => {
      if (!isMounted) return;
      setTaxonomy(data);
      setLoadingTaxonomy(false);

      // Select all subjects & chapters by default for fast configuration
      const allSubIds = data.map((s) => s.id);
      const allChapIds = data.flatMap((s) => s.chapters.map((c) => c.id));
      setSelectedSubjectIds(allSubIds);
      setSelectedChapterIds(allChapIds);
      setSelectedTopicIds([]);
    });

    return () => {
      isMounted = false;
    };
  }, [examType]);

  // 2. Automatically verify pool availability whenever filters change
  useEffect(() => {
    if (selectedSubjectIds.length === 0 || selectedChapterIds.length === 0) {
      setAvailability(null);
      return;
    }

    const timer = setTimeout(() => {
      setCheckingPool(true);
      checkPracticePoolAvailabilityAction({
        examType,
        subjectIds: selectedSubjectIds,
        chapterIds: selectedChapterIds,
        topicIds: selectedTopicIds,
        difficulty,
        questionCount,
        durationMinutes,
        pyqOnly: true,
        yearStart,
        yearEnd,
        allowPreviouslyAttempted,
      })
        .then((res) => {
          setAvailability(res);
          setCheckingPool(false);
        })
        .catch((err) => {
          console.error("Availability check failed:", err);
          setCheckingPool(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [
    examType,
    selectedSubjectIds,
    selectedChapterIds,
    selectedTopicIds,
    difficulty,
    questionCount,
    durationMinutes,
    yearStart,
    yearEnd,
    allowPreviouslyAttempted,
  ]);

  // Subject toggle handler
  const handleToggleSubject = (subjectId: string) => {
    const subject = taxonomy.find((s) => s.id === subjectId);
    if (!subject) return;

    if (selectedSubjectIds.includes(subjectId)) {
      if (selectedSubjectIds.length === 1) return; // Must keep at least 1 subject
      setSelectedSubjectIds((prev) => prev.filter((id) => id !== subjectId));
      const subjectChapIds = new Set(subject.chapters.map((c) => c.id));
      setSelectedChapterIds((prev) => prev.filter((id) => !subjectChapIds.has(id)));
    } else {
      setSelectedSubjectIds((prev) => [...prev, subjectId]);
      const newChapIds = subject.chapters.map((c) => c.id);
      setSelectedChapterIds((prev) => Array.from(new Set([...prev, ...newChapIds])));
    }
  };

  // Chapter toggle handler
  const handleToggleChapter = (chapterId: string) => {
    if (selectedChapterIds.includes(chapterId)) {
      if (selectedChapterIds.length === 1) return; // Keep at least 1 chapter
      setSelectedChapterIds((prev) => prev.filter((id) => id !== chapterId));
    } else {
      setSelectedChapterIds((prev) => [...prev, chapterId]);
    }
  };

  // Submit & Generate Test
  const handleGenerate = () => {
    setGenerationError(null);

    startTransition(async () => {
      const result = await generateSelfPracticeTestAction({
        examType,
        subjectIds: selectedSubjectIds,
        chapterIds: selectedChapterIds,
        topicIds: selectedTopicIds,
        difficulty,
        questionCount,
        durationMinutes,
        pyqOnly: true,
        yearStart,
        yearEnd,
        allowPreviouslyAttempted,
        customTitle: customTitle.trim() || undefined,
      });

      if (!result.success || !result.testId) {
        setGenerationError(result.error || "Failed to generate practice test.");
      } else {
        router.push(`/student/practice/${result.testId}/summary`);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Student Portal</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-purple-600" />
            <span>Create Private Practice Test</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate custom practice papers from verified PYQs tailored to your target subjects and chapters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration Columns (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Target Exam */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span>1. Select Target Exam</span>
              </label>
              <span className="text-xs text-slate-400 font-medium">Step 1 of 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { id: "JEE_MAIN", label: "JEE Main", color: "blue" },
                { id: "JEE_ADV", label: "JEE Advanced", color: "purple" },
                { id: "NEET", label: "NEET UG", color: "emerald" },
              ].map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => setExamType(exam.id as any)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-center font-bold text-xs sm:text-sm transition cursor-pointer ${
                    examType === exam.id
                      ? "border-purple-600 bg-purple-50/60 text-purple-900 ring-2 ring-purple-600/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  {exam.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Subject & Chapter Selection */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>2. Select Subjects & Chapters</span>
              </label>
              <span className="text-xs text-slate-400 font-medium">Multi-select enabled</span>
            </div>

            {loadingTaxonomy ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading taxonomy...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subject Chips */}
                <div className="flex flex-wrap gap-2">
                  {taxonomy.map((subject) => {
                    const isSelected = selectedSubjectIds.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => handleToggleSubject(subject.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <span>{subject.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Chapter List per Subject */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {taxonomy
                    .filter((s) => selectedSubjectIds.includes(s.id))
                    .map((subject) => (
                      <div key={subject.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            {subject.name} Chapters ({subject.chapters.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const allChapIds = subject.chapters.map((c) => c.id);
                              const hasAll = allChapIds.every((id) => selectedChapterIds.includes(id));
                              if (hasAll) {
                                setSelectedChapterIds((prev) =>
                                  prev.filter((id) => !allChapIds.includes(id))
                                );
                              } else {
                                setSelectedChapterIds((prev) =>
                                  Array.from(new Set([...prev, ...allChapIds]))
                                );
                              }
                            }}
                            className="text-[11px] font-semibold text-purple-600 hover:underline cursor-pointer"
                          >
                            Toggle All
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {subject.chapters.map((chapter) => {
                            const isChecked = selectedChapterIds.includes(chapter.id);
                            return (
                              <label
                                key={chapter.id}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                                  isChecked
                                    ? "bg-purple-50/40 border-purple-200 text-purple-950 font-medium"
                                    : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100/60"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleChapter(chapter.id)}
                                  className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                                />
                                <span className="truncate">{chapter.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Difficulty & PYQ Provenance Filters */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>3. Difficulty & PYQ Provenance</span>
            </label>

            {/* Difficulty Tabs */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 block">Difficulty Level</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { id: "ANY", label: "Any / Mixed" },
                  { id: "EASY", label: "Easy" },
                  { id: "MEDIUM", label: "Moderate" },
                  { id: "HARD", label: "Hard" },
                  { id: "ADVANCED", label: "Advanced" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id as any)}
                    className={`p-2.5 rounded-xl text-center text-xs font-bold border transition cursor-pointer ${
                      difficulty === d.id
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PYQ Year Range */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  PYQ Year Window
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {yearStart} – {yearEnd}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    From Year
                  </label>
                  <select
                    value={yearStart}
                    onChange={(e) => setYearStart(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(
                      (yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    To Year
                  </label>
                  <select
                    value={yearEnd}
                    onChange={(e) => setYearEnd(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Questions & Duration */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>4. Paper Length & Timing</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Number of Questions
                </label>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 20, 30, 45, 60].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        questionCount === count
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {count} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Exam Duration (Minutes)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[20, 30, 45, 60, 90, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        durationMinutes === mins
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Custom Title */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Custom Test Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Mechanics & Waves Rapid Drill"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Live Availability & Generate Sidebar (1 Col) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-sm space-y-6 sticky top-20">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
                Live Pool Availability
              </span>
              <h3 className="text-lg font-bold">Question Pool Status</h3>
            </div>

            {checkingPool ? (
              <div className="py-6 text-center space-y-2 text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-400" />
                <p>Verifying unique qualifying PYQs...</p>
              </div>
            ) : availability ? (
              <div className="space-y-4 text-xs">
                {/* Status Indicator Badge */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                    availability.isSufficient
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  {availability.isSufficient ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block text-sm">
                      {availability.isSufficient ? "Sufficient Questions Available" : "Insufficient Question Pool"}
                    </span>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {availability.isSufficient
                        ? `${availability.unusedEligibleCount} fresh unused PYQs match your criteria.`
                        : `Only ${availability.unusedEligibleCount} unused qualifying questions available for requested ${questionCount} questions.`}
                    </p>
                  </div>
                </div>

                {/* Pool Counts Matrix */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Eligible PYQs:</span>
                    <span className="font-bold font-mono">{availability.totalEligibleCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Never Attempted / Unused:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {availability.unusedEligibleCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Previously Attempted:</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {availability.previouslyAttemptedCount}
                    </span>
                  </div>
                </div>

                {/* Shortage Fallback Options */}
                {!availability.isSufficient && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label className="flex items-start gap-2 cursor-pointer bg-white/5 p-3 rounded-xl border border-white/10">
                      <input
                        type="checkbox"
                        checked={allowPreviouslyAttempted}
                        onChange={(e) => setAllowPreviouslyAttempted(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 mt-0.5"
                      />
                      <span className="text-[11px] text-slate-300">
                        Include previously attempted questions to satisfy test size
                      </span>
                    </label>

                    {availability.unusedEligibleCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuestionCount(availability.unusedEligibleCount)}
                        className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-purple-200 transition text-center"
                      >
                        Adjust to {availability.unusedEligibleCount} Questions
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Select subjects and chapters to evaluate qualifying PYQ count.
              </div>
            )}

            {generationError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
                {generationError}
              </div>
            )}

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || checkingPool || (!availability?.isSufficient && !allowPreviouslyAttempted)}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Private Test...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Test Paper</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
