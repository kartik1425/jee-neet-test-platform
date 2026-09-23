"use client";

import { useActionState, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUpAction } from "@/lib/auth/actions";
import { UserPlus, Lock, Mail, User, BookOpen, AlertCircle, Shield, Eye, EyeOff, ArrowRight } from "lucide-react";

function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || "";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 relative overflow-hidden">
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

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 relative z-10">
        {/* Tab switch between Sign In and Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <Link
            href="/login"
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

        {state?.error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
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
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
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
                defaultValue="JEE_MAIN"
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
              <span>Creating Account...</span>
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

