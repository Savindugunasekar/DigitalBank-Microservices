// frontend/admin-app/src/AdminShell.tsx
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "./auth";

function AdminShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col">
      {/* Sticky glass header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        {/* Top header */}
        <header className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-sky-400 flex items-center justify-center text-[10px] font-bold shadow-lg shadow-rose-500/40">
              ADM
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Digital Bank
              </div>
              <div className="text-[10px] text-slate-300/70">
                Admin &amp; Risk Control Center
              </div>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-xs font-medium">{user.fullName}</span>
                <span className="text-[10px] text-slate-300/80">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-[11px] px-3 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition shadow-sm"
              >
                Logout
              </button>
            </div>
          )}
        </header>

        {/* Top glass tabs */}
        <nav className="max-w-6xl mx-auto px-4 pb-3">
          <div className="flex w-full items-center rounded-full bg-white/5 border border-white/10 px-1 py-1 backdrop-blur-2xl shadow-lg shadow-slate-900/60">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                [
                  "flex-1 text-center px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-200/80 hover:bg-white/10",
                ].join(" ")
              }
            >
              Overview
            </NavLink>

            <NavLink
              to="/users"
              className={({ isActive }) =>
                [
                  "flex-1 text-center px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-200/80 hover:bg-white/10",
                ].join(" ")
              }
            >
              Users
            </NavLink>

            <NavLink
              to="/accounts"
              className={({ isActive }) =>
                [
                  "flex-1 text-center px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-200/80 hover:bg-white/10",
                ].join(" ")
              }
            >
              Accounts
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Page content wrapper */}
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.9)] p-4 sm:p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminShell;
