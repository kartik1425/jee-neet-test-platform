import React from "react";
import { requireRole } from "@/lib/auth/session";
import { getTaxonomyTree } from "@/lib/questions/taxonomy";
import { QuestionAuthorForm } from "@/components/QuestionAuthorForm";

export const dynamic = "force-dynamic";

export default async function NewQuestionPage() {
  await requireRole(["TEACHER", "ADMIN"]);
  const taxonomy = await getTaxonomyTree();

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Author New Question (MCQ)</h1>
          <p className="text-sm text-slate-500">
            Create a Single-Choice MCQ for the school question bank with KaTeX LaTeX mathematical syntax.
          </p>
        </div>

        <QuestionAuthorForm taxonomy={taxonomy.subjects} mode="create" />
      </div>
    </div>
  );
}
