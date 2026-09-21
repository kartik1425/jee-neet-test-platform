"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IngestionBatch, IngestionItem } from "@/types/ingestion";
import {
  updateIngestionItemAction,
  approveIngestionItemAction,
  rejectIngestionItemAction,
  importApprovedBatchQuestionsAction,
} from "@/lib/ingestion/actions";
import { LatexRenderer } from "@/components/LatexRenderer";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  ExternalLink,
  FileText,
  Import,
  Layers,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface SubjectTaxonomyOption {
  id: string;
  name: string;
  chapters: { id: string; name: string }[];
}

interface BatchReviewWorkspaceProps {
  batch: IngestionBatch;
  initialItems: IngestionItem[];
  taxonomy: SubjectTaxonomyOption[];
}

export function BatchReviewWorkspace({
  batch,
  initialItems,
  taxonomy,
}: BatchReviewWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState<IngestionItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "NEEDS_REVIEW" | "VALIDATED" | "DUPLICATE" | "APPROVED" | "IMPORTED"
  >("ALL");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const filteredItems = items.filter((item) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "NEEDS_REVIEW") return item.status === "NEEDS_REVIEW";
    if (activeTab === "VALIDATED") return item.status === "VALIDATED";
    if (activeTab === "DUPLICATE") return item.duplicate_status === "DUPLICATE";
    if (activeTab === "APPROVED") return item.status === "APPROVED";
    if (activeTab === "IMPORTED") return item.status === "IMPORTED";
    return true;
  });

  const approvedCount = items.filter((i) => i.status === "APPROVED").length;

  const handleStartEdit = (item: IngestionItem) => {
    setEditingItemId(item.id);
    setEditFormData({
      extracted_latex: item.extracted_latex,
      options: [...item.options],
      correct_option_key: item.correct_option_key || "A",
      explanation_latex: item.explanation_latex || "",
      exam_type: item.exam_type,
      subject_id: item.subject_id || taxonomy[0]?.id || "",
      chapter_id: item.chapter_id || taxonomy[0]?.chapters[0]?.id || "",
      topic_id: item.topic_id || null,
      difficulty: item.difficulty,
      source_type: item.source_type,
      pyq_year: item.pyq_year || null,
      pyq_shift: item.pyq_shift || "",
      pyq_provenance_status: item.pyq_provenance_status,
    });
  };

  const handleSaveEdit = (itemId: string) => {
    startTransition(async () => {
      const result = await updateIngestionItemAction(itemId, editFormData);
      if (result.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  ...editFormData,
                  status: result.status,
                  validation_errors: [],
                }
              : item
          )
        );
        setEditingItemId(null);
        setNotification({ type: "success", message: "Question changes saved." });
      } else {
        setNotification({ type: "error", message: result.error || "Failed to save." });
      }
    });
  };

  const handleApprove = (itemId: string) => {
    startTransition(async () => {
      const result = await approveIngestionItemAction(itemId);
      if (result.success) {
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, status: "APPROVED" } : item))
        );
        setNotification({ type: "success", message: "Question approved for import." });
      } else {
        setNotification({ type: "error", message: result.error || "Approval failed." });
      }
    });
  };

  const handleReject = (itemId: string) => {
    startTransition(async () => {
      const result = await rejectIngestionItemAction(itemId);
      if (result.success) {
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, status: "REJECTED" } : item))
        );
        setNotification({ type: "success", message: "Question marked rejected." });
      } else {
        setNotification({ type: "error", message: result.error || "Failed to reject." });
      }
    });
  };

  const handleImportAllApproved = () => {
    if (approvedCount === 0) return;

    startTransition(async () => {
      const result = await importApprovedBatchQuestionsAction(batch.id);
      if (result.success) {
        setNotification({
          type: "success",
          message: `Successfully imported ${result.importedCount} questions into the live Question Bank!`,
        });
        router.refresh();
      } else {
        setNotification({ type: "error", message: result.error || "Import failed." });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/ingestion"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Ingestion Batches</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">{batch.title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {batch.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            File: {batch.source_filename} • Rights: {batch.rights_declaration.replace("_", " ")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleImportAllApproved}
            disabled={approvedCount === 0 || isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Import className="w-4 h-4" />
            )}
            <span>Import Approved ({approvedCount}) into Question Bank</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto max-w-full">
        {[
          { id: "ALL", label: "All Items", count: items.length },
          {
            id: "NEEDS_REVIEW",
            label: "Needs Review",
            count: items.filter((i) => i.status === "NEEDS_REVIEW").length,
          },
          {
            id: "VALIDATED",
            label: "Valid / Ready",
            count: items.filter((i) => i.status === "VALIDATED").length,
          },
          {
            id: "DUPLICATE",
            label: "Duplicates",
            count: items.filter((i) => i.duplicate_status === "DUPLICATE").length,
          },
          {
            id: "APPROVED",
            label: "Approved",
            count: items.filter((i) => i.status === "APPROVED").length,
          },
          {
            id: "IMPORTED",
            label: "Imported",
            count: items.filter((i) => i.status === "IMPORTED").length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? "bg-slate-100 text-slate-700" : "bg-slate-200/60 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-white border border-slate-200 text-xs text-slate-400">
            No questions match the selected filter.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isEditing = editingItemId === item.id;
            const currentSub = taxonomy.find((s) => s.id === editFormData?.subject_id);
            const currentChapters = currentSub?.chapters || [];

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 transition"
              >
                {/* Item Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                      #{item.order_index}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {item.source_location_ref || `Page ${item.source_page_number || 1}`}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === "APPROVED" || item.status === "IMPORTED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "VALIDATED"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : item.status === "DUPLICATE"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing && item.status !== "IMPORTED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Side-by-Side: Raw Source on Left vs KaTeX / Structured on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT: Raw Source & Audit Findings */}
                  <div className="space-y-3 bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Original Extracted Text
                    </span>
                    <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-56 overflow-y-auto bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                      {item.raw_content}
                    </pre>

                    {/* Validation Warnings & Duplicates */}
                    {item.validation_errors && item.validation_errors.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                        <span className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Validation Attention Needed:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {item.validation_errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.duplicate_status === "DUPLICATE" && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-0.5">
                        <span className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Duplicate Match Detected
                        </span>
                        <p className="text-[11px]">
                          Matches question in bank (Similarity: {Math.round((item.similarity_score || 1) * 100)}%).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Structured & KaTeX Preview / Inline Editor */}
                  <div className="space-y-4">
                    {isEditing ? (
                      /* Inline Editor Form */
                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Question LaTeX
                          </label>
                          <textarea
                            rows={4}
                            value={editFormData.extracted_latex}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, extracted_latex: e.target.value })
                            }
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Options Editor */}
                        <div className="space-y-2">
                          <label className="font-bold text-slate-700 block">
                            Options (A, B, C, D) & Correct Key
                          </label>
                          {editFormData.options.map((opt: any, idx: number) => (
                            <div key={opt.option_key} className="flex items-center gap-2">
                              <label className="flex items-center gap-1 shrink-0 font-bold">
                                <input
                                  type="radio"
                                  name={`correct-key-${item.id}`}
                                  checked={editFormData.correct_option_key === opt.option_key}
                                  onChange={() =>
                                    setEditFormData({
                                      ...editFormData,
                                      correct_option_key: opt.option_key,
                                    })
                                  }
                                  className="text-indigo-600"
                                />
                                <span>({opt.option_key})</span>
                              </label>
                              <input
                                type="text"
                                value={opt.content_latex}
                                onChange={(e) => {
                                  const newOpts = [...editFormData.options];
                                  newOpts[idx].content_latex = e.target.value;
                                  setEditFormData({ ...editFormData, options: newOpts });
                                }}
                                className="flex-1 p-2 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Taxonomy & Metadata Selectors */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Subject</label>
                            <select
                              value={editFormData.subject_id}
                              onChange={(e) => {
                                const newSubId = e.target.value;
                                const sub = taxonomy.find((s) => s.id === newSubId);
                                setEditFormData({
                                  ...editFormData,
                                  subject_id: newSubId,
                                  chapter_id: sub?.chapters[0]?.id || "",
                                });
                              }}
                              className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
                            >
                              {taxonomy.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Chapter</label>
                            <select
                              value={editFormData.chapter_id}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, chapter_id: e.target.value })
                              }
                              className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
                            >
                              {currentChapters.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Save / Cancel Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read-Only KaTeX Preview */
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block">
                            KaTeX Rendered Preview
                          </span>
                          <div className="text-slate-900 text-sm leading-relaxed">
                            <LatexRenderer content={item.extracted_latex} />
                          </div>

                          {/* Options Preview */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            {item.options.map((opt) => (
                              <div
                                key={opt.option_key}
                                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                  opt.option_key === item.correct_option_key || opt.is_correct
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                                    : "bg-slate-50/50 border-slate-200 text-slate-700"
                                }`}
                              >
                                <span className="w-5 h-5 rounded-md bg-white border flex items-center justify-center font-bold text-[11px] shrink-0">
                                  {opt.option_key}
                                </span>
                                <span className="truncate">
                                  <LatexRenderer content={opt.content_latex} />
                                </span>
                                {(opt.option_key === item.correct_option_key || opt.is_correct) && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Metadata Tag Row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {item.suggested_subject_name && (
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                              {item.suggested_subject_name}
                            </span>
                          )}
                          {item.suggested_chapter_name && (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                              {item.suggested_chapter_name}
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                            {item.difficulty}
                          </span>
                          {item.pyq_year && (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                              PYQ {item.pyq_year} {item.pyq_shift || ""}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
