import { Route, Routes, Navigate, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./RequireAuth";
import { useAuth } from "./auth";
import SignupPage from "./pages/SignupPage";
import CustomerShell from "./components/layout/CustomerShell";
import OverviewPage from "./pages/OverviewPage";
import AccountsPage from "./pages/AccountsPage";
import PaymentsPage from "./pages/PaymentsPage";
import ActivityPage from "./pages/ActivityPage";
import { KycFormPage } from "./pages/KycFormPage";


function App() {
  const { user} = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Simple header for public pages (no header inside CustomerShell) */}
      {!user && (
        <>
          <header className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
            <Link to="/" className="font-bold text-lg text-slate-100">
              Digital Bank
            </Link>
            <nav className="space-x-4 text-sm text-slate-200 flex items-center">
              <Link to="/login" className="hover:text-blue-400">
                Login
              </Link>
              <Link to="/signup" className="hover:text-blue-400 text-xs">
                Sign up
              </Link>
            </nav>
          </header>
        </>
      )}

      <main className={user ? "" : "p-6 max-w-3xl mx-auto"}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kyc" element={<KycFormPage />} />

          {/* Authenticated app shell */}
          <Route
            path="/dashboard/*"
            element={
              <RequireAuth>
                <CustomerShell />
              </RequireAuth>
            }
          >
            {/* index = /dashboard → Overview */}
            <Route index element={<OverviewPage />} />
            {/* other sections (we’ll create these pages next) */}
            <Route path="accounts" element={<AccountsPage/>} />
            <Route path="payments" element={<PaymentsPage/>} />
            <Route path="activity" element={<ActivityPage/>} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
