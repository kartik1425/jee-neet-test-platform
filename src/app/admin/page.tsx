import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { ShieldAlert, LogOut, Database, FileText, Cpu, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPortalPage() {
  const session = await requireRole(["ADMIN"]);
  const { profile, user } = session;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-sm">
            AD
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Admin Console</h1>
            <p className="text-xs text-slate-400">Institutional Master Administration</p>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xl">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Super Admin Authorized
              </div>
              <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
              <p className="text-sm text-slate-500">Security Clearance: Level 3 (Unrestricted Master Access)</p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
            Master System Administration
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/questions"
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 group cursor-pointer"
          >
            <div className="flex items-center justify-between text-blue-600 font-bold text-base">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                <h3>Question Bank</h3>
              </div>
              <span className="text-xs text-blue-600 group-hover:underline">Open &rarr;</span>
            </div>
            <p className="text-sm text-slate-600">
              Manage multi-subject question taxonomy, LaTeX equations, PYQ provenance, and verified answer keys.
            </p>
          </Link>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
              <FileText className="w-5 h-5" />
              <h3>Test Authoring</h3>
            </div>
            <p className="text-sm text-slate-600">
              Create mock papers, configure test-level marking schemes ($+4/-1$), and schedule test windows.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-base">
              <Cpu className="w-5 h-5" />
              <h3>AI Orchestrator</h3>
            </div>
            <p className="text-sm text-slate-600">
              Control question ingestion pipelines, AI validation guardrails, and model provider settings.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
