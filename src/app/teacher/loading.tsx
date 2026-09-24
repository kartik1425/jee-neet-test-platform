import React from "react";

export default function TeacherPortalLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-pulse">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
            TC
          </div>
          <div className="space-y-1">
            <div className="h-4 w-32 bg-slate-200 rounded-md" />
            <div className="h-3 w-44 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-slate-200 rounded-xl" />
          <div className="h-8 w-8 bg-slate-200 rounded-xl" />
        </div>
      </header>

      {/* Main Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-44 w-full bg-slate-900/90 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="h-5 w-40 bg-white/20 rounded-full" />
          <div className="h-7 w-64 bg-white/30 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-white/10 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-7 w-16 bg-slate-300 rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
