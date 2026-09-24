"use client";

import { useActionState, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/lib/auth/actions";
import { LogIn, Lock, Mail, AlertCircle, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || "";

  const handleFillDemoStudent = () => {
    setEmail("priyagon200@gmail.com");
    setPassword("123456");
  };

  const handleFillDemoTeacher = () => {
    setEmail("starsea.real@gmail.com");
    setPassword("123456");
  };

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
          <button
            type="button"
            className="py-2 rounded-xl bg-white text-slate-900 shadow-xs"
          >
            Sign In
          </button>
          <Link
            href="/signup"
            className="py-2 rounded-xl text-slate-500 hover:text-slate-900 text-center transition"
          >
            Create Account
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500">
            Enter your credentials or tap a 1-click demo button below to test instantly from any device.
          </p>
        </div>

        {/* 1-Click Fast Demo Fillers for Mobile / Multi-Device Testing */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Instant 1-Click Demo Accounts:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFillDemoStudent}
              className="py-2 px-2.5 rounded-xl bg-white hover:bg-blue-600 text-slate-800 hover:text-white border border-blue-200 text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
            >
              🎓 Student Demo
            </button>
            <button
              type="button"
              onClick={handleFillDemoTeacher}
              className="py-2 px-2.5 rounded-xl bg-white hover:bg-indigo-600 text-slate-800 hover:text-white border border-indigo-200 text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
            >
              👨‍🏫 Teacher Demo
            </button>
          </div>
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
                placeholder="student@school.edu"
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
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Need a student account?{" "}
          <Link
            href={returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : "/signup"}
            className="text-blue-600 font-bold hover:underline"
          >
            Register for free
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

