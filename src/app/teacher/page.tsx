import { requireRole } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { LogOut } from "lucide-react";
import { getTeacherDashboardDataAction } from "@/lib/teacher/actions";
import { TeacherAnalyticsDashboard } from "@/components/teacher/TeacherAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function TeacherPortalPage() {
  const session = await requireRole(["TEACHER", "ADMIN"]);
  const { profile, user } = session;

  const dashboardRes = await getTeacherDashboardDataAction();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
            TC
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Teacher Console</h1>
            <p className="text-xs text-slate-500">School Faculty & Class Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{profile.full_name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <TeacherAnalyticsDashboard
          initialClasses={dashboardRes.classes || []}
          initialSelectedClassId={dashboardRes.selectedClassId}
          initialBundle={dashboardRes.bundle}
          teacherName={profile.full_name}
          teacherRole={profile.role}
        />
      </main>
    </div>
  );
}
