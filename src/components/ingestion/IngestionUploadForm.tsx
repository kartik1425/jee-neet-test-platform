"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IngestionRightsDeclaration } from "@/types/ingestion";
import { createIngestionBatchAction } from "@/lib/ingestion/actions";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";

interface SubjectOption {
  id: string;
  name: string;
  chapters: { id: string; name: string }[];
}

interface IngestionUploadFormProps {
  taxonomy: SubjectOption[];
}

export function IngestionUploadForm({ taxonomy }: IngestionUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [rightsDeclaration, setRightsDeclaration] = useState<IngestionRightsDeclaration>("OWN_CONTENT");
  const [fileType, setFileType] = useState<"TEXT" | "CSV" | "PDF" | "DOCX">("TEXT");
  const [examType, setExamType] = useState<"JEE_MAIN" | "JEE_ADV" | "NEET" | "GENERIC">("JEE_MAIN");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [textContent, setTextContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentSubject = taxonomy.find((s) => s.id === selectedSubjectId);
  const availableChapters = currentSubject?.chapters || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextContent(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCsv = () => {
    setTitle("JEE Main Physics PYQs Sample");
    setFileType("CSV");
    setExamType("JEE_MAIN");
    setTextContent(`Question,Option A,Option B,Option C,Option D,Correct Answer,Solution,Exam,Year,Subject,Chapter,Difficulty
"A particle moves in a circle of radius $r = 2\\text{ m}$ with constant speed $v = 4\\text{ m/s}$. Find centripetal acceleration.","4 $\\text{m/s}^2$","8 $\\text{m/s}^2$","16 $\\text{m/s}^2$","2 $\\text{m/s}^2$",B,"Centripetal acceleration $a_c = \\frac{v^2}{r} = \\frac{16}{2} = 8\\text{ m/s}^2$.",JEE_MAIN,2023,Physics,Kinematics,EASY
"Calculate the work done by a force $\\vec{F} = (2\\hat{i} + 3\\hat{j})\\text{ N}$ displacing a body by $\\vec{d} = (4\\hat{i} + 2\\hat{j})\\text{ m}$.","14 J","8 J","6 J","20 J",A,"$W = \\vec{F} \\cdot \\vec{d} = (2)(4) + (3)(2) = 8 + 6 = 14\\text{ J}$.",JEE_MAIN,2024,Physics,Kinematics,MEDIUM`);
  };

  const handleLoadSampleText = () => {
    setTitle("NEET Chemistry Rapid Drill 2024");
    setFileType("TEXT");
    setExamType("NEET");
    setTextContent(`Q1. What is the pH of a $10^{-3}\\text{ M}$ aqueous solution of $\\text{HCl}$ at $25^\\circ\\text{C}$?
(A) 3
(B) 11
(C) 7
(D) 1
Ans: A
Solution: For strong acid $\\text{HCl}$, $[\\text{H}^+] = 10^{-3}\\text{ M}$. Hence $\\text{pH} = -\\log_{10}(10^{-3}) = 3$.

Q2. Find the molar mass of heavy water $\\text{D}_2\\text{O}$ where atomic mass of $\\text{D} = 2\\text{ u}$ and $\\text{O} = 16\\text{ u}$.
(A) $18\\text{ g/mol}$
(B) $20\\text{ g/mol}$
(C) $22\\text{ g/mol}$
(D) $19\\text{ g/mol}$
Ans: B
Solution: $\\text{Molar mass} = 2(2) + 16 = 20\\text{ g/mol}$.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Please enter an ingestion batch title.");
      return;
    }
    if (!textContent.trim()) {
      setErrorMessage("Please provide question text or upload a document.");
      return;
    }

    startTransition(async () => {
      const result = await createIngestionBatchAction({
        title,
        rightsDeclaration,
        fileType,
        examType,
        defaultSubjectId: selectedSubjectId || null,
        defaultChapterId: selectedChapterId || null,
        textContent,
      });

      if (!result.success || !result.batchId) {
        setErrorMessage(result.error || "Failed to process document.");
      } else {
        router.push(`/admin/ingestion/${result.batchId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/ingestion"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ingestion Batches</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-indigo-600" />
          <span>AI Question Ingestion & Document Parser</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload question papers, PYQ compilations, or CSVs. Extracts math formulas into KaTeX, tags taxonomy, and stages for review.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload Inputs (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">1. Batch Details & Rights Declaration</h2>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Batch Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Allen 2024 Full Mock Physics Session 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Source Rights Declaration *
                </label>
                <select
                  value={rightsDeclaration}
                  onChange={(e) => setRightsDeclaration(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="OWN_CONTENT">Original / Faculty Authored</option>
                  <option value="SCHOOL_PROVIDED">School / Institute Material</option>
                  <option value="LICENSED">Licensed Commercial Material</option>
                  <option value="AUTHORIZED_THIRD_PARTY">Authorized Third-Party PYQ</option>
                  <option value="UNKNOWN">Unknown / Needs Audit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Examination
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="JEE_MAIN">JEE Main</option>
                  <option value="JEE_ADV">JEE Advanced</option>
                  <option value="NEET">NEET UG</option>
                  <option value="GENERIC">Standard Practice</option>
                </select>
              </div>
            </div>

            {/* Optional Default Taxonomy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Subject (Optional)
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedChapterId("");
                  }}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Auto-detect / Mixed</option>
                  {taxonomy.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Chapter (Optional)
                </label>
                <select
                  value={selectedChapterId}
                  disabled={!selectedSubjectId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">Auto-detect / Mixed</option>
                  {availableChapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Document Content Input */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">2. Document Input</h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleText}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Load Sample Text
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleLoadSampleCsv}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Load Sample CSV
                </button>
              </div>
            </div>

            {/* Format Selector */}
            <div className="flex items-center gap-2">
              {[
                { id: "TEXT", label: "Text / Word", icon: FileText },
                { id: "CSV", label: "CSV Spreadsheet", icon: FileSpreadsheet },
                { id: "PDF", label: "PDF Extraction", icon: Upload },
              ].map((fmt) => {
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFileType(fmt.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      fileType === fmt.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{fmt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* File Upload Trigger */}
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 text-center space-y-2">
              <input
                type="file"
                id="file-upload"
                accept=".txt,.csv,.doc,.docx,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Document File</span>
              </label>
              <p className="text-[11px] text-slate-400">Supports .txt, .csv, .docx, .pdf</p>
            </div>

            {/* Direct Textarea */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Document Text Content
              </label>
              <textarea
                rows={12}
                required
                placeholder={`Paste question text here with Q1, options (A)-(D), Answer, and Solution.\n\nExample:\nQ1. A body of mass $m = 5\\text{ kg}$ is dropped from height $h = 20\\text{ m}$. Find its velocity just before hitting the ground ($g = 10\\text{ m/s}^2$).\n(A) $10\\text{ m/s}$\n(B) $20\\text{ m/s}$\n(C) $30\\text{ m/s}$\n(D) $40\\text{ m/s}$\nAns: B\nSolution: $v = \\sqrt{2gh} = \\sqrt{2 \\times 10 \\times 20} = 20\\text{ m/s}$.`}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Info & Safety Principles (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safety & Review Guarantees</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">1. Staged Extraction</span>
                <p className="text-[11px] text-slate-500">
                  Questions are extracted into a private staging queue. Nothing enters the live question bank automatically.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">2. LaTeX Math Normalization</span>
                <p className="text-[11px] text-slate-500">
                  Formulas, integrals, Greek letters, and fractions are converted to standard KaTeX.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">3. Multi-Tier Duplicate Check</span>
                <p className="text-[11px] text-slate-500">
                  Compares incoming questions against existing question-bank records and within the batch.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">4. Mandatory Human Approval</span>
                <p className="text-[11px] text-slate-500">
                  Teachers must review answer keys and taxonomy before committing items to the question bank.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Parsing & Staging Document...</span>
                </>
              ) : (
                <>
                  <span>Process & Stage for Review</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
