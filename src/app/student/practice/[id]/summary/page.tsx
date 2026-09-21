import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getSelfTestSummaryAction } from "@/lib/practice/actions";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PracticeSummaryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PracticeTestSummaryPage({ params }: PracticeSummaryPageProps) {
  await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const resolvedParams = await params;
  const summary = await getSelfTestSummaryAction(resolvedParams.id);

  if (!summary) {
    notFound();
  }

  const getExamBadge = (exam: string) => {
    switch (exam) {
      case "JEE_MAIN":
        return { label: "JEE Main", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "JEE_ADV":
        return { label: "JEE Advanced", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "NEET":
        return { label: "NEET UG", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      default:
        return { label: "Standard", bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const badge = getExamBadge(summary.examType);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
              >
                {badge.label}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Sparkles className="w-3.5 h-3.5" />
                Private Practice Paper
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.title}
            </h1>
          </div>

          {/* Key Metric Specs */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions</span>
              <span className="text-xl font-extrabold text-slate-900">{summary.questionCount}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
              <span className="text-xl font-extrabold text-slate-900">{summary.durationMinutes} min</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
              <span className="text-xl font-extrabold text-slate-900">{summary.totalMarks}</span>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Target className="w-4 h-4 text-slate-400" />
                Marking Scheme
              </span>
              <span className="font-bold text-slate-900">
                +{summary.markingScheme.correct} for Correct / {summary.markingScheme.incorrect} for Wrong
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-slate-400" />
                Subjects
              </span>
              <span className="font-bold text-slate-900 text-right">
                {summary.subjectsSummary.join(", ") || "General"}
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Layers className="w-4 h-4 text-slate-400" />
                Chapters Covered
              </span>
              <span className="font-bold text-slate-900 text-right max-w-xs truncate">
                {summary.chaptersSummary.join(", ") || "All Chapters"}
              </span>
            </div>

            {summary.pyqYearsSummary && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  PYQ Provenance
                </span>
                <span className="font-bold text-slate-900">
                  {summary.pyqYearsSummary}
                </span>
              </div>
            )}
          </div>

          {/* Uniqueness & Integrity Guarantee */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Authoritative Frozen Snapshot</p>
              <p className="text-[11px] text-emerald-800">
                This test paper is snapshot-frozen and isolated to your account. Deterministic scoring will compute your score upon submission.
              </p>
            </div>
          </div>

          {/* Start Test Action Button */}
          <Link
            href={`/exam/start/${summary.id}`}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlayCircle className="w-5 h-5" />
            <span>START TEST NOW</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
