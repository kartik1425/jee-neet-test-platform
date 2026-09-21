import React from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getQuestionById } from "@/lib/questions/actions";
import { getTaxonomyTree } from "@/lib/questions/taxonomy";
import { QuestionAuthorForm } from "@/components/QuestionAuthorForm";

export const dynamic = "force-dynamic";

interface EditQuestionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  await requireRole(["TEACHER", "ADMIN"]);
  const resolvedParams = await params;
  const [question, taxonomy] = await Promise.all([
    getQuestionById(resolvedParams.id),
    getTaxonomyTree(),
  ]);

  if (!question) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Question</h1>
          <p className="text-sm text-slate-500">
            Modify question parameters, LaTeX formulation, or option keys.
          </p>
        </div>

        <QuestionAuthorForm
          taxonomy={taxonomy.subjects}
          initialData={question}
          mode="edit"
        />
      </div>
    </div>
  );
}
