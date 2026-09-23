import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { getTeacherDashboardDataAction } from "@/lib/teacher/actions";
import { getAdminTestsList } from "@/lib/tests/actions";
import { getQuestionsList } from "@/lib/questions/actions";
import { TeacherPortalHub } from "@/components/teacher/TeacherPortalHub";
import {
  LogOut,
  LayoutDashboard,
  FileText,
  Sparkles,
  BookOpen,
  Upload,
  GraduationCap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherPortalPage() {
  const session = await requireRole(["TEACHER", "ADMIN"]);
  const { profile, user } = session;
  const supabase = await createClient();

  const [dashboardRes, testsRes, questionsRes, { count: studentCount }, { count: attemptCount }] =
    await Promise.all([
      getTeacherDashboardDataAction(),
      getAdminTestsList({ limit: 20 }),
      getQuestionsList({ limit: 6, status: "APPROVED" }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
      supabase.from("attempts").select("*", { count: "exact", head: true }).eq("status", "SUBMITTED"),
    ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header & Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/teacher" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              TC
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Teacher Console</h1>
              <p className="text-[11px] text-slate-500 font-medium">Faculty & Examination Suite</p>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Link
              href="/teacher"
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/tests"
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Test Papers
            </Link>
            <Link
              href="/admin/tests/ai-generate"
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Generator
            </Link>
            <Link
              href="/admin/questions"
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Question Bank
            </Link>
            <Link
              href="/admin/ingestion"
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Ingestion
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student View</span>
          </Link>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">{profile.full_name}</p>
            <p className="text-[10px] text-slate-500">{user.email}</p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <TeacherPortalHub
          initialClasses={dashboardRes.classes || []}
          initialSelectedClassId={dashboardRes.selectedClassId}
          initialBundle={dashboardRes.bundle}
          teacherName={profile.full_name}
          teacherRole={profile.role}
          tests={testsRes.tests || []}
          totalTests={testsRes.total || 0}
          totalStudents={studentCount || 0}
          totalAttempts={attemptCount || 0}
          questionCount={questionsRes.total || 5020}
          recentQuestions={questionsRes.questions || []}
        />
      </main>
    </div>
  );
}
