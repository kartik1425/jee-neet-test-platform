"use client";

import { useActionState, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUpAction } from "@/lib/auth/actions";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { UserPlus, Lock, Mail, User, BookOpen, AlertCircle, Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

function SignUpForm() {
  const [state, formAction, isServerPending] = useActionState(signUpAction, null);
  const [isClientPending, startClientTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetExam, setTargetExam] = useState("JEE_MAIN");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [clientSuccess, setClientSuccess] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || "";

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) return;

    if (password.length < 6) {
      setClientError("Password must be at least 6 characters.");
      return;
    }

    setClientError(null);
    setClientSuccess(null);

    startClientTransition(async () => {
      try {
        const supabase = createBrowserClient();

        // 1. Client-side sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              target_exam: targetExam,
              role: "STUDENT",
            },
          },
        });

        if (signUpError) {
          setClientError(signUpError.message);
          return;
        }

        // 2. Ensure profile record is inserted/updated
        if (signUpData.user) {
          try {
            await supabase.from("profiles").upsert({
              id: signUpData.user.id,
              email: signUpData.user.email || email.trim(),
              full_name: fullName.trim(),
              role: "STUDENT",
              target_exam: targetExam,
            });
          } catch (pErr) {
            console.warn("Client profile upsert note:", pErr);
          }
        }

        // 3. If session is immediately active, navigate directly to portal
        if (signUpData.session) {
          const redirectPath = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : "/student";
          window.location.href = redirectPath;
          return;
        }

        // 4. If session wasn't active, try instant sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInData?.session) {
          const redirectPath = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : "/student";
          window.location.href = redirectPath;
          return;
        }

        // 5. If Supabase email confirmation is enforced, show clear confirmation guidance
        setClientSuccess(
          "Registration successful! Please check your email to verify your address, then sign in."
        );
      } catch (err: any) {
        console.error("Client signup error, falling back:", err);
        const formData = new FormData();
        formData.append("fullName", fullName);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("targetExam", targetExam);
        if (returnTo) formData.append("returnTo", returnTo);
        formAction(formData);
      }
    });
  };

  const isPending = isServerPending || isClientPending;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-slate-50 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
            EX
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            JEE & NEET AI Platform
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-5 sm:p-8 space-y-5 relative z-10">
        {/* Tab switch between Sign In and Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <Link
            href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}
            className="py-2 rounded-xl text-slate-500 hover:text-slate-900 text-center transition"
          >
            Sign In
          </Link>
          <button
            type="button"
            className="py-2 rounded-xl bg-white text-slate-900 shadow-xs"
          >
            Create Account
          </button>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Create Student Account
          </h1>
          <p className="text-xs text-slate-500">
            Start taking authentic NTA mock tests and tracking AI diagnostics.
          </p>
        </div>

        {(clientError || state?.error) && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{clientError || state?.error}</span>
          </div>
        )}

        {clientSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{clientSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSignUpSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rohan Sharma"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            {state?.fieldErrors?.fullName && (
              <p className="text-xs text-red-600">{state.fieldErrors.fullName[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rohan@school.edu"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            {state?.fieldErrors?.email && (
              <p className="text-xs text-red-600">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {state?.fieldErrors?.password && (
              <p className="text-xs text-red-600">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Target Examination
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <select
                name="targetExam"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              >
                <option value="JEE_MAIN">JEE Main (Engineering)</option>
                <option value="JEE_ADV">JEE Advanced (IITs)</option>
                <option value="NEET">NEET UG (Medical)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}
            className="text-blue-600 font-bold hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
