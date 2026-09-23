"use client";

import React, { useState, useTransition, useRef } from "react";
import { LatexRenderer } from "@/components/LatexRenderer";
import {
  extractQuestionsFromMediaAction,
  createAndAddBulkQuestionsToTestAction,
} from "@/lib/tests/actions";
import {
  Camera,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Edit3,
  Check,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface MediaQuestionExtractorModalProps {
  testId: string;
  examType: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export function MediaQuestionExtractorModal({
  testId,
  examType,
  isOpen,
  onClose,
  onSuccess,
}: MediaQuestionExtractorModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    mimeType: string;
    base64: string;
    previewUrl: string | null;
  } | null>(null);

  const [defaultSubject, setDefaultSubject] = useState("Physics");
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const isImg = file.type.startsWith("image/");
      setSelectedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        mimeType: file.type || "image/jpeg",
        base64,
        previewUrl: isImg ? base64 : null,
      });
      setStatusMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = () => {
    if (!selectedFile) {
      setStatusMessage({ text: "Please upload an image or PDF first.", isError: true });
      return;
    }

    setStatusMessage({ text: "AI is scanning document & converting mathematical formulas...", isError: false });
    startTransition(async () => {
      const res = await extractQuestionsFromMediaAction(
        selectedFile.base64,
        selectedFile.mimeType,
        { examType, defaultSubject }
      );

      if (res.success && res.questions && res.questions.length > 0) {
        setExtractedQuestions(res.questions);
        setStatusMessage({
          text: `Successfully extracted ${res.questions.length} question(s) with LaTeX equations!`,
          isError: false,
        });
      } else {
        setStatusMessage({
          text: "Could not extract questions from this file. Please ensure text is clear and readable.",
          isError: true,
        });
      }
    });
  };

  const handleAddAllToTest = () => {
    if (extractedQuestions.length === 0) return;

    setStatusMessage({ text: "Inserting questions into test paper...", isError: false });
    startTransition(async () => {
      const res = await createAndAddBulkQuestionsToTestAction(testId, extractedQuestions);
      if (res.success) {
        onSuccess(res.addedCount || extractedQuestions.length);
        onClose();
      } else {
        setStatusMessage({ text: res.error || "Failed to add questions to test.", isError: true });
      }
    });
  };

  const handleRemoveExtracted = (idx: number) => {
    setExtractedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateOption = (qIdx: number, optKey: string, newText: string) => {
    setExtractedQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = q.options.map((o: any) =>
          o.option_key === optKey ? { ...o, content_latex: newText } : o
        );
        return { ...q, options: newOpts };
      })
    );
  };

  const handleSetCorrectKey = (qIdx: number, correctKey: "A" | "B" | "C" | "D") => {
    setExtractedQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = q.options.map((o: any) => ({
          ...o,
          is_correct: o.option_key === correctKey,
        }));
        return { ...q, correct_option_key: correctKey, options: newOpts };
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                AI Multimodal Question Extractor
              </h3>
              <p className="text-xs text-slate-500">
                Upload Question PDF or Camera Photo to automatically extract LaTeX formulas & options
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload & Context Controls */}
          {extractedQuestions.length === 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* File Upload Drop Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl p-6 text-center bg-purple-50/40 hover:bg-purple-50 transition cursor-pointer flex flex-col items-center justify-center space-y-2 min-h-[160px]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-purple-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Choose PDF or Image File
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supports PDF, PNG, JPG, WebP sheets
                    </span>
                  </div>
                </div>

                {/* Camera Capture Option */}
                <div
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-6 text-center bg-indigo-50/40 hover:bg-indigo-50 transition cursor-pointer flex flex-col items-center justify-center space-y-2 min-h-[160px]"
                >
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-indigo-600 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Capture from Camera
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Snap photo of printed question or whiteboard
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject Hint & Target Setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primary Subject Context:</label>
                  <select
                    value={defaultSubject}
                    onChange={(e) => setDefaultSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selected File:</label>
                  <p className="text-slate-600 p-2 bg-white rounded-xl border border-slate-200 truncate font-mono text-[11px]">
                    {selectedFile ? `${selectedFile.name} (${selectedFile.size})` : "No file chosen yet"}
                  </p>
                </div>
              </div>

              {selectedFile?.previewUrl && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block mb-2">Image Preview</span>
                  <img
                    src={selectedFile.previewUrl}
                    alt="Question Sheet Preview"
                    className="max-h-56 mx-auto rounded-xl border border-slate-200 object-contain shadow-xs"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Extracted Questions Review Sheet */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {extractedQuestions.length} Questions Extracted by AI • Review & Edit before adding:
                </span>
                <button
                  onClick={() => setExtractedQuestions([])}
                  className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Upload Another Document
                </button>
              </div>

              <div className="space-y-4">
                {extractedQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 relative"
                  >
                    <button
                      onClick={() => handleRemoveExtracted(qIdx)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Discard Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                        Q{qIdx + 1} • {q.suggested_subject_name || defaultSubject}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {q.suggested_chapter_name || "Mechanics"}
                      </span>
                    </div>

                    {/* Question Statement with LaTeX Preview */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Question Statement (LaTeX formatted):
                      </label>
                      <textarea
                        value={q.question_latex}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExtractedQuestions((prev) =>
                            prev.map((item, i) => (i === qIdx ? { ...item, question_latex: val } : item))
                          );
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono"
                        rows={2}
                      />
                      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                        <span className="text-[10px] text-slate-400 block mb-1">Live Math Preview:</span>
                        <LatexRenderer content={q.question_latex} />
                      </div>
                    </div>

                    {/* 4 Options */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase block">
                        Options & Answer Key (Select correct option):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt: any) => {
                          const isCorrect = q.correct_option_key === opt.option_key;
                          return (
                            <div
                              key={opt.option_key}
                              className={`p-3 rounded-xl border flex items-start gap-2.5 transition ${
                                isCorrect
                                  ? "bg-emerald-50/80 border-emerald-300"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={isCorrect}
                                onChange={() => handleSetCorrectKey(qIdx, opt.option_key)}
                                className="mt-1 accent-emerald-600 cursor-pointer"
                              />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-700">
                                    Option {opt.option_key}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                                      Correct Key
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={opt.content_latex}
                                  onChange={(e) =>
                                    handleUpdateOption(qIdx, opt.option_key, e.target.value)
                                  }
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                                />
                                <div className="text-[11px] text-slate-600">
                                  <LatexRenderer content={opt.content_latex} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.isError
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {statusMessage.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          {extractedQuestions.length === 0 ? (
            <button
              onClick={handleExtract}
              disabled={!selectedFile || isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm shadow-purple-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Questions with AI</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleAddAllToTest}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Paper...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Add {extractedQuestions.length} Questions to Paper</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
