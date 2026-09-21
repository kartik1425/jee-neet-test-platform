import Link from "next/link";
import { GraduationCap, ShieldCheck, Cpu, CheckCircle2, UserCheck, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-6xl mx-auto w-full">
      <div className="text-center space-y-4 max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase">
          <ShieldCheck className="w-4 h-4" /> Production-Grade Assessment Engine
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Private AI-Powered <span className="text-blue-600">JEE & NEET</span> Practice Platform
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          High-fidelity examination environment with authoritative server timing, deterministic scoring, and granular diagnostic analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Authentic NTA Exam Engine</h3>
          <p className="text-sm text-slate-600">
            MCQ question palette, state persistence, autosave, and crash recovery with server-authoritative timers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Deterministic Scoring</h3>
          <p className="text-sm text-slate-600">
            Test-level configurable marking schemes ($+4/-1$) evaluated purely by deterministic backend code.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">AI Diagnostic Intelligence</h3>
          <p className="text-sm text-slate-600">
            Asynchronous 6-part deep analysis, mistake taxonomy classification, weak-topic detection, and adaptive follow-up papers.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow transition"
        >
          <Lock className="w-4 h-4" /> Sign In to Portal
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm transition"
        >
          <UserCheck className="w-4 h-4" /> Create Student Account
        </Link>
      </div>

      <div className="mt-8 flex items-center gap-6 text-xs text-slate-500">
        <Link href="/student" className="hover:text-slate-800 hover:underline">Student Route</Link>
        <span>•</span>
        <Link href="/teacher" className="hover:text-slate-800 hover:underline">Teacher Route</Link>
        <span>•</span>
        <Link href="/admin" className="hover:text-slate-800 hover:underline">Admin Route</Link>
      </div>
    </main>
  );
}
