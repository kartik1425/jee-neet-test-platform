import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  UserCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  BookOpen,
  Clock,
  Award,
  Layers,
  Check,
} from "lucide-react";
import { LatexRenderer } from "@/components/LatexRenderer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              EX
            </div>
            <div>
              <span className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                JEE & NEET AI Platform
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  CBT 2026
                </span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium leading-none">
                Authentic NTA Engine & AI Diagnostics
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#patterns" className="hover:text-blue-600 transition">Exam Patterns</a>
            <a href="#preview" className="hover:text-blue-600 transition">CBT Simulator</a>
            <a href="#portals" className="hover:text-blue-600 transition">Portals</a>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/login"
              className="px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition transform hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 px-4 sm:px-8">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-gradient-to-tr from-blue-400/15 via-indigo-400/15 to-purple-400/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>NTA-Grade Online Examination & AI Mastery</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Master JEE & NEET with{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Authentic CBT Practice
            </span>{" "}
            & Deep AI Diagnostics
          </h1>

          <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            The next-generation assessment platform engineered for engineering & medical aspirants. Experience authentic NTA question palettes, server-authoritative timers, deterministic scoring, and 6-section deep diagnostic analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/35 transition transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Start Free Student Practice</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-sm transition"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Sign In to School Portal</span>
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full JEE Main, Adv & NEET Syllabus</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Server-Authoritative Anti-Cheat Timing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>KaTeX Mathematical Formula Rendering</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mock CBT Preview Card */}
      <section id="preview" className="px-4 sm:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900 rounded-3xl p-4 sm:p-8 shadow-2xl border border-slate-800 text-white space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase">
                  JEE Main 2026 Sample
                </span>
                <span className="text-xs text-slate-400 font-medium">Physics: Rotational Dynamics</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1 rounded-xl bg-slate-800 text-emerald-400 font-bold border border-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time Left: 02:44:12
                </span>
              </div>
            </div>

            {/* Question Sample Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5 bg-slate-800/60 p-5 sm:p-6 rounded-2xl border border-slate-700/60">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-200">Question 14 of 75</span>
                  <span className="text-emerald-400 font-bold">+4 Correct / -1 Incorrect</span>
                </div>

                <div className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
                  <LatexRenderer
                    content="A solid cylinder of mass $M$ and radius $R$ rolls without slipping down an inclined plane of inclination $\theta$. What is the linear acceleration $a$ of the cylinder down the plane?"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { key: "A", latex: "a = \\frac{2}{3} g \\sin \\theta", correct: true },
                    { key: "B", latex: "a = \\frac{1}{2} g \\sin \\theta", correct: false },
                    { key: "C", latex: "a = \\frac{5}{7} g \\sin \\theta", correct: false },
                    { key: "D", latex: "a = g \\sin \\theta", correct: false },
                  ].map((opt, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                        opt.correct
                          ? "bg-blue-600/20 border-blue-500 text-blue-200"
                          : "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          opt.correct ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-xs font-medium">
                        <LatexRenderer content={opt.latex} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Palette */}
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Authentic CBT Question Palette
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 15 }).map((_, idx) => {
                      let color = "bg-slate-700 text-slate-300";
                      if (idx === 13) color = "bg-blue-600 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900";
                      else if ([0, 1, 3, 5, 8, 10].includes(idx)) color = "bg-emerald-600 text-white";
                      else if ([2, 4, 7].includes(idx)) color = "bg-amber-600 text-white";
                      else if ([6, 9].includes(idx)) color = "bg-purple-600 text-white";

                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center ${color}`}
                        >
                          {idx + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] space-y-1.5 pt-3 border-t border-slate-700 text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600" /> Answered</span>
                    <span className="font-bold text-white">6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-600" /> Not Answered</span>
                    <span className="font-bold text-white">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-600" /> Marked for Review</span>
                    <span className="font-bold text-white">2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Built for Serious Aspirants
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            High-Yield Testing & Pedagogical AI
          </h2>
          <p className="text-sm text-slate-600">
            Engineered with strict exam discipline, zero hallucinated grading, and rich diagnostic insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Authentic NTA CBT Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Full-featured question palette with 5 standard NTA states, font scaling controls, local state recovery on reload, and server-authoritative countdown timers.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Deterministic Code Scoring</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scoring is evaluated strictly by deterministic server algorithms according to customizable marking rules ($+4/-1$), guaranteeing 100% mathematical integrity.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Six-Section Deep AI Report</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Asynchronous diagnostic engine categorizes mistakes into Conceptual, Calculation, Misread, and Time-Pressure errors with evidence-backed chapter ratings.
            </p>
          </div>
        </div>
      </section>

      {/* Exam Patterns Matrix */}
      <section id="patterns" className="bg-slate-100/70 border-y border-slate-200 py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Complete Support for National Engineering & Medical Entrance
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Pre-configured test templates matching exact official syllabi and marking conventions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold">
                  JEE Main
                </span>
                <span className="text-xs font-bold text-slate-500">300 Marks</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">NTA JEE Main Paper 1</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Physics, Chemistry, and Mathematics. Single-choice MCQs and Numerical Value Questions with $+4/-1$ scoring.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Duration: 180 mins</span>
                <span>75 Questions</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-bold">
                  JEE Advanced
                </span>
                <span className="text-xs font-bold text-slate-500">Paper 1 & 2</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">IIT JEE Advanced Pattern</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-correct options, comprehension paragraphs, matrix match, and integer types with complex partial marking schemes.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Duration: 180 mins/paper</span>
                <span>Physics, Chem, Math</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                  NEET UG
                </span>
                <span className="text-xs font-bold text-slate-500">720 Marks</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">NTA NEET UG Simulator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Physics, Chemistry, Botany, and Zoology with Section A & Section B optional choice selections.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Duration: 200 mins</span>
                <span>200 Questions (180 to solve)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Navigation Portal Cards */}
      <section id="portals" className="max-w-6xl mx-auto px-4 sm:px-8 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Direct Portal Navigation</h2>
          <p className="text-xs sm:text-sm text-slate-600">Choose your workspace to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/student"
            className="group p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Student Testing Portal</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition transform group-hover:translate-x-1" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Take assigned mock tests, create customized private practice drills, and inspect AI scorecards.
            </p>
          </Link>

          <Link
            href="/teacher"
            className="group p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Teacher & Faculty Portal</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition transform group-hover:translate-x-1" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              View batch-level accuracy distributions, student performance matrices, and generate test assignments.
            </p>
          </Link>

          <Link
            href="/admin"
            className="group p-6 rounded-3xl bg-white border border-slate-200 hover:border-purple-500 shadow-xs hover:shadow-md transition space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Admin Management Console</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition transform group-hover:translate-x-1" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              OCR batch ingestion, question authoring with LaTeX preview, and automated test publishing.
            </p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-8 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
              EX
            </div>
            <div>
              <p className="font-bold text-slate-800">JEE & NEET AI Testing Platform</p>
              <p>© 2026 Production-Grade Assessment Engine</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-slate-900">Sign In</Link>
            <Link href="/signup" className="hover:text-slate-900">Create Account</Link>
            <Link href="/student" className="hover:text-slate-900">Student Hub</Link>
            <Link href="/teacher" className="hover:text-slate-900">Teacher Hub</Link>
            <Link href="/admin" className="hover:text-slate-900">Admin Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

