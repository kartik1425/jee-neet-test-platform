import { requireRole } from "@/lib/auth/session";
import { getIngestionBatchesList } from "@/lib/ingestion/actions";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminIngestionBatchesPage() {
  await requireRole(["TEACHER", "ADMIN"]);
  const batches = await getIngestionBatchesList();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REVIEW":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PROCESSING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "FAILED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
              <Link href="/admin/questions" className="hover:text-slate-900 transition">
                Question Bank
              </Link>
              <span>/</span>
              <span>AI Ingestion</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-indigo-600" />
              <span>AI Question Ingestion & Staging</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload documents, review structured LaTeX formulas, verify answer keys, and import into question bank.
            </p>
          </div>

          <Link
            href="/admin/ingestion/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Ingestion Batch</span>
          </Link>
        </div>

        {/* Batches Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          {batches.length === 0 ? (
            <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No ingestion batches yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload a question paper, mock test PDF, or CSV compilation to start staging questions.
                </p>
              </div>
              <Link
                href="/admin/ingestion/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First Batch</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Batch Title</th>
                    <th className="pb-3">Rights & Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Extracted Qs</th>
                    <th className="pb-3">Review State</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-4 pl-2 font-medium text-slate-900">
                        <div className="space-y-0.5">
                          <Link
                            href={`/admin/ingestion/${batch.id}`}
                            className="font-bold text-slate-900 group-hover:text-indigo-600 transition text-sm block"
                          >
                            {batch.title}
                          </Link>
                          <span className="text-[11px] text-slate-400">{batch.source_filename}</span>
                        </div>
                      </td>

                      <td className="py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {batch.file_type}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {batch.rights_declaration.replace("_", " ")}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            batch.status
                          )}`}
                        >
                          {batch.status}
                        </span>
                      </td>

                      <td className="py-4 whitespace-nowrap font-bold text-slate-800 text-sm">
                        {batch.total_items_count} Qs
                      </td>

                      <td className="py-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-700 font-semibold" title="Valid">
                            {batch.valid_items_count} Valid
                          </span>
                          <span>•</span>
                          <span
                            className={batch.needs_review_count > 0 ? "text-amber-700 font-bold" : "text-slate-400"}
                            title="Needs Review"
                          >
                            {batch.needs_review_count} Review
                          </span>
                          {batch.duplicate_items_count > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-rose-600 font-bold" title="Duplicates">
                                {batch.duplicate_items_count} Dup
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-4 text-slate-500 whitespace-nowrap">
                        {formatDate(batch.created_at)}
                      </td>

                      <td className="py-4 pr-2 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/ingestion/${batch.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
                        >
                          <span>Review Batch</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
