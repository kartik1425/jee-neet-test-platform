import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { getStudentDashboardData } from "@/lib/student/dashboard";
import { StudentProfileHeader } from "@/components/student/StudentProfileHeader";
import { ActiveAttemptBanner } from "@/components/student/ActiveAttemptBanner";
import { StudentTestBrowser } from "@/components/student/StudentTestBrowser";
import { SubjectMasteryCards } from "@/components/student/SubjectMasteryCards";
import { AttemptHistoryTable } from "@/components/student/AttemptHistoryTable";
import { LogOut, Sparkles, Flame, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentPortalPage() {
  await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const dashboardData = await getStudentDashboardData();
  const { profile, activeAttempt, assignedTests, practiceTests, recentAttempts, metrics } = dashboardData;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm tracking-tight">
            EX
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight">
              JEE/NEET Exam Engine
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Student Testing & Analytics Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">{profile.fullName}</p>
            <p className="text-[10px] text-slate-500">{profile.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Student Hub */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Active Attempt Sticky Banner (if student has an active exam) */}
        {activeAttempt && <ActiveAttemptBanner activeAttempt={activeAttempt} />}

        {/* Profile & Aggregate Stats Banner */}
        <StudentProfileHeader profile={profile} metrics={metrics} />

        {/* Longitudinal Mistake Hub Quick Navigation */}
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-200/80 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Persistent Mistake History & Error Taxonomy
              </h2>
              <p className="text-xs text-slate-600">
                Track recurring problem-solving patterns, topic weakness matrices, and resolution trends.
              </p>
            </div>
          </div>
          <Link
            href="/student/mistakes"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition"
          >
            <span>View Mistake Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Assigned and Available Tests Browser */}
        <StudentTestBrowser assignedTests={assignedTests} practiceTests={practiceTests} />

        {/* Subject Mastery and Diagnostic Breakdown */}
        <SubjectMasteryCards metrics={metrics} />

        {/* Historical Completed Attempts Table */}
        <AttemptHistoryTable recentAttempts={recentAttempts} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© 2026 JEE/NEET AI Examination & Preparation Platform • Deterministic Code Scoring Engine</p>
      </footer>
    </div>
  );
}
