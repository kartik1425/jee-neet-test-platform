import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  LogIn,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface JoinPageProps {
  params: Promise<{
    testId: string;
  }>;
}

export default async function ExamJoinPage({ params }: JoinPageProps) {
  const { testId } = await params;
  const supabase = await createClient();

  // 1. Fetch Test Information
  const { data: test, error } = await supabase
    .from("tests")
    .select(`
      id, title, description, instructions, exam_type, test_mode, duration_minutes,
      total_marks, marking_scheme, status, start_time, end_time,
      test_questions (count)
    `)
    .eq("id", testId)
    .single();

  if (error || !test) {
    notFound();
  }

  // 2. Check Authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const questionCount = test.test_questions?.[0]?.count || 0;
  const marking = test.marking_scheme as any;

  // If user is already logged in, show direct Start Lobby
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, target_exam")
      .eq("id", user.id)
      .single();

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-xl w-full p-8 space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Take Test
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">{test.title}</h1>
            {test.description && <p className="text-xs text-slate-500">{test.description}</p>}
          </div>

          {/* Student Badge */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{profile?.full_name || "Student"}</p>
                <p className="text-[11px] text-slate-500">{user.email}</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {test.exam_type}
            </span>
          </div>

          {/* Test Specs Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
              <Clock className="w-4 h-4 text-slate-400 mx-auto" />
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration</span>
              <strong className="text-sm text-slate-900">{test.duration_minutes} Mins</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
              <BookOpen className="w-4 h-4 text-slate-400 mx-auto" />
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Questions</span>
              <strong className="text-sm text-slate-900">{questionCount} Qs</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
              <Award className="w-4 h-4 text-slate-400 mx-auto" />
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Marking</span>
              <strong className="text-sm text-slate-900">+{marking?.correct || 4} / {marking?.incorrect ?? -1}</strong>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <span className="font-bold block text-amber-950">Examination Instructions:</span>
            <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
              <li>The server-authoritative timer begins immediately upon clicking &quot;Start Exam&quot;.</li>
              <li>Questions are saved automatically on answer selection.</li>
              <li>Calculators and external resources are prohibited.</li>
            </ul>
          </div>

          {/* Action Button */}
          <Link
            href={`/exam/start/${test.id}`}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <span>Start Exam Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // If user is NOT logged in, show seamless join & login card
  const returnUrl = `/exam/join/${test.id}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-8 space-y-6 text-center animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto font-bold shadow-xs">
          <BookOpen className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            {test.exam_type} Official Assessment
          </span>
          <h1 className="text-xl font-black text-slate-900 leading-snug">{test.title}</h1>
          <p className="text-xs text-slate-500">
            {questionCount} Questions • {test.duration_minutes} Mins • {test.total_marks} Marks
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">You have been invited to take this examination.</p>
          <p className="text-[11px] text-slate-500">Please sign in or create an account to start your exam.</p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href={`/login?returnTo=${encodeURIComponent(returnUrl)}`}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Start Exam</span>
          </Link>

          <Link
            href={`/signup?returnTo=${encodeURIComponent(returnUrl)}`}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition block"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}
