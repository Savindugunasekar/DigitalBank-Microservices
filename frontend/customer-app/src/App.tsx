import { Route, Routes, Navigate, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <div className="min-h-screen">
      <header className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
        <Link to="/" className="font-bold text-lg text-slate-100">
          Digital Bank
        </Link>
        <nav className="space-x-4 text-sm text-slate-200">
          <Link to="/login" className="hover:text-blue-400">
            Login
          </Link>
          <Link to="/dashboard" className="hover:text-blue-400">
            Dashboard
          </Link>
        </nav>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
