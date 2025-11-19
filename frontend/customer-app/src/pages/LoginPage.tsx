import { useState } from "react";
import type { FormEvent } from "react";

function LoginPage() {
  const [email, setEmail] = useState("user1@example.com");
  const [password, setPassword] = useState("password123");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Login submit", { email, password });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
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
        <button
          type="submit"
          className="w-full mt-2 py-2 text-sm font-medium rounded bg-blue-500 hover:bg-blue-600 transition"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-xs text-slate-400">
        (Next step: this will call <code>/auth/login</code> and store a JWT.)
      </p>
    </div>
  );
}

export default LoginPage;
