import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginRequest } from "../api";
import { useAuth } from "../auth";

function LoginPage() {
  const [email, setEmail] = useState("user1@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginRequest(email, password);
      login({ user: data.user, token: data.token });

      // If we were redirected here from some protected page, go back there
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      console.error("Login error", err);

      let msg = "Login failed. Please check your credentials.";

      // Try to read Axios-style error: err.response.data.message
      if (err && typeof err === "object") {
        const maybeAny = err as { response?: { data?: { message?: string } }; message?: string };

        if (maybeAny.response?.data?.message) {
          msg = maybeAny.response.data.message;
        } else if (typeof maybeAny.message === "string") {
          msg = maybeAny.message;
        }
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4 text-slate-100">
        Customer Login
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-300">Email</label>
          <input
            className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm outline-none focus:border-blue-400"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-300">Password</label>
          <input
            className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm outline-none focus:border-blue-400"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2 text-sm font-medium rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        Uses <code>POST /auth/login</code> from your auth-service on{" "}
        <code>http://localhost:4001</code>.
      </p>
    </div>
  );
}

export default LoginPage;
