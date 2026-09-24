"use client";

import { useActionState, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/lib/auth/actions";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { LogIn, Lock, Mail, AlertCircle, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const [state, formAction, isServerPending] = useActionState(loginAction, null);
  const [isClientPending, startClientTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || "";

  const executeFastLogin = async (targetEmail: string, targetPass: string, roleLabel?: string) => {
    setClientError(null);
    if (roleLabel) setAutoSubmitting(roleLabel);

    startClientTransition(async () => {
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: targetPass,
        });

        if (error || !data.user) {
          // Fallback to server action
          const formData = new FormData();
          formData.append("email", targetEmail);
          formData.append("password", targetPass);
          if (returnTo) formData.append("returnTo", returnTo);
          formAction(formData);
          return;
        }

        const role = (data.user.user_metadata?.role || data.user.app_metadata?.role) || "STUDENT";
        const redirectPath = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
          ? returnTo
          : role === "TEACHER"
          ? "/teacher"
          : role === "ADMIN"
          ? "/admin"
          : "/student";

        window.location.href = redirectPath;
      } catch (err: any) {
        console.error("Client login error, falling back:", err);
        const formData = new FormData();
        formData.append("email", targetEmail);
        formData.append("password", targetPass);
        if (returnTo) formData.append("returnTo", returnTo);
        formAction(formData);
      }
    });
  };

  const handleInstantDemo = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword("123456");
    executeFastLogin(demoEmail, "123456", demoRole);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    executeFastLogin(email, password);
  };

  const isLoggingIn = isServerPending || isClientPending || autoSubmitting !== null;


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
            Enter your credentials or tap a 1-click demo button below to login instantly.
          </p>
        </div>

        {/* 1-Click Fast Demo Buttons */}
        <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              ⚡ Instant 1-Click Demo Login:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isLoggingIn}
              onClick={() => handleInstantDemo("priyagon200@gmail.com", "Student")}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {autoSubmitting === "Student" ? (
                <span>Logging In...</span>
              ) : (
                <>
                  <span>🎓 Student Demo</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isLoggingIn}
              onClick={() => handleInstantDemo("starsea.real@gmail.com", "Teacher")}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {autoSubmitting === "Teacher" ? (
                <span>Logging In...</span>
              ) : (
                <>
                  <span>👨‍🏫 Teacher Demo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {(clientError || state?.error) && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{clientError || state?.error}</span>
          </div>
        )}

        <form action={formAction} onSubmit={handleManualSubmit} className="space-y-4">
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
            disabled={isLoggingIn}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoggingIn ? (
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

