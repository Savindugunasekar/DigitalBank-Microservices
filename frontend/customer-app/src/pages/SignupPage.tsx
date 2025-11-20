import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api";

function SignupPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      await signup({ fullName: fullName.trim(), email: email.trim(), password });

      setSuccess("Account created successfully! You can now log in.");
      setFullName("");
      setEmail("");
      setPassword("");

      // small delay so the user sees the message
      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (err: any) {
      console.error("Signup failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create account.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-slate-100">
            Create your Digital Bank account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign up as a customer to view balances, make transfers and more.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-700 rounded p-2">
              {success}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Savindu Gunasekara"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-3 py-2 text-sm font-medium text-white"
          >
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-400 flex items-center justify-between">
          <span>Already have an account?</span>
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
