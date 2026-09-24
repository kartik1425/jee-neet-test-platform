import Link from "next/link";
import { ShieldX, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <ShieldX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Access Denied (403)</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            You do not have the required role or authorization clearance to view this page.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-left space-y-1">
          <p><strong>Security Policy:</strong> Strict Role-Based Access Control</p>
          <p>If you believe this is an error, please contact your institutional administrator.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/student"
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
          >
            🎓 Student Portal
          </Link>
          <Link
            href="/login"
            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
