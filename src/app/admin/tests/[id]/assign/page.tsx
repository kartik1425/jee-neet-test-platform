import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getTestDetailForAdmin, assignTestToClassAction, assignTestToStudentAction } from "@/lib/tests/actions";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, UserPlus, Users, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface AssignPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminTestAssignPage({ params }: AssignPageProps) {
  await requireRole(["TEACHER", "ADMIN"]);
  const resolvedParams = await params;
  const test = await getTestDetailForAdmin(resolvedParams.id);

  if (!test) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: classes }, { data: students }] = await Promise.all([
    supabase.from("classes").select("id, name, grade").order("name"),
    supabase.from("profiles").select("id, full_name, email").eq("role", "STUDENT").order("full_name"),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/admin/tests/${test.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Test Editor
          </Link>
          <span className="text-xs font-semibold text-slate-500">
            {test.title} • ({test.assignments.length} Assignments)
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Assign Test Paper</h1>
          <p className="text-sm text-slate-500">
            Schedule this examination for an entire class batch or individual students.
          </p>
        </div>

        {/* Assignment Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Class Assignment */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-4 h-4 text-blue-600" /> Assign to Entire Class
            </h3>

            <form
              action={async (formData: FormData) => {
                "use server";
                const classId = formData.get("classId") as string;
                const dueAt = formData.get("dueAt") as string;
                if (classId) {
                  await assignTestToClassAction(test.id, classId, dueAt || null);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Class Batch</label>
                <select
                  name="classId"
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                >
                  <option value="">-- Choose Class --</option>
                  {(classes || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Due Date / Deadline (Optional)</label>
                <input
                  name="dueAt"
                  type="datetime-local"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Assign to Class Batch
              </button>
            </form>
          </div>

          {/* Individual Student Assignment */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-4 h-4 text-indigo-600" /> Assign to Individual Student
            </h3>

            <form
              action={async (formData: FormData) => {
                "use server";
                const studentId = formData.get("studentId") as string;
                const dueAt = formData.get("dueAt") as string;
                if (studentId) {
                  await assignTestToStudentAction(test.id, studentId, dueAt || null);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Student</label>
                <select
                  name="studentId"
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                >
                  <option value="">-- Choose Student --</option>
                  {(students || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Due Date (Optional)</label>
                <input
                  name="dueAt"
                  type="datetime-local"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Assign to Student
              </button>
            </form>
          </div>
        </div>

        {/* Existing Assignments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Active Test Assignments ({test.assignments.length})</h3>

          {test.assignments.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No classes or students assigned yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {test.assignments.map((ta) => (
                <div key={ta.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800">
                      {ta.class_name ? `Class Batch: ${ta.class_name}` : `Student: ${ta.student_name}`}
                    </span>
                  </div>
                  <span className="text-slate-400">
                    Assigned: {new Date(ta.assigned_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
