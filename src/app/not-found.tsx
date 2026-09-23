import React from "react";
import Link from "next/link";
import {
  FileQuestion,
  Home,
  GraduationCap,
  Users,
  Compass,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400 shadow-inner">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-full">
            404 Error
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-400">
            The page, test paper, or exam session you requested doesn't exist or is no longer available.
          </p>
        </div>

        <div className="pt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
          <Link
            href="/"
            className="flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition group"
          >
            <Home className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
            <div>
              <div className="text-xs font-semibold text-white">Home Page</div>
              <div className="text-[11px] text-slate-400">Platform overview</div>
            </div>
          </Link>

          <Link
            href="/student"
            className="flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition group"
          >
            <GraduationCap className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
            <div>
              <div className="text-xs font-semibold text-white">Student Portal</div>
              <div className="text-[11px] text-slate-400">Exams & analytics</div>
            </div>
          </Link>

          <Link
            href="/teacher"
            className="flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition group"
          >
            <Users className="w-5 h-5 text-slate-400 group-hover:text-amber-400" />
            <div>
              <div className="text-xs font-semibold text-white">Teacher Hub</div>
              <div className="text-[11px] text-slate-400">Class & test manager</div>
            </div>
          </Link>

          <Link
            href="/admin/tests"
            className="flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition group"
          >
            <Compass className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
            <div>
              <div className="text-xs font-semibold text-white">Test Catalog</div>
              <div className="text-[11px] text-slate-400">Browse mock tests</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
