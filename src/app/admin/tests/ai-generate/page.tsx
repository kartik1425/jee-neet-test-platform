import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AITestGeneratorWorkspace } from "@/components/tests/AITestGeneratorWorkspace";

export const dynamic = "force-dynamic";

export default async function AITestGeneratorPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/tests"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Test Management</span>
          </Link>
        </div>

        {/* Studio Workspace */}
        <AITestGeneratorWorkspace />
      </div>
    </div>
  );
}
