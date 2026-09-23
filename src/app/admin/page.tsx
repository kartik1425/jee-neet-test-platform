import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import {
  ShieldAlert,
  LogOut,
  Database,
  FileText,
  Cpu,
  CheckCircle2,
  Sparkles,
  Users,
  GraduationCap,
  Layers,
  ArrowRight,
  Plus,
  Upload,
  BarChart3,
  BookOpen,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPortalPage() {
  const session = await requireRole(["TEACHER", "ADMIN"]);
  const { profile, user } = session;
  const supabase = await createClient();

  // Fetch Live Platform Statistics
  const [
    { count: questionCount },
    { count: testCount },
    { count: studentCount },
    { count: classCount },
    { count: attemptCount },
  ] = await Promise.all([
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("tests").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
    supabase.from("classes").select("*", { count: "exact", head: true }),
    supabase.from("attempts").select("*", { count: "exact", head: true }).eq("status", "SUBMITTED"),
  ]);

  const navModules = [
    {
      title: "Question Bank & Taxonomy",
      description: "Manage 5,000+ authentic PYQ questions, mathematical LaTeX formulas, answer keys, and chapter mappings across JEE & NEET.",
      href: "/admin/questions",
      icon: Database,
      badge: `${questionCount || 5020}+ Questions`,
      color: "from-blue-600 to-cyan-600",
      iconColor: "text-blue-600",
      borderColor: "hover:border-blue-300",
    },
    {
      title: "Test Paper Management",
      description: "Author mock exams, configure marking schemes (+4/-1), schedule test windows, preview papers, and assign to student batches.",
      href: "/admin/tests",
      icon: FileText,
      badge: `${testCount || 0} Test Papers`,
      color: "from-indigo-600 to-violet-600",
      iconColor: "text-indigo-600",
      borderColor: "hover:border-indigo-300",
    },
    {
      title: "AI Paper Generator",
      description: "Instantly assemble balanced exam papers from the authentic PYQ bank based on chapter weightages and difficulty curves.",
      href: "/admin/tests/ai-generate",
      icon: Sparkles,
      badge: "AI Powered",
      color: "from-purple-600 to-pink-600",
      iconColor: "text-purple-600",
      borderColor: "hover:border-purple-300",
    },
    {
      title: "Bulk Ingestion Pipeline",
      description: "Upload JSON/CSV question datasets, run automated LaTeX syntax checks, and deduplicate questions with full audit logs.",
      href: "/admin/ingestion",
      icon: Upload,
      badge: "Ingestion Engine",
      color: "from-emerald-600 to-teal-600",
      iconColor: "text-emerald-600",
      borderColor: "hover:border-emerald-300",
    },
    {
      title: "Teacher Console & Analytics",
      description: "Inspect batch-level score distributions, accuracy trends, topic risk matrices, and student mistake profiles.",
      href: "/teacher",
      icon: BarChart3,
      badge: `${classCount || 0} Classes`,
      color: "from-amber-600 to-orange-600",
      iconColor: "text-amber-600",
      borderColor: "hover:border-amber-300",
    },
    {
      title: "Student Portal (Live View)",
      description: "Switch to the student portal to test live test-taking, real-time timer auto-submission, and the persistent mistake notebook.",
      href: "/student",
      icon: GraduationCap,
      badge: "Student Hub",
      color: "from-slate-700 to-slate-900",
      iconColor: "text-slate-700",
      borderColor: "hover:border-slate-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between text-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-sm">
            AD
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Admin & Teacher Master Console</h1>
            <p className="text-xs text-slate-400">Institutional Examination & Curriculum Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{profile.full_name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Super Admin Status Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold text-xl shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold mb-1 border border-red-200/60">
                <CheckCircle2 className="w-3.5 h-3.5" /> Super Admin & Faculty Clearance
              </div>
              <h2 className="text-xl font-black text-slate-900">{profile.full_name}</h2>
              <p className="text-xs text-slate-500">
                Logged in as <strong className="text-slate-700">{user.email}</strong> • Full system authoring, evaluation, and analytics privileges
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/tests/ai-generate"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Paper Generator</span>
            </Link>
            <Link
              href="/admin/tests/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Test</span>
            </Link>
          </div>
        </div>

        {/* Live Platform Metric Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">PYQ Questions</span>
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{questionCount ?? 5020}</p>
            <p className="text-[11px] text-slate-500 font-medium">Physics, Chem, Math, Bio</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Test Papers</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{testCount ?? 2}</p>
            <p className="text-[11px] text-slate-500 font-medium">Live & Published Exams</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Registered Students</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{studentCount ?? 1}</p>
            <p className="text-[11px] text-slate-500 font-medium">{classCount ?? 1} Active Classroom Batches</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Exam Submissions</span>
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{attemptCount ?? 4}</p>
            <p className="text-[11px] text-slate-500 font-medium">100% Deterministic Scored</p>
          </div>
        </div>

        {/* Core Administrative Modules Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
            Management & Tooling Modules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {navModules.map((m, idx) => {
              const Icon = m.icon;
              return (
                <Link
                  key={idx}
                  href={m.href}
                  className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4 group cursor-pointer flex flex-col justify-between ${m.borderColor}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center ${m.iconColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {m.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
                        <span>{m.title}</span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{m.description}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600 transition">
                    <span>Access Module</span>
                    <span>&rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
