import { Route, Routes, Navigate, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RequireAuth from "./RequireAuth";
import { useAuth } from "./auth";

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
        <Link to="/" className="font-bold text-lg text-slate-100">
          Digital Bank
        </Link>
        <nav className="space-x-4 text-sm text-slate-200 flex items-center">
          {user ? (
            <>
              <span className="text-xs text-slate-400">
                {user.fullName} ({user.role})
              </span>
              <Link to="/dashboard" className="hover:text-blue-400">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="ml-2 px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-blue-400">
              Login
            </Link>
          )}
        </nav>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
